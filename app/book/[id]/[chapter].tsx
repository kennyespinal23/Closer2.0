import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  type AppStateStatus,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { BlurView } from "expo-blur";
import * as haptics from "@/lib/haptics";
import { NoteEditor } from "@/components/NoteEditor";
import { VerseActionSheet } from "@/components/VerseActionSheet";
import { BookCover } from "@/components/BookCover";
import { BOOKS, findBookById } from "@/constants/books";
import {
  CATEGORY_COVER_PALETTE,
  getCoverBloom,
} from "@/constants/bookCovers";
import {
  type Chapter,
  TranslationNotInstalledError,
  fetchChapter,
  prefetchChapter,
} from "@/lib/bible";
import {
  findHighlightColor,
  HIGHLIGHT_COLORS,
  type HighlightColorId,
  useAnnotations,
  verseKey,
} from "@/state/annotations";
import {
  TEXT_SIZES,
  type TextSizeId,
  type Translation,
  usePreferences,
} from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Color of the inline note marker drawn next to verse numbers that
 * have notes attached. Deliberately a saturated red — distinct from
 * any of the soft pastel highlight tints, so the marker reads as
 * "there's a note here" against a highlighted background too.
 */
const NOTE_MARKER_COLOR = "#FF453A";

/**
 * The shape onTextLayout hands back for each rendered line.
 * Lifted out so the pagination measurer can pass typed arrays around
 * without re-importing React Native's internal types everywhere.
 */
type TextLayoutLine = {
  text: string;
  y: number;
  width: number;
  height: number;
  ascender: number;
  capHeight: number;
  descender: number;
  xHeight: number;
  x?: number;
};

/** A computed paginated slice of the chapter — see paginateLines(). */
type ReaderPage = {
  /** Index of the first measured line on this page (inclusive). */
  startLine: number;
  /** Index of the last measured line on this page (inclusive). */
  endLine: number;
  /**
   * Legacy field: y-offset (in the original full-text layout) of the
   * first line. Was used by an earlier render approach that translated
   * a full-chapter Text up by this amount inside an `overflow: hidden`
   * clip box. That approach broke on iOS — the Text renderer would
   * silently stop drawing past the parent's overflow bounds even
   * though the transform was visually shifting content INTO view —
   * symptom: pages past page 1 showed verse text cut off mid-word
   * with white space below.
   * Retained for diagnostics + auto-mark math; not consumed by the
   * renderer anymore.
   */
  offsetY: number;
  /**
   * Legacy field: exact pixel height of the rendered slice. See
   * `offsetY` above. Retained for diagnostics.
   */
  contentHeight: number;
  /**
   * 0-indexed range into the chapter's verses array — the slice
   * that actually renders on this page. Replaces the transform+clip
   * dance. Both ends inclusive.
   */
  startVerseIdx: number;
  endVerseIdx: number;
  /** True for the very first page — gets the chapter heading on top. */
  isFirst: boolean;
};

/**
 * What the horizontal FlatList iterates over: a sequence of verse
 * pages followed by exactly one "end matter" card (mark-as-read +
 * translation credit + prev/next nav). Tagged union so the renderer
 * can switch on `kind`.
 */
type ReaderListItem =
  | { kind: "page"; key: string; page: ReaderPage }
  | { kind: "endMatter"; key: string };

/**
 * Chapter reader.
 *
 * Loads a single chapter via lib/bible.ts (translation determined by
 * user preferences) and renders it as continuous typography. Each
 * verse is individually tappable: a tap opens the action sheet
 * (highlight color picker, notes list, share). Highlights paint
 * directly behind verse text; notes are flagged with a bright red
 * inline dot next to the verse number ("●" with a count when there
 * are more than one), readable against any highlight tint.
 *
 * Reader features (current):
 *   • Tap-to-act on any verse → VerseActionSheet
 *   • Color highlighting with 5-color palette
 *   • Multiple notes per verse (each tracked + editable independently)
 *   • Auto-mark as read on natural completion (dwell + scroll depth)
 *   • Reading-time indicator + thin progress bar at the top
 *   • Gentle bottom fade so text doesn't hard-cut at the edge
 *   • User-configurable text size (Appearance settings)
 *   • Translation choice (Preferences) — switching versions refetches
 *
 * Navigation:
 *   • Back chevron returns to the book overview
 *   • Bottom nav has Prev / Next that crosses book boundaries
 *     (Genesis 50 → Exodus 1, Malachi 4 → Matthew 1)
 *   • Within-book navigation uses router.replace so the back stack
 *     doesn't bloat with every chapter the user reads
 */
export default function ChapterReaderScreen() {
  const {
    id,
    chapter: chapterParam,
    focus: focusParam,
    tint: tintParam,
  } = useLocalSearchParams<{
    id: string;
    chapter: string;
    /**
     * Verse number (as a string) to temporarily spotlight when the
     * screen mounts. Set when the reader is reached via a check-in
     * "Open chapter" action — see app/check-in/[mood].tsx.
     */
    focus?: string;
    /** URL-encoded hex color used for the focus glow. */
    tint?: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const book = id ? findBookById(id) : undefined;
  const chapter = parseInt(chapterParam ?? "", 10);

  // Parse + sanity-check the focus number once per param change.
  // We treat any non-finite / out-of-range value as "no focus".
  const focusVerse = useMemo(() => {
    const n = parseInt(focusParam ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [focusParam]);

  // Default glow color falls back to the app's accent. We accept
  // anything that looks like a 6-digit hex so a typo in the URL
  // can't blow up the screen.
  const focusTint = useMemo(() => {
    if (!tintParam) return colors.primary;
    const candidate = decodeURIComponent(tintParam);
    return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : colors.primary;
  }, [tintParam]);

  const {
    recordChapterRead,
    hasReadChapter,
    recordChapterVisit,
  } = useProgress();
  const { translation, textSize, setTextSize } = usePreferences();
  const annotations = useAnnotations();

  const [data, setData] = useState<Chapter | null>(null);
  // We keep the full Error object — not just its message — because
  // `lib/bible.ts` raises a typed `TranslationNotInstalledError` for
  // local-only translations (NWT and other copyrighted ones the user
  // supplies themselves). Storing the object lets the body render a
  // friendly guided empty state for that case while still rendering
  // a generic network-error view for everything else.
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Action-sheet / note-editor state ────────────────────────────
  // `activeVerse` is the verse number currently selected in the
  // single-verse action sheet, or null when closed.
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  // `editingNote` carries BOTH the verse and (optionally) the note
  // being edited. `noteId: null` means "compose a new note".
  // `verses` is the list of verse numbers the note will be saved to
  // — usually one, but multi-select can pass several so the same
  // note text is attached to each verse in the range.
  const [editingNote, setEditingNote] = useState<
    { verses: number[]; noteId: string | null } | null
  >(null);

  // ─── Multi-verse selection ─────────────────────────────────────
  // Long-pressing any verse enters selection mode with that verse
  // already selected. Subsequent taps toggle membership. A floating
  // action bar at the bottom of the screen replaces the normal
  // toolbar while selection is active — same actions as the single-
  // verse sheet (highlight color picker, add note, share), but they
  // fan out across every verse in the selection.
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const selectionMode = selectedVerses.length > 0;

  const toggleVerseSelection = useCallback((n: number) => {
    setSelectedVerses((cur) =>
      cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b),
    );
  }, []);

  const exitSelection = useCallback(() => setSelectedVerses([]), []);

  // Memoized set view for fast O(1) membership checks in the
  // hot text-rendering path. Recomputed on selection change.
  const selectedVersesSet = useMemo(
    () => new Set(selectedVerses),
    [selectedVerses],
  );

  // ─── Multi-verse action handlers ───────────────────────────────
  // These mirror the single-verse actions in VerseActionSheet but
  // fan out across every selected verse. Highlights and notes are
  // additive (existing notes / highlights on other verses outside
  // the selection are untouched). After completion we drop selection
  // mode so the user lands back in the normal reading flow.

  // Hooks live above the early `!book` return for Rules-of-Hooks
  // compliance, so we guard against `book === undefined` inside the
  // bodies. At runtime the early return below short-circuits any
  // UI that could trigger these — the guards are belt-and-braces.

  const applyHighlightToSelected = useCallback(
    (color: HighlightColorId | null) => {
      if (!book) return;
      for (const n of selectedVerses) {
        const key = verseKey(book.id, chapter, n);
        const v = data?.verses.find((x) => x.number === n);
        annotations.setHighlight(key, color, {
          verseText: v?.text,
        });
      }
      exitSelection();
    },
    [
      selectedVerses,
      annotations,
      book,
      chapter,
      data,
      exitSelection,
    ],
  );

  const startMultiVerseNote = useCallback(() => {
    if (selectedVerses.length === 0) return;
    setEditingNote({ verses: [...selectedVerses], noteId: null });
  }, [selectedVerses]);

  const shareSelected = useCallback(async () => {
    if (selectedVerses.length === 0 || !data || !book) return;
    const lines: string[] = [];
    for (const n of selectedVerses) {
      const v = data.verses.find((x) => x.number === n);
      if (v) lines.push(`${n} ${v.text}`);
    }
    const range = formatVerseRange(book.name, chapter, selectedVerses);
    try {
      await Share.share({
        message: `${lines.join(" ")}\n\n— ${range} (${translation.tag})`,
      });
    } catch {
      /* user cancelled — no-op */
    }
    exitSelection();
  }, [
    selectedVerses,
    data,
    book,
    chapter,
    translation.tag,
    exitSelection,
  ]);

  // Local override so tapping "Mark as read" feels instant even
  // before the underlying provider state has propagated back through
  // the hasReadChapter selector. Also gets set by auto-mark.
  const [justMarked, setJustMarked] = useState(false);
  const alreadyRead =
    book && Number.isFinite(chapter)
      ? hasReadChapter(book.id, chapter) || justMarked
      : false;

  // Record this chapter as the most-recently-visited so Home can
  // surface a "Continue reading" entry. Runs on mount + whenever
  // the route changes within the reader.
  useEffect(() => {
    if (book && Number.isFinite(chapter)) {
      recordChapterVisit(book.id, chapter);
    }
  }, [book, chapter, recordChapterVisit]);

  // Reset + refetch when route OR translation changes. We include
  // translation.id in the dep array so switching versions reloads.
  useEffect(() => {
    if (!book || !Number.isFinite(chapter)) return;
    let cancelled = false;
    setData(null);
    setError(null);
    setJustMarked(false);
    fetchChapter(book.id, chapter, translation.id)
      .then((c) => {
        if (cancelled) return;
        setData(c);
        const next = getAdjacent(book.id, chapter, "next");
        if (next) prefetchChapter(next.bookId, next.chapter, translation.id);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, translation.id, reloadKey]);

  // ─── Guards for malformed routes ──────────────────────────────
  if (!book) {
    return <NotFound message="We don&apos;t know that book." />;
  }
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
    return (
      <NotFound
        message={`${book.name} only has ${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}.`}
      />
    );
  }

  const prev = getAdjacent(book.id, chapter, "prev");
  const next = getAdjacent(book.id, chapter, "next");
  const headerTitle = `${book.name} ${chapter}`;

  const goto = (target: { bookId: string; chapter: number }) => {
    router.replace(`/book/${target.bookId}/${target.chapter}`);
  };

  // Resolve the verse currently shown in the action sheet (or note
  // editor) into reference/text/key so the sheet has what it needs.
  const activeVerseData =
    activeVerse !== null
      ? data?.verses.find((v) => v.number === activeVerse) ?? null
      : null;
  const activeKey =
    activeVerse !== null ? verseKey(book.id, chapter, activeVerse) : null;

  // For the note editor: the "primary" verse is the first selected.
  // Multi-verse notes save the same text to each verse's own thread.
  // When editing an existing note, editingNote.verses has length 1
  // and the noteId points to that verse's stored note.
  const editingPrimaryVerse = editingNote?.verses[0] ?? null;
  const editingVerseData =
    editingPrimaryVerse !== null
      ? data?.verses.find((v) => v.number === editingPrimaryVerse) ?? null
      : null;
  const editingPrimaryKey =
    editingPrimaryVerse !== null
      ? verseKey(book.id, chapter, editingPrimaryVerse)
      : null;
  // Pretty reference for the editor header. Single verse → "John 3:16".
  // Multi-verse → "John 3:16–18" or "John 3:1, 4, 7" depending on
  // whether the selection is contiguous.
  const editingReference =
    editingNote && editingNote.verses.length > 0
      ? formatVerseRange(book.name, chapter, editingNote.verses)
      : "";
  // When editing an existing note we look up its current text; when
  // composing a new note (single OR multi) this is the empty string.
  const editingNoteInitialText = useMemo(() => {
    if (!editingNote || !editingPrimaryKey || !editingNote.noteId) return "";
    const list = annotations.getNotes(editingPrimaryKey);
    return list.find((n) => n.id === editingNote.noteId)?.text ?? "";
  }, [editingNote, editingPrimaryKey, annotations]);

  // Verse share handler — uses the OS share sheet (no extra deps).
  const handleShare = async () => {
    if (!activeVerseData) return;
    const ref = `${book.name} ${chapter}:${activeVerseData.number}`;
    try {
      await Share.share({
        message: `"${activeVerseData.text}"\n\n— ${ref} (${translation.name})`,
      });
    } catch {
      /* user-dismissed shares are non-fatal */
    }
  };

  // ─── Real pagination — measurement + page state ─────────────────
  //
  // The reader now turns pages like Apple Books instead of scrolling
  // continuously. The trick:
  //   1. Render the entire chapter once OFF-SCREEN at the page width
  //      to capture every rendered line's (y, height) via onTextLayout.
  //   2. Walk the lines and group consecutive lines into pages that
  //      fit inside the page's vertical content area. The first
  //      page reserves room for the chapter heading.
  //   3. Render each page as a clipping View showing the SAME text
  //      content but offset by the page's start-Y. Because line
  //      breaks are deterministic for a given width + content, every
  //      page's clipped slice looks identical to that range of lines
  //      in the original measurement — no reflow surprises.
  //
  // Pages are a derived value (set after measurement). While we wait
  // for measurement, the visible reader shows a loading state.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const PAGE_PAD_X = 24;
  const PAGE_PAD_Y_TOP = 18;
  const PAGE_PAD_Y_BOTTOM = 18;
  // Width of the actual text column on each page (inside the clipping
  // View). Used both for the off-screen measurer and the visible pages.
  const pageContentWidth = screenWidth - PAGE_PAD_X * 2;
  // Vertical room available inside a page for verse text. Rough
  // budget (with safety margin so the toolbar never overlaps text):
  //   top safe area / status   ~50
  //   header (back, caption, progress bar)  ~80
  //   bottom safe area / home indicator      ~30
  //   icon toolbar pill + spacing            ~70
  //   "Page X of Y" caption above pill       ~30
  //   page-side padding bottom buffer        ~30
  // Total cushion = ~290. Leave more breathing room than strictly
  // necessary — better to leak a little whitespace than to bleed
  // text into the toolbar.
  const pageContentHeight = Math.max(
    260,
    screenHeight - 50 - 80 - 30 - 70 - 30 - 30,
  );
  // Approximate height the chapter heading + ornament occupies on
  // page 1. paginateLines() reserves this on the first page only.
  const FIRST_PAGE_HEADING_HEIGHT = 130 * Math.sqrt(textSize.scale);

  const [pages, setPages] = useState<ReaderPage[] | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Verse → line-index map. Built during the measurement pass so the
  // focus-verse deep-link can jump to the right PAGE (not just scroll
  // to a Y the user can't see in a paginated view).
  const verseToLineRef = useRef<Map<number, number>>(new Map());

  /**
   * Capture the off-screen line measurement and recompute pages.
   * Stable identity (no deps on state.pages) so we can call it from
   * VerseFlow's onMeasureLines without thrashing.
   */
  const handleMeasureLines = useCallback(
    (lines: ReadonlyArray<TextLayoutLine>) => {
      if (!lines || lines.length === 0) return;
      // Rebuild verse → line map from this measurement pass. Mirrors
      // the loop in VerseFlow's handleTextLayout, but we save the
      // line INDEX (not just y) here.
      const map = new Map<number, number>();
      if (data) {
        const maxVerseNum = data.verses[data.verses.length - 1]?.number ?? 0;
        let nextExpected = data.verses[0]?.number ?? 1;
        for (let li = 0; li < lines.length; li++) {
          const lineText = lines[li].text;
          let cursor = 0;
          while (nextExpected <= maxVerseNum) {
            const found = findVerseMarker(lineText, nextExpected, cursor);
            if (!found) break;
            if (!map.has(nextExpected)) {
              map.set(nextExpected, li);
            }
            cursor = found.end;
            nextExpected += 1;
          }
          if (nextExpected > maxVerseNum) break;
        }
      }
      verseToLineRef.current = map;

      // Sorted list of line indices where each verse first appears.
      // Sorting because Map iteration order matches insertion order,
      // which already happens to be ascending, but we don't want a
      // future refactor to silently break the page-break math.
      const verseStartLines = Array.from(map.values()).sort(
        (a, b) => a - b,
      );

      const computed = paginateLines(
        lines,
        pageContentHeight,
        FIRST_PAGE_HEADING_HEIGHT,
        verseStartLines,
        data?.verses.length ?? 0,
      );
      setPages(computed);
    },
    [data, pageContentHeight, FIRST_PAGE_HEADING_HEIGHT],
  );

  // Reset pages + current index when the chapter content changes
  // (route change, translation switch, font-size change). The off-
  // screen measurer will hand us a fresh set on its next layout pass.
  useEffect(() => {
    setPages(null);
    setCurrentPageIdx(0);
    verseToLineRef.current = new Map();
  }, [book.id, chapter, translation.id, textSize.id, pageContentHeight]);

  // Derived presentation: total page count INCLUDES the end-matter
  // card we append after the verse pages (so "Page X of Y" matches
  // what the user can swipe to). pagesLeft is what shows up in the
  // top caption: "4 pages left in chapter".
  const versePageCount = pages?.length ?? 0;
  const totalPages = Math.max(1, versePageCount + (data ? 1 : 0));
  const currentPage = Math.min(totalPages, currentPageIdx + 1);
  const pagesLeft = Math.max(0, totalPages - currentPage);

  // A 0–1 progress value derived from page state. Drives the thin
  // bar in the header AND feeds the auto-mark logic below (which
  // used to consume scrollProgress directly).
  const pageProgress = totalPages > 1 ? currentPageIdx / (totalPages - 1) : 1;

  // ─── Auto-mark as read — page-based ─────────────────────────────
  // Same intent as the old scroll-based auto-mark: count the chapter
  // as read after the user has spent real time with it AND made
  // meaningful progress through it. With pagination, "meaningful
  // progress" is reaching ≥70% of the way through the pages instead
  // of scrolling ≥70% of the content.
  useEffect(() => {
    if (!data) return;
    if (alreadyRead) return;
    if (pageProgress < 0.7) return;
    const t = setTimeout(() => {
      recordChapterRead(book.id, chapter);
      setJustMarked(true);
    }, 30_000);
    return () => clearTimeout(t);
  }, [
    data,
    alreadyRead,
    pageProgress,
    book.id,
    chapter,
    recordChapterRead,
  ]);

  // ─── Reading-goal: minutes ticker + celebration toast ───────────
  // Logic:
  //   • While the reader is mounted AND the app is foregrounded AND
  //     we have content rendered (data != null), advance a 1Hz
  //     ticker that calls readingGoal.addMinutes(1/60).
  //   • The hook's addMinutes() returns goalCrossed === true exactly
  //     once — the moment today's accumulated minutes pass the goal.
  //   • That single true flips on a 3s toast at the bottom of the
  //     screen, mirroring Apple Books' "Today's reading goal achieved"
  //     pill.
  //   • Re-mounts of the reader within the same day after the goal is
  //     already met do NOT retrigger the toast (goalCrossed stays false).
  const readingGoal = useReadingGoal();
  const [goalToastVisible, setGoalToastVisible] = useState(false);
  const goalToastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;

    let appActive = AppState.currentState === "active";
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      appActive = s === "active";
    });

    const interval = setInterval(() => {
      if (!appActive) return;
      const result = readingGoal.addMinutes(1 / 60);
      if (result.goalCrossed) {
        setGoalToastVisible(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
    // We only want to (re)arm when the chapter loads — readingGoal
    // identity changes on every minute tick, so depending on it
    // directly would cause runaway re-arms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Toast slide-in / hold / slide-out. Sticky for ~3.6s total.
  useEffect(() => {
    if (!goalToastVisible) return;
    Animated.sequence([
      Animated.spring(goalToastAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
      Animated.delay(3000),
      Animated.timing(goalToastAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start(() => setGoalToastVisible(false));
  }, [goalToastVisible, goalToastAnim]);

  // ─── Contents drawer (Apple-Books chapter list) ─────────────────
  const [contentsOpen, setContentsOpen] = useState(false);

  // ─── Focus-verse spotlight (check-in deep link) ─────────────────
  // With pagination we no longer scroll-to-Y; we jump to the PAGE
  // that contains the focused verse and play the same glow on it.
  // The verse anchors map is still kept around (other things consume
  // it), but the focus deep-link now keys off verseToLineRef +
  // pages[].
  const pagerRef = useRef<FlatList<ReaderListItem>>(null);
  const [verseAnchors, setVerseAnchors] = useState<Record<number, number>>({});
  const focusGlow = useRef(new Animated.Value(0)).current;
  const focusDoneRef = useRef<string | null>(null);

  const handleAnchors = useCallback(
    (anchors: Record<number, number>) => {
      // Only commit if the map actually changed — onTextLayout fires
      // on every re-layout (font size changes, etc.) and re-setting
      // identical state would re-run the focus effect.
      setVerseAnchors((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(anchors);
        if (prevKeys.length === nextKeys.length) {
          let same = true;
          for (const k of nextKeys) {
            if (prev[Number(k)] !== anchors[Number(k)]) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return anchors;
      });
    },
    [],
  );

  // When focus + measurements + pages are all ready, jump the pager
  // to the right page and play a one-shot glow that fades back into
  // whatever the verse's persistent highlight was (often nothing).
  useEffect(() => {
    if (focusVerse == null) return;
    if (!data || !pages) return;
    const verseLine = verseToLineRef.current.get(focusVerse);
    if (verseLine == null) return;
    const pageIdx = pages.findIndex(
      (p) => verseLine >= p.startLine && verseLine <= p.endLine,
    );
    if (pageIdx < 0) return;

    // De-dupe by route + verse so reloads / translation swaps inside
    // the same focus session don't replay the animation.
    const token = `${book.id}/${chapter}#${focusVerse}`;
    if (focusDoneRef.current === token) return;
    focusDoneRef.current = token;

    setTimeout(() => {
      pagerRef.current?.scrollToIndex({ index: pageIdx, animated: true });
    }, 80);

    // Glow: quick ramp up → hold → slow fade. Background colors
    // can't run on the native driver, so we keep it on JS — the
    // animation is short enough that it's a non-issue.
    focusGlow.setValue(0);
    Animated.sequence([
      Animated.delay(380),
      Animated.timing(focusGlow, {
        toValue: 1,
        duration: 420,
        useNativeDriver: false,
      }),
      Animated.delay(2000),
      Animated.timing(focusGlow, {
        toValue: 0,
        duration: 1400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focusVerse, data, pages, focusGlow, book.id, chapter]);

  // Clear the dedupe token when the user navigates to a different
  // chapter so a later check-in to the same verse re-plays the glow.
  useEffect(() => {
    focusDoneRef.current = null;
    setVerseAnchors({});
  }, [book.id, chapter]);

  // Compose the renderable list: every verse page, then a final
  // "end matter" card so the user can mark-as-read + advance to the
  // next chapter without leaving the reader.
  const readerItems: ReaderListItem[] = useMemo(() => {
    if (!data || !pages) return [];
    const verseCards: ReaderListItem[] = pages.map((p, idx) => ({
      kind: "page",
      key: `page-${idx}`,
      page: p,
    }));
    verseCards.push({ kind: "endMatter", key: "end" });
    return verseCards;
  }, [data, pages]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Per-book bloom backdrop — a very soft wash tinted to the
          cover's palette, anchored to the top of the screen. The
          reading area below stays on the clean page bg so serif
          text never has to fight a colored field. Sits behind
          everything; pointer-events off. */}
      <ChapterBackdrop book={book} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Header
          translationTag={translation.tag}
          pagesLeftLabel={data && pages ? pagesLeftLabel(pagesLeft) : ""}
          progress={pageProgress}
        />

        <View style={{ flex: 1 }}>
        {/* ─── Off-screen measurement view ─────────────────────────
            Renders the full chapter once at the page width so we can
            grab onTextLayout's `lines` array and compute page breaks.
            Positioned far off-screen + opacity:0 so it's never seen
            by the user but still participates in layout. */}
        {data && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: -100000,
              opacity: 0,
              width: pageContentWidth,
            }}
          >
            <VerseFlow
              verses={data.verses}
              bookId={book.id}
              chapter={chapter}
              scale={textSize.scale}
              onVersePress={() => {}}
              focusVerse={null}
              focusTint={focusTint}
              focusGlow={focusGlow}
              onAnchors={handleAnchors}
              onMeasureLines={handleMeasureLines}
            />
          </View>
        )}

        {/* ─── Body ─────────────────────────────────────────────── */}
        {error ? (
          <View className="flex-1 items-center justify-center px-6">
            {error instanceof TranslationNotInstalledError ? (
              // Local-only translations (NWT and other copyrighted
              // ones supplied by the user) raise this typed error
              // when a chapter isn't bundled. We surface a guided
              // empty state instead of a generic network error
              // because there's nothing the network can do — the
              // user has to either install the translation locally
              // or pick a different one.
              <TranslationNotInstalledView
                translationName={error.translationName}
                bookName={book.name}
                chapter={error.chapter}
                onSwitchTranslation={() => router.push("/settings/translation")}
              />
            ) : (
              <ErrorView
                message={error.message}
                onRetry={() => setReloadKey((k) => k + 1)}
              />
            )}
          </View>
        ) : !data || !pages ? (
          <View className="flex-1 items-center justify-center">
            <LoadingView />
          </View>
        ) : (
          <FlatList
            ref={pagerRef}
            data={readerItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / screenWidth);
              setCurrentPageIdx(idx);
            }}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={5}
            renderItem={({ item }) => {
              if (item.kind === "endMatter") {
                return (
                  <EndMatterPage
                    width={screenWidth}
                    paddingX={PAGE_PAD_X}
                    book={book}
                    chapter={chapter}
                    alreadyRead={alreadyRead}
                    onMarkRead={() => {
                      recordChapterRead(book.id, chapter);
                      setJustMarked(true);
                    }}
                    translationName={data.translation}
                    translationNote={data.translationNote}
                    onChangeTranslation={() =>
                      router.push("/settings/translation")
                    }
                    prev={prev}
                    next={next}
                    onGoto={goto}
                  />
                );
              }
              return (
                <ReaderPageView
                  width={screenWidth}
                  paddingX={PAGE_PAD_X}
                  paddingTop={PAGE_PAD_Y_TOP}
                  paddingBottom={PAGE_PAD_Y_BOTTOM}
                  isFirst={item.page.isFirst}
                  bookName={book.name}
                  chapter={chapter}
                  scale={textSize.scale}
                  verses={data.verses}
                  startVerseIdx={item.page.startVerseIdx}
                  endVerseIdx={item.page.endVerseIdx}
                  bookId={book.id}
                  onVersePress={(n) => {
                    // While the user is in multi-select mode, a tap
                    // toggles membership instead of opening the
                    // single-verse action sheet. This keeps the two
                    // gestures (long-press to start, tap to add/
                    // remove) feeling like one continuous flow.
                    if (selectionMode) {
                      toggleVerseSelection(n);
                    } else {
                      setActiveVerse(n);
                    }
                  }}
                  onVerseLongPress={(n) => toggleVerseSelection(n)}
                  selectedSet={selectedVersesSet}
                  focusVerse={focusVerse}
                  focusTint={focusTint}
                  focusGlow={focusGlow}
                />
              );
            }}
          />
        )}

        {/* ─── Apple-Books page-of-N caption ─────────────────────
            Quiet "Page X of Y" caption sitting just above the
            bottom toolbar. Pointer-events off — purely informational. */}
        {data && pages ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 78,
              alignItems: "center",
            }}
          >
            <Text
              className="text-ink-subtle text-[11px] tracking-[1.5px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Page {currentPage} of {totalPages}
            </Text>
          </View>
        ) : null}

        {/* ─── Bottom toolbar OR selection bar ───────────────────
            While the user is in multi-select mode (any verse
            selected), we swap the normal Apple-Books-style icon
            pill for a SelectionBar that shows the count, a color
            swatch row, Note, Share, and Done. Once the user exits
            selection (Done or by deselecting the last verse) the
            toolbar reappears so the reading chrome is one tap away. */}
        {selectionMode ? (
          <SelectionBar
            count={selectedVerses.length}
            onColor={applyHighlightToSelected}
            onNote={startMultiVerseNote}
            onShare={shareSelected}
            onDone={exitSelection}
          />
        ) : (
          <ReaderToolbar
            onContents={() => setContentsOpen(true)}
            textSizeId={textSize.id}
            onChangeTextSize={setTextSize}
            translation={translation}
            onChangeTranslation={() => router.push("/settings/translation")}
            todayMinutes={readingGoal.todayMinutes}
            goalMinutes={readingGoal.goalMinutes}
            onOpenReadingGoal={() => router.push("/settings/reading-goal")}
          />
        )}

        {/* ─── Reading-goal celebration toast ────────────────────
            Slides in from the bottom edge the FIRST time today's
            accumulated minutes cross the user's goal — exactly once
            per day. Visually intentional twin to Apple Books'
            "Today's reading goal achieved" pill. */}
        {goalToastVisible ? (
          <GoalToast
            anim={goalToastAnim}
            goalMinutes={readingGoal.goalMinutes}
          />
        ) : null}
      </View>

      {/* ─── Contents drawer modal ─────────────────────────────── */}
      <ContentsModal
        visible={contentsOpen}
        onClose={() => setContentsOpen(false)}
        bookId={book.id}
        bookName={book.name}
        totalChapters={book.chapters}
        currentChapter={chapter}
        hasReadChapter={hasReadChapter}
        onSelect={(c) => {
          setContentsOpen(false);
          if (c !== chapter) {
            router.replace(`/book/${book.id}/${c}`);
          }
        }}
      />

      {/* ─── Verse action sheet ──────────────────────────────── */}
      <VerseActionSheet
        visible={activeVerse !== null}
        reference={
          activeVerseData ? `${book.name} ${chapter}:${activeVerseData.number}` : null
        }
        previewText={activeVerseData?.text ?? null}
        currentHighlight={
          activeKey ? annotations.getHighlight(activeKey) : null
        }
        notes={activeKey ? annotations.getNotes(activeKey) : []}
        onHighlight={(color) => {
          if (!activeKey) return;
          // Pass the verse text so the Notes / Highlights screens
          // can show the actual scripture, not just a reference.
          annotations.setHighlight(activeKey, color, {
            verseText: activeVerseData?.text,
          });
          setActiveVerse(null);
        }}
        onAddNote={() => {
          const v = activeVerse;
          setActiveVerse(null);
          // Close the sheet first; let its slide-out finish before
          // opening the page-sheet editor — feels less jumpy.
          setTimeout(() => {
            if (v !== null) setEditingNote({ verses: [v], noteId: null });
          }, 220);
        }}
        onEditNote={(noteId) => {
          const v = activeVerse;
          setActiveVerse(null);
          setTimeout(() => {
            if (v !== null) setEditingNote({ verses: [v], noteId });
          }, 220);
        }}
        onShare={() => {
          setActiveVerse(null);
          setTimeout(handleShare, 240);
        }}
        onClose={() => setActiveVerse(null)}
      />

      {/* ─── Note editor ──────────────────────────────────────
          Same modal handles both "add new" and "edit existing" —
          differentiated by editingNote.noteId. On save we route to
          the right provider method. */}
      <NoteEditor
        visible={editingNote !== null}
        reference={editingReference}
        verseText={editingVerseData?.text ?? ""}
        initialNote={editingNoteInitialText}
        onSave={(text) => {
          if (!editingNote) {
            setEditingNote(null);
            return;
          }
          if (editingNote.noteId && editingPrimaryKey) {
            // Editing an existing note — single verse, in place.
            annotations.updateNote(
              editingPrimaryKey,
              editingNote.noteId,
              text,
            );
          } else {
            // Composing a new note. For multi-verse selections we
            // attach the same text to each verse so it shows up
            // wherever the user looks for it later (Notes screen,
            // verse action sheet, Journey timeline).
            for (const verseNum of editingNote.verses) {
              const key = verseKey(book.id, chapter, verseNum);
              const v = data?.verses.find((x) => x.number === verseNum);
              annotations.addNote(key, text, {
                verseText: v?.text,
              });
            }
          }
          setEditingNote(null);
          exitSelection();
        }}
        onDelete={() => {
          if (editingPrimaryKey && editingNote?.noteId) {
            annotations.deleteNote(editingPrimaryKey, editingNote.noteId);
          }
          setEditingNote(null);
        }}
        onCancel={() => setEditingNote(null)}
      />
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Chapter backdrop — per-book bloom wash at the top of the reader
// ─────────────────────────────────────────────────────────────────

/**
 * Subtle top-anchored gradient that tints the reading screen with
 * the current book's bloom palette. The effect should feel like
 * the book's color quietly leaning into the page — not a stain
 * the eye fights while reading.
 *
 * Design constraints (the reading screen is the longest-dwell
 * surface in the entire app):
 *   • Peak opacity is INTENTIONALLY low (~16%). Anything stronger
 *     gives serif body text a tinted ground that the eye has to
 *     do extra work against — even in peripheral vision.
 *   • Anchored to the very top and fades to fully transparent
 *     by ~280px down. The chapter body lives well below that, so
 *     the bloom stays in the chrome region (status bar, header,
 *     progress indicator) and never touches the verse text.
 *   • Always uses the bloom's OUTER color (the deeper, atmospheric
 *     stop), never the inner highlight. The highlight is meant to
 *     glow behind the cover artwork; on a flat reading page it
 *     would read as "saturated band" instead of "atmosphere."
 *   • Falls back to the book's category palette when no bloom is
 *     registered, so placeholder-covered books still get a tinted
 *     wash that differentiates them from each other.
 *   • pointerEvents: "none" — never intercepts taps on the header
 *     or first page chrome.
 */
function ChapterBackdrop({ book }: { book: { id: string; category: string } }) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useColors();

  // 360px gives the wash enough vertical run to read as a real
  // "page warming with the book's color," not a thin ribbon at
  // the top. We still fade to fully transparent before the wash
  // could reach the verse column on any phone size — verse text
  // always sits on the clean page background.
  const HEIGHT = 360;

  const coverBloom = getCoverBloom(book.id);
  const palette =
    CATEGORY_COVER_PALETTE[book.category as keyof typeof CATEGORY_COVER_PALETTE];
  const tint = coverBloom?.outer ?? palette?.top ?? colors.bg;
  // Layer a quieter inner-color stop on top of the outer wash so
  // the gradient has visible depth (a touch of the cover's
  // highlight peeking through) instead of reading as a single
  // flat tint. Falls back to the same outer color when no inner
  // is available so the rendering stays safe.
  const innerTint = coverBloom?.inner ?? palette?.accent ?? tint;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEIGHT,
      }}
    >
      <Svg width={screenWidth} height={HEIGHT}>
        <Defs>
          {/* Primary wash — the cover's deep atmospheric color
              bleeding down from the status bar. */}
          <SvgLinearGradient
            id="chapterBackdrop"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            {/* Top stop: clearly perceptible now (~30%) so the
                book's color story actually lands on the reader's
                eye when the chapter opens. */}
            <Stop offset="0" stopColor={tint} stopOpacity="0.32" />
            {/* Mid stop carries the wash about halfway down. */}
            <Stop offset="0.55" stopColor={tint} stopOpacity="0.14" />
            {/* Fully transparent before we reach the reading
                column so verse text always sits on the clean
                page background. */}
            <Stop offset="1" stopColor={tint} stopOpacity="0" />
          </SvgLinearGradient>
          {/* Highlight overlay — a quieter inner-color stop that
              gives the wash dimension. Without this the backdrop
              reads as a single flat color; with it the gradient
              shimmers with the cover's actual palette. */}
          <SvgLinearGradient
            id="chapterBackdropHighlight"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <Stop offset="0" stopColor={innerTint} stopOpacity="0.12" />
            <Stop offset="0.6" stopColor={innerTint} stopOpacity="0.04" />
            <Stop offset="1" stopColor={innerTint} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={HEIGHT}
          fill="url(#chapterBackdrop)"
        />
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={HEIGHT}
          fill="url(#chapterBackdropHighlight)"
        />
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Body sub-components
// ─────────────────────────────────────────────────────────────────

/**
 * Continuous verse flow with per-verse interaction.
 *
 * Each verse is wrapped in its own nested <Text onPress>, which RN
 * supports for inline tappable text. The result: verses still flow
 * as one paragraph but each verse is its own touch target.
 *
 * Visual treatments per verse:
 *   • Highlight    → background tint behind the verse text
 *   • Has note     → dotted underline + accent-color verse number
 *                    + a small filled-pill badge with the note count
 *
 * Notes are MORE visible than they used to be: the dot was easy to
 * miss when reading. The combination (color + underline + count
 * badge) makes annotated verses pop without breaking the line.
 *
 * Text size: the entire paragraph's `fontSize` and `lineHeight` are
 * multiplied by `scale`. Verse numbers scale a bit less so they
 * don't overpower the line.
 */
function VerseFlow({
  verses,
  bookId,
  chapter,
  scale,
  onVersePress,
  onVerseLongPress,
  focusVerse,
  focusTint,
  focusGlow,
  onAnchors,
  onMeasureLines,
  selectedSet,
}: {
  verses: { number: number; text: string }[];
  bookId: string;
  chapter: number;
  scale: number;
  onVersePress: (verse: number) => void;
  /**
   * Long-press hook — used to enter (or extend) the multi-verse
   * selection mode. Optional so off-screen measurement copies don't
   * need to plumb it through.
   */
  onVerseLongPress?: (verse: number) => void;
  /** Verse number to spotlight, or null when no focus is active. */
  focusVerse: number | null;
  /** Hex color (with #) used for the focus glow background. */
  focusTint: string;
  /** Animated 0→1 driver for the focus glow opacity. */
  focusGlow: Animated.Value;
  /** Called whenever onTextLayout produces a fresh verse→y map. */
  onAnchors: (anchors: Record<number, number>) => void;
  /**
   * Raw line measurements from React Native's onTextLayout. Used by
   * the pagination measurement pass (the parent renders an off-screen
   * copy of VerseFlow at the page width and walks lines to compute
   * page breaks). Optional — display copies of VerseFlow don't need it.
   */
  onMeasureLines?: (lines: ReadonlyArray<TextLayoutLine>) => void;
  /**
   * Verses currently in the multi-select set. Drives a subtle
   * highlight ring so the user can see what they've selected.
   */
  selectedSet?: ReadonlySet<number>;
}) {
  const annotations = useAnnotations();
  const colors = useColors();

  const baseFontSize = 18 * scale;
  const baseLineHeight = 30 * scale;
  const verseNumSize = 11 * Math.sqrt(scale);

  // Pre-compute keys + decoration once per render so per-verse
  // lookups are cheap.
  const decorated = useMemo(
    () =>
      verses.map((v) => {
        const key = verseKey(bookId, chapter, v.number);
        const noteCount = annotations.getNotes(key).length;
        return {
          ...v,
          key,
          highlight: findHighlightColor(annotations.getHighlight(key)),
          noteCount,
          hasNote: noteCount > 0,
        };
      }),
    [verses, bookId, chapter, annotations],
  );

  // Interpolate the 0→1 driver into the actual rgba background
  // applied to the focused verse. The opacity peaks around 0.55 so
  // the glyphs underneath stay readable on either ink color.
  const focusBg = useMemo(
    () =>
      focusGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [hexAlpha(focusTint, 0), hexAlpha(focusTint, 0.55)],
      }),
    [focusGlow, focusTint],
  );

  // ─── Verse → y map via onTextLayout ────────────────────────────
  // The parent Text receives a `lines` array describing every
  // rendered line. We scan each line's text for the verse-number
  // marker and record the first y for each verse. Verses are
  // expected to appear in order, so we track the "next expected"
  // number to avoid false positives where body text contains a
  // standalone number (e.g. " 3 of the kings"). Marker shape is
  // handled by `findVerseMarker`, which knows about both the plain
  // "  N  " case and the "  N ●…  " note-indicator variant.
  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lines = e.nativeEvent.lines;
      if (!lines || lines.length === 0) return;

      // Hand the raw lines up to the pagination measurer first so it
      // can see EVERY measurement event (even ones we'd skip below
      // because no new verse marker appeared).
      onMeasureLines?.(lines as ReadonlyArray<TextLayoutLine>);

      const anchors: Record<number, number> = {};
      let nextExpected = decorated[0]?.number ?? 1;
      const maxVerseNum = decorated[decorated.length - 1]?.number ?? 0;

      for (const line of lines) {
        const text = line.text;
        let cursor = 0;
        while (nextExpected <= maxVerseNum) {
          const found = findVerseMarker(text, nextExpected, cursor);
          if (!found) break;
          if (anchors[nextExpected] === undefined) {
            anchors[nextExpected] = line.y;
          }
          cursor = found.end;
          nextExpected += 1;
        }
        if (nextExpected > maxVerseNum) break;
      }

      onAnchors(anchors);
    },
    [decorated, onAnchors, onMeasureLines],
  );

  return (
    <Text
      onTextLayout={handleTextLayout}
      style={{
        fontFamily: "PlusJakartaSans_400Regular",
        fontSize: baseFontSize,
        lineHeight: baseLineHeight,
        color: colors.ink,
        letterSpacing: -0.1,
      }}
    >
      {decorated.map((v, i) => {
        const isFocus = focusVerse === v.number;
        const isSelected = selectedSet?.has(v.number) ?? false;

        // Verse "innards" — verse number + note marker + spacer +
        // body. Identical between the static and animated branches
        // below; lifted up here so the two branches don't diverge.
        const inner = (
          <>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: verseNumSize,
                color: isSelected ? colors.ink : colors.inkSubtle,
              }}
            >
              {"  "}{v.number}
            </Text>
            {/* Note indicator — a bright red filled disc placed
                inline right after the verse number, like a sticky-
                note tab on a margin. Bright enough to read against
                any highlight tint; the count suffix appears only
                when the verse has more than one note. */}
            {v.hasNote ? (
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: verseNumSize * 0.95,
                  color: NOTE_MARKER_COLOR,
                }}
              >
                {" "}●{v.noteCount > 1 ? v.noteCount : ""}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: verseNumSize,
              }}
            >
              {"  "}
            </Text>
            <Text>{v.text}</Text>
          </>
        );

        // Selection background takes precedence over an existing
        // highlight while the verse is selected — a clear, dense
        // tint so the user can see at a glance what they're about
        // to act on. Highlight returns once the verse leaves the
        // selection set. Tinted with the theme's `ink` so the wash
        // is white-over-black in dark mode and ink-over-white in
        // light mode (rather than a fixed white tint that becomes
        // invisible against the light background).
        const baseBg = isSelected
          ? `${colors.ink}2E`
          : v.highlight?.fill ?? "transparent";

        // Branch the wrapper element instead of computing a union
        // type for `backgroundColor` — the latter trips TS because
        // Animated.Text and Text don't share a single style-prop
        // overload that accepts both static colors and animated
        // interpolations.
        //
        // A "\n" before each verse (except the first) forces every
        // verse to start on its own line — and that guarantee is
        // what makes verse-aligned pagination actually work. With
        // inline prose, two verses can share a single rendered line,
        // so even a "break at verse boundary" cut would still leave
        // the tail of the previous verse on the next page. Forcing
        // each verse onto its own paragraph removes the ambiguity
        // and matches how every major Bible app (YouVersion, Olive
        // Tree, etc.) handles paginated reading.
        return (
          <Fragment key={v.number}>
            {i > 0 ? <Text>{"\n"}</Text> : null}
            {isFocus ? (
              <Animated.Text
                onPress={() => onVersePress(v.number)}
                onLongPress={
                  onVerseLongPress
                    ? () => onVerseLongPress(v.number)
                    : undefined
                }
                style={{ backgroundColor: focusBg }}
              >
                {inner}
              </Animated.Text>
            ) : (
              <Text
                onPress={() => onVersePress(v.number)}
                onLongPress={
                  onVerseLongPress
                    ? () => onVerseLongPress(v.number)
                    : undefined
                }
                style={{
                  backgroundColor: baseBg,
                }}
              >
                {inner}
              </Text>
            )}
          </Fragment>
        );
      })}
    </Text>
  );
}

function LoadingView() {
  const colors = useColors();
  return (
    <View className="items-center justify-center py-12">
      <ActivityIndicator size="small" color={colors.inkMuted} />
      <Text
        className="text-ink-subtle text-[12px] tracking-[2px] uppercase mt-4"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
      >
        Drawing near
      </Text>
    </View>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="items-center py-8">
      <Text
        className="text-ink text-[16px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-5 px-5 py-3 rounded-full border border-border bg-surface"
      >
        <Text
          className="text-ink text-[13px]"
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Empty state for the local-only-translation case.
 *
 * Surfaced when the user picks a translation marked `localOnly` in
 * `TRANSLATIONS` (currently just NWT) and the requested chapter
 * isn't bundled at `assets/bibles/<id>/<book>.json`. We deliberately
 * give the user two actions:
 *   • Switch translation — direct path back to a working reader
 *   • (Implicit) keep this translation — the message itself explains
 *     where to drop their licensed text so a future build picks it up
 *
 * No "Try again" affordance — retrying doesn't change anything
 * because there's no network operation to retry. The data either is
 * or isn't in the bundle.
 */
function TranslationNotInstalledView({
  translationName,
  bookName,
  chapter,
  onSwitchTranslation,
}: {
  translationName: string;
  bookName: string;
  chapter: number;
  onSwitchTranslation: () => void;
}) {
  return (
    <View className="items-center py-8 max-w-[340px]">
      <Text
        className="text-ink text-[18px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {translationName} isn&apos;t installed yet
      </Text>
      <Text
        className="text-ink-muted text-[14px] text-center mt-3 leading-[21px]"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        {bookName} {chapter} isn&apos;t bundled with the app. {translationName}{" "}
        is copyrighted, so its text has to come from your own licensed
        copy. Drop a JSON file at{" "}
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold" }}>
          assets/bibles/nwt/{bookName.toLowerCase()}.json
        </Text>{" "}
        and rebuild to read it here.
      </Text>
      <Pressable
        onPress={onSwitchTranslation}
        className="mt-6 px-5 py-3 rounded-full"
        style={{ backgroundColor: "#0A84FF" }}
      >
        <Text
          className="text-[13px]"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: "#FFFFFF",
            letterSpacing: 0.2,
          }}
        >
          Switch translation
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// ReaderPageView — one swipeable page in the horizontal pager
//
// The page is a fixed-width column. Inside it:
//   • (page 1 only) the chapter heading + ornament sit at the top
//   • The slice of `verses` that pagination assigned to this page
//     is rendered directly through VerseFlow — no transform, no
//     clip box.
//
// Why render the verse SLICE instead of the full chapter shifted +
// clipped (the previous approach)? Two reasons:
//
//   1. iOS Text rendering inside an `overflow: hidden` View doesn't
//      respect transforms when deciding how much to draw. Core Text
//      computes the visible text box BEFORE applying transforms, so
//      content translated INTO view from outside the bounds gets
//      silently truncated. Symptom in the prior implementation:
//      pages past page 1 showed verse text that cut off mid-word
//      with white space below.
//
//   2. The "rendering will re-break lines" concern that originally
//      motivated the full-chapter approach doesn't apply here. Every
//      verse is prefixed with a "\n" in VerseFlow, so each verse
//      starts on a fresh line and within-verse wrapping depends only
//      on that verse's text and the available width — both of which
//      are identical between the off-screen measurement pass and the
//      page render. The slice produces the same per-verse line
//      breaks the measurer saw, so the height budget from
//      `paginateLines` still holds.
// ─────────────────────────────────────────────────────────────────

function ReaderPageView({
  width,
  paddingX,
  paddingTop,
  paddingBottom,
  isFirst,
  bookName,
  chapter,
  scale,
  verses,
  startVerseIdx,
  endVerseIdx,
  bookId,
  onVersePress,
  onVerseLongPress,
  selectedSet,
  focusVerse,
  focusTint,
  focusGlow,
}: {
  width: number;
  paddingX: number;
  paddingTop: number;
  paddingBottom: number;
  isFirst: boolean;
  bookName: string;
  chapter: number;
  scale: number;
  verses: { number: number; text: string }[];
  /**
   * Inclusive 0-based slice into `verses` — only the verses in this
   * range render on this page. Pagination upstream guarantees the
   * slice fits within `pageContentHeight` (with allowance for the
   * chapter heading on `isFirst` pages).
   */
  startVerseIdx: number;
  endVerseIdx: number;
  bookId: string;
  onVersePress: (verse: number) => void;
  onVerseLongPress?: (verse: number) => void;
  selectedSet?: ReadonlySet<number>;
  focusVerse: number | null;
  focusTint: string;
  focusGlow: Animated.Value;
}) {
  // Sliced view of just this page's verses. Because every verse in
  // VerseFlow is prefixed with a "\n" (except the very first one in
  // the rendered Text), the slice produces the same per-verse line
  // breaks as the off-screen measurement pass — within-verse wraps
  // depend only on that verse's text + the available width, both of
  // which are identical between measurer and page render.
  //
  // We render this slice directly — no transform, no clip box. The
  // earlier "render full chapter, translateY -offsetY, clip to
  // contentHeight" approach broke on iOS: Core Text would silently
  // stop drawing past the clip box's bounds even though the
  // transform was visually shifting content INTO view, producing
  // pages that cut off mid-word with white space below.
  const pageVerses =
    endVerseIdx >= startVerseIdx
      ? verses.slice(startVerseIdx, endVerseIdx + 1)
      : [];

  return (
    <View
      style={{
        width,
        paddingHorizontal: paddingX,
        paddingTop,
        paddingBottom,
      }}
    >
      {isFirst ? (
        <ChapterHeading bookName={bookName} chapter={chapter} scale={scale} />
      ) : null}
      <VerseFlow
        verses={pageVerses}
        bookId={bookId}
        chapter={chapter}
        scale={scale}
        onVersePress={onVersePress}
        onVerseLongPress={onVerseLongPress}
        selectedSet={selectedSet}
        focusVerse={focusVerse}
        focusTint={focusTint}
        focusGlow={focusGlow}
        onAnchors={() => {
          /* page copies don't need to feed anchors back up */
        }}
      />
    </View>
  );
}

function ChapterHeading({
  bookName,
  chapter,
  scale,
}: {
  bookName: string;
  chapter: number;
  scale: number;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", marginBottom: 14 }}>
      <Text
        className="text-ink-subtle text-[10.5px] tracking-[3px] uppercase"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {bookName}
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 26 * Math.sqrt(scale),
          lineHeight: 34 * Math.sqrt(scale),
          letterSpacing: 0.5,
          color: colors.ink,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        Chapter {chapter}
      </Text>
      <ChapterOrnament />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// End-matter page — final card after the verses
// ─────────────────────────────────────────────────────────────────

/**
 * End-matter page — the final "page" the user swipes to after the
 * last verse. Designed as a single-decision moment:
 *
 *   "Mark as Read" → tap → confirmation pulse → auto-advance to the
 *   next chapter in the same canonical sequence.
 *
 * The old end matter showed a Mark-as-Read button AND a separate
 * Next nav tile, so the user had to take two actions to keep
 * reading. We collapsed that to a single primary CTA so finishing a
 * chapter feels like one continuous gesture (read → mark → next).
 *
 * Four states drive the primary CTA copy:
 *   • !alreadyRead + next  → "Mark as Read" / "Up next: {next}"
 *   • !alreadyRead + !next → "Mark as Read" / "End of {book}"
 *   •  alreadyRead + next  → "Continue Reading" / "{next}"
 *   •  alreadyRead + !next → "Back to {book}" / "You've finished {book}"
 *
 * The alreadyRead branch exists because the dwell-based auto-mark
 * (≥70% pages + 30s) often fires before the user reaches the end
 * matter — the page should ferry them forward, not nag them to
 * re-mark something already recorded.
 *
 * `advancing` is a brief local state (220–600ms) that lets the CTA
 * pulse a confirmation ("Marked as Read ✓") before the next
 * chapter replaces the screen, so the action doesn't feel like a
 * dropped frame.
 */
function EndMatterPage({
  width,
  paddingX,
  book,
  chapter,
  alreadyRead,
  onMarkRead,
  translationName,
  translationNote,
  onChangeTranslation,
  prev,
  next,
  onGoto,
}: {
  width: number;
  paddingX: number;
  book: { id: string; name: string };
  chapter: number;
  alreadyRead: boolean;
  onMarkRead: () => void;
  translationName: string;
  translationNote: string;
  onChangeTranslation: () => void;
  prev: { bookId: string; chapter: number } | null;
  next: { bookId: string; chapter: number } | null;
  onGoto: (target: { bookId: string; chapter: number }) => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending advance if the user swipes away or the page
  // unmounts — otherwise navigation could fire after the reader has
  // already moved on for some other reason (translation switch,
  // route replace, etc.).
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, []);

  const nextBook = next ? findBookById(next.bookId) : null;
  const prevBook = prev ? findBookById(prev.bookId) : null;

  // Resolve CTA copy from the 4 states above. Kept as plain locals
  // (not a switch) so each branch's label + sublabel sit next to
  // each other and are easy to tweak in copy review.
  let primaryLabel: string;
  let primarySublabel: string;
  if (!alreadyRead) {
    primaryLabel = "Mark as Read";
    primarySublabel =
      next && nextBook
        ? `Up next · ${nextBook.name} ${next.chapter}`
        : `You've reached the end of ${book.name}`;
  } else if (next && nextBook) {
    primaryLabel = "Continue Reading";
    primarySublabel = `${nextBook.name} ${next.chapter}`;
  } else {
    primaryLabel = `Back to ${book.name}`;
    primarySublabel = `You've finished ${book.name}`;
  }

  const handlePrimary = () => {
    if (advancing) return;
    setAdvancing(true);

    // Fresh-read taps get a celebration haptic + the explicit
    // mark; already-read taps are just navigation, so a softer
    // medium tap is enough.
    if (!alreadyRead) {
      haptics.success();
      onMarkRead();
    } else {
      haptics.tap();
    }

    // Longer pause on a fresh read so the "Marked as Read ✓"
    // state has time to register before the next chapter swaps in.
    const delay = alreadyRead ? 220 : 620;
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      if (next) {
        onGoto(next);
      } else {
        // End of the canonical sequence (e.g. Revelation 22). Drop
        // the user back at the book overview where they can pick a
        // sibling book from the "More from {category}" rail.
        router.replace(`/book/${book.id}` as const);
      }
    }, delay);
  };

  // The button shows a transient "Marked as Read ✓" only on the
  // fresh-read path; already-read taps skip straight to a dim
  // pressed look since "Marked" would lie ("it was already marked
  // before you tapped").
  const showFreshConfirm = advancing && !alreadyRead;

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{
        paddingHorizontal: paddingX,
        paddingTop: 36,
        paddingBottom: 220,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center pt-6 pb-8">
        <Text
          className="text-[10.5px] tracking-[3px] uppercase"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: alreadyRead ? colors.inkMuted : colors.inkSubtle,
          }}
        >
          {alreadyRead ? "Chapter complete" : "End of chapter"}
        </Text>
        <Text
          className="text-ink mt-3"
          style={{
            fontFamily: "PlusJakartaSans_800ExtraBold",
            fontSize: 32,
            lineHeight: 36,
            letterSpacing: -0.6,
          }}
        >
          {book.name} {chapter}
        </Text>
        <ChapterOrnament />
      </View>

      <Pressable
        onPress={handlePrimary}
        disabled={advancing}
        accessibilityRole="button"
        accessibilityLabel={
          showFreshConfirm ? "Marked as read, advancing" : primaryLabel
        }
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          borderRadius: 18,
          paddingVertical: 18,
          paddingHorizontal: 22,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.9 : advancing ? 0.92 : 1,
          shadowColor: "#000000",
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        })}
      >
        {showFreshConfirm ? (
          <View className="flex-row items-center">
            <PrimaryCheckIcon color={colors.primaryFg} />
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.primaryFg,
                fontSize: 17,
                marginLeft: 8,
              }}
            >
              Marked as Read
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.primaryFg,
                fontSize: 17,
              }}
            >
              {primaryLabel}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.primaryFg,
                fontSize: 12,
                marginTop: 3,
                opacity: 0.65,
              }}
            >
              {primarySublabel}
            </Text>
          </>
        )}
      </Pressable>

      {!alreadyRead && (
        <Text
          className="text-center mt-3"
          style={{
            fontFamily: "PlusJakartaSans_500Medium",
            color: colors.inkSubtle,
            fontSize: 11.5,
            lineHeight: 16,
          }}
        >
          Counts toward your reading streak
        </Text>
      )}

      {prev && prevBook && (
        <Pressable
          onPress={() => onGoto(prev)}
          className="mt-7 self-center flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel={`Back to ${prevBook.name} ${prev.chapter}`}
          hitSlop={10}
        >
          <Chevron direction="prev" />
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: colors.inkMuted,
              fontSize: 13,
              marginLeft: 6,
            }}
          >
            {prevBook.name} {prev.chapter}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={onChangeTranslation}
        className="mt-10 items-center"
        accessibilityRole="button"
        accessibilityLabel="Change Bible version"
      >
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase text-center"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {translationName}
        </Text>
        <Text
          className="text-ink-subtle text-[10px] mt-1 text-center opacity-70"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {translationNote} · Tap to change version
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/**
 * Checkmark sized + colored for the white primary CTA pill. Sized
 * 16px so it reads as part of the button label line rather than a
 * separate icon block, and accepts an arbitrary stroke color so it
 * inherits whatever primaryFg the active theme resolves to.
 */
function PrimaryCheckIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function getAdjacent(
  bookId: string,
  chapter: number,
  direction: "prev" | "next",
): { bookId: string; chapter: number } | null {
  const book = findBookById(bookId);
  if (!book) return null;

  if (direction === "next") {
    if (chapter < book.chapters) {
      return { bookId, chapter: chapter + 1 };
    }
    const nextBook = BOOKS.find((b) => b.order === book.order + 1);
    return nextBook ? { bookId: nextBook.id, chapter: 1 } : null;
  }

  if (chapter > 1) {
    return { bookId, chapter: chapter - 1 };
  }
  const prevBook = BOOKS.find((b) => b.order === book.order - 1);
  return prevBook
    ? { bookId: prevBook.id, chapter: prevBook.chapters }
    : null;
}

// ─────────────────────────────────────────────────────────────────
// Header (Apple-Books style)
//
// Minimal top strip: back chevron on the left, translation pill on
// the right, "X pages left in chapter" centered above as a tiny
// caption. The bold chapter title intentionally moved DOWN into the
// page itself ("Chapter N" as a centered heading + ornament rule),
// so the top of the screen reads like the top of a book page — quiet
// metadata, not a navigation hub.
//
// The thin scroll-progress bar still lives below the row so the
// user has a glanceable read on where they are in the chapter even
// without looking down at the page-count caption.
// ─────────────────────────────────────────────────────────────────

function Header({
  translationTag,
  pagesLeftLabel,
  progress,
}: {
  translationTag: string;
  /** Caption like "4 pages left in chapter" — empty while loading. */
  pagesLeftLabel: string;
  progress: number;
}) {
  const router = useRouter();
  const colors = useColors();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  return (
    <View>
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 6l-6 6 6 6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View className="flex-1 items-center">
          {pagesLeftLabel ? (
            <Text
              className="text-ink-subtle text-[11.5px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              {pagesLeftLabel}
            </Text>
          ) : null}
        </View>

        {translationTag ? (
          <Pressable
            onPress={() => router.push("/settings/translation")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Change Bible version"
            className="h-10 px-3 rounded-full border border-border items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              className="text-ink-muted text-[10.5px] tracking-[1.5px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {translationTag}
            </Text>
          </Pressable>
        ) : (
          <View className="w-10 h-10" />
        )}
      </View>

      <View
        style={{
          height: 2,
          backgroundColor: colors.border,
          marginHorizontal: 16,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: colors.primary,
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pages-left copy
// ─────────────────────────────────────────────────────────────────

/**
 * Apple-Books style caption: "N pages left in chapter" / "Last page".
 * Returns an empty string when we have nothing useful to say (only
 * happens before the first scroll measurement lands).
 */
function pagesLeftLabel(pagesLeft: number): string {
  if (pagesLeft <= 0) return "Last page";
  if (pagesLeft === 1) return "1 page left in chapter";
  return `${pagesLeft} pages left in chapter`;
}

// ─────────────────────────────────────────────────────────────────
// Chapter ornament — three diamonds on a soft horizontal rule
// ─────────────────────────────────────────────────────────────────

function ChapterOrnament() {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 6,
      }}
    >
      <View
        style={{
          width: 36,
          height: 1,
          backgroundColor: colors.border,
        }}
      />
      <View style={{ flexDirection: "row", marginHorizontal: 10 }}>
        <Diamond />
        <View style={{ width: 6 }} />
        <Diamond />
        <View style={{ width: 6 }} />
        <Diamond />
      </View>
      <View
        style={{
          width: 36,
          height: 1,
          backgroundColor: colors.border,
        }}
      />
    </View>
  );
}

function Diamond() {
  const colors = useColors();
  return (
    <Svg width={6} height={6} viewBox="0 0 10 10">
      <Path d="M5 0L10 5L5 10L0 5Z" fill={colors.inkSubtle} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Bottom toolbar — compact icon pill with tap-to-expand popovers
//
// Apple Books treats the bottom of the reader as a calm row of icons
// that DON'T cover scripture. Each icon is its own affordance:
//   • Contents — full-screen chapter list (opens a modal)
//   • Aa       — text size + translation, expands a small popover
//                ABOVE the toolbar
//   • Goal     — today's progress, expands a small popover above
//
// Tapping the same icon while its popover is open collapses it.
// Tapping outside also collapses (the transparent backdrop captures
// that gesture and routes it through to the page below). The pill
// itself stays anchored to the bottom safe area at all times so
// users always have a one-tap path back to chapter chrome.
// ─────────────────────────────────────────────────────────────────

type ToolbarSection = "themes" | "goal" | null;

function ReaderToolbar({
  onContents,
  textSizeId,
  onChangeTextSize,
  translation,
  onChangeTranslation,
  todayMinutes,
  goalMinutes,
  onOpenReadingGoal,
}: {
  onContents: () => void;
  textSizeId: TextSizeId;
  onChangeTextSize: (id: TextSizeId) => void;
  translation: Translation;
  onChangeTranslation: () => void;
  todayMinutes: number;
  goalMinutes: number;
  onOpenReadingGoal: () => void;
}) {
  const colors = useColors();
  const [section, setSection] = useState<ToolbarSection>(null);
  const goalReached = todayMinutes >= goalMinutes;

  const toggle = (next: ToolbarSection) =>
    setSection((cur) => (cur === next ? null : next));

  return (
    <>
      {/* Backdrop: invisible, taps it to dismiss any open popover.
          Only rendered while a popover is open so it doesn't eat
          taps on the page text the rest of the time. */}
      {section ? (
        <Pressable
          onPress={() => setSection(null)}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
      ) : null}

      {/* Popover container — sits above the page caption + icon
          pill so the two read as a connected stack and the popover
          never visually clashes with the chapter caption. */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 100,
          alignItems: "center",
        }}
      >
        {section === "themes" ? (
          <ThemesPopover
            textSizeId={textSizeId}
            onChangeTextSize={(id) => {
              onChangeTextSize(id);
            }}
            translation={translation}
            onChangeTranslation={() => {
              setSection(null);
              onChangeTranslation();
            }}
          />
        ) : null}
        {section === "goal" ? (
          <GoalPopover
            todayMinutes={todayMinutes}
            goalMinutes={goalMinutes}
            onOpen={() => {
              setSection(null);
              onOpenReadingGoal();
            }}
          />
        ) : null}
      </View>

      {/* The always-visible icon pill itself. */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 18,
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 6,
            paddingVertical: 6,
          }}
        >
          <ToolbarIconButton
            accessibilityLabel="Open chapter contents"
            onPress={() => {
              setSection(null);
              onContents();
            }}
            active={false}
          >
            <ContentsListIcon />
          </ToolbarIconButton>
          <ToolbarPipDivider />
          <ToolbarIconButton
            accessibilityLabel="Text size and translation"
            onPress={() => toggle("themes")}
            active={section === "themes"}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 16,
                color: colors.ink,
              }}
            >
              Aa
            </Text>
          </ToolbarIconButton>
          <ToolbarPipDivider />
          <ToolbarIconButton
            accessibilityLabel="Reading goal"
            onPress={() => toggle("goal")}
            active={section === "goal"}
          >
            <GoalIconWithDot reached={goalReached} />
          </ToolbarIconButton>
        </View>
      </View>
    </>
  );
}

function ToolbarIconButton({
  onPress,
  children,
  accessibilityLabel,
  active,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  active: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        width: 48,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: active ? colors.accentSoft : "transparent",
      })}
    >
      {children}
    </Pressable>
  );
}

function ToolbarPipDivider() {
  const colors = useColors();
  return (
    <View
      style={{
        width: 1,
        height: 18,
        backgroundColor: colors.border,
      }}
    />
  );
}

function ContentsListIcon() {
  const colors = useColors();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h12M4 12h12M4 18h12M19 6h1M19 12h1M19 18h1"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GoalIconWithDot({ reached }: { reached: boolean }) {
  // A flame-y target glyph that fills in amber the moment today's
  // goal is met — same visual language as the Journey week strip.
  const colors = useColors();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill={reached ? "#FFB672" : "none"}
        stroke={reached ? "#FFB672" : colors.ink}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Themes & settings popover — text size picker + translation row
//
// Visual intent: Apple-Books-quality glass card. The previous build
// was a flat dark rectangle with thin gray chips and a tiny tag pill
// on the right of a row labeled "Translation" — it looked closer to
// a debug panel than a reader setting. This rebuild:
//
//   • Renders on a true `BlurView` material so the popover reads as
//     glass over the page, not a stamped surface. A translucent dark
//     fill sits on top of the blur to keep the foreground legible
//     against any chapter bloom backdrop.
//
//   • Replaces the 4 standalone chips with a single segmented
//     control. Each cell shows "Aa" sized to actually look like
//     small / default / large / extra-large (10pt → 22pt span), with
//     a tiny S / M / L / XL label underneath. Selected cell uses the
//     app's iOS-blue accent (`colors.select`) so the selection reads
//     instantly.
//
//   • Promotes "Translation" from a one-line row with a cramped tag
//     to a real settings row showing the full translation name on
//     top, the short tag underneath, and a chevron to indicate it
//     navigates to a fuller picker. Tappable across the whole row.
//
//   • Soft haptic on every interaction so the whole thing feels
//     alive.
// ─────────────────────────────────────────────────────────────────

function ThemesPopover({
  textSizeId,
  onChangeTextSize,
  translation,
  onChangeTranslation,
}: {
  textSizeId: TextSizeId;
  onChangeTextSize: (id: TextSizeId) => void;
  translation: Translation;
  onChangeTranslation: () => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  // Glass material flips with the active scheme — dark mode keeps
  // a night-sky tint with a faint white hairline; light mode runs
  // a milky-white tint with a warm hairline so the popover reads
  // as Apple-Books-quality glass on the cream canvas instead of
  // staying as a stamped dark rectangle in the middle of a light
  // page. The shadow color also flips to a warmer near-black so
  // the soft drop on cream doesn't pool as a cold grey blob.
  const isLight = scheme === "light";
  const glassTint = isLight ? "light" : "dark";
  const glassFill = isLight
    ? "rgba(255, 255, 255, 0.78)"
    : "rgba(14, 14, 16, 0.78)";
  const glassHairline = isLight
    ? "rgba(15, 15, 15, 0.08)"
    : "rgba(255, 255, 255, 0.08)";
  const glassShadowOpacity = isLight ? 0.18 : 0.45;
  return (
    <View
      style={{
        width: 320,
        borderRadius: 22,
        overflow: "hidden",
        // Soft outer drop shadow so the popover lifts off the page
        // — gives the glass material its sense of depth even on
        // iOS where blur alone is subtle.
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: glassShadowOpacity,
            shadowRadius: 30,
          },
          android: { elevation: 18 },
        }),
      }}
    >
      <BlurView
        // Intensity is platform-tuned (iOS reads `intensity`
        // directly; Android needs a higher value to reach a
        // similar opacity) and tint flips with the resolved
        // scheme so the material reads as the page's own glass
        // rather than a foreign island.
        intensity={Platform.OS === "ios" ? 60 : 90}
        tint={glassTint}
        style={{
          // Translucent wash on top of the blur — without it,
          // page text behind the popover bleeds through enough to
          // hurt the chip labels' contrast on either canvas.
          backgroundColor: glassFill,
          borderRadius: 22,
          // Subtle hairline keeps the edge crisp against any
          // chapter bloom color behind it.
          borderWidth: 1,
          borderColor: glassHairline,
        }}
      >
        {/* ─── Text Size ──────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 10.5,
              color: colors.inkSubtle,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            Text Size
          </Text>
          <TextSizeSlider
            value={textSizeId}
            onChange={(id) => {
              onChangeTextSize(id);
            }}
          />
        </View>

        {/* Hairline divider — same hairline color the popover
            border uses so the rule reads as part of the same
            glass material instead of a separate ink line. */}
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: glassHairline,
            marginHorizontal: 14,
          }}
        />

        {/* ─── Translation ────────────────────────────────────── */}
        <Pressable
          onPress={() => {
            haptics.soft();
            onChangeTranslation();
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
          })}
          accessibilityRole="button"
          accessibilityLabel={`Change translation. Current: ${translation.fullName}`}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 10.5,
                color: colors.inkSubtle,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              Translation
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 15,
                color: colors.ink,
                marginTop: 6,
              }}
              numberOfLines={1}
            >
              {translation.fullName}
            </Text>
          </View>
          {/* Right-side tag + chevron group reads as "current value
              + this opens a picker", which is the iOS Settings
              row idiom users already know. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: colors.selectSoft,
                borderWidth: 1,
                borderColor: "rgba(10, 132, 255, 0.45)",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 10.5,
                  color: colors.select,
                  letterSpacing: 1.2,
                }}
              >
                {translation.tag}
              </Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 6l6 6-6 6"
                stroke={colors.inkSubtle}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Pressable>
      </BlurView>
    </View>
  );
}

/**
 * Text-size slider — Apple-Books-style horizontal track with an
 * animated thumb that snaps between the four discrete TEXT_SIZES
 * positions (Small / Default / Large / Extra-Large).
 *
 * Why a slider instead of the old 4-cell segmented control:
 *   • The segmented control rendered four `Aa` glyphs at four
 *     wildly different sizes (11 / 15 / 19 / 23 pt) which read
 *     as visually noisy — especially with a tinted active cell
 *     dropped in the middle. The user described it as
 *     "unprofessional."
 *   • A slider mirrors the affordance every iOS-native reading
 *     app uses (Apple Books, Hallow, Kindle, Reeder) — a clean
 *     track with a thumb, tiny "Aa" / big "Aa" bookends. The
 *     scale is conveyed by the END labels, not by four discrete
 *     glyphs competing for attention.
 *   • The control is still discretized to TEXT_SIZES under the
 *     hood — small / default / large / x-large — so all reader
 *     code that depends on `TextSizeId` keeps working unchanged.
 *
 * Interaction:
 *   • Tap anywhere on the track → thumb springs to the nearest
 *     step and emits onChange.
 *   • Drag the track → thumb follows the touch and snaps to the
 *     nearest step on every change (haptic per snap, not per
 *     pixel). On release the thumb settles at the final step.
 *   • Each snap is a soft haptic so the slider feels "notched"
 *     rather than continuous.
 *
 * Layout math:
 *   • The interactive container takes the full popover width.
 *   • The visible track is inset 14pt from each side (THUMB_RADIUS)
 *     so the thumb has room at the extremes without clipping.
 *   • Steps are evenly spaced from x=14 to x=(width-14), so for
 *     N steps the gap between adjacent steps is (width-28)/(N-1).
 *   • The thumb's `translateX` drives its position — animated on
 *     spring so taps feel responsive but landings feel iOS-natural.
 */
const THUMB_DIAMETER = 28;
const THUMB_RADIUS = THUMB_DIAMETER / 2;

function TextSizeSlider({
  value,
  onChange,
}: {
  value: TextSizeId;
  onChange: (id: TextSizeId) => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  // Track / tick / thumb tints flip with the glass material —
  // dark popover gets faint-white parts, light popover gets
  // faint-ink parts, and the thumb adopts the ink color so it
  // reads as a deliberate handle on either canvas (a pure-white
  // thumb on cream glass would float without an edge).
  const isLight = scheme === "light";
  const trackColor = isLight
    ? "rgba(15, 15, 15, 0.12)"
    : "rgba(255, 255, 255, 0.12)";
  const tickColor = isLight
    ? "rgba(15, 15, 15, 0.30)"
    : "rgba(255, 255, 255, 0.35)";
  const thumbColor = isLight ? colors.ink : "#FFFFFF";
  const stepCount = TEXT_SIZES.length;
  const activeIndex = Math.max(
    0,
    TEXT_SIZES.findIndex((s) => s.id === value),
  );

  // Container width is measured at mount via onLayout. Until the
  // first layout pass we render the thumb at translateX=0 — the
  // useEffect below snaps it into the right slot as soon as we
  // know the width. This avoids a flash of "thumb at left edge"
  // on first paint because the thumb itself doesn't render until
  // we know the geometry.
  const [containerWidth, setContainerWidth] = useState(0);
  const trackWidth = Math.max(0, containerWidth - THUMB_DIAMETER);
  const stepWidth = stepCount > 1 ? trackWidth / (stepCount - 1) : 0;

  // Animated thumb position (translateX from container left edge).
  // We always render the thumb relative to the LEFT padding inset
  // — translateX of 0 puts the thumb's left edge at x=0, which
  // means its center sits at x=THUMB_RADIUS, which is exactly
  // where step 0 lives.
  const thumbX = useRef(new Animated.Value(0)).current;

  // Spring the thumb whenever the active step changes or the
  // container width is measured for the first time. We drive
  // translateX (not `left`) so we can use the native driver.
  useEffect(() => {
    Animated.spring(thumbX, {
      toValue: activeIndex * stepWidth,
      tension: 110,
      friction: 13,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, stepWidth, thumbX]);

  // Map a touch x coordinate (in container coordinates) to a step
  // index. Subtract the THUMB_RADIUS inset so the track origin is
  // at the visible track's start, then round to the nearest step.
  const indexFromX = useCallback(
    (x: number): number => {
      if (stepWidth <= 0) return activeIndex;
      const local = x - THUMB_RADIUS;
      const raw = local / stepWidth;
      return Math.max(0, Math.min(stepCount - 1, Math.round(raw)));
    },
    [stepWidth, activeIndex, stepCount],
  );

  // PanResponder for tap + drag. Recreated whenever indexFromX
  // changes (which only happens when the container width or the
  // active step changes). onChange is captured in the closure;
  // calling it triggers the parent's state update which re-runs
  // the spring effect above to advance the thumb.
  const panHandlers = useMemo(() => {
    const handleAt = (x: number) => {
      const idx = indexFromX(x);
      if (idx !== activeIndex && idx >= 0 && idx < stepCount) {
        haptics.soft();
        onChange(TEXT_SIZES[idx]!.id);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleAt(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleAt(e.nativeEvent.locationX),
      onPanResponderTerminationRequest: () => false,
    }).panHandlers;
  }, [indexFromX, activeIndex, stepCount, onChange]);

  return (
    <View style={{ marginTop: 14 }}>
      {/* End-label bookends — tiny "Aa" on the left to indicate
          "smaller", larger "Aa" on the right to indicate "bigger".
          Same visual idiom Apple Books / Hallow use. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingHorizontal: 2,
          marginBottom: 10,
          height: 22,
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 13,
            lineHeight: 16,
            color: colors.inkSubtle,
          }}
        >
          Aa
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 21,
            lineHeight: 24,
            color: colors.inkSubtle,
          }}
        >
          Aa
        </Text>
      </View>

      {/* Slider track — full-width touch area; the visible track
          line lives inset by THUMB_RADIUS on either side so the
          thumb never clips at the extremes. */}
      <View
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={{
          height: THUMB_DIAMETER,
          justifyContent: "center",
        }}
        accessibilityRole="adjustable"
        accessibilityLabel="Text size"
        accessibilityValue={{
          min: 0,
          max: stepCount - 1,
          now: activeIndex,
          text: TEXT_SIZES[activeIndex]?.name ?? "",
        }}
        {...panHandlers}
      >
        {/* Track line — sits inside the thumb-padded inset so it
            visually starts/ends at the thumb's center positions. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: THUMB_RADIUS,
            right: THUMB_RADIUS,
            height: 4,
            borderRadius: 2,
            backgroundColor: trackColor,
          }}
        />

        {/* Tick marks — small dots at each step position to show
            the snap targets. Hidden under the thumb at the active
            step (the thumb visually replaces the tick). */}
        {stepWidth > 0
          ? TEXT_SIZES.map((_, i) => {
              const isActive = i === activeIndex;
              return (
                <View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: THUMB_RADIUS + i * stepWidth - 3,
                    top: THUMB_RADIUS - 3,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isActive ? "transparent" : tickColor,
                  }}
                />
              );
            })
          : null}

        {/* Animated thumb — circle that springs between step
            positions. translateX is driven by the spring; the
            base `left: 0` puts the thumb's left edge flush with
            the container left, so translateX=0 places its center
            at x=THUMB_RADIUS, which is exactly step 0. */}
        {containerWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: THUMB_DIAMETER,
              height: THUMB_DIAMETER,
              borderRadius: THUMB_RADIUS,
              backgroundColor: thumbColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isLight ? 0.18 : 0.35,
              shadowRadius: 3,
              elevation: 4,
              transform: [{ translateX: thumbX }],
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Reading-goal popover — today's progress + link to settings
// ─────────────────────────────────────────────────────────────────

function GoalPopover({
  todayMinutes,
  goalMinutes,
  onOpen,
}: {
  todayMinutes: number;
  goalMinutes: number;
  onOpen: () => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const pct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const reached = todayMinutes >= goalMinutes;
  // Same theme-aware glass treatment as ThemesPopover so the two
  // popovers read as one connected family of reader chrome on
  // either canvas (dark night-sky glass / light milky glass).
  const isLight = scheme === "light";
  const glassTint = isLight ? "light" : "dark";
  const glassFill = isLight
    ? "rgba(255, 255, 255, 0.78)"
    : "rgba(14, 14, 16, 0.78)";
  const glassHairline = isLight
    ? "rgba(15, 15, 15, 0.08)"
    : "rgba(255, 255, 255, 0.08)";
  const glassTrack = isLight
    ? "rgba(15, 15, 15, 0.10)"
    : "rgba(255, 255, 255, 0.10)";
  const glassShadowOpacity = isLight ? 0.18 : 0.45;
  return (
    <View
      style={{
        width: 320,
        borderRadius: 22,
        overflow: "hidden",
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: glassShadowOpacity,
            shadowRadius: 30,
          },
          android: { elevation: 18 },
        }),
      }}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 60 : 90}
        tint={glassTint}
        style={{
          backgroundColor: glassFill,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: glassHairline,
        }}
      >
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 10.5,
                color: colors.inkSubtle,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              Today
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 11,
                color: colors.inkSubtle,
              }}
            >
              {formatGoalMinutes(todayMinutes)} / {goalMinutes} min
            </Text>
          </View>
          <View
            style={{
              height: 6,
              backgroundColor: glassTrack,
              borderRadius: 3,
              overflow: "hidden",
              marginTop: 12,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${pct}%`,
                backgroundColor: reached ? "#FFB672" : colors.primary,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 12,
              color: colors.inkMuted,
              lineHeight: 18,
              marginTop: 10,
            }}
          >
            {reached
              ? "Today's reading goal reached."
              : "Keep reading — your minutes count automatically."}
          </Text>
        </View>
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: glassHairline,
            marginHorizontal: 14,
          }}
        />
        <Pressable
          onPress={() => {
            haptics.soft();
            onOpen();
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          })}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 14,
              color: colors.ink,
            }}
          >
            Change goal
          </Text>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 6l6 6-6 6"
              stroke={colors.inkSubtle}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </BlurView>
    </View>
  );
}

/**
 * Pretty-print today's accumulated minutes for compact toolbar
 * displays. Rounds to whole minutes — the precise "0:42" treatment
 * is reserved for the Reading Goal settings page.
 */
function formatGoalMinutes(m: number): string {
  if (m < 1) return "0";
  return String(Math.floor(m));
}

/**
 * Compose a human reference from a list of verse numbers in a
 * single chapter:
 *   [16]            → "John 3:16"
 *   [16, 17, 18]    → "John 3:16–18"
 *   [1, 4, 7]       → "John 3:1, 4, 7"
 * Used by the multi-verse note editor + share sheet so users see
 * the same shorthand they'd write themselves in a margin.
 */
function formatVerseRange(
  bookName: string,
  chapter: number,
  verses: ReadonlyArray<number>,
): string {
  if (verses.length === 0) return `${bookName} ${chapter}`;
  const sorted = [...verses].sort((a, b) => a - b);
  // Detect a strictly contiguous run so we can use an en-dash range.
  let contiguous = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      contiguous = false;
      break;
    }
  }
  if (sorted.length === 1) {
    return `${bookName} ${chapter}:${sorted[0]}`;
  }
  if (contiguous) {
    return `${bookName} ${chapter}:${sorted[0]}–${sorted[sorted.length - 1]}`;
  }
  return `${bookName} ${chapter}:${sorted.join(", ")}`;
}

// ─────────────────────────────────────────────────────────────────
// Selection action bar
//
// Floats over the bottom of the reader whenever the user has at
// least one verse selected. Replaces the normal toolbar's role
// while active — same shape (rounded card), same gravity, but
// the contents are the multi-verse actions: a color swatch row,
// a "Note" button, a "Share" button, and a "Done" pill that
// dismisses selection.
// ─────────────────────────────────────────────────────────────────

function SelectionBar({
  count,
  onColor,
  onNote,
  onShare,
  onDone,
}: {
  count: number;
  onColor: (id: HighlightColorId | null) => void;
  onNote: () => void;
  onShare: () => void;
  onDone: () => void;
}) {
  const colors = useColors();
  // Geometry locked to absolute pixel sizes so the bar renders
  // identically on every screen width and React Native version.
  // No flex-`gap`, no `flex: 1` siblings — every pip and button is
  // sized by hand, and the action row's two buttons get an explicit
  // half-width split. This is the layout that finally stopped the
  // "icons overlap / swatches disappear" regressions on iOS.
  const CARD_WIDTH = 340;
  const ROW_INSET = 16;
  const SWATCH = 30;
  const SWATCH_COUNT = HIGHLIGHT_COLORS.length + 1; // +1 for the no-fill chip
  const SWATCH_INNER = CARD_WIDTH - ROW_INSET * 2;
  const SWATCH_GAP = (SWATCH_INNER - SWATCH * SWATCH_COUNT) / (SWATCH_COUNT - 1);
  const ACTION_HEIGHT = 64;
  const ACTION_HALF = CARD_WIDTH / 2;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 18,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: CARD_WIDTH,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 18,
        }}
      >
        {/* Header: selection count + Done button. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: ROW_INSET,
            paddingTop: 12,
            paddingBottom: 10,
          }}
        >
          <Text
            className="text-ink text-[13px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {count} verse{count === 1 ? "" : "s"} selected
          </Text>
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Exit selection"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderColor: colors.border,
              borderWidth: 1,
            })}
          >
            <Text
              className="text-ink-muted text-[11px] tracking-[1.5px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              DONE
            </Text>
          </Pressable>
        </View>

        {/* Highlight color row — pips are spaced edge-to-edge across
            the card via a computed gap so they always reach the
            right inset, no matter what the surrounding width is.
            Each swatch's left margin is computed deterministically
            instead of relying on flexbox `gap`. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: ROW_INSET,
            paddingBottom: 12,
          }}
        >
          <ColorSwatch
            size={SWATCH}
            onPress={() => onColor(null)}
            dim
          />
          {HIGHLIGHT_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              size={SWATCH}
              marginLeft={SWATCH_GAP}
              onPress={() => onColor(c.id)}
              fill={c.swatch}
              ring={c.swatch}
            />
          ))}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
          }}
        />

        {/* Action row — Note + Share. Hand-sized to exactly half the
            card width each, with the divider absolutely positioned
            down the middle. This avoids the flex sizing quirks that
            collapsed icon+label onto each other previously. */}
        <View
          style={{
            flexDirection: "row",
            width: CARD_WIDTH,
            height: ACTION_HEIGHT,
          }}
        >
          <SelectionAction
            label="Note"
            icon={<NoteActionIcon />}
            onPress={onNote}
            width={ACTION_HALF}
          />
          <SelectionAction
            label="Share"
            icon={<ShareActionIcon />}
            onPress={onShare}
            width={ACTION_HALF}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: ACTION_HALF - 0.5,
              top: 12,
              bottom: 12,
              width: 1,
              backgroundColor: colors.border,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function ColorSwatch({
  fill,
  ring,
  dim,
  onPress,
  size,
  marginLeft,
}: {
  fill?: string;
  ring?: string;
  dim?: boolean;
  onPress: () => void;
  size: number;
  marginLeft?: number;
}) {
  const colors = useColors();
  // Wrap the visual disc in a plain <View> so RN always gives it an
  // explicit box regardless of children. When Pressable's `style`
  // is a function and the only child is `null`, iOS occasionally
  // collapses the box and the swatch disappears. The inner View
  // owns the sizing/background; the Pressable just handles taps.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ marginLeft: marginLeft ?? 0 }}
      hitSlop={6}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: ring ?? colors.borderStrong,
          backgroundColor: fill ?? "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {dim ? (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 5l14 14M19 5L5 19"
              stroke={colors.inkSubtle}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Selection-bar action button. Fixed width (half the card), icon
 * on the LEFT, label centered next to it via a small fixed gap
 * (marginLeft). No `gap` style; no `flex: 1` ambiguity.
 */
function SelectionAction({
  label,
  icon,
  onPress,
  width,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  width: number;
}) {
  const colors = useColors();
  // Same shape-isolation trick as ColorSwatch: put the laid-out
  // contents inside a plain <View> so the explicit width/height
  // and flexDirection always apply, regardless of how Pressable's
  // style function interacts with the host renderer.
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          width,
          height: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 13,
            color: colors.ink,
            marginLeft: 8,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function NoteActionIcon() {
  const colors = useColors();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h12l4 4v12H4z"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M8 10h8M8 14h6"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShareActionIcon() {
  const colors = useColors();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v14M6 9l6-6 6 6M5 21h14"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Contents modal (Apple-Books chapter list)
// ─────────────────────────────────────────────────────────────────

function ContentsModal({
  visible,
  onClose,
  bookId,
  bookName,
  totalChapters,
  currentChapter,
  hasReadChapter,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  bookId: string;
  bookName: string;
  totalChapters: number;
  currentChapter: number;
  hasReadChapter: (bookId: string, chapter: number) => boolean;
  onSelect: (chapter: number) => void;
}) {
  const colors = useColors();
  const book = findBookById(bookId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <View className="flex-row items-center flex-1">
            {book ? (
              <View
                style={{
                  width: 36,
                  height: 48,
                  borderRadius: 4,
                  overflow: "hidden",
                  marginRight: 12,
                }}
              >
                <BookCover book={book} variant="thumb" />
              </View>
            ) : null}
            <View className="flex-1">
              <Text
                className="text-ink text-[15px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                numberOfLines={1}
              >
                {bookName}
              </Text>
              <Text
                className="text-ink-subtle text-[11.5px] mt-0.5"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Chapter {currentChapter} of {totalChapters}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close contents"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M18 6l-12 12"
                stroke={colors.ink}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map((c) => {
            const read = hasReadChapter(bookId, c);
            const current = c === currentChapter;
            return (
              <Pressable
                key={c}
                onPress={() => onSelect(c)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: current ? colors.surface : "transparent",
                })}
              >
                <View
                  className="flex-row items-center px-5 py-4"
                  style={{
                    borderBottomColor: colors.border,
                    borderBottomWidth: c === totalChapters ? 0 : 0.5,
                  }}
                >
                  <Text
                    className="text-ink text-[15px] flex-1"
                    style={{
                      fontFamily: current
                        ? "PlusJakartaSans_700Bold"
                        : "PlusJakartaSans_500Medium",
                    }}
                  >
                    Chapter {c}
                  </Text>
                  {read ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.primary,
                        marginRight: 12,
                      }}
                    />
                  ) : null}
                  <Text
                    className="text-ink-subtle text-[13px]"
                    style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                  >
                    {c}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Reading-goal celebration toast
// ─────────────────────────────────────────────────────────────────

function GoalToast({
  anim,
  goalMinutes,
}: {
  anim: Animated.Value;
  goalMinutes: number;
}) {
  const colors = useColors();
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 64,
        alignItems: "center",
        opacity: anim,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        <CheckBadgeIcon />
        <Text
          className="text-ink text-[13px] ml-2"
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
        >
          Today&apos;s reading goal achieved
        </Text>
        <Text
          className="text-ink-subtle text-[11.5px] ml-2"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          · {goalMinutes} min
        </Text>
      </View>
    </Animated.View>
  );
}

function CheckBadgeIcon() {
  const colors = useColors();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 100-20 10 10 0 000 20z"
        fill={colors.primary}
      />
      <Path
        d="M8 12l3 3 5-6"
        stroke={colors.primaryFg}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
  const colors = useColors();
  const d = direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={colors.inkSubtle}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Find the position of verse N's number marker inside a single
 * rendered line of text, starting the search at `from`. Returns the
 * `idx` where the marker begins and the `end` index immediately
 * after the marker (so callers can advance their search cursor).
 *
 * The visible marker shape depends on whether the verse has notes:
 *   • plain:        "  N  " (two-space + number + two-space)
 *   • with note:    "  N ●…  " (number + single space + bullet +
 *                   optional count digits + two-space)
 *
 * Important real-world wrinkle: iOS (CoreText / RCTTextLayoutManager)
 * strips leading whitespace from any line that begins fresh after a
 * `\n` or a hard wrap. So a verse that starts at the top of a line
 * — which is the COMMON case now that we put each verse on its own
 * paragraph — sees its `"  "` prefix removed and we get back just
 * `"N  body"`. To stay correct in both shapes we also accept the
 * leading-stripped variant when searching at `from == 0`.
 *
 * Returns null if N's marker isn't present at/after `from`.
 */
function findVerseMarker(
  text: string,
  verseNum: number,
  from: number,
): { idx: number; end: number } | null {
  const plain = `  ${verseNum}  `;
  const plainIdx = text.indexOf(plain, from);
  if (plainIdx !== -1) {
    return { idx: plainIdx, end: plainIdx + plain.length };
  }
  // U+25CF BLACK CIRCLE — the note marker rendered inline next to
  // the verse number. Embed the literal so the regex source mirrors
  // exactly what onTextLayout's `text` field contains.
  const noteRe = new RegExp(`  ${verseNum} ●\\d*  `);
  const slice = text.slice(from);
  const m = noteRe.exec(slice);
  if (m) {
    return { idx: from + m.index, end: from + m.index + m[0].length };
  }
  // Line-start variant: when iOS strips the leading `"  "` from a
  // wrapped / post-newline line, the marker shows up as `"N  body"`
  // (or `"N ●…  body"`) at index 0. Only check at the start of the
  // line to avoid false-positives where a verse body happens to
  // contain something like "10 men" mid-line.
  if (from === 0) {
    const lineStart = `${verseNum}  `;
    if (text.startsWith(lineStart)) {
      return { idx: 0, end: lineStart.length };
    }
    const lineStartNoteRe = new RegExp(`^${verseNum} ●\\d*  `);
    const m2 = lineStartNoteRe.exec(text);
    if (m2) {
      return { idx: 0, end: m2[0].length };
    }
  }
  return null;
}

/**
 * Walk a measured line array and group consecutive lines into pages
 * that fit inside the given content height — breaking ONLY at verse
 * boundaries, never in the middle of a verse.
 *
 * The first page receives `firstPageHeadingHeight` less vertical
 * room — the visible chapter heading + ornament prepended at the
 * top of page 1 lives outside the clipped text region, so the
 * verse content on page 1 has to fit in the remainder.
 *
 * `verseStartLines` is a sorted array of line indices where each
 * verse number first appears in the measured text. When a line
 * doesn't fit on the current page, we walk backwards to the last
 * verse boundary inside the page's range and end the page there
 * — so the next page starts at the top of a fresh verse and the
 * reader never has to chase a verse across the gutter.
 *
 * Pathological case: a single verse so long that it can't fit on
 * one page (theoretical — would need an enormous font on a tiny
 * screen). We fall back to line-level breaking only for that one
 * verse so we don't infinite-loop.
 */
function paginateLines(
  lines: ReadonlyArray<TextLayoutLine>,
  pageContentHeight: number,
  firstPageHeadingHeight: number,
  verseStartLines: ReadonlyArray<number>,
  totalVerseCount: number,
): ReaderPage[] {
  if (lines.length === 0) {
    return [
      {
        startLine: 0,
        endLine: -1,
        offsetY: 0,
        contentHeight: 0,
        startVerseIdx: 0,
        endVerseIdx: Math.max(0, totalVerseCount - 1),
        isFirst: true,
      },
    ];
  }

  /**
   * Convert a measured line index back to the 0-based verse index it
   * belongs to. Walks the sorted `verseStartLines` and returns the
   * index of the last verse whose start line is <= the query line.
   * Falls back to 0 for queries before the first verse's start (the
   * theoretical case where a few leading lines precede verse 1).
   */
  function verseIdxAtLine(line: number): number {
    let best = 0;
    for (let i = 0; i < verseStartLines.length; i++) {
      if (verseStartLines[i] <= line) best = i;
      else break;
    }
    return best;
  }

  /**
   * Largest verse-start line index that's strictly greater than
   * `after` and ≤ `upto`. Returns -1 when there's no boundary in
   * range (i.e. the current page would still contain just one
   * verse and we have to fall back to line-level breaking).
   */
  function lastVerseBoundary(after: number, upto: number): number {
    let best = -1;
    for (const vs of verseStartLines) {
      if (vs > after && vs <= upto && vs > best) best = vs;
    }
    return best;
  }

  /**
   * Exact pixel height of the slice [from..to] relative to the slice
   * start. We use this as the clip box height so no content from
   * after `to` bleeds into the page.
   */
  function sliceHeight(from: number, to: number): number {
    if (to < from) return 0;
    const startY = lines[from].y;
    const endLine = lines[to];
    return endLine.y + endLine.height - startY;
  }

  const pages: ReaderPage[] = [];
  let startLine = 0;
  let startY = lines[0].y;
  let isFirst = true;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const cumulative = line.y + line.height - startY;
    const room = isFirst
      ? Math.max(80, pageContentHeight - firstPageHeadingHeight)
      : pageContentHeight;

    if (cumulative > room && i > startLine) {
      // Prefer to close on a verse boundary so we never split a
      // verse across two pages. Fall back to a line break only when
      // a single verse alone is too tall to fit.
      const boundary = lastVerseBoundary(startLine, i);
      const cutAt = boundary > startLine ? boundary : i;
      pages.push({
        startLine,
        endLine: cutAt - 1,
        offsetY: startY,
        contentHeight: sliceHeight(startLine, cutAt - 1),
        startVerseIdx: verseIdxAtLine(startLine),
        endVerseIdx: verseIdxAtLine(cutAt - 1),
        isFirst,
      });
      startLine = cutAt;
      startY = lines[cutAt].y;
      isFirst = false;
      i = cutAt;
      continue;
    }
    i++;
  }

  pages.push({
    startLine,
    endLine: lines.length - 1,
    offsetY: startY,
    contentHeight: sliceHeight(startLine, lines.length - 1),
    startVerseIdx: verseIdxAtLine(startLine),
    endVerseIdx: Math.max(0, totalVerseCount - 1),
    isFirst,
  });

  return pages;
}

/**
 * Append a 0–1 alpha to a 6-digit hex color, returning the 8-digit
 * hex form (`#RRGGBBAA`). Used to drive the focus-glow background
 * interpolation in VerseFlow.
 */
function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}

function NotFound({ message }: { message: string }) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header
        translationTag=""
        pagesLeftLabel=""
        progress={0}
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-ink text-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {message}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 px-5 py-3 rounded-full bg-primary"
        >
          <Text
            className="text-primary-fg text-[13px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
