import { BIBLE_MOMENTS, type BibleMoment } from "@/constants/bibleMoments";

/** The Bible Moment painting closest to a reference like "Genesis 6:14": the one covering the verse, else the nearest in the same book. */
export function momentForReference(reference: string): BibleMoment {
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  const bookId = match?.[1].toLowerCase().replaceAll(" ", "-");
  const chapter = Number(match?.[2] ?? 1), verse = Number(match?.[3] ?? 1);
  const candidates = BIBLE_MOMENTS.filter(m => m.bookId === bookId);
  const distance = (m: BibleMoment) => Math.abs(m.chapter - chapter) * 1000 + Math.abs(m.verse - verse);
  return candidates.find(m => m.chapter === chapter && verse >= m.verse && verse <= m.endVerse)
    ?? candidates.reduce((best, m) => distance(m) < distance(best) ? m : best, candidates[0] ?? BIBLE_MOMENTS[0]!);
}
