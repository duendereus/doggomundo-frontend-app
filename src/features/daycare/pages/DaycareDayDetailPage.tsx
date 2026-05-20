import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  Camera,
  Clock,
  MapPin,
  PawPrint,
  Sparkles,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { LoadingState } from "@/components/shared/LoadingState";
import { BackLink } from "@/features/pets/components/BackLink";
import { DayStatusBadge } from "@/features/daycare/components/DayStatusBadge";
import { CancelDayDialog } from "@/features/daycare/components/CancelDayDialog";
import { useDay } from "@/api/hooks/use-daycare";
import { formatTime, toLocalDateISO } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { DayIncident, IncidentSeverity } from "@/types/daycare";

export function DaycareDayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: day, isLoading, isError } = useDay(id ?? "");
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!id) return <Navigate to="/daycare/days" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare/days" label="Mis días" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !day) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare/days" label="Mis días" />
        <EmptyState
          title="No pudimos cargar este día"
          description="Puede que el enlace no sea válido."
        />
      </div>
    );
  }

  const todayISO = toLocalDateISO(new Date());
  const isFuture = day.date > todayISO;

  return (
    <div className="space-y-4">
      <BackLink to="/daycare/days" label="Mis días" />

      {/* Hero */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="flex items-center gap-2 text-xl font-semibold capitalize">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {format(parseISO(day.date), "EEEE d 'de' MMMM", { locale: es })}
              </h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {day.location_name}
                <PawPrint className="ml-1 h-3.5 w-3.5" />
                {day.pet_name}
              </p>
            </div>
            <DayStatusBadge status={day.status} label={day.status_display} />
          </div>

          <hr className="border-border" />

          <DropOffPickUpRow
            label="Drop-off"
            expected={day.expected_drop_off}
            actual={day.actual_drop_off}
          />
          <DropOffPickUpRow
            label="Pick-up"
            expected={day.expected_pick_up}
            actual={day.actual_pick_up}
          />

          {Number(day.late_pickup_fee) > 0 && (
            <p className="text-xs text-destructive">
              Cargo por pick-up tardío: ${day.late_pickup_fee}
            </p>
          )}

          {day.cancelled_at && day.cancelled_reason && (
            <p className="text-xs text-muted-foreground">
              Motivo de cancelación: {day.cancelled_reason}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            Fotos del día
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {day.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isFuture
                ? "Pronto vendrán las fotos y novedades."
                : "El staff no subió fotos en este día."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {day.photos.map((photo) => (
                <li key={photo.id}>
                  <figure className="space-y-1">
                    <div className="aspect-square overflow-hidden rounded-md bg-muted">
                      <ImageWithFallback
                        src={photo.image}
                        alt={photo.caption || "Foto del día"}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full"
                        fallback={
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        }
                      />
                    </div>
                    {photo.caption && (
                      <figcaption className="line-clamp-2 text-xs text-muted-foreground">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Incidents — only render section if there are any */}
      {day.incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {day.incidents.map((inc) => (
              <IncidentRow key={inc.id} incident={inc} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Day notes (from staff) */}
      {day.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Notas del staff
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-line">
            {day.notes}
          </CardContent>
        </Card>
      )}

      {/* Cancel — only while the day is still scheduled */}
      {day.status === "scheduled" && (
        <>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle />
            Cancelar reserva
          </Button>
          <CancelDayDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            dayId={day.id}
            dayDate={day.date}
            expectedDropOff={day.expected_drop_off}
            onSuccess={() => navigate("/daycare/days", { replace: true })}
          />
        </>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

interface DropOffPickUpRowProps {
  label: string;
  expected: string | null;
  actual: string | null;
}

function DropOffPickUpRow({ label, expected, actual }: DropOffPickUpRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">
        {actual ? formatTime(actual) : formatTimeOfDay(expected) ?? "—"}
      </span>
      {actual && expected && (
        <span className="text-xs text-muted-foreground">
          (esperado {formatTimeOfDay(expected)})
        </span>
      )}
    </div>
  );
}

/** Format an "HH:MM:SS" backend time string as "HH:MM". */
function formatTimeOfDay(t: string | null): string | null {
  if (!t) return null;
  return t.slice(0, 5);
}

// Incidents

const SEVERITY_VARIANT: Record<IncidentSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/15 text-accent-foreground",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

interface IncidentRowProps {
  incident: DayIncident;
}

function IncidentRow({ incident }: IncidentRowProps) {
  return (
    <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{incident.incident_type_display}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
            SEVERITY_VARIANT[incident.severity],
          )}
        >
          {incident.severity_display}
        </span>
      </div>
      <p className="text-sm">{incident.description}</p>
      {incident.action_taken && (
        <p className="text-xs text-muted-foreground">
          Acción: {incident.action_taken}
        </p>
      )}
    </div>
  );
}
