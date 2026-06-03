import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Agent invalide." }, { status: 400 });
  }

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      username: true,
      status: true,
      automationEnabled: true,
    },
  });

  if (!influencer) {
    return Response.json({ error: "Agent introuvable." }, { status: 404 });
  }

  if (influencer.status !== "ACTIVE") {
    return Response.json({ error: "Activate this agent before running autonomy now." }, { status: 400 });
  }

  if (!influencer.automationEnabled) {
    return Response.json({ error: "Enable autonomy before running this agent now." }, { status: 400 });
  }

  const updatedInfluencer = await prisma.virtualInfluencer.update({
    where: {
      id: influencerId,
    },
    data: {
      nextAutomatedPostAt: new Date(),
    },
    select: {
      id: true,
      nextAutomatedPostAt: true,
    },
  });

  revalidatePath("/admin/influencers");

  return Response.json({
    influencer: {
      ...updatedInfluencer,
      nextAutomatedPostAt: updatedInfluencer.nextAutomatedPostAt?.toISOString() || null,
    },
  });
}
