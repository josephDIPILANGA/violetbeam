import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import {
  calculateNextAutomatedPostAt,
  isPostingFrequency,
  normalizePostTime,
} from "@/lib/influencer-automation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Agent invalide." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    automationEnabled?: unknown;
    postingFrequency?: unknown;
    preferredPostTime?: unknown;
  };

  const automationEnabled = Boolean(payload.automationEnabled);
  const postingFrequency = isPostingFrequency(payload.postingFrequency) ? payload.postingFrequency : "DAILY";
  const preferredPostTime = normalizePostTime(payload.preferredPostTime);
  const nextAutomatedPostAt = automationEnabled
    ? calculateNextAutomatedPostAt({
        postingFrequency,
        preferredPostTime,
      })
    : null;

  const influencer = await prisma.virtualInfluencer.update({
    where: {
      id: influencerId,
    },
    data: {
      automationEnabled,
      postingFrequency: automationEnabled ? postingFrequency : null,
      preferredPostTime: automationEnabled ? preferredPostTime : null,
      nextAutomatedPostAt,
    },
    select: {
      id: true,
      automationEnabled: true,
      postingFrequency: true,
      preferredPostTime: true,
      nextAutomatedPostAt: true,
    },
  });

  revalidatePath("/admin/influencers");

  return Response.json({
    influencer: {
      ...influencer,
      nextAutomatedPostAt: influencer.nextAutomatedPostAt?.toISOString() || null,
    },
  });
}
