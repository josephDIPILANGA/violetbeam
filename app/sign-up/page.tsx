"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Building2, Loader2, Sparkles, Store, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getZodFieldErrors, signUpSchema } from "@/lib/validations/auth";

type SignUpField =
  | "name"
  | "username"
  | "email"
  | "password"
  | "confirmPassword"
  | "shopName"
  | "shopDomain";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [wantsToPostArticles, setWantsToPostArticles] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [sector, setSector] = useState("Fashion");
  const [country, setCountry] = useState("France");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignUpField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop") || "";
    const isShopifyMerchant = params.get("merchant") === "shopify" || Boolean(shop);

    if (isShopifyMerchant) {
      setWantsToPostArticles(true);
    }

    if (shop) {
      setShopDomain(shop);
      setShopName((current) => current || shop.replace(".myshopify.com", ""));
    }
  }, []);

  const validateField = (
    field: SignUpField,
    values: { name: string; username: string; email: string; password: string; confirmPassword: string },
  ) => {
    const parsedPayload = signUpSchema.safeParse(values);
    const nextErrors = parsedPayload.success ? {} : getZodFieldErrors<SignUpField>(parsedPayload.error);

    setFieldErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const parsedPayload = signUpSchema.safeParse({ name, username, email, password, confirmPassword });
    if (!parsedPayload.success) {
      setFieldErrors(getZodFieldErrors<SignUpField>(parsedPayload.error));
      return;
    }

    if (wantsToPostArticles && (!shopName.trim() || !shopDomain.trim())) {
      setFieldErrors((current) => ({
        ...current,
        shopName: !shopName.trim() ? "Le nom de la boutique est obligatoire." : current.shopName,
        shopDomain: !shopDomain.trim() ? "L'URL Shopify est obligatoire." : current.shopDomain,
      }));
      return;
    }

    setIsSubmitting(true);
    const registerPayload = {
      name: parsedPayload.data.name,
      username: parsedPayload.data.username,
      email: parsedPayload.data.email,
      password: parsedPayload.data.password,
      wantsToPostArticles,
      merchantProfile: wantsToPostArticles
        ? {
            shopName,
            shopDomain,
            shopDescription,
            sector,
            country,
          }
        : undefined,
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setError(data.error || "Impossible de créer le compte.");
      return;
    }

    setIsSubmitting(false);
    setSuccessMessage(data.message || "Compte cree. Verifiez votre email pour activer votre compte.");
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShopName("");
    setShopDescription("");
  };

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
            <Sparkles size={13} />
            Join VioletBeam
          </div>
          <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
            Sign up
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-stone-500">
            Créez votre compte pour sauvegarder vos compositions, suivre vos looks et préparer vos futurs essayages IA.
          </p>
          <div className="mt-8 max-w-md overflow-hidden rounded-[34px] border border-white/80 bg-white/55 p-3 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] bg-[#f7f1fb]">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=900"
                alt="Editorial fashion portrait"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/35 to-transparent" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[40px] border border-white/80 bg-gradient-to-br from-[#fbf7ff]/90 via-white/85 to-white/95 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
            <UserRound size={22} />
          </div>
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Name</span>
              <Input
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  validateField("name", { name: nextName, username, email, password, confirmPassword });
                }}
                required
                minLength={3}
                maxLength={50}
                aria-invalid={Boolean(fieldErrors.name)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.name && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.name}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Username</span>
              <Input
                value={username}
                onChange={(event) => {
                  const nextUsername = event.target.value;
                  setUsername(nextUsername);
                  validateField("username", { name, username: nextUsername, email, password, confirmPassword });
                }}
                required
                minLength={3}
                maxLength={40}
                aria-invalid={Boolean(fieldErrors.username)}
                className="h-12 rounded-xl border-stone-200 bg-white"
                placeholder="maya.store"
              />
              {fieldErrors.username && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.username}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  setEmail(nextEmail);
                  validateField("email", { name, username, email: nextEmail, password, confirmPassword });
                }}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.email && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.email}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  const nextPassword = event.target.value;
                  setPassword(nextPassword);
                  validateField("password", { name, username, email, password: nextPassword, confirmPassword });
                  if (confirmPassword) {
                    validateField("confirmPassword", { name, username, email, password: nextPassword, confirmPassword });
                  }
                }}
                required
                minLength={7}
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.password)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.password && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.password}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Confirm password</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  const nextConfirmPassword = event.target.value;
                  setConfirmPassword(nextConfirmPassword);
                  validateField("confirmPassword", { name, username, email, password, confirmPassword: nextConfirmPassword });
                }}
                required
                minLength={7}
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.confirmPassword && (
                <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.confirmPassword}</span>
              )}
            </label>

            <button
              type="button"
              onClick={() => setWantsToPostArticles((current) => !current)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                wantsToPostArticles
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
                  <span className="mt-1 block text-xs">For Shopify merchants who want their products in the marketplace.</span>
                </span>
              </span>
              <span className={`h-5 w-5 rounded-full border ${wantsToPostArticles ? "border-[#8d5f9e] bg-[#8d5f9e]" : "border-stone-300"}`} />
            </button>

            {wantsToPostArticles && (
              <div className="rounded-[28px] border border-[#8d5f9e]/20 bg-white/70 p-5 shadow-inner shadow-purple-900/5">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
                  <Building2 size={14} />
                  Merchant details
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Shop name</span>
                    <Input value={shopName} onChange={(event) => setShopName(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" />
                    {fieldErrors.shopName && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.shopName}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Shopify URL</span>
                    <Input value={shopDomain} onChange={(event) => setShopDomain(event.target.value)} className="h-12 rounded-xl border-stone-200 bg-white" placeholder="your-store.myshopify.com" />
                    {fieldErrors.shopDomain && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.shopDomain}</span>}
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
                      placeholder="Tell us what you sell and who your products are for."
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500">{error}</p>}
          {successMessage && (
            <p className="mt-5 rounded-xl bg-[#f7f1fb] px-4 py-3 text-sm font-semibold text-[#8d5f9e]">
              {successMessage}
            </p>
          )}

          <Button disabled={isSubmitting} className="mt-8 h-12 w-full rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <ArrowUpRight size={15} />}
            Create account
          </Button>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-bold text-[#8d5f9e] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
