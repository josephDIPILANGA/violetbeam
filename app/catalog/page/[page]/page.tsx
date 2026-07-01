import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import CatalogClient from "../../catalog-client";
import { getCatalogPageData, getCatalogPageHref, parseCatalogFilters } from "../../catalog-data";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type CatalogPaginatedPageProps = {
  params: Promise<{ page: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export async function generateMetadata({
  params,
  searchParams,
}: CatalogPaginatedPageProps): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const catalogCopy = dictionary.catalog;
  const { page } = await params;
  const filters = parseCatalogFilters(await searchParams);
  const pageNumber = Number.parseInt(page, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1 || String(pageNumber) !== page) {
    return {
      title: dictionary.common.catalog,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${dictionary.common.catalog} - ${catalogCopy.page} ${pageNumber}`,
    description:
      locale === "fr"
        ? `Parcourez la page ${pageNumber} du catalogue VioletBeam et decouvrez des articles essayables en cabine IA.`
        : `Browse page ${pageNumber} of the VioletBeam catalog and discover AI try-on ready articles.`,
    alternates: {
      canonical: addLocaleToPathname(getCatalogPageHref(pageNumber, filters), locale),
    },
    openGraph: {
      title: `VioletBeam ${dictionary.common.catalog} - ${catalogCopy.page} ${pageNumber}`,
      description: catalogCopy.browseHint,
      url: addLocaleToPathname(getCatalogPageHref(pageNumber, filters), locale),
    },
  };
}

export default async function CatalogPaginatedPage({
  params,
  searchParams,
}: CatalogPaginatedPageProps) {
  const locale = await getRequestLocale();
  const { page } = await params;
  const filters = parseCatalogFilters(await searchParams);
  const pageNumber = Number.parseInt(page, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1 || String(pageNumber) !== page) {
    notFound();
  }

  if (pageNumber === 1) {
    redirect(addLocaleToPathname(getCatalogPageHref(1, filters), locale));
  }

  const { articles, categories, brands, pagination } = await getCatalogPageData(pageNumber, filters, locale);

  if (pageNumber > pagination.pageCount) {
    notFound();
  }

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
