import { resolveSermonTypeForMoment } from "@/lib/moments";
import type { DailyStep } from "@/lib/dailyPractice";

/**
 * What each day's walk holds. The category's experience (the reading step)
 * always comes first; what follows depends on what that kind of day is for,
 * so the walk is two or three steps and the quiz turns up only where
 * remembering the detail is the point. Change a day's shape here only:
 * Home, the walk, the progress bar and the streak all read it.
 */
const BY_CATEGORY: Record<string, DailyStep[]> = {
  "daily-church": ["reading", "action", "prayer"],        // a talk, then live it, then pray
  "jesus-only": ["reading", "prayer"],                     // His words, then answer Him
  "letters-struggling": ["reading", "prayer"],             // no test on a hard day
  "letters-grateful": ["reading", "action"],               // thanks becomes something you do
  "character-studies": ["reading", "quiz", "prayer"],      // the story has details worth checking
  "deep-verse": ["reading", "quiz"],                       // one verse, studied, then recalled
  "misconceptions": ["reading", "quiz", "action"],         // check the truth stuck, then act on it
  "testimonies": ["reading", "action", "prayer"],          // a story, a step, a prayer for someone
  "questions": ["reading", "prayer"],                      // sit with it; no right answers to score
};
const FALLBACK: DailyStep[] = ["reading", "prayer"];

export function dailyStepsFor(day: number): DailyStep[] {
  return BY_CATEGORY[resolveSermonTypeForMoment({ day }).id] ?? FALLBACK;
}
