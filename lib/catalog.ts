import { Aperture, Camera, Footprints, Glasses, HatGlasses, Layers, Shirt, Sparkles, Sun, UserRound, Watch } from "lucide-react";
import type { Locale } from "@/lib/i18n";

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

type CategorySeoCopy = {
  label: string;
  title: string;
  description: string;
  intro: string;
};

const DEFAULT_ACCENT = "bg-gradient-to-br from-[#fbf9ff] via-[#efe7f6] to-[#e5e2de]";

export const CATALOG_MODULE_META: Record<string, ModuleMeta> = {
  shirts: {
    label: "Hauts",
    iconName: "shirt",
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#f3edf9] to-[#e7e4e0]",
  },
  pulls: {
    label: "Pulls",
    iconName: "layers",
    accent: "bg-gradient-to-br from-[#fcfaff] via-[#f0e8f6] to-[#e8e4df]",
  },
  outerwear: {
    label: "Vestes",
    iconName: "layers",
    accent: "bg-gradient-to-br from-[#fbf8ff] via-[#eee8f4] to-[#e7e4df]",
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
  "fitness-equipment": {
    label: "Equipement sport",
    iconName: "layers",
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#eeeef8] to-[#e4e8df]",
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

const CATEGORY_SEO_COPY: Record<string, Record<Locale, CategorySeoCopy>> = {
  accessories: {
    fr: {
      label: "Accessoires",
      title: "Accessoires mode essayables en ligne",
      description: "Explorez les accessoires VioletBeam : montres, sacs, lunettes et bijoux a essayer dans la cabine IA.",
      intro: "Montres, lunettes, sacs et bijoux : retrouvez les accessoires qui finalisent un look et envoyez-les directement dans la cabine VioletBeam.",
    },
    en: {
      label: "Accessories",
      title: "Try-on ready fashion accessories",
      description: "Explore VioletBeam accessories including watches, bags, sunglasses, and jewelry ready for AI try-on.",
      intro: "Watches, sunglasses, bags, and jewelry: discover accessories that complete a look and send them directly to the VioletBeam cabine.",
    },
  },
  shirts: {
    fr: {
      label: "Hauts",
      title: "Hauts, t-shirts et chemises a essayer",
      description: "Parcourez les hauts, t-shirts, chemises et tops disponibles sur VioletBeam avec essayage virtuel IA.",
      intro: "T-shirts, chemises, polos et brassieres : comparez les hauts par marque, style et prix avant de les essayer virtuellement.",
    },
    en: {
      label: "Tops",
      title: "Tops, t-shirts, and shirts to try on",
      description: "Browse tops, t-shirts, shirts, and polos available on VioletBeam with AI virtual try-on.",
      intro: "T-shirts, shirts, polos, and sports bras: compare tops by brand, style, and price before trying them virtually.",
    },
  },
  bottoms: {
    fr: {
      label: "Pantalons",
      title: "Pantalons, shorts et bas de tenue",
      description: "Decouvrez les pantalons, shorts et bas de tenue disponibles dans le catalogue VioletBeam.",
      intro: "Pantalons, shorts et bas habilles : trouvez la coupe qui complete votre silhouette et testez-la dans la cabine.",
    },
    en: {
      label: "Bottoms",
      title: "Pants, shorts, and outfit bottoms",
      description: "Discover pants, shorts, and outfit bottoms available in the VioletBeam catalog.",
      intro: "Pants, shorts, and tailored bottoms: find the piece that completes your silhouette and test it in the cabine.",
    },
  },
  shoes: {
    fr: {
      label: "Chaussures",
      title: "Chaussures et sneakers a essayer",
      description: "Explorez les chaussures, sneakers, sandales et modeles createurs disponibles sur VioletBeam.",
      intro: "Sneakers, sandales et chaussures createur : parcourez les modeles par marque et associez-les a vos looks VioletBeam.",
    },
    en: {
      label: "Shoes",
      title: "Shoes and sneakers to try on",
      description: "Explore shoes, sneakers, sandals, and designer footwear available on VioletBeam.",
      intro: "Sneakers, sandals, and designer shoes: browse styles by brand and pair them with your VioletBeam looks.",
    },
  },
  "fitness-equipment": {
    fr: {
      label: "Equipement sport",
      title: "Equipement sport et fitness",
      description: "Retrouvez l'equipement sport et fitness disponible sur VioletBeam : accessoires, gants, cordes et materiel d'entrainement.",
      intro: "Accessoires fitness, gants, cordes et materiel d'entrainement : une selection utile pour completer les looks sport et lifestyle.",
    },
    en: {
      label: "Fitness equipment",
      title: "Sports and fitness equipment",
      description: "Find sports and fitness equipment on VioletBeam including accessories, gloves, ropes, and training gear.",
      intro: "Fitness accessories, gloves, ropes, and training gear: a practical selection for sport and lifestyle looks.",
    },
  },
  pulls: {
    fr: {
      label: "Pulls",
      title: "Pulls, sweats et mailles",
      description: "Parcourez les pulls, sweats et pieces en maille disponibles dans le catalogue VioletBeam.",
      intro: "Pulls, sweats et mailles : trouvez des pieces faciles a superposer pour construire un look plus complet.",
    },
    en: {
      label: "Knitwear",
      title: "Knitwear, sweaters, and sweatshirts",
      description: "Browse knitwear, sweaters, and sweatshirts available in the VioletBeam catalog.",
      intro: "Sweaters, sweatshirts, and knitwear: find easy layering pieces to build a fuller outfit.",
    },
  },
  outerwear: {
    fr: {
      label: "Vestes",
      title: "Vestes, manteaux et outerwear",
      description: "Decouvrez les vestes, manteaux et pieces outerwear disponibles sur VioletBeam avec essayage IA.",
      intro: "Vestes, manteaux et pieces de saison : explorez les volumes, matieres et marques avant de composer votre tenue.",
    },
    en: {
      label: "Outerwear",
      title: "Jackets, coats, and outerwear",
      description: "Discover jackets, coats, and outerwear pieces available on VioletBeam with AI try-on.",
      intro: "Jackets, coats, and seasonal layers: explore shapes, materials, and brands before building your outfit.",
    },
  },
  dresses: {
    fr: {
      label: "Robes",
      title: "Robes a essayer virtuellement",
      description: "Explorez les robes disponibles dans VioletBeam et preparez vos looks avec la cabine IA.",
      intro: "Robes courtes, longues ou habillees : comparez les silhouettes et envoyez vos coups de coeur dans la cabine.",
    },
    en: {
      label: "Dresses",
      title: "Dresses to try virtually",
      description: "Explore dresses available on VioletBeam and prepare your looks with the AI cabine.",
      intro: "Short, long, and dressy silhouettes: compare styles and send your favorites to the cabine.",
    },
  },
  caps: {
    fr: {
      label: "Casquettes",
      title: "Casquettes et couvre-chefs",
      description: "Parcourez les casquettes et couvre-chefs disponibles dans le catalogue VioletBeam.",
      intro: "Casquettes et couvre-chefs : des details simples pour changer l'attitude d'un look.",
    },
    en: {
      label: "Caps",
      title: "Caps and headwear",
      description: "Browse caps and headwear available in the VioletBeam catalog.",
      intro: "Caps and headwear: simple details that can shift the whole attitude of a look.",
    },
  },
  beauty: {
    fr: {
      label: "Beaute",
      title: "Selection beaute",
      description: "Explorez la selection beaute disponible dans le catalogue VioletBeam.",
      intro: "Une selection beaute pour accompagner vos inspirations mode et completer vos routines style.",
    },
    en: {
      label: "Beauty",
      title: "Beauty selection",
      description: "Explore the beauty selection available in the VioletBeam catalog.",
      intro: "A beauty selection to support your fashion inspiration and complete your style routine.",
    },
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

function getFallbackCategoryLabel(moduleId: string) {
  return moduleId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCatalogModuleMeta(moduleId: string, locale: Locale = "fr"): ModuleMeta {
  const seoCopy = CATEGORY_SEO_COPY[moduleId]?.[locale];
  const baseMeta =
    CATALOG_MODULE_META[moduleId] ?? {
      label: getFallbackCategoryLabel(moduleId),
      iconName: "shirt",
      accent: DEFAULT_ACCENT,
    };

  return {
    ...baseMeta,
    label: seoCopy?.label ?? baseMeta.label,
  };
}

export function getCategorySeoMeta(moduleId: string, locale: Locale = "fr") {
  const meta = getCatalogModuleMeta(moduleId, locale);
  const copy = CATEGORY_SEO_COPY[moduleId]?.[locale];

  return {
    label: meta.label,
    iconName: meta.iconName,
    accent: meta.accent,
    title: copy?.title ?? meta.label,
    description:
      copy?.description ??
      (locale === "fr"
        ? `Explorez les articles ${meta.label.toLowerCase()} disponibles dans le catalogue VioletBeam et essayez-les dans la cabine IA.`
        : `Explore ${meta.label.toLowerCase()} articles available in the VioletBeam catalog and try them in the AI cabine.`),
    intro:
      copy?.intro ??
      (locale === "fr"
        ? `Decouvrez les articles de cette categorie et envoyez vos pieces preferees directement dans la cabine VioletBeam.`
        : `Discover articles in this category and send your favorite pieces directly to the VioletBeam cabine.`),
  };
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
