export type DailyPractice = { prayer?: boolean; quiz?: boolean; action?: boolean };

/** All tasks must belong to the same day's reading before that date earns credit. */
export function canCompleteDailyTasks(day: number, date: string, practice: DailyPractice, readings: ReadonlyArray<{ day: number | null; dateISO: string }>): boolean {
  return Boolean(practice.prayer && practice.quiz && practice.action && readings.some(reading => reading.day === day && reading.dateISO === date));
}
