import { describe, expect, it, vi } from "vitest";
import { LatestFrameQueue } from "@/features/gesture/latest-frame-queue";

const frame = (id: number) => ({ id, bitmap: { close: vi.fn() } });

describe("LatestFrameQueue", () => {
  it("sends one frame and keeps only the newest pending frame", () => {
    const sent: number[] = [];
    const queue = new LatestFrameQueue<ReturnType<typeof frame>>((item) =>
      sent.push(item.id),
    );
    const first = frame(1);
    const stale = frame(2);
    const latest = frame(3);

    queue.submit(first);
    queue.submit(stale);
    queue.submit(latest);
    expect(sent).toEqual([1]);
    expect(stale.bitmap.close).toHaveBeenCalledOnce();

    queue.complete();
    expect(sent).toEqual([1, 3]);
  });

  it("closes pending and future frames after disposal", () => {
    const queue = new LatestFrameQueue<ReturnType<typeof frame>>(() => {});
    const pending = frame(2);
    const future = frame(3);
    queue.submit(frame(1));
    queue.submit(pending);
    queue.dispose();
    queue.submit(future);

    expect(pending.bitmap.close).toHaveBeenCalledOnce();
    expect(future.bitmap.close).toHaveBeenCalledOnce();
  });
});
