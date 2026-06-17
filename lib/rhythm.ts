/**
 * Rhythm helpers — date math + grid builders shared between
 * the home page's current-month calendar and the /rhythm
 * detail page's full-year heatmap.
 *
 * Pure functions only — no React, no AsyncStorage. The detail
 * screen builds 12-month grids, the home card builds a single
 * month, and both pull their lit/idle classification from the
 * same `engagedDates` set so the two surfaces can never paint
 * conflicting data.
 *
 * Cell-state vocabulary:
 *   • engaged    — the user completed a sermon on this date
 *   • idle       — past day, no completion (the negative space
 *                  that makes streaks legible)
 *   • future     — date hasn't happened yet
 *   • outOfMonth — calendar placeholder for the surrounding
 *                  month's days that share a week with the
 *                  rendered month (preserves calendar shape
 *                  on the home grid; ignored on the year
 *                  heatmap which is laid out week-major)
 */

export type RhythmCellState = "engaged" | "idle" | "future" | "outOfMonth";

export type RhythmCell = {
  /** Local-timezone YYYY-MM-DD. */
  dateISO: string;
  state: RhythmCellState;
  isToday: boolean;
};

/**
 * Local-timezone YYYY-MM-DD. Same format `state/progress.ts`
 * uses for `engagedDates`, so membership lookups across the
 * codebase share one canonical string shape.
 */
export function toLocalISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Build a Sunday → Saturday calendar grid for `year`/`monthIdx`
 * (monthIdx is JS-zero-based). Each row is a complete week;
 * cells outside the rendered month are marked `outOfMonth` so
 * the renderer can ghost them and preserve calendar shape.
 *
 * `referenceToday` lets callers override "today" — useful for
 * detail pages that show a past month, where the future-vs-
 * idle split should still be anchored on the real today even
 * though the rendered month is in the past.
 */
export function buildMonthGrid(
  engagedDates: ReadonlyArray<string>,
  year: number,
  monthIdx: number,
  referenceToday?: Date,
): {
  rows: ReadonlyArray<ReadonlyArray<RhythmCell>>;
  monthLabel: string;
  engagedCount: number;
  totalDays: number;
} {
  const today = referenceToday ? new Date(referenceToday) : new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toLocalISO(today);

  const firstOfMonth = new Date(year, monthIdx, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const lastOfMonth = new Date(year, monthIdx + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const engagedSet = new Set(engagedDates);
  const rows: Array<Array<RhythmCell>> = [];

  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    const row: Array<RhythmCell> = [];
    for (let i = 0; i < 7; i++) {
      const iso = toLocalISO(cursor);
      const inMonth = cursor.getMonth() === monthIdx;
      const isFuture = cursor.getTime() > today.getTime();
      const engaged = engagedSet.has(iso);
      let state: RhythmCellState;
      if (!inMonth) state = "outOfMonth";
      else if (engaged) state = "engaged";
      else if (isFuture) state = "future";
      else state = "idle";
      row.push({ dateISO: iso, state, isToday: iso === todayISO });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }

  let engagedCount = 0;
  for (const row of rows) {
    for (const cell of row) {
      if (cell.state === "engaged") engagedCount++;
    }
  }

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return {
    rows,
    monthLabel,
    engagedCount,
    totalDays: lastOfMonth.getDate(),
  };
}

/**
 * Build the 7-cell Sunday → Saturday grid for the week
 * containing `referenceToday` (defaults to actual today).
 *
 * Drives the home card's "This week" mini-calendar. Unlike
 * `buildMonthGrid`, this never produces `outOfMonth` cells:
 * every day in the week — even days from an adjacent month
 * when the week straddles a month boundary — gets its real
 * engaged / idle / future classification so the home glance
 * accurately represents the actual 7-day window.
 *
 * `weekStartISO` and `weekEndISO` are returned alongside the
 * cells so callers can format a "Jun 7 – 13" range label
 * without recomputing the week boundaries themselves.
 */
export function buildCurrentWeek(
  engagedDates: ReadonlyArray<string>,
  referenceToday?: Date,
): {
  cells: ReadonlyArray<RhythmCell>;
  weekStartISO: string;
  weekEndISO: string;
  engagedCount: number;
} {
  const today = referenceToday ? new Date(referenceToday) : new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toLocalISO(today);

  // Snap to Sunday of the week containing today.
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const engagedSet = new Set(engagedDates);
  const cells: Array<RhythmCell> = [];
  let engagedCount = 0;

  const cursor = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const iso = toLocalISO(cursor);
    const isFuture = cursor.getTime() > today.getTime();
    const engaged = engagedSet.has(iso);
    let state: RhythmCellState;
    // No `outOfMonth` branch — every cell in the 7-day window
    // is a real day in the user's calendar regardless of
    // which month boundary it lands on.
    if (engaged) state = "engaged";
    else if (isFuture) state = "future";
    else state = "idle";
    if (engaged) engagedCount++;
    cells.push({ dateISO: iso, state, isToday: iso === todayISO });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    cells,
    weekStartISO: toLocalISO(weekStart),
    weekEndISO: toLocalISO(weekEnd),
    engagedCount,
  };
}

/**
 * Per-month engagement summary for an entire year. Drives the
 * detail page's "Completions / Month" bar chart and the
 * year-total stat card.
 */
export function buildYearSummary(
  engagedDates: ReadonlyArray<string>,
  year: number,
): {
  monthly: ReadonlyArray<{ monthIdx: number; label: string; count: number }>;
  total: number;
} {
  const monthly: Array<{ monthIdx: number; label: string; count: number }> = [];
  for (let m = 0; m < 12; m++) {
    monthly.push({
      monthIdx: m,
      label: new Date(year, m, 1).toLocaleDateString(undefined, {
        month: "short",
      }),
      count: 0,
    });
  }
  const yearPrefix = `${year}-`;
  for (const iso of engagedDates) {
    if (!iso.startsWith(yearPrefix)) continue;
    const monthIdx = parseInt(iso.slice(5, 7), 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) continue;
    monthly[monthIdx]!.count++;
  }
  const total = monthly.reduce((s, m) => s + m.count, 0);
  return { monthly, total };
}

/**
 * Year-long week × day heatmap suitable for the detail page.
 * Returns 53 columns (max weeks in a year) × 7 rows; cells
 * outside the year render as `outOfMonth` (used as a
 * "doesn't apply" placeholder).
 *
 * Anchored to Jan 1 of the year, walking forward to Dec 31.
 * The first column may straddle into late December of the
 * previous year (to keep the first row aligned with Sunday);
 * those cells are `outOfMonth`.
 */
export function buildYearHeatmap(
  engagedDates: ReadonlyArray<string>,
  year: number,
  referenceToday?: Date,
): {
  cols: ReadonlyArray<ReadonlyArray<RhythmCell>>;
  monthLabels: ReadonlyArray<{ colIdx: number; label: string }>;
} {
  const today = referenceToday ? new Date(referenceToday) : new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toLocalISO(today);

  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  // Snap to Sunday of the week containing Jan 1.
  const gridStart = new Date(jan1);
  gridStart.setDate(jan1.getDate() - jan1.getDay());

  const engagedSet = new Set(engagedDates);
  const cols: Array<Array<RhythmCell>> = [];
  const monthLabels: Array<{ colIdx: number; label: string }> = [];
  let lastLabeledMonth = -1;

  const cursor = new Date(gridStart);
  let colIdx = 0;
  while (cursor.getTime() <= dec31.getTime()) {
    const col: Array<RhythmCell> = [];
    let firstDayOfMonthInCol = -1;
    for (let row = 0; row < 7; row++) {
      const iso = toLocalISO(cursor);
      const inYear = cursor.getFullYear() === year;
      const isFuture = cursor.getTime() > today.getTime();
      const engaged = engagedSet.has(iso);
      let state: RhythmCellState;
      if (!inYear) state = "outOfMonth";
      else if (engaged) state = "engaged";
      else if (isFuture) state = "future";
      else state = "idle";
      if (inYear && cursor.getDate() === 1) {
        firstDayOfMonthInCol = cursor.getMonth();
      }
      col.push({ dateISO: iso, state, isToday: iso === todayISO });
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(col);
    // Only label a column when its row contains the 1st of a
    // new month — this gives the heatmap the standard GitHub-
    // contributions-style monthly tick row above it.
    if (firstDayOfMonthInCol >= 0 && firstDayOfMonthInCol !== lastLabeledMonth) {
      monthLabels.push({
        colIdx,
        label: new Date(year, firstDayOfMonthInCol, 1).toLocaleDateString(
          undefined,
          { month: "short" },
        ),
      });
      lastLabeledMonth = firstDayOfMonthInCol;
    }
    colIdx++;
  }

  return { cols, monthLabels };
}
