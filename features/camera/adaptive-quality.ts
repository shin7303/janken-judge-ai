import { ROUND_CONFIG, type RoundConfig } from "@/domain/round-config";

export type AdaptiveQualityState = {
  profile: "standard" | "reduced";
  lowFpsWindows: number;
};

export const initialAdaptiveQuality: AdaptiveQualityState = {
  profile: "standard",
  lowFpsWindows: 0,
};

export function updateAdaptiveQuality(
  state: AdaptiveQualityState,
  fps: number,
  config: RoundConfig = ROUND_CONFIG,
): AdaptiveQualityState {
  if (state.profile === "reduced") return state;
  if (fps >= config.minimumInferenceFps)
    return state.lowFpsWindows === 0 ? state : { ...state, lowFpsWindows: 0 };
  const lowFpsWindows = state.lowFpsWindows + 1;
  return {
    profile:
      lowFpsWindows >= config.lowFpsWindowsBeforeReduction
        ? "reduced"
        : "standard",
    lowFpsWindows,
  };
}
