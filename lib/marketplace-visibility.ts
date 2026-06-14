import type { Prisma } from "@prisma/client";

export const SHOPIFY_MARKETPLACE_TAG_SLUG = "shopify";
export const HIDDEN_MARKETPLACE_TAG_SLUG = "hidden-from-violetbeam";
export const HIDDEN_MARKETPLACE_TAG_NAME = "Hidden from VioletBeam";

export function getVisibleArticleWhere(): Prisma.ArticleWhereInput {
  return {
    tags: {
      none: {
        tag: {
          slug: HIDDEN_MARKETPLACE_TAG_SLUG,
        },
      },
    },
  };
}

export function withVisibleArticles(where: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  const hasWhere = Object.keys(where).length > 0;

  return hasWhere
    ? {
        AND: [getVisibleArticleWhere(), where],
      }
    : getVisibleArticleWhere();
}
