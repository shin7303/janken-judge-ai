import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/camera/live-camera", () => ({
  LiveCamera: ({
    onDiagnostics,
  }: {
    onDiagnostics: (diagnostics: {
      running: boolean;
      fps: number;
      hands: Array<{
        player: "PLAYER_A" | "PLAYER_B";
        gesture: "ROCK" | "PAPER";
        score: number;
      }>;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onDiagnostics({
          running: true,
          fps: 20,
          hands: [
            { player: "PLAYER_A", gesture: "ROCK", score: 0.9 },
            { player: "PLAYER_B", gesture: "PAPER", score: 0.9 },
          ],
        })
      }
    >
      両手を検出
    </button>
  ),
}));

import PlayPage from "@/app/play/page";
import { ROUND_CONFIG } from "@/domain/round-config";

describe("PlayPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("automatically begins the countdown after both hands are ready", () => {
    vi.useFakeTimers();
    render(<PlayPage />);

    fireEvent.click(screen.getByRole("button", { name: "両手を検出" }));
    act(() => vi.advanceTimersByTime(ROUND_CONFIG.autoStartDelayMs));

    expect(screen.getByRole("heading", { name: "3" })).toBeInTheDocument();
  });
});
