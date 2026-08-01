import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCamera } from "@/components/camera/live-camera";

describe("LiveCamera", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "mediaDevices");
  });

  it("offers a clear fallback when the camera API is unavailable", () => {
    render(<LiveCamera />);

    fireEvent.click(screen.getByRole("button", { name: /カメラを開始/ }));

    expect(screen.getByRole("status")).toHaveTextContent(
      /このブラウザではカメラを利用できません/,
    );
    expect(screen.getByRole("button", { name: "停止" })).toBeDisabled();
  });

  it("disposes a camera stream that arrives after startup is cancelled", async () => {
    let resolveStream: ((stream: MediaStream) => void) | undefined;
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    );
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    render(<LiveCamera />);

    fireEvent.click(screen.getByRole("button", { name: /カメラを開始/ }));
    expect(screen.getByRole("button", { name: "準備中…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "停止" }));
    resolveStream?.({
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream);

    await waitFor(() => expect(stopTrack).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent(/停止しました/);
    expect(screen.getByRole("button", { name: /カメラを開始/ })).toBeEnabled();
  });
});
