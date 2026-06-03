import { Aperture, Camera, Footprints, Glasses, HatGlasses, Layers, Shirt, Sparkles, Sun, UserRound, Watch } from "lucide-react";

export type ArticleOption = {
  id: string;
  name: string;
  brand: string;
  image: string;
  prompt: string;
  description?: string;
  price?: number | string;
  currency?: string;
  shopUrl?: string;
  brandId?: number;
  brandSlug?: string;
  brandLogoUrl?: string;
  brandWebsiteUrl?: string;
  brandPopularity?: number;
  rating?: number;
  reviewCount?: number;
  shippingCountry?: string;
  shippingCountries?: string[];
  shippingPrice?: number | string;
  shippingCurrency?: string;
  freeShipping?: boolean;
  estimatedDeliveryMinDays?: number;
  estimatedDeliveryMaxDays?: number;
  isOnSale?: boolean;
  discountPercent?: number;
  colors?: string[];
  materials?: string[];
  styleTags?: string[];
  tags?: string[];
};

export type CatalogModule = {
  id: string;
  label: string;
  type: "article";
  iconName: string;
  accent: string;
  options: ArticleOption[];
};

export type CatalogArticle = ArticleOption & {
  moduleId: string;
  moduleLabel: string;
};

export const MODULE_ICON_MAP = {
  aperture: Aperture,
  camera: Camera,
  footprints: Footprints,
  glasses: Glasses,
  hatGlasses: HatGlasses,
  layers: Layers,
  shirt: Shirt,
  sparkles: Sparkles,
  sun: Sun,
  userRound: UserRound,
  watch: Watch,
};

export type ModuleIconName = keyof typeof MODULE_ICON_MAP;

type ModuleMeta = {
  label: string;
  iconName: ModuleIconName;
  accent: string;
};

const DEFAULT_ACCENT = "bg-gradient-to-br from-[#fbf9ff] via-[#efe7f6] to-[#e5e2de]";

export const CATALOG_MODULE_META: Record<string, ModuleMeta> = {
  shirts: {
    label: "Chemises",
    iconName: "shirt",
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#f3edf9] to-[#e7e4e0]",
  },
  pulls: {
    label: "Pulls",
    iconName: "layers",
    accent: "bg-gradient-to-br from-[#fcfaff] via-[#f0e8f6] to-[#e8e4df]",
  },
  bottoms: {
    label: "Pantalons",
    iconName: "layers",
    accent: "bg-gradient-to-br from-[#fbf8ff] via-[#eee6f5] to-[#e6e4df]",
  },
  caps: {
    label: "Casquettes",
    iconName: "hatGlasses",
    accent: "bg-gradient-to-br from-[#faf8ff] via-[#f1e9f7] to-[#e7e4e0]",
  },
  shoes: {
    label: "Chaussures",
    iconName: "footprints",
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#efe7f6] to-[#e5e2de]",
  },
  accessories: {
    label: "Accessoires",
    iconName: "watch",
    accent: "bg-gradient-to-br from-[#fcfaff] via-[#f2ebf8] to-[#e8e4df]",
  },
  dresses: {
    label: "Robes",
    iconName: "sparkles",
    accent: "bg-gradient-to-br from-[#fdf9ff] via-[#f2e6f5] to-[#e8e2e8]",
  },
  beauty: {
    label: "Beauté",
    iconName: "sparkles",
    accent: "bg-gradient-to-br from-[#fffaff] via-[#f3e8f5] to-[#e8e4df]",
  },
};

export const DUMMYJSON_CATEGORY_MODULE_MAP: Record<string, string> = {
  "mens-shirts": "shirts",
  tops: "shirts",
  "womens-dresses": "dresses",
  "womens-shoes": "shoes",
  "mens-shoes": "shoes",
  "womens-bags": "accessories",
  "womens-jewellery": "accessories",
  sunglasses: "accessories",
  "mens-watches": "accessories",
  "womens-watches": "accessories",
};

export function getModuleIdForSourceCategory(category: string) {
  return DUMMYJSON_CATEGORY_MODULE_MAP[category] ?? category.replace(/[^a-z0-9]+/g, "-");
}

export function getCatalogModuleMeta(moduleId: string): ModuleMeta {
  return (
    CATALOG_MODULE_META[moduleId] ?? {
      label: moduleId
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      iconName: "shirt",
      accent: DEFAULT_ACCENT,
    }
  );
}

export function slugifyCatalogText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function getArticleProductSlug(article: { id: number | string; title?: string | null; name?: string | null }) {
  const id = String(article.id).replace(/^db-/, "");
  const title = article.title || article.name || "article";
  const slug = slugifyCatalogText(title) || "article";

  return `${id}-${slug}`;
}

export function getArticleProductHref(article: { id: number | string; title?: string | null; name?: string | null }) {
  return `/catalog/${getArticleProductSlug(article)}`;
}

export function getArticleIdFromProductSlug(slug: string) {
  const id = Number.parseInt(slug.split("-")[0] || "", 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
