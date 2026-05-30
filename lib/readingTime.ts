/**
 * Reading-time estimation for the chapter reader.
 *
 * Uses a conservative ~200 WPM (the lower end of typical adult
 * silent reading speed) since scripture is denser than ordinary
 * prose — name lists, archaic syntax, footnote-y references all
 * slow people down a bit. Better to slightly overestimate than to
 * say "1 min left" while the user is still 4 minutes from done.
 */

const WORDS_PER_MINUTE = 200;

/**
 * Total estimated reading minutes for a chapter, rounded UP so we
 * never show "0 min" for a non-empty chapter.
 */
export function chapterMinutes(verses: { text: string }[]): number {
  if (!verses || verses.length === 0) return 0;
  let words = 0;
  for (const v of verses) {
    // Simple whitespace split; punctuation tagged onto a word
    // doesn't matter because we're estimating, not counting.
    words += v.text.trim().split(/\s+/).length;
  }
  const mins = words / WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(mins));
}

/**
 * Format a "time left" label from total minutes + a 0–1 progress
 * fraction. Keeps the copy tight: "3 min left", "<1 min left",
 * "Almost done" near the very end.
 */
export function timeLeftLabel(totalMinutes: number, progress: number): string {
  if (totalMinutes <= 0) return "";
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped >= 0.97) return "Almost done";
  const remaining = totalMinutes * (1 - clamped);
  if (remaining < 1) return "< 1 min left";
  return `${Math.ceil(remaining)} min left`;
}
