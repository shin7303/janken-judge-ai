import { describe, expect, it } from "vitest";
import { assignHandsToPlayers } from "@/features/player-tracking/assign-hands";

const hand = (x: number, y = 0.5) => ({ centroid: { x, y } });

describe("assignHandsToPlayers", () => {
  it("assigns separated screen positions to the two player regions", () => {
    const result = assignHandsToPlayers([hand(0.8), hand(0.2)]);

    expect(result.crossed).toBe(false);
    expect(result.hands.map(({ player }) => player)).toEqual([
      "PLAYER_A",
      "PLAYER_B",
    ]);
    expect(result.hands.every((item) => item.assignmentConfidence === 1)).toBe(
      true,
    );
  });

  it("invalidates hands that enter the same region or converge", () => {
    expect(assignHandsToPlayers([hand(0.2), hand(0.35)]).crossed).toBe(true);
    expect(assignHandsToPlayers([hand(0.46), hand(0.54)]).crossed).toBe(true);
  });

  it("uses previous positions to detect a trajectory crossover", () => {
    const previous = {
      PLAYER_A: { x: 0.25, y: 0.2 },
      PLAYER_B: { x: 0.75, y: 0.8 },
    } as const;
    const crossover = assignHandsToPlayers(
      [hand(0.7, 0.2), hand(0.3, 0.8)],
      previous,
    );
    expect(crossover.crossed).toBe(true);
  });

  it("lowers confidence for a single hand near the center", () => {
    const [assigned] = assignHandsToPlayers([hand(0.52)]).hands;
    expect(assigned.player).toBe("PLAYER_B");
    expect(assigned.assignmentConfidence).toBeCloseTo(0.2);
  });
});
