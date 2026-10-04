/** First local calendar day on which the consecutive-day target was reached. */
export function streakEarnedAt(days: readonly string[], target: number): number | undefined {
  let run = 0, previous = 0;
  for (const day of [...new Set(days)].sort()) {
    const stamp = Date.parse(`${day}T00:00:00Z`);
    if (!Number.isFinite(stamp)) continue;
    run = stamp - previous === 86400000 ? run + 1 : 1;
    previous = stamp;
    if (run >= target) return new Date(`${day}T12:00:00`).getTime();
  }
  return undefined;
}
