import type { ReactElement } from "react";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { Scene } from "@/lib/closer-page/lesson/types";
import { PSALM } from "@/lib/closer-page/lesson/psalmTokens";

/* Each category's signature object, small, for its Explore band: the thing you'll hold inside it. */
const box = { width: 112, height: 84, viewBox: "0 0 120 90" } as const;

export const MOTIFS: Partial<Record<string, () => ReactElement>> = {
  mysteries: () => (
    <Svg {...box}>
      <Rect x="10" y="18" width="98" height="64" rx="6" fill="#56301E" />
      <Rect x="10" y="10" width="36" height="12" rx="4" fill="#56301E" />
      <Rect x="14" y="22" width="90" height="56" rx="5" fill="#F4DCC0" />
      <SvgText x="22" y="46" fontFamily="NunitoBlack" fontSize="18" fill="#56301E">No. 001</SvgText>
      <G rotation={-7} origin="72, 60">
        <Rect x="44" y="53" width="56" height="15" rx="3" fill="none" stroke="#A45536" strokeWidth={2} />
        <SvgText x="48.5" y="63.3" fontFamily="NunitoBlack" fontSize="6.6" fill="#A45536">UNRESOLVED</SvgText>
      </G>
    </Svg>
  ),
  books: () => (
    <Svg {...box}>
      <Rect x="34" y="8" width="58" height="76" rx="4" fill="#233F58" />
      <Rect x="34" y="8" width="7" height="76" fill="rgba(0,0,0,.3)" />
      <SvgText x="46" y="44" fontFamily="NunitoBlack" fontSize="15" fill="#EAF5FF">Mark</SvgText>
      <Rect x="46" y="50" width="16" height="2.5" fill="#629AC5" />
      <Path d="M78 84 v-20 h7 v20 l-3.5 -3 z" fill="#FFC72C" />
    </Svg>
  ),
  connections: () => (
    <Svg {...box}>
      <Path d="M30 26 Q62 52 92 62" fill="none" stroke="#B85A9C" strokeWidth={6} opacity={0.45} />
      <Path d="M30 26 Q62 52 92 62" fill="none" stroke="#B85A9C" strokeWidth={2.5} />
      <G rotation={-4} origin="30, 25"><Rect x="6" y="12" width="48" height="26" rx="5" fill="#FCEAF6" /><Rect x="12" y="20" width="30" height="3" rx="1.5" fill="#B85A9C" /></G>
      <G rotation={3} origin="92, 63"><Rect x="68" y="50" width="48" height="26" rx="5" fill="#FCEAF6" /><Rect x="74" y="58" width="32" height="3" rx="1.5" fill="#B85A9C" /></G>
    </Svg>
  ),
  psalms: () => (
    <Svg {...box}>
      <Rect width="120" height="90" rx="10" fill="#1B3833" />
      <Circle cx="92" cy="22" r="7" fill="#DCEDE8" />
      <Path d="M0 52 C30 40 60 50 120 40 V90 H0Z" fill="#3D6E67" />
      <Path d="M0 66 C40 56 80 70 120 60 V90 H0Z" fill="#294E49" />
      <Circle cx="20" cy="18" r="1.2" fill="#F0FAF6" /><Circle cx="48" cy="12" r="1" fill="#F0FAF6" /><Circle cx="66" cy="26" r="1.2" fill="#F0FAF6" />
    </Svg>
  ),
};

/* A psalm's landscape, still: the same sky, hills, mist, rain, moon and glow the lessons animate */
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number) {
  const [x, y] = [hex(a), hex(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("");
}
const STARS = [[40, 60], [92, 120], [150, 40], [210, 90], [260, 30], [330, 70], [370, 140], [120, 180], [60, 210], [240, 170], [300, 200], [180, 230]];

export function Landscape({ scene, id }: { scene: Scene; id: string }) {
  const L = scene.light;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMin slice">
      <Defs>
        <LinearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mix(PSALM.night.top, PSALM.dawn.top, L)} />
          <Stop offset="0.35" stopColor={mix(PSALM.night.mid, PSALM.dawn.mid, L)} />
          <Stop offset="0.65" stopColor={mix(PSALM.night.horizon, PSALM.dawn.horizon, L * 0.9)} />
        </LinearGradient>
      </Defs>
      <Rect width="390" height="420" fill={`url(#sky${id})`} />
      {STARS.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 ? 1.3 : 1.9} fill={PSALM.light} opacity={scene.stars * (1 - L) * (i % 2 ? 0.7 : 1)} />)}
      <Circle cx="300" cy="118" r="20" fill={mix("#DCEDE8", "#FFF6DA", L)} opacity={0.25 + 0.6 * (1 - L * 0.5)} />
      <G x={-170 * (1 - scene.cloud)} opacity={0.2 + 0.8 * scene.cloud}>
        <Rect x="236" y="104" width="128" height="32" rx="16" fill={mix("#2E4F4A", "#C9E0DA", L)} opacity={0.8} />
      </G>
      <Rect x="-20" y="190" width="430" height="140" rx="70" fill="#FFF6DA" opacity={scene.glow * 0.35} />
      <Path d="M0 300 C60 270 110 280 160 262 C220 240 280 268 390 250 L390 420 L0 420 Z" fill={mix("#22423D", "#6E9D95", L * 0.5)} />
      <Path d="M0 352 C70 320 140 344 210 318 C270 298 330 330 390 312 L390 420 L0 420 Z" fill={mix("#1A3531", "#4F827A", L * 0.6)} />
      <Path d="M0 410 C90 380 170 404 250 384 C310 370 350 392 390 380 L390 420 L0 420 Z" fill={mix("#12282A", "#2C5650", L * 0.5)} />
      <Rect x="-30" y="282" width="450" height="56" rx="28" fill={PSALM.light} opacity={scene.mist * 0.22} />
      {scene.rain > 0 && Array.from({ length: 30 }).map((_, i) => {
        const x = (i * 37) % 400, y = (i * 89) % 420;
        return <Path key={i} d={`M${x} ${y} l-6 26`} stroke={PSALM.light} strokeWidth={1} opacity={scene.rain * 0.4} />;
      })}
    </Svg>
  );
}
