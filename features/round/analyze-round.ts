import { isWinningGesture, judgeWinner } from "@/domain/gesture";
import { ROUND_CONFIG, type RoundConfig } from "@/domain/round-config";
import type {
  CommitEvent,
  FrameObservation,
  Gesture,
  GestureSwitchEvent,
  PlayerId,
  RoundQuality,
  RoundResult,
  StableGestureRun,
  ValidGesture,
} from "@/domain/types";

const players: PlayerId[] = ["PLAYER_A", "PLAYER_B"];
const valid = (gesture: Gesture): gesture is ValidGesture =>
  gesture !== "UNKNOWN";
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

export function extractStableRuns(
  observations: FrameObservation[],
  playerId: PlayerId,
  config: RoundConfig = ROUND_CONFIG,
): StableGestureRun[] {
  const source = observations
    .filter((item) => item.playerId === playerId)
    .sort((a, b) => a.timestampMs - b.timestampMs);
  const runs: StableGestureRun[] = [];
  let bucket: FrameObservation[] = [];
  const close = () => {
    const first = bucket[0];
    const last = bucket.at(-1);
    if (
      first &&
      last &&
      valid(first.gesture) &&
      bucket.length >= config.minStableSamples &&
      last.timestampMs - first.timestampMs >= config.gestureStableMs
    ) {
      runs.push({
        playerId,
        gesture: first.gesture,
        startMs: first.timestampMs,
        endMs: last.timestampMs,
        sampleCount: bucket.length,
        medianScore: median(bucket.map((item) => item.gestureScore)),
      });
    }
    bucket = [];
  };
  for (const item of source) {
    const acceptable =
      valid(item.gesture) &&
      item.gestureScore >= config.minGestureScore &&
      item.handVisible &&
      item.assignmentConfidence >= config.minAssignmentConfidence;
    if (
      acceptable &&
      (bucket.length === 0 || bucket[0].gesture === item.gesture)
    )
      bucket.push(item);
    else {
      close();
      if (acceptable) bucket = [item];
    }
  }
  close();
  return runs;
}

function quality(
  observations: FrameObservation[],
  config: RoundConfig,
): RoundQuality {
  const timestamps = [
    ...new Set(observations.map((item) => item.timestampMs)),
  ].sort((a, b) => a - b);
  const intervals = timestamps
    .slice(1)
    .map((timestamp, index) => timestamp - timestamps[index]);
  const fps = intervals.length ? 1000 / median(intervals) : 0;
  const dropped = observations.filter((item) => !item.handVisible).length;
  const ambiguous = observations.filter(
    (item) => item.assignmentConfidence < config.minAssignmentConfidence,
  ).length;
  const avg = (playerId: PlayerId) => {
    const scores = observations
      .filter((item) => item.playerId === playerId)
      .map((item) => item.gestureScore);
    return scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  };
  const reasons: string[] = [];
  if (fps < config.minimumInferenceFps) reasons.push("LOW_FPS");
  if (dropped) reasons.push("HAND_MISSING");
  if (ambiguous) reasons.push("AMBIGUOUS_ASSIGNMENT");
  if (observations.some((item) => item.crossed)) reasons.push("CROSSED_HANDS");
  return {
    level: reasons.includes("CROSSED_HANDS")
      ? "INVALID"
      : reasons.length
        ? "LOW"
        : fps >= config.recommendedInferenceFps
          ? "HIGH"
          : "MEDIUM",
    averageInferenceFps: Number(fps.toFixed(1)),
    droppedObservationCount: dropped,
    ambiguousAssignmentCount: ambiguous,
    averageGestureScoreA: avg("PLAYER_A"),
    averageGestureScoreB: avg("PLAYER_B"),
    reasons,
  };
}

export function analyzeRound(
  observations: FrameObservation[],
  ponTimestampMs: number,
  config: RoundConfig = ROUND_CONFIG,
): RoundResult {
  const relevant = observations.filter(
    (item) =>
      item.timestampMs >= ponTimestampMs - config.prePonObservationMs &&
      item.timestampMs <= ponTimestampMs + config.postPonDeadlineMs,
  );
  const roundQuality = quality(relevant, config);
  const reasonCodes = [...roundQuality.reasons];
  const runs = players.flatMap((playerId) =>
    extractStableRuns(relevant, playerId, config),
  );
  const commits = Object.fromEntries(
    players.map((playerId) => {
      const run = runs.find(
        (item) => item.playerId === playerId && item.endMs >= ponTimestampMs,
      );
      const committedAtMs =
        run?.gesture === "ROCK" && run.startMs < ponTimestampMs
          ? ponTimestampMs
          : run?.startMs;
      const commit: CommitEvent | null =
        run && committedAtMs !== undefined
          ? {
              playerId,
              gesture: run.gesture,
              committedAtMs,
              relativeToPonMs: committedAtMs - ponTimestampMs,
              confidence: run.medianScore,
            }
          : null;
      return [playerId, commit];
    }),
  ) as Record<PlayerId, CommitEvent | null>;
  if (!commits.PLAYER_A || !commits.PLAYER_B)
    reasonCodes.push("NO_STABLE_GESTURE");
  const switches: GestureSwitchEvent[] = players.flatMap((playerId) => {
    const commit = commits[playerId];
    if (!commit) return [];
    const next = runs.find(
      (run) =>
        run.playerId === playerId &&
        run.startMs > commit.committedAtMs &&
        run.gesture !== commit.gesture,
    );
    return next
      ? [
          {
            playerId,
            from: commit.gesture,
            to: next.gesture,
            switchedAtMs: next.startMs,
            relativeToPonMs: next.startMs - ponTimestampMs,
          },
        ]
      : [];
  });
  const finalGesture = (playerId: PlayerId): Gesture =>
    switches.find((item) => item.playerId === playerId)?.to ??
    commits[playerId]?.gesture ??
    "UNKNOWN";
  const a = finalGesture("PLAYER_A");
  const b = finalGesture("PLAYER_B");
  const delayMs =
    commits.PLAYER_A && commits.PLAYER_B
      ? Math.abs(
          commits.PLAYER_A.committedAtMs - commits.PLAYER_B.committedAtMs,
        )
      : null;
  const latePlayer =
    commits.PLAYER_A && commits.PLAYER_B
      ? commits.PLAYER_A.committedAtMs > commits.PLAYER_B.committedAtMs
        ? "PLAYER_A"
        : commits.PLAYER_B.committedAtMs > commits.PLAYER_A.committedAtMs
          ? "PLAYER_B"
          : null
      : null;
  let fairnessVerdict: RoundResult["fairnessVerdict"] = "CLEAR";
  if (roundQuality.level === "INVALID") fairnessVerdict = "INVALID_ROUND";
  else if (
    !commits.PLAYER_A ||
    !commits.PLAYER_B ||
    roundQuality.level === "LOW"
  )
    fairnessVerdict = "INSUFFICIENT_DATA";
  else if (switches.length) fairnessVerdict = "SWITCH_DETECTED";
  else if (delayMs !== null && latePlayer) {
    const lateGesture = finalGesture(latePlayer);
    const earlyGesture = finalGesture(
      latePlayer === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A",
    );
    const wins = isWinningGesture(lateGesture, earlyGesture);
    fairnessVerdict =
      delayMs >= config.likelyLateDelayMs && wins
        ? "LIKELY_LATE"
        : delayMs >= config.reviewDelayMs && wins
          ? "REVIEW"
          : delayMs >= config.reviewDelayMs
            ? "DELAYED"
            : "CLEAR";
  }
  return {
    ponTimestampMs,
    playerACommit: commits.PLAYER_A,
    playerBCommit: commits.PLAYER_B,
    playerAFinalGesture: a,
    playerBFinalGesture: b,
    winner: judgeWinner(a, b),
    delayMs,
    latePlayer,
    fairnessVerdict,
    switchEvents: switches,
    quality: roundQuality,
    reasonCodes,
  };
}
