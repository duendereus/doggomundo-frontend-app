import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PetAvatar } from "./PetAvatar";
import { GENDER_LABEL } from "@/types/pet";
import type { PetListItem } from "@/types/pet";
import { formatAgeFromBirth } from "@/lib/format-date";

interface Props {
  pet: PetListItem;
  birthDate?: string | null;
}

export function PetCard({ pet, birthDate }: Props) {
  const age = birthDate ? formatAgeFromBirth(birthDate) : null;
  const metaBits = [
    pet.breed?.name ?? null,
    age,
    pet.gender ? GENDER_LABEL[pet.gender] : null,
  ].filter(Boolean);

  const completion = pet.onboarding_completion_percentage;
  const isIncomplete = completion < 100;

  return (
    <Link
      to={`/pets/${pet.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-shadow hover:shadow-md" size="sm">
        <div className="flex items-center gap-3 px-3">
          <PetAvatar name={pet.name} photo={pet.photo} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-semibold">{pet.name}</h3>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {metaBits.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                {metaBits.join(" · ")}
              </p>
            )}
            {isIncomplete && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Perfil {completion}%</span>
                  <span className="text-primary">Completar</span>
                </div>
                <Progress value={completion} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
