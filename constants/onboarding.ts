/**
 * The canonical order of onboarding steps.
 *
 * Adding a new step here automatically rebalances every screen's
 * progress bar. Each screen reads its own position via `progressFor()`.
 */
export const ONBOARDING_STEPS = [
  "name",
  "world",
  "faith",
  "journey",
  "intent",
  "scripture",
  "quiet",
  "account",
  "reminders",
  // "focus" closes the setup chain: the user has just picked their
  // morning trigger; this screen offers to guard the few minutes
  // that follow it. Lives between reminders and the paywall so the
  // story arc reads "we'll wake you → we'll quiet the noise →
  // here's the deal" without an awkward step shuffle.
  "focus",
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
