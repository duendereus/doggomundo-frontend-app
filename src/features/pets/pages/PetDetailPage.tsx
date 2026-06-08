import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  Camera,
  ChevronRight,
  Edit,
  FileText,
  Pencil,
  Syringe,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { BackLink } from "@/features/pets/components/BackLink";
import { PetDaycareSection } from "@/features/daycare/components/PetDaycareSection";
import { usePet, useDeletePet, useUpdatePetPhoto } from "@/api/hooks/use-pets";
import { GENDER_LABEL } from "@/types/pet";
import { formatAgeFromBirth, formatDate } from "@/lib/format-date";

const SUB_PAGES = [
  { to: "medical-records", label: "Historial médico", icon: Activity },
  { to: "vaccinations", label: "Vacunas", icon: Syringe },
  { to: "documents", label: "Documentos", icon: FileText },
];

interface DetailRowProps {
  label: string;
  value: string | null;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: pet, isLoading, isError } = usePet(id ?? "");
  const deletePet = useDeletePet(id ?? "");
  const updatePhoto = useUpdatePetPhoto(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  async function handleDelete() {
    try {
      await deletePet.mutateAsync();
      toast.success("La mascota fue eliminada.");
      navigate("/pets", { replace: true });
    } catch {
      toast.error("No pudimos eliminar la mascota.");
    }
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error("La imagen es muy grande. Máximo 5 MB.");
      return;
    }
    try {
      await updatePhoto.mutateAsync(file);
      toast.success("Foto actualizada.");
    } catch {
      toast.error("No pudimos subir la foto. Intenta de nuevo.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/pets" label="Mis mascotas" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="space-y-4">
        <BackLink to="/pets" label="Mis mascotas" />
        <EmptyState
          title="No pudimos cargar esta mascota"
          description="Revisa que el enlace sea correcto."
        />
      </div>
    );
  }

  const completion = pet.onboarding_completion_percentage;
  const age = formatAgeFromBirth(pet.birth_date);

  return (
    <div className="space-y-4">
      <BackLink to="/pets" label="Mis mascotas" />

      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="relative shrink-0">
            <PetAvatar name={pet.name} photo={pet.photo} size="lg" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={updatePhoto.isPending}
              className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
              aria-label="Cambiar foto"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoFile}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate text-2xl font-semibold">{pet.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[pet.breed?.name ?? null, age]
                .filter(Boolean)
                .join(" · ") || "Completa su perfil"}
            </p>
          </div>
          <Button asChild size="icon-sm" variant="outline" aria-label="Editar">
            <Link to={`/pets/${pet.id}/edit`}>
              <Pencil />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {completion < 100 && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Perfil {completion}% completo</p>
                <p className="text-xs text-muted-foreground">
                  Completa sus datos antes de reservar servicios.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to={`/pets/${pet.id}/edit`}>
                  <Edit />
                  Completar
                </Link>
              </Button>
            </div>
            <Progress value={completion} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow label="Raza" value={pet.breed?.name ?? null} />
          <DetailRow label="Sexo" value={pet.gender ? GENDER_LABEL[pet.gender] : null} />
          <DetailRow
            label="Nacimiento"
            value={pet.birth_date ? formatDate(pet.birth_date) : null}
          />
          <DetailRow label="Edad" value={age} />
          <DetailRow label="Tipo de alimento" value={pet.food_type?.name ?? null} />
          <DetailRow label="Marca del alimento" value={pet.food_brand?.name ?? null} />
        </CardContent>
      </Card>

      {(pet.health_notes || pet.allergies) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            {pet.health_notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Notas</p>
                <p className="whitespace-pre-line">{pet.health_notes}</p>
              </div>
            )}
            {pet.allergies && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Alergias</p>
                <p className="whitespace-pre-line">{pet.allergies}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PetDaycareSection petId={pet.id} petName={pet.name} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial clínico</CardTitle>
          <CardDescription>Registros cargados por el equipo veterinario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {SUB_PAGES.map((sp) => (
            <Link
              key={sp.to}
              to={`/pets/${pet.id}/${sp.to}`}
              className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <sp.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{sp.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 />
        Eliminar mascota
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Eliminar a ${pet.name}`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deletePet.isPending}
      />
    </div>
  );
}
