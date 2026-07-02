"use client";

import type { PredictionResponse } from "@/lib/types";

interface ResultCardProps {
  result: PredictionResponse;
}

function labelTone(label: string): {
  badgeBg: string;
  badgeText: string;
  barFill: string;
  ring: string;
} {
  const normalized = label.toLowerCase();
  if (normalized === "control") {
    return {
      badgeBg: "bg-teal/10",
      badgeText: "text-teal",
      barFill: "bg-teal",
      ring: "ring-teal/30",
    };
  }
  if (normalized === "als") {
    return {
      badgeBg: "bg-amber-light",
      badgeText: "text-amber",
      barFill: "bg-amber",
      ring: "ring-amber/30",
    };
  }
  return {
    badgeBg: "bg-navy/5",
    badgeText: "text-navy",
    barFill: "bg-navy/60",
    ring: "ring-navy/20",
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const tone = labelTone(result.label);
  const confidencePct = Math.round(result.confidence * 1000) / 10;

  const rows = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="animate-fade-in rounded-2xl border border-navy/10 bg-white p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-navy/40">
        Classification result
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-2xl font-display font-semibold ${tone.badgeBg} ${tone.badgeText} ring-1 ${tone.ring}`}
          >
            {result.label}
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-semibold text-navy leading-none">
            {confidencePct.toFixed(1)}
            <span className="text-lg text-navy/40">%</span>
          </p>
          <p className="text-xs text-navy/40 mt-1">confidence</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-navy/40">
          Class probabilities
        </p>
        {rows.map(([className, prob]) => {
          const rowTone = labelTone(className);
          const pct = Math.round(prob * 1000) / 10;
          return (
            <div key={className}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium text-navy">{className}</span>
                <span className="font-mono text-navy/60">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy/5">
                <div
                  className={`h-full rounded-full ${rowTone.barFill} transition-[width] duration-700 ease-out`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
