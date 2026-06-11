import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
}

function normalizeShopDomain(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function buildMerchantUrl(path: string, shopDomain: string, request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const url = new URL(path, appUrl);
  url.searchParams.set("merchant", "shopify");
  url.searchParams.set("shop", shopDomain);
  return url.toString();
}

export async function POST(request: Request) {
  const expectedSecret = process.env.SHOPIFY_MARKETPLACE_SYNC_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "SHOPIFY_MARKETPLACE_SYNC_SECRET is not configured." }, { status: 500 });
  }

  if (getBearerToken(request) !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const shopDomain = normalizeShopDomain(payload?.shopDomain);

  if (!shopDomain) {
    return NextResponse.json({ error: "shopDomain is required." }, { status: 400 });
  }

  const profile = await prisma.merchantProfile.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      approvedForPosting: true,
      user: {
        select: {
          emailVerified: true,
        },
      },
    },
  });

  const connected = Boolean(profile?.approvedForPosting && profile.user.emailVerified);

  return NextResponse.json({
    connected,
    shopDomain,
    signInUrl: buildMerchantUrl("/merchant/shopify/connect", shopDomain, request),
    signUpUrl: buildMerchantUrl("/sign-up", shopDomain, request),
  });
}
