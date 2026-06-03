import "dotenv/config";
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_INFLUENCER_POSTS_FOLDER || "violetbeam/influencer-posts";
const CONTENT_FORMATS = ["outfit", "product-spotlight", "trend", "editorial", "try-this-look"];

const CONTENT_FORMAT_CONFIG = {
  outfit: {
    contentPillar: "outfit",
    label: "Outfit post",
    visualDirection:
      "full outfit visible, confident social-media fashion pose, clean styling, balanced product visibility",
    captionIntro: "tests a complete outfit",
    hashtags: ["#OutfitInspo", "#DailyLook"],
  },
  "product-spotlight": {
    contentPillar: "product_spotlight",
    label: "Product spotlight",
    visualDirection:
      "one hero article is the clear focus, close editorial styling, product texture and cut emphasized, influencer naturally wearing or holding the piece",
    captionIntro: "spotlights one key piece",
    hashtags: ["#ProductSpotlight", "#ShopTheLook"],
  },
  trend: {
    contentPillar: "trend",
    label: "Trend post",
    visualDirection:
      "trend-led fashion image, dynamic contemporary pose, outfit styled around a clear seasonal trend, energetic but premium composition",
    captionIntro: "builds a trend-led look",
    hashtags: ["#TrendReport", "#FashionTrends"],
  },
  editorial: {
    contentPillar: "editorial",
    label: "Editorial look",
    visualDirection:
      "high-fashion editorial composition, magazine-quality lighting, sculptural pose, refined dramatic styling, premium art direction",
    captionIntro: "creates an editorial fashion moment",
    hashtags: ["#EditorialFashion", "#FashionEditorial"],
  },
  "try-this-look": {
    contentPillar: "try_this_look",
    label: "Try this look",
    visualDirection:
      "clear try-on friendly outfit image, approachable pose, every selected article visible, inviting composition for users to imagine themselves wearing it",
    captionIntro: "invites you to try this look",
    hashtags: ["#TryThisLook", "#VirtualTryOn"],
  },
};

const MAX_INSTAGRAM_HASHTAGS = 5;
const INSTAGRAM_SEO_HASHTAGS = {
  core: ["#VioletBeam", "#VirtualTryOn", "#ShopTheLook"],
  discovery: ["#FashionInspo", "#OutfitInspo", "#StyleInspo", "#DailyLook", "#FashionFinds"],
  aiFashion: ["#AIFashion", "#VirtualInfluencer", "#DigitalFashion"],
  premium: ["#QuietLuxury", "#MinimalStyle", "#ModernTailoring", "#LuxuryStyle", "#ChicOutfit"],
  shopping: ["#TryOnHaul", "#OutfitIdeas", "#WhatToWear", "#GetTheLook", "#StyleGuide"],
  editorial: ["#EditorialFashion", "#FashionEditorial", "#StreetStyleEditorial"],
};

const EDITORIAL_SCENES = [
  {
    key: "paris-terrace",
    label: "a refined Paris terrace at golden hour",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "warm golden-hour light, soft city glow, premium lifestyle mood",
    pose: "standing near a small cafe table, one hand resting naturally on the chair, relaxed confident expression",
    camera: "three-quarter full-body editorial framing, 70mm fashion lens feel",
  },
  {
    key: "rome-stone-street",
    label: "a quiet Rome stone street with elegant architecture",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "late afternoon sun, gentle shadows, cinematic warm stone reflections",
    pose: "walking slowly with natural movement, head slightly turned toward camera, subtle smile",
    camera: "full-body street-style editorial shot, slight low angle",
  },
  {
    key: "luxury-boat",
    label: "a minimal luxury boat deck on calm water",
    categories: ["shirts", "dresses", "accessories"],
    lighting: "clean bright daylight, reflective water highlights, polished resort atmosphere",
    pose: "seated on a cream lounge bench, posture elegant, one arm relaxed on the backrest",
    camera: "vertical lifestyle editorial framing with outfit clearly visible",
  },
  {
    key: "beach-club",
    label: "a premium beach club with neutral umbrellas and pale sand",
    categories: ["shirts", "dresses", "accessories"],
    lighting: "sunny but soft diffused coastal light, airy summer color palette",
    pose: "standing barefoot near a lounge chair, relaxed shoulders, serene facial expression",
    camera: "full-body resort fashion shot, clean negative space",
  },
  {
    key: "modern-gallery",
    label: "a contemporary art gallery with pale stone and sculptural furniture",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "soft gallery skylight, quiet shadows, refined minimal atmosphere",
    pose: "seated on a sculptural chair with crossed ankles, composed editorial expression",
    camera: "magazine-style vertical composition, sharp product detail",
  },
  {
    key: "hotel-lobby",
    label: "a boutique hotel lobby with marble, chrome and soft purple flowers",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "ambient luxury hotel lighting, subtle highlights on fabric texture",
    pose: "standing beside a marble console, one hand holding a small bag, confident gaze",
    camera: "polished full outfit editorial framing",
  },
  {
    key: "rooftop-evening",
    label: "a city rooftop at blue hour with elegant skyline lights",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "blue-hour ambient light with soft editorial flash, premium evening mood",
    pose: "leaning lightly against a railing, calm confident face, hair moved by a subtle breeze",
    camera: "vertical fashion campaign composition, full outfit readable",
  },
  {
    key: "studio-close",
    label: "a clean fashion studio with fabric backdrop and subtle VioletBeam purple accent",
    categories: ["shirts", "pants", "dresses", "coats", "accessories"],
    lighting: "controlled softbox lighting, crisp garment detail, premium e-commerce editorial mood",
    pose: "dynamic standing pose with one knee slightly bent, shoulders angled, direct confident expression",
    camera: "full-body studio editorial shot, no plain repeated background",
  },
];

const FORMAT_SCENE_HINTS = {
  outfit: ["paris-terrace", "rome-stone-street", "hotel-lobby", "rooftop-evening"],
  product_spotlight: ["modern-gallery", "hotel-lobby", "studio-close"],
  trend: ["rome-stone-street", "rooftop-evening", "paris-terrace"],
  editorial: ["modern-gallery", "rooftop-evening", "luxury-boat", "studio-close"],
  try_this_look: ["paris-terrace", "hotel-lobby", "studio-close"],
};

const OUTFIT_SLOT_PLANS = {
  outfit: [
    ["top", "bottom", "accessory"],
    ["dress", "outerwear", "accessory"],
    ["top", "bottom", "outerwear"],
  ],
  "product-spotlight": [
    ["hero", "support", "accessory"],
    ["hero", "support"],
  ],
  trend: [
    ["statement", "base", "accessory"],
    ["top", "bottom", "statement"],
  ],
  editorial: [
    ["statement", "support", "accessory"],
    ["dress", "outerwear", "accessory"],
    ["top", "bottom", "statement"],
  ],
  "try-this-look": [
    ["top", "bottom", "accessory"],
    ["dress", "accessory"],
  ],
};

const CATEGORY_SLOT_MAP = {
  top: ["shirts", "tops", "tshirts", "mensshirts", "womensshirts"],
  bottom: ["pants", "trousers", "jeans", "skirts", "womenspants", "menspants"],
  dress: ["dresses", "womensdresses"],
  outerwear: ["coats", "jackets", "blazers", "outerwear"],
  accessory: ["accessories", "bags", "jewellery", "jewelry", "sunglasses", "womensbags", "womensjewellery"],
  shoes: ["shoes", "sneakers", "heels", "mensshoes", "womensshoes"],
};

const SLOT_FALLBACKS = {
  hero: ["top", "dress", "outerwear", "accessory"],
  support: ["bottom", "outerwear", "accessory", "top"],
  statement: ["outerwear", "dress", "accessory", "top"],
  base: ["top", "bottom", "dress"],
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function getArg(name, fallback = undefined) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
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

function toHashtag(value) {
  const slug = slugify(value).replace(/-/g, "");
  return slug ? `#${slug}` : "";
}

function pickSeeded(items, seed, count = 1) {
  const pool = [...new Set(items.filter(Boolean))];
  const picked = [];
  let cursor = hashToNumber(seed);

  while (pool.length > 0 && picked.length < count) {
    const index = cursor % pool.length;
    picked.push(pool.splice(index, 1)[0]);
    cursor = hashToNumber(`${seed}-${picked.length}-${picked[picked.length - 1]}`);
  }

  return picked;
}

function assertEnv() {
  const required = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

function formatPrice(article) {
  return `$${Number(article.price).toFixed(2)}`;
}

function getFormatConfig(format) {
  return CONTENT_FORMAT_CONFIG[format] || CONTENT_FORMAT_CONFIG.outfit;
}

function hashToNumber(value) {
  return createHash("sha1").update(value).digest().readUInt32BE(0);
}

function normalizeCategory(category) {
  return slugify(category).replace(/-/g, "");
}

function pickEditorialScene({ influencer, articles, format, postNumber }) {
  const config = getFormatConfig(format);
  const articleCategories = new Set(articles.map((article) => normalizeCategory(article.category)));
  const preferredSceneKeys = FORMAT_SCENE_HINTS[config.contentPillar] || [];
  const candidates = EDITORIAL_SCENES.filter((scene) => {
    const allowedCategories = new Set(scene.categories.map(normalizeCategory));
    return [...articleCategories].some((category) => allowedCategories.has(category));
  });
  const preferredCandidates = candidates.filter((scene) => preferredSceneKeys.includes(scene.key));
  const pool = preferredCandidates.length > 0 ? preferredCandidates : candidates.length > 0 ? candidates : EDITORIAL_SCENES;
  const seed = `${influencer.username}-${format}-${postNumber}-${articles.map((article) => article.id).join("-")}`;

  return pool[hashToNumber(seed) % pool.length];
}

function buildCaption(influencer, articles, format) {
  const articleNames = articles.map((article) => article.title).join(", ");
  const style = influencer.fashionStyle || "VioletBeam styling";
  const config = getFormatConfig(format);

  if (format === "product-spotlight") {
    const heroArticle = articles[0];
    const brand = heroArticle.brandRef?.name || heroArticle.brand || "selected brand";
    return `${influencer.displayName} ${config.captionIntro}: ${heroArticle.title} by ${brand}. Styled with ${articles
      .slice(1)
      .map((article) => article.title)
      .join(", ") || "clean VioletBeam essentials"}.`;
  }

  return `${influencer.displayName} ${config.captionIntro} in a ${style} mood with ${articleNames}. Try the full look on VioletBeam.`;
}

function buildHashtags(influencer, articles, format) {
  const config = getFormatConfig(format);
  const seed = `${influencer.username}-${format}-${articles.map((article) => article.id).join("-")}`;
  const categoryTags = articles.map((article) => toHashtag(article.category));
  const productTags = articles.flatMap((article) => [toHashtag(article.title), toHashtag(article.brandRef?.name || article.brand || "")]);
  const styleTags = [
    ...(influencer.preferredCategories || []).map(toHashtag),
    ...(influencer.fashionStyle || "")
      .split(/[,\s]+/)
      .map(toHashtag)
      .filter((tag) => tag.length > 4),
  ];
  const formatTags = config.hashtags;
  const intentPool = [
    ...INSTAGRAM_SEO_HASHTAGS.discovery,
    ...INSTAGRAM_SEO_HASHTAGS.aiFashion,
    ...INSTAGRAM_SEO_HASHTAGS.premium,
    ...INSTAGRAM_SEO_HASHTAGS.shopping,
    ...(format === "editorial" ? INSTAGRAM_SEO_HASHTAGS.editorial : []),
  ];

  const rankedTags = [
    "#VioletBeam",
    ...pickSeeded(["#VirtualTryOn", "#ShopTheLook", "#GetTheLook"], `${seed}-intent`, 1),
    ...pickSeeded([...categoryTags, ...productTags], `${seed}-product`, 1),
    ...pickSeeded([...styleTags, ...formatTags], `${seed}-style`, 1),
    ...pickSeeded(intentPool, `${seed}-discovery`, 1),
  ];

  return rankedTags.filter((tag, index, self) => tag && self.indexOf(tag) === index).slice(0, MAX_INSTAGRAM_HASHTAGS);
}

function buildImagePrompt(influencer, articles, format, postNumber) {
  const config = getFormatConfig(format);
  const scene = pickEditorialScene({ influencer, articles, format, postNumber });
  const articleDetails = articles
    .map((article, index) => {
      const brand = article.brandRef?.name || article.brand || "selected brand";
      return `${index + 1}. ${article.title} by ${brand}, category ${article.category}, ${article.description || "fashion item"}`;
    })
    .join("\n");

  return `${influencer.promptContext || `${influencer.displayName} is a virtual fashion influencer for VioletBeam.`}

Create a premium Instagram fashion post image featuring the same virtual influencer from the reference image.
Content format: ${config.label}.
Visual direction: ${config.visualDirection}.
Art direction for this specific post:
- Environment: ${scene.label}.
- Pose and expression: ${scene.pose}.
- Lighting: ${scene.lighting}.
- Camera: ${scene.camera}.
- The scene must feel coherent with the selected products and content format; avoid a generic studio clone unless the scene explicitly calls for a studio treatment.
The influencer must wear or clearly style these exact selected fashion articles:
${articleDetails}

Keep the identity, face, hairstyle, skin tone, morphology and body proportions consistent with the influencer reference image.
Vary the final image from previous posts: different pose, facial expression, environment, lighting and camera angle while preserving the same person.
Editorial startup fashion aesthetic, subtle VioletBeam purple atmosphere, clean modern composition, realistic fabric detail, full outfit visible, social-media ready vertical framing.
No text, no watermark, no logo, no extra people, no distorted hands, no duplicate body, no brand logos invented.`;
}

async function generateImageEdit({ referenceImageUrl, garmentImageUrls, prompt }) {
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      images: [
        { image_url: referenceImageUrl },
        ...garmentImageUrls.slice(0, 10).map((imageUrl) => ({ image_url: imageUrl })),
      ],
      prompt,
      size: "1024x1536",
      quality: "medium",
      output_format: "jpeg",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI image edit failed with status ${response.status}`);
  }

  const b64Json = data.data?.[0]?.b64_json;

  if (!b64Json) {
    throw new Error("OpenAI did not return an image.");
  }

  return Buffer.from(b64Json, "base64");
}

function signCloudinaryParams(params) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

async function uploadToCloudinary(buffer, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: CLOUDINARY_FOLDER,
    overwrite: "true",
    public_id: publicId,
    timestamp,
  };
  const signature = signCloudinaryParams(params);
  const formData = new FormData();

  formData.append("file", new Blob([buffer], { type: "image/jpeg" }), `${publicId}.jpg`);
  formData.append("api_key", process.env.CLOUDINARY_API_KEY);
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

  return data.secure_url;
}

async function findInfluencer(username) {
  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      username,
    },
    include: {
      posts: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!influencer) {
    throw new Error(`No influencer found for username: ${username}`);
  }

  if (!influencer.bodyReferenceImageUrl && !influencer.faceReferenceImageUrl && !influencer.profileImageUrl) {
    throw new Error(`${influencer.displayName} has no reference image yet. Run generate:influencer-images first.`);
  }

  return influencer;
}

function getArticleSlot(article) {
  const category = normalizeCategory(article.category);

  for (const [slot, categories] of Object.entries(CATEGORY_SLOT_MAP)) {
    if (categories.map(normalizeCategory).some((candidate) => category.includes(candidate) || candidate.includes(category))) {
      return slot;
    }
  }

  return "support";
}

function getSlotPlan(format, count, influencer, postNumber) {
  const plans = OUTFIT_SLOT_PLANS[format] || OUTFIT_SLOT_PLANS.outfit;
  const seed = `${influencer.username}-${format}-${postNumber}-slot-plan`;
  const plan = plans[hashToNumber(seed) % plans.length];
  const expandedPlan = [...plan];

  while (expandedPlan.length < count) {
    expandedPlan.push(["accessory", "outerwear", "shoes", "support"][expandedPlan.length % 4]);
  }

  return expandedPlan.slice(0, count);
}

function articleScore(article, { influencer, recentArticleIds, seed, slot, usedBrandNames }) {
  const preferredCategories = new Set((influencer.preferredCategories || []).map(normalizeCategory));
  const category = normalizeCategory(article.category);
  const brand = article.brandRef?.name || article.brand || "";
  let score = 0;

  if (preferredCategories.has(category)) score += 35;
  if ([...preferredCategories].some((preferred) => category.includes(preferred) || preferred.includes(category))) score += 18;
  if (article.imageUrls.length > 1) score += 8;
  if (article.description) score += 6;
  if (brand && !usedBrandNames.has(brand.toLowerCase())) score += 5;
  if (recentArticleIds.has(article.id)) score -= 60;
  if (slot === "hero" || slot === "statement") score += Number(article.price) > 50 ? 6 : 0;

  score += hashToNumber(`${seed}-${article.id}`) % 29;

  return score;
}

function findArticleForSlot({ articles, influencer, recentArticleIds, seed, selectedIds, slot, usedBrandNames }) {
  const candidateSlots = [slot, ...(SLOT_FALLBACKS[slot] || [])];
  const slotCandidates = articles.filter((article) => {
    if (selectedIds.has(article.id)) return false;
    const articleSlot = getArticleSlot(article);
    return candidateSlots.includes(articleSlot);
  });
  const candidates = slotCandidates.length > 0 ? slotCandidates : articles.filter((article) => !selectedIds.has(article.id));

  return candidates
    .map((article) => ({
      article,
      score: articleScore(article, { influencer, recentArticleIds, seed, slot, usedBrandNames }),
    }))
    .sort((a, b) => b.score - a.score)[0]?.article;
}

async function getRecentArticleIds(influencerId, limit = 8) {
  const recentPosts = await prisma.influencerPost.findMany({
    where: {
      influencerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      articles: {
        select: {
          articleId: true,
        },
      },
    },
  });

  return new Set(recentPosts.flatMap((post) => post.articles.map((entry) => entry.articleId)));
}

async function pickArticles(influencer, count, format) {
  const categories = influencer.preferredCategories || [];
  const postNumber = influencer.posts.length + 1;
  const recentArticleIds = await getRecentArticleIds(influencer.id);
  const preferredArticles = await prisma.article.findMany({
    where: categories.length > 0 ? { category: { in: categories } } : {},
    orderBy: {
      createdAt: "desc",
    },
    take: Math.max(count * 8, 40),
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      imageUrls: true,
      brand: true,
      shopUrl: true,
      brandRef: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
  const fallbackArticles = await prisma.article.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: Math.max(count * 6, 30),
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      imageUrls: true,
      brand: true,
      shopUrl: true,
      brandRef: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  const usableArticles = [...preferredArticles, ...fallbackArticles]
    .filter((article, index, self) => article.imageUrls.length > 0 && self.findIndex((candidate) => candidate.id === article.id) === index);

  if (usableArticles.length < count) {
    throw new Error(`Not enough articles with images for ${influencer.displayName}. Needed ${count}, found ${usableArticles.length}.`);
  }

  const seed = `${influencer.username}-${format}-${postNumber}-${Date.now()}`;
  const selected = [];
  const selectedIds = new Set();
  const usedBrandNames = new Set();
  const slotPlan = getSlotPlan(format, count, influencer, postNumber);

  for (const slot of slotPlan) {
    const article = findArticleForSlot({
      articles: usableArticles,
      influencer,
      recentArticleIds,
      seed,
      selectedIds,
      slot,
      usedBrandNames,
    });

    if (!article) continue;

    selected.push(article);
    selectedIds.add(article.id);
    if (article.brandRef?.name || article.brand) {
      usedBrandNames.add((article.brandRef?.name || article.brand).toLowerCase());
    }
  }

  for (const article of usableArticles
    .filter((item) => !selectedIds.has(item.id))
    .map((item) => ({
      item,
      score: articleScore(item, {
        influencer,
        recentArticleIds,
        seed: `${seed}-fill`,
        slot: "support",
        usedBrandNames,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)) {
    if (selected.length >= count) break;
    selected.push(article);
    selectedIds.add(article.id);
  }

  console.log(`Selected articles: ${selected.map((article) => `${article.title} (${article.category})`).join(" | ")}`);

  return selected.slice(0, count);
}

function resolveFormat(format, index) {
  if (format === "rotate") {
    return CONTENT_FORMATS[index % CONTENT_FORMATS.length];
  }

  if (CONTENT_FORMATS.includes(format)) return format;

  throw new Error(`Unknown format "${format}". Use one of: ${CONTENT_FORMATS.join(", ")}, rotate.`);
}

async function createPost({ influencer, articles, format }) {
  const config = getFormatConfig(format);
  const referenceImageUrl =
    influencer.bodyReferenceImageUrl || influencer.faceReferenceImageUrl || influencer.profileImageUrl;
  const garmentImageUrls = articles.map((article) => article.imageUrls[0]).filter(Boolean);
  const caption = buildCaption(influencer, articles, format);
  const hashtags = buildHashtags(influencer, articles, format);
  const postNumber = influencer.posts.length + 1;
  const prompt = buildImagePrompt(influencer, articles, format, postNumber);
  const publicId = `${slugify(influencer.username)}-${slugify(format)}-${String(postNumber).padStart(3, "0")}-${Date.now()}`;

  console.log(`Generating ${config.label} for ${influencer.displayName} with ${articles.length} articles...`);
  const generatedBuffer = await generateImageEdit({ referenceImageUrl, garmentImageUrls, prompt });
  const generatedImageUrl = await uploadToCloudinary(generatedBuffer, publicId);

  const post = await prisma.influencerPost.create({
    data: {
      influencerId: influencer.id,
      status: "GENERATED",
      platform: "INSTAGRAM",
      contentPillar: config.contentPillar,
      caption,
      hashtags,
      generatedImageUrl,
      thumbnailUrl: generatedImageUrl,
      prompt,
      isAiDisclosed: true,
      articles: {
        create: articles.map((article, index) => ({
          articleId: article.id,
          position: index,
          snapshot: {
            id: article.id,
            title: article.title,
            description: article.description,
            price: Number(article.price),
            formattedPrice: formatPrice(article),
            category: article.category,
            image: article.imageUrls[0],
            brand: article.brandRef?.name || article.brand,
            shopUrl: article.shopUrl,
          },
        })),
      },
    },
    select: {
      id: true,
      generatedImageUrl: true,
    },
  });

  console.log(`Created GENERATED post #${post.id}: ${post.generatedImageUrl}`);
}

async function main() {
  assertEnv();

  const username = getArg("username", "maya.violetbeam");
  const limit = Number(getArg("limit", "1"));
  const articleCount = Number(getArg("articles", "3"));
  const format = getArg("format", "outfit");
  const influencer = await findInfluencer(username);

  for (let index = 0; index < limit; index += 1) {
    const resolvedFormat = resolveFormat(format, index);
    const articles = await pickArticles(influencer, articleCount, resolvedFormat);
    await createPost({ influencer, articles, format: resolvedFormat });
    influencer.posts.push({ id: -1 });
  }

  console.log(`Influencer post generation completed. Created: ${limit}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
