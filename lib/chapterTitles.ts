import titles from "@/constants/chapterTitles.json";

/** Imported verbatim from closer_chapter_titles.xlsx, chapter-title column. */
export function getChapterTitle(bookId: string, chapter: number): string {
  return (titles as Record<string, string[]>)[bookId]?.[chapter - 1] ?? `Chapter ${chapter}`;
}

/** "You must be born again — for God so loved the world" → the headline, and the line under it. */
export function splitChapterTitle(bookId: string, chapter: number): { main: string; sub: string | null } {
  const [main, ...rest] = getChapterTitle(bookId, chapter).split(/\s+—\s+/);
  return { main: main!, sub: rest.length ? rest.join(" — ") : null };
}

/** The chapter opener's painting band, above the number. */
export const CHAPTER_ART_HEIGHT = 180;

function linesFor(text: string, capacity: number) {
  let lines = 1, used = 0;
  for (const word of text.split(/\s+/)) {
    if (used && used + 1 + word.length > capacity) { lines++; used = 0; }
    used += (used ? 1 : 0) + word.length;
  }
  return lines;
}

/** Reserve the same heading space in the visible page and pagination pass. Mirrors ChapterHeading's layout. */
export function chapterHeadingHeight(bookId: string, chapter: number, width: number, scale: number, fontScale: number): number {
  const k = Math.sqrt(scale), f = k * fontScale;
  const { main, sub } = splitChapterTitle(bookId, chapter);
  const titleLines = linesFor(main, Math.max(6, Math.floor(width / (15.5 * f))));
  const subLines = sub ? linesFor(sub, Math.max(10, Math.floor(width / (8.6 * f)))) : 0;
  // Only a book's first chapter opens with its painting: band (pulled up by the page padding, overlapped by the number).
  const band = chapter === 1 ? CHAPTER_ART_HEIGHT - 16 - 52 : 12;
  // + number row + title + sub + rule
  return band + 116 * f + 12 + titleLines * 40 * f + (sub ? 6 + subLines * 22 * f : 0) + 18 + 1 + 18;
}
