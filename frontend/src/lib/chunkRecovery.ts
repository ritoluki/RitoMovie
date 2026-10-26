const RELOAD_KEY = 'ritomovie-chunk-reload-at';
const RELOAD_COOLDOWN_MS = 60_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading (?:CSS )?chunk .* failed|Unable to preload CSS/i.test(message);
}

// The timestamp survives a reload so an unavailable asset cannot cause a loop.
// Fail safely when storage is unavailable; the error screen still offers a retry.
export function reloadAfterChunkError(): boolean {
  if (window.navigator.onLine === false) return false;

  try {
    const now = Date.now();
    const previousAttempt = Number(window.sessionStorage.getItem(RELOAD_KEY));
    if (previousAttempt > 0 && now - previousAttempt < RELOAD_COOLDOWN_MS) {
      return false;
    }
    window.sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}
