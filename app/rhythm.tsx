import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import * as haptics from "@/lib/haptics";
import {
  buildYearHeatmap,
  buildYearSummary,
  type RhythmCellState,
} from "@/lib/rhythm";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * Rhythm detail page — full-year HabitKit-style breakdown of
 * the user's reading habit.
 *
 * Layout (top → bottom):
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  ✕                                                    │ (close)
 *   │       Rhythm                                          │ (page title)
 *   │  ‹  2026  ›                                           │ (year nav)
 *   │                                                       │
 *   │  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct …   │ (month labels)
 *   │  ▢▢▢▢▢▣▣▢▢▢▣▢▣▣▣▣▣▣▣▣ … (53 weeks × 7 rows)         │ (year heatmap)
 *   │                                                       │
 *   │  ┌─────────────────────┐  ┌─────────────────────┐    │
 *   │  │   888   Completions │  │   This month  ·  12 │    │ (stat cards)
 *   │  └─────────────────────┘  └─────────────────────┘    │
 *   │                                                       │
 *   │  Completions / Month                                  │ (chart header)
 *   │  ▁▂▅▇█▆▃▂▁▁▁▁                                          │ (bar chart)
 *   │  J F M A M J J A S O N D                              │
 *   │                                                       │
 *   │  ┌─────────────────────┐  ┌─────────────────────┐    │
 *   │  │   14    Current     │  │   71    Best        │    │ (streak cards)
 *   │  └─────────────────────┘  └─────────────────────┘    │
 *   └──────────────────────────────────────────────────────┘
 *
 * Year navigation is bounded: the user can step back through
 * any year where they have data (the earliest engaged date's
 * year), and step forward to the current year (but no
 * further — there's no "future year" view).
 *
 * No timers, no save toggles, no edits — the page is a
 * read-only stats canvas. The user came here to look at the
 * pattern they're building, not to take action.
 */
export default function RhythmDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const { engagedDates, streak } = useProgress();

  // Year window — defaults to the current year. We allow paging
  // back to any year the user has engagement in, and forward
  // up to (but not past) the current year.
  const currentYear = new Date().getFullYear();
  const earliestYear = useMemo(() => {
    if (engagedDates.length === 0) return currentYear;
    let min = currentYear;
    for (const iso of engagedDates) {
      const y = parseInt(iso.slice(0, 4), 10);
      if (Number.isFinite(y) && y < min) min = y;
    }
    return min;
  }, [engagedDates, currentYear]);
  const [year, setYear] = useState(currentYear);
  const canStepBack = year > earliestYear;
  const canStepForward = year < currentYear;

  // Derived data — heatmap grid + per-month summary + a few
  // header stats. All `useMemo`d so the page doesn't re-compute
  // 365 dates on every render of an unrelated state change.
  const heatmap = useMemo(
    () => buildYearHeatmap(engagedDates, year),
    [engagedDates, year],
  );
  const summary = useMemo(
    () => buildYearSummary(engagedDates, year),
    [engagedDates, year],
  );

  // This-month count comes straight off the monthly summary
  // when viewing the current year. For past-year views we hide
  // the card — "this month" doesn't apply there.
  const thisMonthCount =
    year === currentYear
      ? summary.monthly[new Date().getMonth()]?.count ?? 0
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header colors={colors} onClose={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title — Apple-style 32pt anchor. Same shape as
            "Library" / "Home" so the detail page feels native
            to the app rather than a borrowed external screen. */}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.ink,
            fontSize: 32,
            lineHeight: 36,
            letterSpacing: -0.8,
            marginTop: 4,
          }}
          accessibilityRole="header"
        >
          Rhythm
        </Text>

        {/* Year navigator — < 2026 > with prev/next chevrons.
            Mirrors the HabitKit "year selector" pattern. The
            chevrons dim when the bounds are hit so the user
            knows there's no more data in that direction. */}
        <YearNav
          year={year}
          canStepBack={canStepBack}
          canStepForward={canStepForward}
          onStepBack={() => {
            haptics.soft();
            setYear((y) => Math.max(earliestYear, y - 1));
          }}
          onStepForward={() => {
            haptics.soft();
            setYear((y) => Math.min(currentYear, y + 1));
          }}
          colors={colors}
        />

        {/* Full-year heatmap card. 53 columns × 7 rows of
            small cells — paints the entire year at a glance
            so the user can see streaks, gaps, and pattern. */}
        <YearHeatmapCard
          cols={heatmap.cols}
          monthLabels={heatmap.monthLabels}
          colors={colors}
          availableWidth={screenWidth - 40}
        />

        {/* Big stat card — total completions for the selected
            year, surfaced like HabitKit's "888 Completions"
            display number. */}
        <StatCard
          colors={colors}
          value={summary.total}
          label={summary.total === 1 ? "Completion" : "Completions"}
          accent={ACCENT}
        />

        {/* This-month stat — only meaningful on the current
            year view. Hidden when looking at past years. */}
        {thisMonthCount !== null ? (
          <StatCard
            colors={colors}
            value={thisMonthCount}
            label={
              thisMonthCount === 1
                ? "Completion · This month"
                : "Completions · This month"
            }
            accent={colors.inkSubtle}
            secondary
          />
        ) : null}

        {/* Monthly bar chart — one bar per month, height
            proportional to that month's completion count.
            Tooltip-less: hover/touch interactions felt like
            extra surface area for a calm stats page. Bars are
            the editorial red so the chart sits in the same
            color world as everything else on this screen. */}
        <MonthlyChartCard
          colors={colors}
          monthly={summary.monthly}
          year={year}
        />

        {/* Two streak cards side-by-side — Current Streak +
            Best Streak. These pull from the global streak
            calc (so they reflect the user's actual lifetime
            best, not just the selected year). */}
        <View style={{ flexDirection: "row", marginTop: 14 }}>
          <View style={{ flex: 1, marginRight: 7 }}>
            <StatCard
              colors={colors}
              value={streak.current}
              label="Current Streak"
              accent={ACCENT}
              dense
            />
          </View>
          <View style={{ flex: 1, marginLeft: 7 }}>
            <StatCard
              colors={colors}
              value={streak.longest}
              label="Best Streak"
              accent={colors.inkSubtle}
              dense
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The editorial red used throughout Closer's "Daily Devotional"
 * surfaces — duplicated here (same hex as `today.tsx`'s
 * `HOME_SECTION_ACCENT`) so this file stays self-contained.
 */
const ACCENT = "#E11D48";

// ─────────────────────────────────────────────────────────────────
// Header — close (X) + nothing else
// ─────────────────────────────────────────────────────────────────

function Header({
  colors,
  onClose,
}: {
  colors: { ink: string; border: string; surface: string };
  onClose: () => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <Pressable
        hitSlop={12}
        onPress={() => {
          haptics.soft();
          onClose();
        }}
        accessibilityRole="button"
        accessibilityLabel="Close rhythm"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6l12 12M6 18L18 6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Year nav — ‹ 2026 ›
// ─────────────────────────────────────────────────────────────────

function YearNav({
  year,
  canStepBack,
  canStepForward,
  onStepBack,
  onStepForward,
  colors,
}: {
  year: number;
  canStepBack: boolean;
  canStepForward: boolean;
  onStepBack: () => void;
  onStepForward: () => void;
  colors: { ink: string; inkSubtle: string };
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      <NavChevron
        direction="left"
        disabled={!canStepBack}
        onPress={onStepBack}
        color={colors.ink}
        mutedColor={colors.inkSubtle}
      />
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.ink,
          fontSize: 20,
          letterSpacing: -0.3,
          marginHorizontal: 28,
        }}
        accessibilityRole="header"
      >
        {year}
      </Text>
      <NavChevron
        direction="right"
        disabled={!canStepForward}
        onPress={onStepForward}
        color={colors.ink}
        mutedColor={colors.inkSubtle}
      />
    </View>
  );
}

function NavChevron({
  direction,
  disabled,
  onPress,
  color,
  mutedColor,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onPress: () => void;
  color: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel={direction === "left" ? "Previous year" : "Next year"}
      style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.7 : 1 })}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
          stroke={disabled ? mutedColor : color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full-year heatmap card
// ─────────────────────────────────────────────────────────────────

function YearHeatmapCard({
  cols,
  monthLabels,
  colors,
  availableWidth,
}: {
  cols: ReadonlyArray<
    ReadonlyArray<{
      dateISO: string;
      state: RhythmCellState;
      isToday: boolean;
    }>
  >;
  monthLabels: ReadonlyArray<{ colIdx: number; label: string }>;
  colors: { ink: string; inkSubtle: string; border: string; surface: string };
  availableWidth: number;
}) {
  // Card has 14pt internal padding on each side; the heatmap
  // fills the remaining width. Cell size scales so the year
  // (53 columns + 52 gaps) lands without clipping.
  const CARD_PADDING = 14;
  const GAP = 2;
  const COLS = cols.length;
  const innerWidth = availableWidth - CARD_PADDING * 2;
  const rawCell = (innerWidth - (COLS - 1) * GAP) / COLS;
  const cellSize = Math.max(6, Math.min(11, Math.floor(rawCell)));
  const radius = Math.max(1, Math.floor(cellSize / 4));

  return (
    <View
      style={{
        marginTop: 14,
        padding: CARD_PADDING,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      {/* Month labels strip — one Sep/Oct/etc tick above the
          column whose row contains that month's 1st. */}
      <View style={{ height: 14, marginBottom: 6, position: "relative" }}>
        {monthLabels.map(({ colIdx, label }) => (
          <Text
            key={`${label}-${colIdx}`}
            style={{
              position: "absolute",
              left: colIdx * (cellSize + GAP),
              top: 0,
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.inkSubtle,
              fontSize: 9,
              letterSpacing: 1,
            }}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* The heatmap — column-major (each column = a week). */}
      <View style={{ flexDirection: "row" }}>
        {cols.map((col, cIdx) => (
          <View key={cIdx} style={{ marginLeft: cIdx === 0 ? 0 : GAP }}>
            {col.map((cell, rIdx) => (
              <YearHeatmapCell
                key={`${cIdx}-${rIdx}`}
                size={cellSize}
                marginTop={rIdx === 0 ? 0 : GAP}
                radius={radius}
                state={cell.state}
                isToday={cell.isToday}
                colors={colors}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function YearHeatmapCell({
  size,
  marginTop,
  radius,
  state,
  isToday,
  colors,
}: {
  size: number;
  marginTop: number;
  radius: number;
  state: RhythmCellState;
  isToday: boolean;
  colors: { border: string };
}) {
  let backgroundColor = "transparent";
  let opacity = 1;
  let borderWidth = 0;
  let borderColor: string | undefined;
  switch (state) {
    case "engaged":
      backgroundColor = ACCENT;
      break;
    case "idle":
      backgroundColor = colors.border;
      break;
    case "future":
      backgroundColor = colors.border;
      opacity = 0.35;
      break;
    case "outOfMonth":
      backgroundColor = "transparent";
      opacity = 0;
      break;
  }
  if (isToday && state !== "outOfMonth" && state !== "engaged") {
    borderWidth = 1;
    borderColor = ACCENT;
    opacity = 1;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        marginTop,
        borderRadius: radius,
        backgroundColor,
        opacity,
        borderWidth,
        borderColor,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat card — big number + supporting label
// ─────────────────────────────────────────────────────────────────

function StatCard({
  colors,
  value,
  label,
  accent,
  secondary = false,
  dense = false,
}: {
  colors: {
    ink: string;
    inkMuted: string;
    inkSubtle: string;
    border: string;
    surface: string;
  };
  value: number;
  label: string;
  accent: string;
  /** Quieter visual weight — for secondary metrics like "this month". */
  secondary?: boolean;
  /** Tighter padding — for paired streak cards in a 2-up row. */
  dense?: boolean;
}) {
  return (
    <View
      style={{
        marginTop: 14,
        padding: dense ? 16 : 20,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        alignItems: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_800ExtraBold",
          color: secondary ? colors.ink : accent,
          fontSize: dense ? 36 : 44,
          lineHeight: dense ? 40 : 48,
          letterSpacing: -1.2,
        }}
        allowFontScaling={false}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          color: colors.inkSubtle,
          fontSize: 12,
          letterSpacing: 0.4,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Completions / Month bar chart
// ─────────────────────────────────────────────────────────────────

function MonthlyChartCard({
  colors,
  monthly,
  year,
}: {
  colors: { ink: string; inkSubtle: string; border: string; surface: string };
  monthly: ReadonlyArray<{ monthIdx: number; label: string; count: number }>;
  year: number;
}) {
  // Bars scale to the tallest month. Empty year → all bars sit
  // at the floor (we still render the chart so the page doesn't
  // collapse around an absent dataset).
  const max = Math.max(1, ...monthly.map((m) => m.count));
  const CHART_HEIGHT = 100;
  const BAR_GAP = 8;
  const currentMonthIdx =
    new Date().getFullYear() === year ? new Date().getMonth() : -1;

  return (
    <View
      style={{
        marginTop: 14,
        padding: 18,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.ink,
          fontSize: 15.5,
          letterSpacing: -0.2,
        }}
      >
        Completions / Month
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: CHART_HEIGHT,
          marginTop: 14,
        }}
      >
        {monthly.map((m, i) => {
          const h = Math.max(2, (m.count / max) * CHART_HEIGHT);
          const isCurrent = m.monthIdx === currentMonthIdx;
          return (
            <View
              key={m.monthIdx}
              style={{
                flex: 1,
                alignItems: "center",
                marginLeft: i === 0 ? 0 : BAR_GAP,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: h,
                  borderRadius: 4,
                  backgroundColor: isCurrent ? ACCENT : `${ACCENT}55`,
                }}
              />
            </View>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: 8,
        }}
      >
        {monthly.map((m, i) => (
          <View
            key={m.monthIdx}
            style={{
              flex: 1,
              alignItems: "center",
              marginLeft: i === 0 ? 0 : BAR_GAP,
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color:
                  m.monthIdx === currentMonthIdx
                    ? colors.ink
                    : colors.inkSubtle,
                fontSize: 9.5,
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {m.label.charAt(0)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
