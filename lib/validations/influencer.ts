import { z, type ZodError } from "zod";

const normalizeTextInput = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const optionalText = z.preprocess((value) => {
  const text = normalizeTextInput(value);
  return text.length > 0 ? text : undefined;
}, z.string().max(800).optional());

const shortRequiredText = (label: string, max = 80) =>
  z.preprocess(
    normalizeTextInput,
    z
      .string()
      .min(1, `${label} is required.`)
      .min(2, `${label} must contain at least 2 characters.`)
      .max(max, `${label} must contain ${max} characters maximum.`),
  );

const optionalHandle = z.preprocess((value) => {
  const text = normalizeTextInput(value).replace(/^@/, "");
  return text.length > 0 ? text : undefined;
}, z.string().regex(/^[a-zA-Z0-9._]{2,30}$/, "Handle can only contain letters, numbers, dots and underscores.").optional());

export const createVirtualInfluencerSchema = z.object({
  firstName: shortRequiredText("First name", 50),
  lastName: optionalText,
  displayName: shortRequiredText("Display name", 80),
  username: z.preprocess(
    (value) => normalizeTextInput(value).toLowerCase(),
    z
      .string()
      .min(1, "Username is required.")
      .min(3, "Username must contain at least 3 characters.")
      .max(50, "Username must contain 50 characters maximum.")
      .regex(/^[a-z0-9._-]+$/, "Username can only contain lowercase letters, numbers, dots, dashes and underscores."),
  ),
  emailAlias: z.preprocess((value) => {
    const text = normalizeTextInput(value).toLowerCase();
    return text.length > 0 ? text : undefined;
  }, z.string().email("Enter a valid email alias.").optional()),
  instagramHandle: optionalHandle,
  tiktokHandle: optionalHandle,
  bio: z.preprocess(
    normalizeTextInput,
    z.string().min(1, "Bio is required.").max(260, "Bio must contain 260 characters maximum."),
  ),
  fashionStyle: z.preprocess(
    normalizeTextInput,
    z.string().min(1, "Fashion style is required.").min(8, "Fashion style must be more descriptive.").max(220),
  ),
  targetAudience: z.preprocess(
    normalizeTextInput,
    z.string().min(1, "Target audience is required.").min(8, "Target audience must be more descriptive.").max(180),
  ),
  preferredCategories: z.array(z.string().min(1)).min(1, "Select at least one category.").max(8, "Select 8 categories maximum."),
  morphology: optionalText,
  height: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  }, z.number().min(120, "Height looks too small.").max(220, "Height looks too tall.").optional()),
  bodyType: optionalText,
  skinTone: optionalText,
  hairStyle: optionalText,
  toneOfVoice: optionalText,
  promptContext: z.preprocess(
    normalizeTextInput,
    z.string().min(1, "Prompt context is required.").max(900),
  ),
  isAiDisclosed: z.boolean().default(true),
});

export type CreateVirtualInfluencerInput = z.infer<typeof createVirtualInfluencerSchema>;

export function getInfluencerFieldErrors<TField extends string>(error: ZodError) {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field as TField]) {
      fieldErrors[field as TField] = issue.message;
    }
  }

  return fieldErrors;
}
