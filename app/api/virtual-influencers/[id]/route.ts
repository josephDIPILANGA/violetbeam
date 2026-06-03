import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createVirtualInfluencerSchema, getInfluencerFieldErrors } from "@/lib/validations/influencer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSocialHandle(data: { instagramHandle?: string; tiktokHandle?: string; username: string }, platform: "INSTAGRAM" | "TIKTOK") {
  const explicitHandle = platform === "INSTAGRAM" ? data.instagramHandle : data.tiktokHandle;
  return explicitHandle || data.username.replaceAll(".", "");
}

async function getInfluencer(influencerId: number) {
  return prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      username: true,
      emailAlias: true,
      bio: true,
      profileImageUrl: true,
      faceReferenceImageUrl: true,
      bodyReferenceImageUrl: true,
      morphology: true,
      height: true,
      bodyType: true,
      skinTone: true,
      hairStyle: true,
      fashionStyle: true,
      toneOfVoice: true,
      targetAudience: true,
      preferredCategories: true,
      promptContext: true,
      isAiDisclosed: true,
      platformAccounts: {
        select: {
          platform: true,
          handle: true,
          connectionStatus: true,
        },
      },
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Invalid influencer." }, { status: 400 });
  }

  const influencer = await getInfluencer(influencerId);

  if (!influencer) {
    return Response.json({ error: "Influencer not found." }, { status: 404 });
  }

  return Response.json({ influencer });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Invalid influencer." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createVirtualInfluencerSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid influencer data.",
        fieldErrors: getInfluencerFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const influencer = await prisma.$transaction(async (tx) => {
      const updatedInfluencer = await tx.virtualInfluencer.update({
        where: {
          id: influencerId,
        },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          username: data.username,
          emailAlias: data.emailAlias,
          bio: data.bio,
          morphology: data.morphology,
          height: data.height,
          bodyType: data.bodyType,
          skinTone: data.skinTone,
          hairStyle: data.hairStyle,
          fashionStyle: data.fashionStyle,
          toneOfVoice: data.toneOfVoice,
          targetAudience: data.targetAudience,
          preferredCategories: data.preferredCategories,
          promptContext: data.promptContext,
          isAiDisclosed: data.isAiDisclosed,
        },
        select: {
          id: true,
          displayName: true,
          username: true,
        },
      });

      for (const platform of ["INSTAGRAM", "TIKTOK"] as const) {
        await tx.influencerPlatformAccount.upsert({
          where: {
            influencerId_platform: {
              influencerId,
              platform,
            },
          },
          update: {
            handle: getSocialHandle(data, platform),
          },
          create: {
            influencerId,
            platform,
            handle: getSocialHandle(data, platform),
          },
        });
      }

      return updatedInfluencer;
    });

    revalidatePath("/admin/create-influencer");
    revalidatePath("/admin/influencers");
    revalidatePath(`/influencers/${influencer.username}`);

    return Response.json({
      ok: true,
      influencer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Influencer update failed.";

    if (message.includes("Unique constraint")) {
      return Response.json(
        {
          error: "This username, email alias or social handle already exists.",
        },
        { status: 409 },
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
