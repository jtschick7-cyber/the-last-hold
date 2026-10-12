// Technical design §9.1: on first run, ask the browser to keep our storage.
// Resolves to whether it agreed, or null where the API doesn't exist.
export const requestPersistentStorage = async (): Promise<boolean | null> => {
  try {
    if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
};
