import crypto from "crypto";

const META_GRAPH_VERSION = "v24.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const META_OAUTH_URL = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;

export const META_INSTAGRAM_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_business_basic",
];

export const META_INSTAGRAM_PUBLISHING_SCOPES = [
  "instagram_business_content_publish",
];

type MetaAccessTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type MetaPageAccount = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
  connected_instagram_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
};

type MetaPagesResponse = {
  data?: MetaPageAccount[];
};

type MetaMeResponse = {
  id: string;
};

type MetaDebugTokenResponse = {
  data?: {
    scopes?: string[];
    granular_scopes?: Array<{
      scope?: string;
    }>;
  };
};

export type MetaInstagramConnection = {
  handle: string;
  profileUrl?: string;
  metaUserId: string;
  metaPageId: string;
  metaPageName: string;
  instagramBusinessAccountId: string;
  accessToken: string;
  tokenType?: string;
  tokenScopes: string[];
  tokenExpiresAt?: Date;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getMetaSecret() {
  return getRequiredEnv("META_APP_SECRET");
}

function getEncryptionSecret() {
  return process.env.META_TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || getMetaSecret();
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(getEncryptionSecret()).digest();
}

export function getAppBaseUrl(request?: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  return "http://localhost:3000";
}

export function getMetaRedirectUri(request?: Request) {
  return `${getAppBaseUrl(request)}/api/meta/instagram/callback`;
}

export function encryptMetaToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptMetaToken(payload: string) {
  const [ivValue, tagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token payload.");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createMetaOAuthState(influencerId: number) {
  const payload = {
    influencerId,
    exp: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomBytes(12).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", getMetaSecret()).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function parseMetaOAuthState(state: string) {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid OAuth state.");
  }

  const expectedSignature = crypto.createHmac("sha256", getMetaSecret()).update(encodedPayload).digest("base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error("Invalid OAuth state signature.");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
    influencerId?: number;
    exp?: number;
  };

  if (!payload.influencerId || !payload.exp || payload.exp < Date.now()) {
    throw new Error("Expired OAuth state.");
  }

  return {
    influencerId: payload.influencerId,
  };
}

export function createMetaLoginUrl(influencerId: number, request?: Request) {
  const url = new URL(META_OAUTH_URL);
  const businessLoginConfigId = process.env.META_LOGIN_CONFIG_ID || process.env.META_BUSINESS_LOGIN_CONFIG_ID;

  url.searchParams.set("client_id", getRequiredEnv("META_APP_ID"));
  url.searchParams.set("redirect_uri", getMetaRedirectUri(request));
  url.searchParams.set("state", createMetaOAuthState(influencerId));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");

  if (businessLoginConfigId) {
    url.searchParams.set("config_id", businessLoginConfigId);
    url.searchParams.set("override_default_response_type", "true");
  } else {
    url.searchParams.set("scope", META_INSTAGRAM_SCOPES.join(","));
  }

  return url.toString();
}

async function fetchMeta<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${META_GRAPH_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Meta request failed.");
  }

  return data as T;
}

export async function exchangeMetaCodeForToken(code: string, request?: Request) {
  const shortLivedToken = await fetchMeta<MetaAccessTokenResponse>("/oauth/access_token", {
    client_id: getRequiredEnv("META_APP_ID"),
    client_secret: getMetaSecret(),
    redirect_uri: getMetaRedirectUri(request),
    code,
  });

  const longLivedToken = await fetchMeta<MetaAccessTokenResponse>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: getRequiredEnv("META_APP_ID"),
    client_secret: getMetaSecret(),
    fb_exchange_token: shortLivedToken.access_token,
  });

  return longLivedToken;
}

async function getMetaTokenScopes(accessToken: string) {
  const debugToken = await fetchMeta<MetaDebugTokenResponse>("/debug_token", {
    input_token: accessToken,
    access_token: `${getRequiredEnv("META_APP_ID")}|${getMetaSecret()}`,
  });

  const scopes = new Set<string>();

  for (const scope of debugToken.data?.scopes || []) {
    scopes.add(scope);
  }

  for (const granularScope of debugToken.data?.granular_scopes || []) {
    if (granularScope.scope) {
      scopes.add(granularScope.scope);
    }
  }

  return Array.from(scopes).sort();
}

export async function resolveMetaInstagramConnection(accessToken: MetaAccessTokenResponse, preferredHandle?: string) {
  const me = await fetchMeta<MetaMeResponse>("/me", {
    fields: "id",
    access_token: accessToken.access_token,
  });

  const pages = await fetchMeta<MetaPagesResponse>("/me/accounts", {
    fields: "id,name,access_token,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}",
    access_token: accessToken.access_token,
  });

  const normalizedPreferredHandle = preferredHandle?.replace(/^@/, "").toLowerCase();
  const page = pages.data?.find((item) => {
    const instagramAccount = item.instagram_business_account || item.connected_instagram_account;
    const username = instagramAccount?.username?.toLowerCase();
    return normalizedPreferredHandle ? username === normalizedPreferredHandle : Boolean(username);
  }) || pages.data?.find((item) => item.instagram_business_account || item.connected_instagram_account);

  const instagramAccount = page?.instagram_business_account || page?.connected_instagram_account;

  if (!page || !instagramAccount?.id || !instagramAccount.username) {
    const pageSummary = pages.data?.length
      ? pages.data
          .map((item) => {
            const account = item.instagram_business_account || item.connected_instagram_account;
            return `${item.name}${account?.username ? `:@${account.username}` : ":no-instagram"}`;
          })
          .join(", ")
      : "no-pages";

    throw new Error(`No connected Instagram professional account was found for this Meta user. Pages returned: ${pageSummary}.`);
  }

  return {
    handle: instagramAccount.username,
    profileUrl: instagramAccount.profile_picture_url,
    metaUserId: me.id,
    metaPageId: page.id,
    metaPageName: page.name,
    instagramBusinessAccountId: instagramAccount.id,
    accessToken: page.access_token || accessToken.access_token,
    tokenType: accessToken.token_type,
    tokenScopes: await getMetaTokenScopes(page.access_token || accessToken.access_token),
    tokenExpiresAt: accessToken.expires_in ? new Date(Date.now() + accessToken.expires_in * 1000) : undefined,
  } satisfies MetaInstagramConnection;
}
