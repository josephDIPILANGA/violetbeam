import type { Metadata } from "next";

import CatalogClient from "./catalog-client";
import { getCatalogPageData, parseCatalogFilters } from "./catalog-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Browse VioletBeam's shoppable fashion catalog and try articles directly in the AI cabine.",
  alternates: {
    canonical: "/catalog",
  },
  openGraph: {
    title: "VioletBeam Catalog",
    description:
      "Browse shoppable fashion pieces and launch AI try-on experiences from the VioletBeam catalog.",
    url: "/catalog",
  },
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const filters = parseCatalogFilters(await searchParams);
  const { articles, categories, brands, pagination } = await getCatalogPageData(1, filters);

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
