import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createMetaLoginUrl } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const url = new URL(request.url);
  const influencerId = Number(url.searchParams.get("influencerId"));

  if (!Number.isFinite(influencerId)) {
    return NextResponse.redirect(new URL("/admin/influencers?meta=invalid-influencer", request.url));
  }

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      id: true,
    },
  });

  if (!influencer) {
    return NextResponse.redirect(new URL("/admin/influencers?meta=influencer-not-found", request.url));
  }

  return NextResponse.redirect(createMetaLoginUrl(influencer.id, request));
}
