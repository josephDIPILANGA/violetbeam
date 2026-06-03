import "dotenv/config";
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CONTENT_FORMATS = ["outfit", "product-spotlight", "trend", "editorial", "try-this-look"];

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

function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
}

function assertBaseEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing environment variable: DATABASE_URL");
  }
}

function assertGenerationEnv() {
  const required = [
    "OPENAI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables for real generation: ${missing.join(", ")}`);
  }
}

function getFormatsForInfluencer(influencerIndex, postsPerInfluencer) {
  return Array.from({ length: postsPerInfluencer }, (_, postIndex) => {
    const formatIndex = (influencerIndex + postIndex) % CONTENT_FORMATS.length;
    return CONTENT_FORMATS[formatIndex];
  });
}

async function findReadyInfluencers({ username, includeDrafts }) {
  return prisma.virtualInfluencer.findMany({
    where: {
      ...(username
        ? {
            username,
          }
        : {}),
      ...(includeDrafts
        ? {}
        : {
            status: "ACTIVE",
          }),
      OR: [
        {
          bodyReferenceImageUrl: {
            not: null,
          },
        },
        {
          faceReferenceImageUrl: {
            not: null,
          },
        },
        {
          profileImageUrl: {
            not: null,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      status: true,
      preferredCategories: true,
      posts: {
        select: {
          id: true,
          status: true,
          contentPillar: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });
}

function runGeneration({ username, format, articles }) {
  const result = spawnSync(
    process.execPath,
    [
      "scripts/generate-influencer-posts.mjs",
      "--username",
      username,
      "--limit",
      "1",
      "--articles",
      String(articles),
      "--format",
      format,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(`Generation failed for ${username} / ${format}`);
  }
}

async function main() {
  assertBaseEnv();

  const username = getArg("username");
  const postsPerInfluencer = Number(getArg("posts", "3"));
  const articles = Number(getArg("articles", "3"));
  const dryRun = parseBoolean(getArg("dry-run", "true"), true);
  const includeDrafts = parseBoolean(getArg("include-drafts", "false"), false);

  if (!Number.isFinite(postsPerInfluencer) || postsPerInfluencer < 1) {
    throw new Error("--posts must be a positive number.");
  }

  if (!Number.isFinite(articles) || articles < 1) {
    throw new Error("--articles must be a positive number.");
  }

  if (!dryRun) {
    assertGenerationEnv();
  }

  const influencers = await findReadyInfluencers({ username, includeDrafts });

  if (influencers.length === 0) {
    console.log("No ready influencers found. Use --include-drafts true if your agents are not ACTIVE yet.");
    return;
  }

  const plan = influencers.flatMap((influencer, influencerIndex) =>
    getFormatsForInfluencer(influencerIndex, postsPerInfluencer).map((format, postIndex) => ({
      influencer,
      format,
      postIndex: postIndex + 1,
    })),
  );

  console.log(`Weekly influencer plan: ${plan.length} posts for ${influencers.length} influencer(s).`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "REAL GENERATION"}`);
  console.log("");

  for (const item of plan) {
    const categories = item.influencer.preferredCategories.join(", ") || "all categories";
    const recentFormats =
      item.influencer.posts
        .slice(0, 3)
        .map((post) => post.contentPillar || post.status)
        .join(", ") || "none";

    console.log(
      `[${item.influencer.username}] post ${item.postIndex}/${postsPerInfluencer} -> ${item.format} | categories: ${categories} | recent: ${recentFormats}`,
    );

    if (!dryRun) {
      runGeneration({
        username: item.influencer.username,
        format: item.format,
        articles,
      });
    }
  }

  console.log("");
  console.log(
    dryRun
      ? "Dry run completed. Re-run with --dry-run false to generate the posts."
      : `Weekly generation completed. Created: ${plan.length}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
