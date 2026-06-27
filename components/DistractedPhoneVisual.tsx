import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Image } from "expo-image";
import { SFSymbol } from "@/components/Symbol";
import {
  SOCIAL_APP_ICON_SOURCES,
  type SocialAppKind,
} from "@/lib/socialAppIconAssets";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

type NotificationItem = {
  app: SocialAppKind;
  title: string;
  body: string;
  time: string;
};

const NOTIFICATIONS: ReadonlyArray<NotificationItem> = [
  {
    app: "instagram",
    title: "Instagram",
    body: "5 new posts from people you follow",
    time: "now",
  },
  {
    app: "tiktok",
    title: "TikTok",
    body: "Your friends posted new videos",
    time: "1m ago",
  },
  {
    app: "youtube",
    title: "YouTube",
    body: "Trending: you might like this",
    time: "2m ago",
  },
  {
    app: "snapchat",
    title: "Snapchat",
    body: "2 friends replied to your story",
    time: "3m ago",
  },
];

export type DistractedPhoneVisualProps = {
  /** Compact size so the mockup fits above the CTA without scrolling. */
  compact?: boolean;
  /** Dim notifications and show lock badges on each app icon. */
  locked?: boolean;
  /** Animate into the locked state on mount (screen 2). */
  animateLock?: boolean;
};

/**
 * Lock-screen phone mockup for onboarding — notifications from
 * real app icons visualizing morning distraction.
 */
export function DistractedPhoneVisual({
  compact = true,
  locked = false,
  animateLock = false,
}: DistractedPhoneVisualProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();

  const frameWidth = compact ? 200 : 248;
  const innerRadius = compact ? 26 : 32;
  const bezelRadius = compact ? 32 : 40;
  const bezelPadding = compact ? 8 : 10;
  const clockSize = compact ? 38 : 52;
  const minHeight = compact ? 268 : 400;

  const dimOpacity = useRef(new Animated.Value(locked && !animateLock ? 1 : 0)).current;
  const lockOpacity = useRef(new Animated.Value(locked && !animateLock ? 1 : 0)).current;

  useEffect(() => {
    if (!locked) return;

    if (!animateLock || reducedMotion) {
      dimOpacity.setValue(1);
      lockOpacity.setValue(1);
      return;
    }

    dimOpacity.setValue(0);
    lockOpacity.setValue(0);

    const dimAnim = Animated.timing(dimOpacity, {
      toValue: 1,
      duration: 700,
      delay: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const lockAnim = Animated.timing(lockOpacity, {
      toValue: 1,
      duration: 550,
      delay: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    Animated.parallel([dimAnim, lockAnim]).start();
  }, [animateLock, dimOpacity, lockOpacity, locked, reducedMotion]);

  const rowDim = dimOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.48],
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: frameWidth,
          borderRadius: bezelRadius,
          padding: bezelPadding,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.borderStrong,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <View
          style={{
            borderRadius: innerRadius,
            backgroundColor: colors.bg,
            overflow: "hidden",
            paddingHorizontal: compact ? 10 : 14,
            paddingTop: compact ? 12 : 18,
            paddingBottom: compact ? 10 : 16,
            minHeight,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: compact ? 12 : 20 }}>
            <View
              style={{
                width: compact ? 68 : 88,
                height: compact ? 20 : 26,
                borderRadius: 20,
                backgroundColor: colors.ink,
                opacity: 0.92,
              }}
            />
          </View>

          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: clockSize,
              lineHeight: clockSize + 4,
              letterSpacing: -1.2,
              color: colors.ink,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            7:42
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "500",
              fontSize: compact ? 11 : 13,
              color: colors.inkSecondary,
              textAlign: "center",
              marginBottom: compact ? 14 : 22,
            }}
          >
            Tuesday, June 16
          </Text>

          <View style={{ gap: compact ? 6 : 8 }}>
            {NOTIFICATIONS.map((item, index) => (
              <NotificationBanner
                key={item.app}
                item={item}
                offset={index % 2 === 0 ? 0 : 5}
                compact={compact}
                showLock={locked}
                lockOpacity={lockOpacity}
                contentOpacity={locked ? rowDim : 1}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function NotificationBanner({
  item,
  offset,
  compact,
  showLock,
  lockOpacity,
  contentOpacity,
}: {
  item: NotificationItem;
  offset: number;
  compact: boolean;
  showLock: boolean;
  lockOpacity: Animated.Value;
  contentOpacity: number | Animated.AnimatedInterpolation<number>;
}) {
  const colors = useColors();
  const iconSize = compact ? 28 : 34;
  const iconRadius = Math.round(iconSize * 0.225);

  return (
    <View
      style={{
        marginLeft: offset,
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: colors.surface,
        borderRadius: compact ? 13 : 16,
        paddingVertical: compact ? 7 : 10,
        paddingHorizontal: compact ? 8 : 10,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View>
        <Animated.View style={{ opacity: contentOpacity }}>
          <Image
            source={SOCIAL_APP_ICON_SOURCES[item.app]}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconRadius,
            }}
            contentFit="cover"
          />
        </Animated.View>
        {showLock ? (
          <Animated.View
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: compact ? 18 : 20,
              height: compact ? 18 : 20,
              borderRadius: compact ? 9 : 10,
              backgroundColor: colors.ink,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: colors.surface,
              opacity: lockOpacity,
              transform: [
                {
                  scale: lockOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            }}
          >
            <SFSymbol
              name="lock.fill"
              size={compact ? 9 : 10}
              color={colors.surface}
            />
          </Animated.View>
        ) : null}
      </View>
      <Animated.View
        style={{
          flex: 1,
          marginLeft: compact ? 8 : 10,
          paddingRight: 2,
          opacity: contentOpacity,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              fontSize: compact ? 11 : 12,
              color: colors.ink,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: compact ? 10 : 11,
              color: colors.inkSubtle,
              marginLeft: 4,
            }}
          >
            {item.time}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            fontSize: compact ? 11 : 12,
            lineHeight: compact ? 14 : 16,
            color: colors.inkMuted,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {item.body}
        </Text>
      </Animated.View>
    </View>
  );
}
