import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  type AppStateStatus,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as haptics from "@/lib/haptics";
import { shareVerse, sharePassage } from "@/lib/share";
import { AppleSheet } from "@/components/AppleSheet";
import { SheetModalHeader } from "@/components/SheetModalHeader";
import { NoteEditor } from "@/components/NoteEditor";
import { VerseActionSheet } from "@/components/VerseActionSheet";
import { BookCover } from "@/components/BookCover";
import { SFSymbol } from "@/components/Symbol";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Host, Picker as ExpoUIPicker } from "@expo/ui/swift-ui";
import { findBookById } from "@/constants/books";
import {
  type Chapter,
  TranslationNotInstalledError,
  fetchChapter,
  getCachedChapter,
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
  TRANSLATIONS,
  type TextSizeId,
  type Translation,
  type TranslationId,
  usePreferences,
} from "@/state/preferences";
import { hasLocalBundle } from "@/lib/localBibles";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors, useResolvedScheme, useTheme } from "@/state/theme";
import { goBackOr } from "@/lib/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { NEW_YORK, SF_PRO, systemText, typography } from "@/lib/typography";

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
  | { kind: "endMatter"; key: string }
  /** Swipe target before page 1 — triggers previous chapter. */
  | { kind: "prevBridge"; key: string }
  /** Swipe target after the last verse page — triggers next chapter. */
  | { kind: "nextBridge"; key: string };

const readerPaginationCache = new Map<string, ReaderPage[]>();

function readerPaginationKey(
  bookId: string,
  chapter: number,
  translationId: string,
  textSizeId: string,
  pageContentWidth: number,
  pageContentHeight: number,
): string {
  return `${translationId}:${bookId}:${chapter}:${textSizeId}:${Math.round(pageContentWidth)}x${Math.round(pageContentHeight)}`;
}

type ReaderPaginationContext = {
  translationId: TranslationId;
  textSizeId: TextSizeId;
  pageContentWidth: number;
  pageContentHeight: number;
};

function getCachedChapterPageCount(
  bookId: string,
  chapterNum: number,
  ctx: ReaderPaginationContext,
): number | null {
  const cached = readerPaginationCache.get(
    readerPaginationKey(
      bookId,
      chapterNum,
      ctx.translationId,
      ctx.textSizeId,
      ctx.pageContentWidth,
      ctx.pageContentHeight,
    ),
  );
  return cached?.length ?? null;
}

function resolveChapterPageCounts(
  book: { id: string; chapters: number },
  currentChapter: number,
  currentChapterPageCount: number,
  currentVerseCount: number,
  ctx: ReaderPaginationContext,
  translationId: TranslationId,
): number[] {
  const counts: number[] = [];

  for (let c = 1; c <= book.chapters; c++) {
    const count =
      c === currentChapter
        ? currentChapterPageCount
        : getCachedChapterPageCount(book.id, c, ctx);
    counts.push(count ?? 0);
  }

  const pagesPerVerse =
    currentVerseCount > 0 && currentChapterPageCount > 0
      ? currentChapterPageCount / currentVerseCount
      : null;

  for (let i = 0; i < counts.length; i++) {
    const c = i + 1;
    if (counts[i] > 0) continue;
    const chData = getCachedChapter(book.id, c, translationId);
    if (chData && pagesPerVerse) {
      counts[i] = Math.max(
        1,
        Math.round(chData.verses.length * pagesPerVerse),
      );
    }
  }

  const known = counts.filter((n) => n > 0);
  const avg =
    known.length > 0
      ? known.reduce((sum, n) => sum + n, 0) / known.length
      : Math.max(1, currentChapterPageCount);

  return counts.map((n) => (n > 0 ? n : Math.max(1, Math.round(avg))));
}

function computeBookPagination(
  book: { id: string; chapters: number },
  currentChapter: number,
  chapterPageOneBased: number,
  currentChapterPageCount: number,
  currentVerseCount: number,
  ctx: ReaderPaginationContext,
  translationId: TranslationId,
) {
  const chapterCounts = resolveChapterPageCounts(
    book,
    currentChapter,
    currentChapterPageCount,
    currentVerseCount,
    ctx,
    translationId,
  );

  let pagesBefore = 0;
  for (let c = 1; c < currentChapter; c++) {
    pagesBefore += chapterCounts[c - 1] ?? 1;
  }

  const bookPage = pagesBefore + chapterPageOneBased;
  const bookTotalPages = chapterCounts.reduce((sum, n) => sum + n, 0);
  const bookPagesLeft = Math.max(0, bookTotalPages - bookPage);
  const bookProgress =
    bookTotalPages > 1 ? (bookPage - 1) / (bookTotalPages - 1) : 1;

  return { bookPage, bookTotalPages, bookProgress, bookPagesLeft };
}

function buildReaderItems(
  pages: ReaderPage[],
  hasPrevChapter: boolean,
  hasNextChapter: boolean,
): ReaderListItem[] {
  const items: ReaderListItem[] = [];
  if (hasPrevChapter) {
    items.push({ kind: "prevBridge", key: "prev-bridge" });
  }
  for (const [idx, p] of pages.entries()) {
    items.push({ kind: "page", key: `page-${idx}`, page: p });
  }
  if (hasNextChapter) {
    items.push({ kind: "nextBridge", key: "next-bridge" });
  } else {
    items.push({ kind: "endMatter", key: "end" });
  }
  return items;
}

function landingPageIdx(
  pageCount: number,
  bookId: string,
  chapterNum: number,
  landOnLast: boolean,
): number {
  const chapterPrev = getAdjacent(bookId, chapterNum, "prev");
  const lastVerseIdx = chapterPrev
    ? pageCount
    : Math.max(0, pageCount - 1);
  return landOnLast ? lastVerseIdx : chapterPrev ? 1 : 0;
}

function linesToReaderPages(
  lines: ReadonlyArray<TextLayoutLine>,
  verses: Chapter["verses"],
  pageContentHeight: number,
  firstPageHeadingHeight: number,
): ReaderPage[] {
  const map = new Map<number, number>();
  const maxVerseNum = verses[verses.length - 1]?.number ?? 0;
  let nextExpected = verses[0]?.number ?? 1;
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
  const verseStartLines = Array.from(map.values()).sort((a, b) => a - b);
  return paginateLines(
    lines,
    pageContentHeight,
    firstPageHeadingHeight,
    verseStartLines,
    verses.length,
  );
}

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
 *   • Swiping past the last page advances to the next chapter
 *     within the same book; swiping before page 1 retreats to
 *     the previous chapter's last page
 *   • Within-book chapter swaps use setParams + a frozen overlay
 *     so the pager doesn't flash between chapters
 */
export default function ChapterReaderScreen() {
  const {
    id,
    chapter: chapterParam,
    focus: focusParam,
    tint: tintParam,
    chrome: chromeParam,
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
    /**
     * Dev-only: open a reader chrome sheet on mount (`version` |
     * `textsize`) so we can screenshot system surfaces.
     */
    chrome?: string;
  }>();
  const router = useRouter();
  const colors = useColors();

  const routeBookId = id ?? "";
  const routeChapter = parseInt(chapterParam ?? "", 10);
  const [readerBookId, setReaderBookId] = useState(routeBookId);
  const [readerChapter, setReaderChapter] = useState(
    Number.isFinite(routeChapter) ? routeChapter : 1,
  );
  const internalNavRef = useRef(false);
  const readerTargetRef = useRef({
    bookId: routeBookId,
    chapter: Number.isFinite(routeChapter) ? routeChapter : 1,
  });
  const pendingLandOnLastPageRef = useRef(false);
  /** Chapter key we already positioned the pager for (book:chapter). */
  const placedPageForChapterRef = useRef<string | null>(null);
  /** Pagination cache key used for the current placement. */
  const placedPaginationKeyRef = useRef<string | null>(null);
  const [viewportBookId, setViewportBookId] = useState(routeBookId);
  const [viewportChapter, setViewportChapter] = useState(
    Number.isFinite(routeChapter) ? routeChapter : 1,
  );
  const [pagerMountKey, setPagerMountKey] = useState("");
  const [measureTarget, setMeasureTarget] = useState<{
    bookId: string;
    chapter: number;
    data: Chapter;
    landOnLast: boolean;
  } | null>(null);

  const book = findBookById(readerBookId);
  const chapter = readerChapter;

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
  const { translation, textSize, setTextSize, setTranslation } = usePreferences();
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

  useEffect(() => {
    readerTargetRef.current = {
      bookId: readerBookId,
      chapter: readerChapter,
    };
  }, [readerBookId, readerChapter]);

  const translationChangedRef = useRef(false);
  // Must run in useLayoutEffect BEFORE the chapter-load layout effect
  // so we never paint a frame that thinks the old placement is still
  // valid for a new translation (that race left a blank reader).
  useLayoutEffect(() => {
    if (!translationChangedRef.current) {
      translationChangedRef.current = true;
      return;
    }
    // Keep prior chapter text until the new translation measures —
    // wiping `data` blanked the reader and left the toolbar feeling
    // dead under TrueSheet's dismiss dim.
    setPages(null);
    setMeasureTarget(null);
    placedPageForChapterRef.current = null;
    placedPaginationKeyRef.current = null;
    setReloadKey((k) => k + 1);
  }, [translation.id]);

  // Keep in-reader chapter swaps on this screen instance — updating
  // params instead of replace avoids a navigation flash. External
  // entry (overview tap, deep link) still syncs from the route.
  //
  // Critical: on first mount readerBookId/chapter already match the
  // route. Wiping measureTarget here used to cancel the layout-effect
  // measure pass after book-overview prefetch — leaving "Drawing near"
  // forever. Only reset when the route actually points somewhere else.
  useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }
    const nextChapter = Number.isFinite(routeChapter) ? routeChapter : 1;
    if (
      readerBookId === routeBookId &&
      readerChapter === nextChapter
    ) {
      return;
    }
    setReaderBookId(routeBookId);
    setReaderChapter(nextChapter);
    setViewportBookId(routeBookId);
    setViewportChapter(nextChapter);
    pendingLandOnLastPageRef.current = false;
    placedPageForChapterRef.current = null;
    placedPaginationKeyRef.current = null;
    pageIdxAtDragStartRef.current = 0;
    setCurrentPageIdx(0);
    setData(null);
    setPages(null);
    setMeasureTarget(null);
    setPagerMountKey("");
  }, [routeBookId, routeChapter, readerBookId, readerChapter]);

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

  useFocusEffect(
    useCallback(() => {
      return () => {
        setEditingNote(null);
        setActiveVerse(null);
      };
    }, []),
  );

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
    // Funneled through lib/share for consistent "via Closer"
    // attribution + Mail subject + future Universal Link slot.
    await sharePassage({
      text: lines.join(" "),
      reference: range,
      translation: translation.tag,
    });
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
  const viewportBook = findBookById(viewportBookId) ?? book;
  const viewportPrev = getAdjacent(viewportBookId, viewportChapter, "prev");
  const viewportNext = getAdjacent(viewportBookId, viewportChapter, "next");
  const headerTitle = `${book.name} ${chapter}`;

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
    await shareVerse({
      text: activeVerseData.text,
      reference: ref,
      translation: translation.name,
    });
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
  const insets = useSafeAreaInsets();
  // Reading margin. 16pt hugged the screen edge; 24pt gives the text
  // column the comfortable gutter Apple Books / the iOS readable-content
  // guide use so lines don't run into the bezel.
  const PAGE_PAD_X = spacing[24];
  const PAGE_PAD_Y_TOP = spacing[16];
  const PAGE_PAD_Y_BOTTOM = spacing[8];
  // Width of the actual text column on each page (inside the clipping
  // View). Used both for the off-screen measurer and the visible pages.
  const pageContentWidth = screenWidth - PAGE_PAD_X * 2;
  // Vertical budget for a full page of verse text — derived from the
  // device's REAL safe-area insets (not magic numbers) so the last
  // line always keeps the same comfortable breathing gap above the
  // floating toolbar on every screen size. Layout stack, top→bottom:
  //   insets.top                 device safe-area top
  //   READER_HEADER_HEIGHT       custom chevron + progress header
  //   PAGE_PAD_Y_TOP             page top padding
  //   ── verse text (budget) ──
  //   READER_TEXT_TOOLBAR_GAP    breathing room ↓
  //   toolbar zone               bottom inset + pill height
  //   insets.bottom              device safe-area bottom
  const pagerHeight =
    screenHeight - insets.top - insets.bottom - READER_HEADER_HEIGHT;
  const toolbarZone = READER_TOOLBAR_BOTTOM_INSET + READER_PILL_HEIGHT;
  const pageContentHeight = Math.max(
    280,
    pagerHeight - PAGE_PAD_Y_TOP - toolbarZone - READER_TEXT_TOOLBAR_GAP,
  );
  // Chapter heading + ornament on page 1 only (~ label + title + rule).
  const FIRST_PAGE_HEADING_HEIGHT = 96 * Math.sqrt(textSize.scale);

  const [pages, setPages] = useState<ReaderPage[] | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [paginationRevision, setPaginationRevision] = useState(0);
  const bumpPaginationRevision = useCallback(() => {
    setPaginationRevision((n) => n + 1);
  }, []);

  // Verse → line-index map. Built during the measurement pass so the
  // focus-verse deep-link can jump to the right PAGE (not just scroll
  // to a Y the user can't see in a paginated view).
  const verseToLineRef = useRef<Map<number, number>>(new Map());
  const advanceLockRef = useRef(false);
  const pageIdxAtDragStartRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const tryCommitTargetChapter = useCallback(
    (
      targetBookId: string,
      targetChapter: number,
      landOnLast: boolean,
    ): boolean => {
      const pKey = readerPaginationKey(
        targetBookId,
        targetChapter,
        translation.id,
        textSize.id,
        pageContentWidth,
        pageContentHeight,
      );
      const cached = getCachedChapter(
        targetBookId,
        targetChapter,
        translation.id,
      );
      const cachedPages = readerPaginationCache.get(pKey);
      if (!cached || !cachedPages?.length) return false;

      const landIdx = landingPageIdx(
        cachedPages.length,
        targetBookId,
        targetChapter,
        landOnLast,
      );
      setData(cached);
      setPages(cachedPages);
      setViewportBookId(targetBookId);
      setViewportChapter(targetChapter);
      setCurrentPageIdx(landIdx);
      setPagerMountKey(`${targetBookId}-${targetChapter}-${textSize.id}`);
      placedPageForChapterRef.current = `${targetBookId}:${targetChapter}`;
      placedPaginationKeyRef.current = pKey;
      pageIdxAtDragStartRef.current = landIdx;
      pendingLandOnLastPageRef.current = false;
      advanceLockRef.current = false;
      setMeasureTarget(null);
      setError(null);
      return true;
    },
    [
      translation.id,
      textSize.id,
      pageContentWidth,
      pageContentHeight,
    ],
  );

  const queueMeasureTarget = useCallback(
    (
      targetBookId: string,
      targetChapter: number,
      chapterData: Chapter,
      landOnLast: boolean,
    ) => {
      setMeasureTarget({
        bookId: targetBookId,
        chapter: targetChapter,
        data: chapterData,
        landOnLast,
      });
    },
    [],
  );

  const goto = (
    target: { bookId: string; chapter: number },
    opts?: { lastPage?: boolean },
  ) => {
    const landOnLast = opts?.lastPage === true;
    pendingLandOnLastPageRef.current = landOnLast;

    internalNavRef.current = true;
    setReaderBookId(target.bookId);
    setReaderChapter(target.chapter);

    if (target.bookId !== readerBookId) {
      router.replace(`/book/${target.bookId}/${target.chapter}`);
    } else {
      router.setParams({ chapter: String(target.chapter) });
    }

    if (
      !tryCommitTargetChapter(target.bookId, target.chapter, landOnLast)
    ) {
      const cached = getCachedChapter(
        target.bookId,
        target.chapter,
        translation.id,
      );
      if (cached) {
        queueMeasureTarget(
          target.bookId,
          target.chapter,
          cached,
          landOnLast,
        );
      }
    }
  };

  const advanceToNextChapter = () => {
    if (!viewportNext || advanceLockRef.current) return;
    advanceLockRef.current = true;
    prefetchChapter(viewportNext.bookId, viewportNext.chapter, translation.id);
    const leavingRead =
      hasReadChapter(viewportBookId, viewportChapter) || justMarked;
    if (!leavingRead) {
      recordChapterRead(viewportBookId, viewportChapter);
      setJustMarked(true);
      haptics.success();
    } else {
      haptics.tap();
    }
    goto(viewportNext);
  };

  const retreatToPreviousChapter = () => {
    if (!viewportPrev || advanceLockRef.current) return;
    advanceLockRef.current = true;
    haptics.tap();
    prefetchChapter(viewportPrev.bookId, viewportPrev.chapter, translation.id);
    goto(viewportPrev, { lastPage: true });
  };

  const handlePageSettled = (pageIdx: number) => {
    if (advanceLockRef.current) return;
    if (!pages) return;
    const chapterPrev = getAdjacent(viewportBookId, viewportChapter, "prev");
    const firstVerseIdx = chapterPrev ? 1 : 0;
    const nextBridgeIdx = firstVerseIdx + pages.length;

    if (chapterPrev && pageIdx === 0) {
      retreatToPreviousChapter();
      return;
    }
    if (viewportNext && pageIdx >= nextBridgeIdx) {
      advanceToNextChapter();
      return;
    }
    setCurrentPageIdx(pageIdx);
  };

  const handleMeasureReady = useCallback(
    (
      targetBookId: string,
      targetChapter: number,
      chapterData: Chapter,
      computed: ReaderPage[],
      landOnLast: boolean,
    ) => {
      const target = readerTargetRef.current;
      if (
        target.bookId !== targetBookId ||
        target.chapter !== targetChapter
      ) {
        // Stale measure — clear so a newer target can take over.
        setMeasureTarget((cur) =>
          cur &&
          cur.bookId === targetBookId &&
          cur.chapter === targetChapter
            ? null
            : cur,
        );
        return;
      }

      const landIdx = landingPageIdx(
        computed.length,
        targetBookId,
        targetChapter,
        landOnLast,
      );
      setData(chapterData);
      setPages(computed);
      setViewportBookId(targetBookId);
      setViewportChapter(targetChapter);
      setCurrentPageIdx(landIdx);
      setPagerMountKey(`${targetBookId}-${targetChapter}-${textSize.id}`);
      placedPageForChapterRef.current = `${targetBookId}:${targetChapter}`;
      placedPaginationKeyRef.current = readerPaginationKey(
        targetBookId,
        targetChapter,
        translation.id,
        textSize.id,
        pageContentWidth,
        pageContentHeight,
      );
      pageIdxAtDragStartRef.current = landIdx;
      pendingLandOnLastPageRef.current = false;
      advanceLockRef.current = false;
      setMeasureTarget(null);
      setError(null);
      bumpPaginationRevision();
    },
    [textSize.id, pageContentWidth, pageContentHeight, translation.id, bumpPaginationRevision],
  );

  /**
   * Capture the off-screen line measurement and recompute pages.
   * Stable identity (no deps on state.pages) so we can call it from
   * VerseFlow's onMeasureLines without thrashing.
   */
  const handleMeasureLines = useCallback(
    (lines: ReadonlyArray<TextLayoutLine>) => {
      if (!lines || lines.length === 0 || !data) return;
      if (book.id !== readerBookId || chapter !== readerChapter) return;

      const map = new Map<number, number>();
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
      verseToLineRef.current = map;

      const computed = linesToReaderPages(
        lines,
        data.verses,
        pageContentHeight,
        FIRST_PAGE_HEADING_HEIGHT,
      );

      readerPaginationCache.set(
        readerPaginationKey(
          book.id,
          chapter,
          translation.id,
          textSize.id,
          pageContentWidth,
          pageContentHeight,
        ),
        computed,
      );

      const chapterKey = `${readerBookId}:${readerChapter}`;
      const skipPageUpdate =
        placedPageForChapterRef.current === chapterKey &&
        !pendingLandOnLastPageRef.current;

      if (!skipPageUpdate) {
        const needsPlacement =
          pendingLandOnLastPageRef.current ||
          placedPageForChapterRef.current !== chapterKey;

        if (needsPlacement) {
          const landIdx = landingPageIdx(
            computed.length,
            readerBookId,
            readerChapter,
            pendingLandOnLastPageRef.current,
          );
          setCurrentPageIdx(landIdx);
          pageIdxAtDragStartRef.current = landIdx;
          pendingLandOnLastPageRef.current = false;
          placedPageForChapterRef.current = chapterKey;
          placedPaginationKeyRef.current = readerPaginationKey(
            readerBookId,
            readerChapter,
            translation.id,
            textSize.id,
            pageContentWidth,
            pageContentHeight,
          );
        }

        setPages(computed);
        bumpPaginationRevision();
      }

      advanceLockRef.current = false;
    },
    [
      data,
      book.id,
      chapter,
      readerBookId,
      readerChapter,
      translation.id,
      textSize.id,
      pageContentWidth,
      pageContentHeight,
      FIRST_PAGE_HEADING_HEIGHT,
      bumpPaginationRevision,
    ],
  );

  const paginationCtx = useMemo(
    () => ({
      translationId: translation.id,
      textSizeId: textSize.id,
      pageContentWidth,
      pageContentHeight,
    }),
    [translation.id, textSize.id, pageContentWidth, pageContentHeight],
  );

  // Load chapter text + pagination whenever the reader target changes.
  // useLayoutEffect so cached chapter swaps land before paint.
  useLayoutEffect(() => {
    if (!book || !Number.isFinite(chapter)) return;
    let cancelled = false;

    const targetBookId = readerBookId;
    const targetChapter = readerChapter;
    const pKey = readerPaginationKey(
      targetBookId,
      targetChapter,
      translation.id,
      textSize.id,
      pageContentWidth,
      pageContentHeight,
    );
    const targetKey = `${targetBookId}:${targetChapter}`;
    const alreadyPlaced =
      placedPageForChapterRef.current === targetKey &&
      placedPaginationKeyRef.current === pKey;

    setJustMarked(false);
    setError(null);

    if (!alreadyPlaced) {
      const landOnLast = pendingLandOnLastPageRef.current;

      if (tryCommitTargetChapter(targetBookId, targetChapter, landOnLast)) {
        const prevAdj = getAdjacent(targetBookId, targetChapter, "prev");
        const nextAdj = getAdjacent(targetBookId, targetChapter, "next");
        if (prevAdj) {
          prefetchChapter(prevAdj.bookId, prevAdj.chapter, translation.id);
        }
        if (nextAdj) {
          prefetchChapter(nextAdj.bookId, nextAdj.chapter, translation.id);
        }
        return;
      }

      const cached = getCachedChapter(
        targetBookId,
        targetChapter,
        translation.id,
      );
      if (cached) {
        queueMeasureTarget(targetBookId, targetChapter, cached, landOnLast);
      } else if (!data) {
        setData(null);
        setPages(null);
        fetchChapter(targetBookId, targetChapter, translation.id)
          .then((c) => {
            if (cancelled) return;
            const target = readerTargetRef.current;
            if (
              target.bookId !== targetBookId ||
              target.chapter !== targetChapter
            ) {
              return;
            }
            queueMeasureTarget(
              targetBookId,
              targetChapter,
              c,
              pendingLandOnLastPageRef.current,
            );
          })
          .catch((e: Error) => {
            if (!cancelled) setError(e);
          });
      } else {
        fetchChapter(targetBookId, targetChapter, translation.id)
          .then((c) => {
            if (cancelled) return;
            const target = readerTargetRef.current;
            if (
              target.bookId !== targetBookId ||
              target.chapter !== targetChapter
            ) {
              return;
            }
            queueMeasureTarget(
              targetBookId,
              targetChapter,
              c,
              pendingLandOnLastPageRef.current,
            );
          })
          .catch((e: Error) => {
            if (!cancelled) setError(e);
          });
      }
    }

    const prevAdj = getAdjacent(targetBookId, targetChapter, "prev");
    const nextAdj = getAdjacent(targetBookId, targetChapter, "next");
    if (prevAdj) {
      prefetchChapter(prevAdj.bookId, prevAdj.chapter, translation.id);
    }
    if (nextAdj) {
      prefetchChapter(nextAdj.bookId, nextAdj.chapter, translation.id);
    }

    return () => {
      cancelled = true;
    };
  }, [
    book,
    chapter,
    readerBookId,
    readerChapter,
    translation.id,
    textSize.id,
    pageContentWidth,
    pageContentHeight,
    reloadKey,
    tryCommitTargetChapter,
    queueMeasureTarget,
  ]);

  // Derived presentation: verse pages only when a next chapter exists
  // (swiping past the last page advances directly). End-matter card is
  // appended only at the canonical end of a book / the Bible.
  const versePageCount = pages?.length ?? 0;
  const hasEndMatter = !viewportNext;
  const totalPages = Math.max(
    1,
    versePageCount + (data && hasEndMatter ? 1 : 0),
  );
  const firstVerseListIdx = viewportPrev ? 1 : 0;
  const versePageIdx =
    pages && pages.length > 0
      ? Math.max(
          0,
          Math.min(pages.length - 1, currentPageIdx - firstVerseListIdx),
        )
      : 0;
  const currentPage = Math.min(totalPages, versePageIdx + 1);
  const pagesLeft = Math.max(0, totalPages - currentPage);

  const bookPagination = useMemo(() => {
    if (!pages?.length) return null;
    return computeBookPagination(
      book,
      chapter,
      currentPage,
      versePageCount,
      data?.verses.length ?? 0,
      paginationCtx,
      translation.id,
    );
  }, [
    book,
    chapter,
    currentPage,
    versePageCount,
    data?.verses.length,
    pages,
    paginationCtx,
    translation.id,
    paginationRevision,
  ]);

  // Chapter-scoped progress — still drives auto-mark-as-read.
  const pageProgress =
    totalPages > 1 ? versePageIdx / (totalPages - 1) : 1;
  const headerProgress = bookPagination?.bookProgress ?? pageProgress;
  const headerPagesLeft = bookPagination?.bookPagesLeft ?? pagesLeft;

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

  // Mark the chapter read the moment the user reaches its final page
  // so the book overview grid can light up without waiting for the
  // 30s dwell timer above.
  useEffect(() => {
    if (!data || !pages || pages.length === 0) return;
    if (alreadyRead) return;
    if (versePageIdx < pages.length - 1) return;
    recordChapterRead(book.id, chapter);
    setJustMarked(true);
  }, [
    data,
    pages,
    currentPageIdx,
    versePageIdx,
    alreadyRead,
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
    const versePageIdx = pages.findIndex(
      (p) => verseLine >= p.startLine && verseLine <= p.endLine,
    );
    if (versePageIdx < 0) return;
    const listIdx = versePageIdx + (viewportPrev ? 1 : 0);

    // De-dupe by route + verse so reloads / translation swaps inside
    // the same focus session don't replay the animation.
    const token = `${book.id}/${chapter}#${focusVerse}`;
    if (focusDoneRef.current === token) return;
    focusDoneRef.current = token;

    setTimeout(() => {
      pagerRef.current?.scrollToIndex({ index: listIdx, animated: true });
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
  }, [focusVerse, data, pages, focusGlow, viewportBookId, viewportChapter, viewportPrev]);

  // Clear the dedupe token when the user navigates to a different
  // chapter so a later check-in to the same verse re-plays the glow.
  useEffect(() => {
    focusDoneRef.current = null;
    setVerseAnchors({});
  }, [book.id, chapter]);

  // Compose the renderable list: verse pages, then either a swipe
  // bridge into the next chapter (when one exists) or the end-matter
  // card at the canonical end of a book.
  const readerItems: ReaderListItem[] = useMemo(() => {
    if (!data || !pages) return [];
    return buildReaderItems(pages, !!viewportPrev, !!viewportNext);
  }, [data, pages, viewportPrev, viewportNext]);

  const pagerReady = !!data && !!pages;

  const handleChapterEdgeScroll = (x: number) => {
    if (advanceLockRef.current || !pages) return;
    const chapterPrev = getAdjacent(viewportBookId, viewportChapter, "prev");
    const firstVerseIdx = chapterPrev ? 1 : 0;
    const lastVerseIdx = firstVerseIdx + pages.length - 1;
    const progress = x / screenWidth;

    if (viewportNext && progress > lastVerseIdx + 0.04) {
      advanceToNextChapter();
      return;
    }
    if (viewportPrev && chapterPrev && progress < firstVerseIdx - 0.04) {
      retreatToPreviousChapter();
    }
  };

  // Only re-seat the pager when the chapter (or mount key) changes —
  // NOT on every currentPageIdx update from a user swipe. Syncing
  // scroll position after every settle was fighting native paging
  // momentum and felt like ~15fps.
  useLayoutEffect(() => {
    if (!pagerReady || readerItems.length === 0) return;
    const safeIdx = Math.min(currentPageIdx, readerItems.length - 1);
    pagerRef.current?.scrollToIndex({
      index: safeIdx,
      animated: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: chapter/mount only
  }, [pagerReady, pagerMountKey, viewportBookId, viewportChapter, readerItems.length]);

  // Chapter page counts for the Contents sheet (cached where known,
  // estimated from verse density otherwise). Always return ≥1 so the
  // trailing column never renders an empty "—".
  const contentsPageCounts = useMemo(
    () =>
      resolveChapterPageCounts(
        book,
        chapter,
        versePageCount,
        data?.verses.length ?? 0,
        paginationCtx,
        translation.id,
      ),
    [
      book,
      chapter,
      versePageCount,
      data?.verses.length,
      paginationCtx,
      translation.id,
      paginationRevision,
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Header
          bookId={book.id}
          pagesLeftLabel={
            data && pages ? pagesLeftLabel(headerPagesLeft, true) : ""
          }
          progress={headerProgress}
        />

        <View style={{ flex: 1 }}>
        {/* ─── Off-screen measurement view ─────────────────────────
            Renders the full chapter once at the page width so we can
            grab onTextLayout's `lines` array and compute page breaks.
            Positioned far off-screen + opacity:0 so it's never seen
            by the user but still participates in layout. */}
        {data && !measureTarget && (
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
              bookId={viewportBookId}
              chapter={viewportChapter}
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

        {measureTarget ? (
          <PendingChapterMeasurer
            target={measureTarget}
            cacheKey={readerPaginationKey(
              measureTarget.bookId,
              measureTarget.chapter,
              translation.id,
              textSize.id,
              pageContentWidth,
              pageContentHeight,
            )}
            pageContentWidth={pageContentWidth}
            pageContentHeight={pageContentHeight}
            firstPageHeadingHeight={FIRST_PAGE_HEADING_HEIGHT}
            scale={textSize.scale}
            onReady={handleMeasureReady}
          />
        ) : null}

        {/* Pre-measure adjacent chapters so retreat/advance can swap
            from cache without a visible reload flash. */}
        {prev &&
          getCachedChapter(prev.bookId, prev.chapter, translation.id) && (
            <AdjacentChapterMeasurer
              bookId={prev.bookId}
              chapter={prev.chapter}
              verses={
                getCachedChapter(prev.bookId, prev.chapter, translation.id)!
                  .verses
              }
              cacheKey={readerPaginationKey(
                prev.bookId,
                prev.chapter,
                translation.id,
                textSize.id,
                pageContentWidth,
                pageContentHeight,
              )}
              pageContentWidth={pageContentWidth}
              pageContentHeight={pageContentHeight}
              firstPageHeadingHeight={FIRST_PAGE_HEADING_HEIGHT}
              scale={textSize.scale}
              onMeasured={bumpPaginationRevision}
            />
          )}
        {next &&
          getCachedChapter(next.bookId, next.chapter, translation.id) && (
            <AdjacentChapterMeasurer
              bookId={next.bookId}
              chapter={next.chapter}
              verses={
                getCachedChapter(next.bookId, next.chapter, translation.id)!
                  .verses
              }
              cacheKey={readerPaginationKey(
                next.bookId,
                next.chapter,
                translation.id,
                textSize.id,
                pageContentWidth,
                pageContentHeight,
              )}
              pageContentWidth={pageContentWidth}
              pageContentHeight={pageContentHeight}
              firstPageHeadingHeight={FIRST_PAGE_HEADING_HEIGHT}
              scale={textSize.scale}
              onMeasured={bumpPaginationRevision}
            />
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
        ) : !(data && pages) ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingView />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
          <FlatList
            ref={pagerRef}
            key={
              pagerMountKey ||
              `${viewportBookId}-${viewportChapter}-${textSize.id}`
            }
            data={readerItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentPageIdx}
            keyExtractor={(item) => item.key}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            scrollEventThrottle={32}
            decelerationRate="fast"
            disableIntervalMomentum
            removeClippedSubviews={false}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                pagerRef.current?.scrollToIndex({
                  index: Math.min(info.index, readerItems.length - 1),
                  animated: false,
                });
              });
            }}
            onScrollBeginDrag={(e) => {
              if (advanceLockRef.current) return;
              const x = e.nativeEvent.contentOffset.x;
              pageIdxAtDragStartRef.current = Math.round(x / screenWidth);
              dragStartOffsetRef.current = x;
            }}
            onMomentumScrollEnd={(e) => {
              if (advanceLockRef.current) return;
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / screenWidth);
              handlePageSettled(idx);
            }}
            initialNumToRender={3}
            maxToRenderPerBatch={4}
            windowSize={7}
            renderItem={({ item }) => {
              if (item.kind === "prevBridge" || item.kind === "nextBridge") {
                return <View style={{ width: screenWidth, flex: 1 }} />;
              }
              if (item.kind === "endMatter") {
                return (
                  <EndMatterPage
                    width={screenWidth}
                    paddingX={PAGE_PAD_X}
                    book={viewportBook}
                    chapter={viewportChapter}
                    alreadyRead={
                      hasReadChapter(viewportBookId, viewportChapter) ||
                      justMarked
                    }
                    onMarkRead={() => {
                      recordChapterRead(viewportBookId, viewportChapter);
                      setJustMarked(true);
                    }}
                    translationName={data.translation}
                    translationNote={data.translationNote}
                    onChangeTranslation={() =>
                      router.push("/settings/translation")
                    }
                    prev={viewportPrev}
                    next={viewportNext}
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
                  bookName={viewportBook.name}
                  chapter={viewportChapter}
                  scale={textSize.scale}
                  verses={data.verses}
                  startVerseIdx={item.page.startVerseIdx}
                  endVerseIdx={item.page.endVerseIdx}
                  bookId={viewportBookId}
                  onVersePress={(n) => {
                    // While the user is in multi-select mode, a tap
                    // toggles membership instead of opening the
                    // single-verse action sheet. This keeps the two
                    // gestures (long-press to start, tap to add/
                    // remove) feeling like one continuous flow.
                    if (selectionMode) {
                      // Tick — discrete selection event. Same
                      // grammar as iOS Mail/Notes when toggling
                      // a row's checkmark in edit mode.
                      haptics.tick();
                      toggleVerseSelection(n);
                    } else {
                      // Soft — confirms the action sheet is
                      // committing to open. Sheet appears
                      // immediately after this fires so the
                      // haptic + visual lift land together.
                      haptics.soft();
                      setActiveVerse(n);
                    }
                  }}
                  onVerseLongPress={(n) => {
                    // Long-press is a deliberate "I want more
                    // than a tap can give me" gesture, so it
                    // deserves a heavier confirmation than the
                    // tap path above. `soft` keeps it lighter
                    // than tap() (which is reserved for primary
                    // CTAs); the user feels it as "selection
                    // mode is now armed".
                    haptics.soft();
                    toggleVerseSelection(n);
                  }}
                  selectedSet={selectedVersesSet}
                  focusVerse={focusVerse}
                  focusTint={focusTint}
                  focusGlow={focusGlow}
                />
              );
            }}
          />
          </View>
        )}

        {/* ─── Bottom toolbar OR selection bar ─────────────────── */}
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
            onChangeTranslation={setTranslation}
            initialSheet={
              __DEV__ &&
              (chromeParam === "version" || chromeParam === "textsize")
                ? chromeParam
                : undefined
            }
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
        chapterPageCounts={contentsPageCounts}
        hasReadChapter={hasReadChapter}
        onSelect={(c) => {
          setContentsOpen(false);
          if (c !== chapter) {
            goto({ bookId: book.id, chapter: c });
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
/**
 * Poetry keeps single `\n` stanza breaks. OEB (and others) often insert
 * blank-line runs around block quotes — at 30pt line-height that reads
 * as a hole in the page. Collapse runs to one break.
 */
function normalizeVerseBody(text: string): string {
  return text.replace(/\n{2,}/g, "\n");
}

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
        fontFamily: NEW_YORK,
        fontWeight: "400",
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
                fontFamily: "System",
                fontWeight: "700",
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
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: verseNumSize * 0.95,
                  color: NOTE_MARKER_COLOR,
                }}
              >
                {" "}●{v.noteCount > 1 ? v.noteCount : ""}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: verseNumSize,
              }}
            >
              {"  "}
            </Text>
            <Text
              style={{
                fontFamily: NEW_YORK,
                fontWeight: "400",
                fontSize: baseFontSize,
                lineHeight: baseLineHeight,
                letterSpacing: -0.1,
              }}
            >
              {normalizeVerseBody(v.text)}
            </Text>
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
                style={{
                  fontFamily: NEW_YORK,
                  fontWeight: "400",
                  fontSize: baseFontSize,
                  lineHeight: baseLineHeight,
                  letterSpacing: -0.1,
                  color: colors.ink,
                  backgroundColor: focusBg,
                }}
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
                  fontFamily: NEW_YORK,
                  fontWeight: "400",
                  fontSize: baseFontSize,
                  lineHeight: baseLineHeight,
                  letterSpacing: -0.1,
                  color: colors.ink,
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

function PendingChapterMeasurer({
  target,
  cacheKey,
  pageContentWidth,
  pageContentHeight,
  firstPageHeadingHeight,
  scale,
  onReady,
}: {
  target: {
    bookId: string;
    chapter: number;
    data: Chapter;
    landOnLast: boolean;
  };
  cacheKey: string;
  pageContentWidth: number;
  pageContentHeight: number;
  firstPageHeadingHeight: number;
  scale: number;
  onReady: (
    bookId: string,
    chapter: number,
    data: Chapter,
    pages: ReaderPage[],
    landOnLast: boolean,
  ) => void;
}) {
  const noopGlow = useRef(new Animated.Value(0)).current;
  const committedRef = useRef(false);

  const finish = useCallback(
    (computed: ReaderPage[]) => {
      if (committedRef.current || computed.length === 0) return;
      committedRef.current = true;
      readerPaginationCache.set(cacheKey, computed);
      onReady(
        target.bookId,
        target.chapter,
        target.data,
        computed,
        target.landOnLast,
      );
    },
    [cacheKey, onReady, target],
  );

  const handleMeasure = useCallback(
    (lines: ReadonlyArray<TextLayoutLine>) => {
      if (!lines.length) return;
      const cached = readerPaginationCache.get(cacheKey);
      if (cached?.length) {
        finish(cached);
        return;
      }
      const computed = linesToReaderPages(
        lines,
        target.data.verses,
        pageContentHeight,
        firstPageHeadingHeight,
      );
      finish(computed);
    },
    [
      cacheKey,
      finish,
      firstPageHeadingHeight,
      pageContentHeight,
      target.data.verses,
    ],
  );

  useEffect(() => {
    const cached = readerPaginationCache.get(cacheKey);
    if (cached?.length) {
      finish(cached);
    }
  }, [cacheKey, finish]);

  // New Architecture / off-screen Text can skip onTextLayout forever.
  // Fall back to a single full-chapter page so we never spin on
  // "Drawing near" indefinitely.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (committedRef.current) return;
      const verseCount = target.data.verses.length;
      finish([
        {
          startLine: 0,
          endLine: 0,
          offsetY: 0,
          contentHeight: pageContentHeight,
          startVerseIdx: 0,
          endVerseIdx: Math.max(0, verseCount - 1),
          isFirst: true,
        },
      ]);
    }, 600);
    return () => clearTimeout(timer);
  }, [finish, pageContentHeight, target.data.verses.length]);

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={{
        position: "absolute",
        left: 0,
        top: -100000,
        opacity: 0,
        width: pageContentWidth,
      }}
    >
      <VerseFlow
        verses={target.data.verses}
        bookId={target.bookId}
        chapter={target.chapter}
        scale={scale}
        onVersePress={() => {}}
        focusVerse={null}
        focusTint="#888888"
        focusGlow={noopGlow}
        onAnchors={() => {}}
        onMeasureLines={handleMeasure}
      />
    </View>
  );
}

function AdjacentChapterMeasurer({
  bookId,
  chapter,
  verses,
  cacheKey,
  pageContentWidth,
  pageContentHeight,
  firstPageHeadingHeight,
  scale,
  onMeasured,
}: {
  bookId: string;
  chapter: number;
  verses: Chapter["verses"];
  cacheKey: string;
  pageContentWidth: number;
  pageContentHeight: number;
  firstPageHeadingHeight: number;
  scale: number;
  onMeasured?: () => void;
}) {
  const noopGlow = useRef(new Animated.Value(0)).current;
  const handleMeasure = useCallback(
    (lines: ReadonlyArray<TextLayoutLine>) => {
      if (!lines.length || readerPaginationCache.has(cacheKey)) return;
      const computed = linesToReaderPages(
        lines,
        verses,
        pageContentHeight,
        firstPageHeadingHeight,
      );
      if (computed.length > 0) {
        readerPaginationCache.set(cacheKey, computed);
        onMeasured?.();
      }
    },
    [cacheKey, verses, pageContentHeight, firstPageHeadingHeight, onMeasured],
  );

  if (readerPaginationCache.has(cacheKey)) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: -200000,
        opacity: 0,
        width: pageContentWidth,
      }}
    >
      <VerseFlow
        verses={verses}
        bookId={bookId}
        chapter={chapter}
        scale={scale}
        onVersePress={() => {}}
        focusVerse={null}
        focusTint="#888888"
        focusGlow={noopGlow}
        onAnchors={() => {}}
        onMeasureLines={handleMeasure}
      />
    </View>
  );
}

function LoadingView() {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
      <ActivityIndicator size="small" color={colors.inkMuted} />
      <Text
        style={[
          systemText.captionEmphasized,
          { color: colors.inkMuted, marginTop: 16 },
        ]}
      >
        Loading
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
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-5 px-5 py-3 rounded-full border border-border bg-surface"
      >
        <Text
          className="text-ink text-[13px]"
          style={{ fontFamily: "System", fontWeight: "600" }}
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
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        {translationName} isn&apos;t installed yet
      </Text>
      <Text
        className="text-ink-muted text-[14px] text-center mt-3 leading-[21px]"
        style={{ fontFamily: "System", fontWeight: "400" }}
      >
        {bookName} {chapter} isn&apos;t bundled with the app. {translationName}{" "}
        is copyrighted, so its text has to come from your own licensed
        copy. Drop a JSON file at{" "}
        <Text style={{ fontFamily: "System", fontWeight: "700" }}>
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
            fontFamily: "System",
            fontWeight: "700",
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
    <View
      style={{
        width: "100%",
        alignItems: "center",
        marginBottom: spacing[12],
      }}
    >
      <Text
        style={[
          typography.smallLabel,
          {
            color: colors.inkMuted,
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: 1,
          },
        ]}
      >
        {bookName}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 26 * Math.sqrt(scale),
          lineHeight: 34 * Math.sqrt(scale),
          letterSpacing: 0.5,
          color: colors.ink,
          marginTop: spacing[8],
          textAlign: "center",
          width: "100%",
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
        paddingTop: 32,
        paddingBottom: 220,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center pt-6 pb-8">
        <Text
          className="text-[11px] tracking-[1px] uppercase"
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: alreadyRead ? colors.inkMuted : colors.inkSubtle,
          }}
        >
          {alreadyRead ? "Chapter complete" : "End of chapter"}
        </Text>
        <Text
          className="text-ink mt-3"
          style={[
            systemText.largeTitle,
            { fontWeight: "800" },
          ]}
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
          paddingVertical: 16,
          paddingHorizontal: 24,
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
                fontFamily: "System",
                fontWeight: "700",
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
                fontFamily: "System",
                fontWeight: "700",
                color: colors.primaryFg,
                fontSize: 17,
              }}
            >
              {primaryLabel}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "500",
                color: colors.primaryFg,
                fontSize: 12,
                marginTop: 4,
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
            fontFamily: "System",
            fontWeight: "500",
            color: colors.inkMuted,
            fontSize: 12,
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
              fontFamily: "System",
              fontWeight: "600",
              color: colors.inkMuted,
              fontSize: 13,
              marginLeft: 4,
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
          className="text-ink-muted text-[11px] tracking-[1px] uppercase text-center"
          style={{ fontFamily: "System", fontWeight: "500" }}
        >
          {translationName}
        </Text>
        <Text
          className="text-ink-muted text-[11px] mt-1 text-center opacity-70"
          style={{ fontFamily: "System", fontWeight: "400" }}
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
    return null;
  }

  if (chapter > 1) {
    return { bookId, chapter: chapter - 1 };
  }
  return null;
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
  bookId,
  pagesLeftLabel,
  progress,
}: {
  bookId?: string;
  /** Caption like "4 pages left in book" — empty while loading. */
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

  const goBack = () => {
    haptics.soft();
    // Prefer a real pop so the transition matches the edge-swipe
    // gesture (book detail slides back in from the left). `replace`
    // would animate forward (slide from the right) — the "opposite
    // direction" mismatch. Fall back to the book detail (or library)
    // only when there's no stack history, e.g. a cold deep link.
    goBackOr(router, bookId ? `/book/${bookId}` : "/(tabs)/library");
  };

  return (
    <View style={{ zIndex: 30, elevation: 30, backgroundColor: colors.bg }}>
      {/* Absolute-center the pages-left caption on the full header
          width so the back chevron can't pull it off the true
          midpoint (and out of line with GENESIS / Chapter N below). */}
      <View
        style={{
          minHeight: 44,
          justifyContent: "center",
          paddingTop: 2,
          paddingBottom: 8,
        }}
      >
        {pagesLeftLabel ? (
          <Text
            pointerEvents="none"
            style={[
              systemText.footnote,
              {
                color: colors.inkSubtle,
                fontWeight: "500",
                textAlign: "center",
                paddingHorizontal: 56,
              },
            ]}
            numberOfLines={1}
          >
            {pagesLeftLabel}
          </Text>
        ) : null}

        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            position: "absolute",
            left: 8,
            top: 2,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SFSymbol
            name="chevron.left"
            size={20}
            color={colors.ink}
            weight="semibold"
          />
        </Pressable>
      </View>

      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginHorizontal: 16,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: colors.ink,
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
 * Apple-Books style caption: "N pages left in chapter/book".
 * Returns an empty string when we have nothing useful to say (only
 * happens before the first scroll measurement lands).
 */
function pagesLeftLabel(pagesLeft: number, inBook = false): string {
  if (pagesLeft <= 0) return "Last page";
  const scope = inBook ? "book" : "chapter";
  if (pagesLeft === 1) return `1 page left in ${scope}`;
  return `${pagesLeft} pages left in ${scope}`;
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
        marginTop: spacing[12],
        marginBottom: spacing[4],
      }}
    >
      <View
        style={{
          width: 36,
          height: 1,
          backgroundColor: colors.border,
        }}
      />
      <View style={{ flexDirection: "row", marginHorizontal: 8 }}>
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
// Reader tools — bottom pill + native iOS pickers
//
// Contents · Version · Aa. Version and text size use @expo/ui
// SwiftUI Picker (wheel / segmented) — not custom lists.
// ─────────────────────────────────────────────────────────────────

const READER_PILL_HEIGHT = 48;
const READER_PILL_ICON = 48;
const READER_PILL_GAP = 12;
// ─── Reader vertical layout budget (single source of truth) ───────
// Height of the custom Header row (chevron + progress rule).
const READER_HEADER_HEIGHT = 56;
// Gap from the safe-area bottom edge up to the floating toolbar pills.
const READER_TOOLBAR_BOTTOM_INSET = spacing[16];
// Breathing room between the last line of verse text and the top of
// the floating toolbar. Apple HIG: give controls enough surrounding
// space that content never crowds them. On-grid (spacing scale) so
// the reader shares the same rhythm as the rest of the app.
const READER_TEXT_TOOLBAR_GAP = spacing[24];

/** Translations shown in the version sheet (NWT only when installed). */
function pickableTranslations() {
  return TRANSLATIONS.filter((t) => !t.localOnly || hasLocalBundle(t.id));
}

/**
 * A single floating-toolbar chip (Contents / Version / Aa / theme).
 *
 * Restores the subtle press "twinkle" the reader chrome had before
 * the native-UI refactor: the whole chip springs down a touch on
 * touch-down and bounces back on release — the same Animated.spring
 * scale vocabulary the app's PrimaryPillButton uses (just a bit more
 * pronounced, since these chips are small). Honors Reduced Motion.
 *
 * The `containerStyle` carries the chip's shape / fill / shadow; the
 * scale transform rides on the wrapping Animated.View so the entire
 * chip (not just its glyph) animates. Haptics stay on the caller's
 * `onPress` so the guard logic (disabled / busy states) still gates
 * them and they never double-fire.
 */
function ToolbarChip({
  onPress,
  disabled,
  accessibilityLabel,
  containerStyle,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  containerStyle: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (target: number) => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      tension: 300,
      friction: 15,
    }).start();
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!disabled) animateTo(0.92);
        }}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        // Expand the touch area beyond the 48pt visual so edge taps
        // (and the shrink from the press-scale above) never drop a
        // press. Horizontal 8 exactly fills half the 12pt inter-chip
        // gap → seamless coverage with no dead zone and no overlap;
        // vertical 16 uses the empty space above/below the pills.
        hitSlop={{ top: 16, bottom: 16, left: 8, right: 8 }}
        style={({ pressed }) => ({
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function ReaderToolbar({
  onContents,
  textSizeId,
  onChangeTextSize,
  translation,
  onChangeTranslation,
  initialSheet,
}: {
  onContents: () => void;
  textSizeId: TextSizeId;
  onChangeTextSize: (id: TextSizeId) => void;
  translation: Translation;
  onChangeTranslation: (id: TranslationId) => void;
  initialSheet?: "version" | "textsize";
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { setPref } = useTheme();
  const isLight = scheme === "light";
  const toggleScheme = () => {
    haptics.soft();
    // Explicit override — tapping the pill commits the user to a
    // concrete dark/light pref (leaves "system" behind), so their
    // choice sticks regardless of the device appearance.
    setPref(isLight ? "dark" : "light");
  };
  const [textSizeOpen, setTextSizeOpen] = useState(initialSheet === "textsize");
  const [versionOpen, setVersionOpen] = useState(initialSheet === "version");
  // TrueSheet's dim overlay can still eat taps for a beat after
  // `visible` flips false. Hold the version pill until dismiss finishes,
  // and only then apply a pending translation change.
  const [versionSheetBusy, setVersionSheetBusy] = useState(false);
  const pendingTranslationRef = useRef<TranslationId | null>(null);

  const versions = pickableTranslations();
  const versionLabels = versions.map((t) => t.fullName);
  const versionIndex = Math.max(
    0,
    versions.findIndex((t) => t.id === translation.id),
  );
  const [draftVersionIndex, setDraftVersionIndex] = useState(versionIndex);

  const textSizeIndex = Math.max(
    0,
    TEXT_SIZES.findIndex((s) => s.id === textSizeId),
  );

  useEffect(() => {
    if (initialSheet === "version") setVersionOpen(true);
    if (initialSheet === "textsize") setTextSizeOpen(true);
  }, [initialSheet]);

  useEffect(() => {
    if (versionOpen) setDraftVersionIndex(versionIndex);
  }, [versionOpen, versionIndex]);

  const pillBg = isLight ? "rgba(255,255,255,0.94)" : "rgba(44,44,46,0.94)";
  const pillBorder = isLight
    ? "rgba(0,0,0,0.08)"
    : "rgba(255,255,255,0.12)";
  const iconColor = colors.ink;

  const pillShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isLight ? 0.14 : 0.45,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
  });

  const circleStyle = {
    width: READER_PILL_ICON,
    height: READER_PILL_ICON,
    borderRadius: READER_PILL_ICON / 2,
    backgroundColor: pillBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: pillBorder,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...pillShadow,
  };

  const openVersionSheet = () => {
    if (versionOpen || versionSheetBusy) return;
    haptics.soft();
    setVersionOpen(true);
  };

  const flushPendingTranslation = () => {
    const pending = pendingTranslationRef.current;
    pendingTranslationRef.current = null;
    setVersionSheetBusy(false);
    if (pending) onChangeTranslation(pending);
  };

  const commitVersion = () => {
    const next = versions[draftVersionIndex];
    pendingTranslationRef.current =
      next && next.id !== translation.id ? next.id : null;
    haptics.soft();
    setVersionSheetBusy(true);
    setVersionOpen(false);
    // Fallback if TrueSheet skips onDidDismiss — don't leave the
    // pill disabled or a pending translation stranded.
    setTimeout(flushPendingTranslation, 450);
  };

  const handleVersionClose = () => {
    setVersionOpen(false);
    flushPendingTranslation();
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: READER_TOOLBAR_BOTTOM_INSET,
          alignItems: "center",
          paddingHorizontal: spacing[24],
          zIndex: 40,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            columnGap: READER_PILL_GAP,
          }}
        >
          <ToolbarChip
            containerStyle={circleStyle}
            accessibilityLabel="Open chapter contents"
            onPress={() => {
              haptics.soft();
              onContents();
            }}
          >
            <SFSymbol
              name="list.bullet"
              size={18}
              color={iconColor}
              weight="medium"
            />
          </ToolbarChip>

          <ToolbarChip
            containerStyle={[
              {
                height: READER_PILL_HEIGHT,
                minWidth: 88,
                paddingHorizontal: 18,
                borderRadius: READER_PILL_HEIGHT / 2,
                backgroundColor: pillBg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: pillBorder,
                alignItems: "center",
                justifyContent: "center",
                opacity: versionSheetBusy ? 0.55 : 1,
              },
              pillShadow,
            ]}
            accessibilityLabel={`Bible version ${translation.tag}`}
            onPress={openVersionSheet}
            disabled={versionOpen || versionSheetBusy}
          >
            <Text
              style={[
                typography.smallLabel,
                {
                  color: iconColor,
                  textTransform: "uppercase",
                  textAlign: "center",
                },
              ]}
              allowFontScaling={false}
            >
              {translation.tag}
            </Text>
          </ToolbarChip>

          <ToolbarChip
            containerStyle={circleStyle}
            accessibilityLabel="Text size"
            onPress={() => {
              haptics.soft();
              setTextSizeOpen(true);
            }}
          >
            <Text
              style={[
                systemText.headline,
                { color: iconColor, letterSpacing: -0.3 },
              ]}
              allowFontScaling={false}
            >
              Aa
            </Text>
          </ToolbarChip>

          <ToolbarChip
            containerStyle={circleStyle}
            accessibilityLabel={
              isLight ? "Switch to dark mode" : "Switch to light mode"
            }
            onPress={toggleScheme}
          >
            <SFSymbol
              name={isLight ? "moon.fill" : "sun.max.fill"}
              size={17}
              color={iconColor}
              weight="medium"
            />
          </ToolbarChip>
        </View>
      </View>

      {/* Keep sheets mounted — unmounting on close skips TrueSheet.dismiss(). */}
      <AppleSheet
        visible={versionOpen}
        onClose={handleVersionClose}
        detents={["auto"]}
        grabber={false}
        backgroundColor={colors.surface}
      >
        <SheetModalHeader
          title="Bible Version"
          cancelLabel="Cancel"
          saveLabel="Save"
          onCancel={() => {
            pendingTranslationRef.current = null;
            setVersionSheetBusy(true);
            setVersionOpen(false);
            setTimeout(() => setVersionSheetBusy(false), 450);
          }}
          onSave={commitVersion}
        />
        <View
          style={{
            paddingHorizontal: spacing[16],
            paddingBottom: spacing[24],
          }}
        >
          <Host style={{ width: "100%", height: 216 }} colorScheme={scheme}>
            <ExpoUIPicker
              options={versionLabels}
              selectedIndex={draftVersionIndex}
              variant="wheel"
              onOptionSelected={({ nativeEvent: { index } }) => {
                setDraftVersionIndex(index);
              }}
            />
          </Host>
        </View>
      </AppleSheet>

      <AppleSheet
        visible={textSizeOpen}
        onClose={() => setTextSizeOpen(false)}
        detents={["auto"]}
        grabber
        backgroundColor={colors.surface}
      >
        <View
          style={{
            paddingHorizontal: spacing[16],
            paddingTop: spacing[12],
            paddingBottom: spacing[24],
          }}
        >
          <Text
            style={[
              systemText.title3,
              {
                color: colors.ink,
                textAlign: "center",
                marginBottom: spacing[16],
              },
            ]}
          >
            Text Size
          </Text>
          {/* Native UISegmentedControl — same control Library/Highlights use */}
          <SegmentedControl
            values={TEXT_SIZES.map((s) => s.name)}
            selectedIndex={textSizeIndex}
            onChange={(e) => {
              const index = e.nativeEvent.selectedSegmentIndex;
              const next = TEXT_SIZES[index];
              if (next) {
                haptics.tick();
                onChangeTextSize(next.id);
              }
            }}
            style={{ width: "100%", height: 36 }}
          />
        </View>
      </AppleSheet>
    </>
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
        width: 340,
        borderRadius: 22,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.45,
            shadowRadius: 30,
          },
          android: { elevation: 18 },
        }),
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 14,
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
            style={[
              systemText.captionEmphasized,
              { color: colors.inkMuted },
            ]}
          >
            Today
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 11,
              color: colors.inkMuted,
            }}
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
            marginTop: 16,
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
            fontFamily: "System",
            fontWeight: "500",
            fontSize: 12,
            color: colors.inkMuted,
            lineHeight: 18,
            marginTop: 8,
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
          backgroundColor: colors.border,
          marginHorizontal: 16,
        }}
      />

      <Pressable
        onPress={() => {
          haptics.soft();
          onOpen();
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        })}
        accessibilityRole="button"
        accessibilityLabel="Change reading goal"
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 15,
            lineHeight: 20,
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
        bottom: READER_TOOLBAR_BOTTOM_INSET,
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
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            className="text-ink text-[13px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            {count} verse{count === 1 ? "" : "s"} selected
          </Text>
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Exit selection"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              borderColor: colors.border,
              borderWidth: 1,
            })}
          >
            <Text
              className="text-ink-muted text-[11px] tracking-[1.5px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
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
            paddingBottom: 16,
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
  icon: ReactNode;
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
            fontFamily: "System",
            fontWeight: "700",
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
// Contents modal — chapter list
//
// Title = book name. Trailing number = page count for that chapter.
// Single 16pt horizontal inset (spacing scale) — no nested padding
// stacking. Never use NativeWind colors inside TrueSheet.
// ─────────────────────────────────────────────────────────────────

function ContentsModal({
  visible,
  onClose,
  bookId,
  bookName,
  totalChapters,
  currentChapter,
  chapterPageCounts,
  hasReadChapter,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  bookId: string;
  bookName: string;
  totalChapters: number;
  currentChapter: number;
  /** Page count per chapter (1-indexed via array offset). */
  chapterPageCounts: number[];
  hasReadChapter: (bookId: string, chapter: number) => boolean;
  onSelect: (chapter: number) => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const isLight = scheme === "light";
  const sheetBg = isLight ? "#F8F8F8" : colors.bg;
  const selectedWell = isLight ? "rgba(0,0,0,0.06)" : colors.surface;

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      detents={[0.6, 1]}
      backgroundColor={sheetBg}
      scrollable
    >
      <View>
        <Text
          style={[
            systemText.headline,
            {
              color: colors.ink,
              textAlign: "center",
              fontWeight: "700",
              paddingTop: spacing[12],
              paddingBottom: spacing[12],
              paddingHorizontal: spacing[16],
            },
          ]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {bookName}
        </Text>
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
          }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingBottom: spacing[40],
          }}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map((c) => {
            const read = hasReadChapter(bookId, c);
            const current = c === currentChapter;
            const upcoming = c > currentChapter && !read;
            const titleColor = upcoming ? colors.inkMuted : colors.ink;
            const pageCount = Math.max(1, chapterPageCounts[c - 1] ?? 1);
            return (
              <Pressable
                key={c}
                onPress={() => {
                  haptics.soft();
                  onSelect(c);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                accessibilityLabel={`${bookName} chapter ${c}, ${pageCount} pages`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: minTouchTarget,
                    paddingVertical: spacing[8],
                    paddingHorizontal: spacing[16],
                    backgroundColor: current ? selectedWell : "transparent",
                  }}
                >
                  <Text
                    style={[
                      systemText.body,
                      {
                        flex: 1,
                        fontWeight: current || read ? "700" : "600",
                        color: titleColor,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    Chapter {c}
                  </Text>
                  <Text
                    style={[
                      systemText.subheadline,
                      {
                        color: colors.inkMuted,
                        fontVariant: ["tabular-nums"],
                        marginLeft: spacing[12],
                      },
                    ]}
                  >
                    {pageCount}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </AppleSheet>
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
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <CheckBadgeIcon />
        <Text
          className="text-ink text-[13px] ml-2"
          style={{ fontFamily: "System", fontWeight: "600" }}
        >
          Today&apos;s reading goal achieved
        </Text>
        <Text
          className="text-ink-muted text-[12px] ml-2"
          style={{ fontFamily: "System", fontWeight: "500" }}
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
      <Header pagesLeftLabel="" progress={0} />
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-ink text-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          {message}
        </Text>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/library");
          }}
          className="mt-6 px-5 py-3 rounded-full bg-primary"
        >
          <Text
            className="text-primary-fg text-[13px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
