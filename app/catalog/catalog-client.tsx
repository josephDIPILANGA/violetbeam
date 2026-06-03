"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgePercent, Clock3, ExternalLink, Filter, Search, Shirt, Sparkles, Star, Store, Tag, Truck, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getArticleProductHref, type CatalogArticle } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type CatalogClientProps = {
  articles: CatalogArticle[];
  brands: {
    id: string;
    name: string;
    popularity?: number;
    count: number;
  }[];
  categories: {
    id: string;
    label: string;
  }[];
  shippingCountries: {
    id: string;
    label: string;
    count: number;
  }[];
  filters: CatalogFilters;
  pagination: {
    currentPage: number;
    pageCount: number;
    pageSize: number;
    totalArticles: number;
  };
};

type CatalogFilters = {
  q?: string;
  category?: string;
  brand?: string;
  shippingCountry?: string;
  freeShipping?: boolean;
  minRating?: number;
  onSale?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "top-rated" | "delivery-fast";
};

function formatPrice(price: number | string | undefined, currency = "USD") {
  if (typeof price === "number") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  }

  return price || "Prix à venir";
}

function formatRating(article: CatalogArticle) {
  if (typeof article.rating !== "number") return null;

  const reviewText =
    typeof article.reviewCount === "number" && article.reviewCount > 0
      ? ` (${article.reviewCount})`
      : "";

  return `${article.rating.toFixed(1)}${reviewText}`;
}

function formatDelivery(article: CatalogArticle) {
  if (!article.estimatedDeliveryMinDays && !article.estimatedDeliveryMaxDays) return null;

  if (article.estimatedDeliveryMinDays && article.estimatedDeliveryMaxDays) {
    return `${article.estimatedDeliveryMinDays}-${article.estimatedDeliveryMaxDays} days`;
  }

  return `${article.estimatedDeliveryMinDays || article.estimatedDeliveryMaxDays} days`;
}

function getCatalogPageHref(page: number, filters: CatalogFilters = {}) {
  const pathname = page <= 1 ? "/catalog" : `/catalog/page/${page}`;
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.shippingCountry) params.set("shippingCountry", filters.shippingCountry);
  if (filters.freeShipping) params.set("freeShipping", "1");
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.onSale) params.set("onSale", "1");
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getTryOnHref(article: CatalogArticle) {
  const params = new URLSearchParams({
    module: article.moduleId,
    article: article.id,
  });

  return `/cabine?${params.toString()}`;
}

function getProductHref(article: CatalogArticle) {
  return getArticleProductHref(article);
}

function ProductBenefits({ article, compact = false }: { article: CatalogArticle; compact?: boolean }) {
  const rating = formatRating(article);
  const delivery = formatDelivery(article);
  const benefits = [
    article.isOnSale && article.discountPercent ? `-${article.discountPercent}%` : null,
    rating ? `Rated ${rating}` : null,
    article.freeShipping ? "Free shipping" : null,
    article.shippingCountry ? `Ships from ${article.shippingCountry}` : null,
    delivery ? `Delivery ${delivery}` : null,
  ].filter(Boolean);

  if (benefits.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "mt-4" : "mt-5")}>
      {benefits.slice(0, compact ? 3 : 6).map((benefit) => (
        <span
          key={benefit}
          className={cn(
            "rounded-full px-3 py-1.5 font-black uppercase tracking-[0.16em] ring-1",
            compact ? "text-[8px]" : "text-[9px]",
            String(benefit).startsWith("-")
              ? "bg-rose-50 text-rose-500 ring-rose-100"
              : String(benefit).startsWith("Rated")
                ? "bg-amber-50 text-amber-600 ring-amber-100"
                : "bg-white/80 text-stone-500 ring-stone-100",
          )}
        >
          {benefit}
        </span>
      ))}
    </div>
  );
}

function ProductCard({
  article,
  featured = false,
  onOpen,
}: {
  article: CatalogArticle;
  featured?: boolean;
  onOpen: (article: CatalogArticle) => void;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden border border-white/70 bg-white/60 transition-all duration-700 hover:bg-white/90 hover:shadow-2xl hover:shadow-purple-900/10",
        featured ? "grid min-h-[560px] rounded-[40px] md:grid-cols-[1.1fr_0.9fr]" : "flex flex-col rounded-[32px] hover:-translate-y-2"
      )}
    >
      <div className={cn("relative overflow-hidden bg-[#f3edf9]", featured ? "min-h-[360px] md:min-h-full" : "aspect-[4/5] rounded-t-[32px]")}>
        {article.image ? (
          <img
            src={article.image}
            alt={article.name}
            className="h-full w-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/60">
            <Shirt size={42} strokeWidth={1.2} />
          </div>
        )}

        <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
          <Sparkles size={12} className="text-purple-300" />
          {article.moduleLabel}
        </div>

        {!featured && (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#4f365f]/45 to-transparent p-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <Button asChild className="w-full rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-white">
              <Link href={getProductHref(article)}>Voir l&apos;article</Link>
            </Button>
          </div>
        )}
      </div>

      <div className={cn("flex flex-col p-7", featured ? "justify-center md:p-10" : "flex-1")}>
        <header>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
            <Tag size={12} />
            {formatPrice(article.price, article.currency)}
          </div>
          <h2 className={cn("font-serif italic leading-[1.05] text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]", featured ? "text-6xl lg:text-7xl" : "truncate text-3xl")}>
            {article.name}
          </h2>
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-stone-400">
            {article.brand || "Cabine Market"}
          </p>
          {typeof article.brandPopularity === "number" && article.brandPopularity > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/20">
              <Star size={11} className="fill-[#8d5f9e]" />
              {article.brandPopularity.toFixed(1)}
            </div>
          )}
          <ProductBenefits article={article} compact={!featured} />
          <p className={cn("mt-5 leading-6 text-stone-500", featured ? "text-base" : "line-clamp-2 text-sm")}>
            {article.description || article.prompt || "Description à venir."}
          </p>
        </header>

        <div className="mt-auto pt-7">
          <div className="mb-5 h-[1px] w-full bg-gradient-to-r from-[#C9A0CD]/40 via-stone-200 to-transparent" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 flex-1 rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
              <Link href={getProductHref(article)}>
                Voir l&apos;article
                <ArrowUpRight size={15} />
              </Link>
            </Button>
            {article.shopUrl ? (
              <Button asChild className="h-12 flex-1 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.22em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <a href={article.shopUrl} target="_blank" rel="noreferrer">
                  Boutique
                  <ExternalLink size={14} />
                </a>
              </Button>
            ) : (
              <Button disabled className="h-12 flex-1 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.22em] text-stone-300 ring-1 ring-stone-200">
                Boutique
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductModal({
  article,
  onClose,
}: {
  article: CatalogArticle;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1C1C1C]/45 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fermer le détail produit" />

      <section className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/80 bg-[#FDFBFF]/95 shadow-2xl shadow-purple-950/20 md:grid-cols-[0.95fr_1.05fr]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex size-11 items-center justify-center rounded-full bg-white/85 text-[#1C1C1C] shadow-lg backdrop-blur-xl transition-colors hover:bg-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[360px] overflow-hidden bg-[#eee7f4] md:min-h-[700px]">
          {article.image ? (
            <img src={article.image} alt={article.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/60">
              <Shirt size={54} strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1C1C1C]/55 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur-xl ring-1 ring-white/25">
              <Sparkles size={13} className="text-purple-200" />
              {article.moduleLabel}
            </div>
            <h2 className="font-serif text-5xl italic leading-none text-white md:text-7xl">{article.name}</h2>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
              {article.brand || "Cabine Market"}
            </p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-6 md:p-10">
          <header className="mb-8 pr-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#8d5f9e]">
              <Tag size={13} />
              {formatPrice(article.price, article.currency)}
            </div>
            <h3 className="font-serif text-5xl italic leading-none text-[#1C1C1C]">{article.name}</h3>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.25em] text-stone-400">
              {article.brand || "Cabine Market"} — {article.moduleLabel}
            </p>
          </header>

          <div className="rounded-[32px] border border-white/80 bg-white/65 p-6 shadow-sm">
            <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Description</h4>
            <p className="text-base leading-8 text-stone-600">
              {article.description || article.prompt || "Description à venir."}
            </p>
          </div>

          <ProductBenefits article={article} />

          <div className="mt-5 rounded-[32px] border border-white/80 bg-white/65 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Marque</h4>
                <p className="truncate font-serif text-4xl italic leading-none text-[#1C1C1C]">
                  {article.brand || "Cabine Market"}
                </p>
                {article.brandWebsiteUrl && (
                  <a
                    href={article.brandWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-[#8d5f9e]"
                  >
                    Site officiel
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#8d5f9e]/10 text-[#8d5f9e]">
                {article.brandLogoUrl ? (
                  <img src={article.brandLogoUrl} alt={article.brand} className="size-full rounded-full object-cover" />
                ) : (
                  <Star size={22} className={cn(typeof article.brandPopularity === "number" && article.brandPopularity > 0 && "fill-current")} />
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f7f1fb] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
                <Star size={11} className={cn(typeof article.brandPopularity === "number" && article.brandPopularity > 0 && "fill-current")} />
                {typeof article.brandPopularity === "number" && article.brandPopularity > 0 ? article.brandPopularity.toFixed(1) : "popularité à venir"}
              </span>
              {article.brandSlug && (
                <span className="rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 ring-1 ring-stone-200">
                  {article.brandSlug}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Button asChild className="h-14 rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
              <Link href={getTryOnHref(article)}>
                Try On
                <ArrowUpRight size={16} />
              </Link>
            </Button>

            {article.shopUrl ? (
              <Button asChild className="h-14 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.24em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <a href={article.shopUrl} target="_blank" rel="noreferrer">
                  Acheter
                  <ExternalLink size={15} />
                </a>
              </Button>
            ) : (
              <Button disabled className="h-14 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.24em] text-stone-300 ring-1 ring-stone-200">
                <Store size={15} />
                Lien à venir
              </Button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#8d5f9e]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
              {article.moduleLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 ring-1 ring-stone-200">
              <Star size={11} className={cn(typeof article.brandPopularity === "number" && article.brandPopularity > 0 && "fill-[#8d5f9e] text-[#8d5f9e]")} />
              {typeof article.brandPopularity === "number" && article.brandPopularity > 0 ? article.brandPopularity.toFixed(1) : "popularité à venir"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 ring-1 ring-stone-200">
              {article.id}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CatalogClient({ articles, brands, categories, shippingCountries, filters, pagination }: CatalogClientProps) {
  const [activeArticle, setActiveArticle] = useState<CatalogArticle | null>(null);
  const [draftFilters, setDraftFilters] = useState<CatalogFilters>(filters);
  const filterSliderRef = useRef<HTMLDivElement | null>(null);

  const isSearchMode = Boolean(
    filters.q ||
      filters.category ||
      filters.brand ||
      filters.shippingCountry ||
      filters.freeShipping ||
      filters.minRating ||
      filters.onSale ||
      (filters.sort && filters.sort !== "newest"),
  );
  const featuredArticle = articles[0];
  const galleryArticles = isSearchMode ? articles : articles.filter((article) => article.id !== featuredArticle?.id);
  const selectedCategory = categories.find((entry) => entry.id === filters.category);
  const selectedBrand = brands.find((entry) => entry.id === filters.brand || entry.name === filters.brand);
  const searchTitle =
    filters.q ||
    selectedCategory?.label ||
    selectedBrand?.name ||
    (filters.shippingCountry ? `Ships from ${filters.shippingCountry}` : "") ||
    (filters.freeShipping ? "Free shipping" : "") ||
    (filters.onSale ? "Best deals" : "") ||
    (filters.minRating ? "Top rated" : "") ||
    "Résultats filtrés";
  const firstVisibleArticle = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const lastVisibleArticle = Math.min(
    (pagination.currentPage - 1) * pagination.pageSize + articles.length,
    pagination.totalArticles,
  );
  const primaryShippingCountry = shippingCountries[0]?.id;
  const benefitFilters = [
    {
      label: "Best deals",
      description: "Discounted pieces",
      active: Boolean(draftFilters.onSale),
      icon: BadgePercent,
      onClick: () => setDraftFilters((current) => ({ ...current, onSale: current.onSale ? undefined : true })),
    },
    {
      label: "Free shipping",
      description: "No delivery fee",
      active: Boolean(draftFilters.freeShipping),
      icon: Truck,
      onClick: () => setDraftFilters((current) => ({ ...current, freeShipping: current.freeShipping ? undefined : true })),
    },
    {
      label: "Top rated",
      description: "4+ stars first",
      active: draftFilters.minRating === 4,
      icon: Star,
      onClick: () =>
        setDraftFilters((current) => ({
          ...current,
          minRating: current.minRating === 4 ? undefined : 4,
          sort: current.minRating === 4 ? "newest" : "top-rated",
        })),
    },
    {
      label: "Fast delivery",
      description: "Shortest ETA",
      active: draftFilters.sort === "delivery-fast",
      icon: Clock3,
      onClick: () =>
        setDraftFilters((current) => ({
          ...current,
          sort: current.sort === "delivery-fast" ? "newest" : "delivery-fast",
        })),
    },
    primaryShippingCountry
      ? {
          label: `Ships from ${primaryShippingCountry}`,
          description: "Local stock",
          active: draftFilters.shippingCountry === primaryShippingCountry,
          icon: Store,
          onClick: () =>
            setDraftFilters((current) => ({
              ...current,
              shippingCountry: current.shippingCountry === primaryShippingCountry ? undefined : primaryShippingCountry,
            })),
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    description: string;
    active: boolean;
    icon: typeof BadgePercent;
    onClick: () => void;
  }>;

  const scrollFilters = (direction: "left" | "right") => {
    filterSliderRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C] font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Inter:wght@400;700;900&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .catalog-filter-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .catalog-filter-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <section className="sticky top-16 z-[100] border-b border-white/70 bg-white/70 shadow-[0_18px_50px_-32px_rgba(92,54,118,0.55)] backdrop-blur-2xl">
        <form action="/catalog" className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:px-10">
          {draftFilters.freeShipping ? <input type="hidden" name="freeShipping" value="1" /> : null}
          {draftFilters.onSale ? <input type="hidden" name="onSale" value="1" /> : null}
          {draftFilters.minRating ? <input type="hidden" name="minRating" value={String(draftFilters.minRating)} /> : null}

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute left-5 top-1/2 flex -translate-y-1/2 items-center gap-3 border-r border-stone-200 pr-3">
                <Search className="text-[#8d5f9e]" size={18} strokeWidth={2.5} />
              </div>
              <Input
                name="q"
                defaultValue={filters.q || ""}
                placeholder="RECHERCHER UN ARTICLE, UNE MARQUE..."
                className="h-12 w-full rounded-full border-white/70 bg-white/60 pl-16 pr-6 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-2xl transition-all focus:border-[#C9A0CD] focus:ring-2 focus:ring-[#C9A0CD]/20"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="submit" className="h-12 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]">
                Apply filters
              </Button>
              <Button asChild className="h-12 rounded-full bg-white/60 px-5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl hover:bg-white/75">
                <Link href="/catalog">Reset</Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollFilters("left")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-[#8d5f9e] shadow-sm ring-1 ring-white/80 transition-colors hover:bg-white"
              aria-label="Faire glisser les filtres vers la gauche"
            >
              <ArrowLeft size={15} />
            </button>

            <div ref={filterSliderRef} className="catalog-filter-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth">
              {benefitFilters.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <button
                    key={benefit.label}
                    type="button"
                    onClick={benefit.onClick}
                    className={cn(
                      "group inline-flex h-11 min-w-[190px] shrink-0 items-center gap-3 rounded-full border px-3 transition-all duration-300",
                      benefit.active
                        ? "border-[#8d5f9e]/30 bg-[#8d5f9e] text-white shadow-lg shadow-purple-900/10"
                        : "border-white/70 bg-white/60 text-[#1C1C1C] backdrop-blur-2xl hover:bg-white/75",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                        benefit.active ? "bg-white/15 text-white" : "bg-[#f7f1fb] text-[#8d5f9e] group-hover:bg-[#8d5f9e] group-hover:text-white",
                      )}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[9px] font-black uppercase tracking-[0.16em]">
                        {benefit.label}
                      </span>
                      <span className={cn("block truncate text-[10px] font-semibold", benefit.active ? "text-white/75" : "text-stone-400")}>
                        {benefit.description}
                      </span>
                    </span>
                  </button>
                );
              })}

              <select
                name="category"
                value={draftFilters.category || ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    category: event.target.value || undefined,
                  }))
                }
                className="h-11 min-w-[190px] shrink-0 rounded-full border border-white/70 bg-white/60 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 shadow-sm backdrop-blur-2xl outline-none focus:border-[#C9A0CD]"
              >
                <option value="">All categories</option>
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>

              <select
                name="brand"
                value={draftFilters.brand || ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    brand: event.target.value || undefined,
                  }))
                }
                className="h-11 min-w-[180px] shrink-0 rounded-full border border-white/70 bg-white/60 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 shadow-sm backdrop-blur-2xl outline-none focus:border-[#C9A0CD]"
              >
                <option value="">All brands</option>
                {brands.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>

              <select
                name="shippingCountry"
                value={draftFilters.shippingCountry || ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    shippingCountry: event.target.value || undefined,
                  }))
                }
                className="h-11 min-w-[185px] shrink-0 rounded-full border border-white/70 bg-white/60 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 shadow-sm backdrop-blur-2xl outline-none focus:border-[#C9A0CD]"
              >
                <option value="">Ships anywhere</option>
                {shippingCountries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label} ({entry.count})
                  </option>
                ))}
              </select>

              <select
                name="sort"
                value={draftFilters.sort || "newest"}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sort: event.target.value as CatalogFilters["sort"],
                  }))
                }
                className="h-11 min-w-[180px] shrink-0 rounded-full border border-white/70 bg-white/60 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 shadow-sm backdrop-blur-2xl outline-none focus:border-[#C9A0CD]"
              >
                <option value="newest">Curated order</option>
                <option value="top-rated">Highest rated</option>
                <option value="delivery-fast">Fastest delivery</option>
                <option value="price-asc">Lowest price</option>
                <option value="price-desc">Highest price</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => scrollFilters("right")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-[#8d5f9e] shadow-sm ring-1 ring-white/80 transition-colors hover:bg-white"
              aria-label="Faire glisser les filtres vers la droite"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </section>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {!isSearchMode && (
        <header className="mb-16 space-y-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8d5f9e] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8d5f9e]"></span>
                </span>
                Live Catalog
              </div>
              <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
                La Sélection <br /> <span className="text-[#8d5f9e]">Produit</span>
              </h1>
            </div>

            <Button asChild className="group h-16 rounded-full bg-[#1C1C1C] pl-8 pr-4 text-[11px] font-black uppercase tracking-[0.25em] text-white transition-all hover:bg-[#2a2a2a]">
              <Link href="/lookbook">
                Voir le lookbook
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-[#8d5f9e]">
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </Button>
          </div>

          {featuredArticle ? (
            <ProductCard article={featuredArticle} featured onOpen={setActiveArticle} />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
              <Shirt className="mb-6 text-[#8d5f9e]/50" size={36} />
              <h2 className="font-serif text-4xl italic text-stone-800">Aucun article</h2>
              <p className="mt-2 text-stone-400 font-medium">Importe un catalogue pour remplir cette page.</p>
            </div>
          )}
        </header>
        )}

        <section className="space-y-10">
          <div className={cn("flex flex-col gap-6", isSearchMode ? "pt-4" : "border-t border-stone-200 pt-12")}>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="font-serif text-5xl italic text-[#1C1C1C]">
                  {isSearchMode ? searchTitle : "Tous les articles"}
                </h2>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.1em] text-stone-500">
                  {isSearchMode
                    ? `${pagination.totalArticles} résultat${pagination.totalArticles > 1 ? "s" : ""} trouvé${pagination.totalArticles > 1 ? "s" : ""}`
                    : "Choisissez un article et essayez-le directement dans la cabine"}
                </p>
              </div>
            </div>

            {!isSearchMode && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              <Link
                href="/categories"
                className="shrink-0 rounded-full bg-white/70 px-5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-[#8d5f9e]"
              >
                Tous
              </Link>
              {categories.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/categories/${entry.id}`}
                  className="shrink-0 rounded-full bg-white/70 px-5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-[#8d5f9e]"
                >
                  {entry.label}
                </Link>
              ))}
            </div>
            )}

          </div>

          {galleryArticles.length > 0 ? (
            <>
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {galleryArticles.map((article) => (
                  <ProductCard key={article.id} article={article} onOpen={setActiveArticle} />
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
                    {pagination.totalArticles > 0
                      ? `Showing ${firstVisibleArticle}-${lastVisibleArticle} of ${pagination.totalArticles} articles`
                      : "Showing 0 articles"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    Page {pagination.currentPage} / {pagination.pageCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={getCatalogPageHref(Math.max(1, pagination.currentPage - 1), filters)}
                    aria-disabled={pagination.currentPage <= 1}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                      pagination.currentPage > 1
                        ? "bg-white text-[#8d5f9e] ring-[#C9A0CD]/25 hover:bg-[#f7f1fb]"
                        : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
                    )}
                  >
                    Previous
                  </Link>
                  <Link
                    href={getCatalogPageHref(Math.min(pagination.pageCount, pagination.currentPage + 1), filters)}
                    aria-disabled={pagination.currentPage >= pagination.pageCount}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                      pagination.currentPage < pagination.pageCount
                        ? "bg-[#1C1C1C] text-white ring-[#1C1C1C] hover:bg-[#8d5f9e]"
                        : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
                    )}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-stone-50/50">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
                <Filter className="text-stone-300" size={32} />
              </div>
              <h3 className="font-serif text-3xl italic text-stone-800">Aucun résultat</h3>
              <p className="mt-2 text-stone-400 font-medium">Essayez une autre recherche ou une autre catégorie.</p>
            </div>
          )}
        </section>
      </div>

      {activeArticle && (
        <ProductModal article={activeArticle} onClose={() => setActiveArticle(null)} />
      )}
    </main>
  );
}
