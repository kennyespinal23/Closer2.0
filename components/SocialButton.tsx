import { Platform, Pressable, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Svg, { Path } from "react-native-svg";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { CLOSER_ACCENT } from "@/constants/theme";
import { typography } from "@/lib/typography";
import { useColors, useResolvedScheme } from "@/state/theme";

type Provider = "apple" | "google" | "email";

type SocialButtonProps = {
  provider: Provider;
  onPress?: () => void;
  /**
   * `"accent"` — filled Closer accent pill (used for the primary
   * Apple CTA on the signup screen). `"soft"` — light fill + border
   * (Google / secondary). `"system"` — native Apple button on iOS.
   */
  variant?: "system" | "soft" | "accent";
};

const labelByProvider: Record<Provider, string> = {
  apple: "Continue with Apple",
  google: "Continue with Google",
  email: "Continue with Email",
};

function AppleGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.365 0c-.9.05-2 .62-2.64 1.35-.58.66-1.09 1.72-.9 2.73 1 .07 2.03-.52 2.66-1.25.59-.68 1.05-1.73.88-2.83zM19.94 17.2c-.5 1.14-.74 1.65-1.39 2.66-.9 1.4-2.17 3.14-3.75 3.15-1.4.01-1.76-.91-3.66-.9-1.9.01-2.3.92-3.7.91-1.58-.02-2.79-1.59-3.69-2.99C1.8 17.1.6 12.7 2.5 9.68c.95-1.52 2.45-2.48 4.15-2.5 1.3-.02 2.53.88 3.66.88 1.12 0 2.87-1.09 4.84-.93.82.03 3.13.33 4.61 2.5-.12.07-2.75 1.61-2.72 4.8.03 3.8 3.34 5.07 3.4 5.1-.03.09-.52 1.8-1.5 3.67z"
        fill={color}
      />
    </Svg>
  );
}

function ProviderGlyph({
  provider,
  ink,
}: {
  provider: Provider;
  ink: string;
}) {
  if (provider === "apple") {
    return <AppleGlyph color={ink} />;
  }
  if (provider === "google") {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.61z"
          fill="#4285F4"
        />
        <Path
          d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.92v2.34A9 9 0 009 18z"
          fill="#34A853"
        />
        <Path
          d="M3.95 10.69A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.69V4.97H.92A9 9 0 000 9c0 1.45.35 2.83.92 4.03l3.03-2.34z"
          fill="#FBBC05"
        />
        <Path
          d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.92 4.97l3.03 2.34C4.66 5.18 6.65 3.58 9 3.58z"
          fill="#EA4335"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={16} viewBox="0 0 24 20" fill="none">
      <Path
        d="M3 4h18v12H3z"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M3 5l9 7 9-7"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Auth provider button. Apple defaults to the system
 * `ASAuthorizationAppleIDButton` (App Store requirement) unless
 * `variant` is `"soft"` or `"accent"` for branded onboarding CTAs.
 */
export function SocialButton({
  provider,
  onPress,
  variant = "system",
}: SocialButtonProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const useNativeApple =
    provider === "apple" &&
    Platform.OS === "ios" &&
    variant === "system";

  if (useNativeApple) {
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
        }
        buttonStyle={
          scheme === "dark"
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={999}
        style={{
          width: "100%",
          height: Math.max(56, minTouchTarget),
        }}
        onPress={onPress ?? (() => {})}
      />
    );
  }

  const isAccent = variant === "accent";
  const labelColor = isAccent ? "#FFFFFF" : colors.ink;
  const height = Math.max(56, minTouchTarget);

  // Visual chrome + hit target live on an inner View — NativeWind
  // drops backgroundColor / layout when Pressable uses function-form style.
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={labelByProvider[provider]}
      accessibilityState={{ disabled: !onPress }}
      style={({ pressed }) => ({
        opacity: !onPress ? 0.55 : pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          minHeight: height,
          width: "100%",
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing[16],
          backgroundColor: isAccent ? CLOSER_ACCENT : colors.surface,
          borderWidth: isAccent ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ marginRight: spacing[12] }}>
          <ProviderGlyph provider={provider} ink={labelColor} />
        </View>
        <Text style={[typography.button, { color: labelColor }]}>
          {labelByProvider[provider]}
        </Text>
      </View>
    </Pressable>
  );
}
