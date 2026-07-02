export type PredictionLabel = "ALS" | "Control" | string;

export interface PredictionResponse {
  label: PredictionLabel;
  confidence: number; // 0..1
  probabilities: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  device: string;
}

export type ApiStatus = "checking" | "online" | "waking" | "offline";
