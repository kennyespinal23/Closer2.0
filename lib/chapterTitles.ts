import titles from "@/constants/chapterTitles.json";

/** Imported verbatim from closer_chapter_titles.xlsx, chapter-title column. */
export function getChapterTitle(bookId: string, chapter: number): string {
  return (titles as Record<string, string[]>)[bookId]?.[chapter - 1] ?? `Chapter ${chapter}`;
}

/** Reserve the same heading space in the visible page and pagination pass. */
export function chapterHeadingHeight(bookId: string, chapter: number, width: number, scale: number, fontScale: number): number {
  const k = Math.sqrt(scale);
  const titleWidth = Math.max(70, width - String(chapter).length * 44 * k * fontScale - 16);
  const capacity = Math.max(7, Math.floor(titleWidth / (10 * k * fontScale)));
  let lines = 1, used = 0;
  for (const word of getChapterTitle(bookId, chapter).split(/\s+/)) {
    if (used && used + 1 + word.length > capacity) { lines++; used = 0; }
    used += (used ? 1 : 0) + word.length;
  }
  return Math.max(96 * k * fontScale, (19 + lines * 23) * k * fontScale + 16);
}
