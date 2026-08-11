import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Svg, { Circle, Path } from "react-native-svg";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { SFSymbol } from "@/components/Symbol";
import { findBookById } from "@/constants/books";
import { goBackOr } from "@/lib/navigation";
import {
  formatRef,
  routeForVerse,
} from "@/lib/annotationsFormat";
import * as haptics from "@/lib/haptics";
import { findMomentByDay } from "@/lib/moments";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { NEW_YORK, systemText, typography } from "@/lib/typography";
import {
  findHighlightColor,
  HIGHLIGHT_COLORS,
  type Highlight,
  type Note,
  useAnnotations,
} from "@/state/annotations";
import { type SermonCompletion, useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

const PAPER = "#FFFCFA";
const PAPER_INK = "#1A1510";
const PIN_PINK = "#FF6B8A";
const PIN_PINK_DEEP = "#E8456A";

const COL_GAP = 12;
const H_PAD = 16;
const PIN_SIZE = 22;

const TABS = ["Devotionals", "Notes", "Highlights"] as const;
type PinTab = (typeof TABS)[number];

/**
 * Saved — scrapboard for finished devotionals, Bible notes,
 * and highlights. Pins sit square; header tints follow the reader
 * highlight palette.
 */
export default function CompletedSermonsScreen() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { width: windowWidth } = useWindowDimensions();
  const { sermonCompletions } = useProgress();
  const { allNotes, allHighlights } = useAnnotations();
  const [tab, setTab] = useState<PinTab>("Devotionals");

  const completed = useMemo(
    () => dedupeCompletionsByDay(sermonCompletions),
    [sermonCompletions],
  );
  const notes = useMemo(() => allNotes(), [allNotes]);
  const highlights = useMemo(() => allHighlights(), [allHighlights]);

  const colWidth = (windowWidth - H_PAD * 2 - COL_GAP) / 2;
  const selectedIndex = TABS.indexOf(tab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <NavBar
          onBack={() => goBackOr(router, "/(tabs)/today")}
          ink={colors.ink}
        />

        <View style={{ paddingHorizontal: H_PAD, paddingBottom: 12 }}>
          <SegmentedControl
            values={[...TABS]}
            selectedIndex={selectedIndex < 0 ? 0 : selectedIndex}
            onChange={(e) => {
              const i = e.nativeEvent.selectedSegmentIndex;
              const next = TABS[i];
              if (!next) return;
              haptics.tick();
              setTab(next);
            }}
            appearance={scheme}
            style={{ height: 32 }}
          />
        </View>

        {tab === "Devotionals" ? (
          <ReadingsBoard
            completed={completed}
            colWidth={colWidth}
            onOpen={(day, accent) => {
              haptics.soft();
              router.push(
                `/saved-sermon/${day}?accent=${encodeURIComponent(accent)}`,
              );
            }}
          />
        ) : null}

        {tab === "Notes" ? (
          <NotesBoard
            notes={notes}
            colWidth={colWidth}
            onOpen={(n) => {
              haptics.soft();
              router.push(routeForVerse(n));
            }}
          />
        ) : null}

        {tab === "Highlights" ? (
          <HighlightsBoard
            highlights={highlights}
            colWidth={colWidth}
            onOpen={(h) => {
              haptics.soft();
              router.push(routeForVerse(h));
            }}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function ReadingsBoard({
  completed,
  colWidth,
  onOpen,
}: {
  completed: SermonCompletion[];
  colWidth: number;
  onOpen: (day: number, accent: string) => void;
}) {
  if (completed.length === 0) {
    return (
      <EmptyState
        variant="readings"
        title="No readings yet"
        body="Finish today's envelope and it will pin here."
      />
    );
  }

  const { left, right } = splitMasonry(completed);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: H_PAD,
        paddingTop: 8,
        paddingBottom: 48,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", gap: COL_GAP }}>
        <View style={{ width: colWidth, gap: 20 }}>
          {left.map((entry, i) => {
            const accent = highlightHeader(i * 2);
            return (
              <AnimatedPinnedScrap
                key={entry.id}
                index={i * 2}
                width={colWidth}
                headerColor={accent}
                dateLabel={formatPinDate(entry.completedAt)}
                body={findMomentByDay(entry.day!)?.verse?.trim() || entry.title}
                caption={findMomentByDay(entry.day!)?.reference?.trim()}
                onPress={() => {
                  if (entry.day != null) onOpen(entry.day, accent);
                }}
              />
            );
          })}
        </View>
        <View style={{ width: colWidth, gap: 20, paddingTop: 28 }}>
          {right.map((entry, i) => {
            const accent = highlightHeader(i * 2 + 1);
            return (
              <AnimatedPinnedScrap
                key={entry.id}
                index={i * 2 + 1}
                width={colWidth}
                headerColor={accent}
                dateLabel={formatPinDate(entry.completedAt)}
                body={findMomentByDay(entry.day!)?.verse?.trim() || entry.title}
                caption={findMomentByDay(entry.day!)?.reference?.trim()}
                onPress={() => {
                  if (entry.day != null) onOpen(entry.day, accent);
                }}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

/** Reading pin — same bottom slide-up as Notes post-its. */
function AnimatedPinnedScrap({
  index,
  width,
  headerColor,
  dateLabel,
  body,
  caption,
  onPress,
}: {
  index: number;
  width: number;
  headerColor: string;
  dateLabel: string;
  body: string;
  caption?: string;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 560,
      delay: 60 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress, reducedMotion]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [88, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY }],
      }}
    >
      <PinnedScrap
        width={width}
        headerColor={headerColor}
        dateLabel={dateLabel}
        body={body}
        caption={caption}
        onPress={onPress}
      />
    </Animated.View>
  );
}

type BookNoteStack = {
  bookId: string;
  bookName: string;
  notes: Note[];
};

function NotesBoard({
  notes,
  colWidth,
  onOpen,
}: {
  notes: Note[];
  colWidth: number;
  onOpen: (n: Note) => void;
}) {
  const stacks = useMemo(() => groupNotesByBook(notes), [notes]);
  const [openStack, setOpenStack] = useState<BookNoteStack | null>(null);

  if (notes.length === 0) {
    return (
      <EmptyState
        variant="notes"
        title="No Bible notes yet"
        body="Tap a verse while reading, write a post-it, and it shows up here."
      />
    );
  }

  const { left, right } = splitMasonry(stacks);

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingTop: 8,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", gap: COL_GAP }}>
          <View style={{ width: colWidth, gap: 22 }}>
            {left.map((stack, i) => (
              <AnimatedBookStack
                key={stack.bookId}
                index={i * 2}
                stack={stack}
                width={colWidth}
                onOpenStack={() => {
                  haptics.soft();
                  setOpenStack(stack);
                }}
                onOpen={onOpen}
              />
            ))}
          </View>
          <View style={{ width: colWidth, gap: 22, paddingTop: 28 }}>
            {right.map((stack, i) => (
              <AnimatedBookStack
                key={stack.bookId}
                index={i * 2 + 1}
                stack={stack}
                width={colWidth}
                onOpenStack={() => {
                  haptics.soft();
                  setOpenStack(stack);
                }}
                onOpen={onOpen}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BookStackSheet
        stack={openStack}
        onClose={() => setOpenStack(null)}
        onOpenNote={(n) => {
          setOpenStack(null);
          onOpen(n);
        }}
      />
    </>
  );
}

/** Group notes into one stack per Bible book (newest note on top). */
function groupNotesByBook(notes: Note[]): BookNoteStack[] {
  const byBook = new Map<string, Note[]>();
  for (const note of notes) {
    const list = byBook.get(note.bookId) ?? [];
    list.push(note);
    byBook.set(note.bookId, list);
  }

  return [...byBook.entries()]
    .map(([bookId, bookNotes]) => {
      const sorted = [...bookNotes].sort((a, b) => b.updatedAt - a.updatedAt);
      const book = findBookById(bookId);
      return {
        bookId,
        bookName: book?.name ?? bookId,
        notes: sorted,
      };
    })
    .sort((a, b) => {
      const aTop = a.notes[0]?.updatedAt ?? 0;
      const bTop = b.notes[0]?.updatedAt ?? 0;
      if (bTop !== aTop) return bTop - aTop;
      const aOrder = findBookById(a.bookId)?.order ?? 999;
      const bOrder = findBookById(b.bookId)?.order ?? 999;
      return aOrder - bOrder;
    });
}

const STACK_PEEK = 8;
const NOTE_CARD_MIN_RATIO = 0.92;

/** Book stack cover — entrance slide; tap opens full-screen sheet. */
function AnimatedBookStack({
  index,
  stack,
  width,
  onOpenStack,
  onOpen,
}: {
  index: number;
  stack: BookNoteStack;
  width: number;
  onOpenStack: () => void;
  onOpen: (n: Note) => void;
}) {
  const reducedMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      delay: 60 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index, reducedMotion]);

  const enterY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [88, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enterY }],
      }}
    >
      <BookNoteStackCard
        stack={stack}
        width={width}
        onOpenStack={onOpenStack}
        onOpen={onOpen}
      />
    </Animated.View>
  );
}

/**
 * Collapsed cover for a book stack — book name only (e.g. "Genesis"),
 * with peek layers behind. No date, body, count, or footer.
 */
function BookNoteStackCard({
  stack,
  width,
  onOpenStack,
  onOpen,
}: {
  stack: BookNoteStack;
  width: number;
  onOpenStack: () => void;
  onOpen: (n: Note) => void;
}) {
  const count = stack.notes.length;
  const isStack = count > 1;
  const peekCount = isStack ? Math.min(2, count - 1) : 0;
  const cardMinH = width * NOTE_CARD_MIN_RATIO;
  const top = stack.notes[0]!;
  const coverW = width - peekCount * STACK_PEEK;
  const paper =
    findHighlightColor(top.color as never) ?? HIGHLIGHT_COLORS[0]!;

  if (!isStack) {
    return (
      <PostItCard
        note={top}
        width={width}
        title={formatRef(top)}
        onPress={() => onOpen(top)}
      />
    );
  }

  return (
    <View
      style={{
        width,
        paddingTop: peekCount * STACK_PEEK,
        paddingRight: peekCount * STACK_PEEK,
      }}
    >
      {Array.from({ length: peekCount }).map((_, i) => {
        const depth = peekCount - i;
        const behind = stack.notes[depth] ?? top;
        const behindPaper =
          findHighlightColor(behind.color as never) ??
          HIGHLIGHT_COLORS[(i + 1) % HIGHLIGHT_COLORS.length]!;
        return (
          <View
            key={`peek-${i}`}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: (peekCount - depth) * STACK_PEEK,
              left: depth * STACK_PEEK,
              width: coverW,
              height: cardMinH,
              borderRadius: 22,
              backgroundColor: behindPaper.swatch,
              ...Platform.select({
                ios: {
                  shadowColor: "#1A1510",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.14,
                  shadowRadius: 10,
                },
                android: { elevation: 3 },
              }),
            }}
          />
        );
      })}

      <Pressable
        onPress={onOpenStack}
        accessibilityRole="button"
        accessibilityLabel={`${stack.bookName}, ${count} notes`}
        style={{ width: coverW }}
      >
        {({ pressed }) => (
          <View
            style={{
              width: coverW,
              height: cardMinH,
              borderRadius: 22,
              backgroundColor: paper.swatch,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 16,
              opacity: pressed ? 0.92 : 1,
              ...Platform.select({
                ios: {
                  shadowColor: "#1A1510",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.16,
                  shadowRadius: 16,
                },
                android: { elevation: 6 },
              }),
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,252,250,0.55)",
              }}
            />
            <Text
              style={[
                systemText.title1,
                {
                  color: PAPER_INK,
                  fontWeight: "700",
                  textAlign: "center",
                },
              ]}
              numberOfLines={2}
            >
              {stack.bookName}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Full-screen sheet for a book stack — slides in from the right and
 * slides back out on dismiss (iOS drill-back feel).
 */
function BookStackSheet({
  stack,
  onClose,
  onOpenNote,
}: {
  stack: BookNoteStack | null;
  onClose: () => void;
  onOpenNote: (n: Note) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [displayStack, setDisplayStack] = useState<BookNoteStack | null>(null);
  const closingRef = useRef(false);
  const colWidth = (windowWidth - H_PAD * 2 - COL_GAP) / 2;

  useEffect(() => {
    if (!stack) return;
    closingRef.current = false;
    setDisplayStack(stack);
    setMounted(true);
    if (reducedMotion) {
      slide.setValue(1);
      return;
    }
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, slide, stack]);

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (reducedMotion) {
      setMounted(false);
      setDisplayStack(null);
      onClose();
      return;
    }
    Animated.timing(slide, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      setDisplayStack(null);
      onClose();
    });
  };

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [windowWidth, 0],
  });

  const { left, right } = splitMasonry(displayStack?.notes ?? []);

  return (
    <Modal
      visible={mounted}
      animationType="none"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          transform: [{ translateX }],
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View
          style={{
            paddingHorizontal: H_PAD,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <BubbleBackButton onPress={dismiss} />
          <View style={{ flex: 1 }}>
            <Text
              style={[systemText.largeTitle, { color: colors.ink }]}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {displayStack?.bookName ?? ""}
            </Text>
            <Text
              style={[
                systemText.footnote,
                { color: colors.inkMuted, fontWeight: "600", marginTop: 2 },
              ]}
            >
              {displayStack
                ? `${displayStack.notes.length} ${
                    displayStack.notes.length === 1 ? "note" : "notes"
                  }`
                : ""}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: H_PAD,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", gap: COL_GAP }}>
            <View style={{ width: colWidth, gap: 16 }}>
              {left.map((n, i) => (
                <PostItCard
                  key={n.noteId}
                  note={n}
                  width={colWidth}
                  title={formatRef(n)}
                  onPress={() => onOpenNote(n)}
                  enterDelay={40 + i * 70}
                />
              ))}
            </View>
            <View style={{ width: colWidth, gap: 16, paddingTop: 20 }}>
              {right.map((n, i) => (
                <PostItCard
                  key={n.noteId}
                  note={n}
                  width={colWidth}
                  title={formatRef(n)}
                  onPress={() => onOpenNote(n)}
                  enterDelay={80 + i * 70}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/**
 * Sticky post-it — solid paper fill (no white rim). Title is either
 * the book name on a stack cover ("Genesis") or a verse ref
 * ("Genesis 1:1") inside the full-screen sheet.
 */
function PostItCard({
  note,
  width,
  title,
  onPress,
  count,
  footerHint,
  enterDelay,
}: {
  note: Note;
  width: number;
  title: string;
  onPress: () => void;
  count?: number;
  footerHint?: string;
  /** Optional staggered entrance when shown in the book sheet. */
  enterDelay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const enter = useRef(
    new Animated.Value(enterDelay == null || reducedMotion ? 1 : 0),
  ).current;
  const paper =
    findHighlightColor(note.color as never) ?? HIGHLIGHT_COLORS[0]!;
  const bodyLines = Math.min(
    5,
    Math.max(2, Math.ceil(note.text.length / 24)),
  );

  useEffect(() => {
    if (enterDelay == null || reducedMotion) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: enterDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, enterDelay, note.noteId, reducedMotion]);

  const enterY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0],
  });

  return (
    <Animated.View
      style={{
        width,
        opacity: enter,
        transform: [{ translateY: enterY }],
      }}
    >
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        count && count > 1
          ? `${title}, ${count} notes`
          : `Note on ${formatRef(note)}`
      }
      style={{ width }}
    >
      {({ pressed }) => (
        <View
          style={{
            width,
            minHeight: width * NOTE_CARD_MIN_RATIO,
            borderRadius: 22,
            backgroundColor: paper.swatch,
            overflow: "hidden",
            opacity: pressed ? 0.92 : 1,
            ...Platform.select({
              ios: {
                shadowColor: "#1A1510",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.16,
                shadowRadius: 16,
              },
              android: { elevation: 6 },
            }),
          }}
        >
          {/* Soft wash so ink stays readable on vivid swatches */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255,252,250,0.55)",
            }}
          />
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Text
                style={[
                  systemText.title3,
                  {
                    flex: 1,
                    color: PAPER_INK,
                    fontWeight: "700",
                  },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              {count && count > 1 ? (
                <View
                  style={{
                    minWidth: 26,
                    height: 26,
                    borderRadius: 13,
                    paddingHorizontal: 7,
                    backgroundColor: "rgba(26,21,16,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "700",
                      fontSize: 12,
                      color: PAPER_INK,
                    }}
                    allowFontScaling={false}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                systemText.subheadline,
                {
                  color: PAPER_INK,
                  fontWeight: "600",
                  marginTop: 6,
                  opacity: 0.72,
                },
              ]}
              numberOfLines={1}
            >
              {formatPinDate(note.updatedAt)}
            </Text>

            <Text
              style={[
                systemText.body,
                {
                  color: PAPER_INK,
                  fontWeight: "600",
                  marginTop: 12,
                  flexGrow: 1,
                },
              ]}
              numberOfLines={bodyLines}
            >
              {note.text}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(26,21,16,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SFSymbol
                  name="note.text"
                  size={13}
                  color={PAPER_INK}
                  weight="semibold"
                />
              </View>
              {footerHint ? (
                <Text
                  style={[
                    systemText.footnote,
                    {
                      flex: 1,
                      color: PAPER_INK,
                      fontWeight: "600",
                      opacity: 0.72,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {footerHint}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
    </Animated.View>
  );
}

function HighlightsBoard({
  highlights,
  colWidth,
  onOpen,
}: {
  highlights: Highlight[];
  colWidth: number;
  onOpen: (h: Highlight) => void;
}) {
  if (highlights.length === 0) {
    return (
      <EmptyState
        variant="highlights"
        title="No highlights yet"
        body="Highlight a verse in the Bible and it will collect here."
      />
    );
  }

  const { left, right } = splitMasonry(highlights);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: H_PAD,
        paddingTop: 8,
        paddingBottom: 48,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", gap: COL_GAP }}>
        <View style={{ width: colWidth, gap: 20 }}>
          {left.map((h) => (
            <PinnedScrap
              key={h.key}
              width={colWidth}
              headerColor={h.color.swatch}
              dateLabel={formatPinDate(h.updatedAt)}
              body={h.verseText || formatRef(h)}
              caption={formatRef(h)}
              onPress={() => onOpen(h)}
            />
          ))}
        </View>
        <View style={{ width: colWidth, gap: 20, paddingTop: 28 }}>
          {right.map((h) => (
            <PinnedScrap
              key={h.key}
              width={colWidth}
              headerColor={h.color.swatch}
              dateLabel={formatPinDate(h.updatedAt)}
              body={h.verseText || formatRef(h)}
              caption={formatRef(h)}
              onPress={() => onOpen(h)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function PinnedScrap({
  width,
  headerColor,
  dateLabel,
  body,
  caption,
  subcaption,
  onPress,
}: {
  width: number;
  headerColor: string;
  dateLabel: string;
  body: string;
  caption?: string;
  subcaption?: string;
  onPress: () => void;
}) {
  const lineEstimate = Math.min(8, Math.max(3, Math.ceil(body.length / 28)));
  const bodyMinHeight = 72 + lineEstimate * 16;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ width }}
    >
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.9 : 1,
            paddingTop: PIN_SIZE / 2,
          }}
        >
          <View
            style={{
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: PAPER,
              ...Platform.select({
                ios: {
                  shadowColor: "#5A3040",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.16,
                  shadowRadius: 14,
                },
                android: { elevation: 6 },
              }),
            }}
          >
            <View
              style={{
                backgroundColor: headerColor,
                paddingHorizontal: 10,
                paddingTop: 16,
                paddingBottom: 14,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
              }}
            >
              <Text
                style={[
                  systemText.title3,
                  {
                    color: PAPER_INK,
                    textAlign: "center",
                    letterSpacing: 0.6,
                  },
                ]}
                allowFontScaling={false}
              >
                {dateLabel}
              </Text>
            </View>

            <View style={{ minHeight: bodyMinHeight }}>
              <TornEdgeOverlay width={width} />
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingTop: 14,
                  paddingBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: NEW_YORK,
                    fontWeight: "400",
                    fontSize: 14,
                    lineHeight: 20,
                    color: PAPER_INK,
                  }}
                  numberOfLines={lineEstimate}
                >
                  {body}
                </Text>
                {caption ? (
                  <Text
                    style={[
                      typography.smallLabel,
                      {
                        color: "rgba(26,21,16,0.5)",
                        marginTop: 10,
                        fontSize: 10,
                        lineHeight: 12,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      },
                    ]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {caption}
                  </Text>
                ) : null}
                {subcaption ? (
                  <Text
                    style={{
                      marginTop: 6,
                      fontFamily: "System",
                      fontWeight: "400",
                      fontSize: 11,
                      lineHeight: 15,
                      color: "rgba(26,21,16,0.42)",
                    }}
                    numberOfLines={2}
                  >
                    {subcaption}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 4,
            }}
          >
            <PushPin />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function PushPin() {
  const s = PIN_SIZE;
  return (
    <Svg width={s} height={s + 4} viewBox={`0 0 ${s} ${s + 4}`}>
      <Circle cx={s / 2 + 1} cy={s / 2 + 2} r={s / 2 - 1} fill="rgba(0,0,0,0.12)" />
      <Circle cx={s / 2} cy={s / 2} r={s / 2 - 1} fill={PIN_PINK_DEEP} />
      <Circle cx={s / 2} cy={s / 2 - 0.5} r={s / 2 - 2.5} fill={PIN_PINK} />
      <Circle
        cx={s / 2 - 3}
        cy={s / 2 - 4}
        r={2.2}
        fill="rgba(255,255,255,0.55)"
      />
    </Svg>
  );
}

function TornEdgeOverlay({ width }: { width: number }) {
  const h = 10;
  const step = 7;
  const parts: string[] = [`M 0 ${h}`];
  for (let x = 0; x <= width; x += step) {
    const y = Math.floor(x / step) % 2 === 0 ? 0 : h * 0.55;
    parts.push(`L ${Math.min(x, width)} ${y}`);
  }
  parts.push(`L ${width} ${h}`, `L 0 ${h}`, "Z");

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -1,
        left: 0,
        right: 0,
        height: h,
        zIndex: 2,
      }}
    >
      <Svg width={width} height={h}>
        <Path d={parts.join(" ")} fill={PAPER} />
      </Svg>
    </View>
  );
}

function EmptyState({
  title,
  body,
  variant,
}: {
  title: string;
  body: string;
  variant: "readings" | "notes" | "highlights";
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      <View style={{ marginBottom: 8, alignItems: "center" }}>
        {variant === "highlights" ? (
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: PAPER,
              alignItems: "center",
              justifyContent: "center",
              ...Platform.select({
                ios: {
                  shadowColor: "#5A3040",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                },
                android: { elevation: 4 },
              }),
            }}
          >
            <SFSymbol
              name="highlighter"
              size={28}
              color={HIGHLIGHT_COLORS[0]!.swatch}
              weight="medium"
            />
          </View>
        ) : variant === "notes" ? (
          <PostItEmptyArt />
        ) : (
          <View style={{ paddingTop: PIN_SIZE / 2 }}>
            <View
              style={{
                width: 120,
                borderRadius: 10,
                backgroundColor: PAPER,
                paddingTop: 18,
                paddingBottom: 20,
                paddingHorizontal: 14,
                ...Platform.select({
                  ios: {
                    shadowColor: "#5A3040",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.14,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }),
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: -PIN_SIZE / 2,
                  left: 0,
                  right: 0,
                  alignItems: "center",
                }}
              >
                <PushPin />
              </View>
              <Text
                style={{
                  fontFamily: NEW_YORK,
                  fontSize: 13,
                  lineHeight: 18,
                  color: "rgba(26,21,16,0.45)",
                  textAlign: "center",
                }}
              >
                Pin something here.
              </Text>
            </View>
          </View>
        )}
      </View>
      <Text
        style={[
          systemText.title3,
          { color: PAPER_INK, marginTop: 20, textAlign: "center" },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          systemText.subheadline,
          {
            color: "rgba(26,21,16,0.55)",
            marginTop: 8,
            textAlign: "center",
          },
        ]}
      >
        {body}
      </Text>
    </View>
  );
}

/** Soft yellow post-it for the Notes empty state. */
function PostItEmptyArt() {
  return (
    <View
      style={{
        width: 88,
        height: 88,
        ...Platform.select({
          ios: {
            shadowColor: "#5A3040",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.16,
            shadowRadius: 12,
          },
          android: { elevation: 5 },
        }),
      }}
    >
      <Svg width={88} height={88} viewBox="0 0 88 88">
        <Path
          d="M10 6 H70 Q78 6 78 14 V62 L54 86 H10 Q6 86 6 82 V10 Q6 6 10 6 Z"
          fill="#FFE566"
        />
        <Path d="M54 86 V70 Q54 62 62 62 H78 Z" fill="#F0C93A" />
        <Path
          d="M22 28 H58 M22 40 H52 M22 52 H46"
          stroke="rgba(26,21,16,0.22)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function NavBar({ onBack, ink }: { onBack: () => void; ink: string }) {
  return (
    <View style={{ paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 8 }}>
      <BubbleBackButton onPress={onBack} color={ink} />
      <Text
        style={[systemText.largeTitle, { color: ink, marginTop: 8 }]}
        accessibilityRole="header"
      >
        Saved
      </Text>
    </View>
  );
}

function highlightHeader(index: number): string {
  return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length]!.swatch;
}

function splitMasonry<T>(items: T[]): { left: T[]; right: T[] } {
  const left: T[] = [];
  const right: T[] = [];
  items.forEach((item, i) => {
    if (i % 2 === 0) left.push(item);
    else right.push(item);
  });
  return { left, right };
}

function dedupeCompletionsByDay(
  completions: ReadonlyArray<SermonCompletion>,
): SermonCompletion[] {
  const byDay = new Map<number, SermonCompletion>();
  for (const entry of [...completions].sort(
    (a, b) => b.completedAt - a.completedAt,
  )) {
    if (entry.day == null || byDay.has(entry.day)) continue;
    byDay.set(entry.day, entry);
  }
  return [...byDay.values()].sort((a, b) => b.completedAt - a.completedAt);
}

function formatPinDate(ms: number): string {
  return new Date(ms)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
