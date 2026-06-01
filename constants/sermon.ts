/**
 * Canonical order of the *in-sermon* panels.
 *
 * The intro screen is intentionally NOT in this list — it's an
 * antechamber that runs before the sermon proper, with no progress
 * indicator. The progress bar inside the flow fills across these
 * five panels in order.
 *
 * Mirrors the `panels` array in `assets/data/sermons.js`: every
 * moment ships with exactly five panels — Hook → Story → Turn →
 * Landing → Prayer — and `isPrayer: true` flags the final panel
 * so the renderer can apply the atmospheric blue treatment.
 *
 * The ids here line up 1:1 with each panel's `label` (lowercased
 * + dashed), so consumers can compute a progress percentage from
 * either the panel index (1..5) or the canonical step name.
 *
 * Adding a step rebalances every panel screen's progress bar via
 * `sermonProgressFor`.
 */
export const SERMON_STEPS = [
  "hook",
  "story",
  "turn",
  "landing",
  "prayer",
] as const;

export type SermonStep = (typeof SERMON_STEPS)[number];

/**
 * Returns 0..1 progress for the given sermon step (1-indexed /
 * total). Unknown steps return 0 — defensive default for
 * hot-reload edge cases.
 */
export function sermonProgressFor(step: SermonStep): number {
  const i = SERMON_STEPS.indexOf(step);
  if (i < 0) return 0;
  return (i + 1) / SERMON_STEPS.length;
}

/**
 * Returns a 1-indexed step number for display (e.g. "Step 2 of 5").
 */
export function sermonStepNumber(step: SermonStep): {
  index: number;
  total: number;
} {
  return {
    index: SERMON_STEPS.indexOf(step) + 1,
    total: SERMON_STEPS.length,
  };
}

/**
 * Translate a panel id (1..5, from `sermons.js`) to the canonical
 * step name. Used by the dynamic panel route to thread its `id`
 * URL segment through `sermonProgressFor`. Returns null for an
 * out-of-range id so the caller can show a "no such panel" fallback.
 */
export function stepForPanelId(panelId: number): SermonStep | null {
  const i = panelId - 1;
  if (i < 0 || i >= SERMON_STEPS.length) return null;
  return SERMON_STEPS[i]!;
}
