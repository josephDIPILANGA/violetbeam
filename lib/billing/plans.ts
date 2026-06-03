export type BillingPlanId = "basic" | "plus" | "pro";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  monthlyCredits: number;
  unitAmount: number;
  currency: "eur";
  highlighted?: boolean;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For personal virtual try-on sessions.",
    monthlyCredits: 50,
    unitAmount: 500,
    currency: "eur",
  },
  {
    id: "plus",
    name: "Plus",
    description: "For regular wardrobe exploration.",
    monthlyCredits: 150,
    unitAmount: 1200,
    currency: "eur",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For intensive styling and content creation.",
    monthlyCredits: 400,
    unitAmount: 2500,
    currency: "eur",
  },
];

export const TRY_ON_GENERATION_CREDIT_COST = 1;

export function getBillingPlan(planId: string | null | undefined) {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}

export function formatPlanPrice(plan: Pick<BillingPlan, "unitAmount" | "currency">) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
  }).format(plan.unitAmount / 100);
}
