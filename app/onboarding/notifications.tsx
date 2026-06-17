import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";
import { requestNotificationPermission } from "@/lib/notifications";

/**
 * Screen 13 — "Let us show up before Instagram does."
 *
 * The notification permission ask, decoupled from the time pick.
 * On the old flow, the same screen did both; the new spec splits
 * them so the permission ask is its own beat — the user sees a
 * stylized preview of the daily notification, agrees to receive
 * one, and only THEN picks what time it should arrive (Screen 14).
 *
 * Splitting it has two benefits:
 *
 *   1. Higher permission acceptance. A user who's already
 *      committed to "yes, send me this" is more receptive to the
 *      iOS permission dialog when it appears as a confirmation
 *      step, rather than a pre-condition to picking a time.
 *
 *   2. Clearer mental model. The notification IS the thing — the
 *      daily 5-minute trigger is what the app is. Giving it its
 *      own screen frames it as the product, not as a setting.
 *
 * We do NOT pick a time here. We pre-stage the user's intent
 * (`notificationsEnabled` true/false) and then advance to the
 * time picker, which will use that flag to decide whether to
 * actually schedule when the user confirms their time.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";

  const handleTurnOn = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const status = await requestNotificationPermission();
      setAnswer("notificationsEnabled", status === "granted");
    } catch {
      // Treat any error as "user declined" — we still want to
      // advance to the time picker; settings has a recovery path.
      setAnswer("notificationsEnabled", false);
    } finally {
      setSubmitting(false);
      router.push("/onboarding/account");
    }
  };

  const handleSkip = () => {
    setAnswer("notificationsEnabled", false);
    router.push("/onboarding/account");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("notifications")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Let us show up{"\n"}before Instagram does.
            </Text>
          </FadeIn>

          <FadeIn delayMs={600}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              One notification. Every morning.{"\n"}That&apos;s all we&apos;ll ever send.
            </Text>
          </FadeIn>

          {/* Stylized notification preview card. Looks like an iOS
              notification: app icon chip on the left, app name +
              timestamp at the top, body text below. Uses the
              user's actual name. */}
          <FadeIn delayMs={1200}>
            <View className="mt-10">
              <NotificationPreview firstName={firstName} />
            </View>
          </FadeIn>

          <FadeIn delayMs={1700}>
            <Text
              className="text-ink-muted text-[14px] leading-[20px] text-center mt-8"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              Before the noise starts.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          {/* Bottom block. Originally `pt-6 pb-2`, which on smaller
              iPhones left "I'll do this later" sitting right on
              top of the home indicator (the SafeAreaView's bottom
              inset accounts for the indicator itself, but the link
              had no breathing room above it). Bumped to `pb-8` so
              there's a comfortable gutter on every screen size. */}
          <FadeIn delayMs={2200}>
            <View className="pt-6 pb-8">
              <Button
                label={submitting ? "Asking…" : "Turn on notifications"}
                onPress={handleTurnOn}
                disabled={submitting}
              />

              {/* `alignSelf: "center"` set inside Pressable's
                  function-form style isn't reliably honoured (the
                  link rendered flush-left on iOS), so we lift the
                  centering onto a dedicated wrapper View, which
                  always wins. */}
              <View className="items-center mt-3">
                {/* Padding via className — Pressable function-form
                    style is dropped on iOS RN 0.81. hitSlop adds
                    extra touch tolerance. */}
                <Pressable
                  hitSlop={12}
                  onPress={handleSkip}
                  disabled={submitting}
                  className="py-2.5 px-4 active:opacity-50"
                  style={submitting ? { opacity: 0.5 } : undefined}
                >
                  <Text
                    className="text-select text-[14px]"
                    style={{ fontFamily: "System", fontWeight: "500" }}
                  >
                    I&apos;ll do this later
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
 * iOS-style notification preview card. Not interactive — purely
 * illustrative. The body text uses the user's first name so the
 * preview reads as "this is what YOUR daily notification looks
 * like" instead of a generic mock.
 */
function NotificationPreview({ firstName }: { firstName: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        // Soft shadow on iOS, ignored on Android. Adds just enough
        // elevation to read as "notification card" rather than
        // "settings row."
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* App icon chip — Closer brand glyph, ink-fill rounded
          square. Same look as a real iOS notification icon slot. */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21s-7-4.5-7-11a5 5 0 019-3 5 5 0 019 3c0 6.5-7 11-7 11z"
            fill={colors.primaryFg}
          />
        </Svg>
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            Closer
          </Text>
          <Text
            style={{
              color: colors.inkSubtle,
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 12,
              marginLeft: 8,
            }}
          >
            · now
          </Text>
        </View>
        <Text
          style={{
            color: colors.ink,
            fontFamily: "System",
            fontWeight: "500",
            fontSize: 14,
            lineHeight: 20,
            marginTop: 2,
          }}
        >
          {firstName}, your word for today is ready.
        </Text>
      </View>
    </View>
  );
}
