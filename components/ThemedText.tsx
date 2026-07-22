import { Text, type TextProps, type TextStyle } from "react-native";
import {
  systemText,
  typography,
  type SystemTextRole,
  type TypographyRole,
} from "@/lib/typography";
import { useColors } from "@/state/theme";

type ColorRole = "ink" | "muted" | "secondary" | "subtle" | "primaryFg";

type Variant = TypographyRole | SystemTextRole;

function resolveVariant(variant: Variant): TextStyle {
  if (variant in typography) {
    return typography[variant as TypographyRole];
  }
  return systemText[variant as SystemTextRole];
}

export type ThemedTextProps = TextProps & {
  /**
   * Apple system text role (`largeTitle` … `caption2`) or Closer
   * brand role (`body`, `smallLabel`, `reflectiveQuote`, …).
   * Prefer `largeTitle` for chrome page anchors — not `pageTitle`.
   */
  variant?: Variant;
  /** Semantic ink from the theme palette — never a raw hex. */
  color?: ColorRole;
};

/**
 * Themed text — one call site for size/weight/tracking + semantic color.
 *
 *   <ThemedText variant="captionEmphasized" color="muted">
 *     Continue Reading
 *   </ThemedText>
 *   <ThemedText variant="body">…</ThemedText>
 */
export function ThemedText({
  variant = "body",
  color = "ink",
  style,
  ...rest
}: ThemedTextProps) {
  const colors = useColors();
  const ink =
    color === "muted"
      ? colors.inkMuted
      : color === "secondary"
        ? colors.textSecondary
        : color === "subtle"
          ? colors.inkSubtle
          : color === "primaryFg"
            ? colors.primaryFg
            : colors.ink;

  return (
    <Text {...rest} style={[resolveVariant(variant), { color: ink }, style]} />
  );
}
