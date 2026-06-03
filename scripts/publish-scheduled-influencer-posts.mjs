import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

async function main() {
  const dryRun = getArg("dry-run", "false") === "true";
  const now = new Date();
  const posts = await prisma.influencerPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    select: {
      id: true,
      scheduledAt: true,
      influencer: {
        select: {
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (posts.length === 0) {
    console.log("No scheduled influencer posts are due.");
    return;
  }

  for (const post of posts) {
    const simulatedUrl = `https://violetbeam.com/influencers/${post.influencer.username}?post=${post.id}`;

    if (dryRun) {
      console.log(`[dry-run] Would publish post #${post.id} for ${post.influencer.displayName}.`);
      continue;
    }

    await prisma.influencerPost.update({
      where: {
        id: post.id,
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        externalPostUrl: simulatedUrl,
      },
    });

    console.log(`Published simulated post #${post.id} for ${post.influencer.displayName}: ${simulatedUrl}`);
  }

  console.log(`Scheduled influencer publish completed. Published: ${dryRun ? 0 : posts.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
