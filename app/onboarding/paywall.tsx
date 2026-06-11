import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding } from "@/state/onboarding";

/**
 * Screen 15 — The Paywall.
 *
 * Forced black canvas, intentionally stark. By this point the
 * user has been through 14 screens; they're fully primed. The
 * paywall doesn't try to convince — it presents the offer plainly.
 *
 * Three value lines, a coffee/scroll comparison, and a single
 * CTA. No premium glow, no journey-dots filigree — the
 * narrative drama is doing the heavy lifting; the screen just
 * needs to deliver the price.
 *
 * Mock implementation: tapping "Start my free 7 days" just
 * advances to the welcome screen. Wiring StoreKit / RevenueCat
 * is a follow-up; the surface is shaped so the wire-up is a
 * one-line change inside `handleStart`.
 */

const VALUE_LINES = [
  "One verse every morning. Before the noise.",
  "Today\u2019s Word — a 2 minute thought to carry into your day.",
  "Check in whenever you drift. We\u2019ll be here.",
];

export default function PaywallScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();

  const firstName = (answers.name || "").trim().split(" ")[0];

  const handleStart = () => {
    // TODO: Wire RevenueCat / StoreKit purchase flow here. For
    // now we just advance to the welcome screen — the mock paywall
    // unblocks the full onboarding test without the storekit
    // sandbox dance.
    router.push("/onboarding/welcome");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#141416" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <FadeIn delayMs={0}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 28,
                  lineHeight: 36,
                  letterSpacing: -0.5,
                  marginTop: 28,
                }}
              >
                {firstName ? `${firstName}, you're almost in.` : "You're almost in."}
              </Text>
            </FadeIn>

            {/* Price line. The number ($7.99) is bigger than the
                surrounding sentence so the offer is the focal
                point of the upper half of the screen. */}
            <FadeIn delayMs={500}>
              <View style={{ marginTop: 28 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 19,
                    lineHeight: 28,
                  }}
                >
                  Start free for 7 days.
                </Text>
                <Text
                  style={{
                    color: "#C2C2C7",
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 17,
                    lineHeight: 24,
                    marginTop: 6,
                  }}
                >
                  Then{" "}
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 17,
                    }}
                  >
                    $7.99 a month.
                  </Text>{" "}
                  Cancel anytime.
                </Text>
              </View>
            </FadeIn>

            {/* Three value lines. Sparkle glyph + ink-white line.
                Vertical rhythm of the trio is the whole reason the
                screen exists between "almost in" and the CTA. */}
            <FadeIn delayMs={1100}>
              <View style={{ marginTop: 36, gap: 14 }}>
                {VALUE_LINES.map((line) => (
                  <ValueLine key={line} text={line} />
                ))}
              </View>
            </FadeIn>

            {/* Divider + comparison couplet. The "less than a
                coffee / more than the scroll" beat is the
                emotional close. */}
            <FadeIn delayMs={1700}>
              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  marginTop: 36,
                  marginHorizontal: 8,
                }}
              />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 15,
                  lineHeight: 23,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                Less than a coffee a month.{"\n"}
                <Text
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  More than you&apos;ll get from the scroll.
                </Text>
              </Text>
            </FadeIn>

            <View className="flex-1 min-h-[24px]" />

            {/* CTA. Solid white pill on black — the visual mirror
                of the "I know the feeling" link on Screen 1.
                Where that screen used a quiet text link, this
                one earns a full button: the user is committing,
                not just continuing. */}
            <FadeIn delayMs={2200}>
              <View className="pt-6 pb-2">
                {/* IMPORTANT: chrome MUST be NativeWind classes,
                    not Pressable function-form `style`. RN 0.81's
                    iOS Pressable silently drops function-style
                    chrome props (height / border / bg), which
                    rendered this CTA as a floating black-on-black
                    label with no visible pill — same bug we hit on
                    the apps picker. See the same protection on
                    AppRow in app/onboarding/apps.tsx. */}
                <Pressable
                  onPress={handleStart}
                  accessibilityRole="button"
                  accessibilityLabel="Start my free 7 days"
                  className="h-14 rounded-2xl items-center justify-center active:opacity-85"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <Text
                    style={{
                      color: "#000000",
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 16,
                      letterSpacing: 0.1,
                    }}
                  >
                    Start my free 7 days
                  </Text>
                </Pressable>

                {/* Footer links: restore / terms / privacy. Quiet
                    grey on black — the legal boilerplate row. */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 18,
                    gap: 10,
                  }}
                >
                  <FootLink label="Restore purchase" />
                  <FootDot />
                  <FootLink label="Terms" />
                  <FootDot />
                  <FootLink label="Privacy" />
                </View>
              </View>
            </FadeIn>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ValueLine({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {/* Sparkle glyph rendered as a Unicode dingbat for now —
          ✦ has the right weight at 16px without needing an SVG
          file. Spec calls for the four-pointed star explicitly. */}
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 16,
          marginRight: 12,
          width: 18,
          textAlign: "center",
        }}
      >
        ✦
      </Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 15.5,
          lineHeight: 23,
          flex: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function FootLink({ label }: { label: string }) {
  return (
    <Pressable hitSlop={8}>
      <Text
        style={{
          color: "#9B9BA3",
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FootDot() {
  return (
    <View
      style={{
        width: 2.5,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: "#5C5C62",
      }}
    />
  );
}
