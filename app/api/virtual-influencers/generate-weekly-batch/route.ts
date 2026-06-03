import { spawnSync } from "child_process";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const contentFormats = ["outfit", "product-spotlight", "trend", "editorial", "try-this-look"];

function getFormatForInfluencer(influencerIndex: number) {
  return contentFormats[influencerIndex % contentFormats.length];
}

function assertGenerationEnv() {
  const required = [
    "OPENAI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables for generation: ${missing.join(", ")}`);
  }
}

function runGeneration({ username, format }: { username: string; format: string }) {
  const result = spawnSync(
    process.execPath,
    [
      "scripts/generate-influencer-posts.mjs",
      "--username",
      username,
      "--limit",
      "1",
      "--articles",
      "3",
      "--format",
      format,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Generation failed for ${username}`);
  }

  return result.stdout;
}

export async function POST(request: Request) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const body = (await request.json().catch(() => ({}))) as {
    includeDrafts?: unknown;
    confirmed?: unknown;
  };

  if (body.confirmed !== true) {
    return Response.json({ error: "Generation must be explicitly confirmed." }, { status: 400 });
  }

  try {
    assertGenerationEnv();
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Missing generation config." }, { status: 400 });
  }

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
    },
  });

  const results = [];

  for (const [index, influencer] of influencers.entries()) {
    const format = getFormatForInfluencer(index);

    try {
      const output = runGeneration({
        username: influencer.username,
        format,
      });

      results.push({
        ok: true,
        influencerId: influencer.id,
        displayName: influencer.displayName,
        username: influencer.username,
        status: influencer.status,
        format,
        output,
      });
    } catch (error) {
      results.push({
        ok: false,
        influencerId: influencer.id,
        displayName: influencer.displayName,
        username: influencer.username,
        status: influencer.status,
        format,
        error: error instanceof Error ? error.message : "Generation failed.",
      });
    }
  }

  revalidatePath("/admin/influencers");
  revalidatePath("/admin/influencer-posts");
  revalidatePath("/admin/editorial-calendar");
  revalidatePath("/lookbook");

  return Response.json({
    ok: true,
    includeDrafts,
    influencerCount: influencers.length,
    createdCount: results.filter((result) => result.ok).length,
    failedCount: results.filter((result) => !result.ok).length,
    results,
  });
}
