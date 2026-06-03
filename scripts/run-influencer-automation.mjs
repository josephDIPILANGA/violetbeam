import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createDecipheriv, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const INSTAGRAM_GRAPH_VERSION = "v24.0";
const INSTAGRAM_GRAPH_URL = `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}`;
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

function normalizePostTime(value) {
  if (typeof value !== "string") return "18:00";
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : "18:00";
}

function setTime(date, preferredPostTime) {
  const [hours, minutes] = normalizePostTime(preferredPostTime).split(":").map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function nextThreeTimesWeeklyDate(from, preferredPostTime) {
  const allowedDays = new Set([1, 3, 5]);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = setTime(addDays(from, offset), preferredPostTime);
    if (allowedDays.has(candidate.getDay()) && candidate > from) {
      return candidate;
    }
  }

  return setTime(addDays(from, 1), preferredPostTime);
}

function calculateNextAutomatedPostAt({ from = new Date(), postingFrequency, preferredPostTime = "18:00" }) {
  const postTime = normalizePostTime(preferredPostTime);

  if (postingFrequency === "THREE_TIMES_WEEKLY") {
    return nextThreeTimesWeeklyDate(from, postTime);
  }

  const todayAtPreferredTime = setTime(from, postTime);

  if (todayAtPreferredTime > from) {
    return todayAtPreferredTime;
  }

  return setTime(addDays(from, postingFrequency === "DAILY" ? 1 : 7), postTime);
}

function getEncryptionSecret() {
  const secret = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.META_APP_SECRET;

  if (!secret) {
    throw new Error("META_TOKEN_ENCRYPTION_KEY, NEXTAUTH_SECRET or META_APP_SECRET is required to decrypt Meta tokens.");
  }

  return secret;
}

function decryptMetaToken(payload) {
  const [ivValue, tagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token payload.");
  }

  const key = createHash("sha256").update(getEncryptionSecret()).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function normalizeHashtag(hashtag) {
  const value = String(hashtag || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function buildInstagramCaption(caption, hashtags) {
  const tagLine = Array.from(new Set((hashtags || []).map(normalizeHashtag).filter(Boolean))).join(" ");
  return [caption?.trim(), tagLine].filter(Boolean).join("\n\n").trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postInstagram(path, body) {
  const response = await fetch(new URL(`${INSTAGRAM_GRAPH_URL}${path}`), {
    method: "POST",
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error_message || "Instagram request failed.");
  }

  return data;
}

async function getInstagram(path, params) {
  const url = new URL(`${INSTAGRAM_GRAPH_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error_message || "Instagram request failed.");
  }

  return data;
}

async function waitForInstagramContainer({ accessToken, containerId }) {
  let lastStatus = "UNKNOWN";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const container = await getInstagram(`/${containerId}`, {
      access_token: accessToken,
      fields: "id,status,status_code",
    });
    lastStatus = container.status_code || container.status || "UNKNOWN";

    if (lastStatus === "FINISHED") {
      return;
    }

    if (lastStatus === "ERROR" || lastStatus === "EXPIRED") {
      throw new Error(`Instagram media container failed with status ${lastStatus}.`);
    }

    await sleep(3000);
  }

  throw new Error(`Instagram media container was not ready. Last status: ${lastStatus}.`);
}

async function publishInstagramImagePost({ accessToken, caption, imageUrl, instagramBusinessAccountId }) {
  const decryptedAccessToken = decryptMetaToken(accessToken);
  const container = await postInstagram(
    `/${instagramBusinessAccountId}/media`,
    new URLSearchParams({
      access_token: decryptedAccessToken,
      caption,
      image_url: imageUrl,
    }),
  );

  if (!container.id) {
    throw new Error("Instagram did not return a media container id.");
  }

  await waitForInstagramContainer({
    accessToken: decryptedAccessToken,
    containerId: container.id,
  });

  const published = await postInstagram(
    `/${instagramBusinessAccountId}/media_publish`,
    new URLSearchParams({
      access_token: decryptedAccessToken,
      creation_id: container.id,
    }),
  );

  if (!published.id) {
    throw new Error("Instagram did not return a published media id.");
  }

  const media = await getInstagram(`/${published.id}`, {
    access_token: decryptedAccessToken,
    fields: "id,permalink",
  });

  return {
    externalPostId: published.id,
    externalPostUrl: media.permalink || `https://www.instagram.com/p/${published.id}/`,
  };
}

function generatePost({ articleCount, format, username }) {
  execFileSync(
    process.execPath,
    [
      "scripts/generate-influencer-posts.mjs",
      "--username",
      username,
      "--limit",
      "1",
      "--articles",
      String(articleCount),
      "--format",
      format,
    ],
    {
      stdio: "inherit",
    },
  );
}

function getRunStatus(summary) {
  if (summary.failed > 0 && summary.published > 0) return "PARTIAL";
  if (summary.failed > 0 && summary.published === 0) return "FAILED";
  return "SUCCESS";
}

function getRunMessage(summary) {
  if (summary.checked === 0) return "No autonomous influencer is due.";
  if (summary.dryRun) return `Dry run checked ${summary.checked} due agent${summary.checked > 1 ? "s" : ""}.`;
  if (summary.published > 0) return `Published ${summary.published} autonomous post${summary.published > 1 ? "s" : ""}.`;
  if (summary.skipped > 0 && summary.failed === 0) return `Skipped ${summary.skipped} agent${summary.skipped > 1 ? "s" : ""}.`;
  return "Automation run completed.";
}

async function main() {
  const dryRun = getArg("dry-run", "false") === "true";
  const limit = Number(getArg("limit", "3"));
  const articleCount = Number(getArg("articles", "3"));
  const now = new Date();
  const summary = {
    dryRun,
    checked: 0,
    failed: 0,
    generated: 0,
    published: 0,
    skipped: 0,
  };
  const events = [];

  const influencers = await prisma.virtualInfluencer.findMany({
    where: {
      automationEnabled: true,
      status: "ACTIVE",
      nextAutomatedPostAt: {
        lte: now,
      },
      postingFrequency: {
        not: null,
      },
    },
    orderBy: {
      nextAutomatedPostAt: "asc",
    },
    take: Number.isFinite(limit) ? limit : 3,
    select: {
      id: true,
      displayName: true,
      username: true,
      postingFrequency: true,
      preferredPostTime: true,
      _count: {
        select: {
          posts: true,
        },
      },
      platformAccounts: {
        where: {
          platform: "INSTAGRAM",
        },
        take: 1,
        select: {
          accessToken: true,
          connectionStatus: true,
          instagramBusinessAccountId: true,
          tokenScopes: true,
        },
      },
    },
  });
  summary.checked = influencers.length;

  const automationRun = await prisma.automationRun.create({
    data: {
      type: "influencer_automation",
      status: "STARTED",
      dryRun,
      checked: summary.checked,
      details: {
        articleCount,
        limit: Number.isFinite(limit) ? limit : 3,
      },
    },
    select: {
      id: true,
    },
  });

  if (influencers.length === 0) {
    console.log("No autonomous influencer is due.");
    await prisma.automationRun.update({
      where: {
        id: automationRun.id,
      },
      data: {
        status: "SUCCESS",
        message: getRunMessage(summary),
        finishedAt: new Date(),
      },
    });
    return;
  }

  for (const influencer of influencers) {
    const account = influencer.platformAccounts[0];
    const nextAutomatedPostAt = calculateNextAutomatedPostAt({
      from: now,
      postingFrequency: influencer.postingFrequency,
      preferredPostTime: influencer.preferredPostTime,
    });

    if (
      !account ||
      account.connectionStatus !== "CONNECTED" ||
      !account.accessToken ||
      !account.instagramBusinessAccountId ||
      !account.tokenScopes.includes("instagram_business_content_publish")
    ) {
      console.log(`Skipping ${influencer.displayName}: Instagram publishing is not ready.`);
      summary.skipped += 1;
      events.push({
        influencerId: influencer.id,
        influencerName: influencer.displayName,
        status: "skipped",
        reason: "Instagram publishing is not ready.",
      });
      await prisma.virtualInfluencer.update({
        where: {
          id: influencer.id,
        },
        data: {
          nextAutomatedPostAt,
        },
      });
      continue;
    }

    const format = CONTENT_FORMATS[influencer._count.posts % CONTENT_FORMATS.length];
    console.log(`Autonomous run for ${influencer.displayName}: ${format}.`);
    let generatedPostId = null;

    if (dryRun) {
      console.log(`[dry-run] Would generate and publish one ${format} post for ${influencer.username}.`);
      events.push({
        format,
        influencerId: influencer.id,
        influencerName: influencer.displayName,
        status: "dry_run",
      });
      continue;
    }

    try {
      generatePost({
        articleCount,
        format,
        username: influencer.username,
      });

      const post = await prisma.influencerPost.findFirst({
        where: {
          influencerId: influencer.id,
          status: "GENERATED",
          platform: "INSTAGRAM",
          generatedImageUrl: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          caption: true,
          generatedImageUrl: true,
          hashtags: true,
        },
      });

      if (!post?.generatedImageUrl) {
        throw new Error("No generated post was found after image generation.");
      }
      generatedPostId = post.id;
      summary.generated += 1;

      const caption = buildInstagramCaption(post.caption, post.hashtags);
      const published = await publishInstagramImagePost({
        accessToken: account.accessToken,
        caption,
        imageUrl: post.generatedImageUrl,
        instagramBusinessAccountId: account.instagramBusinessAccountId,
      });

      await prisma.influencerPost.update({
        where: {
          id: post.id,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          externalPostId: published.externalPostId,
          externalPostUrl: published.externalPostUrl,
          errorMessage: null,
        },
      });

      await prisma.virtualInfluencer.update({
        where: {
          id: influencer.id,
        },
        data: {
          lastAutomatedPostAt: new Date(),
          nextAutomatedPostAt,
        },
      });

      summary.published += 1;
      events.push({
        externalPostUrl: published.externalPostUrl,
        format,
        influencerId: influencer.id,
        influencerName: influencer.displayName,
        postId: post.id,
        status: "published",
      });
      console.log(`Published autonomous post #${post.id}: ${published.externalPostUrl}`);
    } catch (error) {
      summary.failed += 1;
      console.error(`Autonomous publish failed for ${influencer.displayName}:`, error);
      if (generatedPostId) {
        await prisma.influencerPost.update({
          where: {
            id: generatedPostId,
          },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
      }
      events.push({
        errorMessage: error instanceof Error ? error.message : String(error),
        format,
        influencerId: influencer.id,
        influencerName: influencer.displayName,
        postId: generatedPostId,
        status: "failed",
      });
      await prisma.virtualInfluencer.update({
        where: {
          id: influencer.id,
        },
        data: {
          nextAutomatedPostAt,
        },
      });
    }
  }

  const primaryEvent = events.find((event) => event.postId) || events[0];

  await prisma.automationRun.update({
    where: {
      id: automationRun.id,
    },
    data: {
      status: getRunStatus(summary),
      checked: summary.checked,
      failed: summary.failed,
      generated: summary.generated,
      influencerId: primaryEvent?.influencerId || null,
      influencerName: primaryEvent?.influencerName || null,
      message: getRunMessage(summary),
      postId: primaryEvent?.postId || null,
      published: summary.published,
      skipped: summary.skipped,
      errorMessage: events.find((event) => event.status === "failed")?.errorMessage || null,
      details: {
        articleCount,
        events,
        limit: Number.isFinite(limit) ? limit : 3,
      },
      finishedAt: new Date(),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
