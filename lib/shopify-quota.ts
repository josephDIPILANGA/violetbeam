export const SHOPIFY_PRODUCT_STUDIO_ROUTE = "SHOPIFY_PRODUCT_STUDIO";

const DEFAULT_SHOPIFY_PLAN_NAME = "Starter";
const DEFAULT_MONTHLY_IMAGE_LIMIT = 200;

export type ShopifyQuota = {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
};

export function normalizeShopDomain(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function getShopifyQuotaWindow(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    periodStart,
    periodEnd,
  };
}

export function getShopifyMonthlyImageLimit() {
  const configured = Number(process.env.SHOPIFY_STARTER_MONTHLY_IMAGES);

  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }

  return DEFAULT_MONTHLY_IMAGE_LIMIT;
}

export function getShopifyPlanName() {
  return process.env.SHOPIFY_DEFAULT_PLAN_NAME || DEFAULT_SHOPIFY_PLAN_NAME;
}

export function buildShopifyQuota(used: number, now = new Date()): ShopifyQuota {
  const { periodStart, periodEnd } = getShopifyQuotaWindow(now);
  const limit = getShopifyMonthlyImageLimit();

  return {
    plan: getShopifyPlanName(),
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}
