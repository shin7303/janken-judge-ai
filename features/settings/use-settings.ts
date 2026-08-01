"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseSettings,
  SETTINGS_EVENT,
  SETTINGS_KEY,
  type PlaySettings,
  writeSettings,
} from "./store";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(SETTINGS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SETTINGS_EVENT, onChange);
  };
};
const getSnapshot = () => {
  try {
    return localStorage.getItem(SETTINGS_KEY) ?? "";
  } catch {
    return "";
  }
};
const getServerSnapshot = () => "";

export function usePlaySettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = useMemo(() => parseSettings(raw), [raw]);
  const update = (patch: Partial<PlaySettings>) =>
    writeSettings({ ...settings, ...patch });
  return { settings, update };
}
