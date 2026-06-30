"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, CalendarClock, CalendarDays, ExternalLink, ImageIcon, Shirt, Sparkles, Store, Tag, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { getDictionary, getLocaleFromPathname } from "@/lib/i18n";

export type InfluencerPostArticleView = {
  id: number;
  title: string;
  brand: string;
  image: string;
  price: number | string | null;
  shopUrl: string | null;
};

export type InfluencerPostView = {
  id: number;
  status: string;
  influencerName?: string;
  influencerUsername?: string;
  caption: string | null;
  hashtags: string[];
  generatedImageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostUrl: string | null;
  errorMessage: string | null;
  articles: InfluencerPostArticleView[];
};

type InfluencerPostsClientProps = {
  posts: InfluencerPostView[];
  isReviewMode: boolean;
  isAiDisclosed: boolean;
};

const postStatusStyles: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-500 ring-stone-200",
  GENERATED: "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/30",
  APPROVED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  SCHEDULED: "bg-sky-50 text-sky-600 ring-sky-100",
  PUBLISHED: "bg-[#1C1C1C] text-white ring-[#1C1C1C]",
  NEEDS_REVISION: "bg-amber-50 text-amber-600 ring-amber-100",
  FAILED: "bg-red-50 text-red-500 ring-red-100",
};

function formatPrice(price: number | string | null, fallback: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value);
}

function ArticleRow({
  article,
  compact = false,
  dictionary,
}: {
  article: InfluencerPostArticleView;
  compact?: boolean;
  dictionary: ReturnType<typeof getDictionary>;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-[20px] bg-white/75 p-2 ring-1 ring-stone-100",
        compact ? "grid-cols-[58px_minmax(0,1fr)]" : "grid-cols-[72px_minmax(0,1fr)]",
      )}
    >
      <div className={cn("aspect-square overflow-hidden bg-[#f7f1fb]", compact ? "rounded-[15px]" : "rounded-[18px]")}>
        {article.image ? (
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]">
            <Shirt size={compact ? 18 : 20} />
          </div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="mb-1.5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.16em] text-stone-500">
            <Tag size={10} />
            {formatPrice(article.price, dictionary.catalog.storeComingSoon)}
          </span>
        </div>
        <h3 className={cn("truncate font-serif italic leading-none text-[#1C1C1C]", compact ? "text-xl" : "text-2xl")}>{article.title}</h3>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">{article.brand}</p>
        {article.shopUrl ? (
          <a
            href={article.shopUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#1C1C1C] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8d5f9e]"
          >
            {dictionary.common.shop}
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
            <Store size={12} />
            {dictionary.catalog.storeComingSoon}
          </span>
        )}
      </div>
    </div>
  );
}

export default function InfluencerPostsClient({ posts, isReviewMode, isAiDisclosed }: InfluencerPostsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dictionary = getDictionary(getLocaleFromPathname(pathname));
  const [activePost, setActivePost] = useState<InfluencerPostView | null>(null);
  const [approvingPostId, setApprovingPostId] = useState<number | null>(null);
  const [schedulingPostId, setSchedulingPostId] = useState<number | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<number | null>(null);
  const [rejectingPostId, setRejectingPostId] = useState<number | null>(null);
  const [regeneratingPostId, setRegeneratingPostId] = useState<number | null>(null);
  const [regeneratingMode, setRegeneratingMode] = useState<"image" | "caption" | "all" | null>(null);
  const [scheduleValues, setScheduleValues] = useState<Record<number, string>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});

  async function approvePost(postId: number) {
    setApprovingPostId(postId);
    const response = await fetch(`/api/influencer-posts/${postId}/approve`, {
      method: "POST",
    });

    setApprovingPostId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  async function rejectPost(postId: number) {
    setRejectingPostId(postId);
    const response = await fetch(`/api/influencer-posts/${postId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: rejectReasons[postId],
      }),
    });

    setRejectingPostId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  async function regeneratePost(postId: number, mode: "image" | "caption" | "all") {
    setRegeneratingPostId(postId);
    setRegeneratingMode(mode);
    const response = await fetch(`/api/influencer-posts/${postId}/regenerate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
      }),
    });

    setRegeneratingPostId(null);
    setRegeneratingMode(null);

    if (response.ok) {
      router.refresh();
    }
  }

  async function publishPost(postId: number) {
    setActionErrors((current) => ({
      ...current,
      [postId]: "",
    }));
    setPublishingPostId(postId);
    const response = await fetch(`/api/influencer-posts/${postId}/publish-instagram`, {
      method: "POST",
    });

    setPublishingPostId(null);

    if (response.ok) {
      router.refresh();
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setActionErrors((current) => ({
      ...current,
      [postId]: payload?.error || "Publication Instagram impossible pour le moment.",
    }));
  }

  async function schedulePost(postId: number) {
    const scheduledAt = scheduleValues[postId];
    if (!scheduledAt) return;

    setSchedulingPostId(postId);
    const response = await fetch(`/api/influencer-posts/${postId}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scheduledAt,
      }),
    });

    setSchedulingPostId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => {
          const postImage = post.thumbnailUrl || post.generatedImageUrl;
          const visibleArticles = post.articles.slice(0, 3);
          const hiddenCount = Math.max(post.articles.length - visibleArticles.length, 0);

          return (
            <article
              key={post.id}
              className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/65 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f1fb]">
                {postImage ? (
                  <img src={postImage} alt={post.caption || "Influencer post"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#8d5f9e]">
                    <ImageIcon size={34} />
                  </div>
                )}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] ring-1",
                      postStatusStyles[post.status],
                    )}
                  >
                    {post.status}
                  </span>
                  {isAiDisclosed && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur-xl">
                      <Sparkles size={12} />
                      Virtual
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-[#8d5f9e]">
                  <CalendarDays size={13} />
                  <span>{new Date(post.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                {post.influencerUsername && (
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                    {post.influencerName || "VioletBeam Agent"} / @{post.influencerUsername}
                  </p>
                )}
                {post.scheduledAt && (
                  <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sky-600">
                    <CalendarClock size={13} />
                    <span>{new Date(post.scheduledAt).toLocaleString("fr-FR")}</span>
                  </div>
                )}
                {post.publishedAt && (
                  <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    <BadgeCheck size={13} />
                    <span>{new Date(post.publishedAt).toLocaleString("fr-FR")}</span>
                  </div>
                )}
                <p className="line-clamp-3 min-h-[72px] text-sm leading-6 text-stone-600">{post.caption || dictionary.product.detailsComingSoon}</p>
                {post.errorMessage && (
                  <p className="mt-3 rounded-[18px] bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700 ring-1 ring-amber-100">
                    {post.errorMessage}
                  </p>
                )}
                {actionErrors[post.id] && (
                  <p className="mt-3 rounded-[18px] bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600 ring-1 ring-red-100">
                    {actionErrors[post.id]}
                  </p>
                )}

                {post.hashtags.length > 0 && (
                  <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
                    {post.hashtags.slice(0, 5).map((hashtag) => (
                      <span key={hashtag} className="rounded-full bg-[#f7f1fb] px-2.5 py-1 text-[8px] font-bold text-[#8d5f9e]">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 space-y-2.5 border-t border-stone-100 pt-4">
                  {visibleArticles.map((article) => (
                    <ArticleRow key={`${post.id}-${article.id}`} article={article} compact dictionary={dictionary} />
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setActivePost(post)}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[8px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
                  >
                    {dictionary.common.seeArticle}
                    {hiddenCount > 0 ? `+${hiddenCount}` : ""}
                  </button>

                  {isReviewMode && post.status === "GENERATED" && (
                      <button
                        type="button"
                        onClick={() => approvePost(post.id)}
                        disabled={approvingPostId === post.id}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-[#8d5f9e] px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1C1C1C] disabled:opacity-60"
                      >
                        <BadgeCheck size={13} />
                        {approvingPostId === post.id ? "Approving" : "Approve"}
                      </button>
                  )}

                  {isReviewMode && post.status === "APPROVED" && (
                      <span className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-50 px-4 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-600">
                        <BadgeCheck size={13} />
                        Approved
                      </span>
                  )}

                  {isReviewMode && ["GENERATED", "APPROVED", "SCHEDULED"].includes(post.status) && (
                    <div className="flex w-full flex-wrap gap-2 rounded-[22px] bg-amber-50/70 p-2 ring-1 ring-amber-100">
                      <input
                        type="text"
                        value={rejectReasons[post.id] || ""}
                        onChange={(event) =>
                          setRejectReasons((current) => ({
                            ...current,
                            [post.id]: event.target.value,
                          }))
                        }
                        placeholder="Reason: image, caption, styling..."
                        className="h-9 min-w-[190px] flex-1 rounded-full border border-amber-100 bg-white px-3 text-[11px] font-semibold text-stone-600 outline-none transition-colors focus:border-amber-300"
                      />
                      <button
                        type="button"
                        onClick={() => rejectPost(post.id)}
                        disabled={rejectingPostId === post.id}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-amber-600 px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1C1C1C] disabled:opacity-60"
                      >
                        <XCircle size={13} />
                        {rejectingPostId === post.id ? "Rejecting" : "Needs revision"}
                      </button>
                    </div>
                  )}

                  {isReviewMode && post.status === "APPROVED" && (
                    <div className="flex w-full flex-wrap gap-2">
                      <input
                        type="datetime-local"
                        value={scheduleValues[post.id] || ""}
                        onChange={(event) =>
                          setScheduleValues((current) => ({
                            ...current,
                            [post.id]: event.target.value,
                          }))
                        }
                        className="h-9 min-w-[190px] flex-1 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-600 outline-none transition-colors focus:border-[#C9A0CD]"
                      />
                      <button
                        type="button"
                        onClick={() => schedulePost(post.id)}
                        disabled={!scheduleValues[post.id] || schedulingPostId === post.id}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-600 px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1C1C1C] disabled:opacity-60"
                      >
                        <CalendarClock size={13} />
                        {schedulingPostId === post.id ? "Scheduling" : "Schedule"}
                      </button>
                    </div>
                  )}

                  {isReviewMode && ["GENERATED", "APPROVED", "NEEDS_REVISION", "FAILED"].includes(post.status) && (
                    <div className="flex w-full flex-wrap gap-2 rounded-[22px] bg-[#f7f1fb]/70 p-2 ring-1 ring-[#C9A0CD]/20">
                      <span className="flex h-9 items-center px-2 text-[8px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                        Regenerate
                      </span>
                      {(["caption", "image", "all"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => regeneratePost(post.id, mode)}
                          disabled={regeneratingPostId === post.id}
                          className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[8px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:bg-[#1C1C1C] hover:text-white disabled:opacity-60"
                        >
                          {regeneratingPostId === post.id && regeneratingMode === mode ? "Working" : mode}
                        </button>
                      ))}
                    </div>
                  )}

                  {post.status === "SCHEDULED" && (
                    <>
                      <span className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-50 px-4 text-[8px] font-black uppercase tracking-[0.18em] text-sky-600">
                        <CalendarClock size={13} />
                        Scheduled
                      </span>
                      {isReviewMode && (
                        <button
                          type="button"
                          onClick={() => publishPost(post.id)}
                          disabled={publishingPostId === post.id}
                          className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1C1C1C] px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8d5f9e] disabled:opacity-60"
                        >
                          <BadgeCheck size={13} />
                          {publishingPostId === post.id ? "Publishing" : "Publish now"}
                        </button>
                      )}
                    </>
                  )}

                  {post.status === "PUBLISHED" && (
                    <span className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1C1C1C] px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white">
                      <BadgeCheck size={13} />
                      Published
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activePost && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#1C1C1C]/45 p-4 backdrop-blur-2xl">
          <button className="absolute inset-0 cursor-default" onClick={() => setActivePost(null)} aria-label={dictionary.cabine.close} />
          <section className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/80 bg-[#FDFBFF]/95 shadow-2xl shadow-purple-950/20 md:grid-cols-[0.95fr_1.05fr]">
            <button
              onClick={() => setActivePost(null)}
              className="absolute right-5 top-5 z-20 flex size-11 items-center justify-center rounded-full bg-white/85 text-[#1C1C1C] shadow-lg backdrop-blur-xl transition-colors hover:bg-white"
              aria-label={dictionary.cabine.close}
            >
              <X size={18} />
            </button>
            <div className="relative min-h-[360px] overflow-hidden bg-[#eee7f4] md:min-h-[680px]">
              <img src={activePost.thumbnailUrl || activePost.generatedImageUrl || ""} alt={activePost.caption || "Influencer post"} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1C1C1C]/55 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <span className={cn("inline-flex rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] ring-1", postStatusStyles[activePost.status])}>
                  {activePost.status}
                </span>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white">{activePost.caption || dictionary.product.detailsComingSoon}</p>
                {activePost.errorMessage && (
                  <p className="mt-4 max-w-2xl rounded-2xl bg-amber-50/95 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                    {activePost.errorMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto p-6 md:p-10">
              <header className="mb-8 pr-12">
                <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8d5f9e]">
                  <CalendarDays size={14} />
                <span>{new Date(activePost.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              {activePost.scheduledAt && (
                <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">
                  <CalendarClock size={14} />
                  <span>Scheduled {new Date(activePost.scheduledAt).toLocaleString("fr-FR")}</span>
                </div>
              )}
              {activePost.publishedAt && (
                <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                  <BadgeCheck size={14} />
                  <span>Published {new Date(activePost.publishedAt).toLocaleString("fr-FR")}</span>
                </div>
              )}
                <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">{dictionary.lookbook.lookItems}</h2>
              </header>
              <div className="space-y-4">
                {activePost.articles.map((article) => (
                  <ArticleRow key={`modal-${activePost.id}-${article.id}`} article={article} dictionary={dictionary} />
                ))}
              </div>
              {activePost.generatedImageUrl && (
                <a
                  href={activePost.generatedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8d5f9e]"
                >
                  {dictionary.lookbook.openImage}
                  <ExternalLink size={12} />
                </a>
              )}
              {activePost.externalPostUrl && (
                <a
                  href={activePost.externalPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
                >
                  Social post
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
