import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  Images,
  Search,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Truck,
  WandSparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getArticleProductHref, getCatalogModuleMeta } from "@/lib/catalog";
import { normalizeCompositionItems } from "@/lib/compositions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Fashion search engine, shoppable looks and AI try-on",
  description:
    "Find fashion products by style, brand, price, shipping and benefits, then use VioletBeam's AI try-on to preview the looks before buying.",
  alternates: {
    canonical: "/",
  },
};

const featureLinks = [
  {
    href: "/catalog",
    title: "Search products",
    text: "Trouvez les articles par style, marque, prix, livraison et avantages qui comptent vraiment.",
    icon: Shirt,
  },
  {
    href: "/lookbook",
    title: "Inspiration looks",
    text: "Explorez des compositions et posts IA pour voir comment les produits peuvent vivre ensemble.",
    icon: Images,
  },
  {
    href: "/cabine",
    title: "AI try-on",
    text: "Quand un article vous interesse, visualisez le rendu sur une silhouette avant d'acheter.",
    icon: WandSparkles,
  },
];

const steps = [
  "Search by style, brand or benefit",
  "Compare products and discover looks",
  "Try-on with AI before buying",
];

const quickSearches = [
  { label: "Dresses", href: "/catalog?q=dress" },
  { label: "Blazers", href: "/catalog?q=blazer" },
  { label: "Sneakers", href: "/catalog?q=sneakers" },
  { label: "Bags", href: "/catalog?q=bag" },
];

const benefitLinks = [
  { label: "Best deals", href: "/catalog?onSale=1&sort=newest", icon: BadgePercent },
  { label: "Free shipping", href: "/catalog?freeShipping=1&sort=newest", icon: Truck },
  { label: "Top rated", href: "/catalog?minRating=4&sort=top-rated", icon: Star },
  { label: "Fast delivery", href: "/catalog?sort=delivery-fast", icon: Zap },
];

async function loadHomePageData() {
  const compositionsQuery = prisma.composition.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      name: true,
      generatedUrl: true,
      thumbnailUrl: true,
      itemsSummary: true,
    },
  });
  const articlesQuery = prisma.article.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      imageUrls: true,
      brand: true,
      brandRef: {
        select: {
          name: true,
        },
      },
    },
  });

  type HomePageData = [Awaited<typeof compositionsQuery>, Awaited<typeof articlesQuery>];
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Home data request timed out")), 4500);
  });

  try {
    return await Promise.race([Promise.all([compositionsQuery, articlesQuery]), timeout]);
  } catch (error) {
    console.warn("Home data loading failed:", error instanceof Error ? error.message : error);
    return [[], []] as HomePageData;
  }
}

export default async function HomePage() {
  const [compositions, articles] = await loadHomePageData();

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C] font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[42%] w-[42%] rounded-full bg-[#E6E8FA]/45 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[52%] w-[32%] rounded-full bg-[#C9A0CD]/14 blur-[110px]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8d5f9e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8d5f9e]" />
            </span>
            Fashion search engine
          </div>

          <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
            VioletBeam
          </h1>
          <p className="mt-7 max-w-xl text-2xl font-medium leading-9 text-[#4f365f] md:text-3xl">
            Trouvez les articles qui vous correspondent vraiment.
          </p>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-500">
            Explorez la mode par style, marque, prix, livraison, notes et avantages. VioletBeam vous aide a chercher plus vite,
            comparer plus clairement, puis visualiser les looks avec l'essayage IA quand vous etes pret.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
              <Link href="/catalog">
                Search Products
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <Button asChild className="h-14 rounded-full bg-white px-7 text-[10px] font-black uppercase tracking-[0.24em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
              <Link href="/cabine">
                Try-On Studio
                <WandSparkles size={15} />
              </Link>
            </Button>
          </div>

          <form action="/catalog" className="mt-10 rounded-[32px] border border-white/80 bg-white/65 p-3 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8d5f9e]" size={18} strokeWidth={2.5} />
                <input
                  name="q"
                  placeholder="Search dresses, sneakers, bags, blazers..."
                  className="h-14 w-full rounded-full border border-white/80 bg-white/75 pl-14 pr-5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600 outline-none transition-colors focus:border-[#C9A0CD]"
                />
              </div>
              <Button type="submit" className="h-14 rounded-full bg-[#8d5f9e] px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#1C1C1C]">
                Find
                <SlidersHorizontal size={15} />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {benefitLinks.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <Link
                    key={benefit.label}
                    href={benefit.href}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white hover:text-[#8d5f9e]"
                  >
                    <Icon size={12} className={benefit.label === "Top rated" ? "fill-current" : ""} />
                    {benefit.label}
                  </Link>
                );
              })}
            </div>
          </form>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-[44px] border border-white/80 bg-white/45 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1400"
            alt="Fashion editorial model wearing a styled outfit"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/55 via-transparent to-white/10" />
          <div className="absolute left-8 right-8 top-8 rounded-[28px] border border-white/25 bg-white/20 p-5 text-white backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/75">Shopping assistant</p>
            <p className="mt-3 max-w-md font-serif text-4xl italic leading-none">Search first. Try-on when it matters.</p>
          </div>
          <div className="absolute bottom-8 left-8 right-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-[24px] border border-white/25 bg-white/15 p-4 text-white backdrop-blur-xl">
                <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/15 text-[10px] font-black">
                  0{index + 1}
                </span>
                <p className="text-[10px] font-black uppercase leading-5 tracking-[0.2em]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">Featured looks</p>
            <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">Looks pour s'inspirer</h2>
          </div>
          <Button asChild className="h-12 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
            <Link href="/lookbook">
              Browse looks
              <Images size={15} />
            </Link>
          </Button>
        </div>

        {compositions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {compositions.map((composition) => {
              const items = normalizeCompositionItems(composition.itemsSummary);

              return (
                <Link
                  key={composition.id}
                  href="/lookbook"
                  className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f3edf9]">
                    <img
                      src={composition.thumbnailUrl || composition.generatedUrl}
                      alt={composition.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-black/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                      {items.length} pieces
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-serif text-2xl italic leading-none text-[#1C1C1C] group-hover:text-[#8d5f9e]">
                      {composition.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-[32px] border border-dashed border-[#C9A0CD]/40 bg-white/50 px-6 text-center">
            <p className="text-sm font-semibold text-stone-400">Les compositions validees apparaitront ici.</p>
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">Product discovery</p>
            <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">Articles a comparer</h2>
          </div>
          <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
            <Link href="/catalog">
              Open catalog
              <Shirt size={15} />
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {quickSearches.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex h-10 items-center rounded-full bg-white/65 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/80 transition-colors hover:bg-white hover:text-[#8d5f9e]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {articles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {articles.map((article) => {
              const meta = getCatalogModuleMeta(article.category);

              return (
                <Link
                  key={article.id}
                  href={getArticleProductHref(article)}
                  className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f3edf9]">
                    {article.imageUrls[0] ? (
                      <img
                        src={article.imageUrls[0]}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/60">
                        <Shirt size={32} strokeWidth={1.2} />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-full bg-black/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                      {meta.label}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-serif text-2xl italic leading-none text-[#1C1C1C] group-hover:text-[#8d5f9e]">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                      {article.brandRef?.name || article.brand || "Cabine Market"}
                    </p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(Number(article.price))}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-[32px] border border-dashed border-[#C9A0CD]/40 bg-white/50 px-6 text-center">
            <p className="text-sm font-semibold text-stone-400">Les articles du catalogue apparaitront ici.</p>
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {featureLinks.map((feature) => {
            const Icon = feature.icon;

            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group rounded-[32px] border border-white/70 bg-white/60 p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
              >
                <span className="mb-8 flex size-12 items-center justify-center rounded-xl bg-[#f7f1fb] text-[#8d5f9e] transition-colors group-hover:bg-[#8d5f9e] group-hover:text-white">
                  <Icon size={20} />
                </span>
                <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                  {feature.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-500">{feature.text}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="grid gap-8 overflow-hidden rounded-[40px] border border-white/80 bg-white/55 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">
              <Store size={13} />
              For fashion brands
            </div>
            <h2 className="font-serif text-6xl italic leading-none text-[#1C1C1C]">
              Rendez vos articles plus faciles a trouver.
            </h2>
          </div>
          <div className="flex flex-col justify-between gap-8">
            <p className="text-base leading-8 text-stone-500">
              VioletBeam prepare un espace pour les boutiques et marques : catalogue enrichi, recherche par avantages, pages produits SEO,
              lookbooks IA et option try-on pour aider les visiteurs a passer de l'inspiration a l'achat.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
                <Link href="/catalog">
                  See products
                  <Sparkles size={15} />
                </Link>
              </Button>
              <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <Link href="/lookbook">
                  Browse looks
                  <Images size={15} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
