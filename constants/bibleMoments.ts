import data from "./bibleMomentsData.json";

export const MOMENT_CATEGORIES = {
  "turning-points": { name: "Turning Points", tint: "#79521B", light: "#79521B", dark: "#F3CA79" },
  prophecy: { name: "Prophecy", tint: "#583585", light: "#6B3594", dark: "#D7ADF5" },
  lessons: { name: "Special Lessons", tint: "#155F58", light: "#14665B", dark: "#83D8BC" },
  changed: { name: "Changed by Jesus", tint: "#853E51", light: "#A03553", dark: "#FFA5B8" },
  promises: { name: "Promises of God", tint: "#383F85", light: "#42449A", dark: "#B7BFFF" },
} as const;
export type MomentCategory = keyof typeof MOMENT_CATEGORIES;
export type MomentAnchor = { bookId: string; chapter: number; verse: number; endVerse: number };
export type BibleMoment = MomentAnchor & {
  id: string; title: string; event: string; reference: string;
  happened: string; importance: string; tint: string;
  category: MomentCategory; tags: MomentCategory[]; additionalAnchors?: MomentAnchor[];
};
export const BIBLE_MOMENTS: BibleMoment[] = data.map(row => ({
  ...row, category: row.category as MomentCategory, tags: row.tags as MomentCategory[],
  tint: MOMENT_CATEGORIES[row.category as MomentCategory].tint,
}));

// A verse can lead to several cards; never silently discard a matching event.
export const findBibleMoments = (bookId: string, chapter: number, verse: number) =>
  BIBLE_MOMENTS.filter(moment => [moment, ...(moment.additionalAnchors ?? [])].some(anchor =>
    anchor.bookId === bookId && anchor.chapter === chapter && verse >= anchor.verse && verse <= anchor.endVerse));
export const findBibleMoment = (bookId: string, chapter: number, verse: number) =>
  findBibleMoments(bookId, chapter, verse)[0];
