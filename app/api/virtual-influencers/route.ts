import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createVirtualInfluencerSchema, getInfluencerFieldErrors } from "@/lib/validations/influencer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

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
  const instagramHandle = data.instagramHandle || data.username.replaceAll(".", "");
  const tiktokHandle = data.tiktokHandle || data.username.replaceAll(".", "");

  try {
    const influencer = await prisma.virtualInfluencer.create({
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
        status: "DRAFT",
        platformAccounts: {
          create: [
            {
              platform: "INSTAGRAM",
              handle: instagramHandle,
            },
            {
              platform: "TIKTOK",
              handle: tiktokHandle,
            },
          ],
        },
      },
      select: {
        id: true,
        displayName: true,
        username: true,
      },
    });

    revalidatePath("/admin/influencers");
    revalidatePath("/admin/create-influencer");

    return Response.json({
      ok: true,
      influencer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Influencer creation failed.";

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
