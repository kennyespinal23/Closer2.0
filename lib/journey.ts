import { findBookById } from "@/constants/books";
import { findMood, type Mood, type MoodId } from "@/constants/moods";
import { getSermonTypeById } from "@/constants/sermonTypes";
import type {
  AnnotationsState,
  HighlightColor,
  HighlightColorId,
} from "@/state/annotations";
import {
  findHighlightColor,
  HIGHLIGHT_COLORS,
  parseVerseKey,
  type VerseRef,
} from "@/state/annotations";
import type { CheckInsState } from "@/state/checkIns";
import type { ChapterRead, ProgressState } from "@/state/progress";
import {
  MILESTONE_DAYS,
  milestoneCopy,
  milestoneLabel,
} from "@/lib/milestones";

/**
 * The Journey timeline.
 *
 * One pure function — `buildJourney` — takes the full progress +
 * annotations state and returns an array of JourneyDay buckets,
 * newest first. Each bucket holds the events that happened on that
 * day, sorted within-day by time-of-event (newest first).
 *
 * Event kinds:
 *   • note      — a verse note was created/updated
 *   • highlight — a verse was highlighted
 *   • sermon    — a sermon was completed
 *   • chapter   — a chapter was marked as read
 *   • milestone — the user crossed a streak threshold (3/7/14/30/…)
 *
 * Milestones are computed by walking the sorted engagedDates list
 * and detecting when each consecutive run first crosses a threshold.
 * They're emitted at midnight (epoch 12:00 noon of the local day)
 * since their granularity is the day, not a clock-time.
 *
 * Keeping this as a single pure function (not a hook, not in
 * Context) makes it trivial to test, memoize, or swap with a
 * server-driven feed later.
 */

// ─────────────────────────────────────────────────────────────────
// Event shape
// ─────────────────────────────────────────────────────────────────

export type JourneyEventBase = {
  /** Unique React key for the row. */
  id: string;
  /** Epoch ms — within-day ordering. */
  at: number;
  /** YYYY-MM-DD — day-bucket key. */
  dateISO: string;
};

export type NoteEvent = JourneyEventBase & {
  kind: "note";
  verse: VerseRef;
  reference: string;
  noteText: string;
  verseSnippet: string;
};

export type HighlightEvent = JourneyEventBase & {
  kind: "highlight";
  verse: VerseRef;
  reference: string;
  color: HighlightColor;
  verseSnippet: string;
};

export type SermonEvent = JourneyEventBase & {
  kind: "sermon";
  title: string;
  pastor: string;
  typeId: string;
  /** Sermon-type accent color (resolved at build-time). */
  accent: string;
};

export type ChapterEvent = JourneyEventBase & {
  kind: "chapter";
  bookId: string;
  chapter: number;
  reference: string;
};

export type MilestoneEvent = JourneyEventBase & {
  kind: "milestone";
  /** The day-count threshold reached (3, 7, 14, 30, …). */
  days: number;
  /** Short human label, e.g. "3-day streak". */
  label: string;
  /** Longer celebratory copy for the card body. */
  copy: string;
};

export type CheckInEvent = JourneyEventBase & {
  kind: "checkIn";
  /**
   * Original CheckIn id from the store (not the journey-event id,
   * which is prefixed with `checkin-`). Used to deep-link from the
   * Journey timeline into the per-check-in detail page.
   */
  checkInId: string;
  moodId: MoodId;
  /** Resolved mood object — null if the catalog dropped it after a save. */
  mood: Mood | null;
  verse: VerseRef;
  reference: string;
  verseText: string;
  /**
   * Reflection the user wrote after receiving the verse. `undefined`
   * if they never opened the journal editor for this check-in.
   */
  journalText?: string;
};

export type JourneyEvent =
  | NoteEvent
  | HighlightEvent
  | SermonEvent
  | ChapterEvent
  | MilestoneEvent
  | CheckInEvent;

/**
 * A bundle of notes (or highlights) from the same day, collapsed
 * into a single row. Rendered as a stack card the user can expand
 * to reveal — and tap into — each child event.
 *
 * Stacks only form when a day has 2+ events of the same kind. A
 * lone note or highlight stays as its own JourneyEvent row.
 */
export type NoteStack = {
  kind: "noteStack";
  id: string;
  /** Timestamp of the newest child, drives within-day ordering. */
  at: number;
  dateISO: string;
  /** Children, sorted newest-first. */
  notes: NoteEvent[];
};

export type HighlightStack = {
  kind: "highlightStack";
  id: string;
  at: number;
  dateISO: string;
  highlights: HighlightEvent[];
};

export type CheckInStack = {
  kind: "checkInStack";
  id: string;
  at: number;
  dateISO: string;
  checkIns: CheckInEvent[];
};

/** Anything that can appear as a row in a day bucket. */
export type JourneyRow =
  | JourneyEvent
  | NoteStack
  | HighlightStack
  | CheckInStack;

export type JourneyDay = {
  dateISO: string;
  /**
   * Sorted within-day, newest first. May contain individual events
   * AND stacks (notes/highlights collapsed when 2+ in the day).
   */
  rows: JourneyRow[];
};

// ─────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────

export function buildJourney(
  progress: Pick<
    ProgressState,
    "sermonCompletions" | "chaptersRead" | "engagedDates"
  >,
  annotations: Pick<
    AnnotationsState,
    "notes" | "highlights" | "verseSnippets" | "timestamps"
  >,
  checkIns: Pick<CheckInsState, "log"> = { log: [] },
): JourneyDay[] {
  const all: JourneyEvent[] = [];

  // Notes — every NoteEntry is its own timeline row.
  for (const [verseKeyStr, list] of Object.entries(annotations.notes)) {
    const verse = parseVerseKey(verseKeyStr);
    const snippet = annotations.verseSnippets[verseKeyStr] ?? "";
    for (const n of list) {
      all.push({
        kind: "note",
        id: `note-${n.id}`,
        at: n.updatedAt,
        dateISO: dateISO(n.updatedAt),
        verse,
        reference: formatRef(verse),
        noteText: n.text,
        verseSnippet: snippet,
      });
    }
  }

  // Highlights — one row per highlighted verse. Timestamp comes from
  // the verse-level annotations.timestamps map.
  for (const [verseKeyStr, colorId] of Object.entries(
    annotations.highlights,
  )) {
    const verse = parseVerseKey(verseKeyStr);
    const at = annotations.timestamps[verseKeyStr] ?? 0;
    const color = findHighlightColor(colorId as HighlightColorId);
    if (!color) continue;
    all.push({
      kind: "highlight",
      id: `hl-${verseKeyStr}`,
      at,
      dateISO: dateISO(at),
      verse,
      reference: formatRef(verse),
      color,
      verseSnippet: annotations.verseSnippets[verseKeyStr] ?? "",
    });
  }

  // Sermon completions — full event log.
  for (const c of progress.sermonCompletions) {
    const type = getSermonTypeById(c.typeId);
    all.push({
      kind: "sermon",
      id: `sermon-${c.id}`,
      at: c.completedAt,
      dateISO: c.dateISO,
      title: c.title || (type?.name ?? "Sermon"),
      pastor: c.pastor,
      typeId: c.typeId,
      accent: type?.accent ?? "#FF7A39",
    });
  }

  // Chapters read.
  for (const r of progress.chaptersRead) {
    // Older entries may not have completedAt — fall back to a stable
    // mid-day time so they still slot under their dateISO bucket.
    const at = r.completedAt ?? midDayOf(r.dateISO);
    all.push({
      kind: "chapter",
      id: `chap-${r.bookId}-${r.chapter}-${r.dateISO}`,
      at,
      dateISO: r.dateISO,
      bookId: r.bookId,
      chapter: r.chapter,
      reference: chapterRef(r),
    });
  }

  // Milestones — derived from engagedDates. Only the FIRST crossing
  // of each threshold per consecutive run is emitted (later days of
  // the same run don't generate new milestone cards).
  for (const m of deriveMilestones(progress.engagedDates)) {
    all.push(m);
  }

  // Check-ins — each mood + delivered verse is its own row.
  for (const ci of checkIns.log) {
    all.push({
      kind: "checkIn",
      id: `checkin-${ci.id}`,
      checkInId: ci.id,
      at: ci.createdAt,
      dateISO: ci.dateISO,
      moodId: ci.moodId,
      mood: findMood(ci.moodId),
      verse: {
        bookId: ci.verse.bookId,
        chapter: ci.verse.chapter,
        verse: ci.verse.verse,
      },
      reference: ci.verse.reference,
      verseText: ci.verse.text,
      journalText: ci.journalText,
    });
  }

  // Bucket by day, sort each bucket newest-first, then sort buckets
  // newest-first too.
  const byDay = new Map<string, JourneyEvent[]>();
  for (const e of all) {
    const existing = byDay.get(e.dateISO);
    if (existing) existing.push(e);
    else byDay.set(e.dateISO, [e]);
  }

  const days: JourneyDay[] = [];
  for (const [dateISOKey, events] of byDay) {
    events.sort((a, b) => b.at - a.at);
    days.push({ dateISO: dateISOKey, rows: groupDayRows(events, dateISOKey) });
  }
  days.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  return days;
}

/**
 * Collapse same-kind chatter into stack rows.
 *
 * Rule:
 *   - 2+ notes in the day      → 1 NoteStack row
 *   - 2+ highlights in the day → 1 HighlightStack row
 *   - 2+ check-ins in the day  → 1 CheckInStack row
 *   - everything else stays individual (sermons, chapters,
 *     milestones — each is a discrete moment worth its own row)
 *
 * The stack inherits the newest child's timestamp so the day's
 * within-day ordering stays meaningful: a stack containing a
 * just-added note sorts above an older sermon completion.
 */
function groupDayRows(
  events: JourneyEvent[],
  dateISO: string,
): JourneyRow[] {
  const notes: NoteEvent[] = [];
  const highlights: HighlightEvent[] = [];
  const checkIns: CheckInEvent[] = [];
  const others: JourneyEvent[] = [];

  for (const e of events) {
    if (e.kind === "note") notes.push(e);
    else if (e.kind === "highlight") highlights.push(e);
    else if (e.kind === "checkIn") checkIns.push(e);
    else others.push(e);
  }

  const rows: JourneyRow[] = [...others];

  if (notes.length >= 2) {
    rows.push({
      kind: "noteStack",
      id: `stack-notes-${dateISO}`,
      at: notes[0]!.at,
      dateISO,
      notes,
    });
  } else if (notes.length === 1) {
    rows.push(notes[0]!);
  }

  if (highlights.length >= 2) {
    rows.push({
      kind: "highlightStack",
      id: `stack-highlights-${dateISO}`,
      at: highlights[0]!.at,
      dateISO,
      highlights,
    });
  } else if (highlights.length === 1) {
    rows.push(highlights[0]!);
  }

  if (checkIns.length >= 2) {
    rows.push({
      kind: "checkInStack",
      id: `stack-checkins-${dateISO}`,
      at: checkIns[0]!.at,
      dateISO,
      checkIns,
    });
  } else if (checkIns.length === 1) {
    rows.push(checkIns[0]!);
  }

  rows.sort((a, b) => b.at - a.at);
  return rows;
}

// ─────────────────────────────────────────────────────────────────
// Milestone derivation
//
// We celebrate small thresholds (3 days) eagerly because that's where
// most new habits die, then space out as the streak gets longer.
// Each threshold can fire MULTIPLE times across a user's history if
// they break and rebuild streaks — every time they hit "3 days" on a
// fresh run, that's worth marking. The threshold is keyed by
// (days, dateISO-of-crossing) to keep the id stable + de-duped.
// ─────────────────────────────────────────────────────────────────

// Milestone thresholds live in lib/milestones.ts (90 entries).
// ─────────────────────────────────────────────────────────────────

function deriveMilestones(
  engagedDates: ReadonlyArray<string>,
): MilestoneEvent[] {
  if (engagedDates.length === 0) return [];

  const out: MilestoneEvent[] = [];

  // Walk the sorted engagedDates, tracking current consecutive-run
  // length. When that length first hits any milestone threshold
  // within this run, emit a milestone event dated to THAT day.
  let runLen = 0;
  let prev: string | null = null;
  const firedInRun = new Set<number>();

  for (const d of engagedDates) {
    if (prev && isNextDay(prev, d)) {
      runLen++;
    } else {
      runLen = 1;
      firedInRun.clear();
    }

    for (const threshold of MILESTONE_DAYS) {
      if (runLen === threshold && !firedInRun.has(threshold)) {
        firedInRun.add(threshold);
        out.push({
          kind: "milestone",
          id: `milestone-${threshold}-${d}`,
          at: midDayOf(d),
          dateISO: d,
          days: threshold,
          label: milestoneLabel(threshold),
          copy: milestoneCopy(threshold),
        });
      }
    }
    prev = d;
  }
  return out;
}

// Re-export for consumers that import from lib/journey.
export { MILESTONE_DAYS, milestoneCopy, milestoneLabel };

// ─────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────

function formatRef(v: VerseRef): string {
  const book = findBookById(v.bookId);
  const name = book?.name ?? v.bookId;
  return `${name} ${v.chapter}:${v.verse}`;
}

function chapterRef(r: ChapterRead): string {
  const book = findBookById(r.bookId);
  const name = book?.name ?? r.bookId;
  return `${name} ${r.chapter}`;
}

function dateISO(epochMs: number): string {
  const d = new Date(epochMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function midDayOf(iso: string): number {
  // Mid-day so the milestone naturally sorts between morning sermon
  // completions and evening note-taking on the same date.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

function isNextDay(prev: string, next: string): boolean {
  const [py, pm, pd] = prev.split("-").map(Number);
  const date = new Date(py, pm - 1, pd);
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` === next;
}

// ─────────────────────────────────────────────────────────────────
// Friendly day labels for headers
// ─────────────────────────────────────────────────────────────────

/**
 * Day header label for a YYYY-MM-DD. Returns two-part labels so the
 * UI can render the friendly word in primary type and the literal
 * date as a subtle suffix:
 *
 *   Today · May 30
 *   Yesterday · May 29
 *   Wednesday · May 27
 *   May 12
 *   May 12, 2025
 */
export type DayHeaderLabel = {
  /** Main label — "Today", "Yesterday", weekday name, or the date. */
  primary: string;
  /** Optional secondary string — the literal date when `primary`
   *  is a friendly word. Null when `primary` already IS the date. */
  secondary: string | null;
};

export function formatDayHeader(
  iso: string,
  now: Date = new Date(),
): DayHeaderLabel {
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const today = isoOf(todayMidnight);
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const literalDate = formatLiteralDate(date, todayMidnight);

  if (iso === today) return { primary: "Today", secondary: literalDate };

  const yesterday = new Date(todayMidnight);
  yesterday.setDate(todayMidnight.getDate() - 1);
  if (iso === isoOf(yesterday)) {
    return { primary: "Yesterday", secondary: literalDate };
  }

  const dayDiff = Math.round(
    (todayMidnight.getTime() - date.getTime()) / 86_400_000,
  );

  if (dayDiff < 7 && dayDiff > 0) {
    return {
      primary: date.toLocaleDateString("en-US", { weekday: "long" }),
      secondary: literalDate,
    };
  }
  return { primary: literalDate, secondary: null };
}

function formatLiteralDate(date: Date, today: Date): string {
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(
    "en-US",
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}

function isoOf(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// re-export to keep the colors palette accessible to consumers who
// want to render a per-color summary without importing it separately.
export { HIGHLIGHT_COLORS };
