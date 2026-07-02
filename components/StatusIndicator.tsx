"use client";

import type { ApiStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ApiStatus,
  { label: string; dotClass: string; textClass: string; pulse?: boolean }
> = {
  checking: {
    label: "Checking status",
    dotClass: "bg-navy/30",
    textClass: "text-navy/50",
  },
  online: {
    label: "Model online",
    dotClass: "bg-teal",
    textClass: "text-navy/70",
  },
  waking: {
    label: "Waking up backend",
    dotClass: "bg-teal-light",
    textClass: "text-navy/70",
    pulse: true,
  },
  offline: {
    label: "Backend unreachable",
    dotClass: "bg-navy/40",
    textClass: "text-navy/50",
  },
};

export default function StatusIndicator({ status }: { status: ApiStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white/80 px-3 py-1.5 text-xs font-medium">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${config.dotClass}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClass}`} />
      </span>
      <span className={config.textClass}>{config.label}</span>
    </div>
  );
}
