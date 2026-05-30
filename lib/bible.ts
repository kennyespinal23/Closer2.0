/**
 * Thin wrapper around bible-api.com.
 *
 * Why this service:
 *   • Free, no API key, no rate-limit gymnastics for our scale
 *   • Public-domain translations (WEB, KJV, BBE, OEB-CW, WEBBE)
 *   • Returns clean JSON with per-verse text
 *
 * Translation choice is now exposed — see the optional `translation`
 * arg on `fetchChapter`. The cache is keyed per-translation so
 * switching versions doesn't trash already-loaded chapters in the
 * other versions.
 */

import { findBookById } from "@/constants/books";
import type { TranslationId } from "@/state/preferences";

export type Verse = {
  /** 1-indexed verse number within the chapter. */
  number: number;
  /** Raw text as it came from the API. May contain "\n" for poetry. */
  text: string;
};

export type Chapter = {
  /** Human-readable reference, e.g. "Psalms 23". */
  reference: string;
  verses: Verse[];
  /** Translation name returned by the API. */
  translation: string;
  /** Short copyright/credit string from the API. */
  translationNote: string;
};

const API_BASE = "https://bible-api.com";
const DEFAULT_TRANSLATION: TranslationId = "web";

/**
 * Per-book verse counts for the five single-chapter books in the
 * canon. Needed because bible-api.com requires an explicit verse
 * range to return the entire "chapter" for these books — see the
 * comment in `fetchChapter` for details.
 */
const SINGLE_CHAPTER_VERSES: Record<string, number> = {
  obadiah: 21,
  philemon: 25,
  "2-john": 13,
  "3-john": 14,
  jude: 25,
};

// In-memory cache. Chapters never change, so caching them for the
// session avoids re-fetching the same chapter when a user toggles
// between prev/next. Keyed by `${translation}-${bookId}-${chapter}`
// so the same chapter in two translations stays cached separately.
const cache = new Map<string, Chapter>();

/**
 * Map our internal book slug → the format bible-api.com expects.
 *
 * Our slugs use hyphens (`1-corinthians`, `song-of-solomon`) and
 * bible-api wants plus-delimited names (`1+corinthians`). A few
 * book IDs need explicit aliases because the service uses different
 * canonical names than we do.
 */
function toApiBook(bookId: string): string {
  const aliases: Record<string, string> = {
    // bible-api uses "song of songs" as the canonical name
    "song-of-solomon": "song+of+solomon",
  };
  return aliases[bookId] ?? bookId.replace(/-/g, "+");
}

export async function fetchChapter(
  bookId: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<Chapter> {
  const cacheKey = `${translation}-${bookId}-${chapter}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const book = findBookById(bookId);
  if (!book) {
    throw new Error(`Unknown book "${bookId}"`);
  }
  if (chapter < 1 || chapter > book.chapters) {
    throw new Error(
      `${book.name} has ${book.chapters} chapters — no chapter ${chapter}.`,
    );
  }

  // bible-api.com quirk: for single-chapter books it treats `book+N`
  // as verse N rather than chapter N (because the book only has one
  // chapter, the second number is unambiguous). And `book` alone
  // 404s. The only way to get the whole "chapter" is an explicit
  // verse range, so we hard-code each book's verse count.
  const url =
    book.chapters === 1
      ? `${API_BASE}/${toApiBook(bookId)}+1:1-${SINGLE_CHAPTER_VERSES[bookId] ?? 200}?translation=${translation}`
      : `${API_BASE}/${toApiBook(bookId)}+${chapter}?translation=${translation}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    // Network failure (no internet, DNS, etc.) surfaces as a TypeError
    // in React Native. Wrap it in something the UI can show verbatim.
    throw new Error("Couldn't reach Scripture. Check your connection.");
  }

  if (!res.ok) {
    throw new Error(`Couldn't load this chapter (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as {
    reference: string;
    verses: { verse: number; text: string }[];
    translation_name: string;
    translation_note: string;
  };

  const result: Chapter = {
    reference: data.reference,
    // The API sometimes returns verses with trailing whitespace and/or
    // line breaks (the latter for poetry). We trim trailing space but
    // keep the inner "\n" so Psalms etc. render with their stanzas.
    verses: data.verses.map((v) => ({
      number: v.verse,
      text: v.text.trim(),
    })),
    translation: data.translation_name,
    translationNote: data.translation_note,
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Pre-warm the cache for the next/previous chapter so navigation
 * feels instant. Fire-and-forget — failures are silent because this
 * is purely an optimization.
 */
export function prefetchChapter(
  bookId: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
): void {
  fetchChapter(bookId, chapter, translation).catch(() => {
    /* prefetch failure is non-fatal */
  });
}
