import { LESSONS } from ".";
import type { Lesson } from "../lesson/types";
import { library, type Entry, type Shelf } from "./library";

/* Today's experience: a different category each day, and within it a different experience each time it comes round.
   The same date always gives the same pick, so Today and Tomorrow agree. */

/* Three purposes, mixed through the calendar so no stretch of days is all one kind:
   Know God (Scripture, theology, history, science, Jesus), Grow with God (prayer, reflection, poetry, your own
   walk with him) and Live your faith (ordinary days, practised). They are how the days are balanced, not tabs. */
const PILLAR: Record<string, "know" | "grow" | "live"> = {
  stories: "know", jesus: "know", mysteries: "know", books: "know", connections: "know", myths: "know", questions: "know", theology: "know", science: "know", history: "know", testimonies: "know",
  heart: "grow", poetry: "grow", pray: "grow", psalms: "grow",
  everyday: "live",
};
const ROTATION = ["stories", "heart", "everyday", "mysteries", "poetry", "jesus", "history", "pray", "myths", "psalms", "science", "everyday", "connections", "heart", "theology", "poetry", "questions", "books", "pray", "testimonies"];
export const pillarOf = (shelf: string) => PILLAR[shelf];

/* Now and then, Page sets the learning aside: A Little Reminder takes the day instead (about every three weeks). */
const PAUSE = { lesson: "heart-reminder", every: 19, at: 7 };

export type Daily = { lesson: Lesson; entry: Entry; shelf: Shelf };

function dayNumber(d: Date) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function dailyPick(d: Date): Daily {
  const n = dayNumber(d);
  if (n % PAUSE.every === PAUSE.at) {
    const shelf = library.find(s => s.entries.some(e => e.lessonId === PAUSE.lesson));
    const entry = shelf?.entries.find(e => e.lessonId === PAUSE.lesson);
    if (shelf && entry && LESSONS[PAUSE.lesson]) return { lesson: LESSONS[PAUSE.lesson], entry, shelf };
  }
  const shelves = ROTATION.map(id => library.find(s => s.id === id)).filter((s): s is Shelf => !!s);
  const shelf = shelves[n % shelves.length];
  // a shelf that appears twice in the rotation takes its next experience the second time
  const turn = ROTATION.slice(0, n % shelves.length).filter(id => id === shelf.id).length;
  const ready = shelf.entries.filter(e => e.lessonId && LESSONS[e.lessonId] && e.lessonId !== PAUSE.lesson);
  const laps = ROTATION.filter(id => id === shelf.id).length;
  const entry = ready[(Math.floor(n / shelves.length) * laps + turn) % ready.length];
  return { lesson: LESSONS[entry.lessonId!], entry, shelf };
}
