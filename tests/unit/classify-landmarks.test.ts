import {
  blendGesture,
  classifyLandmarks,
} from "@/features/gesture/classify-landmarks";
import { describe, expect, it } from "vitest";

const hand = (tips: number[]) =>
  Array.from({ length: 21 }, (_, index) => ({
    x: index / 25,
    y: tips.includes(index) ? 0.2 : index === 0 ? 0.9 : 0.6,
  }));

describe("classifyLandmarks", () => {
  it("recognizes an open palm from four extended fingers", () =>
    expect(classifyLandmarks(hand([8, 12, 16, 20])).gesture).toBe("PAPER"));
  it("recognizes victory from index and middle fingers", () =>
    expect(classifyLandmarks(hand([8, 12])).gesture).toBe("SCISSORS"));
  it("recognizes a closed hand when fingers are folded", () =>
    expect(classifyLandmarks(hand([])).gesture).toBe("ROCK"));
  it("uses a high-confidence model result when it conflicts with the fallback", () =>
    expect(blendGesture("Open_Palm", 0.9, hand([])).gesture).toBe("PAPER"));
});
