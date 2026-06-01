import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BLOCKED_APP_IDS,
  FOCUS_SESSION_MAX_AGE_MS,
  shieldStart,
  shieldStop,
  type SocialAppId,
} from "@/lib/focus";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Focus-mode provider.
 *
 * Owns two pieces of persisted state:
 *
 *   1. `prefs` — the user's standing preferences
 *        • enabled         — master toggle: does the sermon flow even
 *                            offer to start a focus session?
 *        • blockedAppIds   — which apps should be in the shield list
 *                            when a session starts
 *        • autoStart       — when true, tapping "Begin" on the sermon
 *                            intro starts a session silently; when
 *                            false, the user sees an inline reminder
 *                            of what's about to happen
 *
 *   2. `session` — the currently-active session, or null
 *        • startedAt       — epoch ms; used for the stale-session
 *                            sweeper so a forgotten session can't
 *                            trap the user in a "shield up" state
 *        • sermonDay       — the catalog day this session was started
 *                            for, so we can correlate it with today's
 *                            moment when the user returns
 *        • blockedAppIds   — snapshot of which apps are being
 *                            blocked right now (NOT a reference to
 *                            prefs.blockedAppIds — if the user
 *                            changes their list mid-session, the
 *                            current session keeps its original
 *                            blocked set)
 *
 * The provider also drives the shield itself via `shieldStart` /
 * `shieldStop` from lib/focus.ts. Phase 1's shield is a no-op stub;
 * Phase 2 swaps to the real native call without touching any of
 * the call sites here.
 */

// ─────────────────────────────────────────────────────────────────
// Shapes
// ─────────────────────────────────────────────────────────────────

export type FocusPrefs = {
  /** Master toggle. When false the sermon intro doesn't even show
   *  the focus affordance, and Begin doesn't start a session. */
  enabled: boolean;
  /** Which apps are in the shield list. Stored as ids (strings) so
   *  unknown ids saved by older catalogs still round-trip safely
   *  through the persistence layer; the lookup logic in
   *  lib/focus.ts ignores anything that doesn't match. */
  blockedAppIds: SocialAppId[];
  /** When true, tapping Begin starts a session silently. When false,
   *  the intro shows a "Focus will start with Begin" line + an
   *  inline "Skip focus this time" affordance. */
  autoStart: boolean;
};

export type FocusSession = {
  startedAt: number;
  sermonDay: number;
  blockedAppIds: SocialAppId[];
  /** Id of the study-session routine that launched this focus
   *  session, when applicable. Absent when focus was started from
   *  the sermon flow (no routine) or directly from the home toggle.
   *  Stored so the home pill can name the originating routine
   *  during an active session — answering "the shield is up — for
   *  WHAT?" rather than just "12 apps quieted". */
  routineId?: string;
};

export type FocusState = {
  prefs: FocusPrefs;
  /** Null when no session is active; populated when one is. */
  session: FocusSession | null;
};

// ─────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: FocusPrefs = {
  // Off by default — focus mode is opt-in. The user discovers it
  // either by surfacing the row in profile/settings, or by a
  // future onboarding step that introduces it intentionally.
  enabled: false,
  blockedAppIds: [...DEFAULT_BLOCKED_APP_IDS],
  // Default to "ask" (autoStart: false) — the first few times the
  // user begins a sermon with focus enabled, they see the inline
  // explanation. Power users flip it on for a frictionless start.
  autoStart: false,
};

const EMPTY: FocusState = {
  prefs: DEFAULT_PREFS,
  session: null,
};

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

type FocusContextValue = {
  prefs: FocusPrefs;
  session: FocusSession | null;
  hydrated: boolean;
  /** True once the persisted state has loaded AND any stale session
   *  sweeper has run — UI can safely render the session-active or
   *  inactive states without flicker. */
  active: boolean;

  // Pref mutations
  setEnabled: (next: boolean) => void;
  toggleAppBlocked: (id: SocialAppId) => void;
  setAutoStart: (next: boolean) => void;

  // Session mutations
  /** Begin a focus session for the given sermon day.
   *
   *  By default the session snapshots the current
   *  `prefs.blockedAppIds`. Callers that want to start a session
   *  with a CUSTOM app list (e.g. a scheduled study session that
   *  carries its own per-routine blocked list) can pass
   *  `customBlockedAppIds` and the snapshot will use that instead
   *  — leaving the user's global focus prefs untouched.
   *
   *  When the session is launched from a scheduled routine, callers
   *  should also pass `routineId` so the active home pill can name
   *  the source routine instead of just listing apps.
   *
   *  Resolves once the shield call returns (immediate in Phase 1). */
  startSession: (
    sermonDay: number,
    customBlockedAppIds?: ReadonlyArray<SocialAppId>,
    routineId?: string,
  ) => Promise<void>;
  /** End the active session (idempotent). The shield is dropped
   *  unconditionally — safe to call even when no session is on. */
  endSession: () => Promise<void>;

  /** Wipe everything — dev reset + Settings "Delete my data". */
  reset: () => void;
};

const FocusContext = createContext<FocusContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function FocusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FocusState>(EMPTY);

  // Tolerant load — accept any payload, sanitize each field, fall
  // back to defaults on anything we can't parse. The focus shape
  // is small enough that a hand-written validator is clearer than
  // pulling in a schema library.
  const applyLoaded = useCallback((loaded: FocusState) => {
    const safePrefs: FocusPrefs = {
      enabled:
        typeof loaded.prefs?.enabled === "boolean"
          ? loaded.prefs.enabled
          : DEFAULT_PREFS.enabled,
      blockedAppIds:
        Array.isArray(loaded.prefs?.blockedAppIds)
          ? (loaded.prefs.blockedAppIds.filter(
              (x): x is SocialAppId => typeof x === "string",
            ) as SocialAppId[])
          : [...DEFAULT_PREFS.blockedAppIds],
      autoStart:
        typeof loaded.prefs?.autoStart === "boolean"
          ? loaded.prefs.autoStart
          : DEFAULT_PREFS.autoStart,
    };
    // Sessions are persisted so a crash mid-sermon doesn't strand
    // the user in a "shield-up" state. But we only keep a saved
    // session that's fresh enough to plausibly still be in progress
    // — anything older than the cap gets dropped at load time.
    const savedSession = loaded.session;
    const validSession: FocusSession | null =
      savedSession &&
      typeof savedSession.startedAt === "number" &&
      typeof savedSession.sermonDay === "number" &&
      Array.isArray(savedSession.blockedAppIds) &&
      Date.now() - savedSession.startedAt < FOCUS_SESSION_MAX_AGE_MS
        ? {
            startedAt: savedSession.startedAt,
            sermonDay: savedSession.sermonDay,
            blockedAppIds: savedSession.blockedAppIds.filter(
              (x): x is SocialAppId => typeof x === "string",
            ) as SocialAppId[],
            // Preserve the routineId across cold-start. Stored only
            // when it's a non-empty string so we don't carry over
            // stray null/undefined from older payloads.
            ...(typeof savedSession.routineId === "string" &&
            savedSession.routineId.length > 0
              ? { routineId: savedSession.routineId }
              : {}),
          }
        : null;
    setState({ prefs: safePrefs, session: validSession });
  }, []);

  const hydrated = usePersistence(STORAGE_KEYS.focus, state, applyLoaded);

  // Stale-session sweeper. Runs once after hydration completes and
  // any time the persisted session changes — if the session is past
  // its max age, drop it AND tear down the shield (Phase 1 no-op;
  // Phase 2 actually clears ManagedSettings).
  useEffect(() => {
    if (!hydrated) return;
    const s = state.session;
    if (!s) return;
    if (Date.now() - s.startedAt >= FOCUS_SESSION_MAX_AGE_MS) {
      setState((cur) => ({ ...cur, session: null }));
      shieldStop().catch(() => {
        /* shield teardown is best-effort */
      });
    }
  }, [hydrated, state.session]);

  // ─── Pref mutations ──────────────────────────────────────────

  const setEnabled = useCallback((next: boolean) => {
    setState((cur) => ({
      ...cur,
      prefs: { ...cur.prefs, enabled: next },
    }));
  }, []);

  const toggleAppBlocked = useCallback((id: SocialAppId) => {
    setState((cur) => {
      const has = cur.prefs.blockedAppIds.includes(id);
      const nextIds = has
        ? cur.prefs.blockedAppIds.filter((x) => x !== id)
        : [...cur.prefs.blockedAppIds, id];
      return {
        ...cur,
        prefs: { ...cur.prefs, blockedAppIds: nextIds },
      };
    });
  }, []);

  const setAutoStart = useCallback((next: boolean) => {
    setState((cur) => ({
      ...cur,
      prefs: { ...cur.prefs, autoStart: next },
    }));
  }, []);

  // ─── Session mutations ───────────────────────────────────────

  const startSession = useCallback(
    async (
      sermonDay: number,
      customBlockedAppIds?: ReadonlyArray<SocialAppId>,
      routineId?: string,
    ) => {
      // Snapshot the blocked list — either the caller-supplied
      // custom list (study sessions) or the current global prefs
      // (sermon flow). If the user edits their global list during
      // an active session, that change applies to the NEXT
      // session — the current one keeps the list it started with.
      let snapshot: SocialAppId[] = [];
      setState((cur) => {
        snapshot = customBlockedAppIds
          ? [...customBlockedAppIds]
          : [...cur.prefs.blockedAppIds];
        return {
          ...cur,
          session: {
            startedAt: Date.now(),
            sermonDay,
            blockedAppIds: snapshot,
            // Only carry the routineId when the caller actually
            // supplied one (omit-when-undefined keeps the persisted
            // shape minimal for sermon-flow sessions).
            ...(routineId ? { routineId } : {}),
          },
        };
      });
      // Fire the (stub) shield. Failures don't block the session —
      // the UI commits to the focus state regardless, since the
      // user explicitly opted in.
      try {
        await shieldStart(snapshot);
      } catch {
        /* shield is best-effort */
      }
    },
    [],
  );

  const endSession = useCallback(async () => {
    setState((cur) => (cur.session ? { ...cur, session: null } : cur));
    try {
      await shieldStop();
    } catch {
      /* shield teardown is best-effort */
    }
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEYS.focus);
    shieldStop().catch(() => {
      /* shield teardown is best-effort */
    });
  }, []);

  const value = useMemo<FocusContextValue>(
    () => ({
      prefs: state.prefs,
      session: state.session,
      hydrated,
      active: state.session !== null,
      setEnabled,
      toggleAppBlocked,
      setAutoStart,
      startSession,
      endSession,
      reset,
    }),
    [
      state.prefs,
      state.session,
      hydrated,
      setEnabled,
      toggleAppBlocked,
      setAutoStart,
      startSession,
      endSession,
      reset,
    ],
  );

  return (
    <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
  );
}

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error("useFocus must be used inside a <FocusProvider>.");
  }
  return ctx;
}
