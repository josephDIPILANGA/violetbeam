import type { Metadata } from "next";
import { headers } from "next/headers";

import CatalogClient from "./catalog-client";
import { getCatalogPageData, parseCatalogFilters } from "./catalog-data";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const catalogCopy = dictionary.catalog;
  const title = locale === "fr" ? "Catalogue mode essayable" : "Try-on ready fashion catalog";

  return {
    title,
    description: catalogCopy.browseHint,
    alternates: {
      canonical: addLocaleToPathname("/catalog", locale),
    },
    openGraph: {
      title: `${title} | VioletBeam`,
      description: catalogCopy.browseHint,
      url: addLocaleToPathname("/catalog", locale),
    },
  };
}

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const locale = await getRequestLocale();
  const filters = parseCatalogFilters(await searchParams);
  const { articles, categories, brands, pagination } = await getCatalogPageData(1, filters, locale);

  return (
    <CatalogClient
      articles={articles}
      brands={brands}
      categories={categories}
      filters={filters}
      pagination={pagination}
    />
  );
}
