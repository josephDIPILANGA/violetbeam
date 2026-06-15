import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanText(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeShopDomain(value: unknown) {
  return cleanText(value, 180)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isFinite(userId)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const name = cleanText(payload?.name, 50);
  const username = cleanText(payload?.username, 40).toLowerCase();
  const image = cleanText(payload?.image, 500);
  const wantsMerchantProfile = Boolean(payload?.wantsMerchantProfile);
  const shopName = cleanText(payload?.merchantProfile?.shopName, 80);
  const shopDomain = normalizeShopDomain(payload?.merchantProfile?.shopDomain);
  const shopDescription = cleanText(payload?.merchantProfile?.shopDescription, 500);
  const sector = cleanText(payload?.merchantProfile?.sector, 80);
  const country = cleanText(payload?.merchantProfile?.country, 80);

  if (!name || name.length < 3) {
    return Response.json({ error: "Le nom doit contenir au moins 3 caracteres." }, { status: 400 });
  }

  if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
    return Response.json(
      { error: "Le username doit contenir 3 a 40 caracteres valides." },
      { status: 400 },
    );
  }

  if (wantsMerchantProfile && (!shopName || !shopDomain)) {
    return Response.json(
      { error: "Le nom et l'URL de la boutique sont obligatoires pour devenir marchand." },
      { status: 400 },
    );
  }

  const existingUsername = await prisma.user.findFirst({
    where: {
      username,
      NOT: {
        id: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingUsername) {
    return Response.json({ error: "Ce username est deja utilise." }, { status: 409 });
  }

  if (wantsMerchantProfile) {
    const existingShop = await prisma.merchantProfile.findFirst({
      where: {
        shopDomain,
        NOT: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingShop) {
      return Response.json({ error: "Cette boutique est deja liee a un autre compte." }, { status: 409 });
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        username,
        image: image || null,
      },
    });

    if (wantsMerchantProfile) {
      await tx.merchantProfile.upsert({
        where: {
          userId,
        },
        create: {
          userId,
          shopName,
          shopDomain,
          shopDescription: shopDescription || null,
          sector: sector || null,
          country: country || null,
          platform: "SHOPIFY",
          wantsMarketplace: true,
          approvedForPosting: true,
        },
        update: {
          shopName,
          shopDomain,
          shopDescription: shopDescription || null,
          sector: sector || null,
          country: country || null,
          wantsMarketplace: true,
          approvedForPosting: true,
        },
      });
    } else {
      await tx.merchantProfile.updateMany({
        where: {
          userId,
        },
        data: {
          wantsMarketplace: false,
          approvedForPosting: false,
        },
      });
    }

    return tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        merchantProfile: {
          select: {
            id: true,
            shopName: true,
            shopDomain: true,
            wantsMarketplace: true,
            approvedForPosting: true,
          },
        },
      },
    });
  });

  return Response.json({
    ok: true,
    user,
    message: wantsMerchantProfile
      ? "Profil mis a jour. Votre espace marchand est actif."
      : "Profil mis a jour. L'acces marchand est desactive.",
  });
}
