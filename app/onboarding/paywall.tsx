import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

const VALUE_LINES = [
  "One verse every morning. Before the noise.",
  "Today\u2019s Word — a 2 minute thought to carry into your day.",
  "Check in whenever you drift. We\u2019ll be here.",
];

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers } = useOnboarding();

  const firstName = (answers.name || "").trim().split(" ")[0];

  const handleStart = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <FadeIn delayMs={0}>
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 28,
                  lineHeight: 36,
                  letterSpacing: -0.5,
                  marginTop: 28,
                }}
              >
                {firstName ? `${firstName}, you're almost in.` : "You're almost in."}
              </Text>
            </FadeIn>

            <FadeIn delayMs={500}>
              <View style={{ marginTop: 28 }}>
                <Text
                  style={{
                    color: colors.ink,
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 19,
                    lineHeight: 28,
                  }}
                >
                  Start free for 7 days.
                </Text>
                <Text
                  style={{
                    color: colors.inkSecondary,
                    fontFamily: "System",
                    fontWeight: "500",
                    fontSize: 17,
                    lineHeight: 24,
                    marginTop: 6,
                  }}
                >
                  Then{" "}
                  <Text
                    style={{
                      color: colors.ink,
                      fontFamily: "System",
                      fontWeight: "700",
                      fontSize: 17,
                    }}
                  >
                    $7.99 a month.
                  </Text>{" "}
                  Cancel anytime.
                </Text>
              </View>
            </FadeIn>

            <FadeIn delayMs={1100}>
              <View style={{ marginTop: 36, gap: 14 }}>
                {VALUE_LINES.map((line) => (
                  <ValueLine key={line} text={line} />
                ))}
              </View>
            </FadeIn>

            <FadeIn delayMs={1700}>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginTop: 36,
                  marginHorizontal: 8,
                }}
              />
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: "System",
                  fontWeight: "500",
                  fontSize: 15,
                  lineHeight: 23,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                Less than a coffee a month.{"\n"}
                <Text style={{ fontFamily: "System", fontWeight: "700" }}>
                  More than you&apos;ll get from the scroll.
                </Text>
              </Text>
            </FadeIn>

            <View className="flex-1 min-h-[24px]" />

            <FadeIn delayMs={2200}>
              <View className="pt-6 pb-2">
                <Pressable
                  onPress={handleStart}
                  accessibilityRole="button"
                  accessibilityLabel="Start my free 7 days"
                  className="h-14 rounded-2xl items-center justify-center active:opacity-85"
                  style={{ backgroundColor: CLOSER_ACCENT }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "System",
                      fontWeight: "700",
                      fontSize: 16,
                      letterSpacing: 0.1,
                    }}
                  >
                    Start my free 7 days
                  </Text>
                </Pressable>

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
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Text
        style={{
          color: CLOSER_ACCENT,
          fontFamily: "System",
          fontWeight: "700",
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
          color: colors.ink,
          fontFamily: "System",
          fontWeight: "500",
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
  const colors = useColors();
  return (
    <Pressable hitSlop={8}>
      <Text
        style={{
          color: colors.inkSubtle,
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FootDot() {
  const colors = useColors();
  return (
    <View
      style={{
        width: 2.5,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: colors.borderStrong,
      }}
    />
  );
}
