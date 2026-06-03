import { prisma } from "@/lib/prisma";

type CompositionItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  prompt: string;
  moduleId: string;
  moduleLabel: string;
};

type UpdateCompositionPayload = {
  generatedUrl?: string;
  prompt?: string;
  items?: CompositionItem[];
  name?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const compositionId = Number(id);

  if (!Number.isInteger(compositionId) || compositionId <= 0) {
    return Response.json({ error: "Composition invalide." }, { status: 400 });
  }

  const payload = (await request.json()) as UpdateCompositionPayload;

  if (!payload.generatedUrl) {
    return Response.json({ error: "Image generee requise." }, { status: 400 });
  }

  if (!payload.items?.length) {
    return Response.json({ error: "Articles de composition requis." }, { status: 400 });
  }

  try {
    const composition = await prisma.composition.update({
      where: {
        id: compositionId,
      },
      data: {
        name: payload.name || "Mon Look",
        generatedUrl: payload.generatedUrl,
        thumbnailUrl: payload.generatedUrl,
        prompt: payload.prompt,
        itemsSummary: payload.items,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return Response.json({
      id: composition.id,
      updatedAt: composition.updatedAt.toISOString(),
    });
  } catch {
    return Response.json({ error: "Composition introuvable." }, { status: 404 });
  }
}
