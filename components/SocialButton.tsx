import { Platform, Pressable, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Svg, { Path } from "react-native-svg";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { useColors, useResolvedScheme } from "@/state/theme";

type Provider = "apple" | "google" | "email";

type SocialButtonProps = {
  provider: Provider;
  onPress?: () => void;
};

const labelByProvider: Record<Provider, string> = {
  apple: "Continue with Apple",
  google: "Continue with Google",
  email: "Continue with Email",
};

function ProviderGlyph({ provider }: { provider: Provider }) {
  const colors = useColors();
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
  // email — simple envelope outline in ink
  return (
    <Svg width={20} height={16} viewBox="0 0 24 20" fill="none">
      <Path
        d="M3 4h18v12H3z"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M3 5l9 7 9-7"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Auth provider button. Apple uses the system
 * `ASAuthorizationAppleIDButton` (App Store requirement). Google /
 * email stay as Closer-styled rows — no equivalent native standard.
 */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();

  if (provider === "apple" && Platform.OS === "ios") {
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
        cornerRadius={spacing[16]}
        style={{
          width: "100%",
          height: Math.max(56, minTouchTarget),
        }}
        onPress={onPress ?? (() => {})}
      />
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={labelByProvider[provider]}
      style={{
        minHeight: Math.max(56, minTouchTarget),
        width: "100%",
        borderRadius: spacing[16],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing[16],
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ marginRight: spacing[12] }}>
        <ProviderGlyph provider={provider} />
      </View>
      <Text
        style={{
          color: colors.ink,
          fontSize: 16,
          fontFamily: "System",
          fontWeight: "600",
        }}
      >
        {labelByProvider[provider]}
      </Text>
    </Pressable>
  );
}
