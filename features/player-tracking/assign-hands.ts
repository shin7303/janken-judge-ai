import { ROUND_CONFIG, type RoundConfig } from "@/domain/round-config";
import type { PlayerId, Point2D } from "@/domain/types";

export type HandDetection = {
  centroid: Point2D;
};

export type PlayerTrackingState = Partial<Record<PlayerId, Point2D>>;

export type AssignedHand<T extends HandDetection> = T & {
  player: PlayerId;
  assignmentConfidence: number;
  crossed: boolean;
};

const distance = (a: Point2D, b: Point2D) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function confidenceForX(x: number, config: RoundConfig) {
  return clamp(Math.abs(x - 0.5) / config.centralAmbiguityHalfWidth);
}

export function assignHandsToPlayers<T extends HandDetection>(
  detections: readonly T[],
  previous: PlayerTrackingState = {},
  config: RoundConfig = ROUND_CONFIG,
): { hands: AssignedHand<T>[]; next: PlayerTrackingState; crossed: boolean } {
  if (detections.length === 0)
    return { hands: [], next: previous, crossed: false };

  if (detections.length === 1) {
    const detection = detections[0];
    const player: PlayerId =
      detection.centroid.x < 0.5 ? "PLAYER_A" : "PLAYER_B";
    return {
      hands: [
        {
          ...detection,
          player,
          assignmentConfidence: confidenceForX(detection.centroid.x, config),
          crossed: false,
        },
      ],
      next: { ...previous, [player]: detection.centroid },
      crossed: false,
    };
  }

  const [left, right] = [...detections]
    .sort((a, b) => a.centroid.x - b.centroid.x)
    .slice(0, 2);
  const sameRegion =
    (left.centroid.x < 0.5 && right.centroid.x < 0.5) ||
    (left.centroid.x >= 0.5 && right.centroid.x >= 0.5);
  const tooClose =
    Math.abs(right.centroid.x - left.centroid.x) < config.minimumHandSeparation;
  const hasHistory = previous.PLAYER_A && previous.PLAYER_B;
  const normalCost = hasHistory
    ? distance(left.centroid, previous.PLAYER_A!) +
      distance(right.centroid, previous.PLAYER_B!)
    : 0;
  const swappedCost = hasHistory
    ? distance(left.centroid, previous.PLAYER_B!) +
      distance(right.centroid, previous.PLAYER_A!)
    : Number.POSITIVE_INFINITY;
  const swapped = swappedCost + config.crossingCostMargin < normalCost;
  const crossed = sameRegion || tooClose || swapped;
  const pairs: Array<[T, PlayerId]> = swapped
    ? [
        [left, "PLAYER_B"],
        [right, "PLAYER_A"],
      ]
    : [
        [left, "PLAYER_A"],
        [right, "PLAYER_B"],
      ];
  const hands = pairs.map(([detection, player]) => ({
    ...detection,
    player,
    assignmentConfidence: crossed
      ? 0
      : confidenceForX(detection.centroid.x, config),
    crossed,
  }));

  return {
    hands,
    next: crossed
      ? previous
      : Object.fromEntries(hands.map((hand) => [hand.player, hand.centroid])),
    crossed,
  };
}
