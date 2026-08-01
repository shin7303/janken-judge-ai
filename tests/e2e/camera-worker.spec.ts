import { expect, test } from "@playwright/test";

test("starts and stops the worker camera pipeline", async ({ page }) => {
  await page.goto("/play");
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    class TestWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      postMessage(message: { type: string; bitmap?: ImageBitmap }) {
        if (message.type === "INIT")
          window.setTimeout(
            () =>
              this.onmessage?.(
                new MessageEvent("message", { data: { type: "READY" } }),
              ),
            0,
          );
        if (message.type === "FRAME") {
          message.bitmap?.close();
          window.setTimeout(
            () =>
              this.onmessage?.(
                new MessageEvent("message", {
                  data: {
                    type: "OBSERVATION",
                    frameId: 1,
                    timestampMs: performance.now(),
                    landmarks: [],
                    gestures: [],
                    inferenceDurationMs: 1,
                  },
                }),
              ),
            0,
          );
        }
      }

      terminate() {}
    }

    Object.defineProperty(window, "Worker", {
      configurable: true,
      value: TestWorker,
    });
    let currentTime = 0;
    Object.defineProperties(HTMLVideoElement.prototype, {
      srcObject: { configurable: true, writable: true, value: null },
      readyState: { configurable: true, get: () => 2 },
      currentTime: {
        configurable: true,
        get: () => {
          currentTime += 0.05;
          return currentTime;
        },
      },
      play: { configurable: true, value: async () => {} },
      requestVideoFrameCallback: {
        configurable: true,
        value: (callback: () => void) => window.setTimeout(callback, 16),
      },
      cancelVideoFrameCallback: {
        configurable: true,
        value: (id: number) => window.clearTimeout(id),
      },
    });
    Object.defineProperty(window, "createImageBitmap", {
      configurable: true,
      value: async () => ({ close() {} }),
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => ({
        getTracks: () => [{ stop() {} }],
        getVideoTracks: () => [
          {
            addEventListener() {},
            applyConstraints: async () => {},
          },
        ],
      }),
    });
    Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
      configurable: true,
      value: async () => [
        {
          deviceId: "camera-a",
          groupId: "group-a",
          kind: "videoinput",
          label: "テストカメラ",
          toJSON: () => ({}),
        },
      ],
    });
  });
  const start = page.getByRole("button", { name: "カメラを有効にする" });
  await expect(start).toBeVisible();
  await start.evaluate((button: HTMLButtonElement) => {
    window.setTimeout(() => button.click(), 0);
  });

  await expect(page.getByRole("status")).toContainText(
    "二人の手を左右の枠に入れてください",
  );
  await expect(page.locator('[data-execution-mode="worker"]')).toBeVisible();
  const stop = page.getByRole("button", { name: "停止" });
  await stop.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("status")).toContainText("停止しました");
});
