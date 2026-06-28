export const CATEGORY_RULES = [
  ["fitness-equipment", [
    "ab wheel",
    "bike floor mat",
    "boxing",
    "cross trainer",
    "deck",
    "dumbbell",
    "dumbbells",
    "exercise mat",
    "fitness equipment",
    "floor mat",
    "kettlebell",
    "knee support",
    "resistance band",
    "resistance bands",
    "resistance tube",
    "resistance tubes",
    "running gloves",
    "skipping rope",
    "stepper",
    "steppers",
    "support aids",
    "training gloves",
    "wrist support",
    "workout",
  ]],
  ["shoes", [
    "boot",
    "boots",
    "footwear",
    "heel",
    "heels",
    "loafer",
    "loafers",
    "mule",
    "mules",
    "sandal",
    "sandals",
    "shoe",
    "shoes",
    "slider",
    "sliders",
    "sneaker",
    "sneakers",
    "trainer",
    "trainers",
  ]],
  ["outerwear", [
    "blazer",
    "blazers",
    "bomber",
    "bombers",
    "coach jacket",
    "coat",
    "coats",
    "fleece jacket",
    "gilet",
    "gilets",
    "jacket",
    "jackets",
    "manteau",
    "manteaux",
    "outerwear",
    "puffer",
    "puffers",
    "rain jacket",
    "skiwear",
    "track jacket",
    "veste",
    "vestes",
    "windbreaker",
    "windbreakers",
  ]],
  ["bottoms", [
    "bottoms",
    "bermuda",
    "bermudas",
    "cargo pants",
    "fleece shorts",
    "jean",
    "jeans",
    "jogger",
    "joggers",
    "legging",
    "leggings",
    "pant",
    "pants",
    "pantalon",
    "pantalons",
    "short",
    "shorts",
    "skirt",
    "skirts",
    "sweatpant",
    "sweatpants",
    "track bottoms",
    "track pant",
    "track pants",
    "trouser",
    "trousers",
  ]],
  ["accessories", [
    "accessories",
    "accessory",
    "bag",
    "bags",
    "belt",
    "belts",
    "bijou",
    "bijoux",
    "glasses",
    "jewellery",
    "jewelry",
    "sac",
    "sacs",
    "sunglasses",
    "watch",
    "watches",
  ]],
  ["caps", [
    "beanie",
    "beanies",
    "bonnet",
    "bonnets",
    "cap",
    "caps",
    "casquette",
    "casquettes",
    "hat",
    "hats",
  ]],
  ["dresses", [
    "dress",
    "dresses",
    "robe",
    "robes",
  ]],
  ["pulls", [
    "cardigan",
    "cardigans",
    "crew neck",
    "hoodie",
    "hoodies",
    "jumper",
    "jumpers",
    "knit",
    "knits",
    "pullover",
    "pullovers",
    "sweatshirt",
    "sweatshirts",
    "sweater",
    "sweaters",
  ]],
  ["shirts", [
    "blouse",
    "blouses",
    "bra",
    "bra top",
    "chemise",
    "jersey",
    "jerseys",
    "long sleeved tee",
    "maillot",
    "maillots",
    "polo",
    "polo shirt",
    "polo shirts",
    "shirt",
    "shirts",
    "sports bra",
    "t shirt",
    "t shirts",
    "tank top",
    "tee",
    "tees",
    "top",
    "tops",
    "track top",
  ]],
  ["beauty", [
    "beauty",
    "cosmetic",
    "makeup",
    "parfum",
    "perfume",
  ]],
];

const GENERIC_CATEGORY_VALUES = new Set([
  "apparel accessories",
  "clothing",
  "fashion",
  "general clothing",
  "men",
  "women",
]);

function normalizeCategoryText(value) {
  return ` ${String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function normalizeGenericValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textHasKeyword(normalizedText, keyword) {
  return normalizedText.includes(` ${normalizeGenericValue(keyword)} `);
}

function findRuleMatch(text) {
  const normalizedText = normalizeCategoryText(text);

  for (const [moduleId, keywords] of CATEGORY_RULES) {
    const keyword = keywords.find((entry) => textHasKeyword(normalizedText, entry));
    if (keyword) return { moduleId, keyword };
  }

  return null;
}

function isGenericCategoryValue(value) {
  const normalized = normalizeGenericValue(value);
  return !normalized || GENERIC_CATEGORY_VALUES.has(normalized);
}

export function inferCatalogCategory(input) {
  const sources = [
    ["product_type", input.productType],
    ["title", input.title],
    ["merchant_product_category_path", input.categoryPath],
    ["merchant_product_second_category", input.secondCategory],
    ["merchant_product_third_category", input.thirdCategory],
    ["merchant_category", input.merchantCategory],
    ["category_name", input.categoryName],
    ["description", input.description],
  ];

  for (const [source, value] of sources) {
    if (source !== "title" && source !== "description" && isGenericCategoryValue(value)) continue;

    const match = findRuleMatch(value);
    if (match) {
      return {
        moduleId: match.moduleId,
        reason: `${source} contains "${match.keyword}"`,
      };
    }
  }

  return {
    moduleId: "accessories",
    reason: "fallback",
  };
}
