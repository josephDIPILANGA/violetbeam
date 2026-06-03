export type CompositionItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  prompt: string;
  moduleId: string;
  moduleLabel: string;
  description?: string;
  price?: number | string;
  currency?: string;
  shopUrl?: string;
};

export type LookbookComposition = {
  id: string;
  sourceType: "composition" | "agentPost";
  href?: string;
  name: string;
  generatedUrl: string;
  thumbnailUrl: string | null;
  items: CompositionItem[];
  createdAt: string;
  userName: string | null;
  sourceLabel?: string;
};

export function normalizeCompositionItems(value: unknown): CompositionItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is CompositionItem => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as Partial<CompositionItem>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.brand === "string" &&
      typeof candidate.image === "string" &&
      typeof candidate.prompt === "string" &&
      typeof candidate.moduleId === "string" &&
      typeof candidate.moduleLabel === "string"
    );
  });
}
