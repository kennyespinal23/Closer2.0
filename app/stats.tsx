import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import Svg, { Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import { FadeIn } from "@/components/FadeIn";
import { findBookById } from "@/constants/books";
import { SERMON_TYPES, type SermonType } from "@/constants/sermonTypes";
import { formatRef, relativeTime } from "@/lib/annotationsFormat";
import { useAnnotations } from "@/state/annotations";
import { didCompleteToday, useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * Your Practice — the personal rhythm / stats view.
 *
 * Used to live as the "Insights" tab; relocated here so the bottom
 * Insights tab can host the new content library (articles, devotionals).
 * Reached from the Profile drawer.
 *
 * What's on this screen:
 *   • Total sermons completed (hero)
 *   • Current/longest streak + 7-day strip
 *   • Reading totals + last-read chapter
 *   • Recent highlights / notes previews
 *   • Per-type sermon breakdown
 *
 * The body is intentionally unchanged from the prior Insights tab —
 * users who built equity in this view continue to see the same data,
 * just with a back chevron + new title instead of a tab eyebrow.
 */
export default function StatsScreen() {
  const router = useRouter();
  const progress = useProgress();
  const completedToday = didCompleteToday(progress);
  const { streak, chaptersRead } = progress;
  const lastReadChapter = chaptersRead[chaptersRead.length - 1];

  const { allNotes, allHighlights, counts: annotationCounts } =
    useAnnotations();
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
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ─── Top bar ───────────────────────────────────────────
          Back chevron + centered title. Mirrors SettingsScaffold so
          this drill-down feels consistent with the other drawer
          destinations (Notifications, Translation, etc.). */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => goBackOr(router, "/(tabs)/profile")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <BackChevronIcon />
        </Pressable>
        <Text
          className="text-ink text-[17px] flex-1 text-center"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Your Practice
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero stat ─────────────────────────────────────── */}
        <FadeIn delayMs={150} durationMs={900}>
          <View className="px-6 mt-3">
            <Text
              className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Your Rhythm
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-7">
              <Text
                className="text-ink text-[72px] leading-[72px] tracking-[-2px]"
                style={{ fontFamily: "System", fontWeight: "800" }}
              >
                {progress.totalCompletions}
              </Text>
              <Text
                className="text-ink-muted text-[14px] mt-1"
                style={{ fontFamily: "System", fontWeight: "500" }}
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
                  style={{ fontFamily: "System", fontWeight: "600" }}
                >
                  {completedToday
                    ? "Today is honored."
                    : "Today is still waiting."}
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* ─── Streak ────────────────────────────────────────── */}
        <FadeIn delayMs={300} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Streak
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-6">
              <View className="flex-row items-end">
                <Text
                  className="text-ink text-[56px] leading-[56px] tracking-[-1.5px]"
                  style={{ fontFamily: "System", fontWeight: "800" }}
                >
                  {streak.current}
                </Text>
                <Text
                  className="text-ink-muted text-[15px] ml-2 mb-1.5"
                  style={{ fontFamily: "System", fontWeight: "500" }}
                >
                  {streak.current === 1 ? "day in a row" : "days in a row"}
                </Text>
              </View>
              <Text
                className="text-ink-muted text-[12px] mt-1.5 tracking-[0.5px]"
                style={{ fontFamily: "System", fontWeight: "600" }}
              >
                {streak.longest > streak.current
                  ? `Best ever · ${streak.longest} days`
                  : streak.longest > 0
                    ? "A new personal best."
                    : "Day one is just a day away."}
              </Text>

              <View className="h-[1px] bg-border my-5" />

              <Text
                className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
                style={{ fontFamily: "System", fontWeight: "700" }}
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

        {/* ─── Reading ───────────────────────────────────────── */}
        <FadeIn delayMs={450} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Reading
            </Text>
            <View className="rounded-3xl border border-border bg-surface px-6 py-6">
              <View className="flex-row items-end">
                <Text
                  className="text-ink text-[44px] leading-[44px] tracking-[-1px]"
                  style={{ fontFamily: "System", fontWeight: "800" }}
                >
                  {chaptersRead.length}
                </Text>
                <Text
                  className="text-ink-muted text-[14px] ml-2 mb-1"
                  style={{ fontFamily: "System", fontWeight: "500" }}
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
                    className="text-ink-muted text-[13px] ml-2"
                    style={{ fontFamily: "System", fontWeight: "500" }}
                  >
                    Last read · {formatChapterRef(lastReadChapter)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </FadeIn>

        {/* ─── Highlights preview ────────────────────────────── */}
        <FadeIn delayMs={550} durationMs={900}>
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
                {recentHighlights.map((h) => (
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
                          style={{ fontFamily: "System", fontWeight: "700" }}
                        >
                          {formatRef(h)}
                        </Text>
                        <Text
                          className="text-ink-muted text-[11px]"
                          style={{ fontFamily: "System", fontWeight: "500" }}
                        >
                          {relativeTime(h.updatedAt)}
                        </Text>
                      </View>
                      {h.verseText ? (
                        <Text
                          className="text-ink-muted text-[13px] mt-1 leading-[18px]"
                          style={{ fontFamily: "System", fontWeight: "400" }}
                          numberOfLines={1}
                        >
                          &ldquo;{h.verseText}&rdquo;
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </FadeIn>

        {/* ─── Notes preview ─────────────────────────────────── */}
        <FadeIn delayMs={600} durationMs={900}>
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
                          className="text-primary text-[11px] tracking-[1px] uppercase"
                          style={{ fontFamily: "System", fontWeight: "700" }}
                        >
                          {formatRef(n)}
                        </Text>
                        <Text
                          className="text-ink-muted text-[11px]"
                          style={{ fontFamily: "System", fontWeight: "500" }}
                        >
                          {relativeTime(n.updatedAt)}
                        </Text>
                      </View>
                      <Text
                        className="text-ink text-[13px] mt-1.5 leading-[19px]"
                        style={{ fontFamily: "System", fontWeight: "500" }}
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

        {/* ─── Per-type breakdown ────────────────────────────── */}
        <FadeIn delayMs={650} durationMs={900}>
          <View className="px-6 mt-8">
            <Text
              className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
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
              style={{ fontFamily: "System", fontWeight: "400" }}
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

// ─────────────────────────────────────────────────────────────────
// Per-type row (unchanged from the prior Insights tab)
// ─────────────────────────────────────────────────────────────────

function TypeRow({
  type,
  count,
  showDivider,
}: {
  type: SermonType;
  count: number;
  showDivider: boolean;
}) {
  const colors = useColors();
  const touched = count > 0;
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
          style={{
            // Untouched tile gets a near-transparent ink wash so it
            // reads as "empty" in both themes (white-only fills
            // disappear on the light theme's near-white surface).
            backgroundColor: touched
              ? `${type.accent}1F`
              : `${colors.ink}0A`,
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
            style={{ fontFamily: "System", fontWeight: "600" }}
            numberOfLines={1}
          >
            {type.name}
          </Text>
          <Text
            className="text-ink-muted text-[12px] mt-0.5"
            style={{ fontFamily: "System", fontWeight: "500" }}
            numberOfLines={1}
          >
            {touched
              ? `${count} ${count === 1 ? "completion" : "completions"}`
              : "Not yet visited"}
          </Text>
        </View>

        <Text
          className={`text-[18px] ${touched ? "text-ink" : "text-ink-muted"}`}
          style={{
            fontFamily: "System",
            fontWeight: "700",
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
// Streak strip dots
// ─────────────────────────────────────────────────────────────────

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
        className={`text-[11px] mt-2 ${
          isToday ? "text-primary" : "text-ink-muted"
        }`}
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        {label}
      </Text>
    </View>
  );
}

function BookmarkIcon() {
  const colors = useColors();
  return (
    <SFSymbol
      name="bookmark"
      size={12}
      color={colors.inkMuted}
      weight="medium"
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Highlights / Notes preview helpers
// ─────────────────────────────────────────────────────────────────

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
          className="text-ink-muted text-[11px] tracking-[1px] uppercase"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          {title}
        </Text>
        {typeof count === "number" && count > 0 && (
          <Text
            className="text-ink-muted text-[12px] ml-2"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            {count}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text
            className="text-primary text-[12px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            See all
          </Text>
        </Pressable>
      )}
    </View>
  );
}

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
        style={{ fontFamily: "System", fontWeight: "400" }}
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

function BackChevronIcon() {
  const colors = useColors();
  return (
    <SFSymbol name="chevron.left" size={17} color={colors.ink} weight="semibold" />
  );
}
