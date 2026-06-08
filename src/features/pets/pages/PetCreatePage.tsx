import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { BackLink } from "@/features/pets/components/BackLink";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  useBreeds,
  useCreatePet,
  useFoodBrands,
  useFoodTypes,
} from "@/api/hooks/use-pets";
import { GENDER_LABEL } from "@/types/pet";
import type { CreatePetPayload, Gender } from "@/types/pet";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  food_type: z.string().optional(),
  food_brand: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PetCreatePage() {
  const navigate = useNavigate();
  const create = useCreatePet();
  const { data: breeds = [], isLoading: breedsLoading } = useBreeds();
  const { data: foodTypes = [], isLoading: foodTypesLoading } = useFoodTypes();
  const { data: foodBrands = [], isLoading: foodBrandsLoading } = useFoodBrands();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      breed: "",
      birth_date: "",
      food_type: "",
      food_brand: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      const payload: CreatePetPayload = {
        name: data.name,
        ...(data.gender ? { gender: data.gender as Gender } : {}),
        ...(data.breed ? { breed: data.breed } : {}),
        ...(data.birth_date ? { birth_date: data.birth_date } : {}),
        ...(data.food_type ? { food_type: data.food_type } : {}),
        ...(data.food_brand ? { food_brand: data.food_brand } : {}),
      };
      const pet = await create.mutateAsync(payload);
      toast.success(`${pet.name} quedó registrado. Ahora completa su perfil.`);
      navigate(`/pets/${pet.id}/edit`, { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos crear la mascota.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to="/pets" label="Mis mascotas" />

      <Card>
        <CardHeader>
          <CardTitle>Nueva mascota</CardTitle>
          <CardDescription>
            Con el nombre basta para empezar. Luego podrás completar su perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormErrors message={errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                autoComplete="off"
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
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Opcional" />
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
              <Input
                id="birth_date"
                type="date"
                {...register("birth_date")}
              />
            </div>

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

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Crear mascota"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
