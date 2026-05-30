import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

/**
 * Thin JSON wrapper around AsyncStorage.
 *
 * Every provider in /state persists itself through this. Keeping
 * the API tiny (load / save / remove) and synchronous-feeling at
 * the call site means each provider only needs ~10 lines of
 * persistence code.
 *
 * Errors are swallowed (with a dev-only warn) on purpose: storage
 * is a best-effort optimization. If it fails, the app should
 * continue with defaults rather than crashing. Worst case is the
 * user loses their highlights on this device — bad, but not as bad
 * as a white-screen.
 */

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] load failed for ${key}`, err);
    }
    return null;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] save failed for ${key}`, err);
    }
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] remove failed for ${key}`, err);
    }
  }
}

/**
 * Centralized list of storage keys. Versioned so we can ship
 * schema migrations later without breaking older installs (bump the
 * suffix and write a one-off migration that reads the old key).
 */
export const STORAGE_KEYS = {
  onboarding: "closer.onboarding.v1",
  preferences: "closer.preferences.v1",
  progress: "closer.progress.v1",
  annotations: "closer.annotations.v1",
  checkIns: "closer.checkIns.v1",
} as const;

/**
 * Provider persistence hook.
 *
 * One function each provider can call to wire up load-on-mount +
 * save-on-change. Returns `hydrated` so the provider can avoid
 * writing defaults back over saved data during the brief window
 * before initial load completes.
 *
 *   const hydrated = usePersistence(STORAGE_KEYS.preferences, state, setState);
 *
 * Design notes:
 *   • Load runs once per mount. If nothing is saved, hydrated still
 *     flips true so subsequent writes start persisting.
 *   • Saves are NOT debounced. AsyncStorage is fast enough for the
 *     write volumes we have (a few tens per minute, max). If we
 *     ever see bottlenecks, swap in a simple trailing-edge debounce.
 *   • Saves are skipped while `enabled` is false — used by tests or
 *     for opt-out flows.
 */
export function usePersistence<T>(
  key: string,
  state: T,
  applyLoaded: (loaded: T) => void,
  options: { enabled?: boolean } = {},
): boolean {
  const enabled = options.enabled ?? true;
  const [hydrated, setHydrated] = useState(false);
  // Hold the latest applyLoaded in a ref so the load effect doesn't
  // need to depend on it (otherwise it re-runs every render, which
  // would double-load).
  const applyRef = useRef(applyLoaded);
  applyRef.current = applyLoaded;

  // Load once.
  useEffect(() => {
    if (!enabled) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    loadJSON<T>(key).then((loaded) => {
      if (cancelled) return;
      if (loaded !== null) applyRef.current(loaded);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  // Save on change — only after hydration so the very first render's
  // default state doesn't overwrite what was on disk.
  useEffect(() => {
    if (!hydrated || !enabled) return;
    saveJSON(key, state);
  }, [key, state, hydrated, enabled]);

  return hydrated;
}
