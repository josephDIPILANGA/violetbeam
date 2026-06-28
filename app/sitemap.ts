import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getArticleProductHref } from "@/lib/catalog";
import { getInfluencerPostHref } from "@/lib/influencer-posts";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import { getLanguageAlternates } from "@/lib/seo-locales";
import { getAbsoluteUrl } from "@/lib/site-url";
import { InfluencerPostStatus } from "@prisma/client";
import { CATALOG_ITEMS_PER_PAGE, getCatalogPageHref } from "./catalog/catalog-data";

export const dynamic = "force-dynamic";

function localizedSitemapEntry(
  pathname: string,
  entry: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  return {
    url: getAbsoluteUrl(pathname),
    alternates: {
      languages: getLanguageAlternates(pathname),
    },
    ...entry,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [articles, brands, shops, categories, influencers, influencerPosts] = await Promise.all([
    prisma.article.findMany({
      where: getVisibleArticleWhere(),
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.brand.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.tag.findMany({
      where: {
        type: "merchant",
        articles: {
          some: {
            article: getVisibleArticleWhere(),
          },
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.article.groupBy({
      by: ["category"],
      where: getVisibleArticleWhere(),
      _max: {
        updatedAt: true,
      },
    }),
    prisma.virtualInfluencer.findMany({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },
      select: {
        username: true,
        updatedAt: true,
      },
    }),
    prisma.influencerPost.findMany({
      where: {
        status: {
          in: [InfluencerPostStatus.APPROVED, InfluencerPostStatus.PUBLISHED],
        },
        generatedImageUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        caption: true,
        contentPillar: true,
        updatedAt: true,
        influencer: {
          select: {
            displayName: true,
          },
        },
      },
    }),
  ]);

  const catalogPageCount = Math.max(1, Math.ceil(articles.length / CATALOG_ITEMS_PER_PAGE));
  const catalogPages = Array.from({ length: catalogPageCount }, (_, index) => {
    const page = index + 1;

    return localizedSitemapEntry(getCatalogPageHref(page), {
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: page === 1 ? 0.9 : 0.75,
    });
  });

  return [
    localizedSitemapEntry("/", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    }),
    localizedSitemapEntry("/lookbook", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    localizedSitemapEntry("/brands", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    localizedSitemapEntry("/shops", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.76,
    }),
    localizedSitemapEntry("/categories", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    localizedSitemapEntry("/influencers", {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    }),
    localizedSitemapEntry("/privacy", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    localizedSitemapEntry("/terms", {
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    ...catalogPages,
    ...articles.map((article) => localizedSitemapEntry(getArticleProductHref(article), {
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...brands.map((brand) => localizedSitemapEntry(`/brands/${brand.slug}`, {
      lastModified: brand.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...shops.map((shop) => localizedSitemapEntry(`/shops/${shop.slug.replace(/^merchant-/, "")}`, {
      lastModified: shop.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.68,
    })),
    ...categories.map((category) => localizedSitemapEntry(`/categories/${category.category}`, {
      lastModified: category._max.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...influencers.map((influencer) => localizedSitemapEntry(`/influencers/${influencer.username}`, {
      lastModified: influencer.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.65,
    })),
    ...influencerPosts.map((post) => localizedSitemapEntry(getInfluencerPostHref(post), {
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.68,
    })),
  ];
}
