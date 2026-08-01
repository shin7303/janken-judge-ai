export const REPLAY_URL_KEY = "janken-last-replay";
export const REPLAY_METADATA_KEY = "janken-last-replay-metadata";
export const REPLAY_UNAVAILABLE_KEY = "janken-replay-unavailable";

export type ReplayMetadata = {
  recordingStartedAtMs: number;
  ponOffsetMs: number;
};

export function readReplayMetadata(
  storage: Pick<Storage, "getItem">,
): ReplayMetadata | null {
  try {
    const value = storage.getItem(REPLAY_METADATA_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ReplayMetadata>;
    return typeof parsed.recordingStartedAtMs === "number" &&
      typeof parsed.ponOffsetMs === "number"
      ? (parsed as ReplayMetadata)
      : null;
  } catch {
    return null;
  }
}

export function revokeStoredReplay(
  storage: Pick<Storage, "getItem" | "removeItem">,
  urlApi: Pick<typeof URL, "revokeObjectURL"> = URL,
) {
  try {
    const replayUrl = storage.getItem(REPLAY_URL_KEY);
    if (replayUrl?.startsWith("blob:")) urlApi.revokeObjectURL(replayUrl);
    storage.removeItem(REPLAY_URL_KEY);
    storage.removeItem(REPLAY_METADATA_KEY);
  } catch {
    // Cleanup is best-effort when browser storage or Object URLs are blocked.
  }
}
