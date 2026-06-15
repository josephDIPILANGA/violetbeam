"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Clock3, ImagePlus, Loader2, Save, ShieldAlert, Store, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountProfileFormProps = {
  initialUser: {
    name: string;
    username: string;
    email: string;
    emailVerified: boolean;
    image: string;
    merchantProfile: {
      shopName: string;
      shopDomain: string;
      shopDescription: string;
      sector: string;
      country: string;
      wantsMarketplace: boolean;
      approvedForPosting: boolean;
    } | null;
  };
  defaultShopDomain?: string;
};

function getAccountStatus({
  emailVerified,
  merchantProfile,
  wantsMerchantProfile,
}: {
  emailVerified: boolean;
  merchantProfile: AccountProfileFormProps["initialUser"]["merchantProfile"];
  wantsMerchantProfile: boolean;
}) {
  if (!wantsMerchantProfile) {
    return {
      label: "Customer",
      description: "Shopping and try-on access only. Marketplace publishing is disabled.",
      tone: "neutral",
      icon: UserRound,
    };
  }

  if (!merchantProfile) {
    return {
      label: "Merchant paused",
      description: "Complete and save your merchant details before publishing Shopify products.",
      tone: "paused",
      icon: ShieldAlert,
    };
  }

  if (!emailVerified) {
    return {
      label: "Email not verified",
      description: "Verify your VioletBeam email before publishing Shopify products.",
      tone: "warning",
      icon: Clock3,
    };
  }

  if (!merchantProfile.wantsMarketplace || !merchantProfile.approvedForPosting) {
    return {
      label: "Merchant paused",
      description: "Your merchant profile exists, but marketplace publishing is currently disabled.",
      tone: "paused",
      icon: ShieldAlert,
    };
  }

  return {
    label: "Merchant active",
    description: "This account can publish Shopify products to VioletBeam.",
    tone: "active",
    icon: CheckCircle2,
  };
}

export default function AccountProfileForm({ initialUser, defaultShopDomain = "" }: AccountProfileFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [username, setUsername] = useState(initialUser.username);
  const [image, setImage] = useState(initialUser.image);
  const [wantsMerchantProfile, setWantsMerchantProfile] = useState(
    Boolean(initialUser.merchantProfile?.wantsMarketplace || defaultShopDomain),
  );
  const [shopName, setShopName] = useState(
    initialUser.merchantProfile?.shopName || defaultShopDomain.replace(".myshopify.com", ""),
  );
  const [shopDomain, setShopDomain] = useState(initialUser.merchantProfile?.shopDomain || defaultShopDomain);
  const [shopDescription, setShopDescription] = useState(initialUser.merchantProfile?.shopDescription || "");
  const [sector, setSector] = useState(initialUser.merchantProfile?.sector || "Fashion");
  const [country, setCountry] = useState(initialUser.merchantProfile?.country || "France");
  const [merchantProfile, setMerchantProfile] = useState(initialUser.merchantProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const accountStatus = getAccountStatus({
    emailVerified: initialUser.emailVerified,
    merchantProfile,
    wantsMerchantProfile,
  });
  const StatusIcon = accountStatus.icon;
  const statusToneClass =
    accountStatus.tone === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : accountStatus.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : accountStatus.tone === "paused"
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-stone-200 bg-white/70 text-stone-500";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        username,
        image,
        wantsMerchantProfile,
        merchantProfile: wantsMerchantProfile
          ? {
              shopName,
              shopDomain,
              shopDescription,
              sector,
              country,
            }
          : undefined,
      }),
    });

    const data = await response.json().catch(() => null);
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data?.error || "Impossible de mettre a jour le profil.");
      return;
    }

    setSuccess(data?.message || "Profil mis a jour.");
    setMerchantProfile(data?.user?.merchantProfile || null);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <section className="rounded-[34px] border border-white/80 bg-white/75 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-[28px] bg-[#f7f1fb] text-[#8d5f9e] ring-1 ring-white">
            {image ? <img src={image} alt={name} className="h-full w-full object-cover" /> : <UserRound size={42} />}
          </div>
          <h2 className="mt-5 font-serif text-4xl italic tracking-tight">{name || "Your profile"}</h2>
          <p className="mt-2 text-sm text-stone-500">{initialUser.email}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
            {wantsMerchantProfile ? <Store size={13} /> : <UserRound size={13} />}
            {wantsMerchantProfile ? "Merchant account" : "Customer account"}
          </div>
          <div className={`mt-5 w-full rounded-3xl border px-4 py-4 text-left ${statusToneClass}`}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/80">
                <StatusIcon size={18} />
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.22em]">{accountStatus.label}</span>
                <span className="mt-1 block text-sm leading-6 opacity-80">{accountStatus.description}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/80 bg-gradient-to-br from-[#fbf7ff]/90 via-white/85 to-white/95 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#8d5f9e]">Account settings</p>
            <h1 className="mt-2 font-serif text-5xl italic tracking-tight">Profile</h1>
          </div>
          <Button disabled={isSubmitting} className="rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Username</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
              <ImagePlus size={13} />
              Profile photo URL
            </span>
            <Input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              className="h-12 rounded-xl border-stone-200 bg-white"
              placeholder="https://..."
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setWantsMerchantProfile((current) => !current)}
          className={`mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
            wantsMerchantProfile
              ? "border-[#8d5f9e]/40 bg-[#8d5f9e]/10 text-[#4d3158]"
              : "border-stone-200 bg-white/70 text-stone-500"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#8d5f9e]">
              <Store size={18} />
            </span>
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.2em]">Post articles on VioletBeam</span>
              <span className="mt-1 block text-xs">Activate merchant access for Shopify product publishing.</span>
            </span>
          </span>
          <span className={`h-5 w-5 rounded-full border ${wantsMerchantProfile ? "border-[#8d5f9e] bg-[#8d5f9e]" : "border-stone-300"}`} />
        </button>

        {wantsMerchantProfile && (
          <div className="mt-5 rounded-[28px] border border-[#8d5f9e]/20 bg-white/70 p-5 shadow-inner shadow-purple-900/5">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
              <Store size={14} />
              Merchant details
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Shop name</span>
                <Input value={shopName} onChange={(event) => setShopName(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Shopify URL</span>
                <Input value={shopDomain} onChange={(event) => setShopDomain(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" placeholder="your-store.myshopify.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Sector</span>
                <Input value={sector} onChange={(event) => setSector(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Country</span>
                <Input value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Shop description</span>
                <textarea
                  value={shopDescription}
                  onChange={(event) => setShopDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#8d5f9e]"
                />
              </label>
            </div>
          </div>
        )}

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}
        {success && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#f7f1fb] px-4 py-3 text-sm font-semibold text-[#8d5f9e]">
            <CheckCircle2 size={16} />
            {success}
          </p>
        )}
      </section>
    </form>
  );
}
