import { type Book, findBookById } from "@/constants/books";

export type ContinueReadingTarget = {
  book: Book;
  chapter: number;
  hint: string;
};

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Decide whether (and what) to surface as Continue Reading.
 *
 * Rules:
 *   • Need a last visit within the last 14 days (older than that
 *     and "continue" stops feeling honest).
 *   • If the visited chapter isn't marked as read → resume there.
 *   • If it is read → suggest the next chapter.
 *   • Hidden when there's no fresh visit, no resolvable book, or
 *     the user finished the last chapter of the book.
 */
export function computeContinueReading(
  lastVisited: {
    bookId: string;
    chapter: number;
    visitedAt: number;
  } | null,
  hasReadChapter: (bookId: string, chapter: number) => boolean,
): ContinueReadingTarget | null {
  if (!lastVisited) return null;
  if (Date.now() - lastVisited.visitedAt > FOURTEEN_DAYS_MS) return null;

  const book = findBookById(lastVisited.bookId);
  if (!book) return null;

  const lastRead = hasReadChapter(lastVisited.bookId, lastVisited.chapter);
  if (!lastRead) {
    return {
      book,
      chapter: lastVisited.chapter,
      hint: "Pick up where you left off",
    };
  }

  const nextChapter = lastVisited.chapter + 1;
  if (nextChapter > book.chapters) return null;
  return {
    book,
    chapter: nextChapter,
    hint: `You finished ${book.name} ${lastVisited.chapter}`,
  };
}
