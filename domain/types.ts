export type PlayerId = "PLAYER_A" | "PLAYER_B";
export type Gesture = "ROCK" | "PAPER" | "SCISSORS" | "UNKNOWN";
export type ValidGesture = Exclude<Gesture, "UNKNOWN">;
export type Winner = PlayerId | "DRAW" | "UNDECIDED";
export type FairnessVerdict =
  | "CLEAR"
  | "DELAYED"
  | "REVIEW"
  | "LIKELY_LATE"
  | "SWITCH_DETECTED"
  | "INSUFFICIENT_DATA"
  | "INVALID_ROUND";
export type QualityLevel = "HIGH" | "MEDIUM" | "LOW" | "INVALID";

export interface FrameObservation {
  timestampMs: number;
  playerId: PlayerId;
  gesture: Gesture;
  gestureScore: number;
  handVisible: boolean;
  assignmentConfidence: number;
  crossed?: boolean;
}

export interface StableGestureRun {
  playerId: PlayerId;
  gesture: ValidGesture;
  startMs: number;
  endMs: number;
  sampleCount: number;
  medianScore: number;
}
export interface CommitEvent {
  playerId: PlayerId;
  gesture: ValidGesture;
  committedAtMs: number;
  relativeToPonMs: number;
  confidence: number;
}
export interface GestureSwitchEvent {
  playerId: PlayerId;
  from: ValidGesture;
  to: ValidGesture;
  switchedAtMs: number;
  relativeToPonMs: number;
}
export interface RoundQuality {
  level: QualityLevel;
  averageInferenceFps: number;
  droppedObservationCount: number;
  ambiguousAssignmentCount: number;
  averageGestureScoreA: number;
  averageGestureScoreB: number;
  reasons: string[];
}
export interface RoundResult {
  ponTimestampMs: number;
  playerACommit: CommitEvent | null;
  playerBCommit: CommitEvent | null;
  playerAFinalGesture: Gesture;
  playerBFinalGesture: Gesture;
  winner: Winner;
  delayMs: number | null;
  latePlayer: PlayerId | null;
  fairnessVerdict: FairnessVerdict;
  switchEvents: GestureSwitchEvent[];
  quality: RoundQuality;
  reasonCodes: string[];
}
