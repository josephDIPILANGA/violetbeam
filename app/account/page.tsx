import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AccountProfileForm from "@/app/account/account-profile-form";
import { authOptions } from "@/lib/auth";
import { addLocaleToPathname, DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Account | VioletBeam",
  description: "Manage your VioletBeam profile and merchant access.",
};

type AccountPageProps = {
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

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const locale = await getRequestLocale();
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isFinite(userId)) {
    redirect(`${addLocaleToPathname("/sign-in", locale)}?callbackUrl=${encodeURIComponent(addLocaleToPathname("/account", locale))}`);
  }

  const params = (await searchParams) || {};
  const defaultShopDomain = normalizeShopDomain(params.shop);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      emailVerified: true,
      name: true,
      username: true,
      image: true,
      merchantProfile: {
        select: {
          shopName: true,
          shopDomain: true,
          shopDescription: true,
          sector: true,
          country: true,
          wantsMarketplace: true,
          approvedForPosting: true,
        },
      },
    },
  });

  if (!user) {
    redirect(`${addLocaleToPathname("/sign-in", locale)}?callbackUrl=${encodeURIComponent(addLocaleToPathname("/account", locale))}`);
  }

  return (
    <main className="min-h-screen bg-[#FDFBFF] px-6 py-12 text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>
      <section className="relative mx-auto max-w-6xl pt-10">
        <AccountProfileForm
          defaultShopDomain={defaultShopDomain}
          initialUser={{
            email: user.email,
            emailVerified: Boolean(user.emailVerified),
            name: user.name || "",
            username: user.username || "",
            image: user.image || "",
            merchantProfile: user.merchantProfile
              ? {
                  shopName: user.merchantProfile.shopName,
                  shopDomain: user.merchantProfile.shopDomain,
                  shopDescription: user.merchantProfile.shopDescription || "",
                  sector: user.merchantProfile.sector || "",
                  country: user.merchantProfile.country || "",
                  wantsMarketplace: user.merchantProfile.wantsMarketplace,
                  approvedForPosting: user.merchantProfile.approvedForPosting,
                }
              : null,
          }}
        />
      </section>
    </main>
  );
}
