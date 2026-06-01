#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Fetch one (or every) Bible book from bible-api.com and write it to
 * `assets/bibles/<translation>/<book>.json` in Closer's local-bibles
 * format.
 *
 * Usage:
 *   # Single book
 *   node scripts/fetchBibleBook.mjs john web
 *
 *   # Every book in the canon (66 Protestant books)
 *   node scripts/fetchBibleBook.mjs --all web
 *
 *   # Resume an interrupted --all run — already-on-disk books are
 *   # skipped unless --force is passed.
 *   node scripts/fetchBibleBook.mjs --all web
 *   node scripts/fetchBibleBook.mjs --all web --force
 *
 * The translation slug MUST match the API's `?translation=` parameter
 * (web, kjv, bbe, oeb-cw, webbe). This script ONLY pulls public-domain
 * translations served by bible-api.com — it does NOT and CANNOT pull
 * copyrighted translations like NWT, NIV, ESV, etc. Those have to be
 * provided by the user from their own licensed source.
 *
 * Output shape (matches `lib/localBibles.ts` BookFile):
 *   {
 *     "bookId": "john",
 *     "translation": "web",
 *     "translationName": "World English Bible",
 *     "chapters": [
 *       { "chapter": 1, "verses": [{ "number": 1, "text": "..." }, ...] },
 *       ...
 *     ]
 *   }
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

/**
 * Full Protestant canon — mirrors `constants/books.ts` exactly so the
 * Closer book ids (slugs used in the in-app router and registry) are
 * the source of truth here too. Each entry maps:
 *
 *   id        — Closer slug (matches constants/books.ts and the
 *               filename written under assets/bibles/<translation>/<id>.json)
 *   chapters  — canonical chapter count
 *   apiName   — string passed to bible-api.com; some books need the
 *               hyphen replaced with a space ("1 samuel" not "1-samuel")
 *               and "song-of-solomon" expands to "song of solomon"
 */
const CANON = [
  // ── Old Testament ──────────────────────────────────────────────
  { id: "genesis",          chapters: 50,  apiName: "genesis" },
  { id: "exodus",           chapters: 40,  apiName: "exodus" },
  { id: "leviticus",        chapters: 27,  apiName: "leviticus" },
  { id: "numbers",          chapters: 36,  apiName: "numbers" },
  { id: "deuteronomy",      chapters: 34,  apiName: "deuteronomy" },
  { id: "joshua",           chapters: 24,  apiName: "joshua" },
  { id: "judges",           chapters: 21,  apiName: "judges" },
  { id: "ruth",             chapters: 4,   apiName: "ruth" },
  { id: "1-samuel",         chapters: 31,  apiName: "1 samuel" },
  { id: "2-samuel",         chapters: 24,  apiName: "2 samuel" },
  { id: "1-kings",          chapters: 22,  apiName: "1 kings" },
  { id: "2-kings",          chapters: 25,  apiName: "2 kings" },
  { id: "1-chronicles",     chapters: 29,  apiName: "1 chronicles" },
  { id: "2-chronicles",     chapters: 36,  apiName: "2 chronicles" },
  { id: "ezra",             chapters: 10,  apiName: "ezra" },
  { id: "nehemiah",         chapters: 13,  apiName: "nehemiah" },
  { id: "esther",           chapters: 10,  apiName: "esther" },
  { id: "job",              chapters: 42,  apiName: "job" },
  { id: "psalms",           chapters: 150, apiName: "psalms" },
  { id: "proverbs",         chapters: 31,  apiName: "proverbs" },
  { id: "ecclesiastes",     chapters: 12,  apiName: "ecclesiastes" },
  { id: "song-of-solomon",  chapters: 8,   apiName: "song of solomon" },
  { id: "isaiah",           chapters: 66,  apiName: "isaiah" },
  { id: "jeremiah",         chapters: 52,  apiName: "jeremiah" },
  { id: "lamentations",     chapters: 5,   apiName: "lamentations" },
  { id: "ezekiel",          chapters: 48,  apiName: "ezekiel" },
  { id: "daniel",           chapters: 12,  apiName: "daniel" },
  { id: "hosea",            chapters: 14,  apiName: "hosea" },
  { id: "joel",             chapters: 3,   apiName: "joel" },
  { id: "amos",             chapters: 9,   apiName: "amos" },
  { id: "obadiah",          chapters: 1,   apiName: "obadiah",  singleChapterVerses: 21 },
  { id: "jonah",            chapters: 4,   apiName: "jonah" },
  { id: "micah",            chapters: 7,   apiName: "micah" },
  { id: "nahum",            chapters: 3,   apiName: "nahum" },
  { id: "habakkuk",         chapters: 3,   apiName: "habakkuk" },
  { id: "zephaniah",        chapters: 3,   apiName: "zephaniah" },
  { id: "haggai",           chapters: 2,   apiName: "haggai" },
  { id: "zechariah",        chapters: 14,  apiName: "zechariah" },
  { id: "malachi",          chapters: 4,   apiName: "malachi" },
  // ── New Testament ──────────────────────────────────────────────
  { id: "matthew",          chapters: 28,  apiName: "matthew" },
  { id: "mark",             chapters: 16,  apiName: "mark" },
  { id: "luke",             chapters: 24,  apiName: "luke" },
  { id: "john",             chapters: 21,  apiName: "john" },
  { id: "acts",             chapters: 28,  apiName: "acts" },
  { id: "romans",           chapters: 16,  apiName: "romans" },
  { id: "1-corinthians",    chapters: 16,  apiName: "1 corinthians" },
  { id: "2-corinthians",    chapters: 13,  apiName: "2 corinthians" },
  { id: "galatians",        chapters: 6,   apiName: "galatians" },
  { id: "ephesians",        chapters: 6,   apiName: "ephesians" },
  { id: "philippians",      chapters: 4,   apiName: "philippians" },
  { id: "colossians",       chapters: 4,   apiName: "colossians" },
  { id: "1-thessalonians",  chapters: 5,   apiName: "1 thessalonians" },
  { id: "2-thessalonians",  chapters: 3,   apiName: "2 thessalonians" },
  { id: "1-timothy",        chapters: 6,   apiName: "1 timothy" },
  { id: "2-timothy",        chapters: 4,   apiName: "2 timothy" },
  { id: "titus",            chapters: 3,   apiName: "titus" },
  { id: "philemon",         chapters: 1,   apiName: "philemon", singleChapterVerses: 25 },
  { id: "hebrews",          chapters: 13,  apiName: "hebrews" },
  { id: "james",            chapters: 5,   apiName: "james" },
  { id: "1-peter",          chapters: 5,   apiName: "1 peter" },
  { id: "2-peter",          chapters: 3,   apiName: "2 peter" },
  { id: "1-john",           chapters: 5,   apiName: "1 john" },
  { id: "2-john",           chapters: 1,   apiName: "2 john",   singleChapterVerses: 13 },
  { id: "3-john",           chapters: 1,   apiName: "3 john",   singleChapterVerses: 14 },
  { id: "jude",             chapters: 1,   apiName: "jude",     singleChapterVerses: 25 },
  { id: "revelation",       chapters: 22,  apiName: "revelation" },
];

const API_BASE = "https://bible-api.com";
const BASE_DELAY_MS = 350;
const MAX_RETRIES = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch one chapter with retry/backoff for 429 rate-limit responses.
 *  bible-api.com has a sliding-window rate limit; we throttle our
 *  baseline cadence with `BASE_DELAY_MS` and back off exponentially
 *  on 429s up to `MAX_RETRIES` attempts.
 *
 *  Pass `singleChapterVerses` for single-chapter books (Obadiah,
 *  Philemon, 2/3 John, Jude). The API parses "obadiah 1" as
 *  "verse 1 of Obadiah" because there's only one chapter — it
 *  returns just that single verse instead of the full chapter.
 *  Using an explicit verse range `obadiah 1:1-21` is the
 *  documented way to get the whole chapter. Counts are hard-coded
 *  per book because the API rejects over-ranges with "not found",
 *  so we have to specify the exact upper bound. */
async function fetchChapter(apiName, chapter, translation, singleChapterVerses) {
  const reference = singleChapterVerses
    ? `${apiName} ${chapter}:1-${singleChapterVerses}`
    : `${apiName} ${chapter}`;
  const url = `${API_BASE}/${encodeURIComponent(reference)}?translation=${translation}`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 429) {
      const backoff = 1000 * Math.pow(2, attempt);
      process.stdout.write(
        `  … rate limited on ${reference}, retry in ${backoff}ms\n`,
      );
      await sleep(backoff);
      continue;
    }
    throw new Error(`HTTP ${res.status} on ${reference}`);
  }
  throw new Error(`Exhausted retries on ${apiName} ${chapter}`);
}

/** Fetch a full book and write it to disk. */
async function fetchBook(book, translation, { force }) {
  const outDir = path.join(REPO_ROOT, "assets", "bibles", translation);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${book.id}.json`);

  if (!force) {
    try {
      await fs.access(outPath);
      console.log(`⤳ skip ${book.id} (already on disk; pass --force to re-fetch)`);
      return { skipped: true };
    } catch {
      // not present — fall through and fetch
    }
  }

  console.log(`Fetching ${book.id} (${book.chapters} chapters)…`);

  const results = [];
  let translationName = translation;
  for (let i = 1; i <= book.chapters; i += 1) {
    const data = await fetchChapter(
      book.apiName,
      i,
      translation,
      book.singleChapterVerses,
    );
    translationName = data.translation_name ?? translationName;
    results.push({
      chapter: i,
      verses: data.verses.map((v) => ({
        number: v.verse,
        text: v.text.trim(),
      })),
    });
    process.stdout.write(`  ✓ ${book.id} ${i}\n`);
    await sleep(BASE_DELAY_MS);
  }

  const payload = {
    bookId: book.id,
    translation,
    translationName,
    chapters: results,
  };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outPath}`);
  return { skipped: false };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const cleaned = args.filter((a) => a !== "--force");

  if (cleaned[0] === "--all") {
    const translation = cleaned[1];
    if (!translation) {
      console.error("Usage: node scripts/fetchBibleBook.mjs --all <translation>");
      process.exit(1);
    }
    console.log(`Fetching the FULL canon in ${translation}.\n`);
    let fetched = 0;
    let skipped = 0;
    for (const book of CANON) {
      const result = await fetchBook(book, translation, { force });
      if (result.skipped) skipped += 1;
      else fetched += 1;
    }
    console.log(`\nDone. Fetched ${fetched}, skipped ${skipped}.`);
    return;
  }

  const [bookId, translation] = cleaned;
  if (!bookId || !translation) {
    console.error(
      "Usage: node scripts/fetchBibleBook.mjs <book-slug> <translation>\n" +
        "       node scripts/fetchBibleBook.mjs --all <translation>",
    );
    process.exit(1);
  }
  const book = CANON.find((b) => b.id === bookId);
  if (!book) {
    console.error(
      `Unknown book "${bookId}". Slugs must match constants/books.ts.`,
    );
    process.exit(1);
  }
  await fetchBook(book, translation, { force });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
