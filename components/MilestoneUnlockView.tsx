import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from "react-native-svg";
import type { Milestone } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { TAB_ACCENT_RED } from "@/constants/theme";
import { typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

type MilestoneUnlockViewProps = {
  milestone: Milestone;
  badgeIndex: number;
  onViewMilestone?: () => void;
};

const BADGE_SIZE = 156;
const GLOW_SIZE = 320;
const BURST_SIZE = 300;

const BURST_COLORS = [
  TAB_ACCENT_RED,
  "#FF8A4C",
  "#C77DFF",
  "#FFFFFF",
  "#FFB347",
] as const;

function milestoneDayLine(day: number): string {
  return day === 1 ? "1 Day" : `${day} Days`;
}

/**
 * Post-sermon milestone unlock — shown after the streak screen.
 * Hierarchy mirrors a celebration moment: big "Hooray!", softer
 * subtitle, badge with burst, title, day count, and a detail link.
 */
export function MilestoneUnlockView({
  milestone,
  badgeIndex,
  onViewMilestone,
}: MilestoneUnlockViewProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const badgePop = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const burstSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;

    Animated.sequence([
      Animated.timing(enter, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(badgePop, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    glowLoop.start();

    const burstLoop = Animated.loop(
      Animated.timing(burstSpin, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    burstLoop.start();

    return () => {
      glowLoop.stop();
      burstLoop.stop();
    };
  }, [enter, badgePop, glowPulse, burstSpin, reducedMotion]);

  const headlineOpacity = enter;
  const headlineY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const badgeScale = badgePop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });
  const badgeOpacity = badgePop;
  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.14],
  });
  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.62],
  });
  const innerGlowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });
  const burstRotation = burstSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const burstOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.72],
  });

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: headlineOpacity,
            transform: [{ translateY: headlineY }],
            alignItems: "center",
          }}
        >
          <Text style={[styles.hooray, { color: colors.ink }]}>Hooray!</Text>
          <Text style={[styles.reached, { color: colors.inkMuted }]}>
            Milestone reached
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: badgeOpacity,
            transform: [{ scale: badgeScale }],
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <View style={styles.badgeStage}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.burstLayer,
                {
                  opacity: burstOpacity,
                  transform: [{ rotate: burstRotation }],
                },
              ]}
            >
              <CelebrationBurst size={BURST_SIZE} />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.glowLayer,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            >
              <BadgeGlowRing
                size={GLOW_SIZE}
                opacity={1}
                gradientId="milestoneGlowOuter"
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.glowLayer,
                {
                  opacity: innerGlowOpacity,
                  transform: [
                    {
                      scale: glowPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <BadgeGlowRing
                size={GLOW_SIZE * 0.72}
                opacity={0.9}
                gradientId="milestoneGlowInner"
              />
            </Animated.View>

            <View style={styles.badgeCluster}>
              <View
                style={[
                  styles.badgeCard,
                  Platform.OS === "ios"
                    ? {
                        shadowColor: TAB_ACCENT_RED,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.55,
                        shadowRadius: 16,
                      }
                    : null,
                ]}
              >
                <Image
                  source={getMilestoneBadge(badgeIndex)}
                  style={styles.badgeImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
            </View>
          </View>

          <Text
            style={[styles.milestoneTitle, { color: colors.ink }]}
            accessibilityRole="header"
          >
            {milestone.title}
          </Text>
          <Text style={[styles.dayLine, { color: colors.inkMuted }]}>
            {milestoneDayLine(milestone.day)}
          </Text>

          {onViewMilestone ? (
            <Pressable
              onPress={onViewMilestone}
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel={`View milestone, ${milestone.title}`}
              style={({ pressed }) => [
                styles.viewLinkHit,
                pressed && { opacity: 0.72 },
              ]}
            >
              <Text style={styles.viewLink}>View milestone</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <Text style={[styles.footer, { color: colors.inkMuted }]}>
        Celebrate this step — small faithfulness is real faithfulness.
      </Text>
    </View>
  );
}

function CelebrationBurst({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const rayCount = 20;
  const innerR = size * 0.14;
  const outerR = size * 0.48;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: rayCount }, (_, i) => {
        const angle = (i / rayCount) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        const color = BURST_COLORS[i % BURST_COLORS.length];
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
            strokeOpacity={i % 2 === 0 ? 0.55 : 0.35}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

function BadgeGlowRing({
  size,
  opacity,
  gradientId,
}: {
  size: number;
  opacity: number;
  gradientId: string;
}) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={TAB_ACCENT_RED} stopOpacity={0.55 * opacity} />
          <Stop offset="42%" stopColor={TAB_ACCENT_RED} stopOpacity={0.22 * opacity} />
          <Stop offset="100%" stopColor={TAB_ACCENT_RED} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  hooray: {
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  reached: {
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 4,
  },
  badgeStage: {
    alignItems: "center",
    justifyContent: "center",
    width: GLOW_SIZE,
    minHeight: BADGE_SIZE + 24,
  },
  burstLayer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: BURST_SIZE,
    height: BURST_SIZE,
    marginLeft: -BURST_SIZE / 2,
    marginTop: -BURST_SIZE / 2 - 8,
    alignItems: "center",
    justifyContent: "center",
  },
  glowLayer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    marginLeft: -GLOW_SIZE / 2,
    marginTop: -GLOW_SIZE / 2 - 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCluster: {
    alignItems: "center",
    zIndex: 2,
    position: "relative",
  },
  badgeCard: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 2,
    borderColor: TAB_ACCENT_RED,
  },
  badgeImage: {
    width: "100%",
    height: "100%",
  },
  milestoneTitle: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    textAlign: "center",
    marginTop: 28,
    maxWidth: 300,
  },
  dayLine: {
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 6,
  },
  viewLinkHit: {
    marginTop: 14,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  viewLink: {
    ...typography.body,
    fontWeight: "600",
    color: TAB_ACCENT_RED,
    textAlign: "center",
  },
  footer: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 32,
    paddingBottom: 12,
  },
});
