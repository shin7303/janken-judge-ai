import { beforeEach, describe, expect, it } from "vitest";
import { analyzeRound } from "@/features/round/analyze-round";
import type { FrameObservation, PlayerId, ValidGesture } from "@/domain/types";
import {
  clearHistory,
  exportHistory,
  HISTORY_KEY,
  readHistory,
  saveResult,
} from "@/features/history/store";

const observations = (
  playerId: PlayerId,
  gesture: ValidGesture,
): FrameObservation[] =>
  [0, 80, 160].map((timestampMs) => ({
    timestampMs,
    playerId,
    gesture,
    gestureScore: 0.9,
    handVisible: true,
    assignmentConfidence: 1,
  }));

const result = analyzeRound(
  [
    ...observations("PLAYER_A", "ROCK"),
    ...observations("PLAYER_B", "SCISSORS"),
  ],
  0,
);

describe("local history", () => {
  beforeEach(() => localStorage.clear());

  it("saves, reads, exports, and clears result metadata", async () => {
    expect(saveResult(result)).not.toBeNull();
    expect(readHistory()).toHaveLength(1);
    expect(await exportHistory().text()).toContain('"winner": "PLAYER_A"');
    expect(clearHistory()).toBe(true);
    expect(readHistory()).toEqual([]);
  });

  it("fails closed for malformed or structurally invalid storage", () => {
    localStorage.setItem(HISTORY_KEY, "{");
    expect(readHistory()).toEqual([]);
    localStorage.setItem(HISTORY_KEY, '[{"id":"incomplete"}]');
    expect(readHistory()).toEqual([]);
  });

  it("keeps only the newest twenty rounds", () => {
    for (let index = 0; index < 25; index += 1) saveResult(result);
    expect(readHistory()).toHaveLength(20);
  });

  it("does not break a round when storage is blocked", () => {
    const blocked = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("blocked");
      },
    } as unknown as Storage;
    expect(saveResult(result, blocked)).toBeNull();
  });
});
