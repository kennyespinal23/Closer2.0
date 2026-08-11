/**
 * Daily devotionals — content loader for the year catalog.
 *
 * Reads `assets/data/devotionals.json` (365 days of
 * verse / story / insight) and exposes a small pure surface:
 *
 *   - `DevotionalDay` type
 *   - `DEVOTIONALS` — frozen catalog, day-ordered
 *   - `findDevotionalByDay(day)`
 *   - `nextDevotional(currentDay)` — advance with wrap
 *   - `devotionalPosition(day)` — "14 / 365"
 *   - `devotionalDurationMin(day)` — reading-time estimate
 *   - `localDateISO()` — YYYY-MM-DD local
 */

import DEVOTIONALS_RAW from "@/assets/data/devotionals.json";
import type { DevotionalDay } from "@/assets/data/devotionals";
import { natureBackdropQueryForDay } from "@/services/unsplashService";

export type { DevotionalDay };

function readCatalog(): ReadonlyArray<DevotionalDay> {
  if (!Array.isArray(DEVOTIONALS_RAW) || DEVOTIONALS_RAW.length === 0) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        "[devotionals] devotionals.json exported no array — falling back to empty",
      );
    }
    return [];
  }
  return DEVOTIONALS_RAW as ReadonlyArray<DevotionalDay>;
}

/** Full year catalog. Day 1 at index 0. */
export const DEVOTIONALS: ReadonlyArray<DevotionalDay> = readCatalog();

const BY_DAY: ReadonlyMap<number, DevotionalDay> = (() => {
  const map = new Map<number, DevotionalDay>();
  for (const d of DEVOTIONALS) map.set(d.day, d);
  return map;
})();

export function findDevotionalByDay(day: number): DevotionalDay | null {
  return BY_DAY.get(day) ?? null;
}

export function nextDevotional(currentDay: number | null): DevotionalDay {
  if (DEVOTIONALS.length === 0) {
    throw new Error("[devotionals] catalog is empty — cannot advance");
  }
  if (currentDay == null) return DEVOTIONALS[0]!;
  const i = DEVOTIONALS.findIndex((d) => d.day === currentDay);
  if (i < 0) return DEVOTIONALS[0]!;
  return DEVOTIONALS[(i + 1) % DEVOTIONALS.length]!;
}

/** Step back one catalog day (wrapping). Dev/QA cycle companion to next. */
export function previousDevotional(currentDay: number | null): DevotionalDay {
  if (DEVOTIONALS.length === 0) {
    throw new Error("[devotionals] catalog is empty — cannot step back");
  }
  if (currentDay == null) return DEVOTIONALS[DEVOTIONALS.length - 1]!;
  const i = DEVOTIONALS.findIndex((d) => d.day === currentDay);
  if (i < 0) return DEVOTIONALS[DEVOTIONALS.length - 1]!;
  return DEVOTIONALS[(i - 1 + DEVOTIONALS.length) % DEVOTIONALS.length]!;
}

export function devotionalPosition(
  day: number | null,
): { position: number; total: number } {
  const total = DEVOTIONALS.length;
  if (day == null) return { position: 0, total };
  const i = DEVOTIONALS.findIndex((d) => d.day === day);
  return { position: i < 0 ? 0 : i + 1, total };
}

export function localDateISO(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Reflective reading estimate from verse + story + insight. */
export function devotionalDurationMin(day: DevotionalDay): number {
  const total =
    countWords(day.verse) + countWords(day.story) + countWords(day.insight);
  const raw = Math.round(total / 150);
  return Math.min(12, Math.max(2, raw));
}

/**
 * Map a catalog day into the home card DTO the floating UI expects.
 * Illustration prompt is a curated nature/atmosphere Unsplash
 * query (never the sermon title — titles return random portraits).
 */
export function toHomeCard(day: DevotionalDay): {
  id: string;
  scriptureReference: string;
  scriptureText: string;
  story: string;
  insight: string;
  title: string;
  illustrationPrompt: string;
  day: number;
} {
  return {
    id: `day-${day.day}`,
    scriptureReference: day.reference,
    scriptureText: day.verse,
    story: day.story,
    insight: day.insight,
    title: day.title,
    illustrationPrompt: natureBackdropQueryForDay(day.day),
    day: day.day,
  };
}
