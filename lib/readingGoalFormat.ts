/**
 * Shared formatters for the reading-goal surfaces.
 *
 * Used by:
 *   • The home-screen ReadingRingCard
 *   • The reading-goal detail screen (/reading-goal)
 *
 * Lives in lib/ so both pages can pull the same logic without one
 * page importing the other (which would be a layering smell).
 */

/**
 * Render today's accumulated minutes as a glanceable number.
 *
 *   • ≥ 1 whole minute → integer ("4") or M:SS when there's fraction ("4:30")
 *   • 0 < m < 1        → "0:SS" so the early seconds of a reading
 *                        session still feel alive on the display
 *   • 0                → "0"
 */
export function formatMinutes(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return "0";
  if (m < 1) {
    const seconds = Math.round(m * 60);
    return `0:${String(seconds).padStart(2, "0")}`;
  }
  const whole = Math.floor(m);
  const seconds = Math.round((m - whole) * 60);
  if (seconds === 0) return String(whole);
  return `${whole}:${String(seconds).padStart(2, "0")}`;
}

/**
 * One-line copy that contextualizes the metric — encouraging at 0,
 * specific in the middle, celebratory once reached. Designed to fit
 * in a 2-line caption beneath the ring.
 *
 * When reached, we also fold the actual total time into the copy so
 * the user sees their day at a glance ("You read for 12 min today —
 * goal honored.") rather than a bare congratulation that hides the
 * stat. Pairs with the home pill's "Completed" headline + the
 * detail screen's hero ring which already shows raw minutes inside.
 */
export function formatRemaining(
  minutes: number,
  goal: number,
  reached: boolean,
): string {
  if (reached) {
    return `You read for ${formatMinutes(minutes)} today — goal honored.`;
  }
  if (minutes <= 0) {
    return `Spend ${goal} minutes near Scripture today.`;
  }
  const remaining = Math.max(0, goal - minutes);
  if (remaining < 1) return "Less than a minute to today's goal.";
  const rounded = Math.ceil(remaining);
  return `${rounded} ${rounded === 1 ? "minute" : "minutes"} to today's goal.`;
}
