import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Appointment,
  AppointmentListItem,
  AppointmentListParams,
  AvailableSlot,
  AvailableSlotsParams,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
} from "@/types/appointment";

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  slots: (params: Record<string, unknown>) =>
    [...appointmentKeys.all, "slots", params] as const,
};

export function useMyAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<AppointmentListItem>>("/appointments/", {
          params,
        })
        .then((r) => r.data),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () =>
      api.get<Appointment>(`/appointments/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAvailableSlots(
  params: AvailableSlotsParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: appointmentKeys.slots((params ?? {}) as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<AvailableSlot>>("/appointments/slots/", {
          params: params ?? undefined,
        })
        .then((r) => r.data),
    enabled: enabled && !!params,
    staleTime: 30 * 1000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentPayload) =>
      api.post<Appointment>("/appointments/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useUpdateMyAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RescheduleAppointmentPayload) =>
      api
        .patch<Appointment>(`/appointments/${id}/update/`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

interface CancelAppointmentVariables {
  /**
   * Required to be `true` when the appointment is inside the late-cancel
   * window — the backend rejects late cancels without explicit
   * acknowledgement so a stray double-click can't trigger a penalty.
   */
  acknowledgePenalty?: boolean;
}

export function useCancelMyAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ acknowledgePenalty }: CancelAppointmentVariables = {}) =>
      api
        .post(
          `/appointments/${id}/cancel/`,
          acknowledgePenalty ? { acknowledge_penalty: true } : {},
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
