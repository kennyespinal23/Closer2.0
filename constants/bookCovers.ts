import type { ImageSourcePropType } from "react-native";
import type { BookCategory } from "./books";

/**
 * Registry of custom cover art for books of the Bible.
 *
 * React Native's bundler only follows `require(...)` calls when the
 * argument is a string literal — so each book's asset has to be
 * named explicitly here. To add a new cover:
 *
 *   1. Drop the PNG into assets/book-covers/
 *   2. Add an entry below — at minimum a `require(...)` path, and
 *      ideally a `bloom` palette sampled from the artwork (see
 *      `CoverBloom` below)
 *
 * The Library + book overview screens use `getBookCover` and fall
 * back to a generated placeholder (see BookCoverPlaceholder) for
 * any book that doesn't have art yet, so partial coverage is fine.
 */

/**
 * Two-stop palette used to drive the radial bloom behind the cover
 * on the book detail screen. Both colors should be drawn from the
 * artwork itself so the glow "matches" what the user is looking at:
 *
 *   • inner — a brighter highlight from the painting (often a
 *     mid-tone saturated color near the focal point)
 *   • outer — a deeper supporting color (typically the dominant
 *     background hue)
 *
 * Keep saturation moderate — the bloom is a hint of color, not a
 * neon ring. Anything ≥ ~70% saturation tends to upstage the cover
 * it's supposed to flatter.
 */
export type CoverBloom = {
  inner: string;
  outer: string;
};

type CoverEntry = {
  image: ImageSourcePropType;
  bloom?: CoverBloom;
};

// Bulk-loaded cover art for 49 books. Filenames follow the
// canonical `{bookId}.jpg` convention so the bookCatalog id and
// the asset path stay in lockstep.
//
// Originals shipped as multi-megabyte PNGs (~360 MB total). We
// resampled the lot to 1200px on the long edge and re-encoded as
// JPEG at quality 85 via scripts/compress-covers.sh, dropping the
// payload to ~9 MB total with no visible quality loss at phone
// screen sizes. Re-run that script whenever new originals land.
//
// `bloom` is only set for books where the artwork was hand-sampled.
// Anything without an entry falls back to the warm amber default
// inside `app/book/[id]/index.tsx` — see the `getCoverBloom() ?? {
// inner: "#FFD49B", outer: "#A07040" }` line there.
// Bloom palettes below were auto-sampled from each artwork via
// scripts/extract-blooms.py (median-cut quantize + saturation/
// brightness shaping). They're checked-in values, not runtime
// computations, because:
//   1. RN's Image loader doesn't expose pixel data without an
//      extra native dep, so we can't sample at app-launch.
//   2. The bloom needs to be CONSISTENT between cold launches
//      (a sampled palette would jitter across releases as Pillow
//      versions or the artwork itself evolves).
// To regenerate for new covers: run `python3 scripts/extract-blooms.py`
// and paste the inner/outer pairs into the right entries below.
const COVER_MAP: Partial<Record<string, CoverEntry>> = {
  // ─── The Law ──────────────────────────────────────────────────
  genesis: {
    image: require("../assets/book-covers/genesis.jpg"),
    bloom: { inner: "#A1BD86", outer: "#273E1F" },
  },
  exodus: {
    image: require("../assets/book-covers/exodus.jpg"),
    bloom: { inner: "#EBBE5F", outer: "#560602" },
  },
  leviticus: {
    image: require("../assets/book-covers/leviticus.jpg"),
    bloom: { inner: "#B47928", outer: "#784412" },
  },
  deuteronomy: {
    image: require("../assets/book-covers/deuteronomy.jpg"),
    bloom: { inner: "#D7A667", outer: "#53424B" },
  },

  // ─── Historical Books ─────────────────────────────────────────
  joshua: {
    image: require("../assets/book-covers/joshua.jpg"),
    bloom: { inner: "#F4AA53", outer: "#8A5221" },
  },
  judges: {
    image: require("../assets/book-covers/judges.jpg"),
    bloom: { inner: "#F07144", outer: "#320609" },
  },
  ruth: {
    image: require("../assets/book-covers/ruth.jpg"),
    bloom: { inner: "#FF9F3A", outer: "#602104" },
  },
  "1-kings": {
    image: require("../assets/book-covers/1-kings.jpg"),
    bloom: { inner: "#C4622D", outer: "#2B0604" },
  },
  "2-chronicles": {
    image: require("../assets/book-covers/2-chronicles.jpg"),
    bloom: { inner: "#FFA93A", outer: "#27010E" },
  },
  ezra: {
    image: require("../assets/book-covers/ezra.jpg"),
    bloom: { inner: "#D1822E", outer: "#270C01" },
  },

  // ─── Wisdom & Poetry ──────────────────────────────────────────
  job: {
    image: require("../assets/book-covers/job.jpg"),
    // Hand-tuned (kept verbatim from the original ship): the
    // cyan-blue beam of light pouring down on the figure (inner
    // highlight) → the deep night-sky blue behind the cosmic
    // swirls (outer body). The auto-sampler picks duller blues
    // here because the figure occupies most of the frame; the
    // visual intent is the LIGHT, not the body.
    bloom: { inner: "#90D4F2", outer: "#243A98" },
  },
  proverbs: {
    image: require("../assets/book-covers/proverbs.jpg"),
    bloom: { inner: "#C78750", outer: "#8B5532" },
  },
  ecclesiastes: {
    image: require("../assets/book-covers/ecclesiastes.jpg"),
    bloom: { inner: "#BB5C29", outer: "#562107" },
  },

  // ─── Major Prophets ───────────────────────────────────────────
  lamentations: {
    image: require("../assets/book-covers/lamentations.jpg"),
    bloom: { inner: "#3C55B5", outer: "#1D2956" },
  },
  ezekiel: {
    image: require("../assets/book-covers/ezekiel.jpg"),
    bloom: { inner: "#1B7679", outer: "#206C62" },
  },
  daniel: {
    image: require("../assets/book-covers/daniel.jpg"),
    bloom: { inner: "#E2A143", outer: "#043632" },
  },

  // ─── Minor Prophets ───────────────────────────────────────────
  hosea: {
    image: require("../assets/book-covers/hosea.jpg"),
    bloom: { inner: "#2EB4D1", outer: "#025F72" },
  },
  amos: {
    image: require("../assets/book-covers/amos.jpg"),
    bloom: { inner: "#D97230", outer: "#331604" },
  },
  obadiah: {
    image: require("../assets/book-covers/obadiah.jpg"),
    bloom: { inner: "#A02A30", outer: "#370B0F" },
  },
  jonah: {
    image: require("../assets/book-covers/jonah.jpg"),
    bloom: { inner: "#B53346", outer: "#033845" },
  },
  micah: {
    image: require("../assets/book-covers/micah.jpg"),
    bloom: { inner: "#E97F35", outer: "#78270E" },
  },
  nahum: {
    image: require("../assets/book-covers/nahum.jpg"),
    bloom: { inner: "#EA9343", outer: "#5B505E" },
  },
  habakkuk: {
    image: require("../assets/book-covers/habakkuk.jpg"),
    bloom: { inner: "#225F99", outer: "#031E46" },
  },
  zephaniah: {
    image: require("../assets/book-covers/zephaniah.jpg"),
    bloom: { inner: "#186C69", outer: "#133734" },
  },
  haggai: {
    image: require("../assets/book-covers/haggai.jpg"),
    bloom: { inner: "#FDB338", outer: "#653407" },
  },
  zechariah: {
    image: require("../assets/book-covers/zechariah.jpg"),
    bloom: { inner: "#F3B767", outer: "#352C42" },
  },
  malachi: {
    image: require("../assets/book-covers/malachi.jpg"),
    bloom: { inner: "#AD9667", outer: "#355854" },
  },

  // ─── Gospels ──────────────────────────────────────────────────
  matthew: {
    image: require("../assets/book-covers/matthew.jpg"),
    bloom: { inner: "#C67D2C", outer: "#2B2016" },
  },
  mark: {
    image: require("../assets/book-covers/mark.jpg"),
    bloom: { inner: "#55BAD6", outer: "#074B5A" },
  },
  luke: {
    image: require("../assets/book-covers/luke.jpg"),
    bloom: { inner: "#E1896E", outer: "#73412E" },
  },
  john: {
    image: require("../assets/book-covers/john.jpg"),
    bloom: { inner: "#5A55BA", outer: "#3C345E" },
  },

  // ─── Acts ─────────────────────────────────────────────────────
  acts: {
    image: require("../assets/book-covers/acts.jpg"),
    bloom: { inner: "#A27424", outer: "#2D1601" },
  },

  // ─── Pauline Epistles ─────────────────────────────────────────
  romans: {
    image: require("../assets/book-covers/romans.jpg"),
    bloom: { inner: "#217094", outer: "#002C4A" },
  },
  "1-corinthians": {
    image: require("../assets/book-covers/1-corinthians.jpg"),
    bloom: { inner: "#F76A36", outer: "#803C1C" },
  },
  galatians: {
    image: require("../assets/book-covers/galatians.jpg"),
    bloom: { inner: "#2D6ACB", outer: "#36191B" },
  },
  philippians: {
    image: require("../assets/book-covers/philippians.jpg"),
    bloom: { inner: "#CF6E60", outer: "#452928" },
  },
  colossians: {
    image: require("../assets/book-covers/colossians.jpg"),
    bloom: { inner: "#2465A2", outer: "#010A23" },
  },
  "1-thessalonians": {
    image: require("../assets/book-covers/1-thessalonians.jpg"),
    bloom: { inner: "#D1692E", outer: "#3E1708" },
  },
  "2-thessalonians": {
    image: require("../assets/book-covers/2-thessalonians.jpg"),
    bloom: { inner: "#2AABBE", outer: "#03535F" },
  },
  "1-timothy": {
    image: require("../assets/book-covers/1-timothy.jpg"),
    bloom: { inner: "#FFB438", outer: "#01414C" },
  },
  "2-timothy": {
    image: require("../assets/book-covers/2-timothy.jpg"),
    bloom: { inner: "#D96F30", outer: "#7A3309" },
  },
  titus: {
    image: require("../assets/book-covers/titus.jpg"),
    bloom: { inner: "#C1632A", outer: "#54432C" },
  },
  philemon: {
    image: require("../assets/book-covers/philemon.jpg"),
    bloom: { inner: "#FF8A38", outer: "#1D170F" },
  },

  // ─── General Epistles ─────────────────────────────────────────
  hebrews: {
    image: require("../assets/book-covers/hebrews.jpg"),
    bloom: { inner: "#2B79C3", outer: "#143D64" },
  },
  james: {
    image: require("../assets/book-covers/james.jpg"),
    bloom: { inner: "#DD7C5D", outer: "#2F2C33" },
  },
  "1-john": {
    image: require("../assets/book-covers/1-john.jpg"),
    bloom: { inner: "#8135C8", outer: "#4B2B6D" },
  },
  "2-john": {
    image: require("../assets/book-covers/2-john.jpg"),
    bloom: { inner: "#856AC4", outer: "#3B317B" },
  },
  "3-john": {
    image: require("../assets/book-covers/3-john.jpg"),
    bloom: { inner: "#5B3D9E", outer: "#35296D" },
  },

  // ─── Apocalyptic ──────────────────────────────────────────────
  revelation: {
    image: require("../assets/book-covers/revelation.jpg"),
    bloom: { inner: "#7661E4", outer: "#453985" },
  },
};

export function getBookCover(bookId: string): ImageSourcePropType | null {
  return COVER_MAP[bookId]?.image ?? null;
}

export function getCoverBloom(bookId: string): CoverBloom | null {
  return COVER_MAP[bookId]?.bloom ?? null;
}

export function hasBookCover(bookId: string): boolean {
  return COVER_MAP[bookId] != null;
}

/**
 * Per-category color palette used by the placeholder cover. Each
 * entry is a top→bottom vertical gradient pair so books without art
 * still feel like they belong to a "chapter" of the canon (Wisdom
 * reads warm + intimate, Apocalyptic reads dark + heavy, etc.).
 *
 * The palette is intentionally low-saturation + dark — the white
 * abbreviation typography sits cleanly on every variant, and a wall
 * of placeholders never feels gaudy next to the painted covers.
 */
export const CATEGORY_COVER_PALETTE: Record<
  BookCategory,
  { top: string; bottom: string; accent: string }
> = {
  "The Law": { top: "#3B2E1E", bottom: "#1F1812", accent: "#C8A876" },
  "Historical Books": { top: "#2E2118", bottom: "#150E08", accent: "#B89270" },
  "Wisdom & Poetry": { top: "#2E1822", bottom: "#150A11", accent: "#D49EBE" },
  "Major Prophets": { top: "#192238", bottom: "#0D1320", accent: "#7E9EE0" },
  "Minor Prophets": { top: "#1E2218", bottom: "#0D100A", accent: "#9CBE85" },
  Gospels: { top: "#332811", bottom: "#1A140A", accent: "#E8C879" },
  Acts: { top: "#33170E", bottom: "#180A06", accent: "#E0926F" },
  "Pauline Epistles": { top: "#1E1838", bottom: "#0C0A18", accent: "#9E8FE0" },
  "General Epistles": { top: "#1E2129", bottom: "#0D0F13", accent: "#8FA2BE" },
  Apocalyptic: { top: "#321212", bottom: "#170808", accent: "#E08585" },
};
