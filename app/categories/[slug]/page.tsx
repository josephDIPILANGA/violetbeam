import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, Layers, Shirt, Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCategorySeoMeta, MODULE_ICON_MAP, type ModuleIconName } from "@/lib/catalog";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { withVisibleArticles } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const meta = getCategorySeoMeta(slug, locale);
  const count = await prisma.article.count({
    where: withVisibleArticles({
      category: slug,
    }),
  });

  if (count === 0) {
    return {
      title: locale === "fr" ? "Categorie" : "Category",
    };
  }

  return {
    title: `${meta.title} | VioletBeam`,
    description:
      locale === "fr"
        ? `${meta.description} ${count} articles disponibles.`
        : `${meta.description} ${count} articles available.`,
    alternates: {
      canonical: addLocaleToPathname(`/categories/${slug}`, locale),
    },
    openGraph: {
      title: `${meta.label} | VioletBeam`,
      description: meta.description,
      url: addLocaleToPathname(`/categories/${slug}`, locale),
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const catalogCopy = dictionary.catalog;
  const categoriesCopy = dictionary.categories;
  const meta = getCategorySeoMeta(slug, locale);
  const Icon = MODULE_ICON_MAP[meta.iconName as ModuleIconName] ?? Layers;
  const articles = await prisma.article.findMany({
    where: withVisibleArticles({
      category: slug,
    }),
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      shippingCurrency: true,
      category: true,
      imageUrls: true,
      brand: true,
      shopUrl: true,
      brandRef: {
        select: {
          name: true,
        },
      },
    },
  });

  if (articles.length === 0) notFound();

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 grid gap-8 rounded-[40px] border border-white/80 bg-white/55 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div className="flex min-h-72 items-center justify-center rounded-[32px] bg-[#f7f1fb] text-[#8d5f9e]">
            <Icon size={84} strokeWidth={1.2} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              {categoriesCopy.detailLabel}
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {meta.label}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {meta.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/20">
                <Tag size={12} />
                {articles.length} {catalogCopy.articles}
              </span>
              <Button asChild className="h-10 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <Link href={addLocaleToPathname("/categories", locale)}>
                  {dictionary.common.allCategories}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f3edf9]">
                {article.imageUrls[0] ? (
                  <img src={article.imageUrls[0]} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/60">
                    <Shirt size={36} strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="font-serif text-3xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                  {article.title}
                </h2>
                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                  {article.brandRef?.name || article.brand || "Cabine Market"}
                </p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-500">{article.description || catalogCopy.descriptionComingSoon}</p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: article.shippingCurrency }).format(Number(article.price))}
                </p>
                <div className="mt-6 flex gap-3">
                  <Button asChild className="h-11 flex-1 rounded-full bg-[#1C1C1C] text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
                    <Link href={addLocaleToPathname(`/cabine?module=${article.category}&article=db-${article.id}`, locale)}>
                      {dictionary.common.tryOn}
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
          ))}
        </section>
      </div>
    </main>
  );
}
