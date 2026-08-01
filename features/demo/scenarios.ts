import type { FrameObservation, Gesture, PlayerId } from "@/domain/types";

type Scenario = {
  id: string;
  title: string;
  description: string;
  ponTimestampMs: number;
  observations: FrameObservation[];
};
const samples = (
  playerId: PlayerId,
  gesture: Gesture,
  startMs: number,
  score = 0.9,
): FrameObservation[] =>
  [0, 80, 160].map((offset) => ({
    timestampMs: startMs + offset,
    playerId,
    gesture,
    gestureScore: score,
    handVisible: true,
    assignmentConfidence: 1,
  }));

export const demoScenarios: Scenario[] = [
  {
    id: "clear",
    title: "同時に確定",
    description: "両者が許容時間内に手を確定した通常の対戦です。",
    ponTimestampMs: 0,
    observations: [
      ...samples("PLAYER_A", "ROCK", 0),
      ...samples("PLAYER_B", "SCISSORS", 80),
    ],
  },
  {
    id: "late",
    title: "遅れて有利な手",
    description: "Player B が遅れて Player A に勝つ手を確定した例です。",
    ponTimestampMs: 0,
    observations: [
      ...samples("PLAYER_A", "ROCK", 0),
      ...samples("PLAYER_B", "PAPER", 420),
    ],
  },
  {
    id: "switch",
    title: "確定後の手変更",
    description: "Player B が一度確定した後に、別の有効な手へ変化した例です。",
    ponTimestampMs: 0,
    observations: [
      ...samples("PLAYER_A", "ROCK", 0),
      ...samples("PLAYER_B", "PAPER", 0),
      ...samples("PLAYER_B", "SCISSORS", 310),
    ],
  },
  {
    id: "invalid",
    title: "手が交差",
    description: "手の位置が曖昧なため、自動判定を保留する例です。",
    ponTimestampMs: 0,
    observations: [
      ...samples("PLAYER_A", "ROCK", 0),
      ...samples("PLAYER_B", "PAPER", 0),
    ].map((item) => ({ ...item, crossed: true })),
  },
];
