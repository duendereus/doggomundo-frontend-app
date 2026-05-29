import type { ReactNode } from "react";
import { Sun, CloudSun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, getLocalHour } from "@/lib/format-date";
import type { AvailableSlot } from "@/types/appointment";

interface Props {
  slots: AvailableSlot[];
  selectedStart: string | null;
  onSelect: (slot: AvailableSlot) => void;
}

interface Period {
  key: string;
  label: string;
  icon: ReactNode;
  /** Themed colors for the period header chip. */
  chip: string;
  match: (hour: number) => boolean;
}

const PERIODS: Period[] = [
  {
    key: "morning",
    label: "Mañana",
    icon: <Sun className="h-4 w-4" />,
    chip: "bg-amber-100 text-amber-600",
    match: (h) => h < 12,
  },
  {
    key: "afternoon",
    label: "Tarde",
    icon: <CloudSun className="h-4 w-4" />,
    chip: "bg-sky-100 text-sky-600",
    match: (h) => h >= 12 && h < 18,
  },
  {
    key: "evening",
    label: "Noche",
    icon: <Moon className="h-4 w-4" />,
    chip: "bg-indigo-100 text-indigo-600",
    match: (h) => h >= 18,
  },
];

function durationMin(slot: AvailableSlot): number {
  const ms = new Date(slot.end).getTime() - new Date(slot.start).getTime();
  return Math.round(ms / 60_000);
}

export function SlotGrid({ slots, selectedStart, onSelect }: Props) {
  const groups = PERIODS.map((period) => ({
    period,
    items: slots.filter((s) => period.match(getLocalHour(s.start))),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map(({ period, items }) => (
        <section key={period.key} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                period.chip,
              )}
            >
              {period.icon}
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              {period.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {items.length} horarios
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {items.map((slot) => {
              const disabled = !slot.is_available;
              const active = slot.start === selectedStart;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => !disabled && onSelect(slot)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl border px-2 py-3.5 outline-none transition-all duration-200",
                    "focus-visible:ring-3 focus-visible:ring-accent/50",
                    active
                      ? "border-transparent bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-accent/30 scale-[1.04]"
                      : "border-accent/15 bg-surface-soft text-foreground hover:-translate-y-1 hover:border-accent hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/20 active:scale-95",
                    disabled &&
                      "pointer-events-none opacity-40 hover:translate-y-0 hover:border-accent/15 hover:bg-surface-soft hover:shadow-none",
                  )}
                >
                  {/* Decorative top accent bar on hover/active. */}
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 transition-opacity",
                      active
                        ? "bg-white/40 opacity-100"
                        : "bg-accent opacity-0 group-hover:opacity-100",
                    )}
                  />
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-lg font-bold leading-none tabular-nums">
                    {formatTime(slot.start)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {durationMin(slot)} min
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
