import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Pet,
  PetListItem,
  PetListParams,
  CreatePetPayload,
  LookupOption,
  UpdatePetBasicPayload,
  UpdatePetCompletePayload,
  OnboardingStatus,
  MedicalRecord,
  Vaccination,
  PetDocument,
} from "@/types/pet";

export const petKeys = {
  all: ["pets"] as const,
  lists: () => [...petKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...petKeys.lists(), params] as const,
  details: () => [...petKeys.all, "detail"] as const,
  detail: (id: string) => [...petKeys.details(), id] as const,
  onboarding: (id: string) => [...petKeys.all, "onboarding", id] as const,
  medical: (id: string) => [...petKeys.all, "medical", id] as const,
  vaccinations: (id: string) => [...petKeys.all, "vaccinations", id] as const,
  documents: (id: string) => [...petKeys.all, "documents", id] as const,
  breeds: ["pets", "breeds"] as const,
  foodTypes: ["pets", "food-types"] as const,
  foodBrands: ["pets", "food-brands"] as const,
};

// Lookup catalogs are small and stable: fetch once and keep cached for the
// session so dropdowns open instantly across multiple forms.
const LOOKUP_STALE_TIME = 1000 * 60 * 60; // 1h

export function useBreeds() {
  return useQuery({
    queryKey: petKeys.breeds,
    queryFn: () => api.get<LookupOption[]>("/pets/breeds/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useFoodTypes() {
  return useQuery({
    queryKey: petKeys.foodTypes,
    queryFn: () =>
      api.get<LookupOption[]>("/pets/food-types/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useFoodBrands() {
  return useQuery({
    queryKey: petKeys.foodBrands,
    queryFn: () =>
      api.get<LookupOption[]>("/pets/food-brands/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function usePets(params: PetListParams = {}) {
  return useQuery({
    queryKey: petKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<PetListItem>>("/pets/", { params })
        .then((r) => r.data),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => api.get<Pet>(`/pets/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePetPayload) =>
      api.post<Pet>("/pets/create/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useUpdatePetBasic(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePetBasicPayload) =>
      api.patch<Pet>(`/pets/${id}/update-basic/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useUpdatePetComplete(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePetCompletePayload) =>
      api.patch<Pet>(`/pets/${id}/update-complete/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useDeletePet(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/pets/${id}/delete/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.lists() });
      qc.removeQueries({ queryKey: petKeys.detail(id) });
    },
  });
}

export function useUpdatePetPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return api
        .patch<Pet>(`/pets/${id}/update-complete/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function usePetOnboardingStatus(id: string) {
  return useQuery({
    queryKey: petKeys.onboarding(id),
    queryFn: () =>
      api
        .get<OnboardingStatus>(`/pets/${id}/onboarding-status/`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function usePetMedicalRecords(petId: string) {
  return useQuery({
    queryKey: petKeys.medical(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<MedicalRecord>>(`/pets/${petId}/medical-records/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}

export function usePetVaccinations(petId: string) {
  return useQuery({
    queryKey: petKeys.vaccinations(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<Vaccination>>(`/pets/${petId}/vaccinations/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}

export function usePetDocuments(petId: string) {
  return useQuery({
    queryKey: petKeys.documents(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<PetDocument>>(`/pets/${petId}/documents/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}
