import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  type LayoutChangeEvent,
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
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { NoteEditor } from "@/components/NoteEditor";
import { VerseActionSheet } from "@/components/VerseActionSheet";
import { BOOKS, findBookById } from "@/constants/books";
import { colors } from "@/constants/theme";
import {
  type Chapter,
  fetchChapter,
  prefetchChapter,
} from "@/lib/bible";
import { chapterMinutes, timeLeftLabel } from "@/lib/readingTime";
import { useAutoMarkRead } from "@/lib/useAutoMarkRead";
import {
  findHighlightColor,
  type HighlightColorId,
  useAnnotations,
  verseKey,
} from "@/state/annotations";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";

/**
 * Color of the inline note marker drawn next to verse numbers that
 * have notes attached. Deliberately a saturated red — distinct from
 * any of the soft pastel highlight tints, so the marker reads as
 * "there's a note here" against a highlighted background too.
 */
const NOTE_MARKER_COLOR = "#FF453A";

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
  const { translation, textSize } = usePreferences();
  const annotations = useAnnotations();

  const [data, setData] = useState<Chapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Action-sheet / note-editor state ────────────────────────────
  // `activeVerse` is the verse number currently selected in the
  // action sheet, or null when closed.
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  // `editingNote` carries BOTH the verse and (optionally) the note
  // being edited. `noteId: null` means "compose a new note".
  const [editingNote, setEditingNote] = useState<
    { verse: number; noteId: string | null } | null
  >(null);

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

  const editingVerseNum = editingNote?.verse ?? null;
  const editingVerseData =
    editingVerseNum !== null
      ? data?.verses.find((v) => v.number === editingVerseNum) ?? null
      : null;
  const editingKey =
    editingVerseNum !== null
      ? verseKey(book.id, chapter, editingVerseNum)
      : null;
  // When editing an existing note we look up its current text; when
  // composing a new note this is the empty string.
  const editingNoteInitialText = useMemo(() => {
    if (!editingNote || !editingKey || !editingNote.noteId) return "";
    const list = annotations.getNotes(editingKey);
    return list.find((n) => n.id === editingNote.noteId)?.text ?? "";
  }, [editingNote, editingKey, annotations]);

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

  // ─── Reading-time + auto-mark wiring ───────────────────────────
  const totalMinutes = useMemo(
    () => (data ? chapterMinutes(data.verses) : 0),
    [data],
  );

  const { onScroll, scrollProgress } = useAutoMarkRead({
    enabled: !!data && !alreadyRead,
    minDwellMs: 30_000,
    minScrollPct: 0.7,
    onRead: () => {
      recordChapterRead(book.id, chapter);
      setJustMarked(true);
    },
  });

  const timeLeft = timeLeftLabel(totalMinutes, scrollProgress);

  // ─── Focus-verse spotlight (check-in deep link) ─────────────────
  // Three pieces of state cooperate here:
  //   • scrollRef         — needed so we can scrollTo() the verse
  //   • bodyOffsetY       — VerseFlow's y inside the ScrollView,
  //                          captured via onLayout on its wrapper
  //   • verseAnchors      — { [verseNumber]: yRelativeToVerseFlow }
  //                          captured via onTextLayout once the text
  //                          has laid out
  //
  // We also remember which verse we've already auto-scrolled to so
  // remounts caused by translation switches don't keep yanking the
  // user back. The glow Animated.Value is one-shot per focus token.
  const scrollRef = useRef<ScrollView>(null);
  const [bodyOffsetY, setBodyOffsetY] = useState<number | null>(null);
  const [verseAnchors, setVerseAnchors] = useState<Record<number, number>>({});
  const focusGlow = useRef(new Animated.Value(0)).current;
  const focusDoneRef = useRef<string | null>(null);

  const handleBodyLayout = useCallback((e: LayoutChangeEvent) => {
    setBodyOffsetY(e.nativeEvent.layout.y);
  }, []);

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

  // When focus + measurements are all ready, scroll the verse just
  // below the header and play a one-shot glow that fades back into
  // whatever the verse's persistent highlight was (often nothing).
  useEffect(() => {
    if (focusVerse == null) return;
    if (!data || bodyOffsetY == null) return;
    const verseY = verseAnchors[focusVerse];
    if (verseY == null) return;

    // De-dupe by route + verse so reloads / translation swaps inside
    // the same focus session don't replay the animation.
    const token = `${book.id}/${chapter}#${focusVerse}`;
    if (focusDoneRef.current === token) return;
    focusDoneRef.current = token;

    const target = Math.max(0, bodyOffsetY + verseY - 96);
    // Tiny delay lets the layout settle before the first scroll
    // jumps — without it the scroll occasionally fires before the
    // ScrollView knows its content size.
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }, 60);

    // Glow: quick ramp up → hold → slow fade. Background colors
    // can't run on the native driver, so we keep it on JS — the
    // animation is short enough that it's a non-issue.
    focusGlow.setValue(0);
    Animated.sequence([
      Animated.delay(280),
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
  }, [focusVerse, data, bodyOffsetY, verseAnchors, focusGlow, book.id, chapter]);

  // Clear the dedupe token when the user navigates to a different
  // chapter so a later check-in to the same verse re-plays the glow.
  useEffect(() => {
    focusDoneRef.current = null;
    setVerseAnchors({});
    setBodyOffsetY(null);
  }, [book.id, chapter]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header
        title={headerTitle}
        translationTag={translation.tag}
        timeLeft={data ? timeLeft : ""}
        progress={scrollProgress}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {/* ─── Hero ──────────────────────────────────────────────
              Big chapter number sits as the visual anchor. The chapter
              number also scales with the user's text-size preference,
              though more gently (sqrt of scale) so it doesn't dominate. */}
          <View className="px-6 pt-2 items-center">
            <Text
              className="text-ink-subtle text-[10.5px] tracking-[3px] uppercase"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {book.name}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                fontSize: 80 * Math.sqrt(textSize.scale),
                lineHeight: 88 * Math.sqrt(textSize.scale),
                letterSpacing: -2,
                color: colors.ink,
                marginTop: 4,
              }}
            >
              {chapter}
            </Text>
            <Text
              className="text-ink-subtle text-[11.5px] tracking-[2px] mt-1"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Chapter {chapter} of {book.chapters}
            </Text>
            <View className="w-10 h-[1.5px] bg-border-strong rounded-full mt-5" />
          </View>

          {/* ─── Body ──────────────────────────────────────────── */}
          <View className="px-6 mt-7" onLayout={handleBodyLayout}>
            {error ? (
              <ErrorView
                message={error}
                onRetry={() => setReloadKey((k) => k + 1)}
              />
            ) : !data ? (
              <LoadingView />
            ) : (
              <VerseFlow
                verses={data.verses}
                bookId={book.id}
                chapter={chapter}
                scale={textSize.scale}
                onVersePress={(n) => setActiveVerse(n)}
                focusVerse={focusVerse}
                focusTint={focusTint}
                focusGlow={focusGlow}
                onAnchors={handleAnchors}
              />
            )}
          </View>

          {/* ─── Mark as read ─────────────────────────────────────
              Still present as a manual fallback, but with softer copy
              now that auto-mark is doing the heavy lifting. The button
              flips to "Marked as read" the moment either the user OR
              the auto-mark hook records the chapter. */}
          {data && (
            <View className="px-6 mt-10 items-center">
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
                  onPress={() => {
                    recordChapterRead(book.id, chapter);
                    setJustMarked(true);
                  }}
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
                  : "We&apos;ll mark this for you as you finish — counts toward your streak."}
              </Text>
            </View>
          )}

          {/* ─── Translation credit ───────────────────────────────
              Now also doubles as a hint that translation is switchable
              (the row is wrapped in a Pressable that opens the picker). */}
          {data && (
            <Pressable
              onPress={() => router.push("/settings/translation")}
              className="px-6 mt-8 items-center"
              accessibilityRole="button"
              accessibilityLabel="Change Bible version"
            >
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase text-center"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                {data.translation}
              </Text>
              <Text
                className="text-ink-subtle text-[10px] mt-1 text-center opacity-70"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                {data.translationNote} · Tap to change version
              </Text>
            </Pressable>
          )}

          {/* ─── Prev / Next ──────────────────────────────────── */}
          <View className="px-5 mt-8 flex-row gap-3">
            <NavTile
              kind="prev"
              target={prev}
              onPress={prev ? () => goto(prev) : undefined}
            />
            <NavTile
              kind="next"
              target={next}
              onPress={next ? () => goto(next) : undefined}
            />
          </View>
        </ScrollView>

        {/* ─── Bottom fade ────────────────────────────────────────
            Gradient overlay so text dissolves into the background
            instead of hard-cutting at the screen edge. Sits ABOVE the
            scroll content but pointer-events disabled so taps still
            land on the underlying verses. */}
        <BottomFade />
      </View>

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
            if (v !== null) setEditingNote({ verse: v, noteId: null });
          }, 220);
        }}
        onEditNote={(noteId) => {
          const v = activeVerse;
          setActiveVerse(null);
          setTimeout(() => {
            if (v !== null) setEditingNote({ verse: v, noteId });
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
        reference={
          editingVerseData
            ? `${book.name} ${chapter}:${editingVerseData.number}`
            : ""
        }
        verseText={editingVerseData?.text ?? ""}
        initialNote={editingNoteInitialText}
        onSave={(text) => {
          if (!editingKey || !editingNote) {
            setEditingNote(null);
            return;
          }
          if (editingNote.noteId) {
            annotations.updateNote(editingKey, editingNote.noteId, text);
          } else {
            annotations.addNote(editingKey, text, {
              verseText: editingVerseData?.text,
            });
          }
          setEditingNote(null);
        }}
        onDelete={() => {
          if (editingKey && editingNote?.noteId) {
            annotations.deleteNote(editingKey, editingNote.noteId);
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
  focusVerse,
  focusTint,
  focusGlow,
  onAnchors,
}: {
  verses: { number: number; text: string }[];
  bookId: string;
  chapter: number;
  scale: number;
  onVersePress: (verse: number) => void;
  /** Verse number to spotlight, or null when no focus is active. */
  focusVerse: number | null;
  /** Hex color (with #) used for the focus glow background. */
  focusTint: string;
  /** Animated 0→1 driver for the focus glow opacity. */
  focusGlow: Animated.Value;
  /** Called whenever onTextLayout produces a fresh verse→y map. */
  onAnchors: (anchors: Record<number, number>) => void;
}) {
  const annotations = useAnnotations();

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
  // marker (`  N  `) and record the first y for each verse. Verses
  // are expected to appear in order, so we track the "next expected"
  // number to avoid false positives where body text contains a
  // standalone number (e.g. " 3 of the kings").
  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lines = e.nativeEvent.lines;
      if (!lines || lines.length === 0) return;

      const anchors: Record<number, number> = {};
      let nextExpected = decorated[0]?.number ?? 1;
      const maxVerseNum = decorated[decorated.length - 1]?.number ?? 0;

      for (const line of lines) {
        const text = line.text;
        // Find the next expected verse number anywhere in this line.
        // We loop because a single line can contain multiple verse
        // markers (e.g. short verses packed together).
        let cursor = 0;
        while (nextExpected <= maxVerseNum) {
          const needle = `  ${nextExpected}  `;
          const idx = text.indexOf(needle, cursor);
          if (idx === -1) break;
          if (anchors[nextExpected] === undefined) {
            anchors[nextExpected] = line.y;
          }
          cursor = idx + needle.length;
          nextExpected += 1;
        }
        if (nextExpected > maxVerseNum) break;
      }

      onAnchors(anchors);
    },
    [decorated, onAnchors],
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

        // Verse "innards" — verse number + note marker + spacer +
        // body. Identical between the static and animated branches
        // below; lifted up here so the two branches don't diverge.
        const inner = (
          <>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: verseNumSize,
                color: colors.inkSubtle,
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

        // Branch the wrapper element instead of computing a union
        // type for `backgroundColor` — the latter trips TS because
        // Animated.Text and Text don't share a single style-prop
        // overload that accepts both static colors and animated
        // interpolations.
        return (
          <Fragment key={v.number}>
            {isFocus ? (
              <Animated.Text
                onPress={() => onVersePress(v.number)}
                style={{ backgroundColor: focusBg }}
              >
                {inner}
              </Animated.Text>
            ) : (
              <Text
                onPress={() => onVersePress(v.number)}
                style={{
                  backgroundColor: v.highlight?.fill ?? "transparent",
                }}
              >
                {inner}
              </Text>
            )}
            {i < verses.length - 1 && <Text>{" "}</Text>}
          </Fragment>
        );
      })}
    </Text>
  );
}

function LoadingView() {
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
// Bottom fade overlay
//
// SVG linear gradient from transparent → bg color, anchored to the
// bottom of the screen and painted ABOVE the scroll content. It
// makes the very bottom of the column visually dissolve into the
// page chrome instead of hard-cutting. `pointerEvents="none"` is
// important — without it the gradient would eat taps on the last
// few lines of verse text.
// ─────────────────────────────────────────────────────────────────

const FADE_HEIGHT = 80;

function BottomFade() {
  const { width } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: FADE_HEIGHT,
      }}
    >
      <Svg width={width} height={FADE_HEIGHT}>
        <Defs>
          <LinearGradient id="readerFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} stopOpacity="0" />
            <Stop offset="0.5" stopColor={colors.bg} stopOpacity="0.65" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={FADE_HEIGHT}
          fill="url(#readerFade)"
        />
      </Svg>
    </View>
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
// Header — title + translation pill + time-left + progress bar
//
// The progress bar lives BELOW the row, hugging the bottom edge of
// the header, so it doesn't compete with the title for attention
// but is always glanceable. It's an animated width that grows with
// scrollProgress. `Animated.timing` isn't necessary here because
// scroll events are already smooth at 32ms — a plain View width
// keyed off scrollProgress is good enough and avoids native-driver
// constraints on layout properties.
// ─────────────────────────────────────────────────────────────────

function Header({
  title,
  translationTag,
  timeLeft,
  progress,
}: {
  title: string;
  translationTag: string;
  timeLeft: string;
  progress: number;
}) {
  const router = useRouter();
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

        {/* Center column: title on top, time-left underneath. Two
            lines stacked so neither truncates on a long book name
            and we still get the live "3 min left" feedback below it. */}
        <View className="flex-1 items-center">
          <Text
            className="text-ink text-[16.5px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {timeLeft ? (
            <Text
              className="text-ink-subtle text-[10.5px] tracking-[1.5px] uppercase mt-0.5"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              {timeLeft}
            </Text>
          ) : null}
        </View>

        {/* Translation pill */}
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

      {/* Thin scroll-progress bar tucked beneath the header row. */}
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

function Chevron({ direction }: { direction: "prev" | "next" }) {
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
        title="Not found"
        translationTag=""
        timeLeft=""
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
