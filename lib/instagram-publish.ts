import { decryptMetaToken } from "@/lib/meta";

const INSTAGRAM_GRAPH_VERSION = "v24.0";
const INSTAGRAM_GRAPH_URL = `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}`;

type InstagramCreateContainerResponse = {
  id?: string;
};

type InstagramPublishResponse = {
  id?: string;
};

type InstagramContainerStatusResponse = {
  id?: string;
  status?: string;
  status_code?: string;
};

type InstagramMediaResponse = {
  id: string;
  permalink?: string;
};

function buildInstagramUrl(path: string) {
  return new URL(`${INSTAGRAM_GRAPH_URL}${path}`);
}

async function postInstagram<T>(path: string, body: URLSearchParams) {
  const response = await fetch(buildInstagramUrl(path), {
    method: "POST",
    body,
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error_message || "Instagram request failed.");
  }

  return data as T;
}

async function getInstagram<T>(path: string, params: Record<string, string>) {
  const url = buildInstagramUrl(path);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error_message || "Instagram request failed.");
  }

  return data as T;
}

function normalizeHashtag(hashtag: string) {
  const value = hashtag.trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForInstagramContainer({
  accessToken,
  containerId,
}: {
  accessToken: string;
  containerId: string;
}) {
  let lastStatus = "UNKNOWN";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const container = await getInstagram<InstagramContainerStatusResponse>(`/${containerId}`, {
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

export function buildInstagramCaption(caption: string | null, hashtags: string[]) {
  const tagLine = Array.from(new Set(hashtags.map(normalizeHashtag).filter(Boolean))).join(" ");
  return [caption?.trim(), tagLine].filter(Boolean).join("\n\n").trim();
}

export async function publishInstagramImagePost({
  accessToken,
  caption,
  imageUrl,
  instagramBusinessAccountId,
}: {
  accessToken: string;
  caption: string;
  imageUrl: string;
  instagramBusinessAccountId: string;
}) {
  const decryptedAccessToken = decryptMetaToken(accessToken);

  const container = await postInstagram<InstagramCreateContainerResponse>(
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

  const published = await postInstagram<InstagramPublishResponse>(
    `/${instagramBusinessAccountId}/media_publish`,
    new URLSearchParams({
      access_token: decryptedAccessToken,
      creation_id: container.id,
    }),
  );

  if (!published.id) {
    throw new Error("Instagram did not return a published media id.");
  }

  const media = await getInstagram<InstagramMediaResponse>(`/${published.id}`, {
    access_token: decryptedAccessToken,
    fields: "id,permalink",
  });

  return {
    externalPostId: published.id,
    externalPostUrl: media.permalink || `https://www.instagram.com/p/${published.id}/`,
  };
}
