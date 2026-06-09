import type { AppointmentListItem, AppointmentStatus } from "@/types/appointment";

const TERMINAL: AppointmentStatus[] = [
  "completed",
  "cancelled",
  "no_show",
  "penalty_cancel",
  "penalty_no_show",
  "graced_no_show",
];

export function isTerminal(status: AppointmentStatus): boolean {
  return TERMINAL.includes(status);
}

export function partitionAppointments(items: AppointmentListItem[]): {
  upcoming: AppointmentListItem[];
  past: AppointmentListItem[];
} {
  const now = Date.now();
  const upcoming: AppointmentListItem[] = [];
  const past: AppointmentListItem[] = [];

  items.forEach((a) => {
    const isFuture = new Date(a.scheduled_start).getTime() > now;
    if (!isTerminal(a.status) && isFuture) upcoming.push(a);
    else past.push(a);
  });

  upcoming.sort(
    (a, b) =>
      new Date(a.scheduled_start).getTime() -
      new Date(b.scheduled_start).getTime(),
  );
  past.sort(
    (a, b) =>
      new Date(b.scheduled_start).getTime() -
      new Date(a.scheduled_start).getTime(),
  );

  return { upcoming, past };
}

export function findNextUpcoming(
  items: AppointmentListItem[],
): AppointmentListItem | null {
  return partitionAppointments(items).upcoming[0] ?? null;
}
