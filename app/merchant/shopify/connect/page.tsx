import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2, LogIn, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
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

export default async function ShopifyMerchantConnectPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const shopDomain = normalizeShopDomain(params.shop);

  if (!shopDomain) {
    redirect("/sign-in");
  }

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isFinite(userId)) {
    const callbackUrl = `/merchant/shopify/connect?shop=${encodeURIComponent(shopDomain)}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const existingForShop = await prisma.merchantProfile.findUnique({
    where: { shopDomain },
    select: {
      userId: true,
    },
  });

  if (!existingForShop) {
    await prisma.merchantProfile.create({
      data: {
        userId,
        shopName: shopDomain.replace(".myshopify.com", ""),
        shopDomain,
        sector: "Fashion",
        platform: "SHOPIFY",
        wantsMarketplace: true,
        approvedForPosting: true,
      },
    });
  }

  const isLinkedToCurrentUser = !existingForShop || existingForShop.userId === userId;

  return (
    <main className="min-h-screen bg-[#FDFBFF] px-6 py-16 text-[#1C1C1C]">
      <section className="mx-auto max-w-2xl rounded-[36px] border border-white/80 bg-white/85 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
          {isLinkedToCurrentUser ? <CheckCircle2 size={24} /> : <Store size={24} />}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Shopify merchant access</p>
        <h1 className="mt-3 font-serif text-5xl italic tracking-tight">
          {isLinkedToCurrentUser ? "Boutique connectee" : "Boutique deja liee"}
        </h1>

        <p className="mt-5 text-sm leading-7 text-stone-500">
          {isLinkedToCurrentUser
            ? `${shopDomain} est maintenant liee a votre compte VioletBeam. Vous pouvez retourner dans Shopify et ajouter vos articles a la marketplace.`
            : `${shopDomain} est deja liee a un autre compte VioletBeam. Connectez-vous avec le bon compte ou contactez VioletBeam.`}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-[#8d5f9e]">
            <Link href="/sign-in">
              <LogIn size={15} />
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#8d5f9e]/25 text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
            <Link href="/catalog">Open VioletBeam</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
