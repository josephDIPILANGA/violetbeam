import { timingSafeEqual } from "node:crypto";

import { getMerchantPublishingState } from "@/lib/merchant-access";
import { prisma } from "@/lib/prisma";
import {
  buildShopifyQuota,
  getShopifyQuotaWindow,
  normalizeShopDomain,
  SHOPIFY_PRODUCT_STUDIO_ROUTE,
} from "@/lib/shopify-quota";

type ShopifyQuotaAction = "status" | "claim" | "complete";

type ShopifyQuotaPayload = {
  action?: ShopifyQuotaAction;
  shopDomain?: string;
  usageId?: number;
  status?: "SUCCESS" | "FAILED";
  imageModel?: string;
  promptHash?: string;
  errorMessage?: string;
};

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice("bearer ".length).trim()
    : "";
}

function isAuthorized(request: Request) {
  const secret = process.env.SHOPIFY_MARKETPLACE_SYNC_SECRET;
  const token = getBearerToken(request);

  if (!secret || !token) {
    return false;
  }

  const expected = Buffer.from(secret);
  const received = Buffer.from(token);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getShopifyQuota(userId: number) {
  const { periodStart, periodEnd } = getShopifyQuotaWindow();
  const used = await prisma.generationUsage.count({
    where: {
      userId,
      route: SHOPIFY_PRODUCT_STUDIO_ROUTE,
      status: "SUCCESS",
      creditsCharged: {
        gt: 0,
      },
      createdAt: {
        gte: periodStart,
        lt: periodEnd,
      },
    },
  });

  return buildShopifyQuota(used);
}

export async function POST(request: Request) {
  if (!process.env.SHOPIFY_MARKETPLACE_SYNC_SECRET) {
    return json({ error: "SHOPIFY_MARKETPLACE_SYNC_SECRET is not configured." }, { status: 500 });
  }

  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ShopifyQuotaPayload | null;
  const action = payload?.action || "status";
  const shopDomain = normalizeShopDomain(payload?.shopDomain);

  if (!shopDomain) {
    return json({ error: "shopDomain is required." }, { status: 400 });
  }

  if (!["status", "claim", "complete"].includes(action)) {
    return json({ error: "Invalid quota action." }, { status: 400 });
  }

  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: {
      shopDomain,
    },
    select: {
      userId: true,
      approvedForPosting: true,
      wantsMarketplace: true,
      user: {
        select: {
          emailVerified: true,
        },
      },
    },
  });
  const merchantStatus = getMerchantPublishingState(merchantProfile);

  if (!merchantStatus.active || !merchantProfile) {
    return json(
      {
        error: merchantStatus.message,
        merchantStatus,
        authRequired: true,
      },
      { status: 403 },
    );
  }

  if (action === "status") {
    return json({
      ok: true,
      shopDomain,
      quota: await getShopifyQuota(merchantProfile.userId),
      merchantStatus,
    });
  }

  if (action === "claim") {
    const quota = await getShopifyQuota(merchantProfile.userId);

    if (quota.remaining <= 0) {
      return json(
        {
          error: "Monthly Shopify image quota reached.",
          quotaExceeded: true,
          quota,
          merchantStatus,
        },
        { status: 402 },
      );
    }

    const usage = await prisma.generationUsage.create({
      data: {
        userId: merchantProfile.userId,
        route: SHOPIFY_PRODUCT_STUDIO_ROUTE,
        status: "STARTED",
        creditsCharged: 0,
        imageModel: cleanText(payload?.imageModel, 120) || null,
        promptHash: cleanText(payload?.promptHash, 120) || null,
      },
      select: {
        id: true,
      },
    });

    return json({
      ok: true,
      usageId: usage.id,
      shopDomain,
      quota,
      merchantStatus,
    });
  }

  const usageId = Number(payload?.usageId);

  if (!Number.isInteger(usageId) || usageId <= 0) {
    return json({ error: "usageId is required for complete action." }, { status: 400 });
  }

  const nextStatus = payload?.status === "FAILED" ? "FAILED" : "SUCCESS";
  const usage = await prisma.generationUsage.findFirst({
    where: {
      id: usageId,
      userId: merchantProfile.userId,
      route: SHOPIFY_PRODUCT_STUDIO_ROUTE,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!usage) {
    return json({ error: "Generation usage was not found for this merchant." }, { status: 404 });
  }

  if (usage.status === "SUCCESS") {
    return json({
      ok: true,
      usageId: usage.id,
      shopDomain,
      quota: await getShopifyQuota(merchantProfile.userId),
      merchantStatus,
      alreadyCompleted: true,
    });
  }

  await prisma.generationUsage.update({
    where: {
      id: usage.id,
    },
    data: {
      status: nextStatus,
      creditsCharged: nextStatus === "SUCCESS" ? 1 : 0,
      errorMessage:
        nextStatus === "FAILED" ? cleanText(payload?.errorMessage, 500) || "Shopify generation failed." : null,
    },
  });

  return json({
    ok: true,
    usageId: usage.id,
    shopDomain,
    quota: await getShopifyQuota(merchantProfile.userId),
    merchantStatus,
  });
}
