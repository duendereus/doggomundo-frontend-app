import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { BackLink } from "@/features/pets/components/BackLink";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  useBreeds,
  useFoodBrands,
  useFoodTypes,
  usePet,
  useUpdatePetBasic,
  useUpdatePetComplete,
} from "@/api/hooks/use-pets";
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
  const { data: breeds = [], isLoading: breedsLoading } = useBreeds();
  const { data: foodTypes = [], isLoading: foodTypesLoading } = useFoodTypes();
  const { data: foodBrands = [], isLoading: foodBrandsLoading } = useFoodBrands();

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
      if (Object.keys(basicChanges).length > 0) {
        await updateBasic.mutateAsync(basicChanges);
      }
      if (Object.keys(completeChanges).length > 0) {
        await updateComplete.mutateAsync(completeChanges);
      }
      toast.success("Perfil actualizado.");
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
          Perfil al {pet.onboarding_completion_percentage}%. Completa lo que te falte.
        </p>
      </header>

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
