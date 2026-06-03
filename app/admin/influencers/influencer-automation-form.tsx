"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, Clock3, Play, Save } from "lucide-react";

import { cn } from "@/lib/utils";

const frequencyOptions = [
  { value: "DAILY", label: "Daily" },
  { value: "THREE_TIMES_WEEKLY", label: "3x weekly" },
  { value: "WEEKLY", label: "Weekly" },
];

function formatDate(value: string | null) {
  if (!value) return "Not planned";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InfluencerAutomationForm({
  automationEnabled,
  influencerId,
  lastAutomatedPostAt,
  nextAutomatedPostAt,
  postingFrequency,
  preferredPostTime,
}: {
  automationEnabled: boolean;
  influencerId: number;
  lastAutomatedPostAt: string | null;
  nextAutomatedPostAt: string | null;
  postingFrequency: string | null;
  preferredPostTime: string | null;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(automationEnabled);
  const [frequency, setFrequency] = useState(postingFrequency || "DAILY");
  const [postTime, setPostTime] = useState(preferredPostTime || "18:00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateAutomation({
    nextEnabled,
    nextFrequency = frequency,
    nextPostTime = postTime,
    successMessage,
  }: {
    nextEnabled: boolean;
    nextFrequency?: string;
    nextPostTime?: string;
    successMessage: string;
  }) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const response = await fetch(`/api/virtual-influencers/${influencerId}/automation`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          automationEnabled: nextEnabled,
          postingFrequency: nextFrequency,
          preferredPostTime: nextPostTime,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Impossible de sauvegarder l'automatisation.");
        return;
      }

      setEnabled(Boolean(data?.influencer?.automationEnabled));
      setSuccess(successMessage);
      router.refresh();
    });
  }

  function handleFrequencyChange(nextFrequency: string) {
    setFrequency(nextFrequency);

    if (enabled) {
      setEnabled(false);
      updateAutomation({
        nextEnabled: false,
        nextFrequency,
        successMessage: "Autonomy stopped. Click Autonomy to restart with the new settings.",
      });
      return;
    }

    setSuccess("");
  }

  function handlePostTimeChange(nextPostTime: string) {
    setPostTime(nextPostTime);

    if (enabled) {
      setEnabled(false);
      updateAutomation({
        nextEnabled: false,
        nextPostTime,
        successMessage: "Autonomy stopped. Click Autonomy to restart with the new settings.",
      });
      return;
    }

    setSuccess("");
  }

  function runNow() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const response = await fetch(`/api/virtual-influencers/${influencerId}/automation/run-now`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Impossible de lancer l'autonomie maintenant.");
        return;
      }

      setSuccess("Agent is due now. The next cron run can publish.");
      router.refresh();
    });
  }

  return (
    <section className="mt-6 rounded-[24px] border border-[#C9A0CD]/25 bg-[#f7f1fb]/55 p-4 ring-1 ring-white/60">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#8d5f9e] shadow-lg shadow-purple-900/5">
            <Bot size={17} />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Autonomy</p>
            <p className="text-xs font-semibold text-stone-600">Posting frequency</p>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] ring-1",
            enabled
              ? "bg-[#8d5f9e] text-white ring-[#8d5f9e]"
              : "bg-white text-stone-400 ring-stone-100",
          )}
        >
          {enabled ? "Auto on" : "Auto off"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_0.75fr]">
        <label className="space-y-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">Frequency</span>
          <select
            value={frequency}
            onChange={(event) => handleFrequencyChange(event.target.value)}
            className="h-11 w-full rounded-full border border-white bg-white px-4 text-xs font-bold text-[#1C1C1C] outline-none ring-1 ring-stone-100 transition focus:ring-[#C9A0CD]/60"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">Time</span>
          <input
            type="time"
            value={postTime}
            onChange={(event) => handlePostTimeChange(event.target.value)}
            className="h-11 w-full rounded-full border border-white bg-white px-4 text-xs font-bold text-[#1C1C1C] outline-none ring-1 ring-stone-100 transition focus:ring-[#C9A0CD]/60"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2 text-[11px] font-semibold text-stone-500">
        <p className="flex items-center gap-2">
          <Clock3 size={13} className="text-[#8d5f9e]" />
          Next: {formatDate(nextAutomatedPostAt)}
        </p>
        <p className="pl-5">Last: {formatDate(lastAutomatedPostAt)}</p>
      </div>

      {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
      {success && <p className="mt-3 text-xs font-semibold text-emerald-600">{success}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            updateAutomation({
              nextEnabled: !enabled,
              successMessage: enabled ? "Autonomy stopped." : "Autonomy started.",
            })
          }
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8d5f9e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={12} />
          {isPending ? "Saving" : enabled ? "Stop autonomy" : "Autonomy"}
        </button>

        {enabled && (
          <button
            type="button"
            onClick={runNow}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d5f9e] ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-[#f7f1fb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play size={12} />
            Run now
          </button>
        )}
      </div>
    </section>
  );
}
