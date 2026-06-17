import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { ActivityRing, RING_ACCENT } from "@/components/ActivityRing";
import { FadeIn } from "@/components/FadeIn";
import { formatMinutes, formatRemaining } from "@/lib/readingGoalFormat";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors } from "@/state/theme";

/**
 * Reading-goal detail screen — the drill-in destination from
 * tapping the activity-ring hero on the home screen.
 *
 * Borrowed pretty directly from Apple Fitness' Summary → Activity
 * detail page:
 *
 *   • A large hero ring (≈220pt) with the day's metric inside it,
 *     reading "X" big over "of Y MIN" small. The ring itself is the
 *     primary visual anchor — everything else on the page reports
 *     on it.
 *   • A "When you read today" bar chart broken out by hour-of-day,
 *     with the goal threshold drawn as a faint dashed line. Hours
 *     with reading activity get an accent bar; hours with no
 *     activity render as a hairline.
 *   • A 7-day strip of mini activity rings, so the user can see
 *     this week's rhythm at a glance.
 *   • A footer button that drills further into the goal-picker
 *     (/settings/reading-goal) for tuning the daily target.
 *
 * Data flows straight from useReadingGoal():
 *   • todayMinutes / goalMinutes / reachedToday   → hero ring + copy
 *   • todayByHourArray (24-slot dense array)      → hourly chart
 *   • byDate (ISO → minutes)                      → 7-day mini rings
 *
 * No state lives here — this is a pure presentation screen on top
 * of the ReadingGoalProvider. Goal mutations live one level deeper
 * in /settings/reading-goal.
 */
export default function ReadingGoalDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    goalMinutes,
    todayMinutes,
    reachedToday,
    todayByHourArray,
    byDate,
  } = useReadingGoal();

  const heroPct = goalMinutes > 0 ? Math.min(1, todayMinutes / goalMinutes) : 0;
  const minutesLabel = formatMinutes(todayMinutes);
  const captionLabel = formatRemaining(todayMinutes, goalMinutes, reachedToday);
  const heroColor = reachedToday ? colors.ink : RING_ACCENT;

  // Build the 7-day strip from the byDate ledger. Each entry knows
  // its date, the minutes that day, and a pct vs the goal.
  const weekRows = useMemo(
    () => buildLastSevenDays(byDate, goalMinutes),
    [byDate, goalMinutes],
  );

  // Sum total minutes spent reading this week — a small but
  // meaningful summary above the strip. We sum from weekRows so we
  // get exactly the seven days the strip is showing (which is the
  // user's actual perceived "week").
  const weekTotal = useMemo(
    () => weekRows.reduce((acc, r) => acc + r.minutes, 0),
    [weekRows],
  );
  const weekHonored = weekRows.filter((r) => r.minutes >= goalMinutes).length;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ─── Header ──────────────────────────────────────────────
          Back chevron (left), centered title, balancing spacer
          (right). Matches the SettingsScaffold rhythm so the page
          feels of a piece with the rest of the drill-in surfaces. */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
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
          Drawing Near
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ring ───────────────────────────────────────
            The single biggest element on the page. Renders the
            current pct as a large activity ring with the minutes
            stat stacked inside the ring's eye — a deliberate echo
            of Apple Fitness' big-stat ring. */}
        <FadeIn delayMs={50} durationMs={700}>
          <View className="items-center pt-2">
            <View className="relative items-center justify-center">
              <ActivityRing
                pct={heroPct}
                reached={reachedToday}
                size={232}
                stroke={20}
              />
              {/* Stat overlay — sits dead-center inside the ring. */}
              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center"
              >
                <Text
                  className="text-ink-subtle text-[11px] tracking-[3px] uppercase"
                  style={{ fontFamily: "System", fontWeight: "700" }}
                >
                  Minutes
                </Text>
                <Text
                  className="text-ink mt-1 tracking-[-0.6px]"
                  style={{
                    fontFamily: "System",
                    fontWeight: "800",
                    color: heroColor,
                    fontSize: 56,
                    lineHeight: 60,
                  }}
                >
                  {minutesLabel}
                </Text>
                <Text
                  className="text-ink-muted text-[12px] mt-1"
                  style={{ fontFamily: "System", fontWeight: "600" }}
                >
                  of {goalMinutes} MIN goal
                </Text>
              </View>
            </View>

            <Text
              className="text-ink-muted text-[13px] mt-5 px-10 text-center leading-[20px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {captionLabel}
            </Text>
          </View>
        </FadeIn>

        {/* ─── Hourly bar chart ────────────────────────────────
            "When you read today". 24 bars across, one per hour;
            empty hours render as hairlines, active hours as
            accent-amber bars sized against the day's max. A
            dashed line at the goal threshold (relative to the
            tallest bar) gives the chart context. */}
        <FadeIn delayMs={180} durationMs={800}>
          <View className="px-6 mt-9">
            <SectionHeader
              eyebrow="Today"
              title="When you read"
              caption={hourlyCaption(todayByHourArray)}
            />
            <View className="mt-4">
              <HourlyChart minutesByHour={todayByHourArray} />
            </View>
          </View>
        </FadeIn>

        {/* ─── Weekly mini-rings ───────────────────────────────
            Seven small activity rings, one per day, so the user
            sees the rhythm of their week without having to
            navigate elsewhere. */}
        <FadeIn delayMs={300} durationMs={900}>
          <View className="px-6 mt-10">
            <SectionHeader
              eyebrow="This week"
              title="Your rhythm"
              caption={`${weekHonored} of 7 days · ${Math.round(
                weekTotal,
              )} min total`}
            />
            <View className="mt-4">
              <WeekRingStrip rows={weekRows} />
            </View>
          </View>
        </FadeIn>

        {/* ─── Edit goal ──────────────────────────────────────
            Footer action. Single full-width button into the
            goal-picker (matches the settings surface). Sits at
            the bottom so the visual chrome above it (ring +
            chart + strip) reads as the answer to "how am I
            doing" before "tune the target" appears. */}
        <FadeIn delayMs={420} durationMs={900}>
          <View className="px-6 mt-12">
            <Pressable
              onPress={() => router.push("/settings/reading-goal")}
              className="rounded-2xl flex-row items-center justify-center py-4"
              style={({ pressed }) => ({
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <SlidersIcon />
              <Text
                className="text-ink text-[14px] ml-2"
                style={{ fontFamily: "System", fontWeight: "700" }}
              >
                Edit daily goal
              </Text>
              <View className="ml-2 px-2 py-0.5 rounded-full bg-surface">
                <Text
                  className="text-ink-muted text-[11px]"
                  style={{ fontFamily: "System", fontWeight: "600" }}
                >
                  {goalMinutes} min
                </Text>
              </View>
            </Pressable>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// SectionHeader — eyebrow / title / caption rhythm shared by the
// chart and the weekly strip
// ─────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  caption,
}: {
  eyebrow: string;
  title: string;
  caption?: string;
}) {
  return (
    <View>
      <Text
        className="text-primary text-[11px] tracking-[3px] uppercase"
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        {eyebrow}
      </Text>
      <View className="flex-row items-baseline justify-between mt-1.5">
        <Text
          className="text-ink text-[20px] tracking-[-0.3px]"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          {title}
        </Text>
        {caption ? (
          <Text
            className="text-ink-muted text-[12px]"
            style={{ fontFamily: "System", fontWeight: "500" }}
            numberOfLines={1}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// HourlyChart — 24 bars showing minutes read per hour today
// ─────────────────────────────────────────────────────────────────

/**
 * Hourly bar chart of today's minutes-read distribution.
 *
 * Design notes (borrowed from Apple Fitness' "calories per hour"):
 *   • Empty hours render a 2pt hairline at the baseline so the
 *     axis stays present visually even when most of the day has
 *     no activity. Without those hairlines the chart would look
 *     half-empty / broken on a normal day.
 *   • Active hours fill from baseline upward with an amber bar,
 *     sized as a pct of the tallest bar (so chart proportions
 *     adapt to whatever scale the user reads at — five-minute
 *     sittings vs hour-long ones both look good).
 *   • Three axis tick labels (6 AM / 12 PM / 6 PM) — keeps the
 *     time grid readable without crowding the chart.
 *
 * The chart is non-interactive (no tooltips) on purpose. This is
 * a glance surface, not an analytics dashboard.
 */
function HourlyChart({
  minutesByHour,
}: {
  minutesByHour: ReadonlyArray<number>;
}) {
  const colors = useColors();
  const CHART_HEIGHT = 96;
  const BAR_WIDTH = 6;
  const max = Math.max(0, ...minutesByHour);
  const hasAny = max > 0;

  return (
    <View>
      <View
        className="flex-row items-end justify-between"
        style={{ height: CHART_HEIGHT }}
      >
        {minutesByHour.map((m, i) => {
          // Floor a 2pt hairline so empty hours still mark the axis.
          // Active hours scale relative to the day's max minute.
          const pct = hasAny ? m / max : 0;
          const h = m > 0 ? Math.max(4, pct * CHART_HEIGHT) : 2;
          const filled = m > 0;
          return (
            <View
              key={i}
              style={{
                width: BAR_WIDTH,
                height: h,
                borderRadius: BAR_WIDTH / 2,
                backgroundColor: filled ? RING_ACCENT : colors.border,
              }}
            />
          );
        })}
      </View>

      {/* X-axis ticks. The bar row uses flex-row + justify-between
          so the 24 bars span the full width exactly: bar i sits
          at fraction i/(N-1) of the width. We mirror that math
          for the ticks so "6 AM" lands under hour-6, etc., even
          as the screen width changes. Each tick is absolutely
          positioned with a translateX trick (left: %, translateX:
          -50% via marginLeft on a known-width text) so the label
          stays centered on its anchor point. */}
      <View className="mt-2" style={{ height: 14 }}>
        {AXIS_TICKS.map((t) => {
          // Typed as a percentage literal so it satisfies RN's
          // `DimensionValue` shape (`${number}%`). A bare string
          // template would widen to `string` and fail type check.
          const leftPct: `${number}%` = `${(t.hour / 23) * 100}%`;
          return (
            <Text
              key={t.label}
              className="text-ink-subtle text-[11px] absolute"
              style={{
                fontFamily: "System",
                fontWeight: "600",
                left: leftPct,
                top: 0,
                width: 60,
                marginLeft: -30,
                textAlign: "center",
              }}
            >
              {t.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const AXIS_TICKS: ReadonlyArray<{ hour: number; label: string }> = [
  { hour: 6, label: "6 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 18, label: "6 PM" },
];

/**
 * One-liner caption for the hourly chart — describes the shape of
 * the day's reading rather than restating the metric.
 *
 *   • No activity yet     → encouraging
 *   • Concentrated burst  → name the hour
 *   • Spread out          → name the spread
 */
function hourlyCaption(byHour: ReadonlyArray<number>): string {
  const total = byHour.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return "Hasn't started yet";

  const activeHours = byHour
    .map((m, h) => ({ m, h }))
    .filter((x) => x.m > 0)
    .sort((a, b) => b.m - a.m);

  if (activeHours.length === 0) return "Hasn't started yet";
  if (activeHours.length === 1) {
    return `${formatHour(activeHours[0]!.h)} sitting`;
  }
  // Multi-hour days — describe the active span as "morning / afternoon / evening"
  const periods = new Set(activeHours.map((x) => periodOf(x.h)));
  if (periods.size === 1) return `${[...periods][0]!} session`;
  return `Across ${activeHours.length} hours`;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "Noon";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function periodOf(h: number): "Morning" | "Afternoon" | "Evening" | "Late-night" {
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Late-night";
}

// ─────────────────────────────────────────────────────────────────
// WeekRingStrip — 7 mini activity rings, one per day
// ─────────────────────────────────────────────────────────────────

type WeekRow = {
  dateISO: string;
  minutes: number;
  pct: number;
  reached: boolean;
  isToday: boolean;
  weekday: string;
};

function WeekRingStrip({ rows }: { rows: ReadonlyArray<WeekRow> }) {
  return (
    <View className="flex-row justify-between items-end">
      {rows.map((row) => (
        <View key={row.dateISO} className="items-center" style={{ flex: 1 }}>
          <ActivityRing
            pct={row.pct}
            reached={row.reached}
            size={36}
            stroke={4}
            showTip={false}
            // Mini rings in the 7-day week strip render as a tight
            // grid — animating all seven in unison is visual noise,
            // not the deliberate "live" cue the hero ring is doing.
            // Snap straight to value.
            animate={false}
          />
          <Text
            className={`text-[11px] tracking-[1px] mt-2 ${
              row.isToday ? "text-primary" : "text-ink-subtle"
            }`}
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            {row.weekday}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Build the last-7-days strip from the byDate ledger. Today is the
 * rightmost entry; missing dates report 0 minutes so the strip
 * always renders all 7 slots.
 */
function buildLastSevenDays(
  byDate: Readonly<Record<string, number>>,
  goalMinutes: number,
): ReadonlyArray<WeekRow> {
  const today = new Date();
  const rows: WeekRow[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toLocalISO(d);
    const minutes = byDate[iso] ?? 0;
    const pct = goalMinutes > 0 ? Math.min(1, minutes / goalMinutes) : 0;
    rows.push({
      dateISO: iso,
      minutes,
      pct,
      reached: minutes >= goalMinutes,
      isToday: i === 0,
      weekday: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()]!,
    });
  }
  return rows;
}

function toLocalISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function BackChevronIcon() {
  const colors = useColors();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SlidersIcon() {
  const colors = useColors();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      {/* Three horizontal rails with a knob (circle) at a
          different position on each — equalizer-style settings
          glyph, paired with the "Edit daily goal" copy. */}
      <Path
        d="M4 6h16M4 12h16M4 18h16"
        stroke={colors.ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Circle cx={15} cy={6} r={2.2} fill={colors.ink} />
      <Circle cx={9} cy={12} r={2.2} fill={colors.ink} />
      <Circle cx={17} cy={18} r={2.2} fill={colors.ink} />
    </Svg>
  );
}
