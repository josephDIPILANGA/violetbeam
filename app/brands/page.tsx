import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, Sparkles, Star, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const brandsCopy = dictionary.brands;

  return {
    title: brandsCopy.title,
    description: brandsCopy.intro,
    alternates: {
      canonical: addLocaleToPathname("/brands", locale),
    },
    openGraph: {
      title: `${brandsCopy.title} | VioletBeam`,
      description: brandsCopy.intro,
      url: addLocaleToPathname("/brands", locale),
    },
  };
}

export default async function BrandsPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const brandsCopy = dictionary.brands;
  const catalogCopy = dictionary.catalog;
  const brands = await prisma.brand.findMany({
    where: {
      articles: {
        some: getVisibleArticleWhere(),
      },
    },
    orderBy: [
      {
        popularity: "desc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      websiteUrl: true,
      popularity: true,
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              {brandsCopy.directoryLabel}
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {brandsCopy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {brandsCopy.intro}
            </p>
          </div>
          <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            <Link href={addLocaleToPathname("/catalog", locale)}>
              {dictionary.common.catalog}
              <Store size={15} />
            </Link>
          </Button>
        </header>

        {brands.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={addLocaleToPathname(`/brands/${brand.slug}`, locale)}
                className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/60 p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
              >
                <div className="mb-8 flex items-start justify-between gap-4">
                  <span className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f1fb] text-[#8d5f9e] transition-colors group-hover:bg-[#8d5f9e] group-hover:text-white">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                    ) : (
                      <Star size={24} className={brand.popularity > 0 ? "fill-current" : ""} />
                    )}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 ring-1 ring-stone-200">
                    {brand._count.articles} {catalogCopy.articles}
                  </span>
                </div>

                <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                  {brand.name}
                </h2>
                <p className="mt-4 line-clamp-2 text-sm leading-7 text-stone-500">
                  {brand.description || brandsCopy.detailIntro}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-stone-200/70 pt-5">
                  <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                    <Star size={12} className={brand.popularity > 0 ? "fill-current" : ""} />
                    {brand.popularity > 0 ? brand.popularity.toFixed(1) : brandsCopy.new}
                  </span>
                  <ArrowUpRight size={16} className="text-stone-300 transition-colors group-hover:text-[#8d5f9e]" />
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <p className="text-sm font-semibold text-stone-400">{brandsCopy.empty}</p>
          </div>
        )}
      </div>
    </main>
  );
}
