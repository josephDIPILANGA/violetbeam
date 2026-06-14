import { prisma } from "@/lib/prisma";
import { getCatalogModuleMeta, type CatalogArticle } from "@/lib/catalog";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import type { Prisma } from "@prisma/client";

export const CATALOG_ITEMS_PER_PAGE = 13;

export const CATALOG_SORT_OPTIONS = [
  "newest",
  "price-asc",
  "price-desc",
  "top-rated",
  "delivery-fast",
] as const;

export type CatalogSortOption = (typeof CATALOG_SORT_OPTIONS)[number];

export type CatalogFilters = {
  q?: string;
  category?: string;
  brand?: string;
  shippingCountry?: string;
  freeShipping?: boolean;
  minRating?: number;
  onSale?: boolean;
  sort?: CatalogSortOption;
};

export type CatalogCategoryFilter = {
  id: string;
  label: string;
};

export type CatalogBrandFilter = {
  id: string;
  name: string;
  popularity?: number;
  count: number;
};

export type CatalogShippingCountryFilter = {
  id: string;
  label: string;
  count: number;
};

export type CatalogPagination = {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  totalArticles: number;
};

type CatalogSearchParams = Record<string, string | string[] | undefined>;

function getSingleParam(searchParams: CatalogSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getBooleanParam(searchParams: CatalogSearchParams, key: string) {
  const value = getSingleParam(searchParams, key);
  return value === "1" || value === "true";
}

function trimFilterValue(value: string | undefined, maxLength = 80) {
  const nextValue = value?.trim();
  if (!nextValue) return undefined;
  return nextValue.slice(0, maxLength);
}

function getCatalogSearchTerms(query: string) {
  const normalizedQuery = query
    .toLowerCase()
    .replaceAll("t-shirt", "shirt")
    .replaceAll("tee shirt", "shirt")
    .replaceAll("tee-shirt", "shirt")
    .replaceAll("tshirt", "shirt");

  return Array.from(new Set([normalizedQuery, ...normalizedQuery.split(/\s+/)]))
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 4);
}

function getCatalogSearchCategory(query: string) {
  const terms = getCatalogSearchTerms(query);
  const joined = terms.join(" ");

  if (terms.includes("shirt") || joined.includes("chemise")) return "shirts";
  if (terms.includes("dress") || joined.includes("robe")) return "dresses";
  if (terms.includes("shoe") || joined.includes("chaussure")) return "shoes";
  if (terms.includes("bag") || joined.includes("handbag") || joined.includes("accessoire")) return "accessories";
  if (terms.includes("pant") || terms.includes("pants") || joined.includes("pantalon")) return "bottoms";
  if (terms.includes("cap") || joined.includes("casquette")) return "caps";
  if (terms.includes("pull") || terms.includes("sweater")) return "pulls";

  return undefined;
}

export function parseCatalogFilters(searchParams: CatalogSearchParams = {}): CatalogFilters {
  const sort = getSingleParam(searchParams, "sort");
  const minRating = Number.parseFloat(getSingleParam(searchParams, "minRating") || "");

  return {
    q: trimFilterValue(getSingleParam(searchParams, "q")),
    category: trimFilterValue(getSingleParam(searchParams, "category"), 60),
    brand: trimFilterValue(getSingleParam(searchParams, "brand"), 80),
    shippingCountry: trimFilterValue(getSingleParam(searchParams, "shippingCountry"), 12),
    freeShipping: getBooleanParam(searchParams, "freeShipping") || undefined,
    minRating: Number.isFinite(minRating) && minRating >= 1 && minRating <= 5 ? minRating : undefined,
    onSale: getBooleanParam(searchParams, "onSale") || undefined,
    sort: CATALOG_SORT_OPTIONS.includes(sort as CatalogSortOption) ? (sort as CatalogSortOption) : undefined,
  };
}

export function getCatalogPageHref(page: number, filters: CatalogFilters = {}) {
  const pathname = page <= 1 ? "/catalog" : `/catalog/page/${page}`;
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.shippingCountry) params.set("shippingCountry", filters.shippingCountry);
  if (filters.freeShipping) params.set("freeShipping", "1");
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.onSale) params.set("onSale", "1");
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getCatalogWhere(filters: CatalogFilters): Prisma.ArticleWhereInput {
  const andFilters: Prisma.ArticleWhereInput[] = [getVisibleArticleWhere()];

  if (filters.category) {
    andFilters.push({ category: filters.category });
  } else if (filters.q) {
    const searchCategory = getCatalogSearchCategory(filters.q);
    if (searchCategory) {
      andFilters.push({ category: searchCategory });
    }
  }

  if (filters.brand) {
    andFilters.push({
      OR: [
        { brand: { equals: filters.brand, mode: "insensitive" } },
        { brandRef: { is: { slug: filters.brand } } },
        { brandRef: { is: { name: { equals: filters.brand, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.shippingCountry) {
    andFilters.push({ shippingCountry: filters.shippingCountry });
  }

  if (filters.freeShipping) {
    andFilters.push({ freeShipping: true });
  }

  if (filters.minRating) {
    andFilters.push({ rating: { gte: filters.minRating } });
  }

  if (filters.onSale) {
    andFilters.push({ isOnSale: true });
  }

  return { AND: andFilters };
}

function articleMatchesSearch(
  article: {
    title: string;
    description: string | null;
    category: string;
    brand: string | null;
    brandRef: { name: string } | null;
    tags?: { tag: { name: string; slug: string } }[];
  },
  query: string,
) {
  const terms = getCatalogSearchTerms(query);
  if (terms.length === 0) return true;

  const searchableText = [
    article.title,
    article.description,
    article.category,
    article.brand,
    article.brandRef?.name,
    ...(article.tags || []).map((entry) => entry.tag.name),
    ...(article.tags || []).map((entry) => entry.tag.slug),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replaceAll("t-shirt", "shirt")
    .replaceAll("tee shirt", "shirt")
    .replaceAll("tee-shirt", "shirt")
    .replaceAll("tshirt", "shirt");

  return terms.some((term) => searchableText.includes(term));
}

function getCatalogOrderBy(filters: CatalogFilters): Prisma.ArticleOrderByWithRelationInput[] {
  switch (filters.sort) {
    case "price-asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "top-rated":
      return [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }];
    case "delivery-fast":
      return [{ estimatedDeliveryMinDays: "asc" }, { estimatedDeliveryMaxDays: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ category: "asc" }, { createdAt: "desc" }];
  }
}

export async function getCatalogPageData(page: number, filters: CatalogFilters = {}) {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const where = getCatalogWhere(filters);
  const hasTextSearch = Boolean(filters.q);
  const searchCategory = filters.q ? getCatalogSearchCategory(filters.q) : undefined;
  const shouldFilterSearchInMemory = hasTextSearch && !searchCategory;
  const articleTake = shouldFilterSearchInMemory ? 60 : hasTextSearch ? CATALOG_ITEMS_PER_PAGE + 1 : CATALOG_ITEMS_PER_PAGE;
  const articleSkip = shouldFilterSearchInMemory ? 0 : (currentPage - 1) * CATALOG_ITEMS_PER_PAGE;

  try {
    const [totalArticlesResult, articlesResult, categories, brands, shippingCountries] = await Promise.all([
    hasTextSearch ? Promise.resolve(null) : prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: getCatalogOrderBy(filters),
      skip: articleSkip,
      take: articleTake,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        imageUrls: true,
        brand: true,
        brandRef: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            popularity: true,
          },
        },
        shopUrl: true,
        rating: true,
        reviewCount: true,
        shippingCountry: true,
        shippingCountries: true,
        shippingPrice: true,
        shippingCurrency: true,
        freeShipping: true,
        estimatedDeliveryMinDays: true,
        estimatedDeliveryMaxDays: true,
        isOnSale: true,
        discountPercent: true,
        colors: true,
        materials: true,
        styleTags: true,
      },
    }),
    prisma.article.groupBy({
      by: ["category"],
      where: getVisibleArticleWhere(),
      _count: {
        _all: true,
      },
      orderBy: {
        category: "asc",
      },
    }),
    prisma.brand.findMany({
      where: {
        articles: {
          some: getVisibleArticleWhere(),
        },
      },
      orderBy: [
        {
          articles: {
            _count: "desc",
          },
        },
        {
          name: "asc",
        },
      ],
      select: {
        name: true,
        slug: true,
        popularity: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    }),
    prisma.article.groupBy({
      by: ["shippingCountry"],
      where: {
        AND: [
          getVisibleArticleWhere(),
          {
            shippingCountry: {
              not: null,
            },
          },
        ],
      },
      _count: {
        _all: true,
      },
      orderBy: {
        shippingCountry: "asc",
      },
    }),
    ]);
    const matchingSearchArticles = shouldFilterSearchInMemory && filters.q
      ? articlesResult.filter((article) => articleMatchesSearch(article, filters.q || ""))
      : articlesResult;
    const articles = shouldFilterSearchInMemory
      ? matchingSearchArticles.slice((currentPage - 1) * CATALOG_ITEMS_PER_PAGE, currentPage * CATALOG_ITEMS_PER_PAGE)
      : matchingSearchArticles.slice(0, CATALOG_ITEMS_PER_PAGE);
    const hasNextSearchPage = hasTextSearch && matchingSearchArticles.length > CATALOG_ITEMS_PER_PAGE;
    const estimatedSearchTotal = hasNextSearchPage
      ? currentPage * CATALOG_ITEMS_PER_PAGE + 1
      : (currentPage - 1) * CATALOG_ITEMS_PER_PAGE + articles.length;
    const totalArticles = totalArticlesResult ?? estimatedSearchTotal;

  const catalogArticles: CatalogArticle[] = articles.map((article) => {
    const meta = getCatalogModuleMeta(article.category);

    return {
      id: `db-${article.id}`,
      name: article.title,
      brand: article.brandRef?.name || article.brand || "Cabine Market",
      image: article.imageUrls[0] || "",
      prompt: article.description || `${article.title} par ${article.brandRef?.name || article.brand || "Cabine Market"}`,
      description: article.description || undefined,
      price: Number(article.price),
      currency: "USD",
      shopUrl: article.shopUrl || undefined,
      moduleId: article.category,
      moduleLabel: meta.label,
      brandId: article.brandRef?.id,
      brandSlug: article.brandRef?.slug,
      brandLogoUrl: article.brandRef?.logoUrl || undefined,
      brandWebsiteUrl: article.brandRef?.websiteUrl || undefined,
      brandPopularity: article.brandRef?.popularity,
      rating: article.rating || undefined,
      reviewCount: article.reviewCount,
      shippingCountry: article.shippingCountry || undefined,
      shippingCountries: article.shippingCountries,
      shippingPrice: article.shippingPrice ? Number(article.shippingPrice) : undefined,
      shippingCurrency: article.shippingCurrency,
      freeShipping: article.freeShipping,
      estimatedDeliveryMinDays: article.estimatedDeliveryMinDays || undefined,
      estimatedDeliveryMaxDays: article.estimatedDeliveryMaxDays || undefined,
      isOnSale: article.isOnSale,
      discountPercent: article.discountPercent || undefined,
      colors: article.colors,
      materials: article.materials,
      styleTags: article.styleTags,
      tags: [],
    };
  });

  const catalogCategories: CatalogCategoryFilter[] = categories.map((entry) => ({
    id: entry.category,
    label: getCatalogModuleMeta(entry.category).label,
  }));

  const catalogBrands: CatalogBrandFilter[] = brands.map((brand) => ({
    id: brand.slug,
    name: brand.name,
    popularity: brand.popularity,
    count: brand._count.articles,
  }));

  const catalogShippingCountries: CatalogShippingCountryFilter[] = shippingCountries
    .filter((entry) => entry.shippingCountry)
    .map((entry) => ({
      id: entry.shippingCountry || "",
      label: entry.shippingCountry || "",
      count: entry._count._all,
    }));

    return {
      articles: catalogArticles,
      categories: catalogCategories,
      brands: catalogBrands,
      shippingCountries: catalogShippingCountries,
      filters,
      pagination: {
        currentPage,
        pageCount: Math.max(1, Math.ceil(totalArticles / CATALOG_ITEMS_PER_PAGE)),
        pageSize: CATALOG_ITEMS_PER_PAGE,
        totalArticles,
      },
    };
  } catch (error) {
    console.warn("Catalog data loading failed:", error instanceof Error ? error.message : error);

    return {
      articles: [],
      categories: [],
      brands: [],
      shippingCountries: [],
      filters,
      pagination: {
        currentPage,
        pageCount: 1,
        pageSize: CATALOG_ITEMS_PER_PAGE,
        totalArticles: 0,
      },
    };
  }
}
