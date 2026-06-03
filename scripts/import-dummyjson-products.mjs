import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_CATEGORIES = [
  "mens-shirts",
  "tops",
  "womens-dresses",
  "womens-shoes",
  "mens-shoes",
  "womens-bags",
  "sunglasses",
];

const DUMMYJSON_CATEGORY_MODULE_MAP = {
  "mens-shirts": "shirts",
  tops: "shirts",
  "womens-dresses": "dresses",
  "womens-shoes": "shoes",
  "mens-shoes": "shoes",
  "womens-bags": "accessories",
  "womens-jewellery": "accessories",
  sunglasses: "accessories",
  "mens-watches": "accessories",
  "womens-watches": "accessories",
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function getCategoryFromInput(input) {
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) || input;
  } catch {
    return input;
  }
}

function getModuleIdForSourceCategory(category) {
  return DUMMYJSON_CATEGORY_MODULE_MAP[category] ?? category.replace(/[^a-z0-9]+/g, "-");
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleize(value) {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferShippingCountry(product) {
  const text = `${product.shippingInformation || ""} ${product.warrantyInformation || ""}`.toLowerCase();

  if (text.includes("france") || text.includes("eu")) return "FR";
  if (text.includes("uk") || text.includes("united kingdom")) return "GB";
  if (text.includes("canada")) return "CA";
  if (text.includes("usa") || text.includes("united states")) return "US";

  return "US";
}

function inferDeliveryRange(product) {
  const text = String(product.shippingInformation || "").toLowerCase();
  const match = text.match(/(\d+)\s*-\s*(\d+)/);

  if (match) {
    return {
      min: Number(match[1]),
      max: Number(match[2]),
    };
  }

  if (text.includes("overnight")) {
    return { min: 1, max: 2 };
  }

  if (text.includes("week")) {
    return { min: 5, max: 10 };
  }

  return { min: 3, max: 7 };
}

function inferColors(product) {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const colors = ["black", "white", "blue", "red", "green", "yellow", "pink", "purple", "brown", "grey", "gray", "silver", "gold"];

  return colors.filter((color) => text.includes(color)).map(titleize);
}

function inferMaterials(product) {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const materials = ["cotton", "leather", "denim", "silk", "wool", "linen", "polyester", "metal", "gold", "silver"];

  return materials.filter((material) => text.includes(material)).map(titleize);
}

function inferStyleTags(product, sourceCategory, moduleId) {
  const text = `${product.title || ""} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
  const styleKeywords = ["casual", "formal", "luxury", "sport", "streetwear", "minimal", "summer", "party", "office", "travel"];
  const tags = [
    titleize(sourceCategory),
    titleize(moduleId),
    ...styleKeywords.filter((keyword) => text.includes(keyword)).map(titleize),
  ];

  return [...new Set(tags)];
}

function buildTags(product, sourceCategory, moduleId, brandName) {
  const tags = [
    { name: titleize(sourceCategory), slug: slugify(sourceCategory), type: "source-category" },
    { name: titleize(moduleId), slug: slugify(moduleId), type: "module" },
    { name: brandName, slug: slugify(brandName), type: "brand" },
  ];
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();

  for (const keyword of ["cotton", "leather", "casual", "formal", "dress", "shirt", "shoe", "bag", "sunglasses"]) {
    if (text.includes(keyword)) {
      tags.push({ name: titleize(keyword), slug: slugify(keyword), type: "style" });
    }
  }

  return tags.filter((tag, index, self) => self.findIndex((entry) => entry.slug === tag.slug) === index);
}

async function fetchCategory(category) {
  const response = await fetch(`https://dummyjson.com/products/category/${category}?limit=30`);

  if (!response.ok) {
    throw new Error(`DummyJSON ${category}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function importProduct(product, sourceCategory) {
  const moduleId = getModuleIdForSourceCategory(sourceCategory);
  const imageUrls = [product.thumbnail, ...(product.images || [])].filter(Boolean);
  const brandName = product.brand || "DummyJSON";
  const brand = await prisma.brand.upsert({
    where: {
      slug: slugify(brandName),
    },
    update: {
      name: brandName,
      popularity: Math.max(Number(product.rating || 0), 0),
    },
    create: {
      name: brandName,
      slug: slugify(brandName),
      popularity: Math.max(Number(product.rating || 0), 0),
    },
    select: {
      id: true,
    },
  });

  const existingArticle = await prisma.article.findFirst({
    where: {
      title: product.title,
      brand: brandName,
      category: moduleId,
    },
    select: {
      id: true,
    },
  });

  const data = {
    title: product.title,
    description: product.description,
    price: product.price,
    category: moduleId,
    imageUrls,
    brand: brandName,
    brandId: brand.id,
    shopUrl: `https://dummyjson.com/products/${product.id}`,
    rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : null,
    reviewCount: Array.isArray(product.reviews) ? product.reviews.length : 0,
    shippingCountry: inferShippingCountry(product),
    shippingCountries: [inferShippingCountry(product)],
    shippingPrice: 0,
    shippingCurrency: "USD",
    freeShipping: true,
    estimatedDeliveryMinDays: inferDeliveryRange(product).min,
    estimatedDeliveryMaxDays: inferDeliveryRange(product).max,
    isOnSale: Number(product.discountPercentage || 0) > 0,
    discountPercent: Number(product.discountPercentage || 0) > 0 ? Math.round(Number(product.discountPercentage)) : null,
    colors: inferColors(product),
    materials: inferMaterials(product),
    styleTags: inferStyleTags(product, sourceCategory, moduleId),
  };

  let articleId;

  if (existingArticle) {
    const article = await prisma.article.update({
      where: {
        id: existingArticle.id,
      },
      data,
      select: {
        id: true,
      },
    });
    articleId = article.id;
  } else {
    const article = await prisma.article.create({
      data,
      select: {
        id: true,
      },
    });
    articleId = article.id;
  }

  const tags = buildTags(product, sourceCategory, moduleId, brandName);

  for (const tagData of tags) {
    const tag = await prisma.tag.upsert({
      where: {
        slug: tagData.slug,
      },
      update: {
        name: tagData.name,
        type: tagData.type,
      },
      create: tagData,
      select: {
        id: true,
      },
    });

    await prisma.articleTag.upsert({
      where: {
        articleId_tagId: {
          articleId,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        articleId,
        tagId: tag.id,
      },
    });
  }

  return existingArticle ? "updated" : "created";
}

async function main() {
  const inputs = process.argv.slice(2);
  const categories = (inputs.length > 0 ? inputs : DEFAULT_CATEGORIES).map(getCategoryFromInput);
  let created = 0;
  let updated = 0;

  for (const category of categories) {
    const data = await fetchCategory(category);
    const products = Array.isArray(data.products) ? data.products : [];

    for (const product of products) {
      const result = await importProduct(product, category);
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }
  }

  console.log(`DummyJSON import completed. Created: ${created}. Updated: ${updated}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
