/**
 * The canonical order of onboarding steps.
 *
 * The flow is designed in three narrative beats:
 *
 *   1. The Audit (Screens 1–5)
 *      No branding. Black canvas. We name the cost of the morning
 *      scroll, gather four short data points, and run a fake
 *      "calculating" beat to set up the reveal.
 *
 *   2. The Pivot (Screens 6–10)
 *      Personalized gut punch using their own data → emotional
 *      anchor (why) → name → social proof → rating prompt. Still
 *      pre-brand; we haven't shown the Closer name once.
 *
 *   3. The Welcome (Screens 11–17)
 *      The Closer wordmark appears for the first time on the
 *      reframe screen. From here the flow narrows to setup:
 *      attribution → notifications → account → time → paywall →
 *      first scripture. Each screen advances the user from
 *      "interested" to "set up to actually use it tomorrow morning."
 *
 * The progress bar is hidden for Screens 1–10 (the chrome would
 * give the brand away) and revealed from Screen 11 onward; each
 * file controls that locally.
 *
 * Adding a new step here automatically rebalances the progress
 * bar wherever it IS shown. Each screen reads its own position
 * via `progressFor()`.
 */
export const ONBOARDING_STEPS = [
  // The Audit — pre-brand, full-bleed black canvas.
  "stat",
  "apps",
  "scrolltime",
  "waketime",
  "calculating",
  // The Pivot — personalized punch, anchor, name, proof.
  "punch",
  "why",
  "name",
  "proof",
  "rating",
  // The Welcome — Closer is named for the first time.
  "reframe",
  "attribution",
  "notifications",
  "account",
  "time",
  "paywall",
  "welcome",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * Returns 0..1 progress for the given step (1-indexed / total).
 * Unknown steps return 0 — defensive default for hot-reload edge cases.
 */
export function progressFor(step: OnboardingStep): number {
  const index = ONBOARDING_STEPS.indexOf(step);
  if (index < 0) return 0;
  return (index + 1) / ONBOARDING_STEPS.length;
}
