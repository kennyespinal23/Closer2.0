import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { findBookById } from "@/constants/books";
import {
  getTodaysReading,
  getTodaysReadingIndex,
  READING_PLAN_LENGTH,
} from "@/constants/reading";
import { colors } from "@/constants/theme";
import { TODAYS_SERMON } from "@/constants/sermon";
import { getTodaysSermonType, type SermonType } from "@/constants/sermonTypes";
import { useAnnotations } from "@/state/annotations";
import { useCheckIns } from "@/state/checkIns";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";

// Sermon meta lives in `constants/sermon.ts` so the home card and
// the sermon flow stay in sync. Reading is real (constants/reading.ts).

export default function TodayScreen() {
  const router = useRouter();
  const { answers, reset: resetOnboarding } = useOnboarding();
  const { reset: resetPreferences } = usePreferences();
  const { reset: resetAnnotations } = useAnnotations();
  const { reset: resetCheckIns } = useCheckIns();
  const { reset: resetReadingGoal } = useReadingGoal();
  const progress = useProgress();
  const {
    streak,
    hasReadChapter,
    lastVisited,
    hasCompletedSermonToday,
  } = progress;
  const {
    todayMinutes: readingMinutes,
    goalMinutes: readingGoal,
    reachedToday: readingGoalReached,
  } = useReadingGoal();

  const greeting = useMemo(() => getGreeting(), []);
  const todaysDate = useMemo(() => formatDate(new Date()), []);
  const firstName = (answers.name || "").trim().split(" ")[0] || "friend";
  const sermonType = useMemo(() => getTodaysSermonType(), []);

  // Today's curated chapter and its book metadata. We surface the
  // position in the 30-day rotation ("Day X of 30") so the section
  // reads as a real challenge rather than a one-off recommendation.
  const todaysReading = useMemo(() => getTodaysReading(), []);
  const todaysReadingDay = useMemo(() => getTodaysReadingIndex() + 1, []);
  const readingBook = findBookById(todaysReading.bookId);
  const readingDone = hasReadChapter(
    todaysReading.bookId,
    todaysReading.chapter,
  );

  // "Continue reading" — surface the most recent reader visit so the
  // user can pick up exactly where they left off. We only show it
  // when the visit is fresh AND there's actually something to
  // continue: either the visited chapter isn't done yet, OR there's
  // a next chapter to roll into. Hidden when it would coincide with
  // today's curated reading (avoids two cards saying the same thing).
  const continueReading = useMemo(
    () => computeContinueReading(lastVisited, hasReadChapter, todaysReading),
    [lastVisited, hasReadChapter, todaysReading],
  );

  const handlePlaySermon = () => {
    router.push("/sermon/intro");
  };

  const handleOpenReading = () => {
    router.push(`/book/${todaysReading.bookId}/${todaysReading.chapter}`);
  };

  const handleContinueReading = () => {
    if (!continueReading) return;
    router.push(
      `/book/${continueReading.bookId}/${continueReading.chapter}`,
    );
  };

  const handleOpenProfile = () => {
    // Presented modally from the root stack — see app/_layout.tsx.
    router.push("/profile");
  };

  const handleResetApp = () => {
    // Dev shortcut: wipe ALL persisted state (onboarding, progress,
    // annotations, preferences, check-ins — both in-memory and on
    // disk) and drop the user back at the welcome screen, mimicking
    // a fresh install. Each provider's reset() also calls
    // removeKey() so AsyncStorage is purged.
    resetOnboarding();
    progress.reset();
    resetAnnotations();
    resetPreferences();
    resetCheckIns();
    resetReadingGoal();
    router.replace("/");
  };

  const handleRestartApp = () => {
    // Sibling of handleResetApp — clears state but jumps STRAIGHT into
    // the onboarding flow instead of stopping at the welcome screen.
    // Useful when iterating on onboarding copy/visuals without having
    // to tap through the welcome page every time.
    resetOnboarding();
    progress.reset();
    resetAnnotations();
    resetPreferences();
    resetCheckIns();
    resetReadingGoal();
    router.replace("/onboarding/name");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        // Floating glass tab bar sits over the screen — pad the bottom
        // of the scroll so the last sections aren't hidden beneath it.
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header: profile avatar (left), greeting below ───────
            Profile lives in a presented modal — see app/profile.tsx.
            The avatar sits alone in its row so the greeting can use
            the full content width on the line beneath it. */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2">
            <View className="flex-row items-center">
              <Pressable
                hitSlop={12}
                onPress={handleOpenProfile}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="w-10 h-10 rounded-full bg-accent-soft border border-border items-center justify-center"
              >
                <Text
                  className="text-primary text-[14px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </Pressable>
            </View>

            <View className="mt-5">
              <Text
                className="text-ink-subtle text-[12px] uppercase tracking-[2px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {todaysDate}
              </Text>
              <Text
                className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] mt-2"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {greeting}, {firstName}.
              </Text>

              {/* Week date strip — the user's last 7 days at a
                  glance. Each cell shows the weekday letter + date
                  number; filled cells are days they completed a
                  sermon (the only thing that advances the streak).
                  Today is always the rightmost cell with a primary
                  ring around it whether or not it's been honored. */}
              <WeekStrip
                days={streak.lastSevenDays}
                streakCurrent={streak.current}
                honoredToday={streak.honoredToday}
                copy={streakCopy(streak)}
              />
            </View>
          </View>
        </FadeIn>

        {/* ─── Reading ring hero ──────────────────────────────────
            Apple-Fitness-style activity-ring card showing the user's
            daily reading-minutes goal. Sits at the top of the page
            content (after the week strip) as the day's pulse — one
            glance tells you whether you've spent your moments with
            Scripture today. Tap drills into the goal settings, same
            as the Profile-drawer link. */}
        <FadeIn delayMs={120} durationMs={800}>
          <View className="px-6 mt-7">
            <ReadingRingCard
              minutes={readingMinutes}
              goal={readingGoal}
              reached={readingGoalReached}
              onPress={() => router.push("/settings/reading-goal")}
            />
          </View>
        </FadeIn>

        {/* ─── Continue reading ────────────────────────────────────
            Slim, low-chrome card that only appears when there's a
            real "where I left off" to surface. Sits ABOVE the sermon
            so it's the first thing someone reaching back into the
            app sees, but stays visually quieter than the sermon card. */}
        {continueReading && (
          <FadeIn delayMs={200} durationMs={800}>
            <View className="px-6 mt-5">
              <ContinueReadingCard
                reference={continueReading.reference}
                hint={continueReading.hint}
                onPress={handleContinueReading}
              />
            </View>
          </FadeIn>
        )}

        {/* ─── Today's Sermon — the daily anchor ───────────────── */}
        <FadeIn delayMs={250} durationMs={900}>
          <View className="px-6 mt-9">
            <Text
              className="text-primary text-[11px] tracking-[3px] uppercase mb-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Today&apos;s Sermon
            </Text>

            <SermonCard
              type={sermonType}
              title={TODAYS_SERMON.title}
              subtitle={TODAYS_SERMON.subtitle}
              pastor={TODAYS_SERMON.pastor}
              durationMin={TODAYS_SERMON.durationMin}
              completed={hasCompletedSermonToday}
              onPress={handlePlaySermon}
            />
          </View>
        </FadeIn>

        {/* ─── Daily Reading Challenge ──────────────────────────
            The 30-day Scripture rotation. The section header carries
            both the name of the challenge AND today's position in
            the cycle ("Day 12 · 30-day rotation"), so the user
            understands what they're being invited into. Tapping the
            card opens the chapter in the reader; marking as read
            there counts toward streak + flips the card into a "Done
            for today" state. */}
        <FadeIn delayMs={400} durationMs={900}>
          <View className="px-6 mt-7">
            <View className="flex-row items-baseline justify-between mb-3">
              <Text
                className="text-primary text-[11px] tracking-[3px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Reading Challenge
              </Text>
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                Day {todaysReadingDay} · {READING_PLAN_LENGTH}-day rotation
              </Text>
            </View>

            <ReadingCard
              reference={
                readingBook
                  ? `${readingBook.name} ${todaysReading.chapter}`
                  : `${todaysReading.bookId} ${todaysReading.chapter}`
              }
              invitation={todaysReading.invitation}
              done={readingDone}
              dayIndex={todaysReadingDay}
              totalDays={READING_PLAN_LENGTH}
              onPress={handleOpenReading}
            />
          </View>
        </FadeIn>

        {/* Weekly rhythm lives at the top of the screen woven into
            the greeting (see WeekStrip). Verse of the Day and Quick
            Actions were intentionally removed during the home-screen
            declutter pass — the daily anchor is the sermon + reading
            challenge above; mood check-ins handle "I want a verse
            right now"; the bottom tab bar covers library/journey
            navigation. */}

        {/* ─── Dev tools ────────────────────────────────────────────
            Gated behind __DEV__ so the entire subtree is stripped from
            production builds automatically.

              • Reset App   — clears state, lands at welcome screen.
              • Restart App — clears state, jumps straight into the
                              onboarding flow (skips welcome).
        */}
        {__DEV__ && (
          <FadeIn delayMs={1100} durationMs={700}>
            <View className="px-6 mt-12 items-center">
              <Text
                className="text-ink-subtle text-[10px] tracking-[3px] uppercase mb-3"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Dev
              </Text>
              <View className="flex-row items-center gap-3">
                <DevPill
                  icon={<ResetIcon />}
                  label="Reset App"
                  onPress={handleResetApp}
                />
                <DevPill
                  icon={<RestartIcon />}
                  label="Restart App"
                  onPress={handleRestartApp}
                />
              </View>
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// ReadingRingCard — Apple-Fitness-style hero for the daily goal
// ─────────────────────────────────────────────────────────────────

/**
 * Hero card showing reading-minutes progress as a circular ring on
 * the left, with a calorie-card-style title + metric on the right.
 *
 * Visual language is borrowed directly from Apple Fitness's
 * "Activity Ring" card — bold ring on the left, glanceable metric
 * and label on the right, plus a little arrow tipping along the
 * arc that gives the ring a sense of motion. Tap drills into the
 * goal-detail screen for tuning the daily target.
 *
 * Three visual states:
 *   • Untouched (0 min)  — quiet, encouraging copy
 *   • In progress        — accent-orange ring, motion arrow
 *   • Reached            — ring fills to white (primary) + a small
 *                          "checkmark" replaces the motion arrow
 */
function ReadingRingCard({
  minutes,
  goal,
  reached,
  onPress,
}: {
  minutes: number;
  goal: number;
  reached: boolean;
  onPress: () => void;
}) {
  const pct = goal > 0 ? Math.min(1, minutes / goal) : 0;
  const minutesLabel = formatMinutes(minutes);
  const remainingLabel = formatRemaining(minutes, goal, reached);

  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-border bg-surface px-5 py-5"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View className="flex-row items-center">
        <ActivityRing pct={pct} reached={reached} size={96} stroke={12} />
        <View className="flex-1 ml-5">
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Drawing Near
          </Text>
          <View className="flex-row items-baseline mt-1.5">
            <Text
              className="text-ink text-[28px] leading-[28px] tracking-[-0.6px]"
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                color: reached ? colors.ink : RING_ACCENT,
              }}
            >
              {minutesLabel}
            </Text>
            <Text
              className="text-ink-muted text-[13px] ml-1.5"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              / {goal} MIN
            </Text>
          </View>
          <Text
            className="text-ink-muted text-[12.5px] mt-1.5 leading-[18px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={2}
          >
            {remainingLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The reading-goal accent color — a warm amber that matches the
 * flame icon in the WeekStrip, so the ring and the streak flames
 * read as one "your effort" color story rather than two separate
 * accents fighting for attention.
 */
const RING_ACCENT = "#FFB672";

/**
 * Apple-Fitness-style activity ring.
 *
 * Two stacked stroked circles:
 *   • Track — full circle in a dim border color, the "missed" arc
 *   • Fill  — partial circle (length = pct * circumference) drawn in
 *             accent or primary, with rounded ends so the head of
 *             the arc reads as a tip, not a hard chop
 *
 * A tiny indicator (arrow for in-progress, checkmark for reached)
 * sits at the END of the arc, mirroring Apple Fitness' ring head
 * marker. We compute its angular position from `pct` and place it
 * on the ring's center line so it always reads as "where you are".
 *
 * SVG is rotated -90° around the center so 0° starts at 12-o'clock
 * (the natural mental model for "the top of the ring"). Without the
 * rotation, fills would start at 3-o'clock.
 */
function ActivityRing({
  pct,
  reached,
  size,
  stroke,
}: {
  pct: number;
  reached: boolean;
  size: number;
  stroke: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  // strokeDasharray = [filled, gap]. Floor a hairline so the
  // rounded cap is still visible at 0% (looks like the ring's
  // starting nub) — pure 0 would render nothing.
  const filled = Math.max(circumference * 0.001, circumference * pct);
  const accent = reached ? colors.ink : RING_ACCENT;

  // Position of the head/tip of the arc — used to drop the small
  // indicator icon. 12-o'clock at pct=0 → moving clockwise.
  const tipAngle = -90 + 360 * pct;
  const tipRad = (tipAngle * Math.PI) / 180;
  const tipX = cx + r * Math.cos(tipRad);
  const tipY = cy + r * Math.sin(tipRad);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track — the unfilled portion of the ring. Drawn at a
            slight opacity so it shows the missed arc without
            yelling about it. */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Filled arc — rotated so 0% starts at 12-o'clock. */}
        <G originX={cx} originY={cy} rotation={-90}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </G>

        {/* Tip indicator — sits at the leading edge of the arc.
            Apple Fitness uses a small white arrow inside a colored
            disc; we mirror that for in-progress and switch to a
            check glyph when the goal is reached. The whole thing is
            wrapped in a Path-positioned group so it tracks the arc. */}
        <G>
          <Circle
            cx={tipX}
            cy={tipY}
            r={stroke / 2 + 1}
            fill={accent}
          />
          {reached ? (
            <Path
              d={`M ${tipX - 3.2} ${tipY + 0.2} L ${tipX - 0.8} ${tipY + 2.6} L ${tipX + 3.4} ${tipY - 2}`}
              stroke={colors.bg}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Path
              d={`M ${tipX - 2.4} ${tipY - 0.4} L ${tipX + 1.2} ${tipY - 0.4} M ${tipX - 0.6} ${tipY - 2.2} L ${tipX + 1.6} ${tipY - 0.4} L ${tipX - 0.6} ${tipY + 1.4}`}
              stroke={colors.bg}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </G>
      </Svg>
    </View>
  );
}

/**
 * Show today's accumulated minutes as a clean integer when ≥ 1, or
 * "M:SS" with seconds when still under a minute / fractional, so
 * the number feels alive in the early moments of a reading session.
 */
function formatMinutes(m: number): string {
  if (m <= 0) return "0";
  if (m < 1) {
    const seconds = Math.round(m * 60);
    return `0:${String(seconds).padStart(2, "0")}`;
  }
  const whole = Math.floor(m);
  const seconds = Math.round((m - whole) * 60);
  if (seconds === 0) return String(whole);
  return `${whole}:${String(seconds).padStart(2, "0")}`;
}

/**
 * One-liner that contextualizes the metric — encouraging at 0,
 * specific in the middle, celebratory once reached.
 */
function formatRemaining(minutes: number, goal: number, reached: boolean): string {
  if (reached) return "Today's reading goal honored.";
  if (minutes <= 0) {
    return `Spend ${goal} minutes near Scripture today.`;
  }
  const remaining = Math.max(0, goal - minutes);
  if (remaining < 1) return "Less than a minute to today's goal.";
  const rounded = Math.ceil(remaining);
  return `${rounded} ${rounded === 1 ? "minute" : "minutes"} to today's goal.`;
}

// ─────────────────────────────────────────────────────────────────
// SermonCard — the visual anchor of the home screen
// ─────────────────────────────────────────────────────────────────

type SermonCardProps = {
  type: SermonType;
  title: string;
  subtitle: string;
  pastor: string;
  durationMin: number;
  /** True once the user has finished today's sermon. Flips the card
   *  into a "Completed · Read again" state — same content, different
   *  affordance. */
  completed: boolean;
  onPress: () => void;
};

function SermonCard({
  type,
  title,
  subtitle,
  pastor,
  durationMin,
  completed,
  onPress,
}: SermonCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl overflow-hidden border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/* Hero strip — the sermon type's icon with a per-type accent glow.
          The hero PNG bg matches bg-surface so it blends seamlessly. */}
      <View className="h-40 w-full overflow-hidden items-center justify-center">
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CardAccentGlow color={type.accent} />
        </View>

        <Image
          source={type.hero}
          style={{ width: 130, height: 110 }}
          resizeMode="contain"
        />

        <View className="absolute top-4 left-5">
          <Text
            className="text-[10px] tracking-[3px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: type.accent,
            }}
          >
            {type.name}
          </Text>
        </View>

        {/* Completed badge — top-right of the hero strip so it
            doesn't fight with the type label on the left. Hidden
            until the user actually finishes today's sermon. */}
        {completed && (
          <View className="absolute top-4 right-5">
            <CompletedBadge />
          </View>
        )}
      </View>

      {/* Body */}
      <View className="px-5 pt-5 pb-5">
        <Text
          className="text-ink text-[22px] leading-[28px] tracking-[-0.3px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        <Text
          className="text-ink-muted text-[14px] leading-[20px] mt-2"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {subtitle}
        </Text>

        <View className="flex-row items-center justify-between mt-5">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="w-7 h-7 rounded-full bg-accent-soft items-center justify-center mr-3">
              <Text
                className="text-primary text-[12px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {pastor
                  .split(" ")
                  .slice(-1)[0]
                  .charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-ink text-[13px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                numberOfLines={1}
              >
                {pastor}
              </Text>
              <Text
                className="text-ink-subtle text-[12px] mt-0.5"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                {completed ? `Heard today · ${durationMin} min` : `${durationMin} min listen`}
              </Text>
            </View>
          </View>

          {completed ? <ReadAgainPill /> : <PlayPill />}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Pill-shaped "Completed" tag that appears in the corner of the
 * sermon hero once today's sermon has been finished. Subtle, calm —
 * gives recognition without celebration (the celebration screen
 * already handled that).
 */
function CompletedBadge() {
  return (
    <View
      className="flex-row items-center px-2.5 py-1 rounded-full border"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.18)",
      }}
    >
      <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 12l5 5L20 7"
          stroke={colors.ink}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink text-[10px] tracking-[2px] uppercase ml-1.5"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Heard
      </Text>
    </View>
  );
}

/**
 * "Read again" CTA — visually quieter than the primary PlayPill so
 * the completed state feels like a calm secondary action rather
 * than the bold first-listen invitation. Border + ghost background
 * instead of the white-on-black PlayPill.
 */
function ReadAgainPill() {
  return (
    <View
      className="rounded-full flex-row items-center pl-3 pr-4 py-2"
      style={{
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.borderStrong,
      }}
    >
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 9V4M4 9h5M20 15v5M20 15h-5"
          stroke={colors.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M19 9a7 7 0 00-13-1M5 15a7 7 0 0013 1"
          stroke={colors.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Read again
      </Text>
    </View>
  );
}

/**
 * Wide elliptical glow tinted to the sermon type's accent color.
 * Sits behind the hero in the card's top strip and gives each day's
 * card a unique mood without overwhelming the surrounding UI.
 */
function CardAccentGlow({ color }: { color: string }) {
  return (
    <Svg width={360} height={180} viewBox="0 0 360 180">
      <Defs>
        <RadialGradient id="cardGlow" cx="50%" cy="50%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.04} />
          <Stop offset="100%" stopColor="#0F0F0F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={360} height={180} fill="url(#cardGlow)" />
    </Svg>
  );
}

function PlayPill() {
  return (
    <View className="bg-primary rounded-full flex-row items-center pl-3 pr-4 py-2">
      <Svg width={12} height={12} viewBox="0 0 24 24" fill={colors.primaryFg}>
        <Path d="M6 4l14 8-14 8z" />
      </Svg>
      <Text
        className="text-primary-fg text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Begin
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// ReadingCard — the Daily Reading Challenge hero, sits beneath the
// sermon as the second daily anchor
// ─────────────────────────────────────────────────────────────────

function ReadingCard({
  reference,
  invitation,
  done,
  dayIndex,
  totalDays,
  onPress,
}: {
  reference: string;
  invitation: string;
  done: boolean;
  /** 1-based position of today's reading in the rotation. */
  dayIndex: number;
  /** Total length of the rotation (i.e. 30). */
  totalDays: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View className="flex-row items-center px-5 pt-5 pb-4">
        <View className="w-12 h-12 rounded-2xl bg-accent-soft items-center justify-center mr-4">
          <ScriptureIcon />
        </View>
        <View className="flex-1 pr-3">
          <Text
            className="text-ink text-[18px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {reference}
          </Text>
          <Text
            className="text-ink-muted text-[12.5px] mt-1 leading-[18px]"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={2}
          >
            {invitation}
          </Text>
        </View>
        {done ? (
          <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12l5 5L20 7"
                stroke={colors.primaryFg}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : (
          <View className="w-8 h-8 rounded-full border border-border-strong items-center justify-center">
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 6l6 6-6 6"
                stroke={colors.ink}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
      </View>

      {/* Rotation progress — a row of N small ticks, the first
          `dayIndex` filled. Communicates progress through the cycle
          at a glance and gives the section its "challenge" feel. */}
      <View className="px-5 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Progress through rotation
          </Text>
          <Text
            className="text-ink-muted text-[10.5px]"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {dayIndex}/{totalDays}
          </Text>
        </View>
        <RotationBar
          dayIndex={dayIndex}
          totalDays={totalDays}
          done={done}
        />
        {done ? (
          <Text
            className="text-ink-muted text-[11.5px] mt-2.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            Today&apos;s reading is done. Tap to revisit.
          </Text>
        ) : (
          <Text
            className="text-ink-muted text-[11.5px] mt-2.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            A new chapter, every day. One sitting is enough.
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Slim row of 30 ticks visualizing position in the reading
 * rotation. The first `dayIndex` ticks are filled; today's tick is
 * accented (green-tinted when done, primary white otherwise). Pure
 * Views — no SVG — so it scales cleanly with the card width.
 */
function RotationBar({
  dayIndex,
  totalDays,
  done,
}: {
  dayIndex: number;
  totalDays: number;
  done: boolean;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 3 }}>
      {Array.from({ length: totalDays }).map((_, i) => {
        const isPast = i < dayIndex - 1;
        const isToday = i === dayIndex - 1;
        let bg: string = colors.border;
        if (isPast) bg = colors.borderStrong;
        if (isToday) bg = done ? "#7BD389" : colors.primary;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: isToday ? 6 : 4,
              borderRadius: 3,
              backgroundColor: bg,
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// DayDot — used in the weekly journey tracker
// ─────────────────────────────────────────────────────────────────

/**
 * Compact 7-day strip surfaced just under the greeting.
 *
 * Each cell stacks: weekday letter → date number circle. Cells the
 * user "honored" (advanced their streak by completing a sermon) are
 * solid primary; cells with no engagement are a quiet outline.
 * Today is always the rightmost cell and gets a primary ring on top
 * of whatever fill state it has, so it reads as "you are here".
 *
 * The header row above the cells shows:
 *   • a flame chip with the current streak count (only when > 0)
 *   • a "N / 7 this week" tally on the right
 *
 * One quiet line of encouraging copy sits underneath. Both copy and
 * the flame chip come straight from the existing streak helpers, so
 * we keep one source of truth for streak language across the app.
 */
function WeekStrip({
  days,
  streakCurrent,
  honoredToday,
  copy,
}: {
  days: ReadonlyArray<{ dateISO: string; engaged: boolean }>;
  streakCurrent: number;
  honoredToday: boolean;
  copy: string;
}) {
  const completedCount = days.filter((d) => d.engaged).length;

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between mb-3">
        {streakCurrent > 0 ? (
          <View className="flex-row items-center px-3 py-1.5 rounded-full bg-accent-soft border border-border">
            <FlameIcon active />
            <Text
              className="text-ink text-[12px] ml-1.5"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {streakCurrent}-day streak
            </Text>
            {honoredToday && (
              <Text
                className="text-ink-subtle text-[11px] ml-2"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                · today
              </Text>
            )}
          </View>
        ) : (
          <View />
        )}
        <Text
          className="text-ink-subtle text-[11px] tracking-[1.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {completedCount}/7 this week
        </Text>
      </View>

      <View className="flex-row justify-between">
        {days.map((day, i) => (
          <DayDateCell
            key={day.dateISO}
            dateISO={day.dateISO}
            engaged={day.engaged}
            isToday={i === days.length - 1}
          />
        ))}
      </View>

      <Text
        className="text-ink-muted text-[12px] mt-4 leading-[18px]"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        {copy}
      </Text>
    </View>
  );
}

/**
 * One day in the WeekStrip — weekday letter on top, date number
 * inside a 32px circle. Three visual states for the circle:
 *   • engaged           → filled primary (always wins)
 *   • not engaged + today → primary outline + primary text
 *   • not engaged + past  → muted outline + muted text
 *
 * Engaged days additionally get a small amber flame badge floating
 * at the top-right corner of the circle. That's what makes a day
 * read as a *streak day* at a glance — not just "you opened the
 * app", but "this one moved your streak forward". On today's cell,
 * the flame is the visual confirmation that the streak advanced
 * just now ("Saturday — yes, I checked in").
 */
function DayDateCell({
  dateISO,
  engaged,
  isToday,
}: {
  dateISO: string;
  engaged: boolean;
  isToday: boolean;
}) {
  // Parse the ISO date as a local date — never `new Date(iso)`,
  // which would interpret it as UTC and roll over a day for users
  // west of GMT.
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const weekday = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
  const dayNum = date.getDate();

  return (
    <View className="items-center" style={{ width: 36 }}>
      <Text
        className={`text-[10px] tracking-[1px] ${
          isToday ? "text-primary" : "text-ink-subtle"
        }`}
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {weekday}
      </Text>
      <View
        // `relative` so the absolutely-positioned flame badge below
        // anchors to this circle, not to the cell as a whole.
        className={`w-8 h-8 mt-1.5 rounded-full items-center justify-center relative ${
          engaged
            ? "bg-primary"
            : isToday
            ? "border-2 border-primary"
            : "border border-border-strong"
        }`}
      >
        <Text
          className={`text-[12px] ${
            engaged
              ? "text-primary-fg"
              : isToday
              ? "text-primary"
              : "text-ink-muted"
          }`}
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {dayNum}
        </Text>

        {/* Streak-day flame badge — only on days the user honored.
            Sits half-outside the circle on the top-right corner so
            it reads as a marker / flag, not a glyph crammed into
            the number. Amber on either backdrop (white fill or
            dark page bg) keeps clear contrast without needing a
            backing disc. */}
        {engaged && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
            }}
          >
            <FlameIcon active />
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function ResetIcon() {
  // Circular arrow — a refresh / reset glyph.
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4v6h6"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 20v-6h-6"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 10a8 8 0 0114-3.5L20 10M20 14a8 8 0 01-14 3.5L4 14"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RestartIcon() {
  // Classic power-button glyph — universally understood as "restart".
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v9"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M7 7a7 7 0 1 0 10 0"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Small ghost pill used by the __DEV__ tools row. Keeping it as its
 * own component so Reset / Restart (and any future dev shortcuts)
 * stay visually consistent without copy-paste.
 */
function DevPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      className="flex-row items-center px-4 py-3 rounded-full border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {icon}
      <Text
        className="text-ink-muted text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FlameIcon({ active }: { active: boolean }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill={active ? "#FFB672" : "none"}
        stroke={active ? "#FFB672" : colors.inkMuted}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScriptureIcon() {
  // Open book
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// ContinueReadingCard
//
// Slimmer than ReadingCard — meant to read as a "pickup" cue rather
// than a daily anchor. Shape: a colored leading bar (suggests an
// open book's spine), the chapter reference, a kind hint line, and
// a chevron.
// ─────────────────────────────────────────────────────────────────

function ContinueReadingCard({
  reference,
  hint,
  onPress,
}: {
  reference: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-border bg-surface overflow-hidden flex-row items-stretch"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Vertical bar — accent color, suggests the spine of a book.
          Anchors the card visually without dominating it. */}
      <View style={{ width: 4, backgroundColor: colors.primary }} />
      <View className="flex-1 px-5 py-4">
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Continue Reading
        </Text>
        <Text
          className="text-ink text-[17px] mt-1 tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={1}
        >
          {reference}
        </Text>
        <Text
          className="text-ink-muted text-[12.5px] mt-1.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {hint}
        </Text>
      </View>
      <View className="pr-5 items-center justify-center">
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Decide whether to surface a "Continue reading" card, and if so,
 * what chapter to point at.
 *
 * Rules:
 *   • Need a last visit, and it has to be within the last 7 days
 *     (older than that and "continue" stops feeling honest).
 *   • If the visited chapter ISN'T marked as read → resume there.
 *   • If it IS read → suggest the next chapter (the natural flow).
 *   • Hide entirely when the target equals today's curated reading
 *     so we don't duplicate the same card twice on Home.
 */
function computeContinueReading(
  lastVisited: {
    bookId: string;
    chapter: number;
    visitedAt: number;
  } | null,
  hasReadChapter: (bookId: string, chapter: number) => boolean,
  todaysReading: { bookId: string; chapter: number },
): { bookId: string; chapter: number; reference: string; hint: string } | null {
  if (!lastVisited) return null;

  // Freshness gate — older visits feel like archive, not flow.
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - lastVisited.visitedAt > SEVEN_DAYS_MS) return null;

  const lastBook = findBookById(lastVisited.bookId);
  if (!lastBook) return null;
  const lastRead = hasReadChapter(lastVisited.bookId, lastVisited.chapter);

  // Pick the target chapter.
  let bookId: string;
  let chapter: number;
  let hint: string;
  if (!lastRead) {
    bookId = lastVisited.bookId;
    chapter = lastVisited.chapter;
    hint = "Pick up where you left off";
  } else {
    // Read → suggest next within the book (we don't roll across
    // books in this surface; that's the reader's job).
    const nextChapter = lastVisited.chapter + 1;
    if (nextChapter > lastBook.chapters) return null;
    bookId = lastVisited.bookId;
    chapter = nextChapter;
    hint = `You finished ${lastBook.name} ${lastVisited.chapter}`;
  }

  // De-dupe against today's curated reading.
  if (
    bookId === todaysReading.bookId &&
    chapter === todaysReading.chapter
  ) {
    return null;
  }

  const book = findBookById(bookId);
  const reference = book ? `${book.name} ${chapter}` : `${bookId} ${chapter}`;
  return { bookId, chapter, reference, hint };
}

function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Peace to you";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Peace to you";
}

function formatDate(d: Date): string {
  // e.g. "Wed · May 27"
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = d.getDate();
  return `${weekday} · ${month} ${day}`;
}

/**
 * Encouraging copy for the journey card based on the user's current
 * state. Never shaming — even a broken streak has a kind sentence.
 */
function streakCopy(streak: {
  current: number;
  longest: number;
  honoredToday: boolean;
}): string {
  if (streak.current === 0) {
    return "A quiet day is still a faithful day. Begin again whenever you're ready.";
  }
  if (streak.current === 1) {
    return "Day one. The longest journeys begin with a single step.";
  }
  if (!streak.honoredToday) {
    return `Your ${streak.current}-day streak is alive — today is still waiting for you.`;
  }
  if (streak.current === streak.longest && streak.current > 2) {
    return `${streak.current} days — a new personal best. Keep showing up.`;
  }
  return "Small, faithful days. That's how rhythm is built.";
}
