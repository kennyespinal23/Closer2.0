import type { DailyStep } from "@/lib/dailyPractice";

export type DailyPractice = { prayer?: boolean; quiz?: boolean; action?: boolean };

/** Every step the day holds must be done, and its reading must belong to the same day, before that date earns credit. */
export function canCompleteDailyTasks(day: number, date: string, practice: DailyPractice, readings: ReadonlyArray<{ day: number | null; dateISO: string }>, steps: ReadonlyArray<DailyStep>): boolean {
  const practicesDone = steps.every(step => step === "reading" || practice[step]);
  return practicesDone && readings.some(reading => reading.day === day && reading.dateISO === date);
}
