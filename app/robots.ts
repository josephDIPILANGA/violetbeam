import type { MetadataRoute } from "next";

import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/sign-in",
        "/sign-up",
      ],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
