import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_BLOCKED_APP_IDS, type SocialAppId } from "@/lib/focus";
import {
  cancelStudySession,
  scheduleStudySession,
  type SchedulableStudySession,
  type WeekdayIndex,
} from "@/lib/notifications";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Bible study sessions — user-scheduled recurring "begin reading"
 * triggers.
 *
 * Each session is a small commitment the user makes to themselves
 * ("Monday–Friday at 7:00 AM I'll spend 10 minutes in the Word").
 * The OS delivers a notification at the chosen time on each chosen
 * day; tapping it lands the user on a landing screen that starts
 * Focus mode and offers to open their last-read chapter.
 *
 * What this provider owns:
 *   • the canonical list of sessions (CRUD)
 *   • the side-effects of mutating that list — scheduling /
 *     cancelling OS-level local notifications so the persisted
 *     intent always matches what's actually queued in the OS
 *
 * What it does NOT own:
 *   • permission state (lib/notifications.ts) — the caller should
 *     ensure permission is granted before enabling a session;
 *     scheduling without permission silently no-ops on iOS
 *   • the focus session that gets started when a notification is
 *     tapped — that's wired by the deep-link handler and the
 *     /study/[id] landing screen, both of which use state/focus.tsx
 *
 * The schedule/cancel calls are awaited inside each mutation so the
 * UI can rely on "after this resolves, the new notification ids are
 * persisted." Failures during scheduling are swallowed — the
 * session still appears in the list (with an empty notificationIds
 * array), and the user can retry by toggling it off/on. We surface
 * the granular failure to the console in dev so it doesn't go
 * silent during development.
 */

// ─────────────────────────────────────────────────────────────────
// Shapes
// ─────────────────────────────────────────────────────────────────

export type StudySession = {
  /** Stable id — never reused, never derived from time/name (those
   *  change). Generated once on creation. */
  id: string;
  /** Display name. Shown on the list row, in the notification body
   *  ("Time for Morning Study"), and on the landing screen. */
  name: string;
  /** Time-of-day the notification should fire. Always interpreted
   *  in the device's local timezone — the OS handles DST so we
   *  don't need to. */
  time: { hour: number; minute: number };
  /** Days of week the session is active. JS conventions:
   *  0 = Sunday, 1 = Monday, …, 6 = Saturday. */
  daysOfWeek: WeekdayIndex[];
  /** When false, the session is kept in the list but no
   *  notifications are scheduled — UX cue is a switch on the row
   *  rather than deleting it outright. */
  enabled: boolean;
  /**
   * Whether tapping "Begin" on this routine's landing screen should
   * activate Focus mode (silencing the apps in `blockedAppIds`).
   *
   * When TRUE: the landing page offers the focus row + starts a
   *   focus session on Begin. This is the "deep practice" mode —
   *   notification arrives → user taps → focus engages → reading.
   * When FALSE: the landing page is just a quiet invitation — Begin
   *   navigates straight to the Library without touching focus
   *   mode at all. The blocked-app list is still kept on the
   *   record (so the user can re-enable later) but is not used.
   *
   * Default for new routines is FALSE so a user who simply wants
   * a scheduled reminder doesn't get surprised by their phone
   * "going quiet" the first time the notification fires. Users
   * who DO want the deeper experience opt in explicitly.
   */
  useFocusMode: boolean;
  /**
   * Per-routine list of apps to silence during this study session.
   * Each routine carries its OWN snapshot — a morning study might
   * silence Instagram + TikTok, while a quieter evening one might
   * also silence Messages. The list is independent from the global
   * focus prefs so users can fine-tune per ritual.
   *
   * Only consulted when `useFocusMode === true`. The list is still
   * editable when focus is off (so the user can curate it ahead of
   * a future opt-in) but it has no runtime effect until the toggle
   * flips on.
   *
   * Defaults for a new session pick up either the user's current
   * focus-prefs list (if they've personalized it) or the catalog
   * default — done at the editor layer so this provider stays
   * agnostic of how the default is sourced.
   */
  blockedAppIds: SocialAppId[];
  /** OS-level notification ids backing this session (one per active
   *  day-of-week). Populated by the scheduler; used to cancel
   *  precisely when the session is edited / disabled / deleted. */
  notificationIds: string[];
};

/** Mutation payload — everything required to define a session
 *  except the bookkeeping (id + notificationIds, which the
 *  provider owns). */
export type StudySessionDraft = Omit<StudySession, "id" | "notificationIds">;

type StudySessionsState = {
  sessions: StudySession[];
};

const EMPTY: StudySessionsState = { sessions: [] };

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

type StudySessionsContextValue = {
  sessions: StudySession[];
  hydrated: boolean;

  /** Add a new session. Resolves with the new id once both the OS
   *  scheduling and the state update have completed. */
  addSession: (draft: StudySessionDraft) => Promise<string>;

  /** Replace a session by id. Cancels the previously-scheduled
   *  notifications and (if still enabled) schedules new ones. */
  updateSession: (id: string, patch: Partial<StudySessionDraft>) => Promise<void>;

  /** Remove a session entirely. Cancels its notifications. */
  removeSession: (id: string) => Promise<void>;

  /** Flip the enabled flag — convenience wrapper around updateSession
   *  for the common case of toggling a row off without losing its
   *  config. */
  toggleSession: (id: string) => Promise<void>;

  /** Find a session by id without forcing the caller to do their own
   *  array scan. Returns undefined if not found. */
  getSession: (id: string) => StudySession | undefined;

  /** Wipe every session — used by dev "Reset App" and Settings
   *  "Delete my data". Cancels all backing notifications first. */
  reset: () => Promise<void>;
};

const StudySessionsContext = createContext<StudySessionsContextValue | null>(
  null,
);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function StudySessionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudySessionsState>(EMPTY);

  // Tolerant load — sanitize the persisted payload field-by-field so
  // a partially-corrupt save (e.g. someone hand-edits AsyncStorage,
  // a schema migration goes sideways, etc.) drops invalid entries
  // rather than crashing the whole provider.
  const applyLoaded = useCallback((loaded: StudySessionsState) => {
    if (!loaded || !Array.isArray(loaded.sessions)) {
      setState(EMPTY);
      return;
    }
    const cleaned: StudySession[] = [];
    for (const raw of loaded.sessions) {
      if (!raw || typeof raw !== "object") continue;
      const id = typeof raw.id === "string" ? raw.id : null;
      const name = typeof raw.name === "string" ? raw.name : "";
      if (!id) continue;
      const time =
        raw.time && typeof raw.time === "object"
          ? {
              hour:
                typeof raw.time.hour === "number"
                  ? clampHour(raw.time.hour)
                  : 7,
              minute:
                typeof raw.time.minute === "number"
                  ? clampMinute(raw.time.minute)
                  : 0,
            }
          : { hour: 7, minute: 0 };
      const daysOfWeek = Array.isArray(raw.daysOfWeek)
        ? (raw.daysOfWeek.filter(
            (d): d is WeekdayIndex =>
              typeof d === "number" && d >= 0 && d <= 6,
          ) as WeekdayIndex[])
        : [];
      const enabled = typeof raw.enabled === "boolean" ? raw.enabled : false;
      const notificationIds = Array.isArray(raw.notificationIds)
        ? raw.notificationIds.filter((x): x is string => typeof x === "string")
        : [];
      // Tolerate older saves that didn't carry blockedAppIds —
      // we hydrate them with the catalog defaults so existing
      // routines start working with focus mode immediately when
      // the user upgrades. New saves always persist their own
      // explicit list (set in the editor).
      const blockedAppIds = Array.isArray(raw.blockedAppIds)
        ? (raw.blockedAppIds.filter(
            (x): x is SocialAppId => typeof x === "string",
          ) as SocialAppId[])
        : [...DEFAULT_BLOCKED_APP_IDS];
      // useFocusMode was added after the initial release. Older
      // saves are migrated by setting it false (the conservative
      // default — they get the reminder, no focus surprise) so
      // upgrading users aren't suddenly thrust into focus mode
      // by routines they configured before the flag existed.
      const useFocusMode =
        typeof raw.useFocusMode === "boolean" ? raw.useFocusMode : false;
      cleaned.push({
        id,
        name,
        time,
        daysOfWeek,
        enabled,
        useFocusMode,
        blockedAppIds,
        notificationIds,
      });
    }
    setState({ sessions: cleaned });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.studySessions,
    state,
    applyLoaded,
  );

  // ─── CRUD ──────────────────────────────────────────────────────

  const addSession = useCallback(
    async (draft: StudySessionDraft): Promise<string> => {
      const id = makeStudySessionId();
      const candidate: SchedulableStudySession = {
        id,
        name: draft.name,
        time: draft.time,
        daysOfWeek: draft.daysOfWeek,
        enabled: draft.enabled,
      };
      // Schedule first so the persisted state matches what's
      // actually queued in the OS. If scheduling fails we still
      // create the session (with empty ids) — the user can retry
      // by toggling it off and on.
      let notificationIds: string[] = [];
      try {
        notificationIds = await scheduleStudySession(candidate);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[studySessions] schedule failed on add", err);
        }
      }
      const next: StudySession = { ...draft, id, notificationIds };
      setState((cur) => ({ sessions: [...cur.sessions, next] }));
      return id;
    },
    [],
  );

  const updateSession = useCallback(
    async (id: string, patch: Partial<StudySessionDraft>): Promise<void> => {
      // Snapshot the current session synchronously — we need it
      // both for the cancel call AND to build the merged draft.
      const snapshot = state.sessions.find((s) => s.id === id);
      if (!snapshot) return;

      // Cancel the existing notifications first. Always safe even
      // if the array is empty (cancel iterates 0 ids → no-op).
      await cancelStudySession(snapshot.notificationIds);

      const merged: StudySession = {
        ...snapshot,
        ...patch,
        // Always reset ids — they'll be repopulated by the
        // schedule call below or left empty if the session is
        // disabled / has no days.
        notificationIds: [],
      };

      let notificationIds: string[] = [];
      try {
        notificationIds = await scheduleStudySession(merged);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[studySessions] schedule failed on update", err);
        }
      }

      setState((cur) => ({
        sessions: cur.sessions.map((s) =>
          s.id === id ? { ...merged, notificationIds } : s,
        ),
      }));
    },
    [state.sessions],
  );

  const removeSession = useCallback(
    async (id: string): Promise<void> => {
      const snapshot = state.sessions.find((s) => s.id === id);
      if (snapshot) {
        await cancelStudySession(snapshot.notificationIds);
      }
      setState((cur) => ({
        sessions: cur.sessions.filter((s) => s.id !== id),
      }));
    },
    [state.sessions],
  );

  const toggleSession = useCallback(
    async (id: string): Promise<void> => {
      const snapshot = state.sessions.find((s) => s.id === id);
      if (!snapshot) return;
      await updateSession(id, { enabled: !snapshot.enabled });
    },
    [state.sessions, updateSession],
  );

  const getSession = useCallback(
    (id: string): StudySession | undefined => {
      return state.sessions.find((s) => s.id === id);
    },
    [state.sessions],
  );

  const reset = useCallback(async (): Promise<void> => {
    // Cancel every session's notifications first so the OS queue
    // is left clean — failing to do this would leave dangling
    // notifications scheduled even though the user wiped state.
    for (const session of state.sessions) {
      await cancelStudySession(session.notificationIds);
    }
    setState(EMPTY);
    removeKey(STORAGE_KEYS.studySessions);
  }, [state.sessions]);

  const value = useMemo<StudySessionsContextValue>(
    () => ({
      sessions: state.sessions,
      hydrated,
      addSession,
      updateSession,
      removeSession,
      toggleSession,
      getSession,
      reset,
    }),
    [
      state.sessions,
      hydrated,
      addSession,
      updateSession,
      removeSession,
      toggleSession,
      getSession,
      reset,
    ],
  );

  return (
    <StudySessionsContext.Provider value={value}>
      {children}
    </StudySessionsContext.Provider>
  );
}

export function useStudySessions(): StudySessionsContextValue {
  const ctx = useContext(StudySessionsContext);
  if (!ctx) {
    throw new Error(
      "useStudySessions must be used inside a <StudySessionsProvider>.",
    );
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a stable id for a new study session. The shape is
 * `study-<base36 ts>-<random>` — short enough to fit comfortably in
 * a deep-link path (`/study/study-l4kx2-9f2`) and unique enough
 * across realistic user volumes.
 */
function makeStudySessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `study-${ts}-${rand}`;
}

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 7;
  return Math.max(0, Math.min(23, Math.floor(h)));
}

function clampMinute(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(59, Math.floor(m)));
}

// ─────────────────────────────────────────────────────────────────
// Day-of-week label helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Single-letter labels used by the day picker chips. Sunday-first
 * to match the iOS/macOS Calendar default — Monday-first is a
 * legitimate alternative but would surprise the US-default user
 * base for v1.
 */
export const WEEKDAY_LABELS: readonly { index: WeekdayIndex; short: string; full: string }[] = [
  { index: 0, short: "S", full: "Sun" },
  { index: 1, short: "M", full: "Mon" },
  { index: 2, short: "T", full: "Tue" },
  { index: 3, short: "W", full: "Wed" },
  { index: 4, short: "T", full: "Thu" },
  { index: 5, short: "F", full: "Fri" },
  { index: 6, short: "S", full: "Sat" },
];

/**
 * Format a set of weekday indices as a compact human label, e.g.:
 *   • [1,2,3,4,5]       → "Mon–Fri"
 *   • [0,6]             → "Weekends"
 *   • [0,1,2,3,4,5,6]   → "Every day"
 *   • [1,3,5]           → "Mon, Wed, Fri"
 *   • []                → "Never"
 *
 * This is the label shown beneath each session row on the list
 * screen, so it has to read at a glance.
 */
export function formatDaysOfWeek(days: readonly WeekdayIndex[]): string {
  if (days.length === 0) return "Never";
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  const weekdays = [1, 2, 3, 4, 5];
  const weekends = [0, 6];
  const isWeekdays =
    set.size === 5 && weekdays.every((d) => set.has(d as WeekdayIndex));
  if (isWeekdays) return "Mon–Fri";
  const isWeekends =
    set.size === 2 && weekends.every((d) => set.has(d as WeekdayIndex));
  if (isWeekends) return "Weekends";
  // General case — show short names in canonical Sun→Sat order so
  // the visual ordering is stable regardless of insertion order.
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAY_LABELS[d].full).join(", ");
}
