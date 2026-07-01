import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, Building2, Package, Sparkles, Store, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCatalogModuleMeta } from "@/lib/catalog";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getPublicShopSlug(merchantSlug: string) {
  return merchantSlug.replace(/^merchant-/, "");
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const shopsCopy = dictionary.shops;

  return {
    title: shopsCopy.title,
    description: shopsCopy.intro,
    alternates: {
      canonical: addLocaleToPathname("/shops", locale),
    },
    openGraph: {
      title: `${shopsCopy.title} | VioletBeam`,
      description: shopsCopy.intro,
      url: addLocaleToPathname("/shops", locale),
    },
  };
}

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export default async function ShopsPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const catalogCopy = dictionary.catalog;
  const shopsCopy = dictionary.shops;
  const visibleArticleWhere = getVisibleArticleWhere();
  const merchantTags = await prisma.tag.findMany({
    where: {
      type: "merchant",
      articles: {
        some: {
          article: visibleArticleWhere,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      articles: {
        where: {
          article: visibleArticleWhere,
        },
        select: {
          article: {
            select: {
              id: true,
              title: true,
              brand: true,
              category: true,
              price: true,
              shippingCurrency: true,
              imageUrls: true,
              shopUrl: true,
            },
          },
        },
      },
    },
  });

  const shops = merchantTags
    .map((merchant) => {
      const articles = merchant.articles.map((entry) => entry.article);
      const brands = Array.from(new Set(articles.map((article) => article.brand).filter(Boolean))).slice(0, 5);
      const categories = Array.from(new Set(articles.map((article) => article.category).filter(Boolean))).slice(0, 5);
      const featuredArticle = articles.find((article) => article.imageUrls[0]) || articles[0];

      return {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        articles,
        brands,
        categories,
        featuredArticle,
      };
    })
    .sort((left, right) => right.articles.length - left.articles.length || left.name.localeCompare(right.name));

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
              {shopsCopy.directoryLabel}
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {shopsCopy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {shopsCopy.intro}
            </p>
          </div>
          <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            <Link href={addLocaleToPathname("/brands", locale)}>
              {shopsCopy.brandsCta}
              <Tags size={15} />
            </Link>
          </Button>
        </header>

        {shops.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => {
              const featuredImage = shop.featuredArticle?.imageUrls[0];

              return (
                <Link
                  key={shop.id}
                  href={addLocaleToPathname(`/shops/${getPublicShopSlug(shop.slug)}`, locale)}
                  className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
                >
                  <div className="grid min-h-full grid-rows-[auto_1fr]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#f7f1fb]">
                      {featuredImage ? (
                        <img
                          src={featuredImage}
                          alt={shop.featuredArticle.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/70">
                          <Store size={48} strokeWidth={1.2} />
                        </div>
                      )}
                      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] backdrop-blur-xl">
                        <Building2 size={11} />
                        {shopsCopy.cardLabel}
                      </div>
                    </div>

                    <div className="flex flex-col p-6">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                          {shop.name}
                        </h2>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 ring-1 ring-stone-200">
                          {shop.articles.length} {catalogCopy.articles}
                        </span>
                      </div>

                      <div className="grid gap-4 text-sm text-stone-500">
                        <div>
                          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">{shopsCopy.soldBrands}</p>
                          <p className="leading-6">{shop.brands.length > 0 ? shop.brands.join(", ") : shopsCopy.brandFallback}</p>
                        </div>
                        <div>
                          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">{shopsCopy.categories}</p>
                          <p className="leading-6">
                            {shop.categories.map((category) => getCatalogModuleMeta(category, locale).label).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-stone-200/70 pt-5">
                        <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                          <Package size={12} />
                          {shopsCopy.merchantCatalog}
                        </span>
                        <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-stone-400 ring-1 ring-stone-200 transition-colors group-hover:text-[#8d5f9e]">
                          <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <p className="text-sm font-semibold text-stone-400">{shopsCopy.empty}</p>
          </div>
        )}
      </div>
    </main>
  );
}
