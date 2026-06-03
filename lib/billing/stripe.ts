import { getAbsoluteUrl } from "@/lib/site-url";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type StripeRequestOptions = {
  method?: "GET" | "POST";
  body?: URLSearchParams;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

export type StripePortalSession = {
  id: string;
  url: string;
};

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_start?: number;
  current_period_end?: number;
  metadata?: Record<string, string>;
};

export type StripeCheckoutCompletedSession = {
  id: string;
  customer?: string;
  subscription?: string;
  metadata?: Record<string, string>;
};

export function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return key;
}

export async function stripeRequest<T>(path: string, options: StripeRequestOptions = {}) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: options.method || "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: options.body,
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Stripe request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function createStripeCheckoutSession(input: {
  customerId?: string | null;
  userId: number;
  userEmail: string;
  planId: string;
  planName: string;
  monthlyCredits: number;
  unitAmount: number;
  currency: string;
}) {
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", getAbsoluteUrl("/billing?checkout=success"));
  params.set("cancel_url", getAbsoluteUrl("/billing?checkout=cancel"));
  params.set("client_reference_id", String(input.userId));
  params.set("metadata[userId]", String(input.userId));
  params.set("metadata[planId]", input.planId);
  params.set("metadata[monthlyCredits]", String(input.monthlyCredits));
  params.set("subscription_data[metadata][userId]", String(input.userId));
  params.set("subscription_data[metadata][planId]", input.planId);
  params.set("subscription_data[metadata][monthlyCredits]", String(input.monthlyCredits));
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", input.currency);
  params.set("line_items[0][price_data][unit_amount]", String(input.unitAmount));
  params.set("line_items[0][price_data][recurring][interval]", "month");
  params.set("line_items[0][price_data][product_data][name]", `VioletBeam ${input.planName}`);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${input.monthlyCredits} virtual try-on generations per month`
  );

  if (input.customerId) {
    params.set("customer", input.customerId);
  } else {
    params.set("customer_email", input.userEmail);
  }

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    body: params,
  });
}

export async function createStripePortalSession(customerId: string) {
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("return_url", getAbsoluteUrl("/billing"));

  return stripeRequest<StripePortalSession>("/billing_portal/sessions", {
    body: params,
  });
}

export async function getStripeSubscription(subscriptionId: string) {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, {
    method: "GET",
  });
}
