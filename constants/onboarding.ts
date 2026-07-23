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
 *      attribution → notifications → account → quietapps →
 *      paywall → home. Each screen advances the user from
 *      "interested" to "set up to actually use it tomorrow morning."
 *
 * Progress chrome shows on every step except atmospheric beats
 * that own the full screen (social-proof). Each screen that
 * shows the bar reads its own position via `progressFor()`.
 */
export const ONBOARDING_STEPS = [
  // Attribution first — source capture right after Get Started.
  "attribution",
  // Name — captured before demographics + Faith Check In.
  "name",
  // Age + gender.
  "about-you",
  // Faith Check In — replaces the old iMessage chat beat.
  "faith-check-in",
  // Social proof — atmospheric testimonial beat.
  "social-proof",
  // How Closer works — 3-step block → read → unlock walkthrough.
  "howitworks",
  // Personalize intro — bridge into the personalization questions.
  "personalize",
  "denomination",
  // Particular struggle / sin.
  "struggle",
  // Phone time before getting out of bed.
  "scrolltime",
  "waketime",
  // Building their personal Closer journey (progress + social proof).
  "creating-journey",
  "apps",
  "proof",
  "rating",
  "notifications",
  "account",
  "quietapps",
  "paywall",
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
