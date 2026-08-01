import { describe, expect, it } from "vitest";
import { evaluateSetupReadiness } from "@/features/setup/evaluate-readiness";

const readyInput = {
  cameraAndModelReady: true,
  hands: [
    { player: "PLAYER_A", gesture: "ROCK", score: 0.9 },
    { player: "PLAYER_B", gesture: "SCISSORS", score: 0.88 },
  ],
  inferenceFps: 15,
  tabActive: true,
} as const;

describe("evaluateSetupReadiness", () => {
  it("accepts two confident hands in separate player regions", () => {
    expect(evaluateSetupReadiness(readyInput)).toEqual({
      ready: true,
      checks: {
        cameraAndModel: true,
        playerRegions: true,
        gestureConfidence: true,
        inferencePerformance: true,
        activeTab: true,
      },
    });
  });

  it("does not claim readiness when both hands map to one region", () => {
    const result = evaluateSetupReadiness({
      ...readyInput,
      hands: readyInput.hands.map((hand) => ({
        ...hand,
        player: "PLAYER_A" as const,
      })),
    });

    expect(result.ready).toBe(false);
    expect(result.checks.playerRegions).toBe(false);
    expect(result.checks.gestureConfidence).toBe(false);
  });

  it("does not claim readiness after a crossing is detected", () => {
    const result = evaluateSetupReadiness({
      ...readyInput,
      hands: readyInput.hands.map((hand) => ({
        ...hand,
        crossed: true,
        assignmentConfidence: 0,
      })),
    });

    expect(result.ready).toBe(false);
    expect(result.checks.playerRegions).toBe(false);
  });

  it("keeps the round unavailable for low FPS, confidence, or a hidden tab", () => {
    const result = evaluateSetupReadiness({
      ...readyInput,
      inferenceFps: 9,
      tabActive: false,
      hands: [readyInput.hands[0], { ...readyInput.hands[1], score: 0.5 }],
    });

    expect(result.ready).toBe(false);
    expect(result.checks.gestureConfidence).toBe(false);
    expect(result.checks.inferencePerformance).toBe(false);
    expect(result.checks.activeTab).toBe(false);
  });
});
