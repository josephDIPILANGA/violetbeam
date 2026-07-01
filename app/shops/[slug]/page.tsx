import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Package, Shirt, Store, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getArticleProductHref, getCatalogModuleMeta } from "@/lib/catalog";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { withVisibleArticles } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SHOP_ITEMS_PER_PAGE = 30;

function getMerchantSlug(slug: string) {
  return slug.startsWith("merchant-") ? slug : `merchant-${slug}`;
}

function getPublicShopSlug(merchantSlug: string) {
  return merchantSlug.replace(/^merchant-/, "");
}

function getShopPageHref(slug: string, page: number) {
  const publicSlug = getPublicShopSlug(slug);
  return page <= 1 ? `/shops/${publicSlug}` : `/shops/${publicSlug}?page=${page}`;
}

function getLocalizedShopPageHref(slug: string, page: number, locale: Locale) {
  return addLocaleToPathname(getShopPageHref(slug, page), locale);
}

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

function parsePage(searchParams: Record<string, string | string[] | undefined>) {
  const value = searchParams.page;
  const rawPage = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawPage || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function formatPrice(price: unknown, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(price));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const merchantSlug = getMerchantSlug(slug);
  const merchant = await prisma.tag.findUnique({
    where: {
      slug: merchantSlug,
    },
    select: {
      name: true,
      slug: true,
    },
  });

  if (!merchant) {
    return {
      title: locale === "fr" ? "Boutique" : "Shop",
    };
  }

  const articleCount = await prisma.article.count({
    where: withVisibleArticles({
      tags: {
        some: {
          tag: {
            slug: merchant.slug,
            type: "merchant",
          },
        },
      },
    }),
  });

  return {
    title: `${merchant.name} | VioletBeam`,
    description:
      locale === "fr"
        ? `Explorez ${articleCount} articles de la boutique ${merchant.name} disponibles dans le catalogue VioletBeam.`
        : `Explore ${articleCount} articles from ${merchant.name} available in the VioletBeam catalog.`,
    alternates: {
      canonical: addLocaleToPathname(`/shops/${getPublicShopSlug(merchant.slug)}`, locale),
    },
    openGraph: {
      title: locale === "fr" ? `${merchant.name} sur VioletBeam` : `${merchant.name} on VioletBeam`,
      description:
        locale === "fr"
          ? `Parcourez les articles de ${merchant.name} dans le catalogue VioletBeam.`
          : `Browse ${merchant.name} articles in the VioletBeam catalog.`,
      url: addLocaleToPathname(`/shops/${getPublicShopSlug(merchant.slug)}`, locale),
    },
  };
}

export default async function ShopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const catalogCopy = dictionary.catalog;
  const shopsCopy = dictionary.shops;
  const merchantSlug = getMerchantSlug(slug);
  const currentPage = parsePage(resolvedSearchParams);
  const merchant = await prisma.tag.findUnique({
    where: {
      slug: merchantSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  });

  if (!merchant || merchant.type !== "merchant") notFound();

  const where = withVisibleArticles({
    tags: {
      some: {
        tagId: merchant.id,
      },
    },
  });

  const [totalArticles, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: [
        {
          brand: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: (currentPage - 1) * SHOP_ITEMS_PER_PAGE,
      take: SHOP_ITEMS_PER_PAGE,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        shippingCurrency: true,
        category: true,
        imageUrls: true,
        brand: true,
        brandRef: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalArticles / SHOP_ITEMS_PER_PAGE));
  if (totalArticles === 0 || currentPage > pageCount) notFound();

  const firstVisibleArticle = (currentPage - 1) * SHOP_ITEMS_PER_PAGE + 1;
  const lastVisibleArticle = Math.min(currentPage * SHOP_ITEMS_PER_PAGE, totalArticles);
  const brands = Array.from(new Set(articles.map((article) => article.brandRef?.name || article.brand).filter(Boolean)));
  const categories = Array.from(new Set(articles.map((article) => article.category)));

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 grid gap-8 rounded-[40px] border border-white/80 bg-white/55 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
          <div className="flex min-h-72 items-center justify-center rounded-[32px] bg-[#f7f1fb] text-[#8d5f9e]">
            <Store size={84} strokeWidth={1.2} />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Building2 size={13} />
              {shopsCopy.cardLabel}
            </div>
            <h1 className="font-serif text-6xl italic leading-[0.9] tracking-tight text-[#1C1C1C] md:text-8xl">
              {merchant.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {shopsCopy.detailIntro}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/20">
                <Package size={12} />
                {totalArticles} {catalogCopy.articles}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 ring-1 ring-stone-200">
                {brands.length || shopsCopy.brandsCta} {shopsCopy.brands}
              </span>
              <Button asChild className="h-10 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <Link href={addLocaleToPathname("/shops", locale)}>
                  {shopsCopy.allShops}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full bg-white/70 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-white/80"
            >
              {getCatalogModuleMeta(category, locale).label}
            </span>
          ))}
        </section>

        <section className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const meta = getCatalogModuleMeta(article.category, locale);
            const brandName = article.brandRef?.name || article.brand || shopsCopy.brandFallback;

            return (
              <Link
                key={article.id}
                href={addLocaleToPathname(getArticleProductHref(article), locale)}
                className="group flex flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
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
                      <Shirt size={42} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] backdrop-blur-xl">
                    <Tag size={11} />
                    {meta.label}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-serif text-3xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                    {brandName}
                  </p>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-500">
                    {article.description || catalogCopy.descriptionComingSoon}
                  </p>
                  <div className="mt-auto pt-5">
                    <div className="mb-5 h-[1px] w-full bg-gradient-to-r from-[#C9A0CD]/40 via-stone-200 to-transparent" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                        {formatPrice(article.price, article.shippingCurrency)}
                      </span>
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#1C1C1C] text-white transition-colors group-hover:bg-[#8d5f9e]">
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <nav className="mt-10 flex flex-col gap-3 rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
              {catalogCopy.showing} {firstVisibleArticle}-{lastVisibleArticle} {catalogCopy.of} {totalArticles} {catalogCopy.articles}
            </p>
            <p className="mt-1 text-xs font-semibold text-stone-500">
              {catalogCopy.page} {currentPage} / {pageCount}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={getLocalizedShopPageHref(merchant.slug, Math.max(1, currentPage - 1), locale)}
              aria-disabled={currentPage <= 1}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                currentPage > 1
                  ? "bg-white text-[#8d5f9e] ring-[#C9A0CD]/25 hover:bg-[#f7f1fb]"
                  : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
              )}
            >
              <ArrowLeft size={13} />
              {dictionary.common.previous}
            </Link>
            <Link
              href={getLocalizedShopPageHref(merchant.slug, Math.min(pageCount, currentPage + 1), locale)}
              aria-disabled={currentPage >= pageCount}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                currentPage < pageCount
                  ? "bg-[#1C1C1C] text-white ring-[#1C1C1C] hover:bg-[#8d5f9e]"
                  : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
              )}
            >
              {dictionary.common.next}
              <ArrowRight size={13} />
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
