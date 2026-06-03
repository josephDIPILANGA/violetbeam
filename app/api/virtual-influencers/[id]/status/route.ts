import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
type VirtualInfluencerStatusValue = (typeof allowedStatuses)[number];

function isAllowedStatus(status: unknown): status is VirtualInfluencerStatusValue {
  return typeof status === "string" && allowedStatuses.includes(status as VirtualInfluencerStatusValue);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Influencer invalide." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { status?: unknown };

  if (!isAllowedStatus(body.status)) {
    return Response.json({ error: "Statut invalide." }, { status: 400 });
  }

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      username: true,
      bodyReferenceImageUrl: true,
      faceReferenceImageUrl: true,
      profileImageUrl: true,
    },
  });

  if (!influencer) {
    return Response.json({ error: "Influencer introuvable." }, { status: 404 });
  }

  const hasReferenceImage = Boolean(
    influencer.bodyReferenceImageUrl || influencer.faceReferenceImageUrl || influencer.profileImageUrl,
  );

  if (body.status === "ACTIVE" && !hasReferenceImage) {
    return Response.json({ error: "Ajoute d'abord une image de reference avant activation." }, { status: 400 });
  }

  await prisma.virtualInfluencer.update({
    where: {
      id: influencerId,
    },
    data: {
      status: body.status,
    },
  });

  revalidatePath("/admin/influencers");
  revalidatePath("/admin/influencer-posts");
  revalidatePath("/admin/editorial-calendar");
  revalidatePath(`/influencers/${influencer.username}`);

  return Response.json({ ok: true });
}
