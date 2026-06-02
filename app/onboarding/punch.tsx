import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding, type ScrollBucket } from "@/state/onboarding";

/**
 * Screen 6 — The Gut Punch.
 *
 * THE most important screen of the audit half. Three previous
 * screens were data collection in disguise; this screen is the
 * reveal. The user named the apps. The user named the duration.
 * Now they see the consequence.
 *
 * Composition:
 *
 *   1. "[Name]," — but wait, we don't HAVE the name yet. The name
 *      is captured on Screen 8, AFTER this punch. So this screen
 *      addresses the user as "Listen," instead — a second-person
 *      callout that doesn't require knowing them yet. (The
 *      spec's "[Name]" sketch was aspirational; given the screen
 *      order, the name can't be there.)
 *
 *   2. "You're opening [Instagram & TikTok]" — pulls the apps the
 *      user selected on Screen 2 and lists the first two by name.
 *      If they picked one app it reads "[Instagram]"; three or
 *      more reads "[Instagram, TikTok & others]" so the list
 *      doesn't overflow.
 *
 *   3. "[730 times]" — the headline number, sized larger than
 *      anything else on the screen. Formula:
 *      `365 × number_of_apps_picked`. The user's morning routine
 *      multiplied by the year. Honest math, brutal framing.
 *
 *   4. "before God this year." — the closing twist that
 *      reframes the math as a spiritual cost, not a screen-time
 *      one. This is the line the user remembers.
 *
 *   5. "That's [X minutes] of your morning. Every day. God got
 *      none of it." — the second beat, computed from the
 *      scroll-time bucket the user picked on Screen 3.
 *
 * Tone: forced black, white-on-black headline, generous breathing
 * room. Forward-only navigation — no back. Once they've seen the
 * number, the only direction is forward.
 */

export default function PunchScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();

  const apps = answers.morningApps ?? [];
  const scrollBucket = answers.scrollBucket ?? "thirty60";

  // Two precomputed strings + two numbers. Memoized because the
  // user's answers don't change while they're on the screen.
  const punch = useMemo(
    () => buildPunch(apps, scrollBucket),
    [apps, scrollBucket],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 justify-center">
          {/* Salutation. Generic ("Listen,") rather than personal —
              the user hasn't given us their name yet. */}
          <FadeIn delayMs={300} durationMs={900}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 22,
                marginBottom: 24,
              }}
            >
              Listen,
            </Text>
          </FadeIn>

          {/* Premise. The apps the user themselves picked, named
              back at them so the punch can't be dismissed as
              generic. */}
          <FadeIn delayMs={1100} durationMs={900}>
            <Text
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 18,
                lineHeight: 28,
              }}
            >
              Based on your mornings —{"\n"}
              you&apos;re opening{" "}
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_700Bold",
                }}
              >
                {punch.appNamePhrase}
              </Text>
            </Text>
          </FadeIn>

          {/* The big number. Single line. Massive. The screen exists
              for this glyph. Tabular numerals would be nicer here
              but the font doesn't ship that variant; the small
              jitter on punctuation is acceptable.

              Layout: baseline-aligned flex row instead of a single
              <Text> with a nested span. iOS inherits letterSpacing
              from the parent <Text> into child <Text> elements,
              which collapses the leading space before "times" — the
              big number and the unit end up visually fused. Pulling
              the unit out into its own sibling Text lets the
              negative letterSpacing apply only where we want it
              (the headline glyph) and gives us an explicit
              marginLeft to control the gap. */}
          <FadeIn delayMs={2200} durationMs={1100}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 76,
                  lineHeight: 80,
                  letterSpacing: -3,
                }}
              >
                {punch.timesPerYear.toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  color: "#C2C2C7",
                  marginLeft: 10,
                }}
              >
                times
              </Text>
            </View>
          </FadeIn>

          {/* The reframe — "before God this year." Same column,
              kept on its own beat with a wide-top margin so it
              reads as the consequence of the number above. */}
          <FadeIn delayMs={3400} durationMs={900}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 19,
                lineHeight: 28,
              }}
            >
              before God this year.
            </Text>
          </FadeIn>

          {/* Second beat — the per-day math. Lower-key, sub-headline
              size, dimmer ink so the year number stays the page's
              focal point. */}
          <FadeIn delayMs={4900} durationMs={900}>
            <View style={{ marginTop: 40 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 17,
                  lineHeight: 26,
                }}
              >
                That&apos;s{" "}
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                  }}
                >
                  {punch.dailyMinutesPhrase}
                </Text>{" "}
                of your morning.{"\n"}Every day.
              </Text>
              <Text
                style={{
                  color: "#9B9BA3",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 16,
                  marginTop: 14,
                  letterSpacing: 0.1,
                }}
              >
                God got none of it.
              </Text>
            </View>
          </FadeIn>
        </View>

        {/* CTA — quiet link, not a fat button. The screen wants the
            user to sit with the number for a second, not bounce off
            it.

            `alignSelf: "center"` inside Pressable's function-form
            style doesn't apply reliably on iOS (the link renders
            flush-left), so the centering lives on the wrapper
            View instead — see notifications.tsx for the same
            workaround. */}
        <FadeIn delayMs={6300} durationMs={800}>
          <View className="px-6 pb-4 items-center">
            <Pressable
              hitSlop={14}
              onPress={() => router.push("/onboarding/why")}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 28,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 17,
                  letterSpacing: 0.2,
                }}
              >
                Continue  →
              </Text>
            </Pressable>
          </View>
        </FadeIn>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Punch math
// ─────────────────────────────────────────────────────────────────

/** Display name used for an app id on the punch screen. */
const PUNCH_NAMES: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  facebook: "Facebook",
  news: "the news",
};

/**
 * Midpoint minutes for each scroll-time bucket, used to generate
 * the per-day minutes figure on the second beat of the punch.
 * "unknown" gets assigned a soft 45 minutes — we don't know
 * exactly, but the user already signaled they suspect it's bad,
 * so we lean into the higher half of the range.
 */
const BUCKET_MIDPOINT_MIN: Record<ScrollBucket, number> = {
  under15: 12,
  fifteen30: 22,
  thirty60: 45,
  overHour: 75,
  unknown: 45,
};

type PunchCopy = {
  /** "Instagram", "Instagram & TikTok", "Instagram, TikTok & 2 more", etc. */
  appNamePhrase: string;
  /** 365 × number of apps picked. The headline number on the page. */
  timesPerYear: number;
  /**
   * Phrase for the per-day minutes line — e.g. "22 minutes",
   * "well over an hour", etc. We use a phrase (not a raw number)
   * so the "I don't want to know" bucket can soften the line
   * without losing the punch.
   */
  dailyMinutesPhrase: string;
};

function buildPunch(
  appIds: ReadonlyArray<string>,
  scrollBucket: ScrollBucket,
): PunchCopy {
  // Map ids to names. Drop "other" (we don't have a name for
  // them; the spec is to NOT invent one). If all the apps were
  // "other", we still use the count for math but fall back to a
  // generic "social media" phrase for the display.
  const namedApps = appIds
    .filter((id) => id !== "other")
    .map((id) => PUNCH_NAMES[id] ?? null)
    .filter((n): n is string => n !== null);

  const appCount = Math.max(1, appIds.length);
  const timesPerYear = 365 * appCount;

  // Compose the "Instagram & TikTok" string.
  let appNamePhrase: string;
  if (namedApps.length === 0) {
    appNamePhrase = "those apps";
  } else if (namedApps.length === 1) {
    appNamePhrase = namedApps[0];
  } else if (namedApps.length === 2) {
    appNamePhrase = `${namedApps[0]} & ${namedApps[1]}`;
  } else {
    const overflow = namedApps.length - 2;
    appNamePhrase = `${namedApps[0]}, ${namedApps[1]} & ${overflow} more`;
  }

  const dailyMinutesPhrase =
    scrollBucket === "unknown"
      ? "well over an hour"
      : scrollBucket === "overHour"
        ? "over an hour"
        : `${BUCKET_MIDPOINT_MIN[scrollBucket]} minutes`;

  return { appNamePhrase, timesPerYear, dailyMinutesPhrase };
}
