import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";

const VERSE = {
  text: "Draw near to God, and he will draw near to you.",
  reference: "James 4:8",
};

export default function GetStartedScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    // The new onboarding opens with the gut-punch stat screen
    // (Screen 1 in the spec). Branding intentionally doesn't
    // appear again until the reframe screen ~halfway through.
    router.push("/onboarding/stat");
  };

  const handleSignIn = () => {
    // TEMPORARY: until real auth is wired, "Sign in" is a dev shortcut
    // that bypasses the onboarding flow and drops straight into the app.
    // `replace` so the welcome screen isn't left in the back stack.
    router.replace("/today");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-1 px-6">
        {/* Hero — typographic */}
        <View className="flex-1 items-center justify-center">
          <Text
            className="text-ink text-[72px] leading-[76px] tracking-[-2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Closer
          </Text>

          {/* Orange accent rule */}
          <View className="w-12 h-[2px] bg-primary mt-5 rounded-full" />

          <Text
            className="text-ink-muted mt-5 text-[16px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            Church in your pocket.
          </Text>

          {/* Poetic value prop */}
          <Text
            className="text-ink mt-12 text-[18px] text-center px-2 leading-[28px] opacity-80"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Daily sermons. Scripture that meets you{"\n"}
            where you are. A quiet place to draw near.
          </Text>
        </View>

        {/* Actions */}
        <View className="pb-2">
          <Button label="Get Started" onPress={handleGetStarted} />

          <Pressable
            hitSlop={12}
            onPress={handleSignIn}
            className="mt-5 self-center flex-row items-center"
          >
            <Text
              className="text-ink-muted text-[14px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Already have an account?{" "}
            </Text>
            <Text
              className="text-primary text-[14px]"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              Sign in
            </Text>
          </Pressable>
        </View>

        {/* Verse of the day */}
        <View className="items-center pt-8 pb-2">
          <View className="w-8 h-[1.5px] bg-primary mb-4 rounded-full opacity-70" />
          <Text
            className="text-ink text-[14px] text-center px-6 leading-[20px] opacity-80"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            &ldquo;{VERSE.text}&rdquo;
          </Text>
          <Text
            className="text-ink-muted text-[11px] mt-2 tracking-[2px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {VERSE.reference}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
