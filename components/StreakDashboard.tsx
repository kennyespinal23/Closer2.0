import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { SFSymbol } from "@/components/Symbol";
import { buildCurrentWeek, buildMonthGrid } from "@/lib/rhythm";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

const FIRE_STREAK_ANIMATION = require("../assets/lottie/FireStreakAnimation.json");

/**
 * StreakDashboard — the shared body used by both the post-sermon
 * /sermon/streak celebration AND the /rhythm history modal.
 *
 * Layout — top to bottom:
 *
 *   ┌────────────────────────────────────────┐
 *   │  X Day Streak!              [🔥 lottie]│   hero card
 *   │  Great start! Keep going               │
 *   │                                          │
 *   │  Mon  Tue  Wed  Thu  Fri  Sat  Sun     │   week strip
 *   │   8   9    10   11   12   13   (14)    │   today = amber chip
 *   └────────────────────────────────────────┘
 *   ┌────────────────────────────────────────┐
 *   │   ‹    June 2026             ›         │   month calendar
 *   │   S M T W T F S                        │
 *   │   …  …  …                              │
 *   └────────────────────────────────────────┘
 */

import { TAB_ACCENT_RED } from "@/constants/theme";

export type StreakDashboardProps = {
  /**
   * Optional override for the displayed day count. When set
   * (post-sermon path passes `?days=N` here), the hero card
   * shows this value; otherwise it falls back to the user's
   * real current streak from the progress store.
   */
  daysOverride?: number;
};

export function StreakDashboard({ daysOverride }: StreakDashboardProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { engagedDates, streak } = useProgress();

  const STREAK_TEXT_AMBER = TAB_ACCENT_RED;
  const STREAK_FILL_AMBER = TAB_ACCENT_RED;

  const days = daysOverride && daysOverride > 0 ? daysOverride : streak.current;

  const week = useMemo(() => buildCurrentWeek(engagedDates), [engagedDates]);

  const todayDate = useMemo(() => new Date(), []);
  const monthGrid = useMemo(
    () =>
      buildMonthGrid(
        engagedDates,
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate,
      ),
    [engagedDates, todayDate],
  );

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card — streak headline left, flame lottie right */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: colors.surfaceSecondary,
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: 24,
          marginTop: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: colors.ink,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.5,
                textAlign: "left",
              }}
              accessibilityRole="header"
            >
              {days} {days === 1 ? "Day Streak!" : "Day Streak!"}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "500",
                color: colors.inkMuted,
                fontSize: 14,
                lineHeight: 19,
                textAlign: "left",
                marginTop: 4,
              }}
            >
              {weekSubtitle(days)}
            </Text>
          </View>

          <LottieView
            source={FIRE_STREAK_ANIMATION}
            autoPlay
            loop
            style={{ width: 88, height: 88 }}
          />
        </View>

        {/* Week strip — Sun..Sat columns */}
        <View
          style={{
            marginTop: 24,
            flexDirection: "row",
            alignItems: "stretch",
          }}
          accessibilityLabel={weekAccessibilityLabel(week.cells)}
        >
          {week.cells.map((cell) => {
            const date = new Date(cell.dateISO);
            const weekdayShort = WEEKDAY_SHORT_LABELS[date.getDay()];
            const dayNum = date.getDate();
            return (
              <View
                key={cell.dateISO}
                style={{ flex: 1, alignItems: "center" }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "500",
                    color: colors.inkSubtle,
                    fontSize: 11,
                    letterSpacing: 0.2,
                    marginBottom: 10,
                  }}
                >
                  {weekdayShort}
                </Text>
                <WeekDayCell
                  dayNum={dayNum}
                  state={cell.state}
                  isToday={cell.isToday}
                  ink={colors.ink}
                  inkSubtle={colors.inkSubtle}
                  amberFill={STREAK_FILL_AMBER}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Month calendar card */}
      <View
        style={{
          marginTop: 16,
          borderRadius: 20,
          backgroundColor: colors.surfaceSecondary,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
            marginBottom: 12,
          }}
        >
          <View style={{ width: 28, alignItems: "center" }}>
            <SFSymbol
              name="chevron.left"
              size={14}
              color={iOSBlue(scheme)}
              weight="semibold"
            />
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 16,
              letterSpacing: -0.2,
            }}
          >
            {monthGrid.monthLabel}
          </Text>
          <View style={{ width: 28, alignItems: "center" }}>
            <SFSymbol
              name="chevron.right"
              size={14}
              color={iOSBlue(scheme)}
              weight="semibold"
            />
          </View>
        </View>

        {/* Weekday header */}
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {WEEKDAY_INITIAL_LABELS.map((label, i) => (
            <View
              key={`${label}-${i}`}
              style={{ flex: 1, alignItems: "center" }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "600",
                  color: colors.inkSubtle,
                  fontSize: 11,
                  letterSpacing: 0.2,
                  paddingVertical: 6,
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        {monthGrid.rows.map((row, rowIdx) => (
          <View key={`week-${rowIdx}`} style={{ flexDirection: "row" }}>
            {row.map((cell) => {
              const dayNum = parseInt(cell.dateISO.slice(8, 10), 10);
              return (
                <View
                  key={cell.dateISO}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 6,
                  }}
                >
                  <MonthDayCell
                    dayNum={dayNum}
                    state={cell.state}
                    isToday={cell.isToday}
                    ink={colors.ink}
                    inkSubtle={colors.inkSubtle}
                    amberFill={STREAK_FILL_AMBER}
                    textAmber={STREAK_TEXT_AMBER}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Copy helpers
// ─────────────────────────────────────────────────────────────────

function weekSubtitle(days: number): string {
  if (days <= 1) return "Great start! Keep going";
  if (days <= 3) return "A rhythm is forming";
  if (days <= 7) return "A week of showing up";
  if (days <= 30) return `${days} days of nearness`;
  return `${days} days. Keep tending the fire.`;
}

function weekAccessibilityLabel(
  cells: ReadonlyArray<{ dateISO: string; state: string; isToday: boolean }>,
): string {
  const engaged = cells.filter((c) => c.state === "engaged").length;
  return `${engaged} ${engaged === 1 ? "day" : "days"} complete this week.`;
}

// ─────────────────────────────────────────────────────────────────
// Theme helpers
// ─────────────────────────────────────────────────────────────────

function iOSBlue(scheme: "light" | "dark"): string {
  return scheme === "light" ? "#007AFF" : "#0A84FF";
}

// ─────────────────────────────────────────────────────────────────
// Day cell vocabulary
// ─────────────────────────────────────────────────────────────────

const WEEKDAY_SHORT_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

const WEEKDAY_INITIAL_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function WeekDayCell({
  dayNum,
  state,
  isToday,
  ink,
  inkSubtle,
  amberFill,
}: {
  dayNum: number;
  state: string;
  isToday: boolean;
  ink: string;
  inkSubtle: string;
  amberFill: string;
}) {
  if (isToday) {
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: amberFill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: "#FFFFFF",
            fontSize: 15,
          }}
        >
          {dayNum}
        </Text>
      </View>
    );
  }
  const isFuture = state === "future";
  const isEngaged = state === "engaged";
  return (
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "System",
          fontWeight: isEngaged ? "700" : "500",
          color: isFuture ? inkSubtle : ink,
          fontSize: 15,
        }}
      >
        {dayNum}
      </Text>
      {isEngaged ? (
        <View
          style={{
            position: "absolute",
            bottom: -6,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: amberFill,
          }}
        />
      ) : null}
    </View>
  );
}

function MonthDayCell({
  dayNum,
  state,
  isToday,
  ink,
  inkSubtle,
  amberFill,
  textAmber,
}: {
  dayNum: number;
  state: string;
  isToday: boolean;
  ink: string;
  inkSubtle: string;
  amberFill: string;
  textAmber: string;
}) {
  if (state === "outOfMonth") {
    return <View style={{ width: 28, height: 28 }} />;
  }
  if (isToday) {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: amberFill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: "#FFFFFF",
            fontSize: 13,
          }}
        >
          {dayNum}
        </Text>
      </View>
    );
  }
  const isEngaged = state === "engaged";
  const isFuture = state === "future";
  return (
    <View
      style={{
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "System",
          fontWeight: isEngaged ? "700" : "500",
          color: isEngaged ? textAmber : isFuture ? inkSubtle : ink,
          fontSize: 13,
        }}
      >
        {dayNum}
      </Text>
    </View>
  );
}
