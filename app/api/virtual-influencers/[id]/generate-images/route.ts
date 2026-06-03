import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function assertGenerationEnv() {
  const required = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables for image generation: ${missing.join(", ")}`);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const influencerId = Number(id);

  if (!Number.isFinite(influencerId)) {
    return Response.json({ error: "Invalid influencer." }, { status: 400 });
  }

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });

  if (!influencer) {
    return Response.json({ error: "Influencer not found." }, { status: 404 });
  }

  try {
    assertGenerationEnv();

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["scripts/generate-influencer-images.mjs", "--username", influencer.username, "--limit", "1"],
      {
        cwd: process.cwd(),
        env: process.env,
        maxBuffer: 1024 * 1024 * 3,
        timeout: 1000 * 60 * 12,
        windowsHide: true,
      },
    );

    const updatedInfluencer = await prisma.virtualInfluencer.findUnique({
      where: {
        id: influencer.id,
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        profileImageUrl: true,
        faceReferenceImageUrl: true,
        bodyReferenceImageUrl: true,
      },
    });

    revalidatePath("/admin/create-influencer");
    revalidatePath("/admin/influencers");
    revalidatePath(`/influencers/${influencer.username}`);

    return Response.json({
      ok: true,
      influencer: updatedInfluencer,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    const commandError = error as Error & { stdout?: string; stderr?: string };

    return Response.json(
      {
        error: commandError.message || "Image generation failed.",
        stdout: commandError.stdout?.trim() || "",
        stderr: commandError.stderr?.trim() || "",
      },
      { status: 500 },
    );
  }
}
