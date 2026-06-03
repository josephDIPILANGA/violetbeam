import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfluencerPostStatus } from "@prisma/client";
import {
  ArrowLeft,
  Camera,
  ImageIcon,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";

import InfluencerPostsClient, { type InfluencerPostView } from "./influencer-posts-client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type InfluencerPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ review?: string | string[] }>;
};

const platformIcons = {
  INSTAGRAM: Camera,
  TIKTOK: Video,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      username,
    },
    select: {
      displayName: true,
      username: true,
      bio: true,
      profileImageUrl: true,
      fashionStyle: true,
    },
  });

  if (!influencer) {
    return {
      title: "Virtual muse",
    };
  }

  return {
    title: influencer.displayName,
    description:
      influencer.bio ||
      `Explore ${influencer.displayName}'s VioletBeam fashion editorials and AI-generated outfit inspiration.`,
    alternates: {
      canonical: `/influencers/${influencer.username}`,
    },
    openGraph: {
      title: `${influencer.displayName} on VioletBeam`,
      description:
        influencer.bio ||
        `Discover ${influencer.fashionStyle || "AI fashion"} looks by ${influencer.displayName}.`,
      url: `/influencers/${influencer.username}`,
      images: influencer.profileImageUrl ? [influencer.profileImageUrl] : undefined,
    },
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default async function InfluencerPage({ params, searchParams }: InfluencerPageProps) {
  const { username } = await params;
  const reviewParam = (await searchParams).review;
  const isReviewMode = Array.isArray(reviewParam) ? reviewParam[0] === "1" : reviewParam === "1";

  if (isReviewMode) {
    await requireAdmin();
  }

  const visibleStatuses = isReviewMode
    ? undefined
    : [InfluencerPostStatus.APPROVED, InfluencerPostStatus.PUBLISHED];

  const influencer = await prisma.virtualInfluencer.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      emailAlias: true,
      bio: true,
      status: true,
      profileImageUrl: true,
      bodyReferenceImageUrl: true,
      fashionStyle: true,
      toneOfVoice: true,
      targetAudience: true,
      preferredCategories: true,
      isAiDisclosed: true,
      platformAccounts: {
        orderBy: {
          platform: "asc",
        },
        select: {
          id: true,
          platform: true,
          handle: true,
          profileUrl: true,
        },
      },
      posts: {
        where: visibleStatuses
          ? {
              status: {
                in: visibleStatuses,
              },
            }
          : undefined,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          caption: true,
          hashtags: true,
          generatedImageUrl: true,
          thumbnailUrl: true,
          createdAt: true,
          scheduledAt: true,
          publishedAt: true,
          externalPostUrl: true,
          errorMessage: true,
          articles: {
            orderBy: {
              position: "asc",
            },
            select: {
              snapshot: true,
              article: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  price: true,
                  category: true,
                  imageUrls: true,
                  brand: true,
                  shopUrl: true,
                  brandRef: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!influencer) notFound();

  const pendingCount = influencer.posts.filter((post) => post.status === "GENERATED").length;

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={isReviewMode ? "/admin/influencers" : "/influencers"}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
          >
            <ArrowLeft size={14} />
            Agents
          </Link>
          {isReviewMode && (
            <span className="rounded-full bg-[#f7f1fb] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
              Review mode / {pendingCount} pending
            </span>
          )}
        </div>

        <header className="mb-12 overflow-hidden rounded-[42px] border border-white/80 bg-white/60 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="relative min-h-[520px] overflow-hidden bg-[#f7f1fb]">
              {influencer.bodyReferenceImageUrl || influencer.profileImageUrl ? (
                <img
                  src={influencer.bodyReferenceImageUrl || influencer.profileImageUrl || ""}
                  alt={influencer.displayName}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-4 text-[#8d5f9e]">
                  <div className="flex size-24 items-center justify-center rounded-3xl bg-white/70 shadow-xl shadow-purple-900/5">
                    <UserRound size={40} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#8d5f9e]/70">Image pending</p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1C1C1C]/55 to-transparent" />
            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
                <Sparkles size={13} />
                VioletBeam Agent
              </div>
              <div className="flex items-start gap-5">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f1fb] text-[#8d5f9e] ring-1 ring-white">
                  {influencer.profileImageUrl ? (
                    <img src={influencer.profileImageUrl} alt={`${influencer.displayName} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-serif text-2xl italic">{getInitials(influencer.displayName)}</span>
                  )}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">@{influencer.username}</p>
                  <h1 className="mt-3 font-serif text-6xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-8xl">
                    {influencer.displayName}
                  </h1>
                </div>
              </div>

              <p className="mt-7 max-w-2xl text-base leading-8 text-stone-500">{influencer.bio || "Bio a definir."}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-white/70 p-5 ring-1 ring-stone-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Style</p>
                  <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">{influencer.fashionStyle || "A definir"}</p>
                </div>
                <div className="rounded-[24px] bg-white/70 p-5 ring-1 ring-stone-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Audience</p>
                  <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">{influencer.targetAudience || "A definir"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {influencer.preferredCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {influencer.platformAccounts.map((account) => {
                  const PlatformIcon = platformIcons[account.platform];
                  const content = (
                    <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-bold text-stone-500 ring-1 ring-stone-100">
                      <PlatformIcon size={13} className="text-[#8d5f9e]" />
                      {account.handle}
                    </span>
                  );

                  return account.profileUrl ? (
                    <a key={account.id} href={account.profileUrl} target="_blank" rel="noreferrer">
                      {content}
                    </a>
                  ) : (
                    <span key={account.id}>{content}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-8">
          
          <div className="flex flex-col justify-between gap-4 border-t border-stone-200 pt-12 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">Agent posts</p>
              <h2 className="mt-3 font-serif text-6xl italic leading-none text-[#1C1C1C]">
                {isReviewMode ? "Review queue" : "Public looks"}
              </h2>
            </div>
          </div>

          {influencer.posts.length > 0 ? (
            <InfluencerPostsClient
              isAiDisclosed={influencer.isAiDisclosed}
              isReviewMode={isReviewMode}
              posts={influencer.posts.map((post): InfluencerPostView => ({
                id: post.id,
                status: post.status,
                caption: post.caption,
                hashtags: post.hashtags,
                generatedImageUrl: post.generatedImageUrl,
                thumbnailUrl: post.thumbnailUrl,
                createdAt: post.createdAt.toISOString(),
                scheduledAt: post.scheduledAt?.toISOString() || null,
                publishedAt: post.publishedAt?.toISOString() || null,
                externalPostUrl: post.externalPostUrl,
                errorMessage: post.errorMessage,
                articles: post.articles.map((entry) => {
                  const snapshot =
                    entry.snapshot && typeof entry.snapshot === "object"
                      ? (entry.snapshot as {
                          image?: string;
                          brand?: string;
                          title?: string;
                          name?: string;
                          price?: string | number;
                          shopUrl?: string;
                        })
                      : {};

                  return {
                    id: entry.article.id,
                    title: snapshot.title || snapshot.name || entry.article.title,
                    brand: snapshot.brand || entry.article.brandRef?.name || entry.article.brand || "Brand",
                    image: snapshot.image || entry.article.imageUrls[0] || "",
                    price: snapshot.price ?? Number(entry.article.price),
                    shopUrl: snapshot.shopUrl || entry.article.shopUrl,
                  };
                }),
              }))}
            />
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
              <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-[#f7f1fb] text-[#8d5f9e]">
                <ImageIcon size={32} />
              </div>
              <h2 className="font-serif text-4xl italic text-[#1C1C1C]">No posts yet</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-stone-500">
                {isReviewMode
                  ? "Genere un premier post pour cet agent afin de demarrer la review."
                  : "Les posts approuves de cet agent apparaitront ici."}
              </p>
            </div>
          )}

        </section>
      </div>
    </main>
  );
}
