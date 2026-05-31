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

const COVER_MAP: Partial<Record<string, CoverEntry>> = {
  job: {
    image: require("../assets/book-covers/thebookofjob.png"),
    // Sampled from the painting: the cyan-blue beam of light
    // pouring down on the figure (inner highlight) → the deep
    // night-sky blue behind the cosmic swirls (outer body).
    // Colors stay close to the painting itself — the bloom layer
    // pulls its visual weight from stop opacity, not over-bright
    // hues that would feel detached from the artwork.
    bloom: { inner: "#90D4F2", outer: "#243A98" },
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
