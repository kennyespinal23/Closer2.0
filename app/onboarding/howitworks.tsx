import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT } from "@/constants/theme";

/**
 * Screen 12.5 — How Closer works.
 *
 * Sits between /reframe (where the brand is named for the first
 * time) and /attribution (the analytics question that begins the
 * setup half). Until this screen the user has been told what
 * Closer IS ("Meet God before the noise"). This screen shows
 * what Closer DOES.
 *
 * Modeled after the way Opal / Forest / One Sec walk the user
 * through their mechanism on first launch — a 3-step interactive
 * card with dot pagination + a Continue button. Each card visually
 * stages one beat of the loop:
 *
 *   1. We block your apps.
 *      Shows a row of app icons being locked behind a shield
 *      with a soft iOS-blue glow.
 *
 *   2. You read today's sermon.
 *      Shows a sermon card with a reading progress arc
 *      filling in.
 *
 *   3. Your apps unlock for the day.
 *      Shows the same app row, now lit / unlocked, with the
 *      shield faded out.
 *
 * The interactive bit is the swipe / tap pagination — the user
 * advances at their own pace and finishes the screen with the
 * mechanism in their hands, not just in the copy. The card stays
 * a fixed height so the page doesn't reflow when you swipe
 * between steps.
 */
const ACCENT = CLOSER_ACCENT;
const STEP_COUNT = 3;
const CARD_HEIGHT = 340;

type Step = {
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: ReadonlyArray<Step> = [
  {
    eyebrow: "Step 1",
    title: "We quiet your apps",
    body: "When you wake up, the apps you can't help opening — Instagram, TikTok, the rest — are silenced. The shield is on.",
  },
  {
    eyebrow: "Step 2",
    title: "You read today's sermon",
    body: "Five minutes. One verse. One thought. Before anything else gets to you first. This is the moment the whole app is built for.",
  },
  {
    eyebrow: "Step 3",
    title: "Your apps unlock",
    body: "Once you've sat with the Word, the shield comes down. You've started the day with God, not with the algorithm.",
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Smooth cross-fade between cards. Each time `step` changes, fade
  // the new card in from 0 → 1 over ~280ms. Using a single shared
  // value (vs one-per-step) keeps the diff tiny.
  const cardOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, cardOpacity]);

  const isLast = step === STEP_COUNT - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      router.push("/onboarding/attribution");
      return;
    }
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("howitworks")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink-muted text-[12.5px] tracking-[2.4px] uppercase mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              How it works
            </Text>
          </FadeIn>

          <FadeIn delayMs={300}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              A simple loop, every{"\n"}morning.
            </Text>
          </FadeIn>

          {/* The card — fixed height so paginating doesn't reflow
              the surrounding chrome. Renders the current step's
              visual + copy with a fade-in on every change. */}
          <FadeIn delayMs={700}>
            <Animated.View
              style={{
                opacity: cardOpacity,
                marginTop: 28,
                height: CARD_HEIGHT,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(20,20,22,0.85)",
                overflow: "hidden",
              }}
            >
              {/* Visual half (top ~60%) */}
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {step === 0 ? <BlockedAppsVisual /> : null}
                {step === 1 ? <SermonVisual /> : null}
                {step === 2 ? <UnlockedAppsVisual /> : null}
              </View>

              {/* Copy half (bottom ~40%) */}
              <View
                style={{
                  paddingHorizontal: 22,
                  paddingTop: 16,
                  paddingBottom: 22,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{
                    color: ACCENT,
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 11,
                    letterSpacing: 2.4,
                    textTransform: "uppercase",
                  }}
                >
                  {current.eyebrow}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 19,
                    letterSpacing: -0.3,
                    marginTop: 6,
                  }}
                >
                  {current.title}
                </Text>
                <Text
                  style={{
                    color: "#C2C2C7",
                    fontFamily: "System",
                    fontWeight: "400",
                    fontSize: 14.5,
                    lineHeight: 22,
                    marginTop: 6,
                  }}
                >
                  {current.body}
                </Text>
              </View>
            </Animated.View>
          </FadeIn>

          {/* Dot pagination + back/skip affordance. The dots are
              tappable so the user can jump directly to a step,
              matching the affordance most app blockers use on
              their welcome carousels. */}
          <FadeIn delayMs={900}>
            <View
              style={{
                marginTop: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {Array.from({ length: STEP_COUNT }).map((_, i) => {
                const active = i === step;
                return (
                  <Pressable
                    key={i}
                    hitSlop={10}
                    onPress={() => setStep(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Step ${i + 1}`}
                  >
                    <View
                      style={{
                        width: active ? 22 : 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: active
                          ? ACCENT
                          : "rgba(255,255,255,0.22)",
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </FadeIn>

          {/* Spacer pushes the action row to the bottom of the
              viewport on tall devices but allows scroll on short
              ones. */}
          <View className="flex-1 min-h-[16px]" />

          {/* Action row — Back (subtle, only when applicable) +
              primary Continue / "I'm ready". */}
          <View className="pt-6 pb-2">
            <Button
              label={isLast ? "I'm ready" : "Next"}
              onPress={handleNext}
            />
            {step > 0 ? (
              <View className="items-center mt-3">
                <Pressable
                  hitSlop={12}
                  onPress={handleBack}
                  className="py-2.5 px-4 active:opacity-60"
                >
                  <Text
                    style={{
                      color: "#9B9BA3",
                      fontFamily: "System",
                      fontWeight: "500",
                      fontSize: 14,
                    }}
                  >
                    Back
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Visuals
// ─────────────────────────────────────────────────────────────────

/** Step 1 — a row of app icons (Instagram / TikTok / X) sitting
 *  behind a glowing iOS-blue shield. The shield is the visual
 *  metaphor we re-use across the app on every focus surface, so
 *  introducing it here lets the user recognize it later when
 *  they see it on the mini-player and the home hero. */
function BlockedAppsVisual() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", gap: 14, opacity: 0.45 }}>
        <AppTile color="#E1306C" />
        <AppTile color="#000000" border />
        <AppTile color="#1DA1F2" />
      </View>
      <View style={{ marginTop: -14, alignItems: "center" }}>
        <ShieldGlow active />
      </View>
      <Text
        style={{
          color: ACCENT,
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 11,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          marginTop: 8,
        }}
      >
        Apps locked
      </Text>
    </View>
  );
}

/** Step 2 — the sermon card with a reading-progress arc that
 *  fills in as the user reads. We mimic the actual sermon-card
 *  visual the user will see on Today so this screen reads as a
 *  preview, not a generic illustration. */
function SermonVisual() {
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fill, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(400),
        Animated.timing(fill, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [fill]);

  const widthInterpolation = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        width: 240,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        padding: 16,
      }}
    >
      <Text
        style={{
          color: "#9B9BA3",
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Today&apos;s sermon
      </Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 16,
          marginTop: 8,
          letterSpacing: -0.2,
        }}
      >
        Be still, and know.
      </Text>
      <Text
        style={{
          color: "#A1A1AA",
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 13,
          lineHeight: 18,
          marginTop: 6,
        }}
      >
        &ldquo;Be still, and know that I am God.&rdquo;
      </Text>
      <Text
        style={{
          color: ACCENT,
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 11,
          letterSpacing: 1.6,
          marginTop: 6,
        }}
      >
        — PSALM 46:10
      </Text>

      <View
        style={{
          marginTop: 14,
          height: 4,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: widthInterpolation,
            backgroundColor: ACCENT,
            borderRadius: 999,
          }}
        />
      </View>
      <Text
        style={{
          color: "#9B9BA3",
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 11,
          marginTop: 8,
        }}
      >
        5 min · 1 verse · 1 thought
      </Text>
    </View>
  );
}

/** Step 3 — the same app row from step 1, now at full opacity
 *  and lit from below, with a subtle check icon where the shield
 *  used to be. Same visual vocabulary so the "before / after"
 *  symmetry lands without us having to say it. */
function UnlockedAppsVisual() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", gap: 14 }}>
        <AppTile color="#E1306C" lit />
        <AppTile color="#000000" border lit />
        <AppTile color="#1DA1F2" lit />
      </View>
      <View style={{ marginTop: 18, alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(52, 199, 89, 0.16)",
            borderWidth: 1,
            borderColor: "rgba(52, 199, 89, 0.45)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17l-5-5"
              stroke="#34C759"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text
          style={{
            color: "#34C759",
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 11,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            marginTop: 8,
          }}
        >
          Apps unlocked
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tiny visual primitives
// ─────────────────────────────────────────────────────────────────

/** A 52pt rounded app tile in a brand color. The `lit` variant
 *  adds a soft glow underneath so the unlocked-state row reads
 *  as energized rather than just opaque. */
function AppTile({
  color,
  border,
  lit,
}: {
  color: string;
  border?: boolean;
  lit?: boolean;
}) {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: color,
        borderWidth: border ? 1 : 0,
        borderColor: "rgba(255,255,255,0.15)",
        shadowColor: lit ? color : "transparent",
        shadowOpacity: lit ? 0.55 : 0,
        shadowRadius: lit ? 14 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

/** Shield glyph in iOS-blue with a soft accent halo. Same visual
 *  shorthand we use on the home focus hero so the user starts
 *  recognizing the symbol before they ever see it in the live
 *  app. */
function ShieldGlow({ active }: { active: boolean }) {
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: active
          ? "rgba(10, 132, 255, 0.18)"
          : "transparent",
        borderWidth: 1,
        borderColor: active
          ? "rgba(10, 132, 255, 0.45)"
          : "transparent",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: ACCENT,
        shadowOpacity: active ? 0.5 : 0,
        shadowRadius: active ? 18 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l9 4v6c0 5-3.8 9.4-9 10-5.2-.6-9-5-9-10V6l9-4z"
          fill={ACCENT}
          stroke={ACCENT}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
        <Path
          d="M8 9V8a4 4 0 118 0v1"
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M7 11h10v6H7z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}
