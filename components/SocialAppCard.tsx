import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * Falling-card visual for the Get Started screen.
 *
 * Each card is a dark "playing card" frame with a faithfully-styled
 * iOS app icon centered inside. We use real brand colors + simplified
 * glyph shapes so the icons read as the apps users actually know
 * (Instagram's gradient, TikTok's offset note, YouTube's red play
 * triangle, etc.) without licensing exact logos.
 *
 * Why a card frame around the icon (not just bare icons floating)?
 * The frame gives the icons a consistent "object" weight — they read
 * as items being collected/released, not as a screenshot of the home
 * screen. It also matches the reference visual (3D-rendered objects
 * sitting on dark cards). Cards are sized 1:1.21 (close to standard
 * playing-card proportion) so a stagger feels like cards in flight.
 */

export type SocialAppKind =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "snapchat"
  | "facebook"
  | "discord"
  | "reddit";

type Props = {
  app: SocialAppKind;
  /** Card width. Height auto-derived (h = w * 1.21). */
  width?: number;
};

export function SocialAppCard({ app, width = 118 }: Props) {
  const height = Math.round(width * 1.21);
  const iconSize = Math.round(width * 0.58);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 22,
        backgroundColor: "#1A1820",
        borderWidth: 1,
        borderColor: "#2B2933",
        alignItems: "center",
        justifyContent: "center",
        // Soft drop shadow so the cards feel like they have weight
        // and physical presence when they "land" in their final
        // positions after the fall animation.
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 22,
        elevation: 16,
      }}
    >
      <AppIcon kind={app} size={iconSize} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// AppIcon — iOS-style squircle with brand color + simplified glyph
//
// Exported so other surfaces (the Pattern screen, the focus picker,
// settings rows, etc.) can drop in a real-looking app icon without
// re-rendering the full card frame around it.
// ─────────────────────────────────────────────────────────────────

export function AppIcon({ kind, size }: { kind: SocialAppKind; size: number }) {
  // iOS squircle corner radius is roughly 22% of side length —
  // close enough to a rounded rect for our purposes.
  const radius = Math.round(size * 0.225);
  switch (kind) {
    case "instagram":
      return <InstagramIcon size={size} radius={radius} />;
    case "tiktok":
      return <TikTokIcon size={size} radius={radius} />;
    case "youtube":
      return <YouTubeIcon size={size} radius={radius} />;
    case "x":
      return <XIcon size={size} radius={radius} />;
    case "snapchat":
      return <SnapchatIcon size={size} radius={radius} />;
    case "facebook":
      return <FacebookIcon size={size} radius={radius} />;
    case "discord":
      return <DiscordIcon size={size} radius={radius} />;
    case "reddit":
      return <RedditIcon size={size} radius={radius} />;
  }
}

type IconProps = { size: number; radius: number };

function InstagramIcon({ size, radius }: IconProps) {
  // Real Instagram icon uses a radial gradient from bottom-left
  // (yellow/orange) through magenta/pink up to purple in the
  // top-right. Approximated with an SVG radial.
  const inner = size * 0.55;
  const innerOffset = (size - inner) / 2;
  const dotR = size * 0.06;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient
          id="ig-bg"
          cx="25%"
          cy="100%"
          rx="125%"
          ry="125%"
          fx="25%"
          fy="100%"
        >
          <Stop offset="0" stopColor="#FBE18A" />
          <Stop offset="0.18" stopColor="#FCBB45" />
          <Stop offset="0.38" stopColor="#F75274" />
          <Stop offset="0.62" stopColor="#D53692" />
          <Stop offset="0.85" stopColor="#8F3CE0" />
          <Stop offset="1" stopColor="#515ECF" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="url(#ig-bg)" />
      {/* camera body outline */}
      <Rect
        x={size * 0.18}
        y={size * 0.18}
        width={size * 0.64}
        height={size * 0.64}
        rx={size * 0.18}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={size * 0.06}
      />
      {/* lens */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={inner * 0.32}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={size * 0.06}
      />
      {/* viewfinder dot */}
      <Circle cx={size * 0.72} cy={size * 0.28} r={dotR} fill="#FFFFFF" />
    </Svg>
  );
}

function TikTokIcon({ size, radius }: IconProps) {
  // Black square, stylized music note with cyan + magenta offset
  // — the offset is what makes TikTok recognizable from a glance.
  // Each color layer is wrapped in a <G translate=...> so the note
  // shape can shift a few pixels off-center without redrawing.
  const note = tiktokNote(size);
  const offset = size * 0.035;
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#000000" />
      <G translateX={-offset} translateY={offset}>
        <Path d={note} fill="#FF0050" />
      </G>
      <G translateX={offset} translateY={-offset}>
        <Path d={note} fill="#00F2EA" />
      </G>
      <Path d={note} fill="#FFFFFF" />
    </Svg>
  );
}

function tiktokNote(size: number): string {
  // Simplified d-shaped music note matching TikTok's outline.
  const s = size;
  return `
    M ${s * 0.62} ${s * 0.18}
    h ${s * 0.10}
    a ${s * 0.07} ${s * 0.07} 0 0 0 ${s * 0.07} ${s * 0.05}
    a ${s * 0.08} ${s * 0.08} 0 0 0 ${s * 0.05} ${s * 0.02}
    v ${s * 0.09}
    a ${s * 0.18} ${s * 0.18} 0 0 1 -${s * 0.15} -${s * 0.03}
    v ${s * 0.27}
    a ${s * 0.20} ${s * 0.20} 0 1 1 -${s * 0.20} -${s * 0.20}
    a ${s * 0.18} ${s * 0.18} 0 0 1 ${s * 0.06} ${s * 0.01}
    v ${s * 0.10}
    a ${s * 0.09} ${s * 0.09} 0 1 0 ${s * 0.06} ${s * 0.08}
    z
  `;
}

function YouTubeIcon({ size, radius }: IconProps) {
  // Red rounded square with a white play triangle. Real YT app
  // icon shows a horizontal red rounded rect inside the squircle;
  // we render the play directly on the bg to keep the icon
  // unmistakable at small sizes.
  const triCenterX = size * 0.5;
  const triCenterY = size * 0.5;
  const triSize = size * 0.32;
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#FF0033" />
      <Path
        d={`
          M ${triCenterX - triSize * 0.5} ${triCenterY - triSize * 0.6}
          L ${triCenterX + triSize * 0.8} ${triCenterY}
          L ${triCenterX - triSize * 0.5} ${triCenterY + triSize * 0.6}
          Z
        `}
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function XIcon({ size, radius }: IconProps) {
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#000000" />
      {/* Stylized X formed from two diagonals — same construction
          as the real X (formerly Twitter) icon. */}
      <Path
        d={`
          M ${size * 0.22} ${size * 0.22}
          L ${size * 0.45} ${size * 0.5}
          L ${size * 0.22} ${size * 0.78}
          L ${size * 0.34} ${size * 0.78}
          L ${size * 0.52} ${size * 0.58}
          L ${size * 0.66} ${size * 0.78}
          L ${size * 0.82} ${size * 0.78}
          L ${size * 0.59} ${size * 0.50}
          L ${size * 0.78} ${size * 0.22}
          L ${size * 0.66} ${size * 0.22}
          L ${size * 0.52} ${size * 0.42}
          L ${size * 0.38} ${size * 0.22}
          Z
        `}
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function SnapchatIcon({ size, radius }: IconProps) {
  // Bright Snap yellow with a simplified ghost glyph.
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#FFFC00" />
      <Path
        d={`
          M ${size * 0.5} ${size * 0.18}
          C ${size * 0.30} ${size * 0.18}, ${size * 0.28} ${size * 0.38}, ${size * 0.28} ${size * 0.5}
          C ${size * 0.28} ${size * 0.6}, ${size * 0.22} ${size * 0.66}, ${size * 0.18} ${size * 0.7}
          C ${size * 0.18} ${size * 0.74}, ${size * 0.30} ${size * 0.76}, ${size * 0.34} ${size * 0.78}
          C ${size * 0.36} ${size * 0.82}, ${size * 0.40} ${size * 0.84}, ${size * 0.5} ${size * 0.84}
          C ${size * 0.60} ${size * 0.84}, ${size * 0.64} ${size * 0.82}, ${size * 0.66} ${size * 0.78}
          C ${size * 0.70} ${size * 0.76}, ${size * 0.82} ${size * 0.74}, ${size * 0.82} ${size * 0.7}
          C ${size * 0.78} ${size * 0.66}, ${size * 0.72} ${size * 0.6}, ${size * 0.72} ${size * 0.5}
          C ${size * 0.72} ${size * 0.38}, ${size * 0.70} ${size * 0.18}, ${size * 0.5} ${size * 0.18}
          Z
        `}
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function FacebookIcon({ size, radius }: IconProps) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id="fb-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2AA4F4" />
          <Stop offset="1" stopColor="#007AD9" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="url(#fb-bg)" />
      {/* Stylized lowercase f — vertical stem with crossbar. */}
      <Path
        d={`
          M ${size * 0.62} ${size * 0.30}
          h -${size * 0.06}
          a ${size * 0.05} ${size * 0.05} 0 0 0 -${size * 0.05} ${size * 0.05}
          v ${size * 0.10}
          h -${size * 0.10}
          v ${size * 0.10}
          h ${size * 0.10}
          v ${size * 0.30}
          h ${size * 0.12}
          v -${size * 0.30}
          h ${size * 0.10}
          l ${size * 0.02} -${size * 0.10}
          h -${size * 0.12}
          v -${size * 0.06}
          a ${size * 0.02} ${size * 0.02} 0 0 1 ${size * 0.02} -${size * 0.02}
          h ${size * 0.09}
          Z
        `}
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function DiscordIcon({ size, radius }: IconProps) {
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#5865F2" />
      {/* Stylized Discord speech-bubble face — wide rounded shape
          with two oval "eyes". Lighter on detail vs the real logo
          but unmistakable at icon scale. */}
      <Path
        d={`
          M ${size * 0.25} ${size * 0.32}
          Q ${size * 0.5} ${size * 0.22}, ${size * 0.75} ${size * 0.32}
          Q ${size * 0.82} ${size * 0.5}, ${size * 0.72} ${size * 0.66}
          L ${size * 0.66} ${size * 0.72}
          L ${size * 0.62} ${size * 0.66}
          Q ${size * 0.5} ${size * 0.70}, ${size * 0.38} ${size * 0.66}
          L ${size * 0.34} ${size * 0.72}
          L ${size * 0.28} ${size * 0.66}
          Q ${size * 0.18} ${size * 0.5}, ${size * 0.25} ${size * 0.32}
          Z
        `}
        fill="#FFFFFF"
      />
      <Circle cx={size * 0.40} cy={size * 0.50} r={size * 0.05} fill="#5865F2" />
      <Circle cx={size * 0.60} cy={size * 0.50} r={size * 0.05} fill="#5865F2" />
    </Svg>
  );
}

function RedditIcon({ size, radius }: IconProps) {
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} rx={radius} fill="#FF4500" />
      {/* Reddit "snoo" head — rounded white face with antenna */}
      <Circle cx={size * 0.5} cy={size * 0.58} r={size * 0.26} fill="#FFFFFF" />
      {/* antenna */}
      <Path
        d={`M ${size * 0.5} ${size * 0.32} L ${size * 0.5} ${size * 0.22}`}
        stroke="#FFFFFF"
        strokeWidth={size * 0.04}
        strokeLinecap="round"
      />
      <Circle cx={size * 0.5} cy={size * 0.20} r={size * 0.045} fill="#FFFFFF" />
      {/* eyes */}
      <Circle cx={size * 0.42} cy={size * 0.56} r={size * 0.035} fill="#FF4500" />
      <Circle cx={size * 0.58} cy={size * 0.56} r={size * 0.035} fill="#FF4500" />
      {/* smile */}
      <Path
        d={`M ${size * 0.40} ${size * 0.66} Q ${size * 0.5} ${size * 0.74}, ${size * 0.60} ${size * 0.66}`}
        stroke="#FF4500"
        strokeWidth={size * 0.025}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
