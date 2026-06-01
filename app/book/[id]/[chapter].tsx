import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  type AppStateStatus,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { NoteEditor } from "@/components/NoteEditor";
import { VerseActionSheet } from "@/components/VerseActionSheet";
import { BookCover } from "@/components/BookCover";
import { BOOKS, findBookById } from "@/constants/books";
import {
  type Chapter,
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
  type TextSize,
  type TextSizeId,
  usePreferences,
} from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors } from "@/state/theme";

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
   * Y-offset (in the original full-text layout) of the first line.
   * The renderer uses translateY = -offsetY to shift the page's slice
   * into view inside a fixed-height clipping View.
   */
  offsetY: number;
  /**
   * Exact pixel height of the rendered slice — i.e. the distance from
   * the top of startLine to the bottom of endLine. Used as the clip
   * box height so no content from the NEXT page bleeds into this one.
   * Without this, a page's clip box would be a constant
   * `pageContentHeight` and any unused tail room would reveal the
   * first line of the next verse — the "verse 6 appears twice" bug.
   */
  contentHeight: number;
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
  const [error, setError] = useState<string | null>(null);
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
        if (!cancelled) setError(e.message);
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
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
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
            <ErrorView
              message={error}
              onRetry={() => setReloadKey((k) => k + 1)}
            />
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
            windowSize={3}
            removeClippedSubviews
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
                  pageContentWidth={pageContentWidth}
                  offsetY={item.page.offsetY}
                  contentHeight={item.page.contentHeight}
                  isFirst={item.page.isFirst}
                  bookName={book.name}
                  chapter={chapter}
                  scale={textSize.scale}
                  verses={data.verses}
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
            translationTag={translation.tag}
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

// ─────────────────────────────────────────────────────────────────
// ReaderPageView — one swipeable page in the horizontal pager
//
// The page is a fixed-size column. Inside it:
//   • (page 1 only) the chapter heading + ornament sit at the top
//   • Below that: a clipping View of fixed height that shows the
//     SAME measured VerseFlow text, shifted up by `offsetY` so this
//     page's slice of lines is the visible portion. Because the line
//     breaks for that range are identical to the off-screen
//     measurement (deterministic for the same content + width),
//     the visible slice is pixel-aligned with what the measurer saw.
//
// Why "render full text, clip a window" instead of "render only this
// page's verses"? Per-verse reflow would re-break the lines (because
// what a line wraps to depends on what came BEFORE it). Rendering
// the same continuous block in every page guarantees the measured
// page breaks land where we promised — at the same line boundaries.
// ─────────────────────────────────────────────────────────────────

function ReaderPageView({
  width,
  paddingX,
  paddingTop,
  paddingBottom,
  pageContentWidth,
  offsetY,
  contentHeight,
  isFirst,
  bookName,
  chapter,
  scale,
  verses,
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
  pageContentWidth: number;
  offsetY: number;
  contentHeight: number;
  isFirst: boolean;
  bookName: string;
  chapter: number;
  scale: number;
  verses: { number: number; text: string }[];
  bookId: string;
  onVersePress: (verse: number) => void;
  onVerseLongPress?: (verse: number) => void;
  selectedSet?: ReadonlySet<number>;
  focusVerse: number | null;
  focusTint: string;
  focusGlow: Animated.Value;
}) {
  return (
    <View
      style={{
        width,
        paddingHorizontal: paddingX,
        paddingTop,
        paddingBottom,
      }}
    >
      {isFirst ? <ChapterHeading bookName={bookName} chapter={chapter} scale={scale} /> : null}
      <View
        style={{
          width: pageContentWidth,
          // Clip box height = EXACT pixel span of this page's verse
          // slice. Using a constant (e.g. pageContentHeight) here
          // would leave unused tail room at the bottom of pages whose
          // last verse ended early — and that unused room would show
          // the first line of the next verse through the translated
          // VerseFlow underneath, duplicating it visibly on the next
          // page too. Sizing the clip to the slice height makes the
          // page end precisely where the last verse ends.
          height: contentHeight,
          overflow: "hidden",
        }}
      >
        <View style={{ transform: [{ translateY: -offsetY }] }}>
          <VerseFlow
            verses={verses}
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
      </View>
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
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{
        paddingHorizontal: paddingX,
        paddingTop: 18,
        paddingBottom: 220,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center pt-4 pb-6">
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[3px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          End of chapter
        </Text>
        <Text
          className="text-ink text-[20px] mt-2"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {book.name} {chapter}
        </Text>
        <ChapterOrnament />
      </View>

      <View className="items-center mt-2">
        {alreadyRead ? (
          <View className="flex-row items-center px-5 py-3 rounded-full border border-border bg-surface">
            <CheckIcon />
            <Text
              className="text-ink-muted text-[13px] ml-2"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              Marked as read
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onMarkRead}
            className="rounded-full px-5 py-3 border border-border-strong bg-surface flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text
              className="text-ink text-[13.5px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Mark as read
            </Text>
          </Pressable>
        )}
        <Text
          className="text-ink-subtle text-[11px] mt-2.5 text-center px-6"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {alreadyRead
            ? "Today counts toward your rhythm."
            : "We'll mark this for you as you finish — counts toward your streak."}
        </Text>
      </View>

      <Pressable
        onPress={onChangeTranslation}
        className="px-6 mt-7 items-center"
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

      <View className="mt-7 flex-row gap-3">
        <NavTile
          kind="prev"
          target={prev}
          onPress={prev ? () => onGoto(prev) : undefined}
        />
        <NavTile
          kind="next"
          target={next}
          onPress={next ? () => onGoto(next) : undefined}
        />
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Prev / Next nav tile
// ─────────────────────────────────────────────────────────────────

function NavTile({
  kind,
  target,
  onPress,
}: {
  kind: "prev" | "next";
  target: { bookId: string; chapter: number } | null;
  onPress?: () => void;
}) {
  if (!target || !onPress) {
    return <View style={{ flex: 1 }} />;
  }

  const book = findBookById(target.bookId);
  if (!book) return <View style={{ flex: 1 }} />;

  const label = `${book.name} ${target.chapter}`;
  const eyebrow = kind === "prev" ? "Previous" : "Next";

  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <View className="rounded-2xl border border-border bg-surface px-4 py-3.5">
        <View
          className="flex-row items-center"
          style={{
            flexDirection: kind === "prev" ? "row" : "row-reverse",
          }}
        >
          <Chevron direction={kind} />
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase ml-1.5 mr-1.5"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {eyebrow}
          </Text>
        </View>
        <Text
          className={`text-ink text-[14px] mt-1 ${kind === "next" ? "text-right" : ""}`}
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
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
  translationTag,
  onChangeTranslation,
  todayMinutes,
  goalMinutes,
  onOpenReadingGoal,
}: {
  onContents: () => void;
  textSizeId: TextSizeId;
  onChangeTextSize: (id: TextSizeId) => void;
  translationTag: string;
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
            translationTag={translationTag}
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
// Themes & settings popover — text size picker + translation pill
// ─────────────────────────────────────────────────────────────────

function ThemesPopover({
  textSizeId,
  onChangeTextSize,
  translationTag,
  onChangeTranslation,
}: {
  textSizeId: TextSizeId;
  onChangeTextSize: (id: TextSizeId) => void;
  translationTag: string;
  onChangeTranslation: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        width: 300,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Text Size
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            gap: 6,
          }}
        >
          {TEXT_SIZES.map((s) => (
            <TextSizeChip
              key={s.id}
              size={s}
              active={textSizeId === s.id}
              onPress={() => onChangeTextSize(s.id)}
            />
          ))}
        </View>
      </View>
      <View
        style={{ height: 0.5, backgroundColor: colors.border, marginHorizontal: 14 }}
      />
      <Pressable
        onPress={onChangeTranslation}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        })}
      >
        <Text
          className="text-ink text-[14px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Translation
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text
            className="text-ink-muted text-[10.5px] tracking-[1.5px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {translationTag}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function TextSizeChip({
  size,
  active,
  onPress,
}: {
  size: TextSize;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const fontSize = Math.round(11 + (size.scale - 0.88) * 10);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.6 : 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
        backgroundColor: active ? colors.accentSoft : "transparent",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize,
          color: colors.ink,
        }}
      >
        Aa
      </Text>
    </Pressable>
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
  const pct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const reached = todayMinutes >= goalMinutes;
  return (
    <View
      style={{
        width: 300,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Today
          </Text>
          <Text
            className="text-ink-subtle text-[11px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {formatGoalMinutes(todayMinutes)} / {goalMinutes} min
          </Text>
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: colors.border,
            borderRadius: 3,
            overflow: "hidden",
            marginTop: 10,
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
          className="text-ink-muted text-[12px] mt-2.5 leading-[18px]"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {reached
            ? "Today's reading goal reached."
            : "Keep reading — your minutes count automatically."}
        </Text>
      </View>
      <View
        style={{ height: 0.5, backgroundColor: colors.border, marginHorizontal: 14 }}
      />
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        })}
      >
        <Text
          className="text-ink text-[14px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
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

function CheckIcon() {
  const colors = useColors();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke={colors.ink}
        strokeWidth={2.2}
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
): ReaderPage[] {
  if (lines.length === 0) {
    return [
      {
        startLine: 0,
        endLine: -1,
        offsetY: 0,
        contentHeight: 0,
        isFirst: true,
      },
    ];
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
