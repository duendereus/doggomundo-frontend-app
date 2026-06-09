import type { BusinessUnitCode } from "./business-unit";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show"
  // Penalty-cancellation flow. `penalty_cancel` is set by the customer
  // confirming a late cancel; the two no-show variants are admin-only.
  | "penalty_cancel"
  | "penalty_no_show"
  | "graced_no_show";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  checked_in: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
  penalty_cancel: "Cancelada con cargo",
  penalty_no_show: "No asistió (con cargo)",
  graced_no_show: "No asistió (sin cargo)",
};

export type AppointmentChannel = "walkin" | "phone" | "whatsapp" | "web";

export type AppointmentItemStatus = "planned" | "done" | "skipped";

export interface AppointmentItem {
  id: string;
  service: string;
  service_name: string;
  duration_minutes_snapshot: number | null;
  price_snapshot: string | null;
  status: AppointmentItemStatus;
  line_notes: string;
}

export interface AppointmentListItem {
  id: string;
  business_unit: string;
  business_unit_name: string;
  pet: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: AppointmentStatus;
  status_display: string;
  channel: AppointmentChannel;
  created_at: string;
}

export interface Appointment extends AppointmentListItem {
  notes: string;
  items: AppointmentItem[];
  updated_at: string;
}

export interface AppointmentListParams {
  page?: number;
  status?: AppointmentStatus;
}

export interface CreateAppointmentItemPayload {
  service: string;
  resource?: string | null;
}

export interface CreateAppointmentPayload {
  business_unit: string;
  pet: string | null;
  scheduled_start: string;
  scheduled_end: string;
  channel: AppointmentChannel;
  notes?: string;
  items: CreateAppointmentItemPayload[];
}

export interface RescheduleAppointmentPayload {
  scheduled_start?: string;
  scheduled_end?: string;
  notes?: string;
}

export interface AvailableSlot {
  id: string;
  business_unit: string;
  service: string | null;
  service_name: string | null;
  staff_user: string | null;
  resource: string | null;
  start: string;
  end: string;
  is_available: boolean;
}

export interface AvailableSlotsParams {
  business_unit?: string;
  service?: string;
  staff_user?: string;
  resource?: string;
  start_after?: string;
  start_before?: string;
}

export type { BusinessUnitCode };
