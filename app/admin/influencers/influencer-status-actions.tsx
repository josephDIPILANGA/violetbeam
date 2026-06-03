"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, BadgeCheck, CircleDashed, Pause } from "lucide-react";

import { cn } from "@/lib/utils";

type InfluencerStatusActionsProps = {
  influencerId: number;
  currentStatus: string;
  isReady: boolean;
};

const actionConfig = {
  ACTIVE: {
    label: "Activate",
    icon: BadgeCheck,
    className: "bg-[#8d5f9e] text-white hover:bg-[#1C1C1C]",
  },
  PAUSED: {
    label: "Pause",
    icon: Pause,
    className: "bg-amber-50 text-amber-600 ring-1 ring-amber-100 hover:bg-amber-100",
  },
  DRAFT: {
    label: "Draft",
    icon: CircleDashed,
    className: "bg-white text-stone-500 ring-1 ring-stone-100 hover:text-[#8d5f9e]",
  },
  ARCHIVED: {
    label: "Archive",
    icon: Archive,
    className: "bg-stone-100 text-stone-500 ring-1 ring-stone-200 hover:bg-stone-200",
  },
};

export default function InfluencerStatusActions({
  influencerId,
  currentStatus,
  isReady,
}: InfluencerStatusActionsProps) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: keyof typeof actionConfig) {
    setError(null);
    setPendingStatus(status);

    const response = await fetch(`/api/virtual-influencers/${influencerId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Status update failed.");
      setPendingStatus(null);
      return;
    }

    setPendingStatus(null);
    router.refresh();
  }

  const actions: Array<keyof typeof actionConfig> = ["ACTIVE", "PAUSED", "DRAFT", "ARCHIVED"];

  return (
    <div className="mt-5 rounded-[24px] bg-white/65 p-3 ring-1 ring-stone-100">
      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Agent status</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((status) => {
          const config = actionConfig[status];
          const Icon = config.icon;
          const isCurrent = currentStatus === status;
          const isDisabled = pendingStatus !== null || isCurrent || (status === "ACTIVE" && !isReady);

          return (
            <button
              key={status}
              type="button"
              onClick={() => updateStatus(status)}
              disabled={isDisabled}
              title={status === "ACTIVE" && !isReady ? "Reference image required before activation" : config.label}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-3 text-[8px] font-black uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                config.className,
                isCurrent && "ring-2 ring-[#C9A0CD]/50",
              )}
            >
              <Icon size={12} />
              {pendingStatus === status ? "Saving" : config.label}
            </button>
          );
        })}
      </div>
      {!isReady && (
        <p className="mt-3 text-[10px] font-semibold leading-5 text-amber-700">
          Add a reference image before activating this agent.
        </p>
      )}
      {error && <p className="mt-3 text-[10px] font-semibold leading-5 text-red-500">{error}</p>}
    </div>
  );
}
