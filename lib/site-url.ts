export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://violetbeam.com";

  return configuredUrl.replace(/\/$/, "");
}

export function getAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getSiteUrl()}${normalizedPath}`;
}
