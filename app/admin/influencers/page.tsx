import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Camera,
  CircleDashed,
  LayoutGrid,
  ImageIcon,
  List,
  ListFilter,
  Mail,
  Pause,
  Search,
  Sparkles,
  UserRound,
  Video,
  WandSparkles,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin-auth";
import InfluencerStatusActions from "./influencer-status-actions";
import InfluencerAutomationForm from "./influencer-automation-form";
import WeeklyPlanPreview from "./weekly-plan-preview";

export const dynamic = "force-dynamic";

const statusStyles = {
  DRAFT: "bg-stone-100 text-stone-500 ring-stone-200",
  ACTIVE: "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/30",
  PAUSED: "bg-amber-50 text-amber-600 ring-amber-100",
  ARCHIVED: "bg-stone-100 text-stone-400 ring-stone-200",
};

const platformIcons = {
  INSTAGRAM: Camera,
  TIKTOK: Video,
};
const statusOptions = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];
const platformFilterOptions = [
  { value: "CONNECTED", label: "Any connected" },
  { value: "INSTAGRAM_CONNECTED", label: "Instagram connected" },
  { value: "TIKTOK_CONNECTED", label: "TikTok connected" },
  { value: "ERROR", label: "Connection error" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatusIcon(status: string) {
  if (status === "ACTIVE") return BadgeCheck;
  if (status === "PAUSED") return Pause;
  return CircleDashed;
}

function formatNextPostAt(date: Date | null) {
  if (!date) return "Not scheduled";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminInfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const statusFilter =
    typeof resolvedSearchParams.status === "string" && statusOptions.includes(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : "";
  const platformFilter =
    typeof resolvedSearchParams.platform === "string" &&
    platformFilterOptions.some((option) => option.value === resolvedSearchParams.platform)
      ? resolvedSearchParams.platform
      : "";
  const viewMode = resolvedSearchParams.view === "compact" ? "compact" : "cards";
  const isCompactView = viewMode === "compact";
  const requestedPage =
    typeof resolvedSearchParams.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = isCompactView ? 12 : 6;
  const filterWhere: any = {
    ...(search
      ? {
          OR: [
            { displayName: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { emailAlias: { contains: search, mode: "insensitive" } },
            { fashionStyle: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(platformFilter === "CONNECTED"
      ? { platformAccounts: { some: { connectionStatus: "CONNECTED" } } }
      : {}),
    ...(platformFilter === "INSTAGRAM_CONNECTED"
      ? { platformAccounts: { some: { platform: "INSTAGRAM", connectionStatus: "CONNECTED" } } }
      : {}),
    ...(platformFilter === "TIKTOK_CONNECTED"
      ? { platformAccounts: { some: { platform: "TIKTOK", connectionStatus: "CONNECTED" } } }
      : {}),
    ...(platformFilter === "ERROR"
      ? { platformAccounts: { some: { connectionStatus: "ERROR" } } }
      : {}),
  };
  const hasFilters = Boolean(search || statusFilter || platformFilter);
  const buildFilterHref = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      q: search || undefined,
      status: statusFilter || undefined,
      platform: platformFilter || undefined,
      view: viewMode,
      page: currentPage > 1 ? String(currentPage) : undefined,
      ...next,
    };

    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `/admin/influencers?${query}` : "/admin/influencers";
  };
  const filteredInfluencerCount = await prisma.virtualInfluencer.count({
    where: filterWhere,
  });
  const pageCount = Math.max(1, Math.ceil(filteredInfluencerCount / pageSize));
  const safePage = Math.min(currentPage, pageCount);

  const influencers = await prisma.virtualInfluencer.findMany({
    where: filterWhere,
    orderBy: {
      createdAt: "asc",
    },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      displayName: true,
      username: true,
      emailAlias: true,
      bio: true,
      status: true,
      profileImageUrl: true,
      faceReferenceImageUrl: true,
      bodyReferenceImageUrl: true,
      fashionStyle: true,
      targetAudience: true,
      preferredCategories: true,
      isAiDisclosed: true,
      automationEnabled: true,
      postingFrequency: true,
      preferredPostTime: true,
      lastAutomatedPostAt: true,
      nextAutomatedPostAt: true,
      platformAccounts: {
        orderBy: {
          platform: "asc",
        },
        select: {
          id: true,
          platform: true,
          handle: true,
          connectionStatus: true,
          metaPageName: true,
          instagramBusinessAccountId: true,
          lastSyncedAt: true,
          errorMessage: true,
        },
      },
      posts: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
  const totalInfluencerCount = await prisma.virtualInfluencer.count();
  const automationRuns = await prisma.automationRun.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      type: true,
      status: true,
      dryRun: true,
      checked: true,
      generated: true,
      published: true,
      skipped: true,
      failed: true,
      influencerName: true,
      postId: true,
      message: true,
      errorMessage: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
    },
  });

  const readyCount = influencers.filter(
    (influencer) =>
      influencer.profileImageUrl &&
      influencer.faceReferenceImageUrl &&
      influencer.bodyReferenceImageUrl,
  ).length;
  const postCount = influencers.reduce((total, influencer) => total + influencer.posts.length, 0);
  const pendingPostCount = influencers.reduce(
    (total, influencer) => total + influencer.posts.filter((post) => post.status === "GENERATED").length,
    0,
  );
  const activeCount = influencers.filter((influencer) => influencer.status === "ACTIVE").length;

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              VioletBeam Studio
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Agent <br />
              Studio
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Pilote les influenceurs virtuels sans charger cette page avec tous leurs contenus. Chaque agent a sa page dediee de review.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Agents</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{filteredInfluencerCount}</p>
              {hasFilters && (
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                  / {totalInfluencerCount} total
                </p>
              )}
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Ready</p>
              <p className="mt-3 font-serif text-5xl italic text-[#8d5f9e]">{readyCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Pending</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{pendingPostCount}</p>
            </div>
          </div>
        </header>

        <section className="mb-10 flex flex-col gap-4 rounded-[32px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
              <WandSparkles size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Next actions</p>
              <p className="mt-1 text-sm font-semibold text-stone-600">
                Page {safePage}/{pageCount}. {readyCount}/{influencers.length} agents affiches ont leurs images de reference. {activeCount} agents actifs. {postCount} posts generes.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/create-influencer"
              className="inline-flex items-center rounded-full bg-[#1C1C1C] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e]"
            >
              Create agent
            </Link>
            <Link
              href="/admin/influencer-posts"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8d5f9e] ring-1 ring-stone-100 transition-colors hover:bg-[#f7f1fb]"
            >
              Global post queue
            </Link>
            <Link
              href="/admin/editorial-calendar"
              className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 ring-1 ring-sky-100 transition-colors hover:bg-white"
            >
              Editorial calendar
            </Link>
            <code className="rounded-full bg-[#1C1C1C] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              npm run generate:influencer-posts
            </code>
            <code className="rounded-full bg-[#f7f1fb] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8d5f9e]">
              -- --username maya.violetbeam
            </code>
          </div>
        </section>

        <section className="mb-10 rounded-[32px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
                <ListFilter size={18} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Agent filters</p>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  Search, filter and switch layout when the studio grows.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={buildFilterHref({ view: "cards", page: undefined })}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                  !isCompactView
                    ? "bg-[#1C1C1C] text-white ring-[#1C1C1C]"
                    : "bg-white text-stone-500 ring-stone-100 hover:text-[#8d5f9e]",
                )}
              >
                <LayoutGrid size={13} />
                Cards
              </Link>
              <Link
                href={buildFilterHref({ view: "compact", page: undefined })}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                  isCompactView
                    ? "bg-[#1C1C1C] text-white ring-[#1C1C1C]"
                    : "bg-white text-stone-500 ring-stone-100 hover:text-[#8d5f9e]",
                )}
              >
                <List size={13} />
                Compact
              </Link>
            </div>
          </div>

          <form className="grid gap-3 lg:grid-cols-[1.2fr_0.75fr_0.9fr_auto_auto]" action="/admin/influencers">
            <input type="hidden" name="view" value={viewMode} />
            <input type="hidden" name="page" value="1" />
            <label className="relative">
              <span className="sr-only">Search agents</span>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d5f9e]" />
              <input
                name="q"
                defaultValue={search}
                placeholder="SEARCH BY NAME, USERNAME, STYLE..."
                className="h-12 w-full rounded-full border border-stone-100 bg-white/80 pl-11 pr-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
              />
            </label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-12 rounded-full border border-stone-100 bg-white/80 px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              name="platform"
              defaultValue={platformFilter}
              className="h-12 rounded-full border border-stone-100 bg-white/80 px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] outline-none transition focus:border-[#C9A0CD] focus:ring-4 focus:ring-[#C9A0CD]/10"
            >
              <option value="">All platforms</option>
              {platformFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1C1C1C] px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8d5f9e]"
            >
              Apply
            </button>
            <Link
              href="/admin/influencers"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
            >
              Reset
            </Link>
          </form>
        </section>

        {filteredInfluencerCount > pageSize && (
          <nav className="mb-10 flex flex-col gap-3 rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
              Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredInfluencerCount)} of {filteredInfluencerCount} agents
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={safePage > 1 ? buildFilterHref({ page: String(safePage - 1) }) : buildFilterHref({ page: "1" })}
                aria-disabled={safePage <= 1}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                  safePage > 1
                    ? "bg-white text-[#8d5f9e] ring-[#C9A0CD]/25 hover:bg-[#f7f1fb]"
                    : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
                )}
              >
                Previous
              </Link>
              <span className="inline-flex h-10 items-center rounded-full bg-[#f7f1fb] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/20">
                {safePage} / {pageCount}
              </span>
              <Link
                href={safePage < pageCount ? buildFilterHref({ page: String(safePage + 1) }) : buildFilterHref({ page: String(pageCount) })}
                aria-disabled={safePage >= pageCount}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                  safePage < pageCount
                    ? "bg-[#1C1C1C] text-white ring-[#1C1C1C] hover:bg-[#8d5f9e]"
                    : "pointer-events-none bg-white/60 text-stone-300 ring-stone-100",
                )}
              >
                Next
              </Link>
            </div>
          </nav>
        )}

        <WeeklyPlanPreview />

        <section className="mb-10 rounded-[32px] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Automation log</p>
              <h2 className="mt-2 font-serif text-4xl italic leading-none text-[#1C1C1C]">Recent runs</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex h-10 items-center rounded-full bg-[#f7f1fb] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                {automationRuns.length} recorded
              </span>
              <Link
                href="/admin/runs"
                className="inline-flex h-10 items-center rounded-full bg-[#1C1C1C] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8d5f9e]"
              >
                View more
              </Link>
            </div>
          </div>

          {automationRuns.length > 0 ? (
            <div className="grid gap-3">
              {automationRuns.map((run) => (
                <article
                  key={run.id}
                  className="grid gap-4 rounded-[24px] border border-stone-100 bg-white/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] ring-1",
                          run.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : run.status === "FAILED"
                              ? "bg-red-50 text-red-500 ring-red-100"
                              : run.status === "PARTIAL"
                                ? "bg-amber-50 text-amber-600 ring-amber-100"
                                : "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/20",
                        )}
                      >
                        {run.status.toLowerCase()}
                      </span>
                      {run.dryRun && (
                        <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400 ring-1 ring-stone-100">
                          dry run
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                        {run.influencerName || "All agents"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#1C1C1C]">
                      {run.message || run.errorMessage || `${run.type} run`}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(run.startedAt || run.createdAt)}
                      {run.postId ? ` / post #${run.postId}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {[
                      ["checked", run.checked],
                      ["generated", run.generated],
                      ["published", run.published],
                      ["skipped", run.skipped],
                      ["failed", run.failed],
                    ].map(([label, value]) => (
                      <span
                        key={label}
                        className="rounded-full bg-[#FDFBFF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500 ring-1 ring-stone-100"
                      >
                        {value} {label}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-stone-200 bg-white/50 p-6 text-sm font-semibold text-stone-500">
              No automation runs recorded yet. The next step is to connect the cron route to this log.
            </div>
          )}
        </section>

        {influencers.length > 0 ? (
          isCompactView ? (
            <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/60 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <div className="grid gap-3 border-b border-stone-100 px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 md:grid-cols-[1.35fr_0.7fr_1fr_1fr_0.9fr_1.1fr]">
                <span>Agent</span>
                <span>Status</span>
                <span>Platform</span>
                <span>Next post at</span>
                <span>Posts</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-stone-100">
                {influencers.map((influencer) => {
                  const StatusIcon = getStatusIcon(influencer.status);
                  const pendingPosts = influencer.posts.filter((post) => post.status === "GENERATED").length;
                  const connectedPlatforms = influencer.platformAccounts.filter(
                    (account) => account.connectionStatus === "CONNECTED",
                  );

                  return (
                    <article
                      key={influencer.id}
                      className="grid gap-3 px-5 py-4 transition-colors hover:bg-white/70 md:grid-cols-[1.35fr_0.7fr_1fr_1fr_0.9fr_1.1fr] md:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f1fb] text-[#8d5f9e] ring-1 ring-white">
                          {influencer.profileImageUrl ? (
                            <img
                              src={influencer.profileImageUrl}
                              alt={`${influencer.displayName} profile`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-serif text-lg italic">{getInitials(influencer.displayName)}</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-serif text-2xl italic leading-none text-[#1C1C1C]">
                            {influencer.displayName}
                          </h2>
                          <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                            @{influencer.username}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex h-9 w-fit items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.16em] ring-1",
                          statusStyles[influencer.status],
                        )}
                      >
                        <StatusIcon size={12} />
                        {influencer.status}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {(connectedPlatforms.length > 0 ? connectedPlatforms : influencer.platformAccounts.slice(0, 2)).map((account) => {
                          const PlatformIcon = platformIcons[account.platform];
                          const isConnected = account.connectionStatus === "CONNECTED";

                          return (
                            <span
                              key={account.id}
                              className={cn(
                                "inline-flex h-8 items-center gap-2 rounded-full px-3 text-[9px] font-bold ring-1",
                                isConnected
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                  : "bg-white text-stone-500 ring-stone-100",
                              )}
                            >
                              <PlatformIcon size={12} />
                              {account.platform.toLowerCase()}
                            </span>
                          );
                        })}
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                          {influencer.automationEnabled ? "Scheduled" : "Manual"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#1C1C1C]">
                          {formatNextPostAt(influencer.nextAutomatedPostAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8d5f9e]">
                          {influencer.posts.length} total
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-600">
                          {pendingPosts} pending
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/create-influencer?mode=update&id=${influencer.id}`}
                          className="inline-flex h-9 items-center rounded-full bg-white px-3 text-[9px] font-black uppercase tracking-[0.14em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-[#f7f1fb]"
                        >
                          Update
                        </Link>
                        <Link
                          href={`/influencers/${influencer.username}?review=1`}
                          className="inline-flex h-9 items-center rounded-full bg-[#1C1C1C] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#8d5f9e]"
                        >
                          Review
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="grid gap-6 lg:grid-cols-2">
            {influencers.map((influencer) => {
              const StatusIcon = getStatusIcon(influencer.status);
              const hasProfile = Boolean(influencer.profileImageUrl);
              const isReady = Boolean(influencer.bodyReferenceImageUrl || influencer.faceReferenceImageUrl || influencer.profileImageUrl);
              const hasBodyReference = Boolean(influencer.bodyReferenceImageUrl);
              const pendingPosts = influencer.posts.filter((post) => post.status === "GENERATED").length;
              const approvedPosts = influencer.posts.filter((post) => ["APPROVED", "PUBLISHED"].includes(post.status)).length;

              return (
                <article
                  key={influencer.id}
                  className="group overflow-hidden rounded-[34px] border border-white/80 bg-white/60 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/85 hover:shadow-purple-900/10"
                >
                  <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative min-h-[360px] overflow-hidden bg-[#f7f1fb]">
                      {influencer.bodyReferenceImageUrl || influencer.profileImageUrl ? (
                        <img
                          src={influencer.bodyReferenceImageUrl || influencer.profileImageUrl || ""}
                          alt={influencer.displayName}
                          className="h-full w-full object-cover object-top transition-transform duration-[1.5s] group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 text-[#8d5f9e]">
                          <div className="flex size-20 items-center justify-center rounded-3xl bg-white/70 shadow-xl shadow-purple-900/5">
                            <UserRound size={34} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#8d5f9e]/70">Image pending</p>
                        </div>
                      )}

                      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] ring-1",
                            statusStyles[influencer.status],
                          )}
                        >
                          <StatusIcon size={12} />
                          {influencer.status}
                        </span>
                        {influencer.isAiDisclosed && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white ring-1 ring-white/20 backdrop-blur-xl">
                            <Sparkles size={12} />
                            AI disclosed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col p-6 md:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d5f9e]">@{influencer.username}</p>
                          <h2 className="mt-3 font-serif text-5xl italic leading-[0.9] text-[#1C1C1C]">{influencer.displayName}</h2>
                        </div>
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f1fb] text-[#8d5f9e] ring-1 ring-white">
                          {influencer.profileImageUrl ? (
                            <img src={influencer.profileImageUrl} alt={`${influencer.displayName} profile`} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-serif text-xl italic">{getInitials(influencer.displayName)}</span>
                          )}
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-stone-500">{influencer.bio || "Bio a definir."}</p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/65 p-4 ring-1 ring-stone-100">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Style</p>
                          <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">{influencer.fashionStyle || "A definir"}</p>
                        </div>
                        <div className="rounded-2xl bg-white/65 p-4 ring-1 ring-stone-100">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Audience</p>
                          <p className="mt-2 text-sm font-semibold text-[#1C1C1C]">{influencer.targetAudience || "A definir"}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {influencer.preferredCategories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]"
                          >
                            {category}
                          </span>
                        ))}
                      </div>

                      <InfluencerStatusActions
                        currentStatus={influencer.status}
                        influencerId={influencer.id}
                        isReady={isReady}
                      />

                      <InfluencerAutomationForm
                        automationEnabled={influencer.automationEnabled}
                        influencerId={influencer.id}
                        lastAutomatedPostAt={influencer.lastAutomatedPostAt?.toISOString() || null}
                        nextAutomatedPostAt={influencer.nextAutomatedPostAt?.toISOString() || null}
                        postingFrequency={influencer.postingFrequency}
                        preferredPostTime={influencer.preferredPostTime}
                      />

                      <div className="mt-4 rounded-3xl border border-[#C9A0CD]/20 bg-[#f7f1fb]/70 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
                              Next post at
                            </p>
                            <p className="mt-2 text-sm font-bold text-[#1C1C1C]">
                              {formatNextPostAt(influencer.nextAutomatedPostAt)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] ring-1",
                              influencer.automationEnabled
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                : "bg-white text-stone-400 ring-stone-100",
                            )}
                          >
                            {influencer.automationEnabled ? "Auto on" : "Manual"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 text-sm text-stone-500 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <Mail size={15} className="text-[#8d5f9e]" />
                          <span className="truncate">{influencer.emailAlias || "No alias"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Camera size={15} className={hasProfile ? "text-[#8d5f9e]" : "text-stone-300"} />
                          <span>{hasProfile ? "Profile ready" : "Profile missing"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ImageIcon size={15} className={hasBodyReference ? "text-[#8d5f9e]" : "text-stone-300"} />
                          <span>{hasBodyReference ? "Body reference ready" : "Body reference missing"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CalendarClock size={15} className="text-[#8d5f9e]" />
                          <span>{influencer.posts.length} posts</span>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-stone-100 pt-5">
                        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Platforms</p>
                        <div className="flex flex-wrap gap-2">
                          {influencer.platformAccounts.map((account) => {
                            const PlatformIcon = platformIcons[account.platform];
                            const isConnected = account.connectionStatus === "CONNECTED";

                            return (
                              <span
                                key={account.id}
                                title={account.errorMessage || account.metaPageName || undefined}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold ring-1",
                                  isConnected
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                    : account.connectionStatus === "ERROR"
                                      ? "bg-red-50 text-red-500 ring-red-100"
                                      : "bg-white text-stone-500 ring-stone-100",
                                )}
                              >
                                <PlatformIcon size={13} className={isConnected ? "text-emerald-600" : "text-[#8d5f9e]"} />
                                @{account.handle}
                                {account.platform === "INSTAGRAM" && (
                                  <span className="text-[8px] uppercase tracking-[0.16em] opacity-70">
                                    {account.connectionStatus.toLowerCase().replace("_", " ")}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-6 space-y-5 border-t border-stone-100 pt-5">
                        <div>
                          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Social network</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Link
                              href={`/api/meta/instagram/connect?influencerId=${influencer.id}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#f7f1fb] px-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-white"
                            >
                              Connect
                              <Camera size={13} />
                            </Link>
                            <Link
                              href={`/api/meta/instagram-login/connect?influencerId=${influencer.id}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-white"
                            >
                              Enable publishing
                              <Camera size={13} />
                            </Link>
                          </div>
                        </div>

                        <div>
                          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Content</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Link
                              href={`/admin/create-influencer?mode=update&id=${influencer.id}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-[#f7f1fb]"
                            >
                              Update agent
                            </Link>
                            <Link
                              href={`/influencers/${influencer.username}?review=1`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1C1C1C] px-4 text-[9px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e]"
                            >
                              Review posts
                              <ArrowUpRight size={13} />
                            </Link>
                            <Link
                              href={`/influencers/${influencer.username}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e] sm:col-span-2"
                            >
                              Public page
                            </Link>
                          </div>
                        </div>

                        <div>
                          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Status</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex h-9 items-center rounded-full bg-[#f7f1fb] px-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#8d5f9e]">
                              {pendingPosts} not verified
                            </span>
                            <span className="inline-flex h-9 items-center rounded-full bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                              {approvedPosts} public
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            </section>
          )
        ) : (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-[#f7f1fb] text-[#8d5f9e]">
              <UserRound size={32} />
            </div>
            <h2 className="font-serif text-4xl italic text-[#1C1C1C]">No agents yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-stone-500">
              Lance le script de seed pour creer les premiers influenceurs virtuels VioletBeam.
            </p>
            <code className="mt-6 rounded-full bg-[#1C1C1C] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              npm run seed:influencers
            </code>
          </section>
        )}

        <footer className="mt-16 border-t border-stone-100 py-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
          Agent studio / VioletBeam
        </footer>
      </div>
    </main>
  );
}
