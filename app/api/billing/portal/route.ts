import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createStripePortalSession } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!Number.isFinite(userId)) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer found." }, { status: 400 });
  }

  const portalSession = await createStripePortalSession(user.stripeCustomerId);

  return Response.json({
    url: portalSession.url,
  });
}
