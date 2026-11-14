import { LESSONS } from ".";
import type { Lesson } from "../lesson/types";
import { library, type Entry, type Shelf } from "./library";

/* Today's experience: a different category each day, and within it a different experience each time it comes round.
   The same date always gives the same pick, so Today and Tomorrow agree. */

const ROTATION = ["stories", "mysteries", "psalms", "books", "connections", "jesus", "pray", "everyday", "myths", "questions", "testimonies"];

export type Daily = { lesson: Lesson; entry: Entry; shelf: Shelf };

function dayNumber(d: Date) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function dailyPick(d: Date): Daily {
  const n = dayNumber(d);
  const shelves = ROTATION.map(id => library.find(s => s.id === id)).filter((s): s is Shelf => !!s);
  const shelf = shelves[n % shelves.length];
  const ready = shelf.entries.filter(e => e.lessonId && LESSONS[e.lessonId]);
  const entry = ready[Math.floor(n / shelves.length) % ready.length];
  return { lesson: LESSONS[entry.lessonId!], entry, shelf };
}
