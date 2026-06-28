import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { inferCatalogCategory } from "./awin-category-utils.mjs";

const FIELD_ALIASES = {
  title: ["product_name", "productname", "name", "title", "product_title"],
  description: ["description", "product_description", "short_description", "product_short_description"],
  shopUrl: ["aw_deep_link", "deeplink", "deep_link", "merchant_deep_link", "product_url", "url"],
  categoryName: ["category_name"],
  merchantCategory: ["merchant_category"],
  productType: ["product_type", "aw_product_type"],
  categoryPath: ["merchant_product_category_path"],
  secondCategory: ["merchant_product_second_category"],
  thirdCategory: ["merchant_product_third_category"],
};

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
  return ["\t", ";", ","]
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

async function readFeed(filePath) {
  const text = (await readFile(filePath)).toString("utf8");
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  const headers = (rows.shift() || []).map(normalizeHeader);

  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])),
  );
}

async function main() {
  const filePath = process.argv[2];
  const shouldApply = process.argv.includes("--apply");

  if (!filePath) {
    throw new Error("Usage: npm run audit:awin-categories -- <path-to-awin-feed.csv>");
  }

  const rows = await readFeed(filePath);
  const rowsByShopUrl = new Map();

  for (const row of rows) {
    const shopUrl = getField(row, FIELD_ALIASES.shopUrl);
    if (shopUrl && !rowsByShopUrl.has(shopUrl)) rowsByShopUrl.set(shopUrl, row);
  }

  const articles = await prisma.article.findMany({
    where: {
      shopUrl: {
        in: Array.from(rowsByShopUrl.keys()),
      },
    },
    select: {
      id: true,
      title: true,
      category: true,
      shopUrl: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const changes = [];

  for (const article of articles) {
    const row = rowsByShopUrl.get(article.shopUrl);
    if (!row) continue;

    const result = inferCatalogCategory({
      title: getField(row, FIELD_ALIASES.title),
      description: getField(row, FIELD_ALIASES.description),
      productType: getField(row, FIELD_ALIASES.productType),
      categoryPath: getField(row, FIELD_ALIASES.categoryPath),
      secondCategory: getField(row, FIELD_ALIASES.secondCategory),
      thirdCategory: getField(row, FIELD_ALIASES.thirdCategory),
      merchantCategory: getField(row, FIELD_ALIASES.merchantCategory),
      categoryName: getField(row, FIELD_ALIASES.categoryName),
    });

    if (result.moduleId !== article.category) {
      changes.push({
        id: article.id,
        title: article.title,
        from: article.category,
        to: result.moduleId,
        reason: result.reason,
      });
    }
  }

  const examplesByGroup = {};
  const summary = changes.reduce((accumulator, change) => {
    const key = `${change.from} -> ${change.to}`;
    accumulator[key] = (accumulator[key] || 0) + 1;
    examplesByGroup[key] ||= [];
    if (examplesByGroup[key].length < 5) examplesByGroup[key].push(change);
    return accumulator;
  }, {});

  console.log(`Articles compared: ${articles.length}`);
  console.log(`Category changes proposed: ${changes.length}`);
  console.log(JSON.stringify(summary, null, 2));
  console.log("");

  for (const [group, examples] of Object.entries(examplesByGroup).sort(([left], [right]) => left.localeCompare(right))) {
    console.log(group);
    for (const change of examples) {
      console.log(`  #${change.id} ${change.title}`);
      console.log(`    ${change.reason}`);
    }
  }

  if (!shouldApply || changes.length === 0) return;

  console.log("");
  console.log("Applying category changes...");

  let updated = 0;
  for (const change of changes) {
    await prisma.article.update({
      where: { id: change.id },
      data: { category: change.to },
    });

    await prisma.articleTag.deleteMany({
      where: {
        articleId: change.id,
        tag: {
          type: "module",
        },
      },
    });

    const moduleTag = await prisma.tag.upsert({
      where: {
        slug: slugify(change.to),
      },
      update: {
        name: titleize(change.to),
        type: "module",
      },
      create: {
        name: titleize(change.to),
        slug: slugify(change.to),
        type: "module",
      },
      select: {
        id: true,
      },
    });

    await prisma.articleTag.upsert({
      where: {
        articleId_tagId: {
          articleId: change.id,
          tagId: moduleTag.id,
        },
      },
      update: {},
      create: {
        articleId: change.id,
        tagId: moduleTag.id,
      },
    });

    updated += 1;
  }

  console.log(`Applied category changes: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
