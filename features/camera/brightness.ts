export type BrightnessLevel = "dark" | "good" | "bright" | "unavailable";

export function classifyBrightness(value: number | null): BrightnessLevel {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  if (value < 45) return "dark";
  if (value > 220) return "bright";
  return "good";
}

export function averageBrightness(data: Uint8ClampedArray): number | null {
  if (data.length < 4) return null;
  let total = 0;
  let pixels = 0;
  for (let index = 0; index + 3 < data.length; index += 4) {
    total +=
      data[index] * 0.2126 +
      data[index + 1] * 0.7152 +
      data[index + 2] * 0.0722;
    pixels += 1;
  }
  return pixels ? total / pixels : null;
}
