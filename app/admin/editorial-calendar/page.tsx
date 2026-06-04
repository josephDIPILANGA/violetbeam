import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock,
  Sparkles,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const influencerPostStatus = {
  DRAFT: "DRAFT",
  GENERATED: "GENERATED",
  APPROVED: "APPROVED",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  NEEDS_REVISION: "NEEDS_REVISION",
  FAILED: "FAILED",
} as const;

type InfluencerPostStatus = (typeof influencerPostStatus)[keyof typeof influencerPostStatus];

type EditorialCalendarPageProps = {
  searchParams: Promise<{
    month?: string | string[];
  }>;
};

type CalendarPost = {
  id: number;
  status: string;
  caption: string | null;
  thumbnailUrl: string | null;
  generatedImageUrl: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  contentPillar: string | null;
  influencer: {
    displayName: string;
    username: string;
  };
};

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
});

const statusStyles: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-500 ring-stone-200",
  GENERATED: "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/30",
  APPROVED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  SCHEDULED: "bg-sky-50 text-sky-600 ring-sky-100",
  PUBLISHED: "bg-[#1C1C1C] text-white ring-[#1C1C1C]",
  NEEDS_REVISION: "bg-amber-50 text-amber-600 ring-amber-100",
  FAILED: "bg-red-50 text-red-500 ring-red-100",
};

const reviewStatuses: InfluencerPostStatus[] = [
  influencerPostStatus.GENERATED,
  influencerPostStatus.NEEDS_REVISION,
  influencerPostStatus.FAILED,
];

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseMonth(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCalendarDate(post: CalendarPost) {
  if (post.status === influencerPostStatus.SCHEDULED && post.scheduledAt) return post.scheduledAt;
  if (post.status === influencerPostStatus.PUBLISHED && post.publishedAt) return post.publishedAt;
  return post.scheduledAt || post.publishedAt || post.createdAt;
}

function getCalendarDays(monthStart: Date) {
  const firstGridDay = new Date(monthStart);
  firstGridDay.setDate(firstGridDay.getDate() - ((firstGridDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return date;
  });
}

function getShortCaption(post: CalendarPost) {
  const caption = post.caption || post.contentPillar || "Influencer post";
  return caption.length > 84 ? `${caption.slice(0, 84)}...` : caption;
}

export default async function EditorialCalendarPage({ searchParams }: EditorialCalendarPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const monthStart = parseMonth(getSingleParam(params.month));
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const previousMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const calendarDays = getCalendarDays(monthStart);
  const gridStart = calendarDays[0];
  const gridEnd = new Date(calendarDays[calendarDays.length - 1]);
  gridEnd.setDate(gridEnd.getDate() + 1);

  const [posts, readyToScheduleCount] = await Promise.all([
    prisma.influencerPost.findMany({
      where: {
        OR: [
          {
            scheduledAt: {
              gte: gridStart,
              lt: gridEnd,
            },
          },
          {
            publishedAt: {
              gte: gridStart,
              lt: gridEnd,
            },
          },
          {
            createdAt: {
              gte: gridStart,
              lt: gridEnd,
            },
          },
        ],
      },
      orderBy: [
        {
          scheduledAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        status: true,
        caption: true,
        thumbnailUrl: true,
        generatedImageUrl: true,
        createdAt: true,
        scheduledAt: true,
        publishedAt: true,
        contentPillar: true,
        influencer: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    }),
    prisma.influencerPost.count({
      where: {
        status: influencerPostStatus.APPROVED,
        scheduledAt: null,
        publishedAt: null,
      },
    }),
  ]);

  const postsByDay = posts.reduce<Map<string, CalendarPost[]>>((groups: Map<string, CalendarPost[]>, post: CalendarPost) => {
    const key = getDateKey(getCalendarDate(post));
    const current = groups.get(key) || [];
    current.push(post);
    groups.set(key, current);
    return groups;
  }, new Map<string, CalendarPost[]>());

  const scheduledCount = posts.filter((post) => post.status === influencerPostStatus.SCHEDULED).length;
  const publishedCount = posts.filter((post) => post.status === influencerPostStatus.PUBLISHED).length;
  const reviewCount = posts.filter((post) => reviewStatuses.includes(post.status as InfluencerPostStatus)).length;

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
              Planning studio
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Editorial <br />
              Calendar
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Visualise la cadence des agents VioletBeam, les posts programmes, les contenus publies et les pieces encore en review.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Scheduled</p>
              <p className="mt-3 font-serif text-5xl italic text-sky-600">{scheduledCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Published</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{publishedCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Review</p>
              <p className="mt-3 font-serif text-5xl italic text-[#8d5f9e]">{reviewCount}</p>
            </div>
          </div>
        </header>

        <section className="mb-8 flex flex-col gap-4 rounded-[32px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/editorial-calendar?month=${formatMonthParam(previousMonth)}`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
            >
              <ArrowLeft size={13} />
              Previous
            </Link>
            <div className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1C1C1C] px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <CalendarDays size={14} />
              {monthFormatter.format(monthStart)}
            </div>
            <Link
              href={`/admin/editorial-calendar?month=${formatMonthParam(nextMonth)}`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
            >
              Next
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/influencer-posts?status=APPROVED"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600 ring-1 ring-emerald-100"
            >
              <Clock size={13} />
              {readyToScheduleCount} ready to schedule
            </Link>
            <Link
              href="/admin/influencer-posts"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
            >
              Post queue
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[34px] border border-white/80 bg-white/60 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="grid grid-cols-7 border-b border-stone-100 bg-white/45">
            {Array.from({ length: 7 }, (_, index) => {
              const date = new Date(2026, 0, 5 + index);
              return (
                <div key={index} className="px-3 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                  {dayFormatter.format(date)}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7">
            {calendarDays.map((day) => {
              const key = getDateKey(day);
              const dayPosts = postsByDay.get(key) || [];
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();
              const isToday = key === getDateKey(new Date());

              return (
                <article
                  key={key}
                  className={cn(
                    "min-h-[220px] border-b border-stone-100 p-3 md:border-r",
                    isCurrentMonth ? "bg-white/35" : "bg-stone-50/45 text-stone-300",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-sm font-black",
                        isToday ? "bg-[#8d5f9e] text-white" : "bg-white text-[#1C1C1C] ring-1 ring-stone-100",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <span className="rounded-full bg-[#f7f1fb] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#8d5f9e]">
                        {dayPosts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayPosts.slice(0, 4).map((post) => {
                      const postImage = post.thumbnailUrl || post.generatedImageUrl;

                      return (
                        <Link
                          key={post.id}
                          href={`/influencers/${post.influencer.username}?review=1`}
                          className="group grid grid-cols-[42px_minmax(0,1fr)] gap-2 rounded-[18px] bg-white/75 p-2 ring-1 ring-stone-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-purple-900/5"
                        >
                          <div className="aspect-square overflow-hidden rounded-[13px] bg-[#f7f1fb]">
                            {postImage ? (
                              <img src={postImage} alt={post.caption || "Influencer post"} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]">
                                <CircleDashed size={15} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] ring-1",
                                statusStyles[post.status],
                              )}
                            >
                              {post.status}
                            </span>
                            <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#8d5f9e]">
                              @{post.influencer.username}
                            </p>
                            <p className="line-clamp-2 text-[10px] leading-4 text-stone-500">{getShortCaption(post)}</p>
                          </div>
                        </Link>
                      );
                    })}

                    {dayPosts.length > 4 && (
                      <Link
                        href="/admin/influencer-posts"
                        className="inline-flex h-8 items-center rounded-full bg-[#1C1C1C] px-3 text-[8px] font-black uppercase tracking-[0.16em] text-white"
                      >
                        +{dayPosts.length - 4} more
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/influencer-posts?status=SCHEDULED"
            className="flex items-center gap-4 rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl transition-colors hover:bg-white"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <CalendarClock size={19} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Scheduled queue</span>
              <span className="mt-1 block text-sm font-semibold text-stone-600">Verifier les posts programmes</span>
            </span>
          </Link>

          <Link
            href="/admin/influencer-posts?status=GENERATED"
            className="flex items-center gap-4 rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl transition-colors hover:bg-white"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <CircleDashed size={19} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Review queue</span>
              <span className="mt-1 block text-sm font-semibold text-stone-600">Approuver ou renvoyer en revision</span>
            </span>
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
      </div>
    </main>
  );
}
