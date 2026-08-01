import type { RoundResult } from "@/domain/types";

export type HistoryItem = RoundResult & { id: string; playedAt: string };
export const HISTORY_KEY = "janken-history-v1";

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HistoryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.playedAt === "string" &&
    typeof item.ponTimestampMs === "number" &&
    typeof item.fairnessVerdict === "string" &&
    typeof item.winner === "string" &&
    Array.isArray(item.reasonCodes) &&
    Array.isArray(item.switchEvents) &&
    !!item.quality &&
    typeof item.quality === "object"
  );
}

export function readHistory(storage: Storage = localStorage): HistoryItem[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isHistoryItem).slice(0, 20) : [];
  } catch {
    return [];
  }
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function saveResult(
  result: RoundResult,
  storage: Storage = localStorage,
): HistoryItem | null {
  const item: HistoryItem = {
    ...result,
    id: createLocalId(),
    playedAt: new Date().toISOString(),
  };
  try {
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify([item, ...readHistory(storage)].slice(0, 20)),
    );
    return item;
  } catch {
    return null;
  }
}

export function clearHistory(storage: Storage = localStorage) {
  try {
    storage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

export const exportHistory = (storage: Storage = localStorage) =>
  new Blob([JSON.stringify(readHistory(storage), null, 2)], {
    type: "application/json",
  });
