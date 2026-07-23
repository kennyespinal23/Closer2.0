import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Screen 10 — The Rating Request.
 *
 * The spec calls for a priming screen BEFORE the native iOS
 * SKStoreReviewController prompt fires. That's deliberate: iOS
 * silently rate-limits the native prompt (3 times / 365 days /
 * version), so you don't want to burn an ask on a user who's
 * about to dismiss it. By showing one primer screen first, we
 * filter for engaged users and let the native prompt land on
 * people who've already said yes once.
 *
 * Flow:
 *
 *   1. User taps "Rate Closer" → we call StoreReview.requestReview().
 *      The native SKStoreReviewController appears in a
 *      modal-over-screen. The user rates (or doesn't); we don't
 *      get a callback either way. Either path advances onboarding
 *      after a short delay so the modal has time to dismiss
 *      cleanly.
 *
 *   2. User taps "Maybe later" → we skip the prompt entirely and
 *      advance immediately. We never re-ask in onboarding; the
 *      profile screen can offer a "rate the app" affordance.
 *
 * Edge cases:
 *
 *   • On simulator / unsupported devices, `isAvailableAsync`
 *     returns false. We treat that the same as "Maybe later" —
 *     advance without trying to fire a prompt that won't render.
 *
 *   • A previous version may have already burned the 3-per-year
 *     quota. `requestReview` silently no-ops; the user sees
 *     nothing happen; we still advance.
 */
export default function RatingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers } = useOnboarding();
  const [requesting, setRequesting] = useState(false);

  const firstName = (answers.name || "").trim().split(" ")[0];

  const handleRate = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      // iOS-only — Android/Web fall through to the catch and we
      // advance the same as "Maybe later." The simulator returns
      // true for `isAvailableAsync` but the prompt won't render;
      // calling it anyway is the documented best practice.
      const available = await StoreReview.isAvailableAsync();
      if (available && Platform.OS === "ios") {
        await StoreReview.requestReview();
      }
    } catch {
      // Swallow — we'd rather advance silently than block the
      // user on a permission/availability error during onboarding.
    } finally {
      // Always advance, with a small delay so the native modal
      // (if it appeared) has a moment to dismiss before we push
      // the next screen on top of it.
      setTimeout(() => router.push("/onboarding/notifications"), 400);
    }
  };

  const handleSkip = () => router.push("/onboarding/notifications");

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("rating")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-6"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              One quick thing
              {firstName ? `, ${firstName}.` : "."}
            </Text>
          </FadeIn>

          <FadeIn delayMs={600}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] mt-4"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              We&apos;re just getting started — but if Closer feels like
              something you&apos;ve been looking for, a review helps others
              find it too.
            </Text>
          </FadeIn>

          {/* Visual stars block — illustrative only, not interactive.
              The actual star selection happens in the native iOS
              modal once they tap the CTA. */}
          <FadeIn delayMs={1200}>
            <View className="items-center mt-10 mb-4">
              <StarRow color={colors.accent} />
              <Text
                className="text-ink-muted text-[13px] tracking-[2px] mt-3 uppercase"
                style={{ fontFamily: "System", fontWeight: "600" }}
              >
                Tap once to rate
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={1700}>
            <Text
              className="text-ink text-[15px] leading-[22px] mt-6 text-center px-2"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              People who feel far from God are searching right now.{"\n"}
              A rating helps us reach them.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          {/* Bottom block. `pb-8` (vs the prior `pb-2`) keeps
              "Maybe later" off the home indicator on smaller
              devices. The centering wrapper around the link is the
              same workaround used on punch/notifications — see the
              note in notifications.tsx. */}
          <FadeIn delayMs={2200}>
            <View className="pt-6 pb-8">
              <Button
                label={requesting ? "Opening…" : "Rate Closer"}
                onPress={handleRate}
                disabled={requesting}
              />

              <View className="items-center mt-3">
                {/* Padding via className — Pressable function-form
                    style is dropped on iOS RN 0.81, leaving the
                    text link with no visible hit-area padding.
                    hitSlop adds extra touch tolerance. */}
                <Pressable
                  hitSlop={12}
                  onPress={handleSkip}
                  disabled={requesting}
                  className="py-2.5 px-4 active:opacity-50"
                  style={requesting ? { opacity: 0.5 } : undefined}
                >
                  <Text
                    className="text-select text-[14px]"
                    style={{ fontFamily: "System", fontWeight: "500" }}
                  >
                    Maybe later
                  </Text>
                </Pressable>
              </View>
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Five-star illustrative row. Not pressable on its own — the
 * actual rating UI is the iOS native modal. This row exists to
 * set the visual expectation of what they're about to interact
 * with.
 */
function StarRow({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Svg key={i} width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2l3 6.5 7 .9-5.1 4.9 1.4 7.2L12 17.8 5.7 21.5l1.4-7.2L2 9.4l7-.9L12 2z"
            fill={color}
          />
        </Svg>
      ))}
    </View>
  );
}
