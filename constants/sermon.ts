/**
 * Canonical order of the *in-sermon* steps.
 *
 * The intro screen is intentionally NOT in this list — it's an antechamber
 * that runs before the sermon proper, with no progress indicator.
 *
 * Adding a step here automatically rebalances every screen's progress bar.
 */
export const SERMON_STEPS = [
  "scripture",
  "reflection-1",
  "reflection-2",
  "application",
  "closing",
] as const;

export type SermonStep = (typeof SERMON_STEPS)[number];

/**
 * Returns 0..1 progress for the given sermon step (1-indexed / total).
 * Unknown steps return 0 — defensive default for hot-reload edge cases.
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
 * Mock sermon metadata. Eventually this comes from a CMS/API keyed by
 * (date, user). For now we hardcode the home screen's "today's sermon"
 * so the routes can render without backend wiring.
 *
 * The `typeId` references a SermonType from `constants/sermonTypes.ts`.
 * The type itself is selected by a daily rotation, so the home card +
 * intro screen pull the hero and accent color from there.
 */
export const TODAYS_SERMON = {
  id: "drawing-near-in-the-noise",
  typeId: "daily-church",
  title: "Drawing Near in the Noise",
  subtitle: "On finding stillness when the world refuses to slow down.",
  pastor: "Pastor Mike Hayes",
  durationMin: 12,
  anchor: {
    text: "Be still, and know that I am God.",
    reference: "Psalm 46:10",
  },
} as const;
