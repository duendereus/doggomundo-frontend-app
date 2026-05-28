import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import axios from "axios";

/**
 * Maps a DRF 400 error body onto react-hook-form field errors.
 *
 * The backend keys errors by its own serializer field names, which do
 * not always match the form's field names (e.g. backend `otp_code` vs
 * form `otp`). When a key has no matching form field the inline error
 * silently disappears, so:
 *   - `fieldMap` translates known divergent keys to form field names.
 *   - any key that still isn't a form field falls back to a visible
 *     root-level error so the user never gets silent failure.
 */
export function mapApiErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fallback = "Ocurrió un error. Intenta de nuevo.",
  options: {
    fieldMap?: Record<string, Path<T>>;
    formFields?: readonly Path<T>[];
  } = {},
) {
  const { fieldMap = {}, formFields } = options;

  if (
    axios.isAxiosError(err) &&
    err.response?.status === 400 &&
    err.response.data &&
    typeof err.response.data === "object"
  ) {
    const errors = err.response.data as Record<string, string[] | string>;
    const entries = Object.entries(errors);

    if (entries.length === 0) {
      setError("root" as Path<T>, { message: fallback });
      return;
    }

    const rootMessages: string[] = [];

    entries.forEach(([field, messages]) => {
      const msg = String(Array.isArray(messages) ? messages[0] : messages);

      if (field === "non_field_errors" || field === "detail") {
        rootMessages.push(msg);
        return;
      }

      const target = (fieldMap[field] ?? field) as Path<T>;

      // If we know the form's fields and this target isn't one of them,
      // the inline error would never render — surface it at root instead.
      if (formFields && !formFields.includes(target)) {
        rootMessages.push(msg);
        return;
      }

      setError(target, { message: msg });
    });

    if (rootMessages.length > 0) {
      setError("root" as Path<T>, { message: rootMessages.join(" ") });
    }
    return;
  }

  if (axios.isAxiosError(err) && err.response?.status === 401) {
    setError("root" as Path<T>, { message: "Credenciales inválidas." });
    return;
  }

  setError("root" as Path<T>, { message: fallback });
}
