import { useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Bone, Camera, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { BackLink } from "@/features/pets/components/BackLink";
import { profileFields } from "@/features/pets/lib/pet-missing";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  useBreeds,
  useFoodBrands,
  useFoodTypes,
  usePet,
  useUpdatePetBasic,
  useUpdatePetComplete,
  useUpdatePetPhoto,
} from "@/api/hooks/use-pets";
import { cn } from "@/lib/utils";
import { GENDER_LABEL } from "@/types/pet";
import type { Pet, Gender } from "@/types/pet";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  food_type: z.string().optional(),
  food_brand: z.string().optional(),
  health_notes: z.string().optional(),
  allergies: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const BASIC_KEYS = [
  "name",
  "gender",
  "breed",
  "birth_date",
  "food_type",
] as const satisfies readonly (keyof FormValues)[];

const COMPLETE_KEYS = [
  "food_brand",
  "health_notes",
  "allergies",
] as const satisfies readonly (keyof FormValues)[];

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export function PetEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet, isLoading, isError } = usePet(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to={`/pets/${id}`} label="Volver" />
        <LoadingState rows={4} />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="space-y-4">
        <BackLink to="/pets" label="Mis mascotas" />
        <EmptyState title="No pudimos cargar esta mascota" />
      </div>
    );
  }

  // Once the pet has loaded we mount the form with real defaults. Remounting
  // by id avoids Radix `Select` getting stuck in uncontrolled mode when the
  // initial value arrives async.
  return <PetEditForm key={pet.id} pet={pet} />;
}

interface FormProps {
  pet: Pet;
}

function PetEditForm({ pet }: FormProps) {
  const navigate = useNavigate();
  const updateBasic = useUpdatePetBasic(pet.id);
  const updateComplete = useUpdatePetComplete(pet.id);
  const updatePhoto = useUpdatePetPhoto(pet.id);
  const { data: breeds = [], isLoading: breedsLoading } = useBreeds();
  const { data: foodTypes = [], isLoading: foodTypesLoading } = useFoodTypes();
  const { data: foodBrands = [], isLoading: foodBrandsLoading } = useFoodBrands();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pet.name,
      gender: pet.gender ?? undefined,
      breed: pet.breed?.id ?? "",
      birth_date: pet.birth_date ?? "",
      food_type: pet.food_type?.id ?? "",
      food_brand: pet.food_brand?.id ?? "",
      health_notes: pet.health_notes ?? "",
      allergies: pet.allergies ?? "",
    },
  });

  const fields = profileFields(pet);
  const filledCount = fields.filter((f) => f.filled).length;
  const completion = pet.onboarding_completion_percentage;
  const isComplete = completion >= 100;

  // Smooth-scroll to the relevant section/input and focus it so the user
  // lands ready to fill the missing field that's still locking their bone.
  function focusField(key: string) {
    const targetId = key === "photo" ? "photo-card" : key;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Defer focus until the scroll begins so the browser doesn't cancel the
    // smooth animation on focus jump.
    window.setTimeout(() => {
      if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    }, 250);
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
      const updated = await updatePhoto.mutateAsync(file);
      if (updated.onboarding_completion_percentage >= 100) {
        celebrateCompletion();
        navigate("/book", { replace: true });
        return;
      }
      toast.success("Foto subida. ¡+1 huesito 🦴!");
    } catch {
      toast.error("No pudimos subir la foto. Intenta de nuevo.");
    }
  }

  async function onSubmit(data: FormValues) {
    const basicChanges: Record<string, unknown> = {};
    BASIC_KEYS.forEach((k) => {
      if (dirtyFields[k]) basicChanges[k] = data[k] ?? "";
    });

    const completeChanges: Record<string, unknown> = {};
    COMPLETE_KEYS.forEach((k) => {
      if (dirtyFields[k]) completeChanges[k] = data[k] ?? "";
    });

    if (
      Object.keys(basicChanges).length === 0 &&
      Object.keys(completeChanges).length === 0
    ) {
      toast.info("No has hecho cambios.");
      return;
    }

    try {
      let last: Pet | null = null;
      if (Object.keys(basicChanges).length > 0) {
        last = await updateBasic.mutateAsync(basicChanges);
      }
      if (Object.keys(completeChanges).length > 0) {
        last = await updateComplete.mutateAsync(completeChanges);
      }

      // When the user crosses the finish line we send them straight to the
      // booking flow (per product spec) instead of the detail page.
      if (last && last.onboarding_completion_percentage >= 100) {
        celebrateCompletion();
        navigate("/book", { replace: true });
        return;
      }

      toast.success("Perfil actualizado. ¡Sigue así! 🦴");
      navigate(`/pets/${pet.id}`, { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos guardar los cambios.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to={`/pets/${pet.id}`} label={pet.name} />

      <header>
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          {isComplete
            ? "Perfil completo. ¡Bien hecho!"
            : `Llevas ${filledCount} de ${fields.length} huesitos. Completa los que falten para reservar.`}
        </p>
      </header>

      <BoneProgress fields={fields} onFieldClick={focusField} />

      <Card id="photo-card" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-base">Foto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
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
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {pet.photo
                  ? "Cámbiale la foto si quieres lucirlo distinto."
                  : "Súbele una foto para reconocerlo en la app."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={updatePhoto.isPending}
              >
                {updatePhoto.isPending
                  ? "Subiendo…"
                  : pet.photo
                    ? "Cambiar foto"
                    : "Subir foto"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormErrors message={errors.root?.message} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Sexo</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Sin especificar" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                        <SelectItem key={g} value={g}>
                          {GENDER_LABEL[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raza</Label>
              <Controller
                control={control}
                name="breed"
                render={({ field }) => (
                  <SearchableSelect
                    id="breed"
                    options={breeds}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Selecciona una raza"
                    searchPlaceholder="Busca tu raza…"
                    isLoading={breedsLoading}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-sm text-destructive">
                  {errors.birth_date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alimentación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="food_type">Tipo de alimento</Label>
              <Controller
                control={control}
                name="food_type"
                render={({ field }) => (
                  <SearchableSelect
                    id="food_type"
                    options={foodTypes}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="¿Qué come?"
                    searchPlaceholder="Buscar tipo…"
                    isLoading={foodTypesLoading}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="food_brand">Marca del alimento</Label>
              <Controller
                control={control}
                name="food_brand"
                render={({ field }) => (
                  <SearchableSelect
                    id="food_brand"
                    options={foodBrands}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Opcional"
                    searchPlaceholder="Buscar marca…"
                    isLoading={foodBrandsLoading}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="health_notes">Notas de salud</Label>
              <Textarea
                id="health_notes"
                rows={3}
                placeholder="Condiciones, medicamentos, etc."
                {...register("health_notes")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                rows={2}
                placeholder="Alimentos, medicamentos, etc."
                {...register("allergies")}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting
            ? "Guardando…"
            : isDirty
              ? "Guardar cambios"
              : "Sin cambios por guardar"}
        </Button>
      </form>
    </div>
  );
}

interface BoneProgressProps {
  fields: ReturnType<typeof profileFields>;
  onFieldClick: (key: string) => void;
}

/**
 * Visual reward board: one cartoon bone per profile field. Filled bones glow
 * in amber so the user sees at a glance how many "huesitos" they've earned;
 * empty bones are dashed and clickable — tapping one scrolls to the matching
 * input so the user knows exactly what to fill to unlock the bone.
 */
function BoneProgress({ fields, onFieldClick }: BoneProgressProps) {
  const filled = fields.filter((f) => f.filled).length;
  const total = fields.length;
  const allDone = filled === total;

  return (
    <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50/60 via-background to-background">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {allDone ? (
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
            ) : (
              <Bone className="h-5 w-5 text-amber-500" aria-hidden="true" />
            )}
            <p className="text-sm font-semibold">
              {allDone
                ? "¡Perfil completo! 🏆"
                : `${filled} de ${total} huesitos`}
            </p>
          </div>
          {!allDone && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Toca un hueso para llenarlo
            </span>
          )}
        </div>

        <ul
          className="grid grid-cols-4 gap-2"
          aria-label="Progreso del perfil"
        >
          {fields.map((f) =>
            f.filled ? (
              <li
                key={f.key}
                className="flex flex-col items-center gap-1 rounded-xl border border-amber-300/70 bg-gradient-to-br from-amber-100 to-amber-200/70 p-2 text-center shadow-sm"
                aria-label={`${f.label}: completo`}
              >
                <Bone
                  className="h-5 w-5 text-amber-700 drop-shadow-sm"
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-tight text-amber-900">
                  {f.label}
                </span>
              </li>
            ) : (
              <li key={f.key}>
                <button
                  type="button"
                  onClick={() => onFieldClick(f.key)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/30 p-2 text-center transition-all",
                    "hover:border-amber-400 hover:bg-amber-50 hover:shadow-sm active:scale-[0.97]",
                    "outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-1",
                  )}
                  aria-label={`${f.label} pendiente. Toca para llenar.`}
                >
                  <Bone
                    className="h-5 w-5 -rotate-12 text-amber-400/60"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {f.label}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function celebrateCompletion() {
  toast.success("¡Perfil completo! 🏆 Ganaste todos los huesitos. A reservar.", {
    duration: 5000,
  });
}
