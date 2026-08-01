import { describe, expect, it } from "vitest";
import {
  initialAdaptiveQuality,
  updateAdaptiveQuality,
} from "@/features/camera/adaptive-quality";

describe("updateAdaptiveQuality", () => {
  it("reduces capture quality only after sustained low FPS", () => {
    const first = updateAdaptiveQuality(initialAdaptiveQuality, 8);
    const second = updateAdaptiveQuality(first, 9);
    const third = updateAdaptiveQuality(second, 7);

    expect(second.profile).toBe("standard");
    expect(third.profile).toBe("reduced");
  });

  it("resets the low-FPS window after recovery", () => {
    const low = updateAdaptiveQuality(initialAdaptiveQuality, 8);
    expect(updateAdaptiveQuality(low, 15)).toEqual(initialAdaptiveQuality);
  });
});
