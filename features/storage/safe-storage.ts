export function readStorageItem(
  storage: Pick<Storage, "getItem">,
  key: string,
): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(
  storage: Pick<Storage, "setItem">,
  key: string,
  value: string,
) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(
  storage: Pick<Storage, "removeItem">,
  key: string,
) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
