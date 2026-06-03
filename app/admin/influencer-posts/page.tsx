import Link from "next/link";
import { InfluencerPostStatus } from "@prisma/client";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Filter,
  ImageIcon,
  Search,
  Sparkles,
} from "lucide-react";

import InfluencerPostsClient, { type InfluencerPostView } from "@/app/influencers/[username]/influencer-posts-client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NEEDS_REVISION_STATUS = "NEEDS_REVISION" as InfluencerPostStatus;

type AdminInfluencerPostsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
  }>;
};

const statusFilters = [
  { label: "All", value: "ALL" },
  { label: "Generated", value: InfluencerPostStatus.GENERATED },
  { label: "Approved", value: InfluencerPostStatus.APPROVED },
  { label: "Scheduled", value: InfluencerPostStatus.SCHEDULED },
  { label: "Published", value: InfluencerPostStatus.PUBLISHED },
  { label: "Revision", value: NEEDS_REVISION_STATUS },
  { label: "Failed", value: InfluencerPostStatus.FAILED },
] as const;

const statusStyles: Record<string, string> = {
  ALL: "bg-[#1C1C1C] text-white ring-[#1C1C1C]",
  GENERATED: "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/30",
  APPROVED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  SCHEDULED: "bg-sky-50 text-sky-600 ring-sky-100",
  PUBLISHED: "bg-[#1C1C1C] text-white ring-[#1C1C1C]",
  NEEDS_REVISION: "bg-amber-50 text-amber-600 ring-amber-100",
  FAILED: "bg-red-50 text-red-500 ring-red-100",
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusParam(value: string | undefined) {
  const statuses = [...Object.values(InfluencerPostStatus), NEEDS_REVISION_STATUS];
  return value && statuses.includes(value as InfluencerPostStatus) ? (value as InfluencerPostStatus) : "ALL";
}

function createStatusHref(status: string, query: string) {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return suffix ? `/admin/influencer-posts?${suffix}` : "/admin/influencer-posts";
}

export default async function AdminInfluencerPostsPage({ searchParams }: AdminInfluencerPostsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const activeStatus = getStatusParam(getSingleParam(params.status));
  const search = (getSingleParam(params.q) || "").trim();

  const [statusCounts, posts] = await Promise.all([
    prisma.influencerPost.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.influencerPost.findMany({
      where: {
        ...(activeStatus !== "ALL"
          ? {
              status: activeStatus,
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  caption: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  contentPillar: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  influencer: {
                    OR: [
                      {
                        displayName: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                      {
                        username: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      take: 90,
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
        influencer: {
          select: {
            displayName: true,
            username: true,
            isAiDisclosed: true,
          },
        },
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
                price: true,
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
    }),
  ]);

  const countByStatus = new Map(statusCounts.map((entry) => [entry.status, entry._count._all]));
  const totalCount = statusCounts.reduce((total, entry) => total + entry._count._all, 0);
  const generatedCount = countByStatus.get(InfluencerPostStatus.GENERATED) || 0;
  const scheduledCount = countByStatus.get(InfluencerPostStatus.SCHEDULED) || 0;
  const publishedCount = countByStatus.get(InfluencerPostStatus.PUBLISHED) || 0;
  const revisionCount = countByStatus.get(NEEDS_REVISION_STATUS) || 0;

  const mappedPosts: InfluencerPostView[] = posts.map((post) => ({
    id: post.id,
    status: post.status,
    influencerName: post.influencer.displayName,
    influencerUsername: post.influencer.username,
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
  }));

  const allAiDisclosed = posts.every((post) => post.influencer.isAiDisclosed);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              Editorial queue
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Post <br />
              Review
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Centralise les contenus generes par les agents, puis approuve, programme ou publie les looks depuis une seule file editoriale.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Total</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{totalCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Pending</p>
              <p className="mt-3 font-serif text-5xl italic text-[#8d5f9e]">{generatedCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Live</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{publishedCount}</p>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-[32px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const count = filter.value === "ALL" ? totalCount : countByStatus.get(filter.value) || 0;
                const isActive = activeStatus === filter.value;

                return (
                  <Link
                    key={filter.value}
                    href={createStatusHref(filter.value, search)}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition-colors",
                      isActive ? statusStyles[filter.value] : "bg-white text-stone-500 ring-stone-100 hover:text-[#8d5f9e]",
                    )}
                  >
                    <Filter size={12} />
                    {filter.label}
                    <span className="opacity-70">{count}</span>
                  </Link>
                );
              })}
            </div>

            <form action="/admin/influencer-posts" className="relative w-full lg:w-[360px]">
              {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d5f9e]" size={17} />
              <input
                name="q"
                defaultValue={search}
                placeholder="SEARCH AGENT OR CAPTION..."
                className="h-12 w-full rounded-full border border-stone-200 bg-white pl-12 pr-4 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-600 outline-none transition-colors focus:border-[#C9A0CD]"
              />
            </form>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <CircleDashed size={19} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">A verifier</p>
              <p className="mt-1 text-sm font-semibold text-stone-600">
                {generatedCount} posts en attente, {revisionCount} a revoir
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <CalendarClock size={19} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Planifies</p>
              <p className="mt-1 text-sm font-semibold text-stone-600">{scheduledCount} posts programmes</p>
            </div>
          </div>
            <Link
              href="/admin/editorial-calendar"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-sky-50 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-white"
            >
              <CalendarClock size={13} />
              Editorial calendar
            </Link>
            <Link
              href="/admin/influencers"
              className="group flex items-center justify-between gap-4 rounded-[28px] border border-white/80 bg-[#1C1C1C] p-5 text-white shadow-2xl shadow-purple-900/5 transition-colors hover:bg-[#8d5f9e]"
            >
            <span className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <CheckCircle2 size={19} />
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Agents</span>
                <span className="mt-1 block text-sm font-semibold">Retour au studio agents</span>
              </span>
            </span>
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        {mappedPosts.length > 0 ? (
          <InfluencerPostsClient posts={mappedPosts} isReviewMode isAiDisclosed={allAiDisclosed} />
        ) : (
          <section className="flex min-h-[380px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-[#f7f1fb] text-[#8d5f9e]">
              <ImageIcon size={32} />
            </div>
            <h2 className="font-serif text-4xl italic text-[#1C1C1C]">No posts found</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-stone-500">
              Change le filtre, cherche un autre agent, ou genere de nouveaux posts influenceurs.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
