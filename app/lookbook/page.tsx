import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InfluencerPostStatus } from "@prisma/client";
import { normalizeCompositionItems, type CompositionItem, type LookbookComposition } from "@/lib/compositions";
import { getInfluencerPostHref } from "@/lib/influencer-posts";
import LookbookClient from "./lookbook-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Explore VioletBeam's AI-generated fashion lookbook, including community looks and virtual agent editorials.",
  alternates: {
    canonical: "/lookbook",
  },
  openGraph: {
    title: "VioletBeam Lookbook",
    description:
      "Discover AI-generated looks, styling ideas, and fashion editorials from VioletBeam.",
    url: "/lookbook",
  },
};

function normalizeInfluencerPostItems(post: {
  articles: {
    position: number;
    snapshot: unknown;
    article: {
      id: number;
      title: string;
      description: string | null;
      price: unknown;
      category: string;
      imageUrls: string[];
      brand: string | null;
      shopUrl: string | null;
      brandRef: {
        name: string;
      } | null;
    };
  }[];
}): CompositionItem[] {
  return post.articles
    .sort((first, second) => first.position - second.position)
    .map((entry): CompositionItem => {
      const snapshot = entry.snapshot && typeof entry.snapshot === "object" ? (entry.snapshot as Partial<CompositionItem>) : {};
      const brand = entry.article.brandRef?.name || entry.article.brand || "VioletBeam Market";

      return {
        id: String(entry.article.id),
        name: snapshot.name || entry.article.title,
        brand: snapshot.brand || brand,
        image: snapshot.image || entry.article.imageUrls[0] || "",
        prompt: snapshot.prompt || entry.article.description || entry.article.title,
        moduleId: snapshot.moduleId || entry.article.category,
        moduleLabel: snapshot.moduleLabel || entry.article.category,
        description: snapshot.description || entry.article.description || undefined,
        price: snapshot.price ?? Number(entry.article.price),
        currency: snapshot.currency || "USD",
        shopUrl: snapshot.shopUrl || entry.article.shopUrl || undefined,
      };
    });
}

export default async function LookbookPage() {
  const [compositions, influencerPosts] = await Promise.all([
    prisma.composition.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
      select: {
        id: true,
        name: true,
        generatedUrl: true,
        thumbnailUrl: true,
        itemsSummary: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
      select: {
        id: true,
        caption: true,
        generatedImageUrl: true,
        thumbnailUrl: true,
        createdAt: true,
        status: true,
        influencer: {
          select: {
            displayName: true,
            username: true,
          },
        },
        articles: {
          orderBy: {
            position: "asc",
          },
          select: {
            position: true,
            snapshot: true,
            article: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                category: true,
                imageUrls: true,
                brand: true,
                shopUrl: true,
                brandRef: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const lookbookCompositions: LookbookComposition[] = compositions.map((composition) => ({
    id: `composition-${composition.id}`,
    sourceType: "composition",
    name: composition.name,
    generatedUrl: composition.generatedUrl,
    thumbnailUrl: composition.thumbnailUrl,
    items: normalizeCompositionItems(composition.itemsSummary),
    createdAt: composition.createdAt.toISOString(),
    userName: composition.user.name,
    sourceLabel: "Community look",
  }));

  const lookbookAgentPosts: LookbookComposition[] = influencerPosts.map((post) => ({
    id: `agent-post-${post.id}`,
    sourceType: "agentPost",
    href: getInfluencerPostHref(post),
    name: post.caption?.split(".")[0] || `${post.influencer.displayName} Editorial Look`,
    generatedUrl: post.generatedImageUrl || "",
    thumbnailUrl: post.thumbnailUrl,
    items: normalizeInfluencerPostItems(post),
    createdAt: post.createdAt.toISOString(),
    userName: post.influencer.displayName,
    sourceLabel: `VioletBeam Agent / ${post.status}`,
  }));

  const lookbookEntries = [...lookbookCompositions, ...lookbookAgentPosts].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );

  return <LookbookClient compositions={lookbookEntries} />;
}
