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

const optionalTextSchema = (maxLength: number) =>
  z.preprocess(
    normalizeTextInput,
    z.string().trim().max(maxLength, `Ce champ doit contenir ${maxLength} caracteres maximum.`).optional(),
  );

const usernameSchema = z.preprocess(
  normalizeTextInput,
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Le username est obligatoire.")
    .min(3, "Le username doit contenir au moins 3 caracteres.")
    .max(40, "Le username doit contenir 40 caracteres maximum.")
    .regex(/^[a-z0-9._-]+$/, "Le username peut contenir lettres, chiffres, points, tirets et underscores."),
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

const baseRegisterSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  wantsToPostArticles: z.boolean().optional().default(false),
  merchantProfile: z
    .object({
      shopName: z.preprocess(
        normalizeTextInput,
        z.string().trim().min(2, "Le nom de la boutique est obligatoire.").max(80),
      ),
      shopDomain: z.preprocess(
        normalizeTextInput,
        z.string().trim().toLowerCase().min(3, "L'URL de la boutique est obligatoire.").max(160),
      ),
      shopDescription: optionalTextSchema(400),
      sector: optionalTextSchema(80),
      country: optionalTextSchema(80),
    })
    .optional(),
});

function validateMerchantIntent(data: { wantsToPostArticles?: boolean; merchantProfile?: unknown }, context: z.RefinementCtx) {
  if (!data.wantsToPostArticles) return;

  if (!data.merchantProfile) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["merchantProfile"],
      message: "Les informations boutique sont obligatoires pour publier des articles.",
    });
  }
}

export const registerSchema = baseRegisterSchema.superRefine(validateMerchantIntent);

export const signUpSchema = baseRegisterSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .superRefine(validateMerchantIntent)
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
