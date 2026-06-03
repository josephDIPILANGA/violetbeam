"use client";

import { useState } from "react";
import { CalendarClock, Eye, Sparkles, WandSparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type WeeklyPlanItem = {
  influencerId: number;
  displayName: string;
  username: string;
  status: string;
  format: string;
  postIndex: number;
  categories: string[];
  recentFormats: string[];
};

type WeeklyPlanResponse = {
  ok: boolean;
  postsPerInfluencer: number;
  includeDrafts: boolean;
  influencerCount: number;
  postCount: number;
  plan: WeeklyPlanItem[];
};

type WeeklyGenerationResponse = {
  ok: boolean;
  includeDrafts: boolean;
  influencerCount: number;
  createdCount: number;
  failedCount: number;
  results: Array<{
    ok: boolean;
    influencerId: number;
    displayName: string;
    username: string;
    status: string;
    format: string;
    error?: string;
  }>;
};

export default function WeeklyPlanPreview() {
  const [postsPerInfluencer, setPostsPerInfluencer] = useState(3);
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmGeneration, setConfirmGeneration] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const [generationResult, setGenerationResult] = useState<WeeklyGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function previewPlan() {
    setIsLoading(true);
    setError(null);
    setGenerationResult(null);

    const response = await fetch("/api/virtual-influencers/weekly-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postsPerInfluencer,
        includeDrafts,
      }),
    });

    setIsLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Unable to preview weekly plan.");
      return;
    }

    setPlan((await response.json()) as WeeklyPlanResponse);
    setConfirmGeneration(false);
  }

  async function generateBatch() {
    if (!plan || plan.postsPerInfluencer !== 1 || !confirmGeneration) return;

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    const response = await fetch("/api/virtual-influencers/generate-weekly-batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        includeDrafts: plan.includeDrafts,
        confirmed: true,
      }),
    });

    setIsGenerating(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Unable to generate weekly batch.");
      return;
    }

    setGenerationResult((await response.json()) as WeeklyGenerationResponse);
  }

  return (
    <section className="mb-10 overflow-hidden rounded-[32px] border border-white/80 bg-white/55 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Weekly production</p>
            <p className="mt-1 text-sm font-semibold text-stone-600">
              Preview the next batch before generating real influencer posts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100">
            Posts
            <select
              value={postsPerInfluencer}
              onChange={(event) => setPostsPerInfluencer(Number(event.target.value))}
              className="bg-transparent text-[#8d5f9e] outline-none"
            >
              {[1, 2, 3, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100">
            <input
              type="checkbox"
              checked={includeDrafts}
              onChange={(event) => setIncludeDrafts(event.target.checked)}
              className="size-3 accent-[#8d5f9e]"
            />
            Include drafts
          </label>

          <button
            type="button"
            onClick={previewPlan}
            disabled={isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8d5f9e] disabled:opacity-60"
          >
            <Eye size={14} />
            {isLoading ? "Preparing" : "Preview weekly plan"}
          </button>
        </div>
      </div>

      {error && <p className="border-t border-stone-100 px-5 py-4 text-sm font-semibold text-red-500">{error}</p>}

          {plan && (
        <div className="border-t border-stone-100 p-5">
          <div className="mb-5 rounded-[24px] bg-[#1C1C1C] p-4 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">Real generation</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/80">
                  This will generate real images through OpenAI and upload them to Cloudinary. For now, real batch generation is limited to 1 post per agent.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                  <input
                    type="checkbox"
                    checked={confirmGeneration}
                    onChange={(event) => setConfirmGeneration(event.target.checked)}
                    className="size-3 accent-[#C9A0CD]"
                  />
                  Confirm cost
                </label>
                <button
                  type="button"
                  onClick={generateBatch}
                  disabled={
                    isGenerating ||
                    !confirmGeneration ||
                    plan.postsPerInfluencer !== 1 ||
                    plan.postCount === 0
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-[#1C1C1C] transition-colors hover:bg-[#f7f1fb] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <WandSparkles size={14} />
                  {isGenerating ? "Generating" : "Generate weekly batch"}
                </button>
              </div>
            </div>
            {plan.postsPerInfluencer !== 1 && (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold leading-5 text-white/70">
                Switch Posts to 1 before using real generation. You can still preview larger plans safely.
              </p>
            )}
          </div>

          {generationResult && (
            <div className="mb-5 rounded-[24px] bg-white/70 p-4 ring-1 ring-stone-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Generation report</p>
                  <p className="mt-2 text-sm font-semibold text-stone-600">
                    {generationResult.createdCount} created, {generationResult.failedCount} failed, {generationResult.influencerCount} agents processed.
                  </p>
                </div>
                <a
                  href="/admin/influencer-posts?status=GENERATED"
                  className="inline-flex h-10 items-center rounded-full bg-[#8d5f9e] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1C1C1C]"
                >
                  Open review queue
                </a>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {generationResult.results.map((result) => (
                  <div
                    key={`${result.influencerId}-${result.format}`}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-xs font-semibold leading-5 ring-1",
                      result.ok
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-red-50 text-red-600 ring-red-100",
                    )}
                  >
                    @{result.username} / {result.format}: {result.ok ? "created" : result.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-white/70 p-4 ring-1 ring-stone-100">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Agents</p>
              <p className="mt-2 font-serif text-4xl italic text-[#1C1C1C]">{plan.influencerCount}</p>
            </div>
            <div className="rounded-[22px] bg-white/70 p-4 ring-1 ring-stone-100">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Posts planned</p>
              <p className="mt-2 font-serif text-4xl italic text-[#8d5f9e]">{plan.postCount}</p>
            </div>
            <div className="rounded-[22px] bg-white/70 p-4 ring-1 ring-stone-100">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Mode</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                {plan.includeDrafts ? "Active + drafts" : "Active only"}
              </p>
            </div>
          </div>

          {plan.plan.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {plan.plan.map((item) => (
                <article
                  key={`${item.influencerId}-${item.postIndex}-${item.format}`}
                  className="rounded-[24px] bg-white/70 p-4 ring-1 ring-stone-100"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5f9e]">
                      @{item.username}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]",
                        item.status === "ACTIVE" ? "bg-[#f7f1fb] text-[#8d5f9e]" : "bg-stone-100 text-stone-500",
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl italic leading-none text-[#1C1C1C]">{item.displayName}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1C1C] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white">
                      <Sparkles size={11} />
                      {item.format}
                    </span>
                    <span className="rounded-full bg-[#f7f1fb] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-[#8d5f9e]">
                      Post {item.postIndex}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-xs font-semibold leading-5 text-stone-500">
                    Categories: {item.categories.join(", ") || "all categories"}
                  </p>
                  <p className="mt-2 line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Recent: {item.recentFormats.join(", ") || "none"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-[28px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
              <p className="max-w-md text-sm font-semibold leading-7 text-stone-500">
                No ready active agents found. Activate at least one agent with a reference image, or enable drafts in the preview.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
