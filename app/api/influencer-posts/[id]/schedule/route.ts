import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type SchedulePayload = {
  scheduledAt?: string;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const postId = Number(id);
  const payload = (await request.json()) as SchedulePayload;
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;

  if (!Number.isFinite(postId)) {
    return Response.json({ error: "Post invalide." }, { status: 400 });
  }

  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return Response.json({ error: "Date de programmation invalide." }, { status: 400 });
  }

  const post = await prisma.influencerPost.update({
    where: {
      id: postId,
    },
    data: {
      status: "SCHEDULED",
      scheduledAt,
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
  revalidatePath("/lookbook");

  return Response.json({ ok: true });
}
