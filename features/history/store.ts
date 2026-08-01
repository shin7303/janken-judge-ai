import type { RoundResult } from "@/domain/types";
export type HistoryItem = RoundResult & { id: string; playedAt: string };
const key = "janken-history-v1";
export const readHistory = (): HistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
};
export const saveResult = (result: RoundResult) => {
  const item: HistoryItem = {
    ...result,
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    key,
    JSON.stringify([item, ...readHistory()].slice(0, 20)),
  );
  return item;
};
export const clearHistory = () => localStorage.removeItem(key);
export const exportHistory = () =>
  new Blob([JSON.stringify(readHistory(), null, 2)], {
    type: "application/json",
  });
