import { findBookById } from "@/constants/books";
import type { VerseRef } from "@/state/annotations";

/**
 * Shared formatting helpers used by the Notes / Highlights list
 * screens and the Insights preview cards.
 *
 * Kept tiny on purpose — both lists need the same "John 3:16 ·
 * 2 days ago" pattern and the same routing target, and we don't
 * want them drifting apart.
 */

/** "John 3:16" — or "Unknown 3:16" if the bookId is stale. */
export function formatRef(v: VerseRef): string {
  const book = findBookById(v.bookId);
  const name = book?.name ?? v.bookId;
  return `${name} ${v.chapter}:${v.verse}`;
}

/**
 * Route to send the user to when they tap a list item.
 *
 * Returned as `any` so this composes cleanly with Expo Router's
 * typed `Href` (its generic resolver doesn't infer string templates
 * built at runtime; the runtime string is still perfectly valid).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function routeForVerse(v: VerseRef): any {
  return `/book/${v.bookId}/${v.chapter}`;
}

/**
 * Compact relative time string for annotation timestamps.
 *
 *   < 60s     → "just now"
 *   < 60m     → "5m ago"
 *   < 24h     → "3h ago"
 *   same day  → "today"
 *   yesterday → "yesterday"
 *   < 7 days  → "3 days ago"
 *   < 365     → "Mar 12"
 *   else      → "Mar 12 2025"
 */
export function relativeTime(then: number, now: number = Date.now()): string {
  if (!then) return "";
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  // Day-based comparisons use local-date math, not millisecond
  // diffs, so "yesterday at 11pm" reads as "yesterday" and not
  // "1 day ago" or "today".
  const a = new Date(then);
  const b = new Date(now);
  const dayDiff = daysBetween(a, b);
  if (dayDiff === 0) {
    const hr = Math.floor(min / 60);
    return hr < 1 ? `${min}m ago` : `${hr}h ago`;
  }
  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  const sameYear = a.getFullYear() === b.getFullYear();
  const opts: Intl.DateTimeFormatOptions = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  return a.toLocaleDateString("en-US", opts);
}

function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}
