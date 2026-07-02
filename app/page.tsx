"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import ResultCard from "@/components/ResultCard";
import StatusIndicator from "@/components/StatusIndicator";
import { ApiError, checkHealth, predictImage } from "@/lib/api";
import type { ApiStatus, PredictionResponse } from "@/lib/types";

const WAKING_MESSAGE_DELAY_MS = 4000;
const HEALTH_POLL_INTERVAL_MS = 45000;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [isPredicting, setIsPredicting] = useState(false);
  const [showWakingMessage, setShowWakingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const wakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Health polling -------------------------------------------------
  const pollHealth = useCallback(async () => {
    try {
      const health = await checkHealth();
      setApiStatus(health.status === "ok" ? "online" : "offline");
    } catch {
      setApiStatus((prev) => (prev === "checking" ? "offline" : prev));
    }
  }, []);

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, HEALTH_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollHealth]);

  // --- File selection / preview ---------------------------------------
  const handleFileChange = useCallback((next: File | null) => {
    setError(null);
    setResult(null);
    setFile(next);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleValidationError = useCallback((message: string) => {
    setError(message);
    setResult(null);
  }, []);

  // --- Predict ----------------------------------------------------------
  const handleAnalyze = useCallback(async () => {
    if (!file || isPredicting) return;

    setError(null);
    setResult(null);
    setIsPredicting(true);
    setShowWakingMessage(false);

    if (apiStatus !== "online") {
      wakingTimerRef.current = setTimeout(() => {
        setApiStatus("waking");
        setShowWakingMessage(true);
      }, WAKING_MESSAGE_DELAY_MS);
    }

    try {
      const prediction = await predictImage(file);
      setResult(prediction);
      setApiStatus("online");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.kind === "timeout") {
          setError(
            "The backend is taking longer than expected to respond. It may still be waking up \u2014 please try again in a moment."
          );
          setApiStatus("offline");
        } else if (err.kind === "network") {
          setError("Couldn't reach the server. Check your connection and try again.");
          setApiStatus("offline");
        } else if (err.kind === "validation") {
          setError(err.message);
        } else {
          setError(err.message || "The server ran into a problem. Please try again shortly.");
        }
      } else {
        setError("Something unexpected went wrong. Please try again.");
      }
    } finally {
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current);
      setShowWakingMessage(false);
      setIsPredicting(false);
    }
  }, [file, isPredicting, apiStatus]);

  const canAnalyze = Boolean(file) && !isPredicting;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-mint">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v6M12 15v6M4.2 7.8l5.2 3M14.6 13.2l5.2 3M19.8 7.8l-5.2 3M9.4 13.2l-5.2 3" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.4" />
              </svg>
            </div>
            <div>
              <p className="font-display text-[15px] font-semibold leading-tight text-navy">AlignUS</p>
              <p className="text-[11px] leading-tight text-navy/40">ALS Screening Assistant</p>
            </div>
          </div>
          <StatusIndicator status={apiStatus} />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <h1 className="font-display text-[28px] font-semibold leading-tight text-navy sm:text-[34px]">
            Image-based ALS / Control classification
          </h1>
          <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-navy/55">
            AlignUS analyzes tongue ultrasound (HRUS — High-Resolution UltraSonography) images to help distinguish ALS from healthy controls.
            Upload a scan and the model will return a predicted class with a
            confidence score. Supported formats: TIF, PNG, JPG, BMP.
          </p>
        </div>

        <section className="grid gap-6 sm:grid-cols-1">
          <UploadZone
            file={file}
            previewUrl={previewUrl}
            disabled={isPredicting}
            onFileChange={handleFileChange}
            onValidationError={handleValidationError}
          />

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`
                inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5
                font-display text-[15px] font-semibold transition-all duration-200
                ${
                  canAnalyze
                    ? "bg-teal text-white hover:bg-navy active:scale-[0.98] shadow-sm shadow-teal/20"
                    : "bg-navy/5 text-navy/30 cursor-not-allowed"
                }
              `}
            >
              {isPredicting ? (
                <>
                  <Spinner />
                  {showWakingMessage ? "Waking up backend\u2026" : "Analyzing\u2026"}
                </>
              ) : (
                <>Analyze image</>
              )}
            </button>

            {isPredicting && showWakingMessage && (
              <p className="text-xs text-navy/50 sm:max-w-[260px]">
                The free-tier backend was idle and is starting up. This can take up to
                60 seconds &mdash; hang tight.
              </p>
            )}
          </div>

          {isPredicting && !showWakingMessage && <PredictSkeleton />}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber-light/50 px-4 py-3.5 text-sm text-navy animate-fade-in"
            >
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {result && !isPredicting && <ResultCard result={result} />}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy/10 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
          <p className="text-xs leading-relaxed text-navy/40">
            <strong className="font-medium text-navy/55">Research prototype.</strong> This
            tool is provided for research and demonstration purposes only. It is not a
            validated diagnostic device and must not be used to make clinical decisions.
            Always consult a qualified healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function PredictSkeleton() {
  return (
    <div className="animate-fade-in rounded-2xl border border-navy/10 bg-white p-6 sm:p-8">
      <div className="h-3 w-32 rounded bg-navy/10" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-9 w-24 rounded-full bg-mint/70" />
        <div className="h-8 w-20 rounded bg-navy/10" />
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-2.5 w-full rounded-full bg-navy/5" />
        <div className="h-2.5 w-full rounded-full bg-navy/5" />
      </div>
    </div>
  );
}
