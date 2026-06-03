import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isFinite(postId)) {
    return Response.json({ error: "Post invalide." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim() || "Needs revision before approval.";

  const post = await prisma.influencerPost.update({
    where: {
      id: postId,
    },
    data: {
      status: "NEEDS_REVISION",
      errorMessage: reason,
      scheduledAt: null,
      publishedAt: null,
      externalPostId: null,
      externalPostUrl: null,
    },
    select: {
      influencer: {
        select: {
          username: true,
        },
      },
    },
  });

  revalidatePath(`/influencers/${post.influencer.username}`);
  revalidatePath("/admin/influencers");
  revalidatePath("/admin/influencer-posts");
  revalidatePath("/lookbook");

  return Response.json({ ok: true });
}
