export const ROUND_CONFIG = {
  readyStableMs: 500,
  countdownMs: 3000,
  prePonObservationMs: 800,
  postPonDeadlineMs: 1200,
  postCommitConfirmationMs: 200,
  gestureStableMs: 120,
  changedGestureStableMs: 150,
  minStableSamples: 3,
  minGestureScore: 0.65,
  reviewDelayMs: 200,
  likelyLateDelayMs: 350,
  minimumInferenceFps: 10,
  recommendedInferenceFps: 15,
} as const;
export type RoundConfig = typeof ROUND_CONFIG;
