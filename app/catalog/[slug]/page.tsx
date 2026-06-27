import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, PackageCheck, Shirt, Sparkles, Star, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getArticleIdFromProductSlug, getArticleProductHref, getArticleProductSlug, getCatalogModuleMeta } from "@/lib/catalog";
import { getInfluencerPostHref } from "@/lib/influencer-posts";
import { withVisibleArticles } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";
import { getAbsoluteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatPrice(price: number | string, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(price));
}

function formatDelivery(article: {
  estimatedDeliveryMinDays: number | null;
  estimatedDeliveryMaxDays: number | null;
}) {
  if (!article.estimatedDeliveryMinDays && !article.estimatedDeliveryMaxDays) return null;

  if (article.estimatedDeliveryMinDays && article.estimatedDeliveryMaxDays) {
    return `${article.estimatedDeliveryMinDays}-${article.estimatedDeliveryMaxDays} days`;
  }

  return `${article.estimatedDeliveryMinDays || article.estimatedDeliveryMaxDays} days`;
}

async function getArticle(slug: string) {
  const id = getArticleIdFromProductSlug(slug);
  if (!id) return null;

  return prisma.article.findFirst({
    where: {
      AND: [
        {
          id,
        },
        withVisibleArticles(),
      ],
    },
    include: {
      brandRef: true,
      influencerPosts: {
        where: {
          post: {
            status: {
              in: ["APPROVED", "PUBLISHED"],
            },
            generatedImageUrl: {
              not: null,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          post: {
            include: {
              influencer: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article introuvable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const brand = article.brandRef?.name || article.brand || "VioletBeam";
  const category = getCatalogModuleMeta(article.category).label;
  const title = `${article.title} by ${brand}`;
  const description =
    article.description ||
    `Discover ${article.title}, a ${category.toLowerCase()} piece from ${brand}, ready for AI try-on in VioletBeam.`;
  const image = article.imageUrls[0];
  const canonical = getArticleProductHref(article);

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: image
        ? [
            {
              url: image,
              alt: `${article.title} by ${brand}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const canonicalSlug = getArticleProductSlug(article);
  if (slug !== canonicalSlug) {
    redirect(getArticleProductHref(article));
  }

  const brand = article.brandRef?.name || article.brand || "Cabine Market";
  const categoryMeta = getCatalogModuleMeta(article.category);
  const image = article.imageUrls[0] || "";
  const delivery = formatDelivery(article);
  const tryOnHref = `/cabine?module=${encodeURIComponent(article.category)}&article=db-${article.id}`;
  const similarArticles = await prisma.article.findMany({
    where: withVisibleArticles({
      id: {
        not: article.id,
      },
      OR: [
        { category: article.category },
        article.brandRef?.id ? { brandId: article.brandRef.id } : { brand: article.brand || undefined },
      ],
    }),
    orderBy: [
      {
        rating: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 4,
    include: {
      brandRef: true,
    },
  });
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: article.title,
    description:
      article.description ||
      `${article.title} from ${brand}, available in the VioletBeam catalog with AI try-on inspiration.`,
    image: article.imageUrls,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    category: categoryMeta.label,
    sku: `violetbeam-${article.id}`,
    offers: {
      "@type": "Offer",
      price: Number(article.price),
      priceCurrency: article.shippingCurrency,
      availability: "https://schema.org/InStock",
      url: getAbsoluteUrl(getArticleProductHref(article)),
    },
    aggregateRating:
      typeof article.rating === "number" && article.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: article.rating,
            reviewCount: article.reviewCount,
          }
        : undefined,
  };
  const benefitBadges = [
    article.isOnSale && article.discountPercent ? `-${article.discountPercent}%` : null,
    article.freeShipping ? "Free shipping" : null,
    article.shippingCountry ? `Ships from ${article.shippingCountry}` : null,
    delivery ? `Delivery ${delivery}` : null,
    typeof article.rating === "number" ? `Rated ${article.rating.toFixed(1)}` : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-[#8d5f9e]">
          <ArrowLeft size={14} />
          Back to catalog
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[36px] border border-white/75 bg-white/50 shadow-2xl shadow-purple-900/5">
            {image ? (
              <img src={image} alt={`${article.title} by ${brand}`} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f3edf9] text-[#8d5f9e]/50">
                <Shirt size={64} strokeWidth={1.2} />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center rounded-[36px] border border-white/75 bg-white/55 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:p-9">
            <div className="flex flex-wrap gap-2">
              <Link href={`/categories/${article.category}`} className="inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                <Sparkles size={12} />
                {categoryMeta.label}
              </Link>
              {article.brandRef?.slug ? (
                <Link href={`/brands/${article.brandRef.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-white/80">
                  {brand}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-white/80">
                  {brand}
                </span>
              )}
            </div>

            <h1 className="mt-7 font-serif text-5xl italic leading-[0.95] text-[#1C1C1C] md:text-7xl">
              {article.title}
            </h1>
            <p className="mt-5 text-3xl font-black text-[#8d5f9e]">
              {formatPrice(Number(article.price), article.shippingCurrency)}
            </p>

            {benefitBadges.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {benefitBadges.map((badge) => (
                  <span key={badge} className="rounded-full bg-white/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-stone-100">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-7 text-base leading-8 text-stone-600">
              {article.description || `${article.title} is available in the VioletBeam catalog and can be tested in the AI cabine before shopping.`}
              {" "}
              Explore more from{" "}
              {article.brandRef?.slug ? (
                <Link href={`/brands/${article.brandRef.slug}`} className="font-bold text-[#8d5f9e] hover:underline">
                  {brand}
                </Link>
              ) : (
                <span className="font-bold text-[#8d5f9e]">{brand}</span>
              )}
              {" "}or browse similar{" "}
              <Link href={`/categories/${article.category}`} className="font-bold text-[#8d5f9e] hover:underline">
                {categoryMeta.label.toLowerCase()}
              </Link>
              .
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-14 rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#8d5f9e]">
                <Link href={tryOnHref}>
                  Try in cabine
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
              {article.shopUrl ? (
                <Button asChild className="h-14 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.2em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                  <a href={article.shopUrl} target="_blank" rel="noreferrer">
                    Shop
                    <ExternalLink size={14} />
                  </a>
                </Button>
              ) : (
                <Button disabled className="h-14 rounded-full bg-white text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 ring-1 ring-stone-200">
                  Shop
                </Button>
              )}
            </div>
          </div>
        </section>

        {article.influencerPosts.length > 0 ? (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Worn by VioletBeam muses</p>
                <h2 className="mt-2 font-serif text-4xl italic text-[#1C1C1C]">AI compositions featuring this article</h2>
              </div>
              <Link href="/lookbook" className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 hover:text-[#8d5f9e]">
                Lookbook
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {article.influencerPosts.map((entry) => {
                const post = entry.post;
                const postImage = post.thumbnailUrl || post.generatedImageUrl || "";
                const postTitle = post.caption?.split(".")[0] || `${post.influencer.displayName} AI look`;

                return (
                  <Link
                    key={post.id}
                    href={getInfluencerPostHref(post)}
                    className="group overflow-hidden rounded-[30px] border border-white/75 bg-white/55 shadow-lg shadow-purple-900/5 transition-all hover:-translate-y-1 hover:bg-white"
                  >
                    <img src={postImage} alt={postTitle} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                        {post.influencer.displayName}
                      </p>
                      <h3 className="mt-2 line-clamp-2 font-serif text-3xl italic leading-none text-[#1C1C1C]">{postTitle}</h3>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                        {post.contentPillar || post.status}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <DetailCard icon={Truck} title="Shipping" text={article.freeShipping ? "Free shipping available" : article.shippingPrice ? `${formatPrice(Number(article.shippingPrice), article.shippingCurrency)} delivery` : "Shipping details coming soon"} />
          <DetailCard icon={PackageCheck} title="Origin" text={article.shippingCountry ? `Ships from ${article.shippingCountry}` : "Origin to be confirmed"} />
          <DetailCard icon={Star} title="Rating" text={typeof article.rating === "number" ? `${article.rating.toFixed(1)} / 5 · ${article.reviewCount} reviews` : "No rating yet"} />
        </section>

        <section className="mt-10 rounded-[32px] border border-white/75 bg-white/55 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <h2 className="font-serif text-4xl italic text-[#1C1C1C]">Product details</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <TagList title="Colors" items={article.colors} />
            <TagList title="Materials" items={article.materials} />
            <TagList title="Style tags" items={[...article.styleTags, ...article.tags.map((entry) => entry.tag.name)]} />
          </div>
        </section>

        {similarArticles.length > 0 ? (
          <section className="mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Explore more</p>
                <h2 className="mt-2 font-serif text-4xl italic text-[#1C1C1C]">Similar products</h2>
              </div>
              <Link href={`/categories/${article.category}`} className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 hover:text-[#8d5f9e]">
                More {categoryMeta.label}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarArticles.map((similar) => (
                <Link
                  key={similar.id}
                  href={getArticleProductHref(similar)}
                  className="group overflow-hidden rounded-[28px] border border-white/75 bg-white/55 shadow-lg shadow-purple-900/5 transition-all hover:-translate-y-1 hover:bg-white"
                >
                  {similar.imageUrls[0] ? (
                    <img src={similar.imageUrls[0]} alt={`${similar.title} by ${similar.brandRef?.name || similar.brand || "VioletBeam"}`} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f3edf9] text-[#8d5f9e]/50">
                      <Shirt size={36} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                      {formatPrice(Number(similar.price), similar.shippingCurrency)}
                    </p>
                    <h3 className="mt-2 truncate font-serif text-2xl italic text-[#1C1C1C]">{similar.title}</h3>
                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                      {similar.brandRef?.name || similar.brand || "Cabine Market"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DetailCard({ icon: Icon, title, text }: { icon: typeof Truck; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/75 bg-white/55 p-5 shadow-lg shadow-purple-900/5 backdrop-blur-2xl">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#8d5f9e]/10 text-[#8d5f9e]">
        <Icon size={18} />
      </div>
      <h2 className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">{title}</h2>
      <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">{text}</p>
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  const visibleItems = Array.from(new Set(items.filter(Boolean))).slice(0, 8);

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">{title}</h3>
      {visibleItems.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <Link
              key={item}
              href={`/catalog?q=${encodeURIComponent(item)}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ring-1",
                "bg-white/80 text-stone-500 ring-stone-100 hover:text-[#8d5f9e]",
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-stone-400">Details coming soon.</p>
      )}
    </div>
  );
}
