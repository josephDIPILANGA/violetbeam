import "dotenv/config";
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_INFLUENCERS_FOLDER || "violetbeam/influencers";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function buildCharacterDetails(influencer) {
  return [
    `Name: ${influencer.displayName}`,
    `Fictional virtual adult fashion creator, not a real person.`,
    influencer.morphology ? `Morphology: ${influencer.morphology}.` : null,
    influencer.height ? `Height reference: ${influencer.height} cm.` : null,
    influencer.bodyType ? `Body type: ${influencer.bodyType}.` : null,
    influencer.skinTone ? `Skin tone: ${influencer.skinTone}.` : null,
    influencer.hairStyle ? `Hair: ${influencer.hairStyle}.` : null,
    influencer.fashionStyle ? `Fashion style: ${influencer.fashionStyle}.` : null,
    influencer.toneOfVoice ? `Creative tone: ${influencer.toneOfVoice}.` : null,
    influencer.promptContext,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildProfilePrompt(influencer) {
  return `${buildCharacterDetails(influencer)}

Create a consistent profile portrait for this virtual fashion influencer.
Editorial fashion photography, clean premium startup aesthetic, subtle violet and wisteria accents, natural confident expression, direct eye contact, upper body framing, soft studio lighting, realistic skin texture, polished but not over-retouched.
No text, no watermark, no logo, no brand marks, no extra people.`;
}

function buildBodyReferencePrompt(influencer) {
  return `${buildCharacterDetails(influencer)}

Create a full-body reference image for this same virtual fashion influencer.
Standing pose, neutral clean studio background, full outfit visible, fashion look consistent with their style profile, realistic proportions, clear face, hands visible, balanced posture, soft editorial lighting, subtle VioletBeam purple atmosphere.
No text, no watermark, no logo, no brand marks, no extra people.`;
}

async function generateImage(prompt, size) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size,
      quality: "medium",
      output_format: "jpeg",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI image generation failed with status ${response.status}`);
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

async function generateForInfluencer(influencer) {
  const basePublicId = slugify(influencer.username);
  const profilePrompt = buildProfilePrompt(influencer);
  const bodyPrompt = buildBodyReferencePrompt(influencer);

  console.log(`Generating profile portrait for ${influencer.displayName}...`);
  const profileBuffer = await generateImage(profilePrompt, "1024x1024");
  const profileImageUrl = await uploadToCloudinary(profileBuffer, `${basePublicId}-profile`);

  console.log(`Generating body reference for ${influencer.displayName}...`);
  const bodyBuffer = await generateImage(bodyPrompt, "1024x1536");
  const bodyReferenceImageUrl = await uploadToCloudinary(bodyBuffer, `${basePublicId}-body-reference`);

  await prisma.virtualInfluencer.update({
    where: {
      id: influencer.id,
    },
    data: {
      profileImageUrl,
      faceReferenceImageUrl: profileImageUrl,
      bodyReferenceImageUrl,
    },
  });

  console.log(`Updated ${influencer.displayName}.`);
}

async function main() {
  assertEnv();

  const limitArgIndex = process.argv.findIndex((arg) => arg === "--limit");
  const limit =
    limitArgIndex >= 0 && process.argv[limitArgIndex + 1]
      ? Number(process.argv[limitArgIndex + 1])
      : undefined;
  const usernameArgIndex = process.argv.findIndex((arg) => arg === "--username");
  const username =
    usernameArgIndex >= 0 && process.argv[usernameArgIndex + 1]
      ? String(process.argv[usernameArgIndex + 1]).trim()
      : undefined;

  const influencers = await prisma.virtualInfluencer.findMany({
    where: {
      ...(username
        ? {
            username,
          }
        : {}),
      OR: [{ profileImageUrl: null }, { faceReferenceImageUrl: null }, { bodyReferenceImageUrl: null }],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: Number.isFinite(limit) ? limit : undefined,
  });

  if (influencers.length === 0) {
    console.log("No virtual influencers need image generation.");
    return;
  }

  for (const influencer of influencers) {
    await generateForInfluencer(influencer);
  }

  console.log(`Influencer image generation completed. Updated: ${influencers.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
