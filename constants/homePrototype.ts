/**
 * Home card layout flags + shared DTOs.
 *
 * Day content itself lives in `assets/data/devotionals.json`
 * (loaded via `lib/devotionals.ts`). This file only holds home
 * chrome prompts and the floating-card DTO shape.
 */

/** When true, Home uses the card unlock shell (vs legacy hero). */
export const HOME_CARD_PROTOTYPE = true;

/** Center home prompts — advance one step each time the app opens. */
export const HOME_FLOATING_PROMPTS = [
  "Seek Him first.",
  "Trust His process.",
  "Let faith arise.",
  "Peace is a person.",
  "Choose joy today.",
  "His love endures.",
  "Be the light.",
  "Pray without ceasing.",
  "Walk by faith.",
  "God is with us.",
  "Forgiven and free.",
] as const;

/** Today's scripture card — single-card home layout. */
export type FloatingScriptureCard = {
  id: string;
  /** Catalog day (1…365) — stamped onto completions. */
  day: number;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  story: string;
  insight: string;
  illustrationPrompt: string;
};
