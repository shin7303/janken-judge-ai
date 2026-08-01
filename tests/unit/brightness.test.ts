import { describe, expect, it } from "vitest";
import {
  averageBrightness,
  classifyBrightness,
} from "@/features/camera/brightness";

describe("camera brightness diagnostics", () => {
  it("classifies dark, usable, bright, and unavailable samples", () => {
    expect(classifyBrightness(null)).toBe("unavailable");
    expect(classifyBrightness(30)).toBe("dark");
    expect(classifyBrightness(120)).toBe("good");
    expect(classifyBrightness(240)).toBe("bright");
  });

  it("computes luminance without retaining an image", () => {
    expect(averageBrightness(new Uint8ClampedArray())).toBeNull();
    expect(
      averageBrightness(new Uint8ClampedArray([100, 100, 100, 255])),
    ).toBeCloseTo(100);
  });
});
