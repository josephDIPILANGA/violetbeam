import { prisma } from "@/lib/prisma";
import { normalizeCompositionItems, type CompositionItem } from "@/lib/compositions";

type SaveCompositionPayload = {
  generatedUrl?: string;
  prompt?: string;
  items?: CompositionItem[];
  name?: string;
};

export async function GET() {
  const compositions = await prisma.composition.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
    select: {
      id: true,
      name: true,
      generatedUrl: true,
      thumbnailUrl: true,
      itemsSummary: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return Response.json({
    compositions: compositions.map((composition) => ({
      id: composition.id,
      name: composition.name,
      generatedUrl: composition.generatedUrl,
      thumbnailUrl: composition.thumbnailUrl,
      items: normalizeCompositionItems(composition.itemsSummary),
      createdAt: composition.createdAt.toISOString(),
      userName: composition.user.name,
    })),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SaveCompositionPayload;

  if (!payload.generatedUrl) {
    return Response.json({ error: "Image generee requise." }, { status: 400 });
  }

  if (!payload.items?.length) {
    return Response.json({ error: "Articles de composition requis." }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: {
      email: process.env.DEFAULT_USER_EMAIL || "demo@cabine.local",
    },
    update: {},
    create: {
      email: process.env.DEFAULT_USER_EMAIL || "demo@cabine.local",
      name: "Demo Cabine",
    },
  });

  const composition = await prisma.composition.create({
    data: {
      userId: user.id,
      name: payload.name || "Mon Look",
      generatedUrl: payload.generatedUrl,
      thumbnailUrl: payload.generatedUrl,
      prompt: payload.prompt,
      itemsSummary: payload.items,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return Response.json({
    id: composition.id,
    createdAt: composition.createdAt.toISOString(),
  });
}
