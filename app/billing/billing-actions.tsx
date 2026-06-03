"use client";

import { useState } from "react";
import { CreditCard, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type BillingPlanId } from "@/lib/billing/plans";

export function CheckoutButton({
  planId,
  children,
}: {
  planId: BillingPlanId;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de demarrer Stripe Checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur Stripe.");
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={isLoading}
      className="h-12 w-full rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]"
    >
      {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
      {children}
    </Button>
  );
}

export function CustomerPortalButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function openPortal() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible d'ouvrir le portail Stripe.");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur Stripe.");
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={openPortal}
      disabled={isLoading}
      variant="outline"
      className="h-11 rounded-full border-stone-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 hover:text-[#8d5f9e]"
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
      Manage subscription
    </Button>
  );
}
