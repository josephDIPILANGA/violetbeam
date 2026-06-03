import type { Metadata } from "next";
import Link from "next/link";
import { InfluencerPostStatus } from "@prisma/client";
import { ArrowLeft, ArrowUpRight, ExternalLink, Shirt, Sparkles, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getArticleProductHref } from "@/lib/catalog";
import { getInfluencerPostHref, getInfluencerPostIdFromSlug, getInfluencerPostSlug } from "@/lib/influencer-posts";
import { prisma } from "@/lib/prisma";
import { getAbsoluteUrl } from "@/lib/site-url";

type AgentPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const publicStatuses = [InfluencerPostStatus.APPROVED, InfluencerPostStatus.PUBLISHED];

function formatPrice(price: number | string | null | undefined, currency = "USD") {
  if (price === null || price === undefined) return "Price coming soon";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(Number(price));
}

async function getAgentPost(slug: string) {
  const id = getInfluencerPostIdFromSlug(slug);
  if (!id) return null;

  return prisma.influencerPost.findFirst({
    where: {
      id,
      status: {
        in: publicStatuses,
      },
      generatedImageUrl: {
        not: null,
      },
    },
    include: {
      influencer: true,
      articles: {
        orderBy: {
          position: "asc",
        },
        include: {
          article: {
            include: {
              brandRef: true,
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: AgentPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAgentPost(slug);

  if (!post) {
    return {
      title: "Look introuvable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = post.caption?.split(".")[0] || `${post.influencer.displayName} AI fashion look`;
  const description =
    post.caption ||
    `Discover an AI-generated VioletBeam look styled by ${post.influencer.displayName}, with shoppable articles and try-on inspiration.`;
  const image = post.thumbnailUrl || post.generatedImageUrl || undefined;
  const canonical = getInfluencerPostHref(post);

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: image
        ? [
            {
              url: image,
              alt: title,
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

export default async function AgentPostPage({ params }: AgentPostPageProps) {
  const { slug } = await params;
  const post = await getAgentPost(slug);

  if (!post) notFound();

  const canonicalSlug = getInfluencerPostSlug(post);
  if (slug !== canonicalSlug) {
    redirect(getInfluencerPostHref(post));
  }

  const image = post.thumbnailUrl || post.generatedImageUrl || "";
  const title = post.caption?.split(".")[0] || `${post.influencer.displayName} AI fashion look`;
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: title,
    caption: post.caption || title,
    contentUrl: image,
    creator: {
      "@type": "Person",
      name: post.influencer.displayName,
      url: getAbsoluteUrl(`/influencers/${post.influencer.username}`),
    },
    associatedMedia: post.articles.map((entry) => ({
      "@type": "Product",
      name: entry.article.title,
      url: getAbsoluteUrl(getArticleProductHref(entry.article)),
      image: entry.article.imageUrls[0],
    })),
  };

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(creativeWorkSchema),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <Link href="/lookbook" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-[#8d5f9e]">
          <ArrowLeft size={14} />
          Back to lookbook
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[38px] border border-white/75 bg-white/50 shadow-2xl shadow-purple-900/5">
            <img src={image} alt={title} className="aspect-[4/5] w-full object-cover" />
          </div>

          <div className="flex flex-col justify-center rounded-[38px] border border-white/75 bg-white/55 p-6 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl lg:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                <Sparkles size={12} />
                VioletBeam Agent Look
              </span>
              <span className="rounded-full bg-white/75 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-white/80">
                {post.status}
              </span>
            </div>

            <h1 className="mt-7 font-serif text-5xl italic leading-[0.95] text-[#1C1C1C] md:text-7xl">
              {title}
            </h1>
            <p className="mt-6 text-base leading-8 text-stone-600">
              {post.caption || `A styled AI look by ${post.influencer.displayName}, built from shoppable VioletBeam catalog pieces.`}
            </p>

            <Link
              href={`/influencers/${post.influencer.username}`}
              className="mt-8 flex items-center gap-4 rounded-[24px] border border-white/75 bg-white/65 p-4 transition-all hover:bg-white"
            >
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f7f1fb] text-[#8d5f9e]">
                {post.influencer.profileImageUrl ? (
                  <img src={post.influencer.profileImageUrl} alt={post.influencer.displayName} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={24} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Styled by</span>
                <span className="block truncate font-serif text-2xl italic text-[#1C1C1C]">{post.influencer.displayName}</span>
              </span>
              <ArrowUpRight className="ml-auto text-[#8d5f9e]" size={18} />
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Shop the look</p>
            <h2 className="mt-2 font-serif text-4xl italic text-[#1C1C1C]">Articles worn in this AI composition</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {post.articles.map((entry) => {
              const article = entry.article;
              const brand = article.brandRef?.name || article.brand || "Cabine Market";

              return (
                <article key={article.id} className="overflow-hidden rounded-[30px] border border-white/75 bg-white/55 shadow-lg shadow-purple-900/5 backdrop-blur-2xl">
                  {article.imageUrls[0] ? (
                    <img src={article.imageUrls[0]} alt={`${article.title} by ${brand}`} className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f3edf9] text-[#8d5f9e]/50">
                      <Shirt size={42} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                      {formatPrice(Number(article.price), "USD")}
                    </p>
                    <h3 className="mt-2 truncate font-serif text-3xl italic text-[#1C1C1C]">{article.title}</h3>
                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{brand}</p>

                    <div className="mt-5 grid gap-2">
                      <Button asChild className="h-11 rounded-full bg-[#1C1C1C] text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#8d5f9e]">
                        <Link href={getArticleProductHref(article)}>
                          Product detail
                          <ArrowUpRight size={13} />
                        </Link>
                      </Button>
                      {article.shopUrl ? (
                        <Button asChild className="h-11 rounded-full bg-white text-[9px] font-black uppercase tracking-[0.18em] text-[#4f365f] ring-1 ring-[#C9A0CD]/25 hover:bg-[#fbf7ff]">
                          <a href={article.shopUrl} target="_blank" rel="noreferrer">
                            Shop
                            <ExternalLink size={13} />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
