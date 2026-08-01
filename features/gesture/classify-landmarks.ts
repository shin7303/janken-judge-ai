import type { Gesture, ValidGesture } from "@/domain/types";

export type Landmark = { x: number; y: number };
export type LandmarkClassification = {
  gesture: Gesture;
  score: number;
  extendedFingers: number;
};

const fingers: ReadonlyArray<readonly [number, number]> = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
];

export function classifyLandmarks(
  landmarks: Landmark[],
): LandmarkClassification {
  if (landmarks.length < 21)
    return { gesture: "UNKNOWN", score: 0, extendedFingers: 0 };
  const palm = Math.max(Math.abs(landmarks[0].y - landmarks[9].y), 0.001);
  const extended = fingers.map(
    ([tip, pip]) => landmarks[tip].y < landmarks[pip].y - palm * 0.14,
  );
  const extendedFingers = extended.filter(Boolean).length;
  const gesture: Gesture =
    extendedFingers >= 4
      ? "PAPER"
      : extended[0] && extended[1] && !extended[2] && !extended[3]
        ? "SCISSORS"
        : extendedFingers <= 1
          ? "ROCK"
          : "UNKNOWN";
  const score =
    gesture === "PAPER"
      ? Math.min(0.9, 0.58 + extendedFingers * 0.08)
      : gesture === "SCISSORS"
        ? 0.76
        : gesture === "ROCK"
          ? Math.min(0.86, 0.66 + (4 - extendedFingers) * 0.05)
          : 0.35;
  return { gesture, score, extendedFingers };
}

export function normalizeMediaPipeGesture(
  name: string | undefined,
): ValidGesture | null {
  return name === "Closed_Fist"
    ? "ROCK"
    : name === "Open_Palm"
      ? "PAPER"
      : name === "Victory"
        ? "SCISSORS"
        : null;
}

export function blendGesture(
  modelName: string | undefined,
  modelScore: number,
  landmarks: Landmark[],
): LandmarkClassification {
  const fallback = classifyLandmarks(landmarks);
  const modelGesture = normalizeMediaPipeGesture(modelName);
  if (!modelGesture) return fallback;
  if (modelGesture === fallback.gesture)
    return {
      ...fallback,
      gesture: modelGesture,
      score: Math.min(0.99, (modelScore + fallback.score) / 2 + 0.12),
    };
  return modelScore >= 0.82
    ? {
        gesture: modelGesture,
        score: modelScore,
        extendedFingers: fallback.extendedFingers,
      }
    : fallback;
}
