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
 *   2. Add it to scripts/compress-covers.sh and run that script
 *   3. Add an entry below — at minimum a `require(...)` path, and
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

// Full 66-book cover set. Filenames follow the canonical
// `{bookId}.jpg` convention so the bookCatalog id and the asset
// path stay in lockstep.
//
// Source PNGs ("Book of ….PNG") are compressed via
// scripts/compress-covers.sh → ≤1200px JPEG @ q85.
// Bloom palettes were auto-sampled via scripts/extract-blooms.py.
const COVER_MAP: Partial<Record<string, CoverEntry>> = {
  // ─── The Law ──────────────────────────────────────────────────
  genesis: {
    image: require("../assets/book-covers/genesis.jpg"),
    bloom: { inner: "#F3C055", outer: "#3B492B" },
  },
  exodus: {
    image: require("../assets/book-covers/exodus.jpg"),
    bloom: { inner: "#F59A38", outer: "#5F1C1B" },
  },
  leviticus: {
    image: require("../assets/book-covers/leviticus.jpg"),
    bloom: { inner: "#F0B669", outer: "#754835" },
  },
  numbers: {
    image: require("../assets/book-covers/numbers.jpg"),
    bloom: { inner: "#FFB846", outer: "#432A16" },
  },
  deuteronomy: {
    image: require("../assets/book-covers/deuteronomy.jpg"),
    bloom: { inner: "#FFBB62", outer: "#5D4243" },
  },

  // ─── Historical Books ─────────────────────────────────────────
  joshua: {
    image: require("../assets/book-covers/joshua.jpg"),
    bloom: { inner: "#F49236", outer: "#7A3410" },
  },
  judges: {
    image: require("../assets/book-covers/judges.jpg"),
    bloom: { inner: "#FF8E38", outer: "#63231D" },
  },
  ruth: {
    image: require("../assets/book-covers/ruth.jpg"),
    bloom: { inner: "#FF9538", outer: "#692D0C" },
  },
  "1-samuel": {
    image: require("../assets/book-covers/1-samuel.jpg"),
    bloom: { inner: "#FD8738", outer: "#87420E" },
  },
  "2-samuel": {
    image: require("../assets/book-covers/2-samuel.jpg"),
    bloom: { inner: "#914C67", outer: "#61344B" },
  },
  "1-kings": {
    image: require("../assets/book-covers/1-kings.jpg"),
    bloom: { inner: "#B45D36", outer: "#291517" },
  },
  "2-kings": {
    image: require("../assets/book-covers/2-kings.jpg"),
    bloom: { inner: "#FFA838", outer: "#5F2C03" },
  },
  "1-chronicles": {
    image: require("../assets/book-covers/1-chronicles.jpg"),
    bloom: { inner: "#FA8D37", outer: "#701C1A" },
  },
  "2-chronicles": {
    image: require("../assets/book-covers/2-chronicles.jpg"),
    bloom: { inner: "#FF9B38", outer: "#642A2B" },
  },
  ezra: {
    image: require("../assets/book-covers/ezra.jpg"),
    bloom: { inner: "#FFAD38", outer: "#402613" },
  },
  nehemiah: {
    image: require("../assets/book-covers/nehemiah.jpg"),
    bloom: { inner: "#FFB538", outer: "#704519" },
  },
  esther: {
    image: require("../assets/book-covers/esther.jpg"),
    bloom: { inner: "#A8546D", outer: "#683B62" },
  },

  // ─── Wisdom & Poetry ──────────────────────────────────────────
  job: {
    image: require("../assets/book-covers/job.jpg"),
    bloom: { inner: "#734BC1", outer: "#161B6A" },
  },
  psalms: {
    image: require("../assets/book-covers/psalms.jpg"),
    bloom: { inner: "#426E9B", outer: "#1A3456" },
  },
  proverbs: {
    image: require("../assets/book-covers/proverbs.jpg"),
    bloom: { inner: "#F3B772", outer: "#84594F" },
  },
  ecclesiastes: {
    image: require("../assets/book-covers/ecclesiastes.jpg"),
    bloom: { inner: "#FA6B37", outer: "#763B1E" },
  },
  "song-of-solomon": {
    image: require("../assets/book-covers/song-of-solomon.jpg"),
    bloom: { inner: "#FF8E86", outer: "#823561" },
  },

  // ─── Major Prophets ───────────────────────────────────────────
  isaiah: {
    image: require("../assets/book-covers/isaiah.jpg"),
    bloom: { inner: "#FFB238", outer: "#183A28" },
  },
  jeremiah: {
    image: require("../assets/book-covers/jeremiah.jpg"),
    bloom: { inner: "#886B3A", outer: "#0B292E" },
  },
  lamentations: {
    image: require("../assets/book-covers/lamentations.jpg"),
    bloom: { inner: "#2C3256", outer: "#292C44" },
  },
  ezekiel: {
    image: require("../assets/book-covers/ezekiel.jpg"),
    bloom: { inner: "#15614C", outer: "#072F27" },
  },
  daniel: {
    image: require("../assets/book-covers/daniel.jpg"),
    bloom: { inner: "#279BB1", outer: "#0A4752" },
  },

  // ─── Minor Prophets ───────────────────────────────────────────
  hosea: {
    image: require("../assets/book-covers/hosea.jpg"),
    bloom: { inner: "#195870", outer: "#25545F" },
  },
  joel: {
    image: require("../assets/book-covers/joel.jpg"),
    bloom: { inner: "#C04436", outer: "#5E1D23" },
  },
  amos: {
    image: require("../assets/book-covers/amos.jpg"),
    bloom: { inner: "#FF9338", outer: "#30212B" },
  },
  obadiah: {
    image: require("../assets/book-covers/obadiah.jpg"),
    bloom: { inner: "#A3303E", outer: "#3E1820" },
  },
  jonah: {
    image: require("../assets/book-covers/jonah.jpg"),
    bloom: { inner: "#AB6C54", outer: "#26525B" },
  },
  micah: {
    image: require("../assets/book-covers/micah.jpg"),
    bloom: { inner: "#FF8239", outer: "#714829" },
  },
  nahum: {
    image: require("../assets/book-covers/nahum.jpg"),
    bloom: { inner: "#E3833E", outer: "#835953" },
  },
  habakkuk: {
    image: require("../assets/book-covers/habakkuk.jpg"),
    bloom: { inner: "#2952A1", outer: "#0C1C4A" },
  },
  zephaniah: {
    image: require("../assets/book-covers/zephaniah.jpg"),
    bloom: { inner: "#1F7369", outer: "#042527" },
  },
  haggai: {
    image: require("../assets/book-covers/haggai.jpg"),
    bloom: { inner: "#FFA438", outer: "#704016" },
  },
  zechariah: {
    image: require("../assets/book-covers/zechariah.jpg"),
    bloom: { inner: "#FFCC74", outer: "#818063" },
  },
  malachi: {
    image: require("../assets/book-covers/malachi.jpg"),
    bloom: { inner: "#17635B", outer: "#052425" },
  },

  // ─── Gospels ──────────────────────────────────────────────────
  matthew: {
    image: require("../assets/book-covers/matthew.jpg"),
    bloom: { inner: "#FFAB38", outer: "#2E2934" },
  },
  mark: {
    image: require("../assets/book-covers/mark.jpg"),
    bloom: { inner: "#AB6837", outer: "#47708C" },
  },
  luke: {
    image: require("../assets/book-covers/luke.jpg"),
    bloom: { inner: "#FF8876", outer: "#583D3E" },
  },
  john: {
    image: require("../assets/book-covers/john.jpg"),
    bloom: { inner: "#AC6A59", outer: "#1C1E40" },
  },

  // ─── Acts ─────────────────────────────────────────────────────
  acts: {
    image: require("../assets/book-covers/acts.jpg"),
    bloom: { inner: "#FFBA38", outer: "#33230D" },
  },

  // ─── Pauline Epistles ─────────────────────────────────────────
  romans: {
    image: require("../assets/book-covers/romans.jpg"),
    bloom: { inner: "#1B4379", outer: "#021539" },
  },
  "1-corinthians": {
    image: require("../assets/book-covers/1-corinthians.jpg"),
    bloom: { inner: "#F98537", outer: "#622F19" },
  },
  "2-corinthians": {
    image: require("../assets/book-covers/2-corinthians.jpg"),
    bloom: { inner: "#F8A149", outer: "#545755" },
  },
  galatians: {
    image: require("../assets/book-covers/galatians.jpg"),
    bloom: { inner: "#FF9C39", outer: "#133F7E" },
  },
  ephesians: {
    image: require("../assets/book-covers/ephesians.jpg"),
    bloom: { inner: "#224165", outer: "#283B4F" },
  },
  philippians: {
    image: require("../assets/book-covers/philippians.jpg"),
    bloom: { inner: "#E86A7C", outer: "#893F4A" },
  },
  colossians: {
    image: require("../assets/book-covers/colossians.jpg"),
    bloom: { inner: "#2968B9", outer: "#13325A" },
  },
  "1-thessalonians": {
    image: require("../assets/book-covers/1-thessalonians.jpg"),
    bloom: { inner: "#FFA45D", outer: "#7E3A27" },
  },
  "2-thessalonians": {
    image: require("../assets/book-covers/2-thessalonians.jpg"),
    bloom: { inner: "#18546E", outer: "#072E42" },
  },
  "1-timothy": {
    image: require("../assets/book-covers/1-timothy.jpg"),
    bloom: { inner: "#A4793E", outer: "#0A324C" },
  },
  "2-timothy": {
    image: require("../assets/book-covers/2-timothy.jpg"),
    bloom: { inner: "#713E4D", outer: "#332340" },
  },
  titus: {
    image: require("../assets/book-covers/titus.jpg"),
    bloom: { inner: "#FA8237", outer: "#843F22" },
  },
  philemon: {
    image: require("../assets/book-covers/philemon.jpg"),
    bloom: { inner: "#FF9838", outer: "#3A382D" },
  },

  // ─── General Epistles ─────────────────────────────────────────
  hebrews: {
    image: require("../assets/book-covers/hebrews.jpg"),
    bloom: { inner: "#316398", outer: "#103560" },
  },
  james: {
    image: require("../assets/book-covers/james.jpg"),
    bloom: { inner: "#926160", outer: "#3E343D" },
  },
  "1-peter": {
    image: require("../assets/book-covers/1-peter.jpg"),
    bloom: { inner: "#FFA038", outer: "#3A1B21" },
  },
  "2-peter": {
    image: require("../assets/book-covers/2-peter.jpg"),
    bloom: { inner: "#FF835D", outer: "#462A3F" },
  },
  "1-john": {
    image: require("../assets/book-covers/1-john.jpg"),
    bloom: { inner: "#E7925B", outer: "#53335B" },
  },
  "2-john": {
    image: require("../assets/book-covers/2-john.jpg"),
    bloom: { inner: "#CB8CE0", outer: "#755181" },
  },
  "3-john": {
    image: require("../assets/book-covers/3-john.jpg"),
    bloom: { inner: "#5A3779", outer: "#241A3D" },
  },
  jude: {
    image: require("../assets/book-covers/jude.jpg"),
    bloom: { inner: "#5F3886", outer: "#1D1949" },
  },

  // ─── Apocalyptic ──────────────────────────────────────────────
  revelation: {
    image: require("../assets/book-covers/revelation.jpg"),
    bloom: { inner: "#DC95B2", outer: "#514782" },
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
