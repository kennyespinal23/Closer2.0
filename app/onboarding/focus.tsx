import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { BrandGlyph } from "@/components/BrandGlyph";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { progressFor } from "@/constants/onboarding";
import { SOCIAL_APPS } from "@/lib/focus";
import { useFocus } from "@/state/focus";
import { useColors } from "@/state/theme";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Same iOS-system-blue used throughout the focus surface (home
 * toggle pill, in-sermon banner, settings shield). Pinned here as
 * well so the hero shield reads as the same feature visually,
 * even though this screen also leans on the warm accent for its
 * ambient glow.
 */
const FOCUS_ACCENT = "#0A84FF";

/**
 * Onboarding — Focus mode introduction.
 *
 * Lives between /reminders and /paywall. The narrative arc of
 * onboarding has just resolved "we'll wake you with a notification"
 * — this screen is the natural follow-up:
 *
 *   "Now that you'll be here at the same time every day, here's
 *    how we'll guard those few minutes."
 *
 * Design intent:
 *   • A breathing shield is the hero — quiet authority, not a
 *     security pop-up. The halo behind it pulses subtly so the
 *     screen feels alive even when the user is reading.
 *   • Below the headline, a real preview of the app glyphs being
 *     quieted (the catalog's defaults) — Instagram, TikTok, etc.
 *     Seeing the actual brand tiles makes the abstract idea of
 *     "blocking apps" concrete in two seconds.
 *   • The primary CTA flips `prefs.enabled` on; the screen never
 *     starts a session itself (that's the sermon flow's job).
 *   • Secondary CTA — "Not now" — skips without enabling. We don't
 *     punish or guilt the skipper; the row is also available
 *     anytime from settings/profile.
 */
export default function FocusOnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setEnabled } = useFocus();

  // Preview the catalog's *default* blocked set rather than the
  // user's current prefs.blockedAppIds. Reasoning: this is the
  // first time the user is seeing the feature, so they haven't
  // had a chance to edit the list — showing the defaults frames
  // the pitch ("here's what we'd quiet for you") instead of
  // showing nothing on a brand-new install where the array might
  // have just been re-hydrated to the wash defaults.
  const previewIds = useMemo(
    () => SOCIAL_APPS.slice(0, 6).map((a) => a.id),
    [],
  );

  const goToPaywall = () => router.push("/onboarding/paywall");

  const handleEnable = () => {
    setEnabled(true);
    goToPaywall();
  };

  const handleSkip = () => {
    // Leave prefs.enabled at its default (false). The feature
    // remains discoverable via settings and the profile drawer.
    goToPaywall();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("focus")} />

      {/* Ambient warm glow at the bottom edge — keeps the screen's
          color tone connected to the rest of the onboarding chain
          (which leans warm accent), even though the hero shield
          itself reads cool/blue. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -320,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <SunriseGlow accent={colors.accent} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0} durationMs={1200}>
            <View className="items-center mt-6">
              <BreathingShield />
            </View>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] text-center mt-7"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Quiet the noise while you read.
            </Text>
          </FadeIn>

          <FadeIn delayMs={900}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] text-center mt-4 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              When you begin a sermon, Closer can softly mute the apps
              that usually pull your attention so the next few minutes
              stay with the Word.
            </Text>
          </FadeIn>

          {/* Preview stack — small, recognizable brand chips of the
              apps that'd be quieted by default. The "+N" pill at
              the end signals there's more in the picker without
              cramming every chip into a single row. */}
          <FadeIn delayMs={1500}>
            <View className="mt-9 items-center">
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-4"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Quieted by default
              </Text>
              <AppPreviewStack
                ids={previewIds}
                total={SOCIAL_APPS.length}
              />
              <Text
                className="text-ink-subtle text-[12px] mt-4"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Customize the list any time from settings.
              </Text>
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[32px]" />

          <FadeIn delayMs={2000}>
            <View className="pb-2">
              <Button
                label="Quiet these while I read"
                onPress={handleEnable}
              />

              <Pressable
                hitSlop={12}
                onPress={handleSkip}
                className="self-center mt-5 py-2 px-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text
                  className="text-ink-muted text-[15px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Not now
                </Text>
              </Pressable>

              <Text
                className="text-ink-subtle text-[11.5px] text-center mt-4 leading-[17px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                Focus stays on until the sermon ends. Nothing is
                blocked outside of those few minutes.
              </Text>
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// AppPreviewStack — overlapping row of brand chips, fronted with
//                   visible glyphs so the user immediately sees
//                   which apps would be quieted
//
// Slightly larger overlap than the home FocusToggle's stack because
// we have more horizontal room on this dedicated screen.
// ─────────────────────────────────────────────────────────────────

function AppPreviewStack({
  ids,
  total,
}: {
  ids: ReadonlyArray<string>;
  total: number;
}) {
  const colors = useColors();
  const remaining = Math.max(0, total - ids.length);

  // Cap the visible chips to whatever fits on a narrow device — the
  // 6-chip default in the catalog is safe down to iPhone SE because
  // each chip is 32pt with -10pt margins.
  const visible = ids.slice(0, 6);

  return (
    <View className="flex-row items-center">
      {visible.map((id, i) => (
        <View
          key={id}
          style={{
            marginLeft: i === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: colors.bg,
            borderRadius: 10,
          }}
        >
          <BrandGlyph appId={id} size="sm" />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={{
            marginLeft: -10,
            borderWidth: 2,
            borderColor: colors.bg,
            borderRadius: 10,
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            // Neutral wash for the overflow chip — visually equal
            // weight to the brand chips but reads as "and more"
            // instead of "another app."
            backgroundColor: `${colors.ink}1F`,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 11,
              color: colors.ink,
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// BreathingShield — animated hero glyph
//
// A blue iOS-shield silhouette on top of two stacked halos:
//   • Outer halo — large, slow-pulse, low opacity. Reads as
//     "ambient calm" — drifts in/out over ~4.5s.
//   • Inner halo — tighter, syncs to the shield's subtle scale
//     pulse so the icon feels like it's breathing.
//
// The whole composition is decorative; nothing touches state.
// ─────────────────────────────────────────────────────────────────

function BreathingShield() {
  const colors = useColors();
  const halo = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.04,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    haloLoop.start();
    scaleLoop.start();
    return () => {
      haloLoop.stop();
      scaleLoop.stop();
    };
  }, [halo, scale]);

  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.65],
  });
  const innerHaloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  const HERO_SIZE = 220;
  const SHIELD_SIZE = 84;

  return (
    <View
      style={{
        width: HERO_SIZE,
        height: HERO_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer blue halo */}
      <Animated.View
        style={{
          position: "absolute",
          opacity: haloOpacity,
          // Halo expands a touch as it brightens — gives the
          // breathing effect a sense of inhale/exhale rather than
          // just a flat opacity oscillation.
          transform: [
            {
              scale: halo.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1.05],
              }),
            },
          ],
        }}
      >
        <Svg width={HERO_SIZE} height={HERO_SIZE}>
          <Defs>
            <RadialGradient
              id="focusHaloOuter"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
            >
              <Stop offset="0%" stopColor={FOCUS_ACCENT} stopOpacity={0.45} />
              <Stop offset="55%" stopColor={FOCUS_ACCENT} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={FOCUS_ACCENT} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={HERO_SIZE}
            height={HERO_SIZE}
            fill="url(#focusHaloOuter)"
          />
        </Svg>
      </Animated.View>

      {/* Inner tighter halo */}
      <Animated.View
        style={{
          position: "absolute",
          opacity: innerHaloOpacity,
        }}
      >
        <Svg width={HERO_SIZE * 0.65} height={HERO_SIZE * 0.65}>
          <Defs>
            <RadialGradient
              id="focusHaloInner"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
            >
              <Stop offset="0%" stopColor={FOCUS_ACCENT} stopOpacity={0.55} />
              <Stop offset="50%" stopColor={FOCUS_ACCENT} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={FOCUS_ACCENT} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={HERO_SIZE * 0.65}
            height={HERO_SIZE * 0.65}
            fill="url(#focusHaloInner)"
          />
        </Svg>
      </Animated.View>

      {/* Shield itself — sits centered, breathes with the halos */}
      <Animated.View
        style={{
          width: SHIELD_SIZE,
          height: SHIELD_SIZE,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        <Svg
          width={SHIELD_SIZE}
          height={SHIELD_SIZE}
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Soft fill behind the stroke so the shield reads as a
              tinted disc, not an outline. Picks the same blue as
              the accent so the shape sits naturally in the halo. */}
          <Path
            d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
            fill={FOCUS_ACCENT}
            fillOpacity={0.18}
          />
          <Path
            d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
            stroke={FOCUS_ACCENT}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Small checkmark inside the shield — quiet affirmation
              that this is protection, not restriction. */}
          <Path
            d="M8.5 12.2l2.4 2.4 4.6-4.8"
            stroke={FOCUS_ACCENT}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Decorative orbital ring — drawn statically below the
          breathing shield. Suggests "the moment is being held"
          without competing with the icon itself. Width is sized
          so the ring sits just outside the shield's silhouette. */}
      <View pointerEvents="none" style={{ position: "absolute" }}>
        <Svg
          width={HERO_SIZE * 0.58}
          height={HERO_SIZE * 0.58}
          viewBox="0 0 100 100"
        >
          <Circle
            cx={50}
            cy={50}
            r={48}
            fill="none"
            stroke={colors.borderStrong}
            strokeOpacity={0.45}
            strokeWidth={0.6}
            strokeDasharray="2 4"
          />
        </Svg>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// SunriseGlow — same warm radial gradient as the /quiet screen,
//               redrawn here so the onboarding tail keeps a
//               consistent atmospheric warmth.
// ─────────────────────────────────────────────────────────────────

function SunriseGlow({ accent }: { accent: string }) {
  const SIZE = Math.max(640, SCREEN_W);
  return (
    <Svg width={SIZE} height={SIZE}>
      <Defs>
        <RadialGradient id="focusSunrise" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.4} />
          <Stop offset="30%" stopColor={accent} stopOpacity={0.18} />
          <Stop offset="65%" stopColor={accent} stopOpacity={0.05} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={SIZE}
        height={SIZE}
        fill="url(#focusSunrise)"
      />
    </Svg>
  );
}
