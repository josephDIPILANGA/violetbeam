import {
  createMetaOAuthState,
  encryptMetaToken,
  getAppBaseUrl,
  parseMetaOAuthState,
} from "@/lib/meta";

const INSTAGRAM_AUTH_URL = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_GRAPH_URL = "https://graph.instagram.com/v24.0";

const INSTAGRAM_LOGIN_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
];

type InstagramTokenResponse = {
  access_token: string;
  user_id: number;
  permissions?: string | string[];
};

type InstagramLongLivedTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type InstagramMeResponse = {
  id: string;
  username: string;
  account_type?: string;
  profile_picture_url?: string;
};

export type InstagramLoginConnection = {
  handle: string;
  profileUrl?: string;
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

function getInstagramAppId() {
  return process.env.INSTAGRAM_APP_ID || process.env.META_INSTAGRAM_APP_ID || getRequiredEnv("INSTAGRAM_APP_ID");
}

function getInstagramAppSecret() {
  return process.env.INSTAGRAM_APP_SECRET || process.env.META_INSTAGRAM_APP_SECRET || getRequiredEnv("INSTAGRAM_APP_SECRET");
}

export function getInstagramLoginRedirectUri(request?: Request) {
  return `${getAppBaseUrl(request)}/api/meta/instagram-login/callback`;
}

export function createInstagramLoginUrl(influencerId: number, request?: Request) {
  const url = new URL(INSTAGRAM_AUTH_URL);

  url.searchParams.set("client_id", getInstagramAppId());
  url.searchParams.set("redirect_uri", getInstagramLoginRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_LOGIN_SCOPES.join(","));
  url.searchParams.set("state", createMetaOAuthState(influencerId));
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");

  return url.toString();
}

async function fetchInstagramGraph<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${INSTAGRAM_GRAPH_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Instagram request failed.");
  }

  return data as T;
}

export async function exchangeInstagramLoginCodeForToken(code: string, request?: Request) {
  const body = new URLSearchParams({
    client_id: getInstagramAppId(),
    client_secret: getInstagramAppSecret(),
    grant_type: "authorization_code",
    redirect_uri: getInstagramLoginRedirectUri(request),
    code,
  });

  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    body,
    cache: "no-store",
  });
  const token = await response.json();

  if (!response.ok) {
    throw new Error(token?.error_message || token?.error?.message || "Instagram token exchange failed.");
  }

  return token as InstagramTokenResponse;
}

export async function exchangeInstagramLoginTokenForLongLivedToken(shortLivedToken: string) {
  return fetchInstagramGraph<InstagramLongLivedTokenResponse>("/access_token", {
    grant_type: "ig_exchange_token",
    client_secret: getInstagramAppSecret(),
    access_token: shortLivedToken,
  });
}

export async function resolveInstagramLoginConnection(
  token: InstagramTokenResponse,
  preferredHandle?: string,
): Promise<InstagramLoginConnection> {
  const longLivedToken = await exchangeInstagramLoginTokenForLongLivedToken(token.access_token);
  const me = await fetchInstagramGraph<InstagramMeResponse>("/me", {
    fields: "id,username,account_type,profile_picture_url",
    access_token: longLivedToken.access_token,
  });

  const normalizedPreferredHandle = preferredHandle?.replace(/^@/, "").toLowerCase();

  if (normalizedPreferredHandle && me.username.toLowerCase() !== normalizedPreferredHandle) {
    throw new Error(`Connected Instagram account @${me.username} does not match expected @${normalizedPreferredHandle}.`);
  }

  const tokenScopes = Array.isArray(token.permissions)
    ? token.permissions
    : token.permissions?.split(",").filter(Boolean) || INSTAGRAM_LOGIN_SCOPES;

  return {
    handle: me.username,
    profileUrl: me.profile_picture_url,
    instagramBusinessAccountId: me.id,
    accessToken: encryptMetaToken(longLivedToken.access_token),
    tokenType: longLivedToken.token_type,
    tokenScopes: tokenScopes.sort(),
    tokenExpiresAt: longLivedToken.expires_in ? new Date(Date.now() + longLivedToken.expires_in * 1000) : undefined,
  };
}

export { parseMetaOAuthState };
