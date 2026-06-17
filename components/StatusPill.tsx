/**
 * StatusPill — Gentler Streak-style ambient status badge.
 *
 * A small, fully rounded pill that tells the user "here's a system
 * the app is tracking for you" at a glance. Modelled on Gentler
 * Streak's "Status: Active ●" floating chip — a compact label +
 * value pair anchored by a tinted status dot.
 *
 * Three live on the Today header today (Streak · Goal · Blocks),
 * but the primitive is intentionally generic so future surfaces
 * (Practice tab, Insights tab, the post-sermon recap) can reuse
 * the same shape without forking visual style.
 *
 * Visual recipe:
 *   • Surface fill that sits one elevation step above the page
 *     (colors.surface). Reads as a card chip, not chrome.
 *   • Hairline border in colors.border so the chip has shape on
 *     both the lighter light-mode and the deep dark-mode pages.
 *   • Rounded fully (borderRadius: 999) — Apple/Gentler Streak
 *     never use squared corners on status chips.
 *   • Label in inkMuted (small, lowercase weight) followed by the
 *     value in ink (semibold). The label/value contrast is what
 *     makes the chip glanceable — "Blocks: Active" reads as "the
 *     blocks system is currently active" without parsing.
 *   • Trailing 7pt dot tinted by `tone`. The dot is the actual
 *     status — text just labels which system.
 *
 * Tones:
 *   • "live"    — green dot. Something is actively running RIGHT
 *                 NOW (focus session firing, goal reached today).
 *   • "armed"   — amber dot. Something is scheduled / in
 *                 progress (streak in flight, goal partially met,
 *                 blocks enabled but not currently firing).
 *   • "muted"   — neutral border-tone dot. Tracked but inert.
 *   • "neutral" — no dot, just label/value (rare; for purely
 *                 informational chips like a date pill).
 *
 * Accessibility:
 *   • Renders as a single accessibilityRole="button" when onPress
 *     is provided so VoiceOver announces "Blocks Active, button".
 *   • Falls back to role="text" for static informational chips.
 *   • `accessibilityLabel` overrides the auto-composed
 *     "{label} {value}" string when callers need richer phrasing.
 *
 * Motion:
 *   • The dot can pulse gently when `pulse` is true and the tone
 *     is "live" — useful for the App Blocks pill while a focus
 *     session is firing, to communicate "this is happening right
 *     now" without animating the entire chip.
 *   • Pulse honors the OS Reduce Motion preference via
 *     useReducedMotion; when reduced, the dot stays parked at
 *     its bright steady state instead of oscillating.
 */
import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import * as haptics from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

export type StatusPillTone = "live" | "armed" | "muted" | "neutral";

export interface StatusPillProps {
  /** Short label naming the system (e.g. "Streak", "Goal",
   *  "Blocks"). Rendered in inkMuted, separated from the value
   *  by a colon + space. */
  label: string;
  /** The current value of the system (e.g. "11 days", "12 / 30
   *  min", "Active"). Rendered in ink with semibold weight so
   *  it's the part the eye lands on first. */
  value: string;
  /** Drives the trailing dot color. Defaults to "muted" so a chip
   *  always reads as a tracked-but-inert system if the parent
   *  forgets to set it. */
  tone?: StatusPillTone;
  /** When true and tone is "live", the dot oscillates gently to
   *  signal "this is happening RIGHT NOW". Pairs with haptics
   *  on the calling surface (firing focus session, etc.). */
  pulse?: boolean;
  /** Optional deep-link tap target. When set the chip becomes a
   *  Pressable with soft haptic + role=button. When absent the
   *  chip renders as a static View (informational). */
  onPress?: () => void;
  /** Optional VoiceOver phrasing override. Defaults to "{label}
   *  {value}" which reads cleanly for most chips. */
  accessibilityLabel?: string;
  /** Optional left-edge inset so the chip sits flush with a
   *  parent's edge inset when used in a no-padding container.
   *  Most callers leave this 0 and pad the parent row. */
  marginLeft?: number;
  /** Visual variant. Defaults to "default" — the page-surface
   *  chip used in the regular home header. "overlay" switches
   *  to dark-glass styling (semi-opaque black backdrop, white
   *  text, light hairline) so the chip stays readable when
   *  floated over an arbitrary background image (e.g. the
   *  Gentler-Streak hero illustration). Use this whenever the
   *  pill sits ABOVE photographic content rather than on the
   *  flat page surface. */
  variant?: "default" | "overlay";
}

// ─────────────────────────────────────────────────────────────────
// Color resolution
// ─────────────────────────────────────────────────────────────────
//
// Dot colors deliberately don't come from the theme palette —
// they're SEMANTIC (green = live, amber = armed) and must read the
// same in both light and dark. Tints picked to match iOS's
// system green and a warm amber that doesn't clash with Closer's
// fire palette on streak surfaces.

const TONE_DOT_COLORS: Record<StatusPillTone, string | null> = {
  live: "#22C55E", // iOS-system-greenish — universal "on / active"
  armed: "#F59E0B", // warm amber — "ready to fire, not firing yet"
  muted: "#9CA3AF", // calm slate-grey — "tracked but inert"
  neutral: null, // no dot — purely informational chip
};

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

function StatusPillImpl({
  label,
  value,
  tone = "muted",
  pulse = false,
  onPress,
  accessibilityLabel,
  marginLeft = 0,
  variant = "default",
}: StatusPillProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const isOverlay = variant === "overlay";

  // Dot pulse — opacity oscillation between 0.55 and 1.0 over
  // ~1.4s. Subtle enough to read as "alive" without becoming a
  // distracting flicker. Reduce-motion parks at 1.0 (the brightest
  // steady state) so the chip stays bright instead of dim-locked.
  const shouldPulse = pulse && tone === "live" && !reducedMotion;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!shouldPulse) {
      dotOpacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shouldPulse, dotOpacity]);

  const dotColor = TONE_DOT_COLORS[tone];
  const a11yLabel = accessibilityLabel ?? `${label} ${value}`;

  // Text colors pivot on variant: default uses the theme palette so
  // the chip reads against the page surface; overlay forces a
  // muted-white + white duo that reads against the dark-glass
  // backdrop regardless of theme or image content below.
  const labelColor = isOverlay ? "rgba(255, 255, 255, 0.72)" : colors.inkMuted;
  const valueColor = isOverlay ? "#FFFFFF" : colors.ink;

  const body = (
    <>
      <Text
        style={[styles.text, styles.label, { color: labelColor }]}
        numberOfLines={1}
      >
        {label}
        {": "}
      </Text>
      <Text
        style={[styles.text, styles.value, { color: valueColor }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {dotColor !== null ? (
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: dotColor, opacity: dotOpacity },
          ]}
        />
      ) : null}
    </>
  );

  // Chip frame — composed from a base style + the variant-specific
  // surface treatment. We assemble in an array so RN flattens
  // styles in order (variant overrides base where needed). The
  // dynamic `colors.surface` lookup is kept inline so the chip
  // re-themes when the user flips light/dark.
  //
  // Visual recipe (default variant):
  //   • Fully-rounded surface (radius 999)
  //   • Generous horizontal padding (16) + vertical padding (10)
  //     so the chip has real weight on the page
  //   • NO hairline border — instead a soft iOS-style drop shadow
  //     gives the chip lift the way the reference Gentler-Streak
  //     image does
  //   • alignSelf: "flex-start" so the chip sizes to its content
  //     instead of stretching to fill the parent (critical when
  //     the chip is the only child in a column-laid-out parent)
  //
  // Overlay variant swaps to dark-glass styling (semi-opaque
  // black + faint white hairline, no shadow) for cases where
  // the chip floats over a photo backdrop.
  const chipStyle = [
    styles.chipBase,
    isOverlay ? styles.chipOverlay : styles.chipDefault,
    isOverlay ? null : { backgroundColor: colors.surface },
    { marginLeft },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          // Soft haptic on the chip tap — same vocabulary as other
          // ambient secondary affordances (avatar, dev pills). The
          // chip is informational, not a CTA, so we use soft rather
          // than tap.
          haptics.soft();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => [...chipStyle, { opacity: pressed ? 0.65 : 1 }]}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View
      style={chipStyle}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  // Base chip frame — owns the row layout + size + radius.
  // Without `alignSelf: "flex-start"` the chip would stretch to
  // fill a column-laid-out parent and the text + dot would wrap
  // to separate lines, which is exactly the bug we hit when the
  // chip lived as a lone child of a `flexDirection: "column"`
  // wrapper View on the home page.
  chipBase: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  // Default = page-surface chip with soft iOS-style drop shadow.
  chipDefault: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Overlay = dark-glass chip for floating-over-photo placements.
  chipOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  // Text — 14pt with tight tracking matches the reference chip.
  // Large enough to read across the room, not so large the chip
  // feels like a button.
  text: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  label: {
    fontFamily: "System",
    fontWeight: "500",
  },
  value: {
    fontFamily: "System",
    fontWeight: "700",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginLeft: 7,
  },
});

// Memoized — every prop is a primitive or a function ref the parent
// is expected to keep stable (callbacks should be useCallback'd
// upstream). Without memo, a parent re-render would re-render every
// chip and re-run the dot's Animated.loop effect; with memo, only
// chips whose actual value or tone changed re-render.
export const StatusPill = memo(StatusPillImpl);
