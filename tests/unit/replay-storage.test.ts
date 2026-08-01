import { describe, expect, it, vi } from "vitest";
import {
  readReplayMetadata,
  REPLAY_METADATA_KEY,
  REPLAY_URL_KEY,
  revokeStoredReplay,
} from "@/features/replay/storage";

describe("replay storage", () => {
  it("rejects malformed metadata instead of throwing", () => {
    expect(readReplayMetadata({ getItem: () => "{" })).toBeNull();
    expect(
      readReplayMetadata({ getItem: () => '{"ponOffsetMs":20}' }),
    ).toBeNull();
  });

  it("revokes a blob URL and removes replay keys", () => {
    const removeItem = vi.fn();
    const revokeObjectURL = vi.fn();
    revokeStoredReplay(
      { getItem: () => "blob:round", removeItem },
      { revokeObjectURL },
    );

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:round");
    expect(removeItem).toHaveBeenCalledWith(REPLAY_URL_KEY);
    expect(removeItem).toHaveBeenCalledWith(REPLAY_METADATA_KEY);
  });
});
