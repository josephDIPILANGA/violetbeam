import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Images, Shirt, Sparkles, Store, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCatalogModuleMeta } from "@/lib/catalog";
import { normalizeCompositionItems } from "@/lib/compositions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AI fashion try-on and virtual lookbook",
  description:
    "Create AI try-on previews, explore shoppable fashion articles, and discover VioletBeam's generated lookbook.",
  alternates: {
    canonical: "/",
  },
};

const featureLinks = [
  {
    href: "/cabine",
    title: "Cabine IA",
    text: "Composez un look, chargez une silhouette et générez un aperçu d'essayage.",
    icon: WandSparkles,
  },
  {
    href: "/catalog",
    title: "Catalog",
    text: "Explorez les articles, les marques, les prix et les liens vers les boutiques.",
    icon: Shirt,
  },
  {
    href: "/lookbook",
    title: "Lookbook",
    text: "Découvrez les compositions enregistrées et les styles créés dans l'application.",
    icon: Images,
  },
];

const steps = [
  "Choisissez un article ou une composition",
  "Générez un rendu try-on avec l'IA",
  "Validez, sauvegardez ou ouvrez la boutique",
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
    return await Promise.race([
      Promise.all([compositionsQuery, articlesQuery]),
      timeout,
    ]);
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

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8d5f9e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8d5f9e]" />
            </span>
            AI Fashion Studio
          </div>

          <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
            VioletBeam
          </h1>
          <p className="mt-7 max-w-xl text-2xl font-medium leading-9 text-[#4f365f] md:text-3xl">
            Essayez les looks avant de les acheter.
          </p>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-500">
            Une expérience mode assistée par IA pour composer des tenues, visualiser un rendu try-on, explorer des articles et sauvegarder les looks qui vous ressemblent.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
              <Link href="/cabine">
                Start Try-On
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <Button asChild className="h-14 rounded-full bg-white px-7 text-[10px] font-black uppercase tracking-[0.24em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
              <Link href="/catalog">
                Explore Catalog
                <Shirt size={15} />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-[44px] border border-white/80 bg-white/45 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1400"
            alt="Fashion editorial model wearing a styled outfit"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/55 via-transparent to-white/10" />
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
            <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">Compositions récentes</h2>
          </div>
          <Button asChild className="h-12 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
            <Link href="/lookbook">
              Toutes les compositions
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
                      {items.length} pièces
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
            <p className="text-sm font-semibold text-stone-400">Les compositions validées apparaîtront ici.</p>
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">Product selection</p>
            <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">Articles à essayer</h2>
          </div>
          <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
            <Link href="/catalog">
              Tous les articles
              <Shirt size={15} />
            </Link>
          </Button>
        </div>

        {articles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {articles.map((article) => {
              const meta = getCatalogModuleMeta(article.category);

              return (
                <Link
                  key={article.id}
                  href={`/cabine?module=${article.category}&article=db-${article.id}`}
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
            <p className="text-sm font-semibold text-stone-400">Les articles du catalogue apparaîtront ici.</p>
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
              Rendez vos articles essayables.
            </h2>
          </div>
          <div className="flex flex-col justify-between gap-8">
            <p className="text-base leading-8 text-stone-500">
              VioletBeam prépare un espace pour les boutiques et marques : catalogue enrichi, try-on IA, compositions sauvegardées et visibilité dans un lookbook communautaire.
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
