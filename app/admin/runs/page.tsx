import Link from "next/link";
import { ArrowLeft, Bot, Clock3, Sparkles } from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "Not finished";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function statusClassName(status: string) {
  if (status === "SUCCESS") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "FAILED") return "bg-red-50 text-red-500 ring-red-100";
  if (status === "PARTIAL") return "bg-amber-50 text-amber-600 ring-amber-100";
  return "bg-[#f7f1fb] text-[#8d5f9e] ring-[#C9A0CD]/20";
}

export default async function AdminRunsPage() {
  await requireAdmin();

  const runs = await prisma.automationRun.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
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

  const successCount = runs.filter((run) => run.status === "SUCCESS").length;
  const failedCount = runs.filter((run) => run.status === "FAILED").length;
  const publishedCount = runs.reduce((total, run) => total + run.published, 0);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <Link
              href="/admin/influencers"
              className="mb-6 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-100 transition-colors hover:text-[#8d5f9e]"
            >
              <ArrowLeft size={13} />
              Agent studio
            </Link>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              Automation audit
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Recent <br />
              Runs
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Suivi des executions autonomes, des dry-runs, des publications et des erreurs Instagram.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Runs</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{runs.length}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Success</p>
              <p className="mt-3 font-serif text-5xl italic text-emerald-600">{successCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Published</p>
              <p className="mt-3 font-serif text-5xl italic text-[#8d5f9e]">{publishedCount}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Failed</p>
              <p className="mt-3 font-serif text-5xl italic text-[#1C1C1C]">{failedCount}</p>
            </div>
          </div>
        </header>

        {runs.length > 0 ? (
          <section className="space-y-4">
            {runs.map((run) => (
              <article
                key={run.id}
                className="rounded-[32px] border border-white/80 bg-white/65 p-5 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] ring-1",
                          statusClassName(run.status),
                        )}
                      >
                        {run.status.toLowerCase()}
                      </span>
                      {run.dryRun && (
                        <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400 ring-1 ring-stone-100">
                          dry run
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                        <Bot size={13} className="text-[#8d5f9e]" />
                        {run.influencerName || "All agents"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-black text-[#1C1C1C]">
                      {run.message || run.errorMessage || `${run.type} run`}
                    </h2>

                    {run.errorMessage && (
                      <p className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 ring-1 ring-red-100">
                        {run.errorMessage}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-stone-500">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={13} className="text-[#8d5f9e]" />
                        Started {formatDate(run.startedAt || run.createdAt)}
                      </span>
                      <span>Finished {formatDate(run.finishedAt)}</span>
                      {run.postId && <span>Post #{run.postId}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[520px]">
                    {[
                      ["checked", run.checked],
                      ["generated", run.generated],
                      ["published", run.published],
                      ["skipped", run.skipped],
                      ["failed", run.failed],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-[#FDFBFF] p-3 text-center ring-1 ring-stone-100">
                        <p className="font-serif text-3xl italic leading-none text-[#1C1C1C]">{value}</p>
                        <p className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="flex min-h-[360px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-[#f7f1fb] text-[#8d5f9e]">
              <Bot size={32} />
            </div>
            <h2 className="font-serif text-4xl italic text-[#1C1C1C]">No runs yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-stone-500">
              Les executions autonomes apparaitront ici apres le prochain cron.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
