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
 *   2. Add a line below mapping `bookId` → require("..." )
 *
 * The Library + book overview screens use `getBookCover` and fall
 * back to a generated placeholder (see BookCoverPlaceholder) for
 * any book that doesn't have art yet, so partial coverage is fine.
 */

const COVER_MAP: Partial<Record<string, ImageSourcePropType>> = {
  job: require("../assets/book-covers/thebookofjob.png"),
};

export function getBookCover(bookId: string): ImageSourcePropType | null {
  return COVER_MAP[bookId] ?? null;
}

export function hasBookCover(bookId: string): boolean {
  return getBookCover(bookId) !== null;
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
