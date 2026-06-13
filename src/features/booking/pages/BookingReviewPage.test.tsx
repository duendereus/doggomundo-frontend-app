import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { BookingReviewPage } from "./BookingReviewPage";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { server } from "@/test/msw-server";
import { makeTestQueryClient } from "@/test/test-utils";
import { makePetListItem } from "@/test/fixtures";

const API = "http://localhost/api";

function seedFlow() {
  useBookingFlowStore.setState({
    businessUnitCode: "GROOMING",
    location: {
      id: "loc-1",
      name: "Sucursal Polanco",
      address: "Av. Polanco 1",
      businessUnitId: "bu-1",
      businessUnitName: "Grooming Polanco",
    },
    service: {
      id: "srv-1",
      name: "Corte completo",
      price: "450.00",
      durationMinutes: 60,
      requiresPet: true,
    },
    slot: {
      slotId: "slot-1",
      start: "2030-01-15T16:00:00Z",
      end: "2030-01-15T17:00:00Z",
      resource: "res-1",
    },
    pet: { id: "pet-1", name: "Nala" },
    notes: "",
  });
}

function renderReview(queryClient: QueryClient = makeTestQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/book/review"]}>
        <Routes>
          <Route path="/book/review" element={<BookingReviewPage />} />
          <Route
            path="/my/appointments"
            element={<div data-testid="appointments-page">Mis citas</div>}
          />
          <Route
            path="/book/business-unit"
            element={<div data-testid="bu-page">BU</div>}
          />
          <Route
            path="/book/location"
            element={<div data-testid="location-page">Location picker</div>}
          />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BookingReviewPage", () => {
  it("posts the nested payload and navigates to /my/appointments on success", async () => {
    seedFlow();
    let capturedPayload: unknown = null;
    server.use(
      http.post(`${API}/appointments/`, async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    // After success, the page swaps to the success animation which auto-navigates
    // a few seconds later. Assert the success UI first — it's the immediate
    // post-mutation contract of this component.
    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();

    expect(capturedPayload).toMatchObject({
      business_unit: "bu-1",
      pet: "pet-1",
      scheduled_start: "2030-01-15T16:00:00Z",
      scheduled_end: "2030-01-15T17:00:00Z",
      channel: "web",
      items: [{ service: "srv-1", resource: "res-1" }],
    });

    // Critical: NOT back at the BU picker thanks to the success branch.
    expect(screen.queryByTestId("bu-page")).not.toBeInTheDocument();
  });

  it("shows the backend error message when create returns 400", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            detail: "El recurso ya no tiene disponibilidad.",
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    expect(
      await screen.findByText(/ya no tiene disponibilidad/i),
    ).toBeInTheDocument();
    // Did NOT navigate away
    expect(screen.queryByTestId("appointments-page")).not.toBeInTheDocument();
  });

  it("redirects to the earliest missing step when the store is incomplete", () => {
    useBookingFlowStore.getState().reset();
    renderReview();
    // First guard in the page sends us to /book/location when state.location is null
    expect(screen.getByTestId("location-page")).toBeInTheDocument();
  });

  it("offers a follow-up slot for the user's other pet after a successful booking", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        ),
      ),
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            makePetListItem({ id: "pet-1", name: "Nala" }),
            makePetListItem({ id: "pet-2", name: "Max" }),
          ],
        }),
      ),
      http.get(`${API}/appointments/slots/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: "slot-2",
              business_unit: "bu-1",
              service: "srv-1",
              service_name: "Corte completo",
              staff_user: null,
              resource: "res-1",
              start: "2030-01-15T17:00:00Z",
              end: "2030-01-15T18:00:00Z",
              is_available: true,
            },
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /confirmar reserva/i }),
    );

    // Wait for the success branch + the follow-up suggestion card.
    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();
    const suggestionButton = await screen.findByRole("button", {
      name: /corte completo para max/i,
    });
    expect(suggestionButton).toBeInTheDocument();

    // Picking the suggestion should leave us on /book/review (same route)
    // with the pet swapped to Max in the wizard store, not auto-navigate
    // to /my/appointments.
    await user.click(suggestionButton);
    await waitFor(() => {
      expect(useBookingFlowStore.getState().pet?.id).toBe("pet-2");
    });
    expect(useBookingFlowStore.getState().slot?.slotId).toBe("slot-2");
    expect(screen.queryByTestId("appointments-page")).not.toBeInTheDocument();
  });

  it("clears the wizard store on success so the nav doesn't fast-forward to a stale review", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        ),
      ),
      // Single pet — no follow-up suggestions, so the chain doesn't keep
      // the store hydrated for that path.
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [makePetListItem({ id: "pet-1", name: "Nala" })],
        }),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /confirmar reserva/i }),
    );

    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();

    // After capturing the snapshot on success, the wizard store should be
    // empty — otherwise tapping "Reservar" in the nav while still on this
    // screen would land the user on a stale review for what they just
    // confirmed.
    await waitFor(() => {
      expect(useBookingFlowStore.getState().pet).toBeNull();
    });
    expect(useBookingFlowStore.getState().location).toBeNull();
    expect(useBookingFlowStore.getState().service).toBeNull();
    expect(useBookingFlowStore.getState().slot).toBeNull();
  });
});
