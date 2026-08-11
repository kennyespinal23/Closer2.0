import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Per-verse annotations: highlights and notes.
 *
 * Both are independent properties of a verse — a verse can have a
 * highlight without notes, notes without a highlight, or both.
 * They're modeled as separate maps keyed by `verseKey(bookId,
 * chapter, verse)`.
 *
 * Notes are stored as an ARRAY per verse. A reader often layers
 * multiple thoughts on the same verse over time (a memory, a
 * cross-reference, a question), so each entry has its own id +
 * timestamps and is treated as a first-class item in lists.
 *
 * Annotations are translation-agnostic on purpose: highlighting
 * John 3:16 once should travel with you whether you read it in WEB,
 * KJV, or BBE.
 *
 * State is in-memory for now. When AsyncStorage / a backend is
 * wired, only this file changes; every consumer keeps calling
 * `useAnnotations()`.
 */

// ─────────────────────────────────────────────────────────────────
// Highlight color palette
// ─────────────────────────────────────────────────────────────────

export type HighlightColorId =
  | "amber"
  | "ocean"
  | "sage"
  | "rose"
  | "lilac";

export type HighlightColor = {
  id: HighlightColorId;
  /** Solid color for the picker swatch. */
  swatch: string;
  /** Translucent tint painted behind verse text. */
  fill: string;
  /** Optional readable name for screen readers. */
  name: string;
};

// Saturated, iOS-marker style highlights (system yellow/blue/green/
// pink/purple family) rather than muted pastels. Swatches are the
// full-strength hue for the picker; fills are the same hue at a
// mid-alpha that stays legible behind ink on both light and dark
// canvases while reading clearly "highlighted," not washed out.
export const HIGHLIGHT_COLORS: ReadonlyArray<HighlightColor> = [
  { id: "amber", swatch: "#FFC400", fill: "rgba(255, 196, 0, 0.45)",  name: "Amber" },
  { id: "ocean", swatch: "#0A84FF", fill: "rgba(10, 132, 255, 0.38)", name: "Ocean" },
  { id: "sage",  swatch: "#34C759", fill: "rgba(52, 199, 89, 0.42)",  name: "Sage"  },
  { id: "rose",  swatch: "#FF375F", fill: "rgba(255, 55, 95, 0.36)",  name: "Rose"  },
  { id: "lilac", swatch: "#AF52DE", fill: "rgba(175, 82, 222, 0.40)", name: "Lilac" },
];

export function findHighlightColor(
  id: HighlightColorId | null | undefined,
): HighlightColor | null {
  if (!id) return null;
  return HIGHLIGHT_COLORS.find((c) => c.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────
// Key helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Canonical verse key — used as the map key for both highlights and
 * notes so a verse always has the same identity across the app.
 */
export function verseKey(
  bookId: string,
  chapter: number,
  verse: number,
): string {
  return `${bookId}:${chapter}:${verse}`;
}

export type VerseRef = {
  bookId: string;
  chapter: number;
  verse: number;
};

export function parseVerseKey(key: string): VerseRef {
  const [bookId, chapterStr, verseStr] = key.split(":");
  return {
    bookId,
    chapter: parseInt(chapterStr, 10),
    verse: parseInt(verseStr, 10),
  };
}

// ─────────────────────────────────────────────────────────────────
// Note shape
// ─────────────────────────────────────────────────────────────────

/**
 * A single note entry attached to a verse. A verse may have many.
 * Identity is `id`; verse identity comes from the map key it lives
 * under (see `state.notes`).
 */
export type NoteEntry = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  /** Sticky-note paper tint (hex). Optional — legacy notes omit it. */
  color?: string;
};

// ─────────────────────────────────────────────────────────────────
// State + context
// ─────────────────────────────────────────────────────────────────

export type AnnotationsState = {
  /** verseKey -> highlight color id. */
  highlights: Readonly<Record<string, HighlightColorId>>;
  /** verseKey -> array of notes, newest entry last. */
  notes: Readonly<Record<string, ReadonlyArray<NoteEntry>>>;
  /**
   * verseKey -> cached verse text at the time of annotation.
   * Lets the Notes / Highlights list screens display the verse
   * itself without re-fetching the chapter.
   */
  verseSnippets: Readonly<Record<string, string>>;
  /**
   * verseKey -> epoch millis of the most recent annotation event
   * (highlight set/changed OR ANY note added/edited/deleted on this
   * verse). Used for highlight ordering + "today/2 days ago"
   * labels on the highlight list. Per-note timestamps live inside
   * each NoteEntry.
   */
  timestamps: Readonly<Record<string, number>>;
};

/**
 * Flat representation of a single note used by list screens. Each
 * `NoteEntry` on a verse becomes its own `Note` here — so a verse
 * with three notes appears as three list rows.
 */
export type Note = VerseRef & {
  noteId: string;
  /** verseKey for this note's verse — useful as a React key + lookup. */
  key: string;
  text: string;
  /** Cached verse text snippet (may be empty if we never had it). */
  verseText: string;
  createdAt: number;
  updatedAt: number;
  /** Sticky-note paper tint when set. */
  color?: string;
};

export type Highlight = VerseRef & {
  key: string;
  color: HighlightColor;
  verseText: string;
  updatedAt: number;
};

/**
 * Optional metadata passed by the reader when setting an annotation.
 * Lets us cache the verse text so the list screens / action sheet
 * can display the verse without a refetch.
 */
export type AnnotateOptions = {
  verseText?: string;
  /** Sticky-note tint — same ids as verse highlights. */
  color?: string;
};

type AnnotationsContextValue = AnnotationsState & {
  /** True once persisted annotations have loaded (or no save existed). */
  hydrated: boolean;

  /** null -> clear the highlight on this verse. */
  setHighlight: (
    key: string,
    color: HighlightColorId | null,
    opts?: AnnotateOptions,
  ) => void;

  /**
   * Append a new note to this verse. Returns the new note's id, or
   * `null` if the text was empty (no note created).
   */
  addNote: (
    key: string,
    text: string,
    opts?: AnnotateOptions,
  ) => string | null;

  /**
   * Replace the text of an existing note on this verse. Empty text
   * deletes the note. Optional `color` updates the sticky paper tint.
   */
  updateNote: (
    key: string,
    noteId: string,
    text: string,
    opts?: { color?: string },
  ) => void;

  /** Remove a single note from this verse. */
  deleteNote: (key: string, noteId: string) => void;

  getHighlight: (key: string) => HighlightColorId | null;

  /** All notes on a verse, oldest-first (chronological reflection trail). */
  getNotes: (key: string) => ReadonlyArray<NoteEntry>;

  /** Cached verse text snippet for a verse, if we've ever stored it. */
  getVerseSnippet: (key: string) => string;

  /** All notes across all verses, newest first. */
  allNotes: () => Note[];

  /** All highlighted verses, newest first. */
  allHighlights: () => Highlight[];

  /**
   * Counts surfaced to UI badges. `notes` is the total number of
   * note entries across all verses (a verse with 3 notes contributes
   * 3 to this total — that matches what the user expects to see on
   * the "Notes" badge).
   */
  counts: { notes: number; highlights: number };

  reset: () => void;
};

const EMPTY: AnnotationsState = {
  highlights: {},
  notes: {},
  verseSnippets: {},
  timestamps: {},
};

const AnnotationsContext = createContext<AnnotationsContextValue | null>(null);

// Lightweight unique id for notes — Date.now + random suffix is
// plenty given notes are user-created at human pace and stored
// per-device. Avoids a uuid dependency.
function makeNoteId(): string {
  return `n_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function AnnotationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnnotationsState>(EMPTY);

  // Merge loaded payload over defaults so a save from an older
  // version (missing fields like `verseSnippets`) still hydrates
  // cleanly. Sub-objects/arrays from disk replace the empty maps.
  const applyLoaded = useCallback((loaded: AnnotationsState) => {
    setState({ ...EMPTY, ...loaded });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.annotations,
    state,
    applyLoaded,
  );

  /**
   * Bump the verse-level timestamp + optionally cache the verse
   * snippet. If the verse has no remaining annotations of any kind,
   * drop its snippet + timestamp so state stays lean.
   */
  const touch = useCallback(
    (
      s: AnnotationsState,
      key: string,
      stillAnnotated: boolean,
      opts?: AnnotateOptions,
    ): AnnotationsState => {
      const snippets = { ...s.verseSnippets };
      const timestamps = { ...s.timestamps };

      if (!stillAnnotated) {
        delete snippets[key];
        delete timestamps[key];
      } else {
        if (opts?.verseText) snippets[key] = opts.verseText;
        timestamps[key] = Date.now();
      }
      return { ...s, verseSnippets: snippets, timestamps };
    },
    [],
  );

  const verseStillAnnotated = useCallback(
    (s: AnnotationsState, key: string, nextHighlightOrNull?: HighlightColorId | null) => {
      // `nextHighlightOrNull === undefined` means "highlight unchanged".
      const hl =
        nextHighlightOrNull === undefined
          ? s.highlights[key]
          : nextHighlightOrNull;
      const noteList = s.notes[key];
      return !!hl || (noteList && noteList.length > 0);
    },
    [],
  );

  const setHighlight = useCallback(
    (
      key: string,
      color: HighlightColorId | null,
      opts?: AnnotateOptions,
    ) => {
      setState((s) => {
        const nextHighlights = { ...s.highlights };
        if (color === null) {
          delete nextHighlights[key];
        } else {
          nextHighlights[key] = color;
        }
        const stillAnnotated = verseStillAnnotated(
          { ...s, highlights: nextHighlights },
          key,
          color,
        );
        return touch(
          { ...s, highlights: nextHighlights },
          key,
          stillAnnotated,
          opts,
        );
      });
    },
    [touch, verseStillAnnotated],
  );

  // We mint the id outside of setState so we can return it
  // synchronously. setState's updater still runs against the latest
  // state, but the id is generated up-front and threaded through.
  const addNote = useCallback(
    (
      key: string,
      text: string,
      opts?: AnnotateOptions,
    ): string | null => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      const now = Date.now();
      const id = makeNoteId();
      const entry: NoteEntry = {
        id,
        text: trimmed,
        createdAt: now,
        updatedAt: now,
        ...(opts?.color ? { color: opts.color } : {}),
      };

      setState((s) => {
        const list = s.notes[key] ?? [];
        const nextNotes = { ...s.notes, [key]: [...list, entry] };
        return touch({ ...s, notes: nextNotes }, key, true, opts);
      });

      return id;
    },
    [touch],
  );

  const updateNote = useCallback(
    (key: string, noteId: string, text: string, opts?: { color?: string }) => {
      setState((s) => {
        const list = s.notes[key];
        if (!list) return s;
        const trimmed = text.trim();

        // Empty text = delete the note (consistent with the previous
        // single-note semantics).
        if (!trimmed) {
          const nextList = list.filter((n) => n.id !== noteId);
          const nextNotes = { ...s.notes };
          if (nextList.length === 0) {
            delete nextNotes[key];
          } else {
            nextNotes[key] = nextList;
          }
          const stillAnnotated = verseStillAnnotated(
            { ...s, notes: nextNotes },
            key,
          );
          return touch({ ...s, notes: nextNotes }, key, stillAnnotated);
        }

        const nextList = list.map((n) =>
          n.id === noteId
            ? {
                ...n,
                text: trimmed,
                updatedAt: Date.now(),
                ...(opts?.color !== undefined ? { color: opts.color } : {}),
              }
            : n,
        );
        const nextNotes = { ...s.notes, [key]: nextList };
        return touch({ ...s, notes: nextNotes }, key, true);
      });
    },
    [touch, verseStillAnnotated],
  );

  const deleteNote = useCallback(
    (key: string, noteId: string) => {
      setState((s) => {
        const list = s.notes[key];
        if (!list) return s;
        const nextList = list.filter((n) => n.id !== noteId);
        const nextNotes = { ...s.notes };
        if (nextList.length === 0) {
          delete nextNotes[key];
        } else {
          nextNotes[key] = nextList;
        }
        const stillAnnotated = verseStillAnnotated(
          { ...s, notes: nextNotes },
          key,
        );
        return touch({ ...s, notes: nextNotes }, key, stillAnnotated);
      });
    },
    [touch, verseStillAnnotated],
  );

  const getHighlight = useCallback(
    (key: string) => state.highlights[key] ?? null,
    [state.highlights],
  );

  const getNotes = useCallback(
    (key: string) => state.notes[key] ?? [],
    [state.notes],
  );

  const getVerseSnippet = useCallback(
    (key: string) => state.verseSnippets[key] ?? "",
    [state.verseSnippets],
  );

  const allNotes = useCallback((): Note[] => {
    const out: Note[] = [];
    for (const [key, list] of Object.entries(state.notes)) {
      const ref = parseVerseKey(key);
      const snippet = state.verseSnippets[key] ?? "";
      for (const n of list) {
        out.push({
          ...ref,
          key,
          noteId: n.id,
          text: n.text,
          verseText: snippet,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          color: n.color,
        });
      }
    }
    out.sort((a, b) => b.updatedAt - a.updatedAt);
    return out;
  }, [state.notes, state.verseSnippets]);

  const allHighlights = useCallback((): Highlight[] => {
    return Object.entries(state.highlights)
      .map(([key, colorId]) => ({
        key,
        ...parseVerseKey(key),
        color: findHighlightColor(colorId) ?? HIGHLIGHT_COLORS[0],
        verseText: state.verseSnippets[key] ?? "",
        updatedAt: state.timestamps[key] ?? 0,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [state.highlights, state.verseSnippets, state.timestamps]);

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEYS.annotations);
  }, []);

  const counts = useMemo(() => {
    let noteCount = 0;
    for (const list of Object.values(state.notes)) noteCount += list.length;
    return {
      notes: noteCount,
      highlights: Object.keys(state.highlights).length,
    };
  }, [state.notes, state.highlights]);

  const value = useMemo<AnnotationsContextValue>(
    () => ({
      ...state,
      hydrated,
      setHighlight,
      addNote,
      updateNote,
      deleteNote,
      getHighlight,
      getNotes,
      getVerseSnippet,
      allNotes,
      allHighlights,
      counts,
      reset,
    }),
    [
      state,
      hydrated,
      setHighlight,
      addNote,
      updateNote,
      deleteNote,
      getHighlight,
      getNotes,
      getVerseSnippet,
      allNotes,
      allHighlights,
      counts,
      reset,
    ],
  );

  return (
    <AnnotationsContext.Provider value={value}>
      {children}
    </AnnotationsContext.Provider>
  );
}

export function useAnnotations(): AnnotationsContextValue {
  const ctx = useContext(AnnotationsContext);
  if (!ctx) {
    throw new Error(
      "useAnnotations must be used inside <AnnotationsProvider>",
    );
  }
  return ctx;
}
