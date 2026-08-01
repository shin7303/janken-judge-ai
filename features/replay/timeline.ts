import { ROUND_CONFIG } from "@/domain/round-config";
import type { RoundResult } from "@/domain/types";

export type TimelineMarker = {
  id: string;
  label: string;
  relativeMs: number;
  positionPercent: number;
  kind: "boundary" | "pon" | "player-a" | "player-b" | "switch";
};

const position = (relativeMs: number) =>
  Math.max(
    0,
    Math.min(
      100,
      ((relativeMs + ROUND_CONFIG.prePonObservationMs) /
        (ROUND_CONFIG.prePonObservationMs + ROUND_CONFIG.postPonDeadlineMs)) *
        100,
    ),
  );

export function createTimelineMarkers(result: RoundResult): TimelineMarker[] {
  const markers: TimelineMarker[] = [
    {
      id: "start",
      label: "観測開始",
      relativeMs: -ROUND_CONFIG.prePonObservationMs,
      positionPercent: 0,
      kind: "boundary",
    },
    {
      id: "pon",
      label: "PON",
      relativeMs: 0,
      positionPercent: position(0),
      kind: "pon",
    },
    {
      id: "deadline",
      label: "締切",
      relativeMs: ROUND_CONFIG.postPonDeadlineMs,
      positionPercent: 100,
      kind: "boundary",
    },
  ];
  if (result.playerACommit)
    markers.push({
      id: "player-a-commit",
      label: "A確定",
      relativeMs: result.playerACommit.relativeToPonMs,
      positionPercent: position(result.playerACommit.relativeToPonMs),
      kind: "player-a",
    });
  if (result.playerBCommit)
    markers.push({
      id: "player-b-commit",
      label: "B確定",
      relativeMs: result.playerBCommit.relativeToPonMs,
      positionPercent: position(result.playerBCommit.relativeToPonMs),
      kind: "player-b",
    });
  result.switchEvents.forEach((event, index) =>
    markers.push({
      id: `switch-${index}`,
      label: `${event.playerId === "PLAYER_A" ? "A" : "B"}変更`,
      relativeMs: event.relativeToPonMs,
      positionPercent: position(event.relativeToPonMs),
      kind: "switch",
    }),
  );
  return markers.sort((a, b) => a.relativeMs - b.relativeMs);
}
