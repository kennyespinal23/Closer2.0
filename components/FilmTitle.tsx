import { Text, View } from "react-native";

/**
 * A Closer Short's title, set like streaming title art (CLOSER-PICKS.md, "Film title"; modelled on Tracker on
 * Paramount+): the key word in very tall condensed capitals, the words before it small and spaced above, the words
 * after it small and spaced below, like a tagline.
 *
 *   I GOT
 *   LOST
 *   ON THE WAY
 *
 * The key word is the longest word in the title (the last one, on a tie), unless `keyWord` names it. Only film titles
 * use Oswald; the rest of Closer is Nunito.
 */
type Size = "hero" | "page" | "poster";
const SIZES: Record<Size, { key: number; small: number; gap: number; width: string }> = {
  hero: { key: 92, small: 16, gap: 8, width: "78%" },
  page: { key: 74, small: 14, gap: 6, width: "80%" },
  poster: { key: 34, small: 8.5, gap: 3, width: "92%" },
};

export function splitTitle(title: string, keyWord?: string | null) {
  const words = title.trim().split(/\s+/);
  let k = keyWord ? words.findIndex(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === keyWord.toLowerCase()) : -1;
  if (k < 0) {
    let best = 0;
    words.forEach((w, i) => { const n = w.replace(/[^\p{L}\p{N}]/gu, "").length; if (n >= best) { best = n; k = i; } });
  }
  return { top: words.slice(0, k).join(" "), key: words[k] ?? title, bottom: words.slice(k + 1).join(" ") };
}

export function FilmTitle({ title, keyWord, size = "hero", color = "#FFFFFF" }: { title: string; keyWord?: string | null; size?: Size; color?: string }) {
  const { top, key, bottom } = splitTitle(title, keyWord);
  const z = SIZES[size];
  const small = (s: string) => (
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
      style={{ fontFamily: "Oswald_300Light", fontSize: z.small, letterSpacing: z.small * 0.42, color, textTransform: "uppercase", textAlign: "center", marginRight: -z.small * 0.42 }}>
      {s}
    </Text>
  );
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={title} style={{ alignItems: "center", alignSelf: "center", width: z.width as `${number}%` }}>
      {!!top && small(top)}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}
        style={{ fontFamily: "Oswald_700Bold", fontSize: z.key, lineHeight: z.key * 1.02, letterSpacing: z.key * 0.02, color, textTransform: "uppercase", textAlign: "center", transform: [{ scaleY: 1.12 }], marginTop: z.key * 0.1, marginBottom: -z.key * 0.14 }}>
        {key}
      </Text>
      {!!bottom && <View style={{ marginTop: z.gap }}>{small(bottom)}</View>}
    </View>
  );
}
