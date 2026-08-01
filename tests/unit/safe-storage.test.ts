import { describe, expect, it } from "vitest";
import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "@/features/storage/safe-storage";

describe("safe browser storage", () => {
  it("reads, writes, and removes available storage", () => {
    localStorage.clear();
    expect(writeStorageItem(localStorage, "key", "value")).toBe(true);
    expect(readStorageItem(localStorage, "key")).toBe("value");
    expect(removeStorageItem(localStorage, "key")).toBe(true);
  });

  it("returns conservative fallbacks when access throws", () => {
    const blocked = {
      getItem: () => {
        throw new DOMException("blocked");
      },
      setItem: () => {
        throw new DOMException("blocked");
      },
      removeItem: () => {
        throw new DOMException("blocked");
      },
    };
    expect(readStorageItem(blocked, "key")).toBeNull();
    expect(writeStorageItem(blocked, "key", "value")).toBe(false);
    expect(removeStorageItem(blocked, "key")).toBe(false);
  });
});
