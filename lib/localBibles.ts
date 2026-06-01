/**
 * Local Bible registry.
 *
 * The runtime Bible loader in `lib/bible.ts` consults this registry
 * BEFORE hitting bible-api.com. Two reasons:
 *   1. Translations the public API doesn't serve (e.g. NWT, ESV, NIV
 *      — all copyrighted) can still be read by bundling the JSON
 *      locally. Users source the text themselves from their licensed
 *      copy and drop it in.
 *   2. Bundled translations work offline. Even WEB — which the API
 *      DOES serve — benefits from local caching: chapter transitions
 *      become instantaneous and the reader keeps working on airplane
 *      mode.
 *
 * ─────────────────────────────────────────────────────────────────
 * File format
 * ─────────────────────────────────────────────────────────────────
 * Each translation/book pair lives at
 *   `assets/bibles/<translation-id>/<book-slug>.json`
 *
 * with this shape (TypeScript-validated by `LocalBookFile` below):
 *
 *   {
 *     "bookId": "john",
 *     "translation": "web",
 *     "translationName": "World English Bible",
 *     "chapters": [
 *       { "chapter": 1, "verses": [{ "number": 1, "text": "..." }, ...] },
 *       ...
 *     ]
 *   }
 *
 * Translation id MUST match a `TranslationId` from
 * `state/preferences.tsx`. Book slug MUST match a `Book.id` from
 * `constants/books.ts`. Chapter numbers are 1-indexed and must cover
 * the full canonical chapter count for the book; missing chapters
 * surface as "chapter not bundled" errors in the reader.
 *
 * To bundle a public-domain translation (WEB, KJV, BBE, OEB-CW,
 * WEBBE), run
 *   node scripts/fetchBibleBook.mjs <book> <translation>
 * which pulls from bible-api.com and writes the JSON in this format.
 *
 * To bundle a copyrighted translation (NWT, ESV, NIV, etc.), you must
 * provide the text yourself from your licensed copy. Closer does NOT
 * ship copyrighted translations.
 * ─────────────────────────────────────────────────────────────────
 */

import type { TranslationId } from "@/state/preferences";

/** A single verse inside a chapter. */
export type LocalVerse = {
  number: number;
  text: string;
};

/** One chapter — the unit the reader requests at a time. */
export type LocalChapter = {
  chapter: number;
  verses: LocalVerse[];
};

/** A full bundled book file as it lives on disk. */
export type LocalBookFile = {
  bookId: string;
  translation: TranslationId;
  translationName: string;
  chapters: LocalChapter[];
};

/**
 * Registry of bundled translation/book pairs.
 *
 * The Metro bundler resolves `require()` statically at build time, so
 * every JSON file we want available at runtime MUST be referenced here
 * by literal path. Dynamic strings won't work — that's a Metro
 * constraint, not a Closer one.
 *
 * Structure: `{ [translation]: { [bookId]: () => LocalBookFile } }`.
 * We use thunks so the underlying JSON isn't evaluated until the first
 * lookup — keeps cold-start cheap when the user is reading from a
 * translation that doesn't happen to need any local file.
 *
 * The NWT entry intentionally has no books registered — that
 * translation is local-only (no API support) and the text is
 * copyrighted, so users supply their own JSON. When NWT is selected
 * and a chapter isn't bundled, `lib/bible.ts` raises a helpful
 * "needs install" error that the reader catches and presents as an
 * empty state.
 */
const REGISTRY: Partial<
  Record<TranslationId, Record<string, () => LocalBookFile>>
> = {
  // World English Bible — full Protestant canon (66 books, 1189
  // chapters, 31103 verses), pre-bundled. Fetched via
  // `scripts/fetchBibleBook.mjs --all web` from the public-domain
  // WEB served by bible-api.com. Adds roughly 6 MB to the app
  // bundle but in exchange the entire scripture works offline and
  // every chapter transition is instant (no spinner, no network).
  //
  // Book ids MUST match the slugs in `constants/books.ts` — the
  // reader resolves `book.id` against this map at lookup time.
  // Entries are ordered canonically (OT then NT, Genesis →
  // Revelation) so the file reads like a table of contents.
  web: {
    // Old Testament — The Law
    genesis: () => require("../assets/bibles/web/genesis.json") as LocalBookFile,
    exodus: () => require("../assets/bibles/web/exodus.json") as LocalBookFile,
    leviticus: () => require("../assets/bibles/web/leviticus.json") as LocalBookFile,
    numbers: () => require("../assets/bibles/web/numbers.json") as LocalBookFile,
    deuteronomy: () => require("../assets/bibles/web/deuteronomy.json") as LocalBookFile,
    // Historical Books
    joshua: () => require("../assets/bibles/web/joshua.json") as LocalBookFile,
    judges: () => require("../assets/bibles/web/judges.json") as LocalBookFile,
    ruth: () => require("../assets/bibles/web/ruth.json") as LocalBookFile,
    "1-samuel": () => require("../assets/bibles/web/1-samuel.json") as LocalBookFile,
    "2-samuel": () => require("../assets/bibles/web/2-samuel.json") as LocalBookFile,
    "1-kings": () => require("../assets/bibles/web/1-kings.json") as LocalBookFile,
    "2-kings": () => require("../assets/bibles/web/2-kings.json") as LocalBookFile,
    "1-chronicles": () => require("../assets/bibles/web/1-chronicles.json") as LocalBookFile,
    "2-chronicles": () => require("../assets/bibles/web/2-chronicles.json") as LocalBookFile,
    ezra: () => require("../assets/bibles/web/ezra.json") as LocalBookFile,
    nehemiah: () => require("../assets/bibles/web/nehemiah.json") as LocalBookFile,
    esther: () => require("../assets/bibles/web/esther.json") as LocalBookFile,
    // Wisdom & Poetry
    job: () => require("../assets/bibles/web/job.json") as LocalBookFile,
    psalms: () => require("../assets/bibles/web/psalms.json") as LocalBookFile,
    proverbs: () => require("../assets/bibles/web/proverbs.json") as LocalBookFile,
    ecclesiastes: () => require("../assets/bibles/web/ecclesiastes.json") as LocalBookFile,
    "song-of-solomon": () => require("../assets/bibles/web/song-of-solomon.json") as LocalBookFile,
    // Major Prophets
    isaiah: () => require("../assets/bibles/web/isaiah.json") as LocalBookFile,
    jeremiah: () => require("../assets/bibles/web/jeremiah.json") as LocalBookFile,
    lamentations: () => require("../assets/bibles/web/lamentations.json") as LocalBookFile,
    ezekiel: () => require("../assets/bibles/web/ezekiel.json") as LocalBookFile,
    daniel: () => require("../assets/bibles/web/daniel.json") as LocalBookFile,
    // Minor Prophets
    hosea: () => require("../assets/bibles/web/hosea.json") as LocalBookFile,
    joel: () => require("../assets/bibles/web/joel.json") as LocalBookFile,
    amos: () => require("../assets/bibles/web/amos.json") as LocalBookFile,
    obadiah: () => require("../assets/bibles/web/obadiah.json") as LocalBookFile,
    jonah: () => require("../assets/bibles/web/jonah.json") as LocalBookFile,
    micah: () => require("../assets/bibles/web/micah.json") as LocalBookFile,
    nahum: () => require("../assets/bibles/web/nahum.json") as LocalBookFile,
    habakkuk: () => require("../assets/bibles/web/habakkuk.json") as LocalBookFile,
    zephaniah: () => require("../assets/bibles/web/zephaniah.json") as LocalBookFile,
    haggai: () => require("../assets/bibles/web/haggai.json") as LocalBookFile,
    zechariah: () => require("../assets/bibles/web/zechariah.json") as LocalBookFile,
    malachi: () => require("../assets/bibles/web/malachi.json") as LocalBookFile,
    // New Testament — Gospels
    matthew: () => require("../assets/bibles/web/matthew.json") as LocalBookFile,
    mark: () => require("../assets/bibles/web/mark.json") as LocalBookFile,
    luke: () => require("../assets/bibles/web/luke.json") as LocalBookFile,
    john: () => require("../assets/bibles/web/john.json") as LocalBookFile,
    // Acts
    acts: () => require("../assets/bibles/web/acts.json") as LocalBookFile,
    // Pauline Epistles
    romans: () => require("../assets/bibles/web/romans.json") as LocalBookFile,
    "1-corinthians": () => require("../assets/bibles/web/1-corinthians.json") as LocalBookFile,
    "2-corinthians": () => require("../assets/bibles/web/2-corinthians.json") as LocalBookFile,
    galatians: () => require("../assets/bibles/web/galatians.json") as LocalBookFile,
    ephesians: () => require("../assets/bibles/web/ephesians.json") as LocalBookFile,
    philippians: () => require("../assets/bibles/web/philippians.json") as LocalBookFile,
    colossians: () => require("../assets/bibles/web/colossians.json") as LocalBookFile,
    "1-thessalonians": () => require("../assets/bibles/web/1-thessalonians.json") as LocalBookFile,
    "2-thessalonians": () => require("../assets/bibles/web/2-thessalonians.json") as LocalBookFile,
    "1-timothy": () => require("../assets/bibles/web/1-timothy.json") as LocalBookFile,
    "2-timothy": () => require("../assets/bibles/web/2-timothy.json") as LocalBookFile,
    titus: () => require("../assets/bibles/web/titus.json") as LocalBookFile,
    philemon: () => require("../assets/bibles/web/philemon.json") as LocalBookFile,
    // General Epistles
    hebrews: () => require("../assets/bibles/web/hebrews.json") as LocalBookFile,
    james: () => require("../assets/bibles/web/james.json") as LocalBookFile,
    "1-peter": () => require("../assets/bibles/web/1-peter.json") as LocalBookFile,
    "2-peter": () => require("../assets/bibles/web/2-peter.json") as LocalBookFile,
    "1-john": () => require("../assets/bibles/web/1-john.json") as LocalBookFile,
    "2-john": () => require("../assets/bibles/web/2-john.json") as LocalBookFile,
    "3-john": () => require("../assets/bibles/web/3-john.json") as LocalBookFile,
    jude: () => require("../assets/bibles/web/jude.json") as LocalBookFile,
    // Apocalyptic
    revelation: () => require("../assets/bibles/web/revelation.json") as LocalBookFile,
  },
  nwt: {
    // No books bundled. NWT is copyrighted by the Watch Tower Bible
    // and Tract Society of Pennsylvania; Closer cannot redistribute
    // the text. To use this translation, place your own JSON file at
    // `assets/bibles/nwt/<book>.json` matching `LocalBookFile` shape
    // and add a `require(...)` entry here. The reader gracefully
    // surfaces a "not yet installed" state for any chapter we don't
    // have data for.
  },
};

/**
 * Look up a single chapter from the local registry. Returns
 * `undefined` if either (a) the translation has no entries at all,
 * (b) the book isn't bundled in this translation, or (c) the book is
 * bundled but doesn't include the requested chapter.
 *
 * The reader uses the undefined return as the signal to fall through
 * to the API (for translations the API serves) or to surface a
 * "translation not installed" state (for local-only translations).
 */
export function loadLocalChapter(
  translation: TranslationId,
  bookId: string,
  chapter: number,
): LocalChapter | undefined {
  const byBook = REGISTRY[translation];
  if (!byBook) return undefined;
  const loader = byBook[bookId];
  if (!loader) return undefined;
  let file: LocalBookFile;
  try {
    file = loader();
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[localBibles] failed to load bundle", err);
    }
    return undefined;
  }
  return file.chapters.find((c) => c.chapter === chapter);
}

/**
 * Look up the human-readable translation name from any bundled book
 * for that translation. Used by the reader header so a locally-served
 * chapter shows the same "World English Bible" label the API would
 * have returned. Returns undefined when no books are bundled for the
 * translation — callers should fall back to the translation's `name`
 * field from the TRANSLATIONS table.
 */
export function loadLocalTranslationName(
  translation: TranslationId,
): string | undefined {
  const byBook = REGISTRY[translation];
  if (!byBook) return undefined;
  const firstLoader = Object.values(byBook)[0];
  if (!firstLoader) return undefined;
  try {
    return firstLoader().translationName;
  } catch {
    return undefined;
  }
}

/**
 * Whether ANY book is bundled for the given translation. Useful for
 * UI affordances — e.g. the translation picker can show an "(offline
 * ready)" badge on translations that have local files.
 */
export function hasLocalBundle(translation: TranslationId): boolean {
  const byBook = REGISTRY[translation];
  if (!byBook) return false;
  return Object.keys(byBook).length > 0;
}

/**
 * Whether a specific book is bundled for a translation. Used by the
 * reader to distinguish "translation not installed at all" from
 * "this chapter happens to be missing from an otherwise installed
 * book" (the second one is unusual — likely a corrupt fetch).
 */
export function hasLocalBook(
  translation: TranslationId,
  bookId: string,
): boolean {
  const byBook = REGISTRY[translation];
  if (!byBook) return false;
  return bookId in byBook;
}
