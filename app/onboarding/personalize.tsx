import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useColors } from "@/state/theme";

/**
 * Bridge after How Closer works — sets up the personalization
 * questions that follow (audit / prefs).
 */
export default function PersonalizeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("personalize")}
      />

      <View style={styles.body}>
        <FadeIn delayMs={80}>
          <Text style={[styles.title, { color: colors.ink }]}>
            {"Let's make Closer feel\nlike it's actually yours."}
          </Text>
        </FadeIn>
        <FadeIn delayMs={220}>
          <Text style={[styles.sub, { color: colors.inkSecondary }]}>
            A few quick questions so we can personalize things for you.
          </Text>
        </FadeIn>
      </View>

      <View style={styles.footer}>
        <FadeIn delayMs={360}>
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/denomination")}
          />
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    justifyContent: "flex-start",
  },
  title: {
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  sub: {
    marginTop: 16,
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
});
