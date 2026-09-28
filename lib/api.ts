import type { HealthResponse, PredictionResponse } from "./types";

export const API_BASE_URL = "https://hrus-api-jl4f.onrender.com";

export const ACCEPTED_MIME_TYPES = [
  "image/tiff",
  "image/png",
  "image/jpeg",
  "image/bmp",
];

export const ACCEPTED_EXTENSIONS = [".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp"];

export class ApiError extends Error {
  kind: "timeout" | "network" | "server" | "validation";
  constructor(message: string, kind: ApiError["kind"]) {
    super(message);
    this.kind = kind;
    this.name = "ApiError";
  }
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "The request timed out. The server may be slow to respond.",
        "timeout"
      );
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      "network"
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Quick health probe. Intended to be fast (short timeout) so it doesn't
 * block the UI while the render.com free-tier instance is asleep.
 */
export async function checkHealth(timeoutMs = 6000): Promise<HealthResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/health`,
    { method: "GET" },
    timeoutMs
  );
  if (!res.ok) {
    throw new ApiError(`Health check failed (${res.status}).`, "server");
  }
  return res.json();
}

/**
 * Sends the image file to the /predict endpoint. Uses a long timeout to
 * accommodate the free-tier backend "waking up" (cold start) which can
 * take 30-60 seconds.
 */
export async function predictImage(
  file: File,
  timeoutMs = 90000
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${API_BASE_URL}/predict`,
      { method: "POST", body: formData },
      timeoutMs
    );
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Could not reach the server. Please try again.", "network");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.detail ?? "";
    } catch {
      // ignore parse failure
    }
    if (res.status === 422 || res.status === 400) {
      throw new ApiError(
        detail || "The file could not be processed. Please check the format and try again.",
        "validation"
      );
    }
    throw new ApiError(
      detail || `The server returned an error (${res.status}). Please try again shortly.`,
      "server"
    );
  }

  return res.json();
}

export function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const hasAcceptedExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasAcceptedMime = file.type ? ACCEPTED_MIME_TYPES.includes(file.type) : false;
  // Some browsers report empty/incorrect MIME types for .tif files, so
  // fall back to extension matching if the MIME type is unhelpful.
  return hasAcceptedMime || hasAcceptedExt;
}
