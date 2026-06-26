import { loadJSON, saveJSON } from "@/lib/storage";
import {
  getTimeCategory,
  todayDateString,
  type RotatingMomentCategory,
} from "@/lib/rotatingMoments";

/** Exact AsyncStorage keys specified for the rotating-moments feature. */
export const ROTATING_MOMENT_KEYS = {
  lastShown: "lastMomentShown",
  saved: "savedMoments",
} as const;

/**
 * Dev-only: show the rotating moment on every cold launch so the
 * swipe-up beat can be tested without clearing `lastMomentShown`.
 * Stripped from production bundles (`__DEV__` is false at ship).
 */
const DEV_ALWAYS_SHOW_ROTATING_MOMENT = __DEV__;

export type LastMomentShown = {
  date: string;
  category: RotatingMomentCategory;
};

export type SavedRotatingMoment = {
  id: string;
  body: string;
  reference: string | null;
  category: RotatingMomentCategory;
  savedAtISO: string;
};

export async function loadLastMomentShown(): Promise<LastMomentShown | null> {
  return loadJSON<LastMomentShown>(ROTATING_MOMENT_KEYS.lastShown);
}

export async function shouldShowRotatingMoment(
  now = new Date(),
): Promise<boolean> {
  if (DEV_ALWAYS_SHOW_ROTATING_MOMENT) return true;

  const category = getTimeCategory();
  const today = todayDateString(now);
  const last = await loadLastMomentShown();
  return !(last?.date === today && last?.category === category);
}

export async function markRotatingMomentShown(
  now = new Date(),
): Promise<void> {
  // Dev always-show mode skips persistence so testers aren't fighting
  // the once-per-window bookkeeping while iterating on the screen.
  if (DEV_ALWAYS_SHOW_ROTATING_MOMENT) return;

  await saveJSON<LastMomentShown>(ROTATING_MOMENT_KEYS.lastShown, {
    date: todayDateString(now),
    category: getTimeCategory(),
  });
}

export async function loadSavedRotatingMoments(): Promise<
  ReadonlyArray<SavedRotatingMoment>
> {
  const raw = await loadJSON<ReadonlyArray<SavedRotatingMoment>>(
    ROTATING_MOMENT_KEYS.saved,
  );
  return Array.isArray(raw) ? raw : [];
}

export async function saveRotatingMoment(
  entry: SavedRotatingMoment,
): Promise<void> {
  const existing = await loadSavedRotatingMoments();
  if (existing.some((m) => m.id === entry.id)) return;
  await saveJSON(ROTATING_MOMENT_KEYS.saved, [...existing, entry]);
}

export async function isRotatingMomentSaved(id: string): Promise<boolean> {
  const existing = await loadSavedRotatingMoments();
  return existing.some((m) => m.id === id);
}
