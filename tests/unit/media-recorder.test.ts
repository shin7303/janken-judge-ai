import { describe, expect, it, vi } from "vitest";
import { selectRecorderOptions } from "@/features/replay/media-recorder";

describe("selectRecorderOptions", () => {
  it("selects the first supported portable format", () => {
    const isTypeSupported = vi.fn((type: string) => type === "video/webm");
    expect(selectRecorderOptions({ isTypeSupported })).toMatchObject({
      mimeType: "video/webm",
    });
  });

  it("lets the browser choose when support detection is unavailable", () => {
    expect(selectRecorderOptions(null)).toBeUndefined();
  });
});
