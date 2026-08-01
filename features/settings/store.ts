export type Sensitivity = "strict" | "standard" | "lenient";
export type PlaySettings = {
  sensitivity: Sensitivity;
  replayEnabled: boolean;
  mirrored: boolean;
  autoStartEnabled: boolean;
  countdownVolume: number;
};

export const SETTINGS_KEY = "janken-settings-v1";
export const SETTINGS_EVENT = "janken-settings-change";
export const DEFAULT_SETTINGS: PlaySettings = {
  sensitivity: "standard",
  replayEnabled: true,
  mirrored: true,
  autoStartEnabled: true,
  countdownVolume: 0.5,
};
let memorySnapshot = "";

export function readSettingsSnapshot() {
  try {
    return localStorage.getItem(SETTINGS_KEY) ?? "";
  } catch {
    return memorySnapshot;
  }
}

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
      autoStartEnabled:
        typeof value.autoStartEnabled === "boolean"
          ? value.autoStartEnabled
          : DEFAULT_SETTINGS.autoStartEnabled,
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
  memorySnapshot = JSON.stringify(settings);
  try {
    localStorage.setItem(SETTINGS_KEY, memorySnapshot);
  } catch {
    // Continue with the in-memory snapshot when persistent storage is blocked.
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function resetSettings() {
  memorySnapshot = "";
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // Storage can be unavailable in privacy modes; defaults still apply.
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SETTINGS_EVENT));
}
