import type { Gesture, Winner } from "./types";

export function judgeWinner(a: Gesture, b: Gesture): Winner {
  if (a === "UNKNOWN" || b === "UNKNOWN") return "UNDECIDED";
  if (a === b) return "DRAW";
  return (a === "ROCK" && b === "SCISSORS") ||
    (a === "SCISSORS" && b === "PAPER") ||
    (a === "PAPER" && b === "ROCK")
    ? "PLAYER_A"
    : "PLAYER_B";
}

export const isWinningGesture = (candidate: Gesture, opponent: Gesture) =>
  judgeWinner(candidate, opponent) === "PLAYER_A";
