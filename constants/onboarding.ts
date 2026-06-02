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
  // The setup chain ends with three connected screens, narrating
  // the daily ritual end-to-end:
  //   reminders → study → focus
  //
  // 1. "reminders" picks WHEN the daily sermon arrives (passive —
  //    a notification fires).
  // 2. "study" picks the active sit-down time the user commits to
  //    reading on their own. App seeds it as a system routine in
  //    the Practice tab so the user can tune it from day one.
  // 3. "focus" introduces the silencing layer that protects the
  //    minutes both rituals occupy.
  //
  // Each screen lays the foundation for the next — by the time the
  // user reaches paywall, the daily rhythm is fully set up.
  "reminders",
  "study",
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
