import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isFinite(postId)) {
    return Response.json({ error: "Post invalide." }, { status: 400 });
  }

  const existingPost = await prisma.influencerPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      influencer: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!existingPost) {
    return Response.json({ error: "Post introuvable." }, { status: 404 });
  }

  const externalPostUrl = `https://violetbeam.com/influencers/${existingPost.influencer.username}?post=${postId}`;

  await prisma.influencerPost.update({
    where: {
      id: postId,
    },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      externalPostUrl,
    },
  });

  revalidatePath(`/influencers/${existingPost.influencer.username}`);
  revalidatePath("/admin/influencers");
  revalidatePath("/lookbook");

  return Response.json({ ok: true, externalPostUrl });
}
