import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useColors } from "@/state/theme";

/**
 * Unified top-chrome for the onboarding flow.
 *
 *   • `"back-only"` — back chevron only
 *   • `"with-progress"` — back chevron + subtle progress track
 *     filled with `CLOSER_ACCENT`
 *
 * Optional `title` centers a quiet screen label (e.g. "Faith Check In")
 * under the chevron row.
 */
type OnboardingChromeProps = {
  mode: "back-only" | "with-progress";
  /** 0..1 progress — only honored when mode is "with-progress". */
  progress?: number;
  /** Optional centered screen label. */
  title?: string;
  tone?: "auto" | "dark" | "light";
  onBack?: () => void;
};

export function OnboardingChrome({
  mode,
  progress = 0,
  title,
  tone = "auto",
  onBack,
}: OnboardingChromeProps) {
  const router = useRouter();
  const colors = useColors();

  const chevronColor =
    tone === "dark"
      ? "#FFFFFF"
      : tone === "light"
        ? "#0F0F0F"
        : colors.ink;
  const trackColor =
    tone === "dark"
      ? "rgba(255,255,255,0.15)"
      : tone === "light"
        ? "rgba(15,15,15,0.12)"
        : colors.border;

  const clamped = Math.max(0, Math.min(1, progress));
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          hitSlop={14}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
            zIndex: 1,
          })}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={chevronColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        {title ? (
          <Text
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 15,
              lineHeight: 20,
              letterSpacing: -0.24,
              color: colors.inkMuted,
            }}
          >
            {title}
          </Text>
        ) : null}

        <View style={{ width: 40, height: 40 }} />
      </View>

      {mode === "with-progress" ? (
        <View
          style={{
            marginTop: 10,
            height: 3,
            backgroundColor: trackColor,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${clamped * 100}%`,
              backgroundColor: CLOSER_ACCENT,
              borderRadius: 999,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
