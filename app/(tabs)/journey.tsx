import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import {
  buildJourney,
  formatDayHeader,
  type ChapterEvent,
  type CheckInEvent,
  type CheckInStack,
  type HighlightEvent,
  type HighlightStack,
  type JourneyRow,
  type MilestoneEvent,
  type NoteEvent,
  type NoteStack,
  type SermonEvent,
} from "@/lib/journey";
import { useAnnotations } from "@/state/annotations";
import { useCheckIns } from "@/state/checkIns";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

// Android requires a one-time opt-in to use LayoutAnimation. Safe
// to call repeatedly — internally guards itself.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Journey tab — a chronological timeline of everything the user has
 * done in Closer, grouped by day. New entries land at the top; each
 * day reads like a small spiritual diary entry.
 *
 *   ──────────────────────────────────────
 *    TODAY
 *   ──────────────────────────────────────
 *   ● 7-day streak                       ← milestone
 *   │
 *   ● Drawing Near in the Noise          ← sermon
 *   │
 *   ● Highlights · 3                  ▾  ← stack (collapsed)
 *   │      └ John 3:16
 *   │      └ Psalm 23:1
 *   │      └ Romans 8:28
 *   │
 *   ● Note · Genesis 1                   ← single (no stack)
 *   ──────────────────────────────────────
 *
 * Same-kind chatter is collapsed: when a day has 2+ notes (or 2+
 * highlights), they fuse into a single "Notes · N" / "Highlights · N"
 * stack card that expands inline on tap to reveal each child. Single
 * notes/highlights stay as their own row.
 *
 * Tap behavior:
 *   • verse rows + chapter rows → open the reader
 *   • stack header → toggle expansion
 *   • stack child → open the reader at that verse
 *   • sermon + milestone → inert (no replay yet)
 */
export default function JourneyScreen() {
  const router = useRouter();
  const { sermonCompletions, chaptersRead, engagedDates } = useProgress();
  const { notes, highlights, verseSnippets, timestamps } = useAnnotations();
  const { log: checkInLog } = useCheckIns();
  const { border } = useColors();

  const days = useMemo(
    () =>
      buildJourney(
        { sermonCompletions, chaptersRead, engagedDates },
        { notes, highlights, verseSnippets, timestamps },
        { log: checkInLog },
      ),
    [
      sermonCompletions,
      chaptersRead,
      engagedDates,
      notes,
      highlights,
      verseSnippets,
      timestamps,
      checkInLog,
    ],
  );

  const totalRows = days.reduce((acc, d) => acc + d.rows.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ───────────────────────────────────────── */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2">
            <Text
              className="text-ink-subtle text-[12px] uppercase tracking-[3px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Closer
            </Text>
            <Text
              className="text-ink text-[32px] leading-[36px] tracking-[-0.6px] mt-1"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Journey
            </Text>
            <Text
              className="text-ink-muted text-[13.5px] mt-2 leading-[20px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              {totalRows > 0
                ? "Every quiet step of your time with Him, one day at a time."
                : "Your timeline begins the first time you read, highlight, or finish a sermon."}
            </Text>
          </View>
        </FadeIn>

        {/* ─── Body ───────────────────────────────────────── */}
        {totalRows === 0 ? (
          <EmptyState />
        ) : (
          <View className="px-6 mt-8">
            {days.map((day, dayIdx) => (
              <FadeIn
                key={day.dateISO}
                delayMs={150 + dayIdx * 60}
                durationMs={650}
              >
                <View className={dayIdx === 0 ? "" : "mt-7"}>
                  <DayHeader iso={day.dateISO} />

                  {/* Vertical-line + dot timeline. The line is drawn
                      as a single absolutely-positioned column behind
                      the rows so it stretches the full day height
                      regardless of how many rows / how many of them
                      are expanded. */}
                  <View className="mt-3 relative">
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: 7,
                        top: 6,
                        bottom: 6,
                        width: 1,
                        backgroundColor: border,
                      }}
                    />
                    {day.rows.map((row, i) => (
                      <TimelineRow
                        key={row.id}
                        row={row}
                        isLast={i === day.rows.length - 1}
                        router={router}
                      />
                    ))}
                  </View>
                </View>
              </FadeIn>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Day header
// ─────────────────────────────────────────────────────────────────

function DayHeader({ iso }: { iso: string }) {
  const label = formatDayHeader(iso);
  return (
    <View className="flex-row items-center">
      <Text
        className="text-ink text-[14px] tracking-[-0.1px]"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {label.primary}
        {label.secondary ? (
          <Text
            className="text-ink-subtle text-[13px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {`  ·  ${label.secondary}`}
          </Text>
        ) : null}
      </Text>
      <View className="flex-1 h-[1px] bg-border ml-3" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row dispatcher — single event vs. stack
// ─────────────────────────────────────────────────────────────────

type RouterShape = ReturnType<typeof useRouter>;

function TimelineRow({
  row,
  isLast,
  router,
}: {
  row: JourneyRow;
  isLast: boolean;
  router: RouterShape;
}) {
  if (
    row.kind === "noteStack" ||
    row.kind === "highlightStack" ||
    row.kind === "checkInStack"
  ) {
    return <StackRow row={row} isLast={isLast} router={router} />;
  }
  return <EventRow event={row} isLast={isLast} router={router} />;
}

// ─────────────────────────────────────────────────────────────────
// Single-event row — note / highlight / sermon / chapter / milestone
// ─────────────────────────────────────────────────────────────────

function EventRow({
  event,
  isLast,
  router,
}: {
  event:
    | NoteEvent
    | HighlightEvent
    | SermonEvent
    | ChapterEvent
    | MilestoneEvent
    | CheckInEvent;
  isLast: boolean;
  router: RouterShape;
}) {
  const { primary } = useColors();
  // Dot color is chosen per event kind. For highlights we use the
  // actual highlight color so the timeline literally carries the
  // user's color coding. Milestones get the warm "streak" amber.
  // Notes use the bright marker red, matching the reader indicator.
  // Check-ins inherit the mood's swatch.
  let dotColor: string = primary;
  if (event.kind === "highlight") {
    dotColor = event.color.swatch;
  } else if (event.kind === "milestone") {
    dotColor = "#FFB672";
  } else if (event.kind === "note") {
    dotColor = NOTE_RED;
  } else if (event.kind === "checkIn") {
    dotColor = event.mood?.swatch ?? primary;
  }

  const handlePress = () => {
    if (event.kind === "note" || event.kind === "highlight") {
      router.push(`/book/${event.verse.bookId}/${event.verse.chapter}`);
    } else if (event.kind === "chapter") {
      router.push(`/book/${event.bookId}/${event.chapter}`);
    } else if (event.kind === "checkIn") {
      router.push(`/book/${event.verse.bookId}/${event.verse.chapter}`);
    }
  };

  const interactive =
    event.kind === "note" ||
    event.kind === "highlight" ||
    event.kind === "chapter" ||
    event.kind === "checkIn";

  return (
    <DottedRow dotColor={dotColor} isLast={isLast}>
      {interactive ? (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <EventCard event={event} />
        </Pressable>
      ) : (
        <EventCard event={event} />
      )}
    </DottedRow>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stack row — collapses 2+ same-kind events into one card that
// expands inline to reveal children
// ─────────────────────────────────────────────────────────────────

function StackRow({
  row,
  isLast,
  router,
}: {
  row: NoteStack | HighlightStack | CheckInStack;
  isLast: boolean;
  router: RouterShape;
}) {
  const { primary } = useColors();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    // Smooth height transition for the expanding child list. easeInEaseOut
    // is the calmest preset and matches the rest of the app's motion.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  // Per-kind metadata for the header row.
  //   • Notes  — bright red, matching the reader's note marker
  //   • Highlights — primary white
  //   • Check-ins — first child's mood color (or primary if missing),
  //                 so the stack inherits the day's emotional palette
  const meta: { dot: string; label: string; eyebrow: string; count: number } =
    row.kind === "noteStack"
      ? {
          dot: NOTE_RED,
          label: "Notes",
          eyebrow: NOTE_RED,
          count: row.notes.length,
        }
      : row.kind === "highlightStack"
      ? {
          dot: primary,
          label: "Highlights",
          eyebrow: primary,
          count: row.highlights.length,
        }
      : {
          dot: row.checkIns[0]?.mood?.swatch ?? primary,
          label: "Check-ins",
          eyebrow: row.checkIns[0]?.mood?.swatch ?? primary,
          count: row.checkIns.length,
        };
  const { dot: dotColor, label, eyebrow: eyebrowColor, count } = meta;

  return (
    <DottedRow dotColor={dotColor} isLast={isLast}>
      <View className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Header — tap to toggle. Same visual rhythm as other
            cards but with a count chip and a chevron on the right. */}
        <Pressable
          onPress={toggle}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View className="px-4 py-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-baseline">
                <Text
                  className="text-[10px] tracking-[2.5px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: eyebrowColor,
                  }}
                >
                  {label}
                </Text>
                <View className="ml-2 px-2 py-[2px] rounded-full bg-accent-soft border border-border">
                  <Text
                    className="text-ink text-[10.5px]"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    {count}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text
                  className="text-ink-subtle text-[10.5px] mr-2"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  {open ? "Hide" : "Show"}
                </Text>
                <Chevron open={open} />
              </View>
            </View>

            {/* Collapsed preview — list the references inline so
                the user knows what's in the stack without opening. */}
            {!open ? (
              <Text
                className="text-ink-muted text-[13px] mt-2 leading-[18px]"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                numberOfLines={2}
              >
                {stackPreview(row)}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* Expanded child list — rendered inside the same card so
            the day's vertical line is the only thing connecting it
            back to the dot. Each child is its own pressable row. */}
        {open ? (
          <View className="border-t border-border">
            {row.kind === "noteStack"
              ? row.notes.map((n, i) => (
                  <ChildRow
                    key={n.id}
                    showDivider={i < row.notes.length - 1}
                    onPress={() =>
                      router.push(`/book/${n.verse.bookId}/${n.verse.chapter}`)
                    }
                  >
                    <NoteChild event={n} />
                  </ChildRow>
                ))
              : row.kind === "highlightStack"
              ? row.highlights.map((h, i) => (
                  <ChildRow
                    key={h.id}
                    showDivider={i < row.highlights.length - 1}
                    onPress={() =>
                      router.push(`/book/${h.verse.bookId}/${h.verse.chapter}`)
                    }
                  >
                    <HighlightChild event={h} />
                  </ChildRow>
                ))
              : row.checkIns.map((c, i) => (
                  <ChildRow
                    key={c.id}
                    showDivider={i < row.checkIns.length - 1}
                    onPress={() =>
                      router.push(
                        `/check-ins/${c.checkInId}` as never,
                      )
                    }
                  >
                    <CheckInChild event={c} />
                  </ChildRow>
                ))}
          </View>
        ) : null}
      </View>
    </DottedRow>
  );
}

/** Compact preview text for a collapsed stack — kind-aware. */
function stackPreview(
  row: NoteStack | HighlightStack | CheckInStack,
): string {
  // For notes/highlights we join the verse references the user has
  // touched — gives a quick scan of "which scriptures sit in this
  // stack". For check-ins we join the mood labels instead, since
  // that's what makes a multi-check-in day distinctive ("Anxious ·
  // Grateful · Hopeful").
  const items =
    row.kind === "noteStack"
      ? row.notes.map((n) => n.reference)
      : row.kind === "highlightStack"
      ? row.highlights.map((h) => h.reference)
      : row.checkIns.map((c) => c.mood?.label ?? "Check-in");
  // De-dupe in case the same value appears more than once (e.g.,
  // multiple notes on the same verse, or two morning + evening
  // check-ins with the same mood).
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const r of items) {
    if (!seen.has(r)) {
      seen.add(r);
      unique.push(r);
    }
  }
  return unique.join(" · ");
}

function ChildRow({
  children,
  showDivider,
  onPress,
}: {
  children: React.ReactNode;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="px-4 py-3">{children}</View>
      </Pressable>
      {showDivider ? <View className="h-[1px] bg-border ml-4" /> : null}
    </>
  );
}

function NoteChild({ event }: { event: NoteEvent }) {
  return (
    <>
      <View className="flex-row items-baseline justify-between">
        <Text
          className="text-ink text-[13.5px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {event.reference}
        </Text>
        {timeChipMuted(event.at)}
      </View>
      <Text
        className="text-ink-muted text-[12.5px] mt-1 leading-[18px]"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={2}
      >
        {event.noteText}
      </Text>
    </>
  );
}

function HighlightChild({ event }: { event: HighlightEvent }) {
  return (
    <View className="flex-row items-start">
      {/* Tiny color swatch dot in the highlight's actual color */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: event.color.swatch,
          marginTop: 5,
          marginRight: 8,
        }}
      />
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-ink text-[13.5px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {event.reference}
          </Text>
          {timeChipMuted(event.at)}
        </View>
        {event.verseSnippet ? (
          <Text
            className="text-ink-muted text-[12.5px] mt-1 leading-[18px] italic"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={2}
          >
            &ldquo;{event.verseSnippet}&rdquo;
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Compact child row for an expanded CheckInStack. Mood label sits
 * to the left as a small color-tinted pill; the delivered verse
 * reference + a one-line preview of the verse fill the rest of the
 * row. Tapping the parent ChildRow routes into the per-check-in
 * detail page (so the user can edit their journal, share, etc.).
 */
function CheckInChild({ event }: { event: CheckInEvent }) {
  const { primary } = useColors();
  const accent = event.mood?.swatch ?? primary;
  const moodLabel = event.mood?.label ?? "Check-in";
  return (
    <View className="flex-row items-start">
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: accent,
          marginTop: 5,
          marginRight: 8,
        }}
      />
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline flex-1 pr-2">
            <Text
              className="text-ink text-[13.5px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {moodLabel}
            </Text>
            <Text
              className="text-ink-subtle text-[11.5px] ml-2"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              · {event.reference}
            </Text>
          </View>
          {timeChipMuted(event.at)}
        </View>
        <Text
          className="text-ink-muted text-[12.5px] mt-1 leading-[18px] italic"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          numberOfLines={2}
        >
          &ldquo;{event.verseText}&rdquo;
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Per-kind cards (single-event variant)
// ─────────────────────────────────────────────────────────────────

function EventCard({
  event,
}: {
  event:
    | NoteEvent
    | HighlightEvent
    | SermonEvent
    | ChapterEvent
    | MilestoneEvent
    | CheckInEvent;
}) {
  switch (event.kind) {
    case "note":
      return <NoteCard event={event} />;
    case "highlight":
      return <HighlightCard event={event} />;
    case "sermon":
      return <SermonCard event={event} />;
    case "chapter":
      return <ChapterCard event={event} />;
    case "milestone":
      return <MilestoneCard event={event} />;
    case "checkIn":
      return <CheckInCard event={event} />;
  }
}

function CardShell({
  eyebrow,
  eyebrowColor,
  children,
  rightChip,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  children: React.ReactNode;
  rightChip?: React.ReactNode;
}) {
  const { primary } = useColors();
  return (
    <View className="rounded-2xl border border-border bg-surface px-4 py-3.5">
      <View className="flex-row items-baseline justify-between">
        <Text
          className="text-[10px] tracking-[2.5px] uppercase"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: eyebrowColor ?? primary,
          }}
        >
          {eyebrow}
        </Text>
        {rightChip}
      </View>
      <View className="mt-1.5">{children}</View>
    </View>
  );
}

function timeChip(at: number) {
  return (
    <Text
      className="text-ink-subtle text-[10.5px]"
      style={{ fontFamily: "PlusJakartaSans_500Medium" }}
    >
      {formatClock(at)}
    </Text>
  );
}

function timeChipMuted(at: number) {
  return (
    <Text
      className="text-ink-subtle text-[10px]"
      style={{ fontFamily: "PlusJakartaSans_500Medium" }}
    >
      {formatClock(at)}
    </Text>
  );
}

// ─── Note ───────────────────────────────────────────────

function NoteCard({ event }: { event: NoteEvent }) {
  return (
    <CardShell
      eyebrow={`Note · ${event.reference}`}
      eyebrowColor={NOTE_RED}
      rightChip={timeChip(event.at)}
    >
      <Text
        className="text-ink text-[14px] leading-[20px]"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={3}
      >
        {event.noteText}
      </Text>
      {event.verseSnippet ? (
        <Text
          className="text-ink-muted text-[11.5px] mt-2 italic leading-[16px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          numberOfLines={2}
        >
          &ldquo;{event.verseSnippet}&rdquo;
        </Text>
      ) : null}
    </CardShell>
  );
}

// ─── Highlight ──────────────────────────────────────────

function HighlightCard({ event }: { event: HighlightEvent }) {
  const { primary } = useColors();
  return (
    <View className="rounded-2xl border border-border bg-surface overflow-hidden flex-row">
      <View style={{ width: 4, backgroundColor: event.color.swatch }} />
      <View className="flex-1 px-4 py-3.5">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-[10px] tracking-[2.5px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: primary,
            }}
          >
            Highlighted · {event.reference}
          </Text>
          {timeChip(event.at)}
        </View>
        {event.verseSnippet ? (
          <Text
            className="text-ink text-[13.5px] leading-[20px] mt-1.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={3}
          >
            &ldquo;{event.verseSnippet}&rdquo;
          </Text>
        ) : (
          <Text
            className="text-ink-muted text-[12px] mt-1.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Tap to revisit
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Sermon ──────────────────────────────────────────────

function SermonCard({ event }: { event: SermonEvent }) {
  return (
    <View className="rounded-2xl border border-border bg-surface overflow-hidden flex-row">
      <View style={{ width: 4, backgroundColor: event.accent }} />
      <View className="flex-1 px-4 py-3.5">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-[10px] tracking-[2.5px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: event.accent,
            }}
          >
            Sermon completed
          </Text>
          {timeChip(event.at)}
        </View>
        <Text
          className="text-ink text-[15px] mt-1.5 tracking-[-0.1px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        {event.pastor ? (
          <Text
            className="text-ink-muted text-[12px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {event.pastor}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Chapter read ───────────────────────────────────────

function ChapterCard({ event }: { event: ChapterEvent }) {
  const { ink } = useColors();
  return (
    <CardShell eyebrow="Read" rightChip={timeChip(event.at)}>
      <View className="flex-row items-center">
        <BookmarkIcon stroke={ink} />
        <Text
          className="text-ink text-[14.5px] ml-2"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {event.reference}
        </Text>
      </View>
    </CardShell>
  );
}

// ─── Check-in ──────────────────────────────────────────

function CheckInCard({ event }: { event: CheckInEvent }) {
  const router = useRouter();
  const { primary } = useColors();
  const accent = event.mood?.swatch ?? primary;
  const moodLabel = event.mood?.label ?? "Check-in";
  return (
    <Pressable
      onPress={() => router.push(`/check-ins/${event.checkInId}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${moodLabel} check-in details`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="rounded-2xl border border-border bg-surface overflow-hidden flex-row"
    >
      <View style={{ width: 4, backgroundColor: accent }} />
      <View className="flex-1 px-4 py-3.5">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline">
            <Text
              className="text-[10px] tracking-[2.5px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: accent,
              }}
            >
              Check-in
            </Text>
            <Text
              className="text-ink text-[10px] tracking-[2px] uppercase ml-2"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              · {moodLabel}
            </Text>
          </View>
          {timeChip(event.at)}
        </View>
        <Text
          className="text-ink text-[14px] leading-[20px] mt-2 italic"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={3}
        >
          &ldquo;{event.verseText}&rdquo;
        </Text>
        <Text
          className="text-ink-muted text-[11.5px] mt-2 tracking-[2px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {event.reference}
        </Text>

        {event.journalText && event.journalText.length > 0 && (
          <View
            className="mt-3 pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: hexAlpha(accent, 0.18),
            }}
          >
            <Text
              className="text-[10px] tracking-[2.5px] uppercase mb-1.5"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: accent,
              }}
            >
              Reflection
            </Text>
            <Text
              className="text-ink text-[13px] leading-[19px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              numberOfLines={4}
            >
              {event.journalText}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Milestone ──────────────────────────────────────────

function MilestoneCard({ event }: { event: MilestoneEvent }) {
  return (
    <View className="rounded-2xl border border-border overflow-hidden flex-row bg-accent-soft">
      <View className="flex-1 px-4 py-4">
        <View className="flex-row items-center">
          <FlameIcon />
          <Text
            className="text-ink text-[10px] tracking-[2.5px] uppercase ml-2"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: "#FFB672",
            }}
          >
            Milestone
          </Text>
        </View>
        <Text
          className="text-ink text-[16px] mt-1.5 tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {event.label}
        </Text>
        <Text
          className="text-ink-muted text-[12.5px] mt-1 leading-[18px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {event.copy}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Shared row scaffold — dot column + content
// ─────────────────────────────────────────────────────────────────

function DottedRow({
  dotColor,
  isLast,
  children,
}: {
  dotColor: string;
  isLast: boolean;
  children: React.ReactNode;
}) {
  const { bg } = useColors();
  return (
    <View style={{ flexDirection: "row" }} className={isLast ? "" : "pb-4"}>
      <View
        style={{
          width: 15,
          alignItems: "center",
          paddingTop: 8,
        }}
      >
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: dotColor,
            borderWidth: 2,
            borderColor: bg,
          }}
        />
      </View>
      <View className="flex-1 ml-3">{children}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────

function EmptyState() {
  const { ink } = useColors();
  return (
    <View className="px-6 mt-16 items-center">
      <View className="w-16 h-16 rounded-2xl bg-accent-soft border border-border items-center justify-center">
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={ink} strokeWidth={1.5} />
          <Path
            d="M12 8v4l3 2"
            stroke={ink}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text
        className="text-ink text-[18px] mt-5 text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Your journey starts soon
      </Text>
      <Text
        className="text-ink-muted text-[13.5px] mt-2 text-center leading-[20px] px-4"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Finish a sermon, mark a chapter, highlight a verse — anything
        you do will show up here, day by day.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Glyphs
// ─────────────────────────────────────────────────────────────────

function BookmarkIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h12v18l-6-4-6 4z"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill="#FFB672"
        stroke="#FFB672"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  // 12px chevron, rotates between down (collapsed) and up (open).
  // Drawn as a pure path so the rotation is just a transform on the
  // SVG container — cheap and keeps the row from re-laying out.
  const { inkSubtle } = useColors();
  return (
    <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 9l6 6 6-6"
          stroke={inkSubtle}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Same red used by the reader's inline note marker — keeping these
 * in lock-step so a "note" reads as the same color everywhere it
 * shows up in the product.
 */
const NOTE_RED = "#FF453A";

function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Append a 0–1 alpha to a 6-digit hex color (e.g. "#FFAA00", 0.2 →
 * "#FFAA0033"). Used for the mood-tinted divider on check-in cards
 * that have a journal reflection attached.
 */
function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}
