import { describe, expect, it } from "vitest";
import type { RoundResult } from "@/domain/types";
import { createTimelineMarkers } from "@/features/replay/timeline";

const result = {
  playerACommit: { relativeToPonMs: 100 },
  playerBCommit: { relativeToPonMs: 400 },
  switchEvents: [{ playerId: "PLAYER_B", relativeToPonMs: 600 }],
} as RoundResult;

describe("createTimelineMarkers", () => {
  it("places PON and result events within the observation window", () => {
    const markers = createTimelineMarkers(result);

    expect(markers.map(({ id }) => id)).toEqual([
      "start",
      "pon",
      "player-a-commit",
      "player-b-commit",
      "switch-0",
      "deadline",
    ]);
    expect(markers.find(({ id }) => id === "pon")?.positionPercent).toBe(40);
    expect(markers.at(-1)?.positionPercent).toBe(100);
  });
});
