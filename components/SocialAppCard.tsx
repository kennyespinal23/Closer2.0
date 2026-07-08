import { View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import {
  SOCIAL_APP_ICON_SOURCES,
  type SocialAppKind,
} from "@/lib/socialAppIconAssets";

export type { SocialAppKind };

type Props = {
  app: SocialAppKind;
  /** Icon width (square). Height matches width. */
  width?: number;
};

/** iOS squircle corner radius ≈ 22.5% of side length. */
function squircleRadius(size: number): number {
  return Math.round(size * 0.225);
}

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 10,
} as const;

/** Subtle grey rim so the black X icon doesn't disappear on #000. */
const X_SUBTLE_OUTLINE = "rgba(255, 255, 255, 0.32)";

export function SocialAppCard({ app, width = 118 }: Props) {
  const radius = squircleRadius(width);
  const xOutline = app === "x";

  return (
    <View
      style={{
        width,
        height: width,
        borderRadius: radius,
        borderWidth: xOutline ? 1 : 0,
        borderColor: xOutline ? X_SUBTLE_OUTLINE : "transparent",
        ...CARD_SHADOW,
      }}
    >
      <Image
        source={SOCIAL_APP_ICON_SOURCES[app]}
        style={{
          width,
          height: width,
          borderRadius: radius,
        }}
        contentFit="cover"
        accessibilityLabel={app}
      />
    </View>
  );
}

/**
 * AppIcon — single app icon at an arbitrary size.
 *
 * Used on onboarding surfaces (e.g. Pattern) that need one icon
 * without the falling-card shadow chrome.
 */
export function AppIcon({
  kind,
  size,
  style,
}: {
  kind: SocialAppKind;
  size: number;
  style?: ViewStyle;
}) {
  const radius = squircleRadius(size);

  return (
    <View style={style}>
      <Image
        source={SOCIAL_APP_ICON_SOURCES[kind]}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
        contentFit="cover"
        accessibilityLabel={kind}
      />
    </View>
  );
}
