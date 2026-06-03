import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import CatalogClient from "../../catalog-client";
import { getCatalogPageData, getCatalogPageHref, parseCatalogFilters } from "../../catalog-data";

export const dynamic = "force-dynamic";

type CatalogPaginatedPageProps = {
  params: Promise<{ page: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: CatalogPaginatedPageProps): Promise<Metadata> {
  const { page } = await params;
  const filters = parseCatalogFilters(await searchParams);
  const pageNumber = Number.parseInt(page, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1 || String(pageNumber) !== page) {
    return {
      title: "Catalog",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `Catalog - Page ${pageNumber}`,
    description: `Browse page ${pageNumber} of the VioletBeam shoppable fashion catalog and discover AI try-on ready articles.`,
    alternates: {
      canonical: getCatalogPageHref(pageNumber, filters),
    },
    openGraph: {
      title: `VioletBeam Catalog - Page ${pageNumber}`,
      description: `Discover more AI try-on ready fashion pieces from VioletBeam's catalog, page ${pageNumber}.`,
      url: getCatalogPageHref(pageNumber, filters),
    },
  };
}

export default async function CatalogPaginatedPage({
  params,
  searchParams,
}: CatalogPaginatedPageProps) {
  const { page } = await params;
  const filters = parseCatalogFilters(await searchParams);
  const pageNumber = Number.parseInt(page, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1 || String(pageNumber) !== page) {
    notFound();
  }

  if (pageNumber === 1) {
    redirect(getCatalogPageHref(1, filters));
  }

  const { articles, categories, brands, shippingCountries, pagination } = await getCatalogPageData(pageNumber, filters);

  if (pageNumber > pagination.pageCount) {
    notFound();
  }

  return (
    <CatalogClient
      articles={articles}
      brands={brands}
      categories={categories}
      shippingCountries={shippingCountries}
      filters={filters}
      pagination={pagination}
    />
  );
}
