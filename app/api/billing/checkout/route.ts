import { getServerSession } from "next-auth";

import { getBillingPlan } from "@/lib/billing/plans";
import { createStripeCheckoutSession } from "@/lib/billing/stripe";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user?.email || !Number.isFinite(userId)) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { planId?: string } | null;
  const plan = getBillingPlan(body?.planId);

  if (!plan) {
    return Response.json({ error: "Unknown billing plan." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const checkoutSession = await createStripeCheckoutSession({
    customerId: user.stripeCustomerId,
    userId: user.id,
    userEmail: user.email,
    planId: plan.id,
    planName: plan.name,
    monthlyCredits: plan.monthlyCredits,
    unitAmount: plan.unitAmount,
    currency: plan.currency,
  });

  if (!checkoutSession.url) {
    return Response.json({ error: "Stripe checkout URL is missing." }, { status: 502 });
  }

  return Response.json({
    url: checkoutSession.url,
  });
}
