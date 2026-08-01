import { ROUND_CONFIG } from "@/domain/round-config";
import type { Gesture, PlayerId } from "@/domain/types";

export type SetupHand = {
  player: PlayerId;
  gesture: Gesture;
  score: number;
  assignmentConfidence?: number;
  crossed?: boolean;
};

export type SetupReadinessInput = {
  cameraAndModelReady: boolean;
  hands: readonly SetupHand[];
  inferenceFps: number;
  tabActive: boolean;
};

export type SetupReadiness = {
  ready: boolean;
  checks: {
    cameraAndModel: boolean;
    playerRegions: boolean;
    gestureConfidence: boolean;
    inferencePerformance: boolean;
    activeTab: boolean;
  };
};

export function evaluateSetupReadiness(
  input: SetupReadinessInput,
): SetupReadiness {
  const playerA = input.hands.filter((hand) => hand.player === "PLAYER_A");
  const playerB = input.hands.filter((hand) => hand.player === "PLAYER_B");
  const playerRegions =
    input.hands.length === 2 &&
    playerA.length === 1 &&
    playerB.length === 1 &&
    input.hands.every(
      (hand) =>
        !hand.crossed &&
        (hand.assignmentConfidence ?? 1) >=
          ROUND_CONFIG.minAssignmentConfidence,
    );
  const gestureConfidence =
    playerRegions &&
    input.hands.every(
      (hand) =>
        hand.gesture !== "UNKNOWN" &&
        hand.score >= ROUND_CONFIG.minGestureScore,
    );
  const checks = {
    cameraAndModel: input.cameraAndModelReady,
    playerRegions,
    gestureConfidence,
    inferencePerformance:
      input.cameraAndModelReady &&
      input.inferenceFps >= ROUND_CONFIG.minimumInferenceFps,
    activeTab: input.tabActive,
  };

  return { ready: Object.values(checks).every(Boolean), checks };
}
