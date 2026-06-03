import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Check, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { BILLING_PLANS, formatPlanPrice } from "@/lib/billing/plans";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { CheckoutButton, CustomerPortalButton } from "./billing-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing",
  description: "Choose a VioletBeam subscription and manage virtual try-on generation credits.",
  alternates: {
    canonical: "/billing",
  },
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const user = Number.isFinite(userId)
    ? await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          creditsBalance: true,
          stripeCustomerId: true,
          billingSubscription: {
            select: {
              status: true,
              plan: true,
              monthlyCredits: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      })
    : null;

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              VioletBeam billing
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Credits
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Virtual try-on generation is protected by credits so VioletBeam can stay stable, predictable, and sustainable.
            </p>
          </div>

          <aside className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-2xl">
            {session?.user ? (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Available credits</p>
                  <p className="mt-2 font-serif text-6xl italic leading-none text-[#8d5f9e]">{user?.creditsBalance ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f1fb] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">Current plan</p>
                  <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">
                    {user?.billingSubscription
                      ? `${user.billingSubscription.plan} · ${user.billingSubscription.status}`
                      : "No active subscription"}
                  </p>
                  {user?.billingSubscription?.currentPeriodEnd ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Renews on {user.billingSubscription.currentPeriodEnd.toLocaleDateString("fr-FR")}
                    </p>
                  ) : null}
                </div>
                {user?.stripeCustomerId ? <CustomerPortalButton /> : null}
              </div>
            ) : (
              <div>
                <p className="text-sm leading-7 text-stone-500">Connectez-vous pour choisir un abonnement et generer des looks.</p>
                <Button asChild className="mt-5 h-11 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            )}
          </aside>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {BILLING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-[34px] border bg-white/65 p-6 shadow-sm backdrop-blur-2xl",
                plan.highlighted ? "border-[#8d5f9e]/30 shadow-2xl shadow-purple-900/10" : "border-white/70"
              )}
            >
              {plan.highlighted ? (
                <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                  <Zap size={12} />
                  Recommended
                </span>
              ) : null}

              <h2 className="font-serif text-5xl italic leading-none text-[#1C1C1C]">{plan.name}</h2>
              <p className="mt-4 min-h-14 text-sm leading-7 text-stone-500">{plan.description}</p>
              <div className="mt-6 border-y border-stone-200/70 py-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Monthly price</p>
                <p className="mt-2 text-4xl font-black text-[#1C1C1C]">
                  {formatPlanPrice(plan)}
                  <span className="text-sm font-semibold text-stone-400"> / month</span>
                </p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[#8d5f9e]" />
                  {plan.monthlyCredits} virtual try-on generations
                </li>
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[#8d5f9e]" />
                  Credits renew after each paid invoice
                </li>
                <li className="flex items-center gap-3">
                  <Check size={15} className="text-[#8d5f9e]" />
                  Failed generations are refunded
                </li>
              </ul>

              <div className="mt-auto pt-7">
                {session?.user ? (
                  <CheckoutButton planId={plan.id}>Choose {plan.name}</CheckoutButton>
                ) : (
                  <Button asChild className="h-12 w-full rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]">
                    <Link href="/sign-in">Sign in first</Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
