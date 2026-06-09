import { cn } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABEL,
  type AppointmentStatus,
} from "@/types/appointment";

const VARIANT: Record<AppointmentStatus, string> = {
  scheduled: "bg-accent/15 text-accent-foreground",
  checked_in: "bg-primary/15 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-destructive/10 text-destructive",
  penalty_cancel: "bg-destructive/10 text-destructive",
  penalty_no_show: "bg-destructive/10 text-destructive",
  graced_no_show: "bg-muted text-muted-foreground",
};

interface Props {
  status: AppointmentStatus;
  className?: string;
}

export function AppointmentStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        VARIANT[status],
        className,
      )}
    >
      {APPOINTMENT_STATUS_LABEL[status]}
    </span>
  );
}
