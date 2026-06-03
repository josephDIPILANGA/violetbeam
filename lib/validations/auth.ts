import { z, type ZodError } from "zod";

const normalizeTextInput = (value: unknown) => (typeof value === "string" ? value : "");

const nameSchema = z.preprocess(
  normalizeTextInput,
  z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .min(3, "Le nom doit contenir au moins 3 caracteres.")
    .max(50, "Le nom doit contenir 50 caracteres maximum."),
);

const emailSchema = z.preprocess(
  normalizeTextInput,
  z.string().trim().toLowerCase().min(1, "L'email est obligatoire.").email("Entrez une adresse email valide."),
);

const passwordSchema = z.preprocess(
  normalizeTextInput,
  z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .min(7, "Le mot de passe doit contenir au moins 7 caracteres.")
    .max(100, "Le mot de passe doit contenir 100 caracteres maximum."),
);

const signInPasswordSchema = z.preprocess(
  normalizeTextInput,
  z.string().min(1, "Le mot de passe est obligatoire.").max(100, "Le mot de passe doit contenir 100 caracteres maximum."),
);

export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = registerSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

export function getFirstZodError(error: ZodError) {
  return error.issues[0]?.message ?? "Donnees invalides.";
}

export function getZodFieldErrors<TField extends string>(error: ZodError) {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field as TField]) {
      fieldErrors[field as TField] = issue.message;
    }
  }

  return fieldErrors;
}
