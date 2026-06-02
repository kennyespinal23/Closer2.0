import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding } from "@/state/onboarding";
import { useStudySessions } from "@/state/studySessions";
import { DEFAULT_BLOCKED_APP_IDS } from "@/lib/focus";

/**
 * Screen 16 — The Welcome.
 *
 * The payoff. Eight screens of no scripture, no church language —
 * and now this. Black canvas, red scripture, the user's name on
 * the page, and a single forward CTA that drops them into the
 * app.
 *
 * Two side-effects happen on this screen, in the background:
 *
 *   1. We silently seed a "Daily Bible Study" routine in the
 *      Practice tab — 8:00 AM, Mon–Fri, focus mode on, default
 *      blocked app list. The user can edit, disable, or delete
 *      it from /settings/study-sessions later. This is the
 *      "background seed" path the user picked during planning —
 *      no onboarding screen for it, but a sensible default lives
 *      in their Practice tab from day one.
 *
 *   2. We could also schedule a system-default focus session
 *      tied to the morning notification time, but Phase 1's
 *      focus shielding is honor-mode anyway — the silent study
 *      session already brings focus into the schedule. We'll
 *      revisit when Phase 2 (real ManagedSettings) lands.
 *
 * Seeding runs once on mount with an idempotency key (the
 * studySessions provider's `upsertSystemSession` matches by name)
 * so re-entering this screen — e.g. via the dev "reset
 * onboarding" affordance — doesn't multiply routines.
 */

const SYSTEM_STUDY_NAME = "Daily Bible Study";
const SYSTEM_STUDY_TIME = { hour: 8, minute: 0 };
// Mon..Fri — the most common cadence per the existing study
// session model. WeekdayIndex is 0=Sun..6=Sat.
const SYSTEM_STUDY_DAYS = [1, 2, 3, 4, 5] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const { upsertSystemSession } = useStudySessions();

  const firstName = (answers.name || "").trim().split(" ")[0];

  // Track whether we've already attempted the seed this mount,
  // so React strict-mode double-invocations don't double-call
  // upsertSystemSession. The upsert is idempotent by name anyway,
  // but the ref gives us a clean "exactly-once" surface.
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    // Fire-and-forget. The user's already on the screen; we don't
    // want to block the welcome animation on storage writes or
    // notification scheduling.
    void upsertSystemSession({
      name: SYSTEM_STUDY_NAME,
      source: "system",
      time: SYSTEM_STUDY_TIME,
      daysOfWeek: [...SYSTEM_STUDY_DAYS],
      enabled: true,
      useFocusMode: true,
      blockedAppIds: [...DEFAULT_BLOCKED_APP_IDS],
    }).catch(() => {
      // Non-fatal: even if seeding fails, the user can create a
      // routine manually from the Practice tab. We just don't
      // surface the failure during the welcome moment.
    });
  }, [upsertSystemSession]);

  const handleEnterApp = () => {
    // Replace so the user can't swipe-back into the paywall or
    // welcome from inside the app. This is the final boundary
    // between onboarding and the app proper.
    router.replace("/today");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 justify-center">
          {/* Red eyebrow with the user's name. Caps, tracked
              wide so the type carries weight without going big. */}
          <FadeIn delayMs={300} durationMs={1000}>
            <Text
              style={{
                color: RED,
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 13,
                letterSpacing: 3.5,
                marginBottom: 18,
              }}
            >
              {firstName ? `${firstName.toUpperCase()}, YOU'RE HERE.` : "YOU'RE HERE."}
            </Text>
          </FadeIn>

          <FadeIn delayMs={1200} durationMs={1000}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 17,
                lineHeight: 26,
              }}
            >
              That&apos;s already more than you think.
            </Text>
          </FadeIn>

          <FadeIn delayMs={2200} durationMs={900}>
            <Text
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                lineHeight: 25,
                marginTop: 18,
              }}
            >
              You don&apos;t have to have it together.{"\n"}
              You just have to show up.
            </Text>
          </FadeIn>

          {/* The scripture card. Red left border + ink-white
              scripture text. The reference is dimmer below. */}
          <FadeIn delayMs={3500} durationMs={1000}>
            <View
              style={{
                marginTop: 36,
                paddingLeft: 18,
                paddingVertical: 4,
                borderLeftWidth: 3,
                borderLeftColor: RED,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontStyle: "italic",
                  fontSize: 18,
                  lineHeight: 28,
                  letterSpacing: -0.1,
                }}
              >
                &ldquo;The Lord is close to the brokenhearted{"\n"}
                and saves those who are crushed in spirit.&rdquo;
              </Text>
              <Text
                style={{
                  color: RED,
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  letterSpacing: 1.6,
                  marginTop: 12,
                }}
              >
                — PSALM 34:18
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={5000} durationMs={900}>
            <Text
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 15,
                lineHeight: 23,
                marginTop: 28,
              }}
            >
              Your first word.
            </Text>
          </FadeIn>
        </View>

        {/* Final CTA — wide, ink-white pill. Same visual idiom as
            the paywall CTA so the user's last two actions on the
            black canvas feel consistent. */}
        <FadeIn delayMs={5800} durationMs={900}>
          <View className="px-6 pb-4">
            <Pressable
              onPress={handleEnterApp}
              accessibilityRole="button"
              accessibilityLabel="Enter the app"
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: "#000000",
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 16,
                  letterSpacing: 0.1,
                }}
              >
                I&apos;m ready
              </Text>
            </Pressable>
          </View>
        </FadeIn>
      </SafeAreaView>
    </View>
  );
}

// Single red used on the eyebrow, the scripture card's left
// border, and the reference label. Matches the spec's "red
// scripture text" cue. Same RED as the calculating screen's
// progress bar — it's the only color in the whole onboarding,
// and it appears at the start (calculating loader) and the end
// (welcome scripture). Bookends.
const RED = "#E53935";
