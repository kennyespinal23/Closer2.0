import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/theme";

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
  if (provider === "apple") {
    return (
      <Svg width={18} height={20} viewBox="0 0 18 20" fill="none">
        <Path
          d="M14.94 10.62c-.03-2.7 2.21-4 2.31-4.06-1.26-1.84-3.22-2.1-3.92-2.13-1.67-.17-3.26.98-4.11.98-.86 0-2.16-.96-3.55-.93-1.83.03-3.51 1.06-4.45 2.7C-.65 10.5.77 15.2 2.62 17.78c.9 1.26 1.97 2.67 3.36 2.62 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.52.84 1.45-.02 2.37-1.28 3.26-2.55 1.03-1.46 1.45-2.88 1.47-2.95-.03-.01-2.82-1.08-2.78-4.25zM12.36 2.86c.75-.9 1.25-2.16 1.12-3.4-1.08.04-2.39.72-3.16 1.62-.69.8-1.3 2.07-1.14 3.3 1.2.1 2.43-.61 3.18-1.52z"
          fill={colors.ink}
        />
      </Svg>
    );
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

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-14 w-full rounded-2xl flex-row items-center justify-center px-5 bg-surface border border-border active:bg-bg"
    >
      <View className="mr-3">
        <ProviderGlyph provider={provider} />
      </View>
      <Text
        className="text-ink text-[16px]"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {labelByProvider[provider]}
      </Text>
    </Pressable>
  );
}
