import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, Bot, Camera, ImageIcon, Sparkles, Video } from "lucide-react";
import { InfluencerPostStatus, SocialConnectionStatus, VirtualInfluencerStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VioletBeam AI Muses",
  description:
    "Explore VioletBeam virtual fashion agents, their AI-generated looks, social profiles, and shoppable outfit inspiration.",
  alternates: {
    canonical: "/influencers",
  },
  openGraph: {
    title: "VioletBeam AI Muses",
    description: "Discover VioletBeam virtual fashion agents and their AI-generated looks.",
    url: "/influencers",
  },
};

const publicPostStatuses = [InfluencerPostStatus.APPROVED, InfluencerPostStatus.PUBLISHED];

const platformIcons = {
  INSTAGRAM: Camera,
  TIKTOK: Video,
};

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
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

export default async function InfluencersPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const influencersCopy = dictionary.influencers;
  const influencers = await prisma.virtualInfluencer.findMany({
    where: {
      status: VirtualInfluencerStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      profileImageUrl: true,
      bodyReferenceImageUrl: true,
      fashionStyle: true,
      targetAudience: true,
      preferredCategories: true,
      platformAccounts: {
        where: {
          connectionStatus: SocialConnectionStatus.CONNECTED,
        },
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
        where: {
          status: {
            in: publicPostStatuses,
          },
          generatedImageUrl: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        select: {
          id: true,
          generatedImageUrl: true,
          thumbnailUrl: true,
        },
      },
      _count: {
        select: {
          posts: {
            where: {
              status: {
                in: publicPostStatuses,
              },
              generatedImageUrl: {
                not: null,
              },
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              {influencersCopy.directoryLabel}
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {influencersCopy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              {influencersCopy.intro}
            </p>
          </div>
          <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            <Link href={addLocaleToPathname("/lookbook", locale)}>
              Lookbook
              <ImageIcon size={15} />
            </Link>
          </Button>
        </header>

        {influencers.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {influencers.map((influencer) => {
              const heroImage = influencer.bodyReferenceImageUrl || influencer.profileImageUrl;
              const postImages = influencer.posts
                .map((post) => post.thumbnailUrl || post.generatedImageUrl)
                .filter((image): image is string => Boolean(image));

              return (
                <Link
                  key={influencer.id}
                  href={addLocaleToPathname(`/influencers/${influencer.username}`, locale)}
                  className="group grid overflow-hidden rounded-[34px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10 md:grid-cols-[0.82fr_1.18fr]"
                >
                  <div className="relative min-h-[420px] overflow-hidden bg-[#f7f1fb]">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={influencer.displayName}
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 text-[#8d5f9e]">
                        <div className="flex size-20 items-center justify-center rounded-3xl bg-white/70 shadow-xl shadow-purple-900/5">
                          <Bot size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#8d5f9e]/70">{influencersCopy.imagePending}</p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1C1C1C]/55 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] backdrop-blur-xl">
                        {influencer._count.posts} {influencersCopy.publicLooks}
                      </span>
                      <ArrowUpRight size={18} className="text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </div>

                  <div className="flex flex-col p-6 md:p-8">
                    <div className="mb-6 flex items-start gap-4">
                      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f1fb] text-[#8d5f9e] ring-1 ring-white">
                        {influencer.profileImageUrl ? (
                          <img
                            src={influencer.profileImageUrl}
                            alt={`${influencer.displayName} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-serif text-xl italic">{getInitials(influencer.displayName)}</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.24em] text-[#8d5f9e]">
                          @{influencer.username}
                        </p>
                        <h2 className="mt-2 font-serif text-5xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                          {influencer.displayName}
                        </h2>
                      </div>
                    </div>

                    <p className="line-clamp-3 text-sm leading-7 text-stone-500">
                      {influencer.bio || influencersCopy.defaultBio}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-stone-100">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">{influencersCopy.style}</p>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#1C1C1C]">
                          {influencer.fashionStyle || influencersCopy.defaultStyle}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-stone-100">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">{influencersCopy.audience}</p>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#1C1C1C]">
                          {influencer.targetAudience || influencersCopy.defaultAudience}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {influencer.preferredCategories.slice(0, 4).map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#8d5f9e]"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {influencer.platformAccounts.map((account) => {
                        const PlatformIcon = platformIcons[account.platform];

                        return (
                          <span
                            key={account.id}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-[9px] font-bold text-stone-500 ring-1 ring-stone-100"
                          >
                            <PlatformIcon size={12} className="text-[#8d5f9e]" />
                            {account.handle}
                          </span>
                        );
                      })}
                    </div>

                    {postImages.length > 0 ? (
                      <div className="mt-auto pt-7">
                        <div className="grid grid-cols-3 gap-2">
                          {postImages.map((image, index) => (
                            <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#f7f1fb]">
                              <img src={image} alt={`${influencer.displayName} look ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <div>
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-[#f7f1fb] text-[#8d5f9e]">
                <Bot size={26} />
              </div>
              <p className="text-sm font-semibold text-stone-400">{influencersCopy.empty}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
