import type { Pet, PetListItem } from "@/types/pet";
import type { Appointment, AppointmentListItem } from "@/types/appointment";
import type { OrderListItem } from "@/types/order";
import type { MembershipPlan } from "@/types/membership";

const DALMATA = { id: "breed-dalmata", name: "Dálmata", slug: "dalmata" };

export function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "pet-1",
    name: "Nala",
    species: "DOG",
    breed: DALMATA,
    birth_date: "2020-06-14",
    gender: "FEMALE",
    food_type: null,
    food_brand: null,
    size: null,
    weight: null,
    microchip_id: null,
    photo: null,
    health_notes: "",
    allergies: "",
    age_years: 5,
    onboarding_status: "BASIC",
    onboarding_completion_percentage: 70,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makePetListItem(
  overrides: Partial<PetListItem> = {},
): PetListItem {
  return {
    id: "pet-1",
    name: "Nala",
    species: "DOG",
    breed: DALMATA,
    gender: "FEMALE",
    age_years: 5,
    onboarding_status: "BASIC",
    onboarding_completion_percentage: 70,
    photo: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeAppointmentListItem(
  overrides: Partial<AppointmentListItem> = {},
): AppointmentListItem {
  return {
    id: "appt-1",
    business_unit: "bu-1",
    business_unit_name: "Grooming Polanco",
    pet: "pet-1",
    scheduled_start: "2030-01-15T16:00:00Z",
    scheduled_end: "2030-01-15T17:00:00Z",
    status: "scheduled",
    status_display: "Programada",
    channel: "web",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeAppointment(
  overrides: Partial<Appointment> = {},
): Appointment {
  return {
    ...makeAppointmentListItem(),
    notes: "",
    items: [
      {
        id: "item-1",
        service: "srv-1",
        service_name: "Corte completo",
        duration_minutes_snapshot: 60,
        price_snapshot: "450.00",
        status: "planned",
        line_notes: "",
      },
    ],
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeOrderListItem(
  overrides: Partial<OrderListItem> = {},
): OrderListItem {
  return {
    id: "order-1",
    appointment: "appt-1",
    pet: "pet-1",
    status: "paid",
    status_display: "Pagada",
    currency: "MXN",
    total: "450.00",
    paid_at: "2026-01-05T16:30:00Z",
    created_at: "2026-01-05T16:00:00Z",
    ...overrides,
  };
}

export function makePlan(
  overrides: Partial<MembershipPlan> = {},
): MembershipPlan {
  return {
    id: "plan-1",
    name: "Premium Mensual",
    description: "Baños y grooming ilimitados",
    price_monthly: "599.00",
    billing_interval: "monthly",
    billing_interval_display: "Mensual",
    terms: "",
    entitlements: [
      {
        service: "srv-1",
        service_name: "Baño básico",
        quantity_per_cycle: 4,
      },
    ],
    ...overrides,
  };
}
