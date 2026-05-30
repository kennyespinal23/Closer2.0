import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { findBookById } from "@/constants/books";
import { SERMON_TYPES, type SermonType } from "@/constants/sermonTypes";
import { colors } from "@/constants/theme";
import { formatRef, relativeTime } from "@/lib/annotationsFormat";
import { useAnnotations } from "@/state/annotations";
import { didCompleteToday, useProgress } from "@/state/progress";

/**
 * Insights
 *
 * The "data" tab. Where Today is the day's moment and Library is the
 * archive, Insights is the user's reflection on their own rhythm:
 *
 *   • Total sermons completed
 *   • Whether today's already been honored
 *   • Per-type breakdown — which sermon types they keep coming back to,
 *     and which they haven't touched yet
 *
 * Account / settings deliberately live elsewhere (the profile sheet) —
 * this screen is only about the journey itself.
 */
export default function InsightsScreen() {
  const router = useRouter();
  const progress = useProgress();
  const completedToday = didCompleteToday(progress);
  const { streak, chaptersRead } = progress;
  const lastReadChapter = chaptersRead[chaptersRead.length - 1];

  const { allNotes, allHighlights, counts: annotationCounts } =
    useAnnotations();
  // Take the three most recent of each to surface as previews.
  const recentNotes = useMemo(() => allNotes().slice(0, 3), [allNotes]);
  const recentHighlights = useMemo(
    () => allHighlights().slice(0, 3),
    [allHighlights],
  );

  // Sort sermon types so the ones the user actually engages with rise
  // to the top. Untouched types still render — they're aspirational.
  const sortedTypes = useMemo(() => {
    return [...SERMON_TYPES].sort((a, b) => {
      const ca = progress.completionsByType[a.id] ?? 0;
      const cb = progress.completionsByType[b.id] ?? 0;
      if (cb !== ca) return cb - ca;
      return SERMON_TYPES.indexOf(a) - SERMON_TYPES.indexOf(b);
    });
  }, [progress.completionsByType]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2">
            <Text
              className="text-ink-subtle text-[12px] uppercase tracking-[2px]"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              Closer
            </Text>
            <Text
              className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] mt-2"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Insights
            </Text>
          </View>
        </FadeIn>

        {/* ─── Hero stat ───────────────────────────────────────────
            One number, given the room of an entire section. The total
            is what matters; everything below it is texture. */}
        <FadeIn delayMs={200} durationMs={900}>
          <View className="px-6 mt-10">
            <Text
              className="text-ink-subtle text-[11px] tracking-[3px] uppercase mb-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Your Rhythm
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-7">
              <Text
                className="text-ink text-[72px] leading-[72px] tracking-[-2px]"
                style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
              >
                {progress.totalCompletions}
              </Text>
              <Text
                className="text-ink-muted text-[14px] mt-1"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                {progress.totalCompletions === 1
                  ? "sermon completed"
                  : "sermons completed"}
              </Text>

              <View className="h-[1px] bg-border my-5" />

              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-3 ${
                    completedToday ? "bg-primary" : "bg-border-strong"
                  }`}
                />
                <Text
                  className="text-ink text-[14px]"
                  style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                >
                  {completedToday
                    ? "Today is honored."
                    : "Today is still waiting."}
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* ─── Streak ──────────────────────────────────────────
            Big current-streak number, longest-ever beneath it, and a
            seven-dot calendar mirror of the home-screen Journey card
            so the user has one consistent visual vocabulary for
            their rhythm. */}
        <FadeIn delayMs={350} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-subtle text-[11px] tracking-[3px] uppercase mb-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Streak
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-6">
              <View className="flex-row items-end">
                <Text
                  className="text-ink text-[56px] leading-[56px] tracking-[-1.5px]"
                  style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
                >
                  {streak.current}
                </Text>
                <Text
                  className="text-ink-muted text-[15px] ml-2 mb-1.5"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  {streak.current === 1 ? "day in a row" : "days in a row"}
                </Text>
              </View>
              <Text
                className="text-ink-subtle text-[12px] mt-1.5 tracking-[0.5px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {streak.longest > streak.current
                  ? `Best ever · ${streak.longest} days`
                  : streak.longest > 0
                    ? "A new personal best."
                    : "Day one is just a day away."}
              </Text>

              <View className="h-[1px] bg-border my-5" />

              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Last 7 days
              </Text>
              <View className="flex-row justify-between">
                {streak.lastSevenDays.map((day, i) => (
                  <MiniDot
                    key={day.dateISO}
                    engaged={day.engaged}
                    isToday={i === streak.lastSevenDays.length - 1}
                    label={shortWeekday(day.dateISO)}
                  />
                ))}
              </View>
            </View>
          </View>
        </FadeIn>

        {/* ─── Reading ─────────────────────────────────────────
            Tracks the chapter-mark-as-read side of engagement.
            Surfaces total chapters read and the most recent one
            so the user remembers where they last were. */}
        <FadeIn delayMs={500} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-subtle text-[11px] tracking-[3px] uppercase mb-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Reading
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-6">
              <View className="flex-row items-end">
                <Text
                  className="text-ink text-[44px] leading-[44px] tracking-[-1px]"
                  style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
                >
                  {chaptersRead.length}
                </Text>
                <Text
                  className="text-ink-muted text-[14px] ml-2 mb-1"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  {chaptersRead.length === 1
                    ? "chapter read"
                    : "chapters read"}
                </Text>
              </View>
              {lastReadChapter && (
                <View className="flex-row items-center mt-4">
                  <BookmarkIcon />
                  <Text
                    className="text-ink-muted text-[12.5px] ml-2"
                    style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                  >
                    Last read · {formatChapterRef(lastReadChapter)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </FadeIn>

        {/* ─── Highlights preview ──────────────────────────────
            Surfaces the most recent few; tap the card or "See all"
            to drill into the full /highlights screen. */}
        <FadeIn delayMs={600} durationMs={900}>
          <View className="px-6 mt-8">
            <SectionHeader
              title="Highlights"
              count={annotationCounts.highlights}
              onSeeAll={() => router.push("/highlights")}
            />
            {annotationCounts.highlights === 0 ? (
              <AnnotationEmpty
                copy="Tap any verse and pick a color — your highlights gather here."
                onPress={() => router.push("/highlights")}
              />
            ) : (
              <View className="rounded-3xl border border-border bg-surface overflow-hidden">
                {recentHighlights.map((h, i) => (
                  <Pressable
                    key={h.key}
                    onPress={() => router.push(`/book/${h.bookId}/${h.chapter}`)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                    className="flex-row items-stretch"
                  >
                    <View
                      style={{ width: 4, backgroundColor: h.color.swatch }}
                    />
                    <View className="flex-1 px-4 py-3.5">
                      <View className="flex-row items-baseline justify-between">
                        <Text
                          className="text-ink text-[13px]"
                          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                        >
                          {formatRef(h)}
                        </Text>
                        <Text
                          className="text-ink-subtle text-[11px]"
                          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                        >
                          {relativeTime(h.updatedAt)}
                        </Text>
                      </View>
                      {h.verseText ? (
                        <Text
                          className="text-ink-muted text-[12.5px] mt-1 leading-[18px]"
                          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                          numberOfLines={1}
                        >
                          &ldquo;{h.verseText}&rdquo;
                        </Text>
                      ) : null}
                    </View>
                    {i < recentHighlights.length - 1 && null}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </FadeIn>

        {/* ─── Notes preview ─────────────────────────────────── */}
        <FadeIn delayMs={650} durationMs={900}>
          <View className="px-6 mt-8">
            <SectionHeader
              title="Notes"
              count={annotationCounts.notes}
              onSeeAll={() => router.push("/notes")}
            />
            {annotationCounts.notes === 0 ? (
              <AnnotationEmpty
                copy="Tap any verse → Add note. Reflections collect here over time."
                onPress={() => router.push("/notes")}
              />
            ) : (
              <View className="rounded-3xl border border-border bg-surface overflow-hidden">
                {recentNotes.map((n, i) => (
                  // Multiple notes can share a verseKey now, so use
                  // the per-note id for React identity.
                  <View key={n.noteId}>
                    <Pressable
                      onPress={() =>
                        router.push(`/book/${n.bookId}/${n.chapter}`)
                      }
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.85 : 1,
                      })}
                      className="px-4 py-3.5"
                    >
                      <View className="flex-row items-baseline justify-between">
                        <Text
                          className="text-primary text-[10.5px] tracking-[2px] uppercase"
                          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                        >
                          {formatRef(n)}
                        </Text>
                        <Text
                          className="text-ink-subtle text-[11px]"
                          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                        >
                          {relativeTime(n.updatedAt)}
                        </Text>
                      </View>
                      <Text
                        className="text-ink text-[13.5px] mt-1.5 leading-[19px]"
                        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                        numberOfLines={2}
                      >
                        {n.text}
                      </Text>
                    </Pressable>
                    {i < recentNotes.length - 1 && (
                      <View className="h-[1px] bg-border ml-4" />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </FadeIn>

        {/* ─── Per-type breakdown ──────────────────────────────────
            A scannable list of all 10 sermon types with each one's
            completion count. Untouched types render at 0 with a muted
            row — they're an invitation, not a rebuke. */}
        <FadeIn delayMs={450} durationMs={900}>
          <View className="px-6 mt-10">
            <Text
              className="text-ink-subtle text-[11px] tracking-[3px] uppercase mb-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              By Sermon Type
            </Text>

            <View className="rounded-3xl border border-border bg-surface overflow-hidden">
              {sortedTypes.map((type, i) => {
                const count = progress.completionsByType[type.id] ?? 0;
                const isLast = i === sortedTypes.length - 1;
                return (
                  <TypeRow
                    key={type.id}
                    type={type}
                    count={count}
                    showDivider={!isLast}
                  />
                );
              })}
            </View>
          </View>
        </FadeIn>

        <FadeIn delayMs={750} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-muted text-[13px] leading-[20px] text-center"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              The point was never the streak.{"\n"}
              It was always the showing up.
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * A single row in the per-type breakdown.
 *
 * Hero thumbnail (left) — name + count copy (middle) — numeric
 * count (right). Rows are dim if the user has never opened that
 * type, so the list reads as a "filling in" rather than a leaderboard.
 */
function TypeRow({
  type,
  count,
  showDivider,
}: {
  type: SermonType;
  count: number;
  showDivider: boolean;
}) {
  const touched = count > 0;
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
          style={{
            backgroundColor: touched
              ? `${type.accent}1F` // ~12% accent fill
              : "rgba(255, 255, 255, 0.03)",
          }}
        >
          <Image
            source={type.hero}
            style={{
              width: 40,
              height: 36,
              opacity: touched ? 1 : 0.4,
            }}
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 pr-3">
          <Text
            className={`text-[14px] ${touched ? "text-ink" : "text-ink-muted"}`}
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            numberOfLines={1}
          >
            {type.name}
          </Text>
          <Text
            className="text-ink-subtle text-[11.5px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={1}
          >
            {touched
              ? `${count} ${count === 1 ? "completion" : "completions"}`
              : "Not yet visited"}
          </Text>
        </View>

        <Text
          className={`text-[18px] ${touched ? "text-ink" : "text-ink-subtle"}`}
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: touched ? type.accent : undefined,
          }}
        >
          {count}
        </Text>
      </View>
      {showDivider && <View className="h-[1px] bg-border ml-20" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Streak section bits
// ─────────────────────────────────────────────────────────────────

/**
 * A smaller, more compact dot used inside the Streak card. Visually
 * related to the home screen's DayDot but slimmer so the streak card
 * can fit number + 7 dots without becoming a tower.
 */
function MiniDot({
  engaged,
  isToday,
  label,
}: {
  engaged: boolean;
  isToday: boolean;
  label: string;
}) {
  return (
    <View className="items-center">
      <View
        className={`w-6 h-6 rounded-full items-center justify-center ${
          engaged
            ? "bg-primary"
            : isToday
              ? "border border-primary"
              : "border border-border-strong"
        }`}
      />
      <Text
        className={`text-[9.5px] mt-2 ${
          isToday ? "text-primary" : "text-ink-subtle"
        }`}
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {label}
      </Text>
    </View>
  );
}

function BookmarkIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h12v17l-6-4-6 4z"
        stroke={colors.inkMuted}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Eyebrow row shared by the Highlights / Notes preview sections.
 * Title on the left, optional count badge in the middle, "See all"
 * on the right. The whole row is tappable when `onSeeAll` is given.
 */
function SectionHeader({
  title,
  count,
  onSeeAll,
}: {
  title: string;
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-baseline justify-between mb-3">
      <View className="flex-row items-baseline">
        <Text
          className="text-ink-subtle text-[11px] tracking-[3px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        {typeof count === "number" && count > 0 && (
          <Text
            className="text-ink-muted text-[12px] ml-2"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {count}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text
            className="text-primary text-[12px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            See all
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Compact empty-state card used by both annotation previews when
 * the user hasn't created any yet. Tapping still routes through to
 * the full screen so its richer empty state takes over.
 */
function AnnotationEmpty({
  copy,
  onPress,
}: {
  copy: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="rounded-2xl border border-border bg-surface px-5 py-5"
    >
      <Text
        className="text-ink-muted text-[13px] leading-[19px]"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        {copy}
      </Text>
    </Pressable>
  );
}

function shortWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
}

function formatChapterRef(c: { bookId: string; chapter: number }): string {
  const book = findBookById(c.bookId);
  return book ? `${book.name} ${c.chapter}` : `${c.bookId} ${c.chapter}`;
}
