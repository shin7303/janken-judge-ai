export type Sensitivity = "strict" | "standard" | "lenient";
export type PlaySettings = {
  sensitivity: Sensitivity;
  replayEnabled: boolean;
  mirrored: boolean;
  countdownVolume: number;
};

export const SETTINGS_KEY = "janken-settings-v1";
export const SETTINGS_EVENT = "janken-settings-change";
export const DEFAULT_SETTINGS: PlaySettings = {
  sensitivity: "standard",
  replayEnabled: true,
  mirrored: true,
  countdownVolume: 0.5,
};

export function parseSettings(raw: string | null): PlaySettings {
  try {
    const value = raw ? (JSON.parse(raw) as Partial<PlaySettings>) : {};
    return {
      sensitivity: ["strict", "standard", "lenient"].includes(
        value.sensitivity ?? "",
      )
        ? (value.sensitivity as Sensitivity)
        : DEFAULT_SETTINGS.sensitivity,
      replayEnabled:
        typeof value.replayEnabled === "boolean"
          ? value.replayEnabled
          : DEFAULT_SETTINGS.replayEnabled,
      mirrored:
        typeof value.mirrored === "boolean"
          ? value.mirrored
          : DEFAULT_SETTINGS.mirrored,
      countdownVolume:
        typeof value.countdownVolume === "number" &&
        Number.isFinite(value.countdownVolume)
          ? Math.min(1, Math.max(0, value.countdownVolume))
          : DEFAULT_SETTINGS.countdownVolume,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: PlaySettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  } catch {
    // The current in-memory UI state remains usable when storage is blocked.
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  } catch {
    // Storage can be unavailable in privacy modes; defaults still apply.
  }
}
