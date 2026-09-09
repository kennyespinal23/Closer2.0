import type { ColorValue } from "react-native";
import { View } from "react-native";
import { Image } from "expo-image";
import { SFSymbol, type SFSymbolName, type SFSymbolProps } from "@/components/Symbol";
import {
  flaticonEntryForSymbol,
  flaticonSource,
  type FlaticonIconKey,
  FLATICON_ICONS,
} from "@/lib/flaticonIcons";

type AppIconProps = {
  /** Preferred: SF Symbol name — uses Flaticon when that symbol is mapped + ready. */
  name?: SFSymbolName | string;
  /** Or address a registry key directly once assets are ready. */
  flaticon?: FlaticonIconKey;
  size?: number;
  color?: ColorValue;
  weight?: SFSymbolProps["weight"];
};

/**
 * App chrome icon — Flaticon hand-drawn asset when registered and
 * ready, otherwise the existing SF Symbol. Drop files into
 * `assets/icons/flaticon/` and flip `ready` in `lib/flaticonIcons.ts`.
 */
export function AppIcon({
  name,
  flaticon,
  size = 22,
  color,
  weight = "regular",
}: AppIconProps) {
  const entry = flaticon
    ? FLATICON_ICONS.find((item) => item.key === flaticon)
    : name
      ? flaticonEntryForSymbol(name)
      : undefined;
  const source = entry ? flaticonSource(entry) : undefined;

  if (source) {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Image
          source={source}
          style={{ width: size, height: size }}
          contentFit="contain"
          // Monochrome Flaticon outlines tint to theme ink / accent.
          tintColor={typeof color === "string" ? color : undefined}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  if (name) {
    return (
      <SFSymbol
        name={name as SFSymbolName}
        size={size}
        color={color}
        weight={weight}
      />
    );
  }

  return <View style={{ width: size, height: size }} />;
}
