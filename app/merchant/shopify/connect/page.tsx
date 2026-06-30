import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2, LogIn, Store, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getMerchantPublishingState } from "@/lib/merchant-access";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    shop?: string;
  }>;
};

function normalizeShopDomain(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export default async function ShopifyMerchantConnectPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const copy = dictionary.shopifyConnect;
  const params = (await searchParams) || {};
  const shopDomain = normalizeShopDomain(params.shop);

  if (!shopDomain) {
    redirect(addLocaleToPathname("/sign-in", locale));
  }

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isFinite(userId)) {
    const callbackUrl = `${addLocaleToPathname("/merchant/shopify/connect", locale)}?shop=${encodeURIComponent(shopDomain)}`;
    redirect(`${addLocaleToPathname("/sign-in", locale)}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const [existingForShop, currentUser] = await Promise.all([
    prisma.merchantProfile.findUnique({
    where: { shopDomain },
    select: {
      userId: true,
      wantsMarketplace: true,
      approvedForPosting: true,
      user: {
        select: {
          emailVerified: true,
        },
      },
    },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        merchantProfile: {
          select: {
            shopDomain: true,
            wantsMarketplace: true,
            approvedForPosting: true,
            user: {
              select: {
                emailVerified: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const isLinkedToCurrentUser = Boolean(existingForShop && existingForShop.userId === userId);
  const currentMerchantStatus = getMerchantPublishingState(currentUser?.merchantProfile ?? null);
  const isLinkedToOtherUser = Boolean(existingForShop && existingForShop.userId !== userId);
  const needsMerchantProfile = !currentUser?.merchantProfile && !existingForShop;
  const merchantShopMismatch =
    Boolean(currentUser?.merchantProfile) &&
    currentUser?.merchantProfile?.shopDomain !== shopDomain &&
    !existingForShop;

  if (needsMerchantProfile) {
    redirect(`${addLocaleToPathname("/account", locale)}?shop=${encodeURIComponent(shopDomain)}`);
  }

  return (
    <main className="min-h-screen bg-[#FDFBFF] px-6 py-16 text-[#1C1C1C]">
      <section className="mx-auto max-w-2xl rounded-[36px] border border-white/80 bg-white/85 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
          {isLinkedToCurrentUser ? <CheckCircle2 size={24} /> : merchantShopMismatch ? <UserCog size={24} /> : <Store size={24} />}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">{copy.label}</p>
        <h1 className="mt-3 font-serif text-5xl italic tracking-tight">
          {isLinkedToCurrentUser
            ? currentMerchantStatus.active
              ? copy.connectedTitle
              : copy.incompleteTitle
            : merchantShopMismatch
              ? copy.mismatchTitle
              : copy.linkedTitle}
        </h1>

        <p className="mt-5 text-sm leading-7 text-stone-500">
          {isLinkedToCurrentUser
            ? currentMerchantStatus.active
              ? copy.connectedMessage.replace("{shopDomain}", shopDomain)
              : copy.incompleteMessage
                  .replace("{shopDomain}", shopDomain)
                  .replace("{status}", currentMerchantStatus.message.toLowerCase())
            : merchantShopMismatch
              ? copy.mismatchMessage
                  .replace("{currentShopDomain}", currentUser?.merchantProfile?.shopDomain || "")
                  .replace("{shopDomain}", shopDomain)
              : copy.linkedMessage.replace("{shopDomain}", shopDomain)}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
            <Link href={isLinkedToOtherUser ? addLocaleToPathname("/sign-in", locale) : `${addLocaleToPathname("/account", locale)}?shop=${encodeURIComponent(shopDomain)}`}>
              {isLinkedToOtherUser ? <LogIn size={15} /> : <UserCog size={15} />}
              {isLinkedToOtherUser ? copy.signIn : copy.editProfile}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#8d5f9e]/25 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
            <Link href={addLocaleToPathname("/catalog", locale)}>{copy.openVioletBeam}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
