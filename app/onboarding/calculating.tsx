import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useColors } from "@/state/theme";

const BAR_FILL_MS = 2800;
const ADVANCE_MS = 3000;

const STATUS_LINES = [
  { label: "Analyzing your scroll habits", appearAt: 250 },
  { label: "Running the numbers", appearAt: 1100 },
  { label: "Building your morning picture", appearAt: 1950 },
];

export default function CalculatingScreen() {
  const router = useRouter();
  const colors = useColors();
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: 1,
      duration: BAR_FILL_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const advance = setTimeout(() => {
      router.replace("/onboarding/punch");
    }, ADVANCE_MS);

    return () => clearTimeout(advance);
  }, [fill, router]);

  const widthInterpolation = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-8 items-center justify-center">
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 20,
              letterSpacing: -0.2,
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            Calculating your morning…
          </Text>

          <View
            style={{
              width: "100%",
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                width: widthInterpolation,
                backgroundColor: CLOSER_ACCENT,
                borderRadius: 999,
              }}
            />
          </View>

          <View style={{ marginTop: 32, alignItems: "center" }}>
            {STATUS_LINES.map((line) => (
              <StatusLine key={line.label} label={line.label} appearAt={line.appearAt} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatusLine({ label, appearAt }: { label: string; appearAt: number }) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay: appearAt,
      useNativeDriver: true,
    }).start();
  }, [opacity, appearAt]);

  return (
    <Animated.View style={{ opacity, marginTop: 10 }}>
      <Text
        style={{
          color: colors.inkSecondary,
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 14,
          textAlign: "center",
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
