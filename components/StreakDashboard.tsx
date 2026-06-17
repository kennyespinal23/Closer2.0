import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import * as haptics from "@/lib/haptics";
import { SFSymbol } from "@/components/Symbol";
import { buildCurrentWeek, buildMonthGrid } from "@/lib/rhythm";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * StreakDashboard — the shared body used by both the post-sermon
 * /sermon/streak celebration AND the /rhythm history modal.
 *
 * Both surfaces show the same information (current streak +
 * week-strip + achievements link + month grid + Daily Goals
 * soon row), so the body is extracted here once. Each caller
 * owns ONLY its chrome (the nav bar / close affordance) and
 * passes its specific concerns (entrance haptic vs none, day
 * override from URL params vs live progress, etc.).
 *
 * Layout — top to bottom:
 *
 *   shield emblem    (floats over hero card)
 *   ┌────────────────────────────────────────┐
 *   │  X Day Streak!                         │   hero card
 *   │  Great start! Keep going               │
 *   │                                          │
 *   │  Mon  Tue  Wed  Thu  Fri  Sat  Sun     │   week strip
 *   │   8   9    10   11   12   13   (14)    │   today = amber chip
 *   └────────────────────────────────────────┘
 *   ┌────────────────────────────────────────┐
 *   │  [📖]  Achievements              ›     │   achievements row
 *   └────────────────────────────────────────┘
 *   ┌────────────────────────────────────────┐
 *   │   ‹    June 2026             ›         │   month calendar
 *   │   S M T W T F S                        │
 *   │   …  …  …                              │
 *   └────────────────────────────────────────┘
 *   ┌────────────────────────────────────────┐
 *   │  [📅] Daily Goals          [Soon]      │   coming-soon row
 *   └────────────────────────────────────────┘
 *
 * Two amber tiers — `STREAK_TEXT_AMBER` is the readable text
 * accent (deep on cream, light on black) and `STREAK_FILL_AMBER`
 * is the saturated chip/shield fill that reads as a bright
 * object in both schemes. Apple Fitness does the same with its
 * Move ring (text color and fill color split per scheme so
 * the metric reads everywhere it lands).
 */

const STREAK_AMBER_LIGHT = "#FFB672";
const STREAK_AMBER_DEEP = "#B45309";
const STREAK_AMBER_FILL_LIGHT = "#F59E0B";
const STREAK_AMBER_FILL_DARK = "#FB923C";

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
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { engagedDates, streak } = useProgress();

  // Two-tier amber per scheme — see file header doc.
  const STREAK_TEXT_AMBER =
    scheme === "light" ? STREAK_AMBER_DEEP : STREAK_AMBER_LIGHT;
  const STREAK_FILL_AMBER =
    scheme === "light" ? STREAK_AMBER_FILL_LIGHT : STREAK_AMBER_FILL_DARK;

  // Day count: prefer the explicit override (post-sermon
  // deep-link path), otherwise the user's real current streak.
  const days = daysOverride && daysOverride > 0 ? daysOverride : streak.current;

  // Current week — Sun..Sat row of cells from the canonical
  // rhythm helper. Same engaged set everything else in the app
  // reads from, so this row can never disagree with the user's
  // actual history.
  const week = useMemo(() => buildCurrentWeek(engagedDates), [engagedDates]);

  // Current month grid for the lower calendar card. Same shape
  // the legacy rhythm detail page used so any future feature
  // we add can rely on consistent classification across surfaces.
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
      {/* Shield emblem — floats above the hero card like a badge
          on a Wallet pass, nested over the top rim. Static SVG
          (no animation libraries) so the dashboard stays light.
          The parent screen can wrap this body in entrance motion
          if it wants; the dashboard itself is render-static. */}
      <View
        style={{
          alignItems: "center",
          marginTop: 8,
          marginBottom: -32,
          zIndex: 2,
        }}
        pointerEvents="none"
      >
        <ShieldEmblem fill={STREAK_FILL_AMBER} />
      </View>

      {/* Hero card — current streak headline + week strip */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: colors.surfaceSecondary,
          paddingTop: 56,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: colors.ink,
            fontSize: 28,
            lineHeight: 34,
            letterSpacing: -0.5,
            textAlign: "center",
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
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {weekSubtitle(days)}
        </Text>

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

      {/* Achievements card — links to a future achievements
          surface. Today it links to /rhythm (which is itself
          this same dashboard, so we early-return at the call
          site when the user is already on the rhythm route to
          avoid a no-op tap). */}
      <Pressable
        onPress={() => {
          haptics.soft();
          // If we're ALREADY on /rhythm (the modal renders the
          // dashboard), tapping this row would no-op; we route
          // back to /today instead so the row still does
          // something honest. The streak route always pushes
          // /rhythm — no self-cycle there.
          router.push("/rhythm");
        }}
        accessibilityRole="button"
        accessibilityLabel="Open achievements"
        style={({ pressed }) => ({
          marginTop: 16,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: colors.surfaceSecondary,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: STREAK_FILL_AMBER,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <SFSymbol
              name="book.closed.fill"
              size={22}
              color="#FFFFFF"
              weight="bold"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: colors.ink,
                fontSize: 17,
                letterSpacing: -0.2,
              }}
            >
              Achievements
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "400",
                color: colors.inkMuted,
                fontSize: 13,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              Track your reading rhythm
            </Text>
          </View>
          <SFSymbol
            name="chevron.right"
            size={14}
            color={colors.inkSubtle}
            weight="semibold"
          />
        </View>
      </Pressable>

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

      {/* Daily Goals — coming-soon row. Inert (no Pressable
          wrapper) so the user can't tap into a dead end. */}
      <View
        style={{
          marginTop: 16,
          borderRadius: 20,
          backgroundColor: colors.surfaceSecondary,
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor:
              scheme === "light"
                ? "rgba(180, 83, 9, 0.12)"
                : "rgba(251, 146, 60, 0.18)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <SFSymbol
            name="calendar"
            size={20}
            color={STREAK_TEXT_AMBER}
            weight="semibold"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 15,
              letterSpacing: -0.2,
            }}
          >
            Daily Goals
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 12.5,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            Set and track your reading rhythm
          </Text>
        </View>
        <View
          style={{
            borderRadius: 999,
            backgroundColor:
              scheme === "light"
                ? "rgba(60, 60, 67, 0.10)"
                : "rgba(235, 235, 245, 0.14)",
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              color: colors.inkMuted,
              fontSize: 11,
              letterSpacing: 0.2,
            }}
          >
            Soon
          </Text>
        </View>
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

// ─────────────────────────────────────────────────────────────────
// Shield emblem — laurel-wreath badge
// ─────────────────────────────────────────────────────────────────

function ShieldEmblem({ fill }: { fill: string }) {
  const SIZE = 88;
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={SIZE} height={SIZE} viewBox="0 0 88 88">
        <Path
          d="M14 18
             C 14 13.582 17.582 10 22 10
             L 66 10
             C 70.418 10 74 13.582 74 18
             L 74 46
             C 74 60 64 70 44 80
             C 24 70 14 60 14 46
             Z"
          fill={fill}
        />
        <Path
          d="M30 32
             C 30 32 32 38 34 42
             C 36 46 38 49 42 52
             M30 32 C 30 30 32 30 33 31
             M32 36 C 32 34 34 34 35 35
             M34 40 C 34 38 36 38 37 39
             M36 44 C 36 42 38 42 39 43
             M38 48 C 38 46 40 46 41 47"
          stroke="#FFFFFF"
          strokeOpacity={0.92}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M58 32
             C 58 32 56 38 54 42
             C 52 46 50 49 46 52
             M58 32 C 58 30 56 30 55 31
             M56 36 C 56 34 54 34 53 35
             M54 40 C 54 38 52 38 51 39
             M52 44 C 52 42 50 42 49 43
             M50 48 C 50 46 48 46 47 47"
          stroke="#FFFFFF"
          strokeOpacity={0.92}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M40 52
             C 42 54 46 54 48 52"
          stroke="#FFFFFF"
          strokeOpacity={0.92}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
