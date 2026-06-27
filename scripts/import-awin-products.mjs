import "dotenv/config";
import { readFile } from "node:fs/promises";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const gunzipAsync = promisify(gunzip);

const FIELD_ALIASES = {
  title: ["product_name", "productname", "name", "title", "product_title"],
  description: ["description", "product_description", "short_description", "product_short_description"],
  price: ["search_price", "price", "product_price", "rrp_price", "display_price"],
  category: ["category_name", "merchant_category", "aw_product_type", "product_type", "category"],
  productType: ["product_type", "aw_product_type"],
  categoryPath: ["merchant_product_category_path"],
  secondCategory: ["merchant_product_second_category"],
  thirdCategory: ["merchant_product_third_category"],
  imageUrl: ["merchant_image_url", "large_image", "product_image", "image_url", "aw_image_url"],
  shopUrl: ["aw_deep_link", "deeplink", "deep_link", "merchant_deep_link", "product_url", "url"],
  brand: ["brand_name", "product_brand", "manufacturer", "brand"],
  currency: ["currency", "currency_code", "search_currency"],
  merchant: ["merchant_name", "advertiser_name", "program_name"],
  colour: ["colour", "color", "product_colour", "product_color"],
  material: ["material", "materials"],
  suitableFor: ["suitable_for", "gender", "department"],
  delivery: ["delivery_time", "delivery", "shipping_time"],
  shippingCost: ["delivery_cost", "shipping_cost", "shipping_price"],
  shippingCountry: ["shipping_country", "shipping_from", "delivery_country", "country"],
  savingsPercent: ["savings_percent", "saving", "discount_percent"],
  oldPrice: ["product_price_old", "rrp_price", "store_price"],
  inStock: ["in_stock", "stock_status"],
  isForSale: ["is_for_sale", "web_offer"],
};

const CATEGORY_RULES = [
  ["dresses", ["dress", "robe"]],
  ["outerwear", ["jacket", "coat", "blazer", "bomber", "gilet", "windbreaker", "rain jacket", "puffer", "outerwear", "veste", "manteau"]],
  ["shirts", ["jersey", "shirt", "shirts", "top", "tops", "polo", "blouse", "tee", "t-shirt", "chemise", "maillot"]],
  ["pulls", ["jumper", "sweater", "pullover", "cardigan", "knit", "hoodie", "sweat", "pull"]],
  ["bottoms", ["trouser", "trousers", "pants", "sweatpants", "jean", "jeans", "skirt", "shorts", "joggers", "leggings", "bermuda", "pantalon", "jupe"]],
  ["shoes", ["shoe", "shoes", "sneaker", "sneakers", "trainer", "trainers", "footwear", "loafer", "loafers", "boot", "heel", "sandals", "sliders", "mules", "chaussure", "basket", "botte"]],
  ["caps", ["cap", "hat", "beanie", "casquette", "bonnet"]],
  ["accessories", ["accessories", "bag", "bags", "jewellery", "jewelry", "watch", "watches", "belt", "sunglasses", "accessoire", "sac", "bijou"]],
  ["fitness-equipment", ["fitness equipment", "dumbbell", "dumbbells", "skipping rope", "resistance tube", "resistance tubes", "stepper", "steppers", "boxing", "support aids", "workout", "training gloves"]],
  ["beauty", ["beauty", "makeup", "cosmetic", "perfume", "beaute", "parfum"]],
];

const GENDER_TAGS = {
  men: { name: "Homme", slug: "gender-men", type: "gender" },
  women: { name: "Femme", slug: "gender-women", type: "gender" },
  unisex: { name: "Unisexe", slug: "gender-unisex", type: "gender" },
};

const PRODUCT_BRAND_RULES = [
  [/^adidas\s+originals\b/i, "adidas Originals"],
  [/^adidas\b/i, "adidas"],
  [/^gucci\b/i, "Gucci"],
  [/^reebok\b/i, "Reebok"],
  [/^nike\b/i, "Nike"],
  [/^puma\b/i, "Puma"],
  [/^tommy\s+hilfiger\b/i, "Tommy Hilfiger"],
  [/^tommy\s+jeans\b/i, "Tommy Jeans"],
  [/^boss\b/i, "Boss"],
  [/^bugatti\b/i, "Bugatti"],
];

const BLOCKED_MERCHANT_SLUGS = new Set([
  "fashiontamers-us",
  "t-luxy",
]);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function titleize(value) {
  return String(value || "")
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (quoted && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);

  return rows;
}

function detectDelimiter(text) {
  const headerLine = text.split(/\r?\n/, 1)[0] || "";
  const candidates = ["\t", ";", ","];
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: parseDelimited(headerLine, delimiter)[0]?.length || 0,
    }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
}

function getField(row, aliases) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function parsePrice(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (["1", "true", "yes", "y", "in stock", "available"].includes(text)) return true;
  if (["0", "false", "no", "n", "out of stock", "unavailable"].includes(text)) return false;
  return null;
}

function parseList(value) {
  return String(value || "")
    .split(/[|,;/]+/)
    .map((part) => titleize(part.trim()))
    .filter(Boolean)
    .slice(0, 8);
}

function parseRawList(value) {
  return String(value || "")
    .split(/[|]+/)
    .map((part) => part.trim())
    .filter((part) => !isPlaceholderImageUrl(part))
    .filter(Boolean)
    .slice(0, 8);
}

function isPlaceholderImageUrl(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("noimage") || text.includes("no-image") || text.includes("no_image") || text.includes("placeholder");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textHasKeyword(text, keyword) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, "i").test(text);
}

function inferModuleId(sourceCategory, title, description) {
  const text = `${sourceCategory} ${title} ${description}`.toLowerCase();
  const match = CATEGORY_RULES.find(([, keywords]) => keywords.some((keyword) => textHasKeyword(text, keyword)));
  return match?.[0] || slugify(sourceCategory || "accessories") || "accessories";
}

function collectSourceCategories(rawProduct, moduleId) {
  return [
    getField(rawProduct, FIELD_ALIASES.productType),
    getField(rawProduct, FIELD_ALIASES.categoryPath),
    getField(rawProduct, FIELD_ALIASES.secondCategory),
    getField(rawProduct, FIELD_ALIASES.thirdCategory),
    getField(rawProduct, FIELD_ALIASES.category),
    moduleId,
  ]
    .flatMap((value) => String(value || "").split(/[>|,;/]+/))
    .map((value) => titleize(value.trim()))
    .filter(Boolean);
}

function inferDeliveryRange(value) {
  const text = String(value || "").toLowerCase();
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };

  const single = text.match(/(\d+)/);
  if (single) {
    const days = Number(single[1]);
    return { min: days, max: days };
  }

  return { min: null, max: null };
}

function normalizeCountryCode(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const normalized = text.toLowerCase();
  const countryMap = {
    france: "FR",
    fr: "FR",
    uk: "GB",
    "united kingdom": "GB",
    gb: "GB",
    germany: "DE",
    de: "DE",
    spain: "ES",
    es: "ES",
    italy: "IT",
    it: "IT",
    usa: "US",
    "united states": "US",
    us: "US",
  };

  return countryMap[normalized] || (text.length === 2 ? text.toUpperCase() : null);
}

function inferProductBrandName(title) {
  const text = String(title || "").trim();
  if (!text) return "";

  for (const [pattern, brandName] of PRODUCT_BRAND_RULES) {
    if (pattern.test(text)) return brandName;
  }

  return "";
}

function inferGenderTarget({ title, description, sourceCategory, suitableFor }) {
  const titleText = String(title || "").toLowerCase();
  const fallbackText = [description, sourceCategory, suitableFor].filter(Boolean).join(" ").toLowerCase();
  const unisexPattern = /\b(unisex|mixed)\b/;
  const womenPattern = /\b(women|womens|women's|woman|female|ladies|lady|girls|girl|femme)\b/;
  const menPattern = /\b(men|mens|men's|man|male|gentlemen|gentleman|boys|boy|homme)\b/;

  if (unisexPattern.test(titleText)) return "unisex";
  if (womenPattern.test(titleText)) return "women";
  if (menPattern.test(titleText)) return "men";
  if (unisexPattern.test(fallbackText)) return "unisex";

  const fallbackWomen = womenPattern.test(fallbackText);
  const fallbackMen = menPattern.test(fallbackText);

  if (fallbackWomen && !fallbackMen) return "women";
  if (fallbackMen && !fallbackWomen) return "men";

  return null;
}

function buildTags({ sourceCategory, moduleId, brandName, merchantName, suitableFor, genderTarget }) {
  const baseTags = [
    { name: "Awin", slug: "awin", type: "source" },
    { name: titleize(sourceCategory || moduleId), slug: slugify(sourceCategory || moduleId), type: "source-category" },
    { name: titleize(moduleId), slug: slugify(moduleId), type: "module" },
    { name: brandName, slug: slugify(brandName), type: "brand" },
    merchantName ? { name: merchantName, slug: `merchant-${slugify(merchantName)}`, type: "merchant" } : null,
    genderTarget ? GENDER_TAGS[genderTarget] : null,
    ...parseList(suitableFor).map((name) => ({ name, slug: slugify(name), type: "audience" })),
  ].filter(Boolean);

  return baseTags.filter((tag, index, self) => tag.slug && self.findIndex((entry) => entry.slug === tag.slug) === index);
}

async function readFeed(filePath) {
  const buffer = await readFile(filePath);
  const content = filePath.toLowerCase().endsWith(".gz") ? await gunzipAsync(buffer) : buffer;
  const text = content.toString("utf8");
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  const headers = (rows.shift() || []).map(normalizeHeader);

  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])),
  );
}

async function upsertArticle(rawProduct) {
  const title = getField(rawProduct, FIELD_ALIASES.title);
  const price = parsePrice(getField(rawProduct, FIELD_ALIASES.price));
  const shopUrl = getField(rawProduct, FIELD_ALIASES.shopUrl);

  if (!title || price === null || !shopUrl) return "skipped";

  const description = getField(rawProduct, FIELD_ALIASES.description);
  const sourceCategory = getField(rawProduct, FIELD_ALIASES.category);
  const categoryText = [
    getField(rawProduct, FIELD_ALIASES.productType),
    getField(rawProduct, FIELD_ALIASES.categoryPath),
    getField(rawProduct, FIELD_ALIASES.secondCategory),
    getField(rawProduct, FIELD_ALIASES.thirdCategory),
    sourceCategory,
  ]
    .filter(Boolean)
    .join(" ");
  const suitableFor = getField(rawProduct, FIELD_ALIASES.suitableFor);
  const moduleId = inferModuleId(categoryText || sourceCategory, title, description);
  const genderTarget = inferGenderTarget({ title, description, sourceCategory: categoryText || sourceCategory, suitableFor });
  const merchantName = getField(rawProduct, FIELD_ALIASES.merchant);
  const brandName = getField(rawProduct, FIELD_ALIASES.brand) || inferProductBrandName(title) || merchantName || "Awin";
  const imageUrls = parseRawList(getField(rawProduct, FIELD_ALIASES.imageUrl));
  const deliveryRange = inferDeliveryRange(getField(rawProduct, FIELD_ALIASES.delivery));
  const shippingPrice = parsePrice(getField(rawProduct, FIELD_ALIASES.shippingCost));
  const shippingCountry = normalizeCountryCode(getField(rawProduct, FIELD_ALIASES.shippingCountry));
  const savingsPercent = parseInteger(getField(rawProduct, FIELD_ALIASES.savingsPercent));
  const oldPrice = parsePrice(getField(rawProduct, FIELD_ALIASES.oldPrice));
  const inStock = parseBoolean(getField(rawProduct, FIELD_ALIASES.inStock));
  const isForSale = parseBoolean(getField(rawProduct, FIELD_ALIASES.isForSale));
  const colors = parseList(getField(rawProduct, FIELD_ALIASES.colour));
  const materials = parseList(getField(rawProduct, FIELD_ALIASES.material));

  if (BLOCKED_MERCHANT_SLUGS.has(slugify(merchantName))) return "skipped";

  const styleTags = [
    ...collectSourceCategories(rawProduct, moduleId),
    ...parseList(suitableFor),
  ].filter((tag, index, self) => tag && self.indexOf(tag) === index);

  const brand = await prisma.brand.upsert({
    where: {
      slug: slugify(brandName),
    },
    update: {
      name: brandName,
    },
    create: {
      name: brandName,
      slug: slugify(brandName),
    },
    select: {
      id: true,
    },
  });

  const existingArticle = await prisma.article.findFirst({
    where: {
      OR: [
        { shopUrl },
        {
          title,
          brand: brandName,
          category: moduleId,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const data = {
    title,
    description: description || null,
    price,
    category: moduleId,
    imageUrls,
    brand: brandName,
    brandId: brand.id,
    shopUrl,
    shippingCountry,
    shippingCountries: shippingCountry ? [shippingCountry] : [],
    shippingPrice,
    shippingCurrency: getField(rawProduct, FIELD_ALIASES.currency) || "EUR",
    freeShipping: shippingPrice === 0,
    estimatedDeliveryMinDays: deliveryRange.min,
    estimatedDeliveryMaxDays: deliveryRange.max,
    isOnSale: Boolean((savingsPercent && savingsPercent > 0) || (oldPrice !== null && oldPrice > price)),
    discountPercent:
      savingsPercent && savingsPercent > 0
        ? Math.min(savingsPercent, 95)
        : oldPrice !== null && oldPrice > price
          ? Math.min(Math.round(((oldPrice - price) / oldPrice) * 100), 95)
          : null,
    colors,
    materials,
    styleTags,
  };

  if (inStock === false || isForSale === false) {
    data.styleTags = [...new Set([...data.styleTags, "Unavailable"])];
  }

  const article = existingArticle
    ? await prisma.article.update({
        where: { id: existingArticle.id },
        data,
        select: { id: true },
      })
    : await prisma.article.create({
        data,
        select: { id: true },
      });

  const tags = buildTags({
    sourceCategory,
    moduleId,
    brandName,
    merchantName,
    suitableFor,
    genderTarget,
  });

  await prisma.articleTag.deleteMany({
    where: {
      articleId: article.id,
      tag: {
        type: {
          in: ["brand", "merchant"],
        },
      },
    },
  });

  for (const tagData of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug: tagData.slug },
      update: {
        name: tagData.name,
        type: tagData.type,
      },
      create: tagData,
      select: { id: true },
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

  return existingArticle ? "updated" : "created";
}

async function main() {
  const filePath = process.argv[2];
  const limit = Number.parseInt(process.env.AWIN_IMPORT_LIMIT || "", 10);

  if (!filePath) {
    throw new Error("Usage: npm run import:awin -- <path-to-awin-feed.csv|tsv|gz>");
  }

  const rows = await readFeed(filePath);
  const products = Number.isFinite(limit) && limit > 0 ? rows.slice(0, limit) : rows;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const result = await upsertArticle(product);
    if (result === "created") created += 1;
    if (result === "updated") updated += 1;
    if (result === "skipped") skipped += 1;
  }

  console.log(`Awin import completed. Created: ${created}. Updated: ${updated}. Skipped: ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
