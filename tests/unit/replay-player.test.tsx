import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReplayPlayer } from "@/components/replay/replay-player";
import type { RoundResult } from "@/domain/types";

const result = {
  ponTimestampMs: 0,
  playerACommit: null,
  playerBCommit: null,
  playerAFinalGesture: "UNKNOWN",
  playerBFinalGesture: "UNKNOWN",
  winner: "UNDECIDED",
  delayMs: null,
  latePlayer: null,
  fairnessVerdict: "INSUFFICIENT_DATA",
  switchEvents: [],
  quality: {
    level: "LOW",
    averageInferenceFps: 0,
    droppedObservationCount: 0,
    ambiguousAssignmentCount: 0,
    averageGestureScoreA: 0,
    averageGestureScoreB: 0,
    reasons: [],
  },
  reasonCodes: [],
} satisfies RoundResult;

describe("ReplayPlayer", () => {
  afterEach(cleanup);

  it("changes playback speed and seeks to PON", () => {
    const { container } = render(
      <ReplayPlayer
        replayUrl="blob:round"
        metadata={{ recordingStartedAtMs: 1000, ponOffsetMs: 3000 }}
        result={result}
        unavailableReason={null}
      />,
    );
    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "0.25倍" }));
    expect(video?.playbackRate).toBe(0.25);
    fireEvent.click(screen.getByRole("button", { name: /PON.*へ移動/ }));
    expect(video?.currentTime).toBe(3);
  });

  it("keeps the timeline available without MediaRecorder output", () => {
    render(
      <ReplayPlayer
        replayUrl={null}
        metadata={null}
        result={result}
        unavailableReason="録画非対応"
      />,
    );
    expect(screen.getByText("録画非対応")).toBeInTheDocument();
    expect(screen.getByLabelText(/PON.*へ移動/)).toBeDisabled();
  });
});
