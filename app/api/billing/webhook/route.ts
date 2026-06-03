import { createHmac, timingSafeEqual } from "node:crypto";

import { getBillingPlan } from "@/lib/billing/plans";
import { grantCredits } from "@/lib/billing/credits";
import { getStripeSubscription, type StripeCheckoutCompletedSession, type StripeSubscription } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type StripeInvoice = {
  id: string;
  customer?: string;
  subscription?: string;
  billing_reason?: string;
};

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return secret;
}

function parseStripeSignature(signature: string) {
  return Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
}

function verifyStripeSignature(payload: string, signature: string | null) {
  if (!signature) return false;

  const parsed = parseStripeSignature(signature);
  const timestamp = parsed.t;
  const expectedSignature = parsed.v1;

  if (!timestamp || !expectedSignature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const digest = createHmac("sha256", getWebhookSecret()).update(signedPayload).digest("hex");

  const digestBuffer = Buffer.from(digest, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (digestBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(digestBuffer, expectedBuffer);
}

function fromUnixTimestamp(value?: number) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

async function upsertSubscription(input: {
  userId: number;
  customerId: string;
  subscription: StripeSubscription;
}) {
  const planId = input.subscription.metadata?.planId || "basic";
  const plan = getBillingPlan(planId) || getBillingPlan("basic");

  if (!plan) {
    throw new Error("Billing plan configuration is missing.");
  }

  await prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      stripeCustomerId: input.customerId,
    },
  });

  return prisma.billingSubscription.upsert({
    where: {
      stripeSubscriptionId: input.subscription.id,
    },
    create: {
      userId: input.userId,
      stripeCustomerId: input.customerId,
      stripeSubscriptionId: input.subscription.id,
      status: input.subscription.status,
      plan: plan.id,
      monthlyCredits: plan.monthlyCredits,
      currentPeriodStart: fromUnixTimestamp(input.subscription.current_period_start),
      currentPeriodEnd: fromUnixTimestamp(input.subscription.current_period_end),
      cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    },
    update: {
      status: input.subscription.status,
      plan: plan.id,
      monthlyCredits: plan.monthlyCredits,
      currentPeriodStart: fromUnixTimestamp(input.subscription.current_period_start),
      currentPeriodEnd: fromUnixTimestamp(input.subscription.current_period_end),
      cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    },
  });
}

async function handleCheckoutCompleted(session: StripeCheckoutCompletedSession) {
  const userId = Number(session.metadata?.userId);
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!Number.isFinite(userId) || !customerId || !subscriptionId) return;

  const subscription = await getStripeSubscription(subscriptionId);
  await upsertSubscription({
    userId,
    customerId,
    subscription,
  });
}

async function handleInvoicePaid(invoice: StripeInvoice, stripeEventId: string) {
  if (!invoice.subscription || !invoice.customer) return;

  const existingLedger = await prisma.creditLedger.findFirst({
    where: {
      stripeEventId,
    },
    select: {
      id: true,
    },
  });

  if (existingLedger) return;

  const subscription = await getStripeSubscription(invoice.subscription);
  const userId = Number(subscription.metadata?.userId);

  if (!Number.isFinite(userId)) return;

  const billingSubscription = await upsertSubscription({
    userId,
    customerId: invoice.customer,
    subscription,
  });

  if (subscription.status !== "active" && subscription.status !== "trialing") return;

  await grantCredits({
    userId,
    amount: billingSubscription.monthlyCredits,
    reason: `${billingSubscription.plan} monthly subscription renewal`,
    source: "stripe.invoice.paid",
    stripeEventId,
  });
}

async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  const userId = Number(subscription.metadata?.userId);

  if (!Number.isFinite(userId)) return;

  await upsertSubscription({
    userId,
    customerId: subscription.customer,
    subscription,
  });
}

async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  await prisma.billingSubscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
    },
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(payload, signature)) {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object as StripeCheckoutCompletedSession);
  }

  if (event.type === "invoice.paid") {
    await handleInvoicePaid(event.data.object as StripeInvoice, event.id);
  }

  if (event.type === "customer.subscription.updated") {
    await handleSubscriptionUpdated(event.data.object as StripeSubscription);
  }

  if (event.type === "customer.subscription.deleted") {
    await handleSubscriptionDeleted(event.data.object as StripeSubscription);
  }

  return Response.json({ received: true });
}
