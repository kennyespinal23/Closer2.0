/**
 * Type declaration for `devotionals.json`.
 *
 * One entry per day of a 365-day year catalog. Replaces the old
 * Hook → Story → Turn → Landing → Prayer sermon vault.
 */

export type DevotionalDay = {
  /** 1-based day in the year catalog (1…365). */
  day: number;
  /** Short editorial title for lists / journey. */
  title: string;
  /** Scripture citation, e.g. `"Genesis 1:27"`. */
  reference: string;
  /** Full verse body. */
  verse: string;
  /** Narrative / story beat for the expanded card. */
  story: string;
  /** Reflective insight. */
  insight: string;
};

declare const DEVOTIONALS: ReadonlyArray<DevotionalDay>;
export default DEVOTIONALS;
