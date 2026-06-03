import { createHash } from "node:crypto";
import { getServerSession } from "next-auth";

import { TRY_ON_GENERATION_CREDIT_COST } from "@/lib/billing/plans";
import { markGenerationSucceeded, refundReservedCredits, reserveCredits } from "@/lib/billing/credits";
import { authOptions } from "@/lib/auth";

type TryOnPayload = {
  profileImage?: string;
  garmentImage?: string;
  garmentImages?: string[];
  garmentName?: string;
  articleDescription?: string;
  style?: string;
  prompt?: string;
};

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1539109132314-347f8541815b?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=1200",
];

function pickDemoImage(seed: string) {
  const index = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % DEMO_IMAGES.length;
  return DEMO_IMAGES[index];
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!Number.isFinite(userId)) {
    return Response.json(
      {
        error: "Connexion requise pour generer une image.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as TryOnPayload;

  if (!payload.profileImage || !payload.prompt) {
    return Response.json({ error: "Photo utilisateur et prompt requis." }, { status: 400 });
  }

  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
  const promptHash = createHash("sha256").update(payload.prompt).digest("hex");
  let reservedGeneration: Awaited<ReturnType<typeof reserveCredits>> | null = null;

  try {
    reservedGeneration = await reserveCredits({
      userId,
      amount: TRY_ON_GENERATION_CREDIT_COST,
      reason: "Virtual try-on generation",
      route: "/api/try-on",
      imageModel,
      promptHash,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_CREDITS") {
      return Response.json(
        {
          error: "Credits insuffisants. Choisissez un abonnement pour generer une image.",
          code: "NO_CREDITS",
        },
        { status: 402 }
      );
    }

    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    await markGenerationSucceeded(reservedGeneration.id);

    return Response.json({
      imageUrl: pickDemoImage(payload.prompt),
      prompt: payload.prompt,
      demo: true,
    });
  }

  const garmentImages = [
    ...(payload.garmentImages ?? []),
    ...(payload.garmentImage ? [payload.garmentImage] : []),
  ].filter(Boolean);

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageModel,
        images: [
          { image_url: payload.profileImage },
          ...garmentImages.slice(0, 15).map((imageUrl) => ({ image_url: imageUrl })),
        ],
        prompt: payload.prompt,
        size: "1024x1536",
        quality: "medium",
        output_format: "jpeg",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || "La generation OpenAI a echoue.";
      await refundReservedCredits({
        generationId: reservedGeneration.id,
        userId,
        amount: TRY_ON_GENERATION_CREDIT_COST,
        errorMessage,
      });

      return Response.json({ error: errorMessage }, { status: response.status });
    }

    const b64Json = data.data?.[0]?.b64_json;

    if (!b64Json) {
      const errorMessage = "Aucune image recue dans la reponse.";
      await refundReservedCredits({
        generationId: reservedGeneration.id,
        userId,
        amount: TRY_ON_GENERATION_CREDIT_COST,
        errorMessage,
      });

      return Response.json({ error: errorMessage }, { status: 502 });
    }

    await markGenerationSucceeded(reservedGeneration.id);

    return Response.json({
      imageUrl: `data:image/jpeg;base64,${b64Json}`,
      prompt: payload.prompt,
      demo: false,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur pendant la generation.";
    await refundReservedCredits({
      generationId: reservedGeneration.id,
      userId,
      amount: TRY_ON_GENERATION_CREDIT_COST,
      errorMessage,
    });

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
