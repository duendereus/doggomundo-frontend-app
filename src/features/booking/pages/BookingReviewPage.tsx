import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  PawPrint,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrors } from "@/components/shared/FormErrors";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import {
  FollowUpSuggestions,
  type FollowUpSuggestion,
} from "@/features/booking/components/FollowUpSuggestions";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import type {
  BookingLocationSnapshot,
  BookingServiceSnapshot,
  BookingSlotSnapshot,
  BookingPetSnapshot,
} from "@/stores/booking-flow-store";
import {
  useAvailableSlots,
  useCreateAppointment,
} from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import { formatLongDate, formatTime } from "@/lib/format-date";
import type { BusinessUnitCode } from "@/types/business-unit";

// Search window around the just-booked slot for follow-up suggestions.
// Looking before the booking too matters: with sparse slot grids the next
// available slot AFTER could be hours away while the slot right BEFORE is
// just 30 min off — much more useful for chaining a multi-pet visit.
const FOLLOWUP_WINDOW_BEFORE_HOURS = 4;
const FOLLOWUP_WINDOW_AFTER_HOURS = 8;

interface BookingSnapshot {
  businessUnitCode: BusinessUnitCode | null;
  location: BookingLocationSnapshot;
  service: BookingServiceSnapshot;
  slot: BookingSlotSnapshot;
  pet: BookingPetSnapshot;
}

function extractApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "No pudimos crear la cita. Intenta de nuevo.";
  }
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, string[] | string | undefined>;
    // Prefer known "summary" keys first
    for (const key of ["detail", "non_field_errors", "error"]) {
      const val = record[key];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
    const firstKey = Object.keys(record)[0];
    if (firstKey) {
      const val = record[firstKey];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return "No pudimos crear la cita. Intenta de nuevo.";
}

export function BookingReviewPage() {
  const navigate = useNavigate();
  const state = useBookingFlowStore();
  const reset = useBookingFlowStore((s) => s.reset);
  const setNotes = useBookingFlowStore((s) => s.setNotes);
  const create = useCreateAppointment();

  const [error, setError] = useState<string | null>(null);
  // Snapshot of the just-booked appointment. Captured the first time the
  // success branch fires so we can clear the wizard store immediately —
  // otherwise tapping the "Reservar" tab from the nav while on the success
  // screen would cascade through BookingLandingPage and dump the user on a
  // stale review for the appointment they JUST confirmed.
  const [snapshot, setSnapshot] = useState<BookingSnapshot | null>(null);
  // Pets the user has booked in this success-screen chain. Without tracking
  // this, the second iteration would happily suggest the first-iteration's
  // pet again — same pet booked twice in a row makes no sense.
  const [bookedInSession, setBookedInSession] = useState<Set<string>>(
    () => new Set(),
  );

  const { data: petsData } = usePets();

  // Other active pets the customer owns minus any they've already booked
  // in this success-screen chain (the just-booked one plus prior picks).
  const otherPets = useMemo(() => {
    if (!petsData || !snapshot) return [];
    return petsData.results.filter(
      (p) =>
        p.is_active &&
        p.id !== snapshot.pet.id &&
        !bookedInSession.has(p.id),
    );
  }, [petsData, snapshot, bookedInSession]);

  // Query a window AROUND the just-booked slot — before and after — so we
  // can surface a slot 30 min earlier when that's closer than the next free
  // slot 2h later. The backend's `is_available` flag already excludes the
  // just-booked one (it's taken now), so it can't appear in suggestions.
  const justBookedStart = snapshot?.slot.start ?? null;
  const justBookedEnd = snapshot?.slot.end ?? null;
  const startAfter = useMemo(() => {
    if (!justBookedStart) return null;
    const t = new Date(justBookedStart).getTime();
    return new Date(
      t - FOLLOWUP_WINDOW_BEFORE_HOURS * 60 * 60 * 1000,
    ).toISOString();
  }, [justBookedStart]);
  const startBefore = useMemo(() => {
    if (!justBookedEnd) return null;
    const t = new Date(justBookedEnd).getTime();
    return new Date(
      t + FOLLOWUP_WINDOW_AFTER_HOURS * 60 * 60 * 1000,
    ).toISOString();
  }, [justBookedEnd]);
  const followUpEnabled =
    !!snapshot &&
    otherPets.length > 0 &&
    !!startAfter &&
    !!startBefore;
  const { data: nextSlotsData, isLoading: slotsLoading } = useAvailableSlots(
    followUpEnabled
      ? {
          business_unit: snapshot!.location.businessUnitId,
          service: snapshot!.service.id,
          start_after: startAfter!,
          start_before: startBefore!,
        }
      : null,
    followUpEnabled,
  );

  // Pair each remaining pet with a distinct slot. Sort by closeness to the
  // just-booked time so "13:30" beats "16:00" when the booked slot is
  // 14:00. Ties (equidistant before vs after) prefer AFTER — the more
  // natural "while you're already here" flow.
  const suggestions: FollowUpSuggestion[] = useMemo(() => {
    if (!followUpEnabled || !nextSlotsData || !justBookedStart) return [];
    const bookedT = new Date(justBookedStart).getTime();
    const available = nextSlotsData.results
      .filter((s) => s.is_available)
      .sort((a, b) => {
        const aT = new Date(a.start).getTime();
        const bT = new Date(b.start).getTime();
        const aDist = Math.abs(aT - bookedT);
        const bDist = Math.abs(bT - bookedT);
        if (aDist !== bDist) return aDist - bDist;
        // Tie: prefer the later slot (after the booking).
        return bT - aT;
      });
    return otherPets
      .slice(0, available.length)
      .map((pet, i) => ({ pet, slot: available[i] }));
  }, [followUpEnabled, nextSlotsData, otherPets, justBookedStart]);

  // No follow-up to show → keep the legacy "auto-navigate after a beat"
  // so the user isn't stuck. Hold off until snapshot is captured AND the
  // slot query (if any) has resolved — otherwise we'd race the suggestions
  // and navigate away before they had a chance to render.
  const hasFollowUp = suggestions.length > 0;
  const suggestionsReady =
    !!snapshot && (!followUpEnabled || !slotsLoading);
  useEffect(() => {
    if (!create.isSuccess) return;
    if (!suggestionsReady) return;
    if (hasFollowUp) return;
    const t = setTimeout(() => {
      navigate("/my/appointments", { replace: true });
    }, 2800);
    return () => clearTimeout(t);
  }, [create.isSuccess, suggestionsReady, hasFollowUp, navigate]);

  if (create.isSuccess && snapshot) {
    return (
      <SuccessScreen
        suggestions={suggestions}
        serviceName={snapshot.service.name}
        servicePriceLabel={formatPriceLabel(snapshot.service.price)}
        onPickSuggestion={(s) => {
          // Re-seed the wizard atomically with the snapshot's BU/location/
          // service plus the new pet+slot pair. setState (rather than the
          // individual setBusinessUnit/setLocation/setService actions)
          // avoids those actions' "wipe everything downstream" semantics.
          useBookingFlowStore.setState({
            businessUnitCode: snapshot.businessUnitCode,
            location: snapshot.location,
            service: snapshot.service,
            slot: {
              slotId: s.slot.id,
              start: s.slot.start,
              end: s.slot.end,
              resource: s.slot.resource,
            },
            pet: { id: s.pet.id, name: s.pet.name },
            notes: "",
          });
          create.reset();
          setSnapshot(null);
          setError(null);
        }}
        onDone={() => navigate("/my/appointments", { replace: true })}
      />
    );
  }

  if (!state.location) return <Navigate to="/book/location" replace />;
  if (!state.service) return <Navigate to="/book/service" replace />;
  if (!state.slot) return <Navigate to="/book/slot" replace />;
  if (!state.pet) return <Navigate to="/book/pet" replace />;

  const price = Number(state.service.price);
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("es-MX")}`
      : null;

  async function handleConfirm() {
    if (!state.service || !state.location || !state.slot || !state.pet) return;

    // Capture the values we'll need on the success screen BEFORE the
    // mutation runs — `reset()` after the await wipes the store and the
    // closure values are what we hand to the snapshot.
    const justBooked: BookingSnapshot = {
      businessUnitCode: state.businessUnitCode,
      location: state.location,
      service: state.service,
      slot: state.slot,
      pet: state.pet,
    };

    setError(null);
    try {
      await create.mutateAsync({
        business_unit: state.location.businessUnitId,
        pet: state.pet.id,
        scheduled_start: state.slot.start,
        scheduled_end: state.slot.end,
        channel: "web",
        notes: state.notes || undefined,
        items: [
          {
            service: state.service.id,
            resource: state.slot.resource ?? undefined,
          },
        ],
      });
      // Event-driven (vs. derived in an effect): record the snapshot,
      // add the pet to the booked-in-session set, and clear the wizard
      // store so the nav doesn't fast-forward into a stale review on
      // its next visit.
      setSnapshot(justBooked);
      setBookedInSession((prev) => {
        if (prev.has(justBooked.pet.id)) return prev;
        const next = new Set(prev);
        next.add(justBooked.pet.id);
        return next;
      });
      reset();
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="review"
        backTo="/book/pet"
        title="Revisa tu reserva"
        description="Confirma que todo esté bien antes de agendar."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.service.name}</p>
              <p className="text-xs text-muted-foreground">
                {state.service.durationMinutes} min
                {priceLabel && ` · ${priceLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize">
                {formatLongDate(state.slot.start)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(state.slot.start)} – {formatTime(state.slot.end)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.location.name}</p>
              <p className="text-xs text-muted-foreground">
                {state.location.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.pet.name}</p>
              {state.businessUnitCode === "FOTO" && (
                <p className="text-xs text-muted-foreground">
                  Si vienen más perritos, este es el principal — los demás
                  pueden acompañar.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Label htmlFor="notes" className="sr-only">
            Notas
          </Label>
          <Textarea
            id="notes"
            placeholder="¿Algo que el equipo deba saber? (opcional)"
            rows={3}
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </CardContent>
      </Card>

      <FormErrors message={error ?? undefined} />

      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={create.isPending}
      >
        {create.isPending ? "Agendando…" : "Confirmar reserva"}
      </Button>
    </div>
  );
}

function formatPriceLabel(price: string | undefined): string | null {
  if (!price) return null;
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("es-MX")}` : null;
}

interface SuccessScreenProps {
  suggestions: FollowUpSuggestion[];
  serviceName: string;
  servicePriceLabel: string | null;
  onPickSuggestion: (s: FollowUpSuggestion) => void;
  onDone: () => void;
}

function SuccessScreen({
  suggestions,
  serviceName,
  servicePriceLabel,
  onPickSuggestion,
  onDone,
}: SuccessScreenProps) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-8"
      role="status"
      aria-live="polite"
    >
      <SuccessCheckmark />

      <div className="text-center">
        <h2 className="text-2xl font-semibold">¡Listo!</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Tu cita quedó agendada. Te esperamos.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="w-full max-w-sm">
          <FollowUpSuggestions
            suggestions={suggestions}
            serviceName={serviceName}
            servicePriceLabel={servicePriceLabel}
            onPick={onPickSuggestion}
          />
        </div>
      )}

      <Button variant={suggestions.length > 0 ? "outline" : "default"} onClick={onDone}>
        Ver mis citas
      </Button>
    </div>
  );
}
