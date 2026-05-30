/**
 * Daily Reading Challenge.
 *
 * A curated rotation of 30 meaningful chapters. The day's reading is
 * picked deterministically by date so everyone reading Closer on the
 * same day gets the same chapter.
 *
 * Why 30 and not 365:
 *   • Short enough to feel cohesive (someone returning after a month
 *     starts seeing chapters they remember)
 *   • Long enough that no chapter repeats in a typical month of use
 *   • Curated, not exhaustive — these are gateway chapters, not a
 *     scholarly survey
 *
 * The list intentionally spans the canon: Law, Wisdom, Prophets,
 * Gospels, Epistles. Pacing alternates between Old and New Testament
 * so a 30-day rhythm feels like a journey, not a slog through one
 * book.
 */

import { findBookById } from "@/constants/books";

export type DailyReading = {
  /** Slug matching a Book in constants/books.ts. */
  bookId: string;
  chapter: number;
  /** Quiet one-line context for the home screen card. */
  invitation: string;
};

const PLAN: DailyReading[] = [
  { bookId: "john",            chapter: 1,   invitation: "In the beginning was the Word." },
  { bookId: "psalms",          chapter: 23,  invitation: "The Lord is my shepherd." },
  { bookId: "genesis",         chapter: 1,   invitation: "How the world began." },
  { bookId: "matthew",         chapter: 5,   invitation: "The Beatitudes." },
  { bookId: "romans",          chapter: 8,   invitation: "Life in the Spirit." },
  { bookId: "psalms",          chapter: 139, invitation: "Known, fully, by God." },
  { bookId: "1-corinthians",   chapter: 13,  invitation: "The shape of love." },
  { bookId: "isaiah",          chapter: 53,  invitation: "The suffering servant." },
  { bookId: "philippians",     chapter: 4,   invitation: "Joy in every season." },
  { bookId: "john",            chapter: 3,   invitation: "Born again, by night." },
  { bookId: "proverbs",        chapter: 3,   invitation: "Trust, with all your heart." },
  { bookId: "ephesians",       chapter: 6,   invitation: "Stand firm. The armor of God." },
  { bookId: "luke",            chapter: 15,  invitation: "The lost are sought." },
  { bookId: "psalms",          chapter: 51,  invitation: "Create in me a clean heart." },
  { bookId: "james",           chapter: 1,   invitation: "Trials, wisdom, the patient road." },
  { bookId: "john",            chapter: 14,  invitation: "Let not your heart be troubled." },
  { bookId: "exodus",          chapter: 14,  invitation: "Crossing through the sea." },
  { bookId: "matthew",         chapter: 6,   invitation: "How to pray. Where treasure lies." },
  { bookId: "ecclesiastes",    chapter: 3,   invitation: "A time for everything." },
  { bookId: "romans",          chapter: 12,  invitation: "A living sacrifice." },
  { bookId: "psalms",          chapter: 1,   invitation: "Two ways. One blessed." },
  { bookId: "john",            chapter: 17,  invitation: "Jesus prays for us." },
  { bookId: "1-john",          chapter: 4,   invitation: "God is love." },
  { bookId: "isaiah",          chapter: 40,  invitation: "Comfort, comfort, my people." },
  { bookId: "matthew",         chapter: 28,  invitation: "He is risen — go." },
  { bookId: "hebrews",         chapter: 11,  invitation: "By faith, they walked." },
  { bookId: "psalms",          chapter: 121, invitation: "Help comes from the hills." },
  { bookId: "galatians",       chapter: 5,   invitation: "Fruit of the Spirit." },
  { bookId: "revelation",      chapter: 21,  invitation: "A new heaven, a new earth." },
  { bookId: "philippians",     chapter: 2,   invitation: "He humbled himself." },
];

if (process.env.NODE_ENV !== "production") {
  // Sanity-check that every reading actually points at a real book +
  // valid chapter. Cheap one-time check so a typo upstream surfaces
  // immediately in dev rather than as a 404 in the reader.
  for (const r of PLAN) {
    const book = findBookById(r.bookId);
    if (!book) {
      throw new Error(`reading.ts: unknown book "${r.bookId}"`);
    }
    if (r.chapter < 1 || r.chapter > book.chapters) {
      throw new Error(
        `reading.ts: ${book.name} has ${book.chapters} chapters; got ${r.chapter}`,
      );
    }
  }
}

/**
 * Picks today's reading deterministically from the plan.
 *
 * The index is `(day-of-year + year) mod 30` — adding the year so a
 * user who's been using the app for months doesn't see the exact
 * same Jan 1 reading every January 1.
 */
export function getTodaysReading(now: Date = new Date()): DailyReading {
  return PLAN[getTodaysReadingIndex(now)];
}

/**
 * Zero-based position of today's reading inside the 30-day rotation.
 * Exposed so UI surfaces can show "Day X of 30" without recomputing
 * the date math themselves.
 */
export function getTodaysReadingIndex(now: Date = new Date()): number {
  const dayOfYear = getDayOfYear(now);
  const year = now.getFullYear();
  return (dayOfYear + year) % PLAN.length;
}

/**
 * Number of readings in the plan. Exposed for the insights tab to
 * say things like "Day 12 of 30 in your rotation".
 */
export const READING_PLAN_LENGTH = PLAN.length;

function getDayOfYear(d: Date): number {
  // Jan 1 = day 1, Jan 2 = day 2, etc. Local time so the boundary
  // matches the user's calendar, not UTC.
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
