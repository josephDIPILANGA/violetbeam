import { InfluencerPostStatus, SocialPlatform } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { buildInstagramCaption, publishInstagramImagePost } from "@/lib/instagram-publish";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isFinite(postId)) {
    return Response.json({ error: "Post invalide." }, { status: 400 });
  }

  const post = await prisma.influencerPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      status: true,
      caption: true,
      hashtags: true,
      generatedImageUrl: true,
      thumbnailUrl: true,
      influencer: {
        select: {
          username: true,
          platformAccounts: {
            where: {
              platform: SocialPlatform.INSTAGRAM,
            },
            select: {
              accessToken: true,
              connectionStatus: true,
              handle: true,
              instagramBusinessAccountId: true,
              tokenScopes: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!post) {
    return Response.json({ error: "Post introuvable." }, { status: 404 });
  }

  if (post.status !== InfluencerPostStatus.APPROVED && post.status !== InfluencerPostStatus.SCHEDULED) {
    return Response.json({ error: "Le post doit etre approuve ou planifie avant publication." }, { status: 400 });
  }

  const imageUrl = post.generatedImageUrl || post.thumbnailUrl;

  if (!imageUrl) {
    return Response.json({ error: "Le post n'a pas d'image a publier." }, { status: 400 });
  }

  const instagramAccount = post.influencer.platformAccounts[0];

  if (
    !instagramAccount ||
    instagramAccount.connectionStatus !== "CONNECTED" ||
    !instagramAccount.accessToken ||
    !instagramAccount.instagramBusinessAccountId
  ) {
    return Response.json({ error: "Le compte Instagram de cet agent n'est pas connecte pour publier." }, { status: 400 });
  }

  if (!instagramAccount.tokenScopes.includes("instagram_business_content_publish")) {
    return Response.json(
      { error: "Le compte Instagram est connecte, mais l'autorisation de publication est manquante." },
      { status: 400 },
    );
  }

  try {
    const publishedPost = await publishInstagramImagePost({
      accessToken: instagramAccount.accessToken,
      caption: buildInstagramCaption(post.caption, post.hashtags),
      imageUrl,
      instagramBusinessAccountId: instagramAccount.instagramBusinessAccountId,
    });

    await prisma.influencerPost.update({
      where: {
        id: post.id,
      },
      data: {
        status: InfluencerPostStatus.PUBLISHED,
        publishedAt: new Date(),
        platform: SocialPlatform.INSTAGRAM,
        externalPostId: publishedPost.externalPostId,
        externalPostUrl: publishedPost.externalPostUrl,
        errorMessage: null,
      },
    });

    revalidatePath(`/influencers/${post.influencer.username}`);
    revalidatePath("/admin/influencers");
    revalidatePath("/admin/influencer-posts");
    revalidatePath("/lookbook");

    return Response.json({ ok: true, ...publishedPost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram publication failed.";

    await prisma.influencerPost.update({
      where: {
        id: post.id,
      },
      data: {
        status: InfluencerPostStatus.FAILED,
        errorMessage: message,
      },
    });

    revalidatePath("/admin/influencer-posts");

    return Response.json({ error: message }, { status: 502 });
  }
}
