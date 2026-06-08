export type Species = "DOG" | "CAT";
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type PetSize = "SMALL" | "MEDIUM" | "LARGE" | "X_LARGE";

/** Shape returned by /pets/breeds/, /pets/food-types/, /pets/food-brands/. */
export interface LookupOption {
  id: string;
  name: string;
  slug: string;
}

export interface Pet {
  id: string;
  name: string;
  species: Species | null;
  breed: LookupOption | null;
  birth_date: string | null;
  gender: Gender | null;
  food_type: LookupOption | null;
  food_brand: LookupOption | null;
  /** Legacy — kept in DB but not surfaced in the customer form. */
  size: PetSize | null;
  weight: string | null;
  microchip_id: string | null;
  photo: string | null;
  health_notes: string;
  allergies: string;
  age_years: number;
  onboarding_status: string;
  onboarding_completion_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetListItem {
  id: string;
  name: string;
  species: Species | null;
  breed: LookupOption | null;
  gender: Gender | null;
  age_years: number;
  onboarding_status: string;
  onboarding_completion_percentage: number;
  photo: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PetListParams {
  page?: number;
  search?: string;
  is_active?: boolean;
}

/** species is auto-set to DOG by the backend, so the form never sends it. */
export interface CreatePetPayload {
  name: string;
  gender?: Gender;
  breed?: string;
  food_type?: string;
  food_brand?: string;
  birth_date?: string;
}

export interface UpdatePetBasicPayload {
  name?: string;
  gender?: Gender;
  breed?: string;
  food_type?: string;
  birth_date?: string;
}

export interface UpdatePetCompletePayload {
  food_brand?: string;
  photo?: string;
  health_notes?: string;
  allergies?: string;
}

export type OnboardingLevel = "MINIMAL" | "BASIC" | "COMPLETE";

export interface OnboardingStatus {
  id: string;
  name: string;
  onboarding_status: OnboardingLevel;
  completion_percentage: number;
  missing_for_basic: string[];
  missing_for_complete: string[];
}

export interface MedicalRecord {
  id: string;
  pet: string;
  pet_name: string;
  record_type: string;
  record_type_display: string;
  title: string;
  description: string;
  date: string;
  veterinarian: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vaccination {
  id: string;
  pet: string;
  pet_name: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date: string | null;
  batch_number: string;
  veterinarian: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetDocument {
  id: string;
  pet: string;
  pet_name: string;
  document_type: string;
  document_type_display: string;
  title: string;
  file: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const SPECIES_LABEL: Record<Species, string> = {
  DOG: "Perro",
  CAT: "Gato",
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Macho",
  FEMALE: "Hembra",
  UNKNOWN: "Sin especificar",
};

export const SIZE_LABEL: Record<PetSize, string> = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
  X_LARGE: "Muy grande",
};
