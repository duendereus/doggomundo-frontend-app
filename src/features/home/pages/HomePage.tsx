import { useMemo } from "react";
import { CalendarPlus, Crown, PawPrint, ShoppingBag, Sun } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { OnboardingBanner } from "@/features/pets/components/OnboardingBanner";
import { NextAppointmentHero } from "@/features/home/components/NextAppointmentHero";
import { QuickActionTile } from "@/features/home/components/QuickActionTile";
import { findNextUpcoming } from "@/features/appointments/lib/filter";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { TIMEZONE } from "@/lib/format-date";
import { SHOP_ENABLED } from "@/lib/features";
import { usePets } from "@/api/hooks/use-pets";
import { useMyAppointments } from "@/api/hooks/use-appointments";
import { useAuthStore } from "@/stores/auth-store";

const ALL_QUICK_ACTIONS = [
  {
    id: "book",
    to: "/book",
    label: "Reservar",
    description: "Agenda un servicio",
    icon: CalendarPlus,
  },
  {
    id: "daycare",
    to: "/daycare",
    label: "Day Care",
    description: "Día completo de cuidados",
    icon: Sun,
  },
  {
    id: "pets",
    to: "/pets",
    label: "Mis mascotas",
    description: "Gestiona sus perfiles",
    icon: PawPrint,
  },
  {
    id: "memberships",
    to: "/memberships",
    label: "Membresías",
    description: "Ahorra con un plan",
    icon: Crown,
  },
  {
    id: "shop",
    to: "/shop",
    label: "Tienda",
    description: "Productos curados",
    icon: ShoppingBag,
  },
];

const QUICK_ACTIONS = ALL_QUICK_ACTIONS.filter(
  (a) => SHOP_ENABLED || a.id !== "shop",
);

function greetingForHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: pets } = usePets();
  const { data: appointments } = useMyAppointments();

  const greeting = useMemo(() => {
    const mxHour = toZonedTime(new Date(), TIMEZONE).getHours();
    return greetingForHour(mxHour);
  }, []);

  const nextAppointment = useMemo(
    () => findNextUpcoming(appointments?.results ?? []),
    [appointments],
  );

  const nextPetName = useMemo(() => {
    if (!nextAppointment?.pet) return null;
    return pets?.results.find((p) => p.id === nextAppointment.pet)?.name ?? null;
  }, [nextAppointment, pets]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        {user && (
          <UserAvatar
            name={user.full_name || user.first_name || "?"}
            photo={user.photo}
            size="md"
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h1 className="truncate text-2xl font-semibold">
            {greeting}
            {user ? `, ${user.first_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            ¿Qué haremos hoy por tu peludo?
          </p>
        </div>
      </header>

      {pets && <OnboardingBanner pets={pets.results} />}

      {nextAppointment ? (
        <NextAppointmentHero
          appointment={nextAppointment}
          petName={nextPetName}
        />
      ) : (
        <Card>
          <CardContent className="py-5 text-center text-sm text-muted-foreground">
            Aún no tienes citas próximas. Reserva una y te la mostramos aquí.
          </CardContent>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => (
            <QuickActionTile key={a.to} {...a} />
          ))}
        </div>
      </section>
    </div>
  );
}
