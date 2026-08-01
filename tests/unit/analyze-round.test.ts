import { judgeWinner } from "@/domain/gesture";
import { analyzeRound } from "@/features/round/analyze-round";
import type { FrameObservation, Gesture, PlayerId } from "@/domain/types";
import { describe, expect, it } from "vitest";

function run(
  playerId: PlayerId,
  gesture: Gesture,
  start: number,
  score = 0.9,
): FrameObservation[] {
  return [0, 80, 160].map((offset) => ({
    timestampMs: start + offset,
    playerId,
    gesture,
    gestureScore: score,
    handVisible: true,
    assignmentConfidence: 1,
  }));
}

describe("judgeWinner", () => {
  it.each([
    ["ROCK", "SCISSORS", "PLAYER_A"],
    ["PAPER", "SCISSORS", "PLAYER_B"],
    ["ROCK", "ROCK", "DRAW"],
    ["UNKNOWN", "ROCK", "UNDECIDED"],
  ] as const)("judges %s vs %s", (a, b, expected) =>
    expect(judgeWinner(a, b)).toBe(expected),
  );
});

describe("analyzeRound", () => {
  it("marks simultaneous stable hands as clear", () => {
    const result = analyzeRound(
      [...run("PLAYER_A", "ROCK", 0), ...run("PLAYER_B", "SCISSORS", 0)],
      0,
    );
    expect(result).toMatchObject({
      winner: "PLAYER_A",
      fairnessVerdict: "CLEAR",
      delayMs: 0,
    });
  });

  it("flags a delayed winning hand for review and likely late", () => {
    expect(
      analyzeRound(
        [...run("PLAYER_A", "ROCK", 0), ...run("PLAYER_B", "PAPER", 260)],
        0,
      ).fairnessVerdict,
    ).toBe("REVIEW");
    expect(
      analyzeRound(
        [...run("PLAYER_A", "ROCK", 0), ...run("PLAYER_B", "PAPER", 420)],
        0,
      ).fairnessVerdict,
    ).toBe("LIKELY_LATE");
  });

  it("labels a delayed losing hand as delayed", () => {
    expect(
      analyzeRound(
        [...run("PLAYER_A", "PAPER", 0), ...run("PLAYER_B", "ROCK", 420)],
        0,
      ).fairnessVerdict,
    ).toBe("DELAYED");
  });

  it("detects a stable gesture switch after commitment", () => {
    const result = analyzeRound(
      [
        ...run("PLAYER_A", "ROCK", 0),
        ...run("PLAYER_B", "PAPER", 0),
        ...run("PLAYER_B", "SCISSORS", 300),
      ],
      0,
    );
    expect(result.fairnessVerdict).toBe("SWITCH_DETECTED");
    expect(result.playerBFinalGesture).toBe("SCISSORS");
    expect(result.switchEvents).toHaveLength(1);
    expect(result.reasonCodes).toContain("SWITCH_AFTER_COMMIT");
  });

  it("ignores a changed gesture that does not meet its longer threshold", () => {
    const shortChange = [0, 70, 140].map((offset) => ({
      ...run("PLAYER_B", "SCISSORS", 300)[0],
      timestampMs: 300 + offset,
    }));
    const result = analyzeRound(
      [
        ...run("PLAYER_A", "ROCK", 0),
        ...run("PLAYER_B", "PAPER", 0),
        ...shortChange,
      ],
      0,
    );

    expect(result.switchEvents).toHaveLength(0);
    expect(result.playerBFinalGesture).toBe("PAPER");
  });

  it("absorbs one-frame misclassification inside a stable run", () => {
    const playerA = [
      ...run("PLAYER_A", "ROCK", 0),
      {
        ...run("PLAYER_A", "SCISSORS", 90)[0],
        timestampMs: 90,
      },
    ].sort((a, b) => a.timestampMs - b.timestampMs);
    const result = analyzeRound(
      [...playerA, ...run("PLAYER_B", "SCISSORS", 0)],
      0,
    );
    expect(result.playerACommit?.gesture).toBe("ROCK");
    expect(result.winner).toBe("PLAYER_A");
  });

  it("rejects crossed hands instead of inferring a verdict", () => {
    const observations = [
      ...run("PLAYER_A", "ROCK", 0),
      ...run("PLAYER_B", "PAPER", 0),
    ].map((item) => ({ ...item, crossed: true }));
    expect(analyzeRound(observations, 0).fairnessVerdict).toBe("INVALID_ROUND");
  });
});
