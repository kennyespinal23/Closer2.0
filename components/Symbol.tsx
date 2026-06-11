import type { ColorValue } from "react-native";
import { Platform } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

/**
 * Symbol
 *
 * Thin wrapper around `expo-symbols`' `SymbolView` that pre-sets
 * the props Closer reaches for 95% of the time, and gives us a
 * single place to fall back to a non-SF-Symbol glyph on Android
 * later if we ever ship that platform.
 *
 * Why a wrapper instead of using `SymbolView` directly:
 *
 *   1. **Defaults that match the rest of the app**: most of our
 *      icons read at 22pt (tab bar size) or 16pt (inline w/ body
 *      text). Defaulting `size: 22` saves a prop in 90% of usages.
 *
 *   2. **`color` instead of `tintColor`**: the rest of our
 *      codebase passes `color` for icon colors (SVG <Path
 *      stroke={color} />, tab bar `tabBarActiveTintColor`,
 *      MaterialIcons-style `color` prop). Renaming
 *      `tintColor → color` keeps the icon prop name consistent
 *      across the app so refactors are mechanical.
 *
 *   3. **Single place to add Android fallback**: if Closer ever
 *      ships Android, we replace the body of this component with
 *      a Platform-switch (SF Symbol on iOS, MaterialCommunity or
 *      a bundled PNG on Android) without touching consumers.
 *
 *   4. **Typed `name`**: re-exports `SFSymbol` so TS gives you
 *      autocomplete for every SF Symbol Apple ships (5500+).
 *
 * Usage:
 *
 *   <Symbol name="house.fill" />
 *   <Symbol name="xmark" size={14} color={colors.ink} weight="semibold" />
 *   <Symbol name="play.fill" size={18} color="#FFFFFF" />
 *
 * For animated symbols (the SF Symbols 5+ bounce/pulse/scale
 * effects on iOS 17+), pass `animationSpec` through directly —
 * we don't currently default it anywhere because Closer's icons
 * are mostly static chrome.
 */
export type SymbolProps = Omit<SymbolViewProps, "tintColor"> & {
  /** The tint color applied to the symbol. Aliased from
   *  `SymbolView`'s `tintColor` for consistency with the rest of
   *  Closer's icon components. */
  color?: ColorValue;
};

export function Symbol({
  name,
  size = 22,
  weight = "regular",
  color,
  fallback,
  ...rest
}: SymbolProps) {
  // Android doesn't have SF Symbols. expo-symbols handles this by
  // rendering the `fallback` prop. If no fallback is provided we
  // return null on non-iOS — the caller is expected to gate via
  // Platform.OS if they need a non-iOS glyph. (For Closer, iOS is
  // the only target right now so this never trips.)
  if (Platform.OS !== "ios" && !fallback) return null;

  return (
    <SymbolView
      name={name}
      size={size}
      weight={weight}
      tintColor={color}
      fallback={fallback}
      {...rest}
    />
  );
}

export type { SFSymbol };
