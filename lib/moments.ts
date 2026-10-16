/**
 * Daily moments — thin adapter over the year devotionals catalog.
 *
 * Historically this module loaded the 90-day Hook→Prayer sermon
 * vault. That vault is retired; callers still use `Moment` /
 * `findMomentByDay` / `useMoments().todaysMoment` so we keep the
 * surface names and point them at `lib/devotionals.ts`.
 */

import {
  DEVOTIONALS,
  type DevotionalDay,
  findDevotionalByDay,
  nextDevotional,
  previousDevotional,
  devotionalPosition,
  devotionalDurationMin,
  localDateISO,
  toHomeCard,
} from "@/lib/devotionals";
import {
  type SermonType,
  getSermonTypeById,
  SERMON_TYPES,
} from "@/constants/sermonTypes";

/** @deprecated Prefer `DevotionalDay`. Alias kept for call-site churn. */
export type Moment = DevotionalDay;

export type { DevotionalDay };

/** @deprecated Empty panel stub — old sermon panels are gone. */
export type SermonPanel = {
  id: number;
  label: string;
  isPrayer: boolean;
  body: string;
  practiceToday?: string;
};

export const MOMENTS: ReadonlyArray<Moment> = DEVOTIONALS;

export const findMomentByDay = findDevotionalByDay;
export const nextMoment = nextDevotional;
export const previousMoment = previousDevotional;
export const momentPosition = devotionalPosition;
export { localDateISO, toHomeCard };

/**
 * Resolve accent metadata for UI that still expects a SermonType.
 * Devotionals no longer carry a sermon-type field — always use
 * the default accent palette until stats/types are retired.
 */
export function resolveSermonType(_typeName?: string): SermonType {
  return getSermonTypeById("daily-church") ?? SERMON_TYPES[0]!;
}

const SHORT_LABEL: Record<string, string> = {
  "daily-church": "Daily Church", "jesus-only": "Jesus Only", "letters-struggling": "A struggling letter", "letters-grateful": "A grateful letter",
  "character-studies": "Character study", "deep-verse": "Deep verse", "misconceptions": "Misconception", "testimonies": "Testimony",
  "questions": "Hard question",
};
/** The category's name short enough for a card line, e.g. "Hard question". */
export function devotionalLabel(moment: Pick<Moment, "day">): string {
  const type = resolveSermonTypeForMoment(moment);
  return SHORT_LABEL[type.id] ?? type.name;
}

/** Devotional categories rotate by day: day 1 is Daily Church, day 2 Jesus Only, and round again every ten days. */
export function resolveSermonTypeForMoment(moment: Pick<Moment, "day">): SermonType {
  return SERMON_TYPES[((moment.day - 1) % SERMON_TYPES.length + SERMON_TYPES.length) % SERMON_TYPES.length] ?? resolveSermonType();
}

/**
 * Legacy helper — devotionals ship `reference` + `verse` split.
 * Accepts either a packed "Ref — text" string or a Moment-like
 * object with separate fields.
 */
export function splitScripture(
  raw: string | null | undefined | { reference: string; verse: string },
): {
  reference: string;
  text: string;
  raw: string;
} {
  if (raw && typeof raw === "object") {
    return {
      reference: raw.reference.trim(),
      text: raw.verse.trim(),
      raw: `${raw.reference} — ${raw.verse}`,
    };
  }
  const trimmed = (raw ?? "").trim();
  const match = trimmed.match(/^(.*?)\s+[—–-]\s+(.+)$/);
  if (!match) {
    return { reference: trimmed, text: "", raw: trimmed };
  }
  const reference = match[1]!.trim();
  const text = match[2]!
    .trim()
    .replace(/^['"‘“](.*?)['"’”]$/, "$1")
    .trim();
  return { reference, text, raw: trimmed };
}

export function momentDurationMin(moment: Moment): number {
  return devotionalDurationMin(moment);
}

export function panelDurationMin(panel: { body: string }): number {
  const words = panel.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}
