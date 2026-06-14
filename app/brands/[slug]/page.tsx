import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, Shirt, Sparkles, Star, Store, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCatalogModuleMeta } from "@/lib/catalog";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: {
      slug,
    },
    select: {
      name: true,
      description: true,
      logoUrl: true,
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!brand) {
    return {
      title: "Brand",
    };
  }

  return {
    title: brand.name,
    description:
      brand.description ||
      `Discover ${brand._count.articles} VioletBeam catalog articles from ${brand.name}, ready for AI try-on and outfit inspiration.`,
    alternates: {
      canonical: `/brands/${slug}`,
    },
    openGraph: {
      title: `${brand.name} on VioletBeam`,
      description:
        brand.description ||
        `Browse ${brand.name} fashion pieces available in VioletBeam.`,
      url: `/brands/${slug}`,
      images: brand.logoUrl ? [brand.logoUrl] : undefined,
    },
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: {
      slug,
    },
    select: {
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      websiteUrl: true,
      popularity: true,
      articles: {
        where: getVisibleArticleWhere(),
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          imageUrls: true,
          shopUrl: true,
        },
      },
    },
  });

  if (!brand) notFound();

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 grid gap-8 rounded-[40px] border border-white/80 bg-white/55 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div className="flex min-h-72 items-center justify-center rounded-[32px] bg-[#f7f1fb] text-[#8d5f9e]">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-full w-full rounded-[32px] object-cover" />
            ) : (
              <Star size={76} strokeWidth={1.2} className={brand.popularity > 0 ? "fill-current" : ""} />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              Brand profile
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {brand.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {brand.description || "Découvrez les articles de cette marque disponibles dans VioletBeam et essayez-les directement dans la cabine."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/20">
                <Star size={12} className={brand.popularity > 0 ? "fill-current" : ""} />
                {brand.popularity > 0 ? brand.popularity.toFixed(1) : "popularité à venir"}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 ring-1 ring-stone-200">
                {brand.articles.length} articles
              </span>
              {brand.websiteUrl && (
                <Button asChild className="h-10 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
                  <a href={brand.websiteUrl} target="_blank" rel="noreferrer">
                    Site officiel
                    <ExternalLink size={13} />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </header>

        <section>
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">Brand articles</p>
              <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">Articles disponibles</h2>
            </div>
            <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
              <Link href="/catalog">
                Tout le catalogue
                <Store size={15} />
              </Link>
            </Button>
          </div>

          {brand.articles.length > 0 ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {brand.articles.map((article) => {
                const meta = getCatalogModuleMeta(article.category);

                return (
                  <article
                    key={article.id}
                    className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
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
                          <Shirt size={36} strokeWidth={1.2} />
                        </div>
                      )}
                      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                        <Tag size={11} />
                        {meta.label}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-3xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                        {article.title}
                      </h3>
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-500">
                        {article.description || "Description à venir."}
                      </p>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(Number(article.price))}
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Button asChild className="h-11 flex-1 rounded-full bg-[#1C1C1C] text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
                          <Link href={`/cabine?module=${article.category}&article=db-${article.id}`}>
                            Try On
                            <ArrowUpRight size={13} />
                          </Link>
                        </Button>
                        {article.shopUrl && (
                          <Button asChild className="h-11 rounded-full bg-white px-4 text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                            <a href={article.shopUrl} target="_blank" rel="noreferrer" aria-label={`Acheter ${article.title}`}>
                              <ExternalLink size={13} />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
              <p className="text-sm font-semibold text-stone-400">Aucun article n'est encore lié à cette marque.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
