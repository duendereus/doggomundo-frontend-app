import { useState } from "react";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelDay } from "@/api/hooks/use-daycare";
import { extractDaycareError } from "@/features/daycare/lib/extract-error";
import { TIMEZONE } from "@/lib/format-date";
import { cn } from "@/lib/utils";

const REFUND_THRESHOLD_HOURS = 12;
const DEFAULT_DROP_OFF = "09:00:00";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
  /** YYYY-MM-DD */
  dayDate: string;
  /** "HH:MM:SS" or null. */
  expectedDropOff: string | null;
  onSuccess?: () => void;
}

export function CancelDayDialog({
  open,
  onOpenChange,
  dayId,
  dayDate,
  expectedDropOff,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState("");
  const cancel = useCancelDay(dayId);

  const willRefund = computeWillRefund(dayDate, expectedDropOff);

  async function handleConfirm() {
    try {
      await cancel.mutateAsync(reason.trim() ? { reason: reason.trim() } : {});
      toast.success(
        willRefund
          ? "Cancelado. Tu crédito fue reembolsado."
          : "Cancelado. Sin reembolso por la regla de 12 h.",
      );
      onOpenChange(false);
      setReason("");
      onSuccess?.();
    } catch (err) {
      toast.error(extractDaycareError(err, "No pudimos cancelar este día."));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar este día</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-sm",
            willRefund
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 bg-destructive/5",
          )}
        >
          {willRefund ? (
            <>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">
                  Se te reembolsará 1 crédito
                </p>
                <p className="text-xs text-muted-foreground">
                  Cancelas con al menos {REFUND_THRESHOLD_HOURS} h de
                  anticipación.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Sin reembolso</p>
                <p className="text-xs text-muted-foreground">
                  Estás cancelando con menos de {REFUND_THRESHOLD_HOURS} h de
                  anticipación; el crédito no se devuelve.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Cuéntanos por qué cancelas — nos ayuda a mejorar."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            disabled={cancel.isPending}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancel.isPending}
          >
            Mantener reserva
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Cancelando…" : "Sí, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Replica the backend rule client-side as a UX preview.
 *
 * The backend compares `now()` in Mexico_City against the day's
 * `expected_drop_off` (default 09:00 when not specified). If the difference
 * is ≥ 12 hours, the credit is refunded.
 *
 * The backend is the source of truth — this is only a hint so the user knows
 * what to expect before confirming. A ±1-2 minute drift is fine; the response
 * triggers a refetch and the real balance updates regardless.
 */
function computeWillRefund(
  dayDate: string,
  expectedDropOff: string | null,
): boolean {
  const hms = expectedDropOff ?? DEFAULT_DROP_OFF;
  const dropoffUtc = fromZonedTime(`${dayDate}T${hms}`, TIMEZONE);
  const diffMs = dropoffUtc.getTime() - Date.now();
  const diffHours = diffMs / 3_600_000;
  return diffHours >= REFUND_THRESHOLD_HOURS;
}
