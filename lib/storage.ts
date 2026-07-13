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
  readingGoal: "closer.readingGoal.v1",
  savedInsights: "closer.savedInsights.v1",
  /**
   * Sermons the user has tapped Save on (from the celebration
   * screen). Persisted across launches so the Library tab's
   * "Saved" rail reflects everything they've kept for later
   * re-reading. Stored as an array of 1-based catalog day
   * numbers (1..90) in save order — same shape pattern as
   * savedInsights.
   */
  savedSermons: "closer.savedSermons.v1",
  /**
   * Daily-moment provider state — last assignment (date + 1-based
   * catalog day). See state/moments.tsx for the shape. Bumped
   * separately from the rest because the moment-rotation logic
   * has churned the most as we tune the content system.
   *
   * v1 → v2: dropped per-pool no-repeat cursor + emotion routing
   * after the catalog moved to a single ordered 90-sermon vault.
   * The persisted moment id was a string ("g017") in v1 and is
   * now an integer day (1..90) in v2 — incompatible at the value
   * level, hence a fresh key so old saves are ignored cleanly.
   */
  moments: "closer.moments.v2",
  /**
   * User's appearance preference: `"system" | "dark" | "light"`.
   * Lives in its own key so a future palette migration can be a
   * one-line bump without touching unrelated preferences.
   */
  theme: "closer.theme.v1",
  /**
   * The notification id of the currently-scheduled daily "Before The
   * Noise" reminder. We persist it so that when the user reschedules
   * (changes time / toggles off and on) we can cancel the old one by
   * id instead of cancelling everything and risking a clobber of
   * unrelated notifications.
   */
  beforeNoiseNotificationId: "closer.beforeNoise.notificationId.v1",
  /**
   * Index into HOME_FLOATING_PROMPTS — advances once per cold open
   * so the home center line rotates through the list.
   */
  homeFloatingPromptIndex: "closer.homeFloatingPromptIndex.v1",
  /**
   * Index into HOME_FLOATING_CARDS — advances once per cold open so
   * the auto-presented scripture card rotates through the deck.
   */
  homeFloatingCardIndex: "closer.homeFloatingCardIndex.v1",
  /**
   * Focus-mode state — the Opal-style "social media is blocked while
   * I read scripture" feature. Persists both the user's preferences
   * (which apps to block, whether focus is enabled at all) and the
   * currently-active session if any. Persisting the session means a
   * crash mid-sermon doesn't strand the user in a "blocked"-looking
   * state with no way to end it.
   *
   * v1 is a Phase-1 in-app stub — the actual OS-level shield arrives
   * in a Phase-2 module bump and may or may not require a schema
   * change. Keeping the version separate from preferences/onboarding
   * means we can iterate on the focus shape without bumping unrelated
   * data.
   */
  focus: "closer.focus.v1",
  /**
   * Scheduled "Bible study sessions" — user-configurable, recurring
   * times when the app schedules a local notification AND offers to
   * start a focus session for reading. Each session persists:
   *   • metadata (name, time, days-of-week, enabled flag)
   *   • the OS notification ids that back it (one per active day)
   *
   * The notification ids are persisted so we can cancel them
   * precisely when a session is edited / disabled / deleted — without
   * blowing away unrelated scheduled notifications (Before The Noise,
   * future verse-of-day, etc.). On a re-install or storage wipe we
   * lose the ids and a few stale notifications may linger until the
   * OS expires them; that's fine for the first version.
   */
  studySessions: "closer.studySessions.v1",
  /**
   * Whether the "Developer tools" panel on the Today screen is
   * surfaced for this install. Local-dev (`__DEV__`) builds default
   * to ON regardless; production builds default to OFF. The toggle
   * lives in Settings → Developer Tools so internal testers /
   * teammates on a production-channel install can opt in without
   * needing a custom build, while real users see a clean Today
   * screen by default.
   */
  devTools: "closer.devTools.v1",
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
