"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  Eye,
  Mail,
  Palette,
  Plus,
  Shirt,
  Sparkles,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type FormValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  emailAlias: string;
  instagramHandle: string;
  tiktokHandle: string;
  bio: string;
  fashionStyle: string;
  targetAudience: string;
  morphology: string;
  height: string;
  bodyType: string;
  skinTone: string;
  hairStyle: string;
  toneOfVoice: string;
  promptContext: string;
  isAiDisclosed: boolean;
};

type FieldErrors = Partial<Record<keyof FormValues | "preferredCategories", string>>;
type FormMode = "create" | "update";
type InitialInfluencer = {
  id: number;
  firstName: string;
  lastName: string | null;
  displayName: string;
  username: string;
  emailAlias: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  bodyReferenceImageUrl: string | null;
  morphology: string | null;
  height: number | null;
  bodyType: string | null;
  skinTone: string | null;
  hairStyle: string | null;
  fashionStyle: string | null;
  toneOfVoice: string | null;
  targetAudience: string | null;
  preferredCategories: string[];
  promptContext: string | null;
  isAiDisclosed: boolean;
  platformAccounts: Array<{
    platform: string;
    handle: string;
    connectionStatus: string;
  }>;
} | null;

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  displayName: "",
  username: "",
  emailAlias: "",
  instagramHandle: "",
  tiktokHandle: "",
  bio: "",
  fashionStyle: "quiet luxury, minimal tailoring, soft purple accents",
  targetAudience: "women 22-35 interested in premium everyday fashion",
  morphology: "tall slim silhouette",
  height: "176",
  bodyType: "slim",
  skinTone: "warm medium skin tone",
  hairStyle: "long dark wavy hair",
  toneOfVoice: "elegant, calm, editorial",
  promptContext: "",
  isAiDisclosed: true,
};

const categoryOptions = [
  "shirts",
  "pants",
  "dresses",
  "coats",
  "accessories",
  "shoes",
  "bags",
  "tops",
  "jackets",
  "sunglasses",
];

const selectModules = [
  {
    name: "morphology",
    label: "Morphology",
    icon: UserRound,
    options: ["tall slim silhouette", "petite balanced silhouette", "curvy hourglass silhouette", "athletic medium height silhouette", "lean tall silhouette"],
  },
  {
    name: "bodyType",
    label: "Body type",
    icon: Eye,
    options: ["slim", "petite", "curvy", "athletic", "lean", "average"],
  },
  {
    name: "skinTone",
    label: "Skin tone",
    icon: Palette,
    options: ["fair skin tone", "light neutral skin tone", "warm medium skin tone", "olive skin tone", "deep skin tone", "brown skin tone"],
  },
  {
    name: "hairStyle",
    label: "Hair style",
    icon: Sparkles,
    options: ["long dark wavy hair", "sleek black bob haircut", "short curly hair", "braided high ponytail", "medium length sandy blond hair"],
  },
  {
    name: "toneOfVoice",
    label: "Tone of voice",
    icon: Bot,
    options: ["elegant, calm, editorial", "bold, direct, energetic", "poetic, precise, fashion-forward", "warm, confident, aspirational", "playful, curious, trend-aware"],
  },
] as const;

function slugifyAgent(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function getPlatformHandle(initialInfluencer: InitialInfluencer, platform: string) {
  return initialInfluencer?.platformAccounts.find((account) => account.platform === platform)?.handle || "";
}

function getInitialValues(initialInfluencer: InitialInfluencer): FormValues {
  if (!initialInfluencer) return initialValues;

  return {
    firstName: initialInfluencer.firstName,
    lastName: initialInfluencer.lastName || "",
    displayName: initialInfluencer.displayName,
    username: initialInfluencer.username,
    emailAlias: initialInfluencer.emailAlias || "",
    instagramHandle: getPlatformHandle(initialInfluencer, "INSTAGRAM"),
    tiktokHandle: getPlatformHandle(initialInfluencer, "TIKTOK"),
    bio: initialInfluencer.bio || "",
    fashionStyle: initialInfluencer.fashionStyle || "",
    targetAudience: initialInfluencer.targetAudience || "",
    morphology: initialInfluencer.morphology || "",
    height: initialInfluencer.height ? String(initialInfluencer.height) : "",
    bodyType: initialInfluencer.bodyType || "",
    skinTone: initialInfluencer.skinTone || "",
    hairStyle: initialInfluencer.hairStyle || "",
    toneOfVoice: initialInfluencer.toneOfVoice || "",
    promptContext: initialInfluencer.promptContext || "",
    isAiDisclosed: initialInfluencer.isAiDisclosed,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">{message}</span>;
}

export default function CreateInfluencerForm({
  initialInfluencer = null,
  mode = "create",
}: {
  initialInfluencer?: InitialInfluencer;
  mode?: FormMode;
}) {
  const router = useRouter();
  const isUpdateMode = mode === "update" && Boolean(initialInfluencer);
  const [values, setValues] = useState<FormValues>(() => getInitialValues(initialInfluencer));
  const [customValues, setCustomValues] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    () => initialInfluencer?.preferredCategories?.length ? initialInfluencer.preferredCategories : ["shirts", "pants", "dresses"],
  );
  const [customCategory, setCustomCategory] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [createdInfluencerId, setCreatedInfluencerId] = useState<number | null>(initialInfluencer?.id || null);
  const [generatedProfileUrl, setGeneratedProfileUrl] = useState<string | null>(initialInfluencer?.profileImageUrl || null);
  const [generatedBodyUrl, setGeneratedBodyUrl] = useState<string | null>(initialInfluencer?.bodyReferenceImageUrl || null);
  const hasConnectedPlatform = Boolean(
    initialInfluencer?.platformAccounts.some((account) => account.connectionStatus === "CONNECTED"),
  );

  const previewName = values.displayName || [values.firstName, values.lastName].filter(Boolean).join(" ") || "New Muse";
  const previewUsername = values.username || slugifyAgent(previewName) || "new.violetbeam";

  const resolvedSelectValues = useMemo(() => {
    return selectModules.reduce(
      (acc, module) => ({
        ...acc,
        [module.name]: customValues[module.name]?.trim() || values[module.name],
      }),
      {} as Partial<FormValues>,
    );
  }, [customValues, values]);

  function updateValue(name: keyof FormValues, value: string | boolean) {
    setValues((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "firstName" || name === "lastName") {
        const displayName = [name === "firstName" ? value : next.firstName, name === "lastName" ? value : next.lastName]
          .filter(Boolean)
          .join(" ");

        next.displayName = typeof displayName === "string" ? displayName : next.displayName;

        if (!current.username || current.username === `${slugifyAgent(current.displayName)}.violetbeam`) {
          next.username = `${slugifyAgent(displayName)}.violetbeam`;
        }
      }

      return next;
    });

    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function toggleCategory(category: string) {
    setPreferredCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
    setFieldErrors((current) => ({ ...current, preferredCategories: undefined }));
  }

  function addCustomCategory() {
    const cleanValue = customCategory.trim().toLowerCase();
    if (!cleanValue || preferredCategories.includes(cleanValue)) return;
    setPreferredCategories((current) => [...current, cleanValue]);
    setCustomCategory("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setIsGeneratingImages(false);
    setFormMessage(null);
    setFieldErrors({});
    if (!isUpdateMode) {
      setCreatedInfluencerId(null);
      setGeneratedProfileUrl(null);
      setGeneratedBodyUrl(null);
    }

    const payload = {
      ...values,
      ...resolvedSelectValues,
      username: values.username.trim().toLowerCase(),
      instagramHandle: values.instagramHandle.trim().replace(/^@/, ""),
      tiktokHandle: values.tiktokHandle.trim().replace(/^@/, ""),
      height: values.height ? Number(values.height) : undefined,
      preferredCategories,
    };

    try {
      const response = await fetch(
        isUpdateMode ? `/api/virtual-influencers/${initialInfluencer?.id}` : "/api/virtual-influencers",
        {
        method: isUpdateMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      );
      const data = await response.json();

      if (!response.ok) {
        const nextFieldErrors = data?.fieldErrors || {};
        const firstFieldError = Object.values(nextFieldErrors).find((message) => typeof message === "string");

        setFormMessage(
          typeof firstFieldError === "string"
            ? firstFieldError
            : data?.error || "Influencer creation failed.",
        );
        setFieldErrors(nextFieldErrors);
        return;
      }

      setCreatedInfluencerId(data.influencer.id);
      if (isUpdateMode) {
        setFormMessage(`${data.influencer.displayName} updated. Social connections were preserved.`);
        router.refresh();
        return;
      }

      setFormMessage(`${data.influencer.displayName} created. Generating reference images...`);
      setIsGeneratingImages(true);

      const imageResponse = await fetch(`/api/virtual-influencers/${data.influencer.id}/generate-images`, {
        method: "POST",
      });
      const imageData = await imageResponse.json();

      if (!imageResponse.ok) {
        setFormMessage(imageData?.error || "Influencer created, but image generation failed.");
        return;
      }

      setGeneratedProfileUrl(imageData.influencer?.profileImageUrl || null);
      setGeneratedBodyUrl(imageData.influencer?.bodyReferenceImageUrl || null);
      setFormMessage(`${data.influencer.displayName} created with reference images.`);
      router.refresh();
    } catch {
      setFormMessage("Unable to contact the server.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingImages(false);
    }
  }

  async function regenerateImages() {
    if (!initialInfluencer?.id) return;

    const confirmed = window.confirm(
      "Regenerate reference images? This will replace the current profile and body reference images.",
    );

    if (!confirmed) return;

    setIsGeneratingImages(true);
    setFormMessage("Regenerating reference images...");

    try {
      const response = await fetch(`/api/virtual-influencers/${initialInfluencer.id}/generate-images`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setFormMessage(data?.error || "Image regeneration failed.");
        return;
      }

      setGeneratedProfileUrl(data.influencer?.profileImageUrl || null);
      setGeneratedBodyUrl(data.influencer?.bodyReferenceImageUrl || null);
      setFormMessage("Reference images regenerated.");
      router.refresh();
    } catch {
      setFormMessage("Unable to contact the image generation service.");
    } finally {
      setIsGeneratingImages(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[34px] border border-white/80 bg-white/65 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="relative min-h-[360px] bg-gradient-to-br from-[#fdfcff] via-[#f7f1fb] to-[#E6E8FA]/45 p-8">
            <div className="absolute inset-x-8 bottom-0 h-56 rounded-t-full bg-[#C9A0CD]/15 blur-3xl" />
            <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-[28px] border border-white/70 bg-white/45">
              {generatedProfileUrl ? (
                <img
                  src={generatedProfileUrl}
                  alt={`${previewName} profile`}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <UserRound size={90} className="text-[#8d5f9e]/40" />
              )}
              {isGeneratingImages && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md">
                  <Sparkles size={28} className="animate-pulse text-[#8d5f9e]" />
                  <span className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#8d5f9e]">
                    Generating profile
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">@{previewUsername}</p>
            <h2 className="mt-3 font-serif text-5xl italic leading-none text-[#1C1C1C]">{previewName}</h2>
            <p className="mt-5 text-sm leading-7 text-stone-500">{values.bio || "Bio preview will appear here while you shape the agent."}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {preferredCategories.map((category) => (
                <span key={category} className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                  {category}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-white/65 p-5 ring-1 ring-stone-100">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Prompt base</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {values.promptContext || "The prompt context will become the reusable creative memory for image and post generation."}
              </p>
            </div>

            {(generatedProfileUrl || generatedBodyUrl || createdInfluencerId) && (
              <div className="mt-4 grid gap-3 rounded-3xl bg-[#FDFBFF]/80 p-4 ring-1 ring-stone-100">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                  Creation result
                </p>
                {createdInfluencerId && (
                  <p className="text-sm font-semibold text-stone-600">Agent #{createdInfluencerId} saved in database.</p>
                )}
                {generatedBodyUrl && (
                  <a
                    href={generatedBodyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-[#8d5f9e] hover:underline"
                  >
                    Open body reference
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        {formMessage && !formMessage.includes("created") && !formMessage.includes("updated") && (
          <div className="rounded-[28px] border border-red-100 bg-red-50/90 p-5 text-sm font-semibold leading-7 text-red-600 shadow-xl shadow-red-900/5">
            {formMessage}
          </div>
        )}

        {isUpdateMode && hasConnectedPlatform && (
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/90 p-5 text-sm font-semibold leading-7 text-emerald-700 shadow-xl shadow-emerald-900/5">
            This agent already has a connected social account. Update mode preserves tokens, publishing access and connection status.
          </div>
        )}

        <div className="rounded-[34px] border border-white/80 bg-white/65 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <UserRound size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Identity</p>
              <h3 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">Core profile</h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["firstName", "First name", "Maya"],
              ["lastName", "Last name", "Voss"],
              ["displayName", "Display name", "Maya Voss"],
              ["username", "Username", "maya.violetbeam"],
              ["emailAlias", "Email alias", "maya@violetbeam.com"],
              ["instagramHandle", "Instagram handle", "mayavioletmodel"],
              ["tiktokHandle", "TikTok handle", "maya.violetbeam"],
            ].map(([name, label, placeholder]) => (
              <label key={name} className={cn(name === "bio" && "sm:col-span-2")}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{label}</span>
                <input
                  value={values[name as keyof FormValues] as string}
                  onChange={(event) => updateValue(name as keyof FormValues, event.target.value)}
                  placeholder={placeholder}
                  className="mt-2 h-12 w-full rounded-2xl border border-stone-100 bg-white/75 px-4 text-sm font-semibold text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
                />
                <FieldError message={fieldErrors[name as keyof FormValues]} />
              </label>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Bio</span>
            <textarea
              value={values.bio}
              onChange={(event) => updateValue("bio", event.target.value)}
              placeholder="Virtual fashion creator exploring soft luxury, clean silhouettes and everyday elegance."
              rows={4}
              className="mt-2 w-full resize-none rounded-3xl border border-stone-100 bg-white/75 px-4 py-4 text-sm font-semibold leading-7 text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
            />
            <FieldError message={fieldErrors.bio} />
          </label>
        </div>

        <div className="rounded-[34px] border border-white/80 bg-white/65 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <Shirt size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Direction</p>
              <h3 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">Fashion modules</h3>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              ["fashionStyle", "Fashion style", "quiet luxury, minimal tailoring, soft purple accents"],
              ["targetAudience", "Target audience", "women 22-35 interested in premium everyday fashion"],
            ].map(([name, label, placeholder]) => (
              <label key={name}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{label}</span>
                <textarea
                  value={values[name as keyof FormValues] as string}
                  onChange={(event) => updateValue(name as keyof FormValues, event.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-3xl border border-stone-100 bg-white/75 px-4 py-4 text-sm font-semibold leading-7 text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
                />
                <FieldError message={fieldErrors[name as keyof FormValues]} />
              </label>
            ))}

            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Preferred categories</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const isActive = preferredCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.16em] ring-1 transition",
                        isActive
                          ? "bg-[#8d5f9e] text-white ring-[#8d5f9e]/20"
                          : "bg-white text-stone-500 ring-stone-100 hover:text-[#8d5f9e]",
                      )}
                    >
                      {isActive && <Check size={12} />}
                      {category}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="custom category"
                  className="h-11 flex-1 rounded-2xl border border-stone-100 bg-white/75 px-4 text-sm font-semibold outline-none focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
                />
                <button
                  type="button"
                  onClick={addCustomCategory}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#1C1C1C] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#8d5f9e]"
                >
                  <Plus size={13} />
                  Add
                </button>
              </div>
              <FieldError message={fieldErrors.preferredCategories} />
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-white/80 bg-white/65 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <Palette size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Visual DNA</p>
              <h3 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">Morphology</h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Height in cm</span>
              <input
                type="number"
                value={values.height}
                onChange={(event) => updateValue("height", event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-stone-100 bg-white/75 px-4 text-sm font-semibold outline-none focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
              />
              <FieldError message={fieldErrors.height} />
            </label>

            {selectModules.map((module) => {
              const Icon = module.icon;
              const name = module.name as keyof FormValues;

              return (
                <div key={module.name}>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                    <Icon size={13} className="text-[#8d5f9e]" />
                    {module.label}
                  </span>
                  <select
                    value={values[name] as string}
                    onChange={(event) => updateValue(name, event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-stone-100 bg-white/75 px-4 text-sm font-semibold text-[#1C1C1C] outline-none focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
                  >
                    {module.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    value={customValues[name] || ""}
                    onChange={(event) => setCustomValues((current) => ({ ...current, [name]: event.target.value }))}
                    placeholder={`Custom ${module.label.toLowerCase()}...`}
                    className="mt-2 h-11 w-full rounded-2xl border border-stone-100 bg-[#FDFBFF]/75 px-4 text-sm font-semibold outline-none focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
                  />
                  <FieldError message={fieldErrors[name]} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[34px] border border-white/80 bg-white/65 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <Bot size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">AI memory</p>
              <h3 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">Prompt context</h3>
            </div>
          </div>

          <label>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Reusable context</span>
            <textarea
              value={values.promptContext}
              onChange={(event) => updateValue("promptContext", event.target.value)}
              placeholder="Maya is a virtual fashion influencer for VioletBeam. She creates refined editorial looks with quiet luxury, minimal tailoring and a polished modern attitude."
              rows={5}
              className="mt-2 w-full resize-none rounded-3xl border border-stone-100 bg-white/75 px-4 py-4 text-sm font-semibold leading-7 text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
            />
            <FieldError message={fieldErrors.promptContext} />
          </label>

          <label className="mt-5 flex items-center justify-between gap-4 rounded-3xl bg-[#FDFBFF]/80 p-4 ring-1 ring-stone-100">
            <span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
                <BadgeCheck size={14} />
                AI disclosure
              </span>
              <span className="mt-1 block text-sm font-semibold text-stone-500">Mark this profile as a virtual AI creator.</span>
            </span>
            <input
              type="checkbox"
              checked={values.isAiDisclosed}
              onChange={(event) => updateValue("isAiDisclosed", event.target.checked)}
              className="size-5 accent-[#8d5f9e]"
            />
          </label>
        </div>

        <div className="sticky bottom-5 z-10 rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-purple-900/10 backdrop-blur-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
                <Mail size={16} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  {isUpdateMode ? "Update agent" : "Create draft agent"}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    formMessage?.includes("created with reference images") ||
                    formMessage?.includes("updated") ||
                    formMessage?.includes("regenerated")
                      ? "text-emerald-600"
                      : formMessage?.includes("failed")
                        ? "text-red-500"
                        : "text-stone-500",
                  )}
                >
                  {formMessage ||
                    (isUpdateMode
                      ? "Profile edits will keep Instagram and TikTok connections intact."
                      : "After creation, reference images are generated automatically.")}
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingImages}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#8d5f9e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingImages
                ? "Generating images..."
                : isSubmitting
                  ? isUpdateMode
                    ? "Updating..."
                    : "Creating..."
                  : isUpdateMode
                    ? "Update agent"
                    : "Create influencer"}
              <ArrowRight size={14} />
            </button>
            {isUpdateMode && (
              <button
                type="button"
                onClick={regenerateImages}
                disabled={isSubmitting || isGeneratingImages}
                className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#f7f1fb] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/25 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingImages ? "Regenerating..." : "Regenerate images"}
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      </section>
    </form>
  );
}
