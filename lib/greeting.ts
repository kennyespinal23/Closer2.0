/**
 * Time-of-day greeting helper.
 *
 * Returns the appropriate greeting line + emoji for the current
 * local hour, so the home page's welcome line responds to time
 * of day instead of repeating a static "Welcome back" string.
 *
 * Buckets are aligned with how iOS itself segments the day in
 * Focus Modes and Apple Health's Summary screen:
 *
 *   05:00 – 11:59   morning     ☀️
 *   12:00 – 16:59   afternoon   ☀️
 *   17:00 – 20:59   evening     🌙
 *   21:00 – 04:59   night       🌙
 *
 * The morning / afternoon split shares the sun glyph (one
 * "daytime" symbol) and the evening / night split shares the
 * moon glyph (one "nighttime" symbol) — two unique emojis,
 * four unique greetings. This keeps the visual vocabulary
 * stable across the day while the WORDS change every six
 * hours, which is the cue the user actually feels.
 *
 * Accepts an optional `Date` so callers in tests can fix the
 * hour without mocking the system clock; defaults to "now."
 */

export type Greeting = {
  /** The localized greeting line, e.g. "Good morning". */
  text: string;
  /** A single emoji glyph paired with the greeting in the UI. */
  emoji: string;
  /** Coarse time-of-day bucket. Useful when callers want to
   *  branch on the bucket (e.g. a different illustration) rather
   *  than compute the hour themselves. */
  bucket: "morning" | "afternoon" | "evening" | "night";
};

/**
 * Compute today's greeting given a Date (defaults to current time).
 * Pure function — no side effects, safe to call at render time
 * inside a `useMemo` keyed on the calendar minute if needed.
 */
export function getGreeting(now: Date = new Date()): Greeting {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", emoji: "☀️", bucket: "morning" };
  }
  if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", emoji: "☀️", bucket: "afternoon" };
  }
  if (hour >= 17 && hour < 21) {
    return { text: "Good evening", emoji: "🌙", bucket: "evening" };
  }
  return { text: "Good night", emoji: "🌙", bucket: "night" };
}
