import { createHash } from "crypto";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_INFLUENCER_POSTS_FOLDER || "violetbeam/influencer-posts";

const contentFormatConfig = {
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

const maxInstagramHashtags = 5;
const instagramSeoHashtags = {
  core: ["#VioletBeam", "#VirtualTryOn", "#ShopTheLook"],
  discovery: ["#FashionInspo", "#OutfitInspo", "#StyleInspo", "#DailyLook", "#FashionFinds"],
  aiFashion: ["#AIFashion", "#VirtualInfluencer", "#DigitalFashion"],
  premium: ["#QuietLuxury", "#MinimalStyle", "#ModernTailoring", "#LuxuryStyle", "#ChicOutfit"],
  shopping: ["#TryOnHaul", "#OutfitIdeas", "#WhatToWear", "#GetTheLook", "#StyleGuide"],
  editorial: ["#EditorialFashion", "#FashionEditorial", "#StreetStyleEditorial"],
};

const editorialScenes = [
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
] as const;

const formatSceneHints: Record<string, string[]> = {
  outfit: ["paris-terrace", "rome-stone-street", "hotel-lobby", "rooftop-evening"],
  product_spotlight: ["modern-gallery", "hotel-lobby", "studio-close"],
  trend: ["rome-stone-street", "rooftop-evening", "paris-terrace"],
  editorial: ["modern-gallery", "rooftop-evening", "luxury-boat", "studio-close"],
  try_this_look: ["paris-terrace", "hotel-lobby", "studio-close"],
};

type RegenerateMode = "image" | "caption" | "all";
type ContentFormat = keyof typeof contentFormatConfig;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFormatFromPillar(contentPillar: string | null): ContentFormat {
  const format = Object.entries(contentFormatConfig).find(([, config]) => config.contentPillar === contentPillar)?.[0];
  return (format || "outfit") as ContentFormat;
}

function getFormatConfig(format: ContentFormat) {
  return contentFormatConfig[format];
}

function hashToNumber(value: string) {
  return createHash("sha1").update(value).digest().readUInt32BE(0);
}

function normalizeCategory(category: string) {
  return slugify(category).replace(/-/g, "");
}

function toHashtag(value: string | null | undefined) {
  const slug = slugify(value || "").replace(/-/g, "");
  return slug ? `#${slug}` : "";
}

function pickSeeded(items: string[], seed: string, count = 1) {
  const pool = [...new Set(items.filter(Boolean))];
  const picked: string[] = [];
  let cursor = hashToNumber(seed);

  while (pool.length > 0 && picked.length < count) {
    const index = cursor % pool.length;
    const value = pool.splice(index, 1)[0];
    picked.push(value);
    cursor = hashToNumber(`${seed}-${picked.length}-${value}`);
  }

  return picked;
}

function pickEditorialScene({
  articles,
  format,
  postId,
}: {
  articles: Array<{ id: number; category: string }>;
  format: ContentFormat;
  postId: number;
}) {
  const config = getFormatConfig(format);
  const articleCategories = new Set(articles.map((article) => normalizeCategory(article.category)));
  const preferredSceneKeys = formatSceneHints[config.contentPillar] || [];
  const candidates = editorialScenes.filter((scene) => {
    const allowedCategories = new Set(scene.categories.map(normalizeCategory));
    return [...articleCategories].some((category) => allowedCategories.has(category));
  });
  const preferredCandidates = candidates.filter((scene) => preferredSceneKeys.includes(scene.key));
  const pool = preferredCandidates.length > 0 ? preferredCandidates : candidates.length > 0 ? candidates : editorialScenes;
  const seed = `${format}-${postId}-${articles.map((article) => article.id).join("-")}-${Date.now()}`;

  return pool[hashToNumber(seed) % pool.length];
}

function buildCaption(
  influencer: { displayName: string; fashionStyle: string | null; preferredCategories: string[] },
  articles: Array<{ title: string; category: string; brand: string | null; brandRef: { name: string } | null }>,
  format: ContentFormat,
) {
  const articleNames = articles.map((article) => article.title).join(", ");
  const style = influencer.fashionStyle || "VioletBeam styling";
  const config = getFormatConfig(format);

  if (format === "product-spotlight") {
    const heroArticle = articles[0];
    const brand = heroArticle.brandRef?.name || heroArticle.brand || "selected brand";
    const styledWith =
      articles
        .slice(1)
        .map((article) => article.title)
        .join(", ") || "clean VioletBeam essentials";

    return `${influencer.displayName} ${config.captionIntro}: ${heroArticle.title} by ${brand}. Styled with ${styledWith}.`;
  }

  return `${influencer.displayName} ${config.captionIntro} in a ${style} mood with ${articleNames}. Try the full look on VioletBeam.`;
}

function buildHashtags(
  influencer: { preferredCategories: string[]; fashionStyle: string | null; username?: string },
  articles: Array<{ id: number; title: string; category: string; brand: string | null; brandRef: { name: string } | null }>,
  format: ContentFormat,
) {
  const config = getFormatConfig(format);
  const seed = `${influencer.username || "agent"}-${format}-${articles.map((article) => article.id).join("-")}`;
  const categoryTags = articles.map((article) => toHashtag(article.category));
  const productTags = articles.flatMap((article) => [
    toHashtag(article.title),
    toHashtag(article.brandRef?.name || article.brand || ""),
  ]);
  const styleTags = [
    ...influencer.preferredCategories.map(toHashtag),
    ...(influencer.fashionStyle || "")
      .split(/[,\s]+/)
      .map(toHashtag)
      .filter((tag) => tag.length > 4),
  ];
  const intentPool = [
    ...instagramSeoHashtags.discovery,
    ...instagramSeoHashtags.aiFashion,
    ...instagramSeoHashtags.premium,
    ...instagramSeoHashtags.shopping,
    ...(format === "editorial" ? instagramSeoHashtags.editorial : []),
  ];
  const rankedTags = [
    "#VioletBeam",
    ...pickSeeded(["#VirtualTryOn", "#ShopTheLook", "#GetTheLook"], `${seed}-intent`, 1),
    ...pickSeeded([...categoryTags, ...productTags], `${seed}-product`, 1),
    ...pickSeeded([...styleTags, ...config.hashtags], `${seed}-style`, 1),
    ...pickSeeded(intentPool, `${seed}-discovery`, 1),
  ];

  return rankedTags.filter((tag, index, self) => tag && self.indexOf(tag) === index).slice(0, maxInstagramHashtags);
}

function buildImagePrompt(
  influencer: {
    displayName: string;
    promptContext: string | null;
  },
  articles: Array<{
    id: number;
    title: string;
    description: string | null;
    category: string;
    brand: string | null;
    brandRef: { name: string } | null;
  }>,
  format: ContentFormat,
  postId: number,
) {
  const config = getFormatConfig(format);
  const scene = pickEditorialScene({ articles, format, postId });
  const articleDetails = articles
    .map((article, index) => {
      const brand = article.brandRef?.name || article.brand || "selected brand";
      return `${index + 1}. ${article.title} by ${brand}, category ${article.category}, ${
        article.description || "fashion item"
      }`;
    })
    .join("\n");

  return `${influencer.promptContext || `${influencer.displayName} is a virtual fashion influencer for VioletBeam.`}

Create a premium Instagram fashion post image featuring the same virtual influencer from the reference image.
Content format: ${config.label}.
Visual direction: ${config.visualDirection}.
Art direction for this regenerated version:
- Environment: ${scene.label}.
- Pose and expression: ${scene.pose}.
- Lighting: ${scene.lighting}.
- Camera: ${scene.camera}.
- The scene must feel coherent with the selected products and content format; avoid repeating the prior image's background, pose or lighting.
The influencer must wear or clearly style these exact selected fashion articles:
${articleDetails}

Keep the identity, face, hairstyle, skin tone, morphology and body proportions consistent with the influencer reference image.
Vary the final image from previous posts: different pose, facial expression, environment, lighting and camera angle while preserving the same person.
Editorial startup fashion aesthetic, subtle VioletBeam purple atmosphere, clean modern composition, realistic fabric detail, full outfit visible, social-media ready vertical framing.
No text, no watermark, no logo, no extra people, no distorted hands, no duplicate body, no brand logos invented.`;
}

function assertImageEnv() {
  const required = [
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

async function generateImageEdit({
  referenceImageUrl,
  garmentImageUrls,
  prompt,
}: {
  referenceImageUrl: string;
  garmentImageUrls: string[];
  prompt: string;
}) {
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

function signCloudinaryParams(params: Record<string, string | number>) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

async function uploadToCloudinary(buffer: Buffer, publicId: string) {
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

  formData.append("file", new Blob([arrayBuffer], { type: "image/jpeg" }), `${publicId}.jpg`);
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isFinite(postId)) {
    return Response.json({ error: "Post invalide." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { mode?: RegenerateMode };
  const mode: RegenerateMode = body.mode === "image" || body.mode === "caption" || body.mode === "all" ? body.mode : "all";

  const post = await prisma.influencerPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      contentPillar: true,
      influencer: {
        select: {
          id: true,
          displayName: true,
          username: true,
          fashionStyle: true,
          preferredCategories: true,
          promptContext: true,
          bodyReferenceImageUrl: true,
          faceReferenceImageUrl: true,
          profileImageUrl: true,
        },
      },
      articles: {
        orderBy: {
          position: "asc",
        },
        select: {
          article: {
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
                },
              },
            },
          },
        },
      },
    },
  });

  if (!post) {
    return Response.json({ error: "Post introuvable." }, { status: 404 });
  }

  const articles = post.articles.map((entry) => entry.article);
  const format = getFormatFromPillar(post.contentPillar);
  const shouldRegenerateCaption = mode === "caption" || mode === "all";
  const shouldRegenerateImage = mode === "image" || mode === "all";

  try {
    const updateData: {
      status: "GENERATED";
      caption?: string;
      hashtags?: string[];
      generatedImageUrl?: string;
      thumbnailUrl?: string;
      prompt?: string;
      scheduledAt: null;
      publishedAt: null;
      externalPostId: null;
      externalPostUrl: null;
      errorMessage: null;
    } = {
      status: "GENERATED",
      scheduledAt: null,
      publishedAt: null,
      externalPostId: null,
      externalPostUrl: null,
      errorMessage: null,
    };

    if (shouldRegenerateCaption) {
      updateData.caption = buildCaption(post.influencer, articles, format);
      updateData.hashtags = buildHashtags(post.influencer, articles, format);
    }

    if (shouldRegenerateImage) {
      assertImageEnv();

      const referenceImageUrl =
        post.influencer.bodyReferenceImageUrl ||
        post.influencer.faceReferenceImageUrl ||
        post.influencer.profileImageUrl;

      if (!referenceImageUrl) {
        throw new Error(`${post.influencer.displayName} has no reference image yet.`);
      }

      const garmentImageUrls = articles.map((article) => article.imageUrls[0]).filter(Boolean);

      if (garmentImageUrls.length === 0) {
        throw new Error("This post has no article image to use as garment reference.");
      }

      const prompt = buildImagePrompt(post.influencer, articles, format, post.id);
      const publicId = `${slugify(post.influencer.username)}-${slugify(format)}-regen-${post.id}-${Date.now()}`;
      const generatedBuffer = await generateImageEdit({ referenceImageUrl, garmentImageUrls, prompt });
      const generatedImageUrl = await uploadToCloudinary(generatedBuffer, publicId);

      updateData.prompt = prompt;
      updateData.generatedImageUrl = generatedImageUrl;
      updateData.thumbnailUrl = generatedImageUrl;
    }

    await prisma.influencerPost.update({
      where: {
        id: postId,
      },
      data: updateData,
    });

    revalidatePath(`/influencers/${post.influencer.username}`);
    revalidatePath("/admin/influencers");
    revalidatePath("/admin/influencer-posts");
    revalidatePath("/lookbook");

    return Response.json({ ok: true, mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Regeneration failed.";

    await prisma.influencerPost.update({
      where: {
        id: postId,
      },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    revalidatePath(`/influencers/${post.influencer.username}`);
    revalidatePath("/admin/influencer-posts");

    return Response.json({ error: message }, { status: 500 });
  }
}
