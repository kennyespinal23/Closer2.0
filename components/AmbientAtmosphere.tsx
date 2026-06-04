import { View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * AmbientAtmosphere — the page-level Opal-style accent wash.
 *
 * A wide radial gradient anchored to the top of the screen,
 * painted BEHIND everything else. The per-sermon-type accent
 * (violet for Letters, blue for Questions, peach for Hope…)
 * becomes the lighting of the upper portion of the screen,
 * bleeding into the status-bar area and fading to fully
 * transparent below.
 *
 * The big idea: rather than each tab being a flat-black canvas
 * with its own ad-hoc accents, the WHOLE app is lit by the day's
 * sermon accent. Open Today, the sermon hero sits inside its
 * accent atmosphere. Switch to Practice, the same accent
 * continues to wash the top of the page. Library, Insights —
 * same. The unified atmosphere makes the app feel like one
 * continuous space rather than a stack of unrelated tabs.
 *
 * Same parallax-y trick Opal uses for its background tint:
 * absolute-positioned at the screen's top edge so it stays
 * visually stationary as the user scrolls — content scrolls
 * THROUGH the lit stage rather than the stage moving with the
 * content.
 *
 * Heights, falloff, and opacity are sized to look right against
 * the kind of content tabs typically render at the top
 * (greeting + hero ≈ 380pt, eyebrow + section header ≈ 200pt).
 * The gradient ends transparent so any tab with a long scroll
 * just fades back to the page bg below.
 */
export type AmbientAtmosphereProps = {
  /** Hex color (#RRGGBB) — typically today's sermon type accent. */
  accent: string;
  /** Optional override for total atmospheric height (px).
   *  Defaults to 520 which covers a typical greeting + hero. */
  height?: number;
};

export function AmbientAtmosphere({
  accent,
  height = 520,
}: AmbientAtmosphereProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="ambient-atmosphere"
            cx="50%"
            cy="32%"
            rx="95%"
            ry="65%"
            fx="50%"
            fy="32%"
          >
            {/* Stops tuned for an even wash that bleeds without
                ever feeling "spotlight on a stage". The center
                is bright enough to color the upper screen
                clearly; the falloff is gradual so the eye reads
                "lit room" not "lit ring". */}
            <Stop offset="0" stopColor={accent} stopOpacity={0.35} />
            <Stop offset="0.35" stopColor={accent} stopOpacity={0.14} />
            <Stop offset="0.7" stopColor={accent} stopOpacity={0.04} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="url(#ambient-atmosphere)"
        />
      </Svg>
    </View>
  );
}
