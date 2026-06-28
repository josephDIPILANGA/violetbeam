import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];

  if (!isLocale(locale)) return NextResponse.next();

  const rewrittenUrl = request.nextUrl.clone();
  const strippedPathname = `/${segments.slice(1).join("/")}`;
  rewrittenUrl.pathname = strippedPathname === "/" ? "/" : strippedPathname.replace(/\/$/, "") || "/";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-violetbeam-locale", locale);

  return NextResponse.rewrite(rewrittenUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
