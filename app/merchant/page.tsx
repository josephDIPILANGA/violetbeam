import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowUpRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Package,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Store,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getArticleProductHref, slugifyCatalogText } from "@/lib/catalog";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getMerchantPublishingState } from "@/lib/merchant-access";
import {
  HIDDEN_MARKETPLACE_TAG_NAME,
  HIDDEN_MARKETPLACE_TAG_SLUG,
  SHOPIFY_MARKETPLACE_TAG_SLUG,
} from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Merchant Studio",
  description: "Manage Shopify products exported to the VioletBeam marketplace.",
  robots: {
    index: false,
    follow: false,
  },
};

type MerchantArticle = {
  id: number;
  title: string;
  description: string | null;
  price: unknown;
  category: string;
  imageUrls: string[];
  brand: string | null;
  shopUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    tag: {
      slug: string;
      name: string;
    };
  }>;
};

function formatPrice(price: unknown) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price || 0));
}

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

function isHidden(article: Pick<MerchantArticle, "tags">) {
  return article.tags.some((entry) => entry.tag.slug === HIDDEN_MARKETPLACE_TAG_SLUG);
}

function getMerchantArticleOwnershipWhere(shopDomain: string) {
  const shopDomainSlug = slugifyCatalogText(shopDomain);

  return {
    AND: [
      {
        tags: {
          some: {
            tag: {
              slug: SHOPIFY_MARKETPLACE_TAG_SLUG,
            },
          },
        },
      },
      {
        OR: [
          {
            shopUrl: {
              contains: shopDomain,
              mode: "insensitive" as const,
            },
          },
          {
            brandRef: {
              websiteUrl: {
                contains: shopDomain,
                mode: "insensitive" as const,
              },
            },
          },
          ...(shopDomainSlug
            ? [
                {
                  tags: {
                    some: {
                      tag: {
                        slug: shopDomainSlug,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };
}

async function getCurrentMerchantUser(locale: Locale) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !Number.isFinite(userId)) {
    redirect(`${addLocaleToPathname("/sign-in", locale)}?callbackUrl=${encodeURIComponent(addLocaleToPathname("/merchant", locale))}`);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      image: true,
      emailVerified: true,
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
    redirect(`${addLocaleToPathname("/sign-in", locale)}?callbackUrl=${encodeURIComponent(addLocaleToPathname("/merchant", locale))}`);
  }

  return user;
}

async function getOwnedArticle(articleId: number, userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
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
  });

  const shopDomain = user?.merchantProfile?.shopDomain;
  const merchantStatus = getMerchantPublishingState(user?.merchantProfile ?? null);
  if (!shopDomain || !merchantStatus.active) {
    throw new Error(merchantStatus.message);
  }

  return prisma.article.findFirst({
    where: {
      id: articleId,
      ...getMerchantArticleOwnershipWhere(shopDomain),
    },
    select: {
      id: true,
    },
  });
}

export async function hideMerchantArticle(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const articleId = Number(formData.get("articleId"));

  if (!session?.user || !Number.isFinite(userId)) {
    redirect("/sign-in?callbackUrl=/merchant");
  }

  if (!Number.isFinite(articleId)) {
    throw new Error("Invalid article.");
  }

  const article = await getOwnedArticle(articleId, userId);
  if (!article) {
    throw new Error("You cannot update this article.");
  }

  const hiddenTag = await prisma.tag.upsert({
    where: {
      slug: HIDDEN_MARKETPLACE_TAG_SLUG,
    },
    update: {
      name: HIDDEN_MARKETPLACE_TAG_NAME,
      type: "system",
    },
    create: {
      name: HIDDEN_MARKETPLACE_TAG_NAME,
      slug: HIDDEN_MARKETPLACE_TAG_SLUG,
      type: "system",
    },
    select: {
      id: true,
    },
  });

  await prisma.articleTag.upsert({
    where: {
      articleId_tagId: {
        articleId,
        tagId: hiddenTag.id,
      },
    },
    update: {},
    create: {
      articleId,
      tagId: hiddenTag.id,
    },
  });

  revalidatePath("/merchant");
  revalidatePath("/catalog");
}

export async function showMerchantArticle(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const articleId = Number(formData.get("articleId"));

  if (!session?.user || !Number.isFinite(userId)) {
    redirect("/sign-in?callbackUrl=/merchant");
  }

  if (!Number.isFinite(articleId)) {
    throw new Error("Invalid article.");
  }

  const article = await getOwnedArticle(articleId, userId);
  if (!article) {
    throw new Error("You cannot update this article.");
  }

  await prisma.articleTag.deleteMany({
    where: {
      articleId,
      tag: {
        slug: HIDDEN_MARKETPLACE_TAG_SLUG,
      },
    },
  });

  revalidatePath("/merchant");
  revalidatePath("/catalog");
}

export default async function MerchantPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const copy = dictionary.merchantStudio;
  const user = await getCurrentMerchantUser(locale);
  const merchant = user.merchantProfile;
  const merchantStatus = getMerchantPublishingState(
    merchant
      ? {
          wantsMarketplace: merchant.wantsMarketplace,
          approvedForPosting: merchant.approvedForPosting,
          user: {
            emailVerified: user.emailVerified,
          },
        }
      : null,
  );

  if (!merchant) {
    return (
      <main className="min-h-screen bg-[#FDFBFF] px-6 py-16 text-[#1C1C1C] lg:px-10">
        <section className="mx-auto max-w-5xl rounded-[40px] border border-white/80 bg-white/70 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:p-12">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#8d5f9e]/10 text-[#8d5f9e]">
            <Store size={28} />
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">{copy.accessLabel}</p>
          <h1 className="mt-3 font-serif text-6xl italic leading-none md:text-7xl">{copy.createTitle}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">{copy.createIntro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
              <Link href={addLocaleToPathname("/account", locale)}>
                <Pencil size={15} />
                {copy.completeProfile}
              </Link>
            </Button>
            <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
              <Link href={addLocaleToPathname("/catalog", locale)}>
                {copy.browseCatalog}
                <ArrowUpRight size={15} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (!merchantStatus.active) {
    return (
      <main className="min-h-screen bg-[#FDFBFF] px-6 py-16 text-[#1C1C1C] lg:px-10">
        <section className="mx-auto max-w-5xl rounded-[40px] border border-white/80 bg-white/70 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:p-12">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <TriangleAlert size={28} />
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">{copy.accessLabel}</p>
          <h1 className="mt-3 font-serif text-6xl italic leading-none md:text-7xl">{copy.pausedTitle}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
            {merchantStatus.message} {copy.pausedSuffix}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-full bg-[#1C1C1C] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
              <Link href={addLocaleToPathname("/account", locale)}>
                <Pencil size={15} />
                {copy.updateProfile}
              </Link>
            </Button>
            <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
              <Link href={addLocaleToPathname("/catalog", locale)}>
                {copy.browseCatalog}
                <ArrowUpRight size={15} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const articles = (await prisma.article.findMany({
    where: getMerchantArticleOwnershipWhere(merchant.shopDomain),
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      imageUrls: true,
      brand: true,
      shopUrl: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  })) as MerchantArticle[];
  const hiddenCount = articles.filter(isHidden).length;
  const visibleCount = articles.length - hiddenCount;

  return (
    <main className="min-h-screen bg-[#FDFBFF] px-6 py-12 text-[#1C1C1C] lg:px-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/45 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[32%] rounded-full bg-[#C9A0CD]/12 blur-[110px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <header className="grid gap-6 rounded-[40px] border border-white/80 bg-white/70 p-7 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">
              <ShoppingBag size={13} />
              {copy.studioLabel}
            </div>
            <h1 className="mt-5 font-serif text-6xl italic leading-none md:text-8xl">{merchant.shopName}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-500">{copy.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-full bg-[#1C1C1C] px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
                <Link href={addLocaleToPathname("/account", locale)}>
                  <Pencil size={14} />
                  {copy.editProfile}
                </Link>
              </Button>
              <Button asChild className="h-11 rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                <a href={`https://${merchant.shopDomain}`} target="_blank" rel="noreferrer">
                  {copy.openShop}
                  <ArrowUpRight size={14} />
                </a>
              </Button>
            </div>
          </div>

          <aside className="grid gap-3 rounded-[30px] bg-[#f7f1fb]/70 p-5 ring-1 ring-white/80">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#8d5f9e]">
                {merchant.approvedForPosting ? <ShieldCheck size={22} /> : <TriangleAlert size={22} />}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{copy.status}</p>
                <p className="text-sm font-black text-[#4f365f]">
                  {merchant.approvedForPosting ? copy.approved : copy.pending}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <p className="text-2xl font-black">{articles.length}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">{copy.products}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <p className="text-2xl font-black text-emerald-600">{visibleCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">{copy.visible}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <p className="text-2xl font-black text-[#8d5f9e]">{hiddenCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">{copy.hidden}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-xs font-semibold text-stone-500">
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">{copy.shopDomain}</span>
              {merchant.shopDomain}
            </div>
          </aside>
        </header>

        <section className="mt-8 rounded-[38px] border border-white/80 bg-white/65 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">{copy.shopifyProducts}</p>
              <h2 className="mt-2 font-serif text-5xl italic leading-none">{copy.inventory}</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/80">
              <BadgeCheck size={13} className="text-[#8d5f9e]" />
              {copy.synced}
            </div>
          </div>

          {articles.length > 0 ? (
            <div className="grid gap-4">
              {articles.map((article) => {
                const articleHidden = isHidden(article);
                const image = article.imageUrls[0];

                return (
                  <article
                    key={article.id}
                    className="grid gap-4 rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-sm md:grid-cols-[112px_1fr_auto]"
                  >
                    <div className="overflow-hidden rounded-2xl bg-[#f3edf9]">
                      {image ? (
                        <img src={image} alt={article.title} className="aspect-square h-full w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-[#8d5f9e]/50">
                          <Package size={34} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 py-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] ${
                            articleHidden
                              ? "bg-stone-100 text-stone-500"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {articleHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                          {articleHidden ? copy.hiddenStatus : copy.liveStatus}
                        </span>
                        <span className="rounded-full bg-[#8d5f9e]/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-1 text-xl font-black">{article.title}</h3>
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-stone-500">
                        {article.description || copy.noDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">
                        <span>{article.brand || merchant.shopName}</span>
                        <span>{formatPrice(article.price)}</span>
                        <span>{copy.updated} {article.updatedAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch md:justify-center">
                      {!articleHidden ? (
                        <form action={hideMerchantArticle}>
                          <input type="hidden" name="articleId" value={article.id} />
                          <Button className="h-10 w-full rounded-full bg-[#1C1C1C] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]">
                            <EyeOff size={13} />
                            {copy.hide}
                          </Button>
                        </form>
                      ) : (
                        <form action={showMerchantArticle}>
                          <input type="hidden" name="articleId" value={article.id} />
                          <Button className="h-10 w-full rounded-full bg-[#8d5f9e] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#1C1C1C]">
                            <Eye size={13} />
                            {copy.show}
                          </Button>
                        </form>
                      )}
                      <Button asChild className="h-10 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                        <Link href={addLocaleToPathname(getArticleProductHref(article), locale)}>
                          {copy.view}
                          <ArrowUpRight size={13} />
                        </Link>
                      </Button>
                      {article.shopUrl ? (
                        <Button asChild className="h-10 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-200 hover:bg-[#fbf7ff]">
                          <a href={article.shopUrl} target="_blank" rel="noreferrer">
                            Shopify
                            <ArrowUpRight size={13} />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-stone-200 bg-white/45 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#8d5f9e]/10 text-[#8d5f9e]">
                <Package size={25} />
              </div>
              <h3 className="mt-5 text-2xl font-black">{copy.noProductsTitle}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">{copy.noProductsText}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
