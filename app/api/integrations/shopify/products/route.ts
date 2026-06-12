import { createHash, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { slugifyCatalogText } from "@/lib/catalog";

type ShopifyMarketplacePayload = {
  title?: string;
  shortDescription?: string;
  description?: string;
  price?: string | number;
  imageUrl?: string;
  vendor?: string;
  shopDomain?: string;
  shopifyProductUrl?: string;
  category?: string;
  colors?: string[] | string;
  materials?: string[] | string;
  styleTags?: string[] | string;
  tags?: string[] | string;
};

const CLOUDINARY_FOLDER =
  process.env.CLOUDINARY_SHOPIFY_PRODUCTS_FOLDER || "violetbeam/shopify-products";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => cleanText(entry)).filter(Boolean).slice(0, 30);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return [];
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

function signCloudinaryParams(params: Record<string, string | number>) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

function dataUrlToBuffer(dataUrl: string) {
  const [metadata, base64] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

  return {
    buffer: Buffer.from(base64 || "", "base64"),
    mimeType,
  };
}

async function uploadDataUrlToCloudinary(dataUrl: string, publicId: string) {
  const requiredEnv = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Cloudinary is not configured: ${missing.join(", ")}`);
  }

  const { buffer, mimeType } = dataUrlToBuffer(dataUrl);
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: CLOUDINARY_FOLDER,
    overwrite: "true",
    public_id: publicId,
    timestamp,
  };
  const signature = signCloudinaryParams(params);
  const formData = new FormData();
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);

  new Uint8Array(arrayBuffer).set(buffer);
  formData.append("file", new Blob([arrayBuffer], { type: mimeType }), `${publicId}.jpg`);
  formData.append("api_key", process.env.CLOUDINARY_API_KEY || "");
  formData.append("signature", signature);

  for (const [key, value] of Object.entries(params)) {
    formData.append(key, String(value));
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Cloudinary upload failed with status ${response.status}`);
  }

  return data.secure_url as string;
}

async function normalizeImageUrl(imageUrl: string, title: string) {
  if (!imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  const publicId = `${slugifyCatalogText(title) || "shopify-product"}-${Date.now()}`;

  return uploadDataUrlToCloudinary(imageUrl, publicId);
}

export async function POST(request: Request) {
  if (!process.env.SHOPIFY_MARKETPLACE_SYNC_SECRET) {
    return json({ error: "SHOPIFY_MARKETPLACE_SYNC_SECRET is not configured." }, { status: 500 });
  }

  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as ShopifyMarketplacePayload;
    const title = cleanText(payload.title);
    const description =
      cleanText(payload.description) || cleanText(payload.shortDescription);
    const price = Number(payload.price);
    const imageUrl = cleanText(payload.imageUrl);
    const vendor = cleanText(payload.vendor) || "Shopify merchant";
    const shopDomain = cleanText(payload.shopDomain)
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const shopifyProductUrl = cleanText(payload.shopifyProductUrl);
    const category = slugifyCatalogText(cleanText(payload.category) || "fashion") || "fashion";

    if (!title || !description || !Number.isFinite(price) || price <= 0 || !imageUrl) {
      return json(
        {
          error:
            "Title, description, positive price, and imageUrl are required.",
        },
        { status: 400 },
      );
    }

    if (!shopDomain) {
      return json({ error: "shopDomain is required." }, { status: 400 });
    }

    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: {
        shopDomain,
      },
      select: {
        approvedForPosting: true,
        user: {
          select: {
            emailVerified: true,
          },
        },
      },
    });

    if (!merchantProfile?.approvedForPosting || !merchantProfile.user.emailVerified) {
      return json(
        {
          error:
            "A verified VioletBeam merchant account is required before adding Shopify products.",
          authRequired: true,
        },
        { status: 403 },
      );
    }

    const hostedImageUrl = await normalizeImageUrl(imageUrl, title);
    const brand = await prisma.brand.upsert({
      where: {
        name: vendor,
      },
      update: {
        websiteUrl: shopDomain ? `https://${shopDomain}` : undefined,
      },
      create: {
        name: vendor,
        slug: slugifyCatalogText(vendor) || `shopify-${Date.now()}`,
        description: shopDomain ? `Shopify merchant: ${shopDomain}` : "Shopify merchant",
        websiteUrl: shopDomain ? `https://${shopDomain}` : undefined,
      },
      select: {
        id: true,
      },
    });
    const articleData = {
      title,
      description,
      price,
      category,
      imageUrls: [hostedImageUrl],
      brand: vendor,
      brandId: brand.id,
      shopUrl: shopifyProductUrl || (shopDomain ? `https://${shopDomain}` : null),
      shippingCountry: "Shopify",
      shippingCountries: ["Shopify"],
      shippingPrice: 0,
      shippingCurrency: "EUR",
      freeShipping: false,
      colors: normalizeList(payload.colors),
      materials: normalizeList(payload.materials),
      styleTags: normalizeList(payload.styleTags),
    };

    const existing = shopifyProductUrl
      ? await prisma.article.findFirst({
          where: {
            shopUrl: shopifyProductUrl,
          },
          select: {
            id: true,
          },
        })
      : null;

    const article = existing
      ? await prisma.article.update({
          where: {
            id: existing.id,
          },
          data: articleData,
          select: {
            id: true,
            title: true,
          },
        })
      : await prisma.article.create({
          data: articleData,
          select: {
            id: true,
            title: true,
          },
        });

    const tags = [
      ...normalizeList(payload.tags),
      vendor,
      shopDomain,
      category,
      "shopify",
    ]
      .filter(Boolean)
      .slice(0, 30);

    for (const tagName of tags) {
      const slug = slugifyCatalogText(tagName);

      if (!slug) continue;

      const tag = await prisma.tag.upsert({
        where: {
          slug,
        },
        update: {
          name: tagName,
          type: "shopify",
        },
        create: {
          name: tagName,
          slug,
          type: "shopify",
        },
        select: {
          id: true,
        },
      });

      await prisma.articleTag.upsert({
        where: {
          articleId_tagId: {
            articleId: article.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          articleId: article.id,
          tagId: tag.id,
        },
      });
    }

    return json({
      ok: true,
      article,
      marketplaceUrl: `/catalog/${article.id}-${slugifyCatalogText(article.title) || "article"}`,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected marketplace sync error.",
      },
      { status: 500 },
    );
  }
}
