import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const virtualInfluencers = [
  {
    firstName: "Maya",
    lastName: "Voss",
    displayName: "Maya Voss",
    username: "maya.violetbeam",
    instagramHandle: "mayavioletmodel",
    emailAlias: "maya@violetbeam.com",
    bio: "Virtual fashion creator exploring soft luxury, clean silhouettes and everyday elegance.",
    morphology: "tall slim silhouette",
    height: 176,
    bodyType: "slim",
    skinTone: "warm medium skin tone",
    hairStyle: "long dark wavy hair",
    fashionStyle: "quiet luxury, minimal tailoring, soft purple accents",
    toneOfVoice: "elegant, calm, editorial",
    targetAudience: "women 22-35 interested in premium everyday fashion",
    preferredCategories: ["shirts", "pants", "dresses", "coats", "accessories"],
    promptContext:
      "Maya is a virtual fashion influencer for VioletBeam. She creates refined editorial looks with quiet luxury, minimal tailoring and a polished modern attitude.",
  },
  {
    firstName: "Noa",
    lastName: "Reed",
    displayName: "Noa Reed",
    username: "noa.violetbeam",
    emailAlias: "noa@violetbeam.com",
    bio: "Virtual streetwear stylist mixing sneakers, layers and sharp city silhouettes.",
    morphology: "athletic medium height silhouette",
    height: 182,
    bodyType: "athletic",
    skinTone: "deep skin tone",
    hairStyle: "short curly hair",
    fashionStyle: "streetwear, sneakers, oversized jackets, graphic pieces",
    toneOfVoice: "bold, direct, energetic",
    targetAudience: "men and women 18-30 interested in streetwear and sneakers",
    preferredCategories: ["shoes", "jackets", "shirts", "accessories"],
    promptContext:
      "Noa is a virtual streetwear influencer for VioletBeam. His content focuses on confident city looks, sneakers, layered outfits and expressive silhouettes.",
  },
  {
    firstName: "Elena",
    lastName: "Sato",
    displayName: "Elena Sato",
    username: "elena.violetbeam",
    emailAlias: "elena@violetbeam.com",
    bio: "Virtual editorial muse blending sculptural pieces with refined feminine styling.",
    morphology: "petite balanced silhouette",
    height: 164,
    bodyType: "petite",
    skinTone: "light neutral skin tone",
    hairStyle: "sleek black bob haircut",
    fashionStyle: "editorial, sculptural dresses, clean monochrome styling",
    toneOfVoice: "poetic, precise, fashion-forward",
    targetAudience: "women 20-34 interested in editorial fashion and minimal design",
    preferredCategories: ["dresses", "tops", "shoes", "accessories"],
    promptContext:
      "Elena is a virtual editorial influencer for VioletBeam. She creates polished fashion images with sculptural silhouettes, minimal colors and a magazine-like composition.",
  },
  {
    firstName: "Sofia",
    lastName: "Lane",
    displayName: "Sofia Lane",
    username: "sofia.violetbeam",
    emailAlias: "sofia@violetbeam.com",
    bio: "Virtual creator focused on soft glam, romantic details and accessible fashion inspiration.",
    morphology: "curvy hourglass silhouette",
    height: 170,
    bodyType: "curvy",
    skinTone: "olive skin tone",
    hairStyle: "long chestnut hair with soft waves",
    fashionStyle: "soft glam, romantic dresses, satin textures, feminine accessories",
    toneOfVoice: "warm, confident, aspirational",
    targetAudience: "women 20-38 interested in feminine looks and occasion styling",
    preferredCategories: ["dresses", "tops", "bags", "jewellery", "shoes"],
    promptContext:
      "Sofia is a virtual fashion influencer for VioletBeam. She creates soft glam outfits with romantic styling, elegant textures and confident feminine energy.",
  },
  {
    firstName: "Kai",
    lastName: "Morgan",
    displayName: "Kai Morgan",
    username: "kai.violetbeam",
    emailAlias: "kai@violetbeam.com",
    bio: "Virtual menswear creator exploring relaxed tailoring, clean basics and modern essentials.",
    morphology: "lean tall silhouette",
    height: 187,
    bodyType: "lean",
    skinTone: "light warm skin tone",
    hairStyle: "medium length sandy blond hair",
    fashionStyle: "relaxed tailoring, premium basics, neutral layers, modern menswear",
    toneOfVoice: "clean, practical, understated",
    targetAudience: "men 22-40 interested in modern essentials and smart casual outfits",
    preferredCategories: ["shirts", "pants", "shoes", "jackets", "accessories"],
    promptContext:
      "Kai is a virtual menswear influencer for VioletBeam. His content focuses on clean essentials, relaxed tailoring, neutral styling and wearable modern outfits.",
  },
  {
    firstName: "Iris",
    lastName: "Nova",
    displayName: "Iris Nova",
    username: "iris.violetbeam",
    emailAlias: "iris@violetbeam.com",
    bio: "Virtual trend explorer testing colorful accessories, bold shapes and playful styling.",
    morphology: "average height expressive silhouette",
    height: 168,
    bodyType: "average",
    skinTone: "brown skin tone",
    hairStyle: "braided high ponytail",
    fashionStyle: "playful fashion, bold accessories, color accents, creative layering",
    toneOfVoice: "playful, curious, trend-aware",
    targetAudience: "women and men 18-28 interested in trends, color and experimental styling",
    preferredCategories: ["accessories", "bags", "tops", "shoes", "sunglasses"],
    promptContext:
      "Iris is a virtual trend explorer for VioletBeam. She creates playful fashion content with bold accessories, color accents and energetic experimental styling.",
  },
];

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedInfluencer(influencer) {
  const instagramHandle = influencer.instagramHandle || influencer.username;
  const socialHandle = influencer.username;
  const { instagramHandle: _instagramHandle, ...influencerData } = influencer;

  await prisma.virtualInfluencer.upsert({
    where: {
      username: influencer.username,
    },
    update: {
      firstName: influencer.firstName,
      lastName: influencer.lastName,
      displayName: influencer.displayName,
      emailAlias: influencer.emailAlias,
      bio: influencer.bio,
      morphology: influencer.morphology,
      height: influencer.height,
      bodyType: influencer.bodyType,
      skinTone: influencer.skinTone,
      hairStyle: influencer.hairStyle,
      fashionStyle: influencer.fashionStyle,
      toneOfVoice: influencer.toneOfVoice,
      targetAudience: influencer.targetAudience,
      preferredCategories: influencer.preferredCategories,
      promptContext: influencer.promptContext,
      isAiDisclosed: true,
    },
    create: {
      ...influencerData,
      status: "DRAFT",
      isAiDisclosed: true,
      platformAccounts: {
        create: [
          {
            platform: "INSTAGRAM",
            handle: instagramHandle,
          },
          {
            platform: "TIKTOK",
            handle: socialHandle,
          },
        ],
      },
    },
  });

  const savedInfluencer = await prisma.virtualInfluencer.findUnique({
    where: {
      username: influencer.username,
    },
    select: {
      id: true,
    },
  });

  if (!savedInfluencer) return;

  for (const platform of ["INSTAGRAM", "TIKTOK"]) {
    const handle = platform === "INSTAGRAM" ? instagramHandle : socialHandle;

    await prisma.influencerPlatformAccount.upsert({
      where: {
        influencerId_platform: {
          influencerId: savedInfluencer.id,
          platform,
        },
      },
      update: {
        handle,
      },
      create: {
        influencerId: savedInfluencer.id,
        platform,
        handle,
      },
    });
  }
}

async function main() {
  for (const influencer of virtualInfluencers) {
    await seedInfluencer(influencer);
  }

  console.log(`Virtual influencer seed completed. Upserted: ${virtualInfluencers.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
