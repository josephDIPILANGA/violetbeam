import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  encryptMetaToken,
  exchangeMetaCodeForToken,
  parseMetaOAuthState,
  resolveMetaInstagramConnection,
} from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectToAdmin(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/admin/influencers?meta=${status}`, request.url));
}

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error) {
    return redirectToAdmin(request, "cancelled");
  }

  if (!code || !state) {
    return redirectToAdmin(request, "missing-code");
  }

  let influencerId: number;

  try {
    influencerId = parseMetaOAuthState(state).influencerId;
  } catch {
    return redirectToAdmin(request, "invalid-state");
  }

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      id: influencerId,
    },
    select: {
      id: true,
      username: true,
      platformAccounts: {
        where: {
          platform: "INSTAGRAM",
        },
        select: {
          handle: true,
        },
        take: 1,
      },
    },
  });

  if (!influencer) {
    return redirectToAdmin(request, "influencer-not-found");
  }

  try {
    const token = await exchangeMetaCodeForToken(code, request);
    const connection = await resolveMetaInstagramConnection(
      token,
      influencer.platformAccounts[0]?.handle || influencer.username,
    );

    await prisma.influencerPlatformAccount.upsert({
      where: {
        influencerId_platform: {
          influencerId: influencer.id,
          platform: "INSTAGRAM",
        },
      },
      update: {
        handle: connection.handle,
        profileUrl: connection.profileUrl,
        connectionStatus: "CONNECTED",
        providerAccountId: connection.instagramBusinessAccountId,
        metaUserId: connection.metaUserId,
        metaPageId: connection.metaPageId,
        metaPageName: connection.metaPageName,
        instagramBusinessAccountId: connection.instagramBusinessAccountId,
        accessToken: encryptMetaToken(connection.accessToken),
        tokenType: connection.tokenType,
        tokenScopes: connection.tokenScopes,
        tokenExpiresAt: connection.tokenExpiresAt,
        lastSyncedAt: new Date(),
        errorMessage: null,
      },
      create: {
        influencerId: influencer.id,
        platform: "INSTAGRAM",
        handle: connection.handle,
        profileUrl: connection.profileUrl,
        connectionStatus: "CONNECTED",
        providerAccountId: connection.instagramBusinessAccountId,
        metaUserId: connection.metaUserId,
        metaPageId: connection.metaPageId,
        metaPageName: connection.metaPageName,
        instagramBusinessAccountId: connection.instagramBusinessAccountId,
        accessToken: encryptMetaToken(connection.accessToken),
        tokenType: connection.tokenType,
        tokenScopes: connection.tokenScopes,
        tokenExpiresAt: connection.tokenExpiresAt,
        lastSyncedAt: new Date(),
      },
    });

    return redirectToAdmin(request, "instagram-connected");
  } catch (connectionError) {
    await prisma.influencerPlatformAccount.upsert({
      where: {
        influencerId_platform: {
          influencerId: influencer.id,
          platform: "INSTAGRAM",
        },
      },
      update: {
        connectionStatus: "ERROR",
        errorMessage: connectionError instanceof Error ? connectionError.message : "Meta connection failed.",
        lastSyncedAt: new Date(),
      },
      create: {
        influencerId: influencer.id,
        platform: "INSTAGRAM",
        handle: influencer.platformAccounts[0]?.handle || influencer.username,
        connectionStatus: "ERROR",
        errorMessage: connectionError instanceof Error ? connectionError.message : "Meta connection failed.",
        lastSyncedAt: new Date(),
      },
    });

    return redirectToAdmin(request, "instagram-error");
  }
}
