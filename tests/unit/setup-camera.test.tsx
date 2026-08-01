import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/camera/live-camera", () => ({
  LiveCamera: ({
    onDiagnostics,
  }: {
    onDiagnostics: (value: unknown) => void;
  }) => (
    <button
      onClick={() =>
        onDiagnostics({
          running: true,
          fps: 15,
          hands: [
            { player: "PLAYER_A", gesture: "ROCK", score: 0.9 },
            { player: "PLAYER_B", gesture: "PAPER", score: 0.9 },
          ],
        })
      }
    >
      診断値を更新
    </button>
  ),
}));

import { SetupCamera } from "@/components/setup/setup-camera";

describe("SetupCamera", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("enables navigation only after all readiness checks pass", () => {
    vi.useFakeTimers();
    render(<SetupCamera />);

    expect(screen.getByRole("button", { name: /準備完了まで/ })).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: /ラウンドへ/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "診断値を更新" }));

    expect(
      screen.getByRole("heading", { name: "安定性を確認中" }),
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByRole("heading", { name: "準備OK" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ラウンドへ/ })).toHaveAttribute(
      "href",
      "/play",
    );
  });
});
