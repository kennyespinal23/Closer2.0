import { BIBLE_MOMENTS, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { findBookById } from "@/constants/books";

/** Every Moment in Bible order: Genesis first, Revelation last. */
export const MOMENTS_IN_ORDER: BibleMoment[] = [...BIBLE_MOMENTS].sort((a, b) =>
  (findBookById(a.bookId)?.order ?? 999) - (findBookById(b.bookId)?.order ?? 999) || a.chapter - b.chapter || a.verse - b.verse);

const NUMBER = new Map(MOMENTS_IN_ORDER.map((moment, index) => [moment.id, index + 1]));
/** The plate number on a Moment's card: its place in Bible order, "No. 03". */
export const momentNumber = (moment: BibleMoment) => NUMBER.get(moment.id) ?? 0;
export const plateLabel = (moment: BibleMoment) => `No. ${String(momentNumber(moment)).padStart(2, "0")}`;

/** Each category owns one warm hue (see DIRECTION.md, "Bible Moments: category colours"). */
export const WARM_CATEGORY: Record<MomentCategory, string> = {
  "turning-points": "#C98A1E",
  prophecy: "#C4321A",
  lessons: "#5E7A34",
  changed: "#C24F6E",
  promises: "#8E4A22",
};
export const WARM_CATEGORY_NAME: Record<MomentCategory, string> = {
  "turning-points": "Turning points",
  prophecy: "Prophecy",
  lessons: "Special lessons",
  changed: "Changed by Jesus",
  promises: "Promises of God",
};

/** "Collected today", "Collected yesterday", "Collected Oct 4". */
export function collectedLabel(at?: number): string {
  if (!at) return "Collected";
  const d = new Date(at), now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff <= 0) return "Collected today";
  if (diff === 1) return "Collected yesterday";
  return `Collected ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/** The gold used on frames, the count and the strip. */
export const GILT = ["#FFE7A0", "#D9A43A", "#FFF1C2", "#B98322"];
