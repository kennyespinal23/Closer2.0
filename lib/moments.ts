/**
 * Daily moments — content loader for the sermon flow.
 *
 * Reads `assets/data/sermons.js` (a hand-edited 90-day vault) and
 * exposes a small, pure surface for the rest of the app:
 *
 *   - `Moment` type (the shape every sermon screen renders)
 *   - `MOMENTS` — frozen catalog, day-ordered (Day 1 → Day 90)
 *   - `findMomentByDay(day)` — O(1) lookup by 1-based day number
 *   - `nextMoment(currentDay)` — advance to the next day (wraps)
 *   - `momentPosition(day)` — "14 / 90" pair for dev UI
 *   - `resolveSermonType(typeName)` — JS `type` string → SermonType
 *   - `momentDurationMin(moment)` — derived reading-time estimate
 *   - `splitScripture(raw)` — break "Ref — 'text'" into ref + text
 *
 * The provider in `state/moments.tsx` composes these into the
 * persisted "today's moment" assignment; this module stays free of
 * React + AsyncStorage so it can be unit-tested without a runtime.
 *
 * Why no pools / emotion routing anymore?
 *   Earlier revisions of the JSON shipped a `global` pool plus a
 *   bundle of emotion-keyed pools, with date-based alternation
 *   between them. The current vault is a single ordered list of
 *   90 sermons authored to be read in sequence — the "rotation"
 *   is now just "today is day N → show sermon N". Mood check-ins
 *   no longer influence what sermon appears.
 */

import { SERMONS, type SermonRecord } from "@/assets/data/sermons.js";
import {
  type SermonType,
  getSermonTypeById,
  SERMON_TYPES,
} from "@/constants/sermonTypes";

// ─────────────────────────────────────────────────────────────────
// Types — what every consumer sees
// ─────────────────────────────────────────────────────────────────

/** Re-export the panel shape so screens can import from one place. */
export type { SermonPanel } from "@/assets/data/sermons.js";

/**
 * Internal alias for a sermon entry. Mirrors `SermonRecord` from
 * the .js exactly — kept under a friendlier name (`Moment`) for
 * the rest of the app, which is built around the "daily moment"
 * vocabulary.
 */
export type Moment = SermonRecord;

// ─────────────────────────────────────────────────────────────────
// Catalog — frozen at module load
// ─────────────────────────────────────────────────────────────────

/**
 * Validate that the loaded catalog matches what we expect. Logs a
 * dev warning on shape drift; production keeps running on the cast
 * so a single malformed entry can't black-out the home screen.
 */
function readCatalog(): ReadonlyArray<Moment> {
  if (!Array.isArray(SERMONS) || SERMONS.length === 0) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        "[moments] sermons.js exported no SERMONS array — falling back to empty",
      );
    }
    return [];
  }
  return SERMONS;
}

/** The full, ordered catalog. Day 1 lives at index 0. */
export const MOMENTS: ReadonlyArray<Moment> = readCatalog();

/** O(1) lookup map: `day (1-based)` → `Moment`. */
const MOMENT_BY_DAY: ReadonlyMap<number, Moment> = (() => {
  const map = new Map<number, Moment>();
  for (const m of MOMENTS) map.set(m.day, m);
  return map;
})();

// ─────────────────────────────────────────────────────────────────
// Lookups + navigation
// ─────────────────────────────────────────────────────────────────

/**
 * Re-hydrate a saved day-number back to the full `Moment`. Returns
 * null if the day is no longer in the catalog (content was removed
 * between releases) so the provider knows to re-roll.
 */
export function findMomentByDay(day: number): Moment | null {
  return MOMENT_BY_DAY.get(day) ?? null;
}

/**
 * Given a day number, return the NEXT moment in the catalog
 * (wrapping back to Day 1 at the end). Used by:
 *   • the daily-rollover effect in the provider
 *   • the dev "Next Sermon" shortcut on the home screen
 * If `currentDay` is null/unknown, returns Day 1.
 */
export function nextMoment(currentDay: number | null): Moment {
  if (MOMENTS.length === 0) {
    throw new Error("[moments] catalog is empty — cannot advance");
  }
  if (currentDay == null) return MOMENTS[0]!;
  const i = MOMENTS.findIndex((m) => m.day === currentDay);
  if (i < 0) return MOMENTS[0]!;
  const nextIdx = (i + 1) % MOMENTS.length;
  return MOMENTS[nextIdx]!;
}

/**
 * 1-based position of a moment in the catalog, paired with the
 * total. Returns `{ position: 0, total }` for an unknown day so
 * the dev pill can render "0 / 90" instead of crashing. Surfaced
 * for the home-screen dev pill so you always know where you are
 * during a content walkthrough.
 */
export function momentPosition(
  day: number | null,
): { position: number; total: number } {
  const total = MOMENTS.length;
  if (day == null) return { position: 0, total };
  const i = MOMENTS.findIndex((m) => m.day === day);
  return { position: i < 0 ? 0 : i + 1, total };
}

// ─────────────────────────────────────────────────────────────────
// Sermon-type resolution — JSON name → SermonType
// ─────────────────────────────────────────────────────────────────

/**
 * Explicit map from the JS catalog's `type` strings to our internal
 * `SermonType` ids. The catalog uses short display names ("Letters
 * - Struggling") while `SERMON_TYPES` uses the long-form
 * marketable names ("Letters From A Struggling Christian"), so
 * normalized string matching doesn't reach. A hand-maintained
 * lookup keeps the link explicit + grep-able when content evolves.
 *
 * Add a new entry here whenever the catalog gains a new type
 * string — `resolveSermonType` falls back gracefully if you miss
 * one, but the home card + intro screen will show the wrong
 * accent color until the entry exists.
 */
const TYPE_NAME_TO_ID: ReadonlyMap<string, string> = new Map([
  ["Daily Church", "daily-church"],
  ["Letters - Struggling", "letters-struggling"],
  ["Letters - Grateful", "letters-grateful"],
  ["Jesus Only", "jesus-only"],
  ["Questions", "questions"],
  ["Character Studies", "character-studies"],
  ["Misconceptions", "misconceptions"],
  ["Deep Verse Studies", "deep-verse"],
  ["Testimonies", "testimonies"],
  ["Prayer Nights", "prayer-nights"],
]);

/**
 * Resolve a moment's `type` field to a structured `SermonType`.
 * Falls back to `daily-church` if the name doesn't match anything
 * in the explicit map — keeps the UI renderable on bad input
 * rather than throwing. The first entry of `SERMON_TYPES` is the
 * second-tier fallback in case the constants file also changes.
 */
export function resolveSermonType(typeName: string): SermonType {
  const id = TYPE_NAME_TO_ID.get(typeName.trim());
  if (id) {
    const t = getSermonTypeById(id);
    if (t) return t;
  }
  return getSermonTypeById("daily-church") ?? SERMON_TYPES[0]!;
}

// ─────────────────────────────────────────────────────────────────
// Scripture parsing — "Ref — 'verse text'" → { reference, text }
// ─────────────────────────────────────────────────────────────────

/**
 * Three useful slices of a sermon's `scripture` string:
 *
 *   • `reference` — the citation, e.g. `"John 11:21"`
 *   • `text`      — the verse itself, with surrounding quotes
 *                   stripped, e.g. `"Lord, if You had been here…"`
 *   • `raw`       — the original full string, unmodified
 *
 * The catalog stores scripture as a single string with the
 * reference and the verse separated by an em-dash (or any of its
 * Unicode cousins) plus straight-or-curly quotes around the text.
 * We split lossily here so screens can render the two parts with
 * different typography; if the split fails (unexpected format),
 * we return the whole string as the reference and empty text so
 * nothing renders as a phantom blank line.
 */
export function splitScripture(raw: string): {
  reference: string;
  text: string;
  raw: string;
} {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.*?)\s+[—–-]\s+(.+)$/);
  if (!match) {
    return { reference: trimmed, text: "", raw: trimmed };
  }
  const reference = match[1]!.trim();
  // Strip a single layer of surrounding straight/curly quotes off
  // the text portion. The regex tolerates ASCII (' "), curly
  // singles (‘ ’), and curly doubles (“ ”).
  const text = match[2]!
    .trim()
    .replace(/^['"‘“](.*?)['"’”]$/, "$1")
    .trim();
  return { reference, text, raw: trimmed };
}

// ─────────────────────────────────────────────────────────────────
// Duration estimate — derived because the catalog doesn't ship one
// ─────────────────────────────────────────────────────────────────

/**
 * Rough reading-time estimate in minutes for a full moment.
 *
 * Combines two cost terms:
 *   1. Word-count time at ~150 wpm — a quiet, unhurried pace.
 *      Faster than retention reading, slower than skimming.
 *      Closer is meant to be reflective, so we lean slow.
 *   2. A per-panel "settle" beat of ~12 seconds. Each panel has
 *      a fade-in animation, a Continue tap, and a slide transition
 *      before the next panel starts. With 5 panels that adds
 *      up to roughly a minute of friction time that pure
 *      words-per-minute formulas miss.
 *
 * The result is clamped 3..12 so the home card never shows "0
 * min" or a wildly long duration on outlier content.
 *
 * On the current catalog (503..610 words across 90 sermons), this
 * lands every entry at ~5 min — honest for a quiet morning read
 * but small enough to feel attainable "before you open Instagram."
 *
 * Exposed here (rather than computed inline at every call site)
 * so the home card, the intro screen, and the progress meter
 * always agree on the duration. If we ever tune the formula,
 * every surface shifts together.
 */
export function momentDurationMin(moment: Moment): number {
  const scriptureWords = countWords(moment.scripture);
  const panelWords = moment.panels.reduce(
    (sum, p) => sum + countWords(p.body),
    0,
  );
  const total = scriptureWords + panelWords;
  // ~150 wpm reading + ~12s per panel for tap/animation friction
  const readingMin = total / 150;
  const settleMin = moment.panels.length * (12 / 60);
  const raw = Math.round(readingMin + settleMin);
  return Math.min(12, Math.max(3, raw));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────
// Date helpers — unchanged from the previous revision
// ─────────────────────────────────────────────────────────────────

/**
 * YYYY-MM-DD in local time. Matches the dateISO convention used
 * throughout state/progress.tsx + state/checkIns.tsx so day-key
 * comparisons are apples-to-apples.
 */
export function localDateISO(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
