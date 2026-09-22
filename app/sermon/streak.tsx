import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HANDWRITTEN } from "@/components/HomeQuoteText";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { SFSymbol } from "@/components/Symbol";
import { minTouchTarget } from "@/constants/spacing";
import { CLOSER_ACCENT, CLOSER_ACCENT_PRESSED } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { shareRaw } from "@/lib/share";
import { systemText, typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Streak celebration — post-unlock beat when today's completion
 * advances the streak. Flame, "N day streak!", week strip,
 * "Stay Consistent" script line, share + Continue.
 *
 * Chrome accents use `CLOSER_ACCENT` (#FF4326). The handwritten
 * line keeps its own softer gold.
 */

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StreakScreen() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const reducedMotion = useReducedMotion();
  const { engagedDates, streak } = useProgress();
  const { days: daysParam, milestone: milestoneParam } =
    useLocalSearchParams<{ days?: string; milestone?: string }>();

  const days = useMemo(
    () => Math.max(1, Number(daysParam) || streak.current || 1),
    [daysParam, streak.current],
  );
  const milestone = useMemo(
    () => (milestoneParam ? Number(milestoneParam) : 0),
    [milestoneParam],
  );
  const isMilestone = milestone > 0;

  const [continuePressed, setContinuePressed] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);

  const flameBreath = useRef(new Animated.Value(0)).current;

  /** Handwritten caption — softer gold, separate from CTA orange. */
  const scriptColor = scheme === "dark" ? "#E8C07A" : "#8B6914";
  const accent = CLOSER_ACCENT;
  const accentPressed = CLOSER_ACCENT_PRESSED;

  const weekDays = useMemo(() => {
    const engaged = new Set(engagedDates);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sunday = new Date(todayStart);
    sunday.setDate(todayStart.getDate() - todayStart.getDay());

    return WEEKDAY_LABELS.map((label, i) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const iso = toLocalISO(date);
      const isFuture = date.getTime() > todayStart.getTime();
      return {
        label,
        iso,
        engaged: engaged.has(iso),
        isFuture,
        isToday: date.getTime() === todayStart.getTime(),
      };
    });
  }, [engagedDates]);

  useEffect(() => {
    if (reducedMotion) {
      flameBreath.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameBreath, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flameBreath, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flameBreath, reducedMotion]);

  const flameScale = flameBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.04],
  });

  const handleContinue = () => {
    haptics.soft();
    if (isMilestone) {
      router.replace({
        pathname: "/sermon/milestone-unlock",
        params: { day: String(milestone) },
      });
      return;
    }
    router.replace("/today");
  };

  const handleShare = () => {
    haptics.soft();
    void shareRaw({
      title: `${days}-day streak · Closer`,
      message: [
        `${days}-day streak on Closer!`,
        "",
        "Stay consistent.",
        "",
        "via Closer",
      ].join("\n"),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 4,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share streak"
            style={{
              width: minTouchTarget,
              height: minTouchTarget,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SFSymbol
              name="square.and.arrow.up"
              size={20}
              color={accent}
              weight="semibold"
            />
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: flameScale }],
              marginBottom: 8,
            }}
          >
            <StreakFireAnimation size={168} />
          </Animated.View>

          <Text
            style={[
              systemText.title1,
              {
                color: colors.ink,
                textAlign: "center",
                marginTop: 12,
              },
            ]}
          >
            {days === 1 ? "1 day streak!" : `${days} day streak!`}
          </Text>

          <StreakWeekCard
            days={weekDays}
            accent={accent}
            surface={colors.surface}
            border={colors.border}
          />

          <Text
            style={{
              fontFamily: HANDWRITTEN,
              fontWeight: "400",
              fontSize: 22,
              lineHeight: 30,
              color: scriptColor,
              textAlign: "center",
              marginTop: 22,
            }}
          >
            Stay Consistent 🤎🌹✨
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            onPress={handleShare}
            onPressIn={() => setSharePressed(true)}
            onPressOut={() => setSharePressed(false)}
            accessibilityRole="button"
            accessibilityLabel="Share streak"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: accent,
              opacity: sharePressed ? 0.85 : 1,
            }}
          >
            <SFSymbol
              name="square.and.arrow.up"
              size={22}
              color={accent}
              weight="semibold"
            />
          </Pressable>

          <Pressable
            onPress={handleContinue}
            onPressIn={() => setContinuePressed(true)}
            onPressOut={() => setContinuePressed(false)}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={{
              flex: 1,
              minHeight: 56,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: continuePressed ? accentPressed : accent,
            }}
          >
            <Text style={[typography.button, { color: "#FFFFFF" }]}>
              Continue
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

type WeekDay = {
  label: string;
  iso: string;
  engaged: boolean;
  isFuture: boolean;
  isToday: boolean;
};

function StreakWeekCard({
  days,
  accent,
  surface,
  border,
}: {
  days: ReadonlyArray<WeekDay>;
  accent: string;
  surface: string;
  border: string;
}) {
  const engagedCount = days.filter((d) => d.engaged).length;
  const fillRatio = engagedCount <= 1 ? 0 : (engagedCount - 1) / 6;

  return (
    <View
      style={{
        alignSelf: "stretch",
        marginTop: 28,
        borderRadius: 20,
        backgroundColor: surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: border,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        {days.map((day) => (
          <Text
            key={`label-${day.iso}`}
            style={{
              width: 36,
              textAlign: "center",
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 11,
              letterSpacing: 0.4,
              color: accent,
              opacity: day.isFuture ? 0.45 : 1,
            }}
          >
            {day.label}
          </Text>
        ))}
      </View>

      <View style={{ height: 36, justifyContent: "center" }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            top: 17,
            height: 2,
            borderRadius: 1,
            backgroundColor: border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 2,
              width: `${fillRatio * 100}%`,
              backgroundColor: accent,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {days.map((day) => (
            <WeekDot
              key={day.iso}
              engaged={day.engaged}
              accent={accent}
              border={border}
              surface={surface}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function WeekDot({
  engaged,
  accent,
  border,
  surface,
}: {
  engaged: boolean;
  accent: string;
  border: string;
  surface: string;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: engaged ? accent : surface,
          borderWidth: engaged ? 0 : 1.5,
          borderColor: border,
        }}
      >
        {engaged ? (
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Path
              d="M3 7.2L5.8 10L11 4"
              stroke="#FFFFFF"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}
