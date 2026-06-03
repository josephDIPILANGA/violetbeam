import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const contentFormats = ["outfit", "product-spotlight", "trend", "editorial", "try-this-look"];

function getFormatsForInfluencer(influencerIndex: number, postsPerInfluencer: number) {
  return Array.from({ length: postsPerInfluencer }, (_, postIndex) => {
    const formatIndex = (influencerIndex + postIndex) % contentFormats.length;
    return contentFormats[formatIndex];
  });
}

function normalizePositiveNumber(value: unknown, fallback: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 1) return fallback;
  return Math.min(Math.floor(numberValue), max);
}

export async function POST(request: Request) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const body = (await request.json().catch(() => ({}))) as {
    postsPerInfluencer?: unknown;
    includeDrafts?: unknown;
  };
  const postsPerInfluencer = normalizePositiveNumber(body.postsPerInfluencer, 3, 10);
  const includeDrafts = body.includeDrafts === true;

  const influencers = await prisma.virtualInfluencer.findMany({
    where: {
      ...(includeDrafts
        ? {}
        : {
            status: "ACTIVE",
          }),
      OR: [
        {
          bodyReferenceImageUrl: {
            not: null,
          },
        },
        {
          faceReferenceImageUrl: {
            not: null,
          },
        },
        {
          profileImageUrl: {
            not: null,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      status: true,
      preferredCategories: true,
      posts: {
        select: {
          id: true,
          status: true,
          contentPillar: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  const plan = influencers.flatMap((influencer, influencerIndex) =>
    getFormatsForInfluencer(influencerIndex, postsPerInfluencer).map((format, postIndex) => ({
      influencerId: influencer.id,
      displayName: influencer.displayName,
      username: influencer.username,
      status: influencer.status,
      format,
      postIndex: postIndex + 1,
      categories: influencer.preferredCategories,
      recentFormats: influencer.posts.slice(0, 3).map((post) => post.contentPillar || post.status),
    })),
  );

  return Response.json({
    ok: true,
    postsPerInfluencer,
    includeDrafts,
    influencerCount: influencers.length,
    postCount: plan.length,
    plan,
  });
}
