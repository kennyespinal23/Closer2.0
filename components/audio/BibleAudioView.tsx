import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { getBookCover } from "@/constants/bookCovers";
import { paintedCover } from "@/constants/paintedCovers";
import type { Book } from "@/constants/books";
import { mix } from "@/components/HomeDeck";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Listen. The book's painted cover owns the colour; before play the painting is the screen,
 * while playing the verse being read is the hero. One white button.
 */
type Props = {
  book: Book; chapter: number; verse: number; verseCount: number; verses: string[];
  /** Before the first play: how long the chapter is. */
  previewCount: number; previewMinutes: number;
  playing: boolean; loading: boolean; paused: boolean; error?: string; rate: number;
  onClose: () => void; onPlay: () => void; onPreviousVerse: () => void; onNextVerse: () => void;
  onChapters: () => void; onRate: () => void; onReadAlong: () => void;
};

export function listenTone(bookId: string) {
  const c = paintedCover(bookId)?.color ?? "#A47D28";
  return { c, deep: mix(c, "#050608", .66), mid: mix(c, "#000000", .4), t1: mix("#FFFFFF", c, .1), t2: mix("#FFFFFF", c, .32), t3: mix("#FFFFFF", c, .54), t4: mix("#FFFFFF", c, .7) };
}

export function BibleAudioView(p: Props) {
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const reduced = useReducedMotion();
  const t = listenTone(p.book.id);
  const cover = paintedCover(p.book.id)?.source ?? getBookCover(p.book.id);
  const started = p.verseCount > 0;
  const now = p.verses[p.verse - 1], before = p.verse > 1 ? p.verses[p.verse - 2] : undefined, after = p.verses[p.verse];
  const small = height < 760;
  // Long verses shrink so the whole verse always fits.
  const heroSize = !now ? 29 : now.length > 220 ? (small ? 20 : 23) : now.length > 140 ? (small ? 23 : 27) : small ? 26 : 30;

  const round = (icon: SFSymbolName, label: string, action: () => void) =>
    <Pressable onPress={action} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: `${t.deep}8C`, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFFFF2E" }}>
      <SFSymbol name={icon} size={17} color={t.t1}/>
    </Pressable>;
  const playButton = (size: number) =>
    <Pressable onPress={p.onPlay} disabled={p.loading} accessibilityRole="button" accessibilityLabel={p.playing ? "Pause" : "Play"}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", opacity: p.loading ? .6 : 1, boxShadow: `0 18px 40px -16px #000000CC, 0 0 0 8px #FFFFFF10` }}>
      <SFSymbol name={p.playing ? "pause.fill" : "play.fill"} size={size * .36} color={t.deep} style={p.playing ? undefined : { marginLeft: 4 }}/>
    </Pressable>;
  const chip = (label: string, action: () => void, icon?: SFSymbolName, a11y?: string) =>
    <Pressable onPress={action} accessibilityRole="button" accessibilityLabel={a11y ?? label}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF14", borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFFFF24" }}>
      {icon && <SFSymbol name={icon} size={14} color={t.t1}/>}
      <Text style={{ fontSize: 14, fontWeight: "800", color: t.t1 }}>{label}</Text>
    </Pressable>;

  return <View style={{ flex: 1, backgroundColor: t.deep }}>
    {/* Ground: the book's deep colour, a little darker at the floor; the painting on top, fading into it. */}
    <ReaderMaterialGradient pointerEvents="none" colors={["#00000000", "#00000038"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%" }}/>
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: started ? "36%" : "64%", opacity: started ? .55 : 1 }}>
      <Image source={cover} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} transition={reduced ? 0 : 250}/>
      <ReaderMaterialGradient colors={[`${t.deep}59`, `${t.deep}00`, `${t.deep}40`, `${t.deep}E6`, t.deep]} locations={[0, .22, .45, .72, .9]} style={StyleSheet.absoluteFill}/>
    </View>

    <View style={{ position: "absolute", left: 16, right: 16, top: insets.top + 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {round("chevron.down", "Close", p.onClose)}
      {started && <Animated.View entering={reduced ? undefined : FadeIn.duration(220)} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5, paddingLeft: 5, paddingRight: 14, borderRadius: 24, backgroundColor: `${t.deep}99`, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFFFF24" }}>
        <Image source={cover} contentFit="cover" style={{ width: 34, height: 34, borderRadius: 10 }}/>
        <Text style={{ fontSize: 15, fontWeight: "800", color: t.t1 }}>{p.book.name} {p.chapter}</Text>
      </Animated.View>}
      {round("list.bullet", "Choose a chapter", p.onChapters)}
    </View>

    {!started ? (
      // ── Before play: the painting is the screen.
      <View style={{ position: "absolute", left: 24, right: 24, bottom: insets.bottom + 18 }}>
        <Text style={s.kick(t.t3)}>{p.book.name} · Listen</Text>
        <Text accessibilityRole="header" allowFontScaling={false} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.7}
          style={{ marginTop: 6, fontSize: 58 * Math.min(fontScale, 1.15), lineHeight: 62 * Math.min(fontScale, 1.15), fontWeight: "900", letterSpacing: -2, color: t.t1, textTransform: "uppercase" }}>Chapter {p.chapter}</Text>
        <Text style={{ marginTop: 10, fontSize: 16, lineHeight: 22, fontWeight: "700", color: t.t2 }}>
          {p.previewCount ? `${p.previewCount} verses · about ${p.previewMinutes} minute${p.previewMinutes === 1 ? "" : "s"}` : " "}
        </Text>
        {p.error && <Text accessibilityRole="alert" style={{ marginTop: 10, fontSize: 14, fontWeight: "700", color: "#FFD9CC" }}>{p.error}</Text>}
        <View style={{ marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", gap: 8, flexShrink: 1, flexWrap: "wrap" }}>
            {chip(`${p.rate}× speed`, p.onRate, undefined, `Playback speed ${p.rate} times`)}
            {chip("Read along", p.onReadAlong, "book")}
          </View>
          {playButton(76)}
        </View>
        <Text style={{ marginTop: 22, fontSize: 13, lineHeight: 17, fontWeight: "700", color: t.t4 }}>Read aloud by your iPhone, even when it’s locked.</Text>
      </View>
    ) : (
      // ── Playing: the verse being read is the hero.
      <>
        <View style={{ position: "absolute", left: 28, right: 28, top: insets.top + 110, bottom: insets.bottom + 210, justifyContent: "center", overflow: "hidden" }}>
          {before && !small && <Text numberOfLines={1} ellipsizeMode="head" style={{ fontSize: 17, lineHeight: 23, fontWeight: "800", color: t.t4 }}>{before}</Text>}
          <Animated.View key={`${p.chapter}:${p.verse}`} entering={reduced ? undefined : FadeInDown.duration(320)}>
            <View style={{ marginTop: before && !small ? 20 : 0, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, backgroundColor: t.t1 }}><Text style={{ fontSize: 13, fontWeight: "900", color: t.deep }}>{p.verse}</Text></View>
              <Text style={s.kick(t.t2)}>{p.paused ? "Paused" : "Now reading"}</Text>
            </View>
            <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, fontSize: heroSize, lineHeight: heroSize * 1.22, fontWeight: "900", letterSpacing: -.3, color: t.t1, paddingRight: 2 }}>{now}</Text>
            {/* What's coming, so you can read ahead */}
            {after && <View style={{ marginTop: small ? 16 : 24 }}>
              <Text style={s.kick(t.t4)}>Next · verse {p.verse + 1}</Text>
              <Text numberOfLines={small ? 2 : 3} style={{ marginTop: 6, fontSize: 17, lineHeight: 23, fontWeight: "800", color: t.t3 }}>{after}</Text>
            </View>}
          </Animated.View>
        </View>
        <View style={{ position: "absolute", left: 24, right: 24, bottom: insets.bottom + 18 }}>
          {p.error && <Text accessibilityRole="alert" style={{ marginBottom: 12, fontSize: 14, fontWeight: "700", color: "#FFD9CC" }}>{p.error}</Text>}
          {p.verseCount <= 24
            ? <View accessible accessibilityLabel={`Verse ${p.verse} of ${p.verseCount}`} style={{ flexDirection: "row", gap: 5 }}>
                {Array.from({ length: p.verseCount }, (_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < p.verse ? t.t1 : "#FFFFFF26" }}/>)}
              </View>
            : <View accessible accessibilityLabel={`Verse ${p.verse} of ${p.verseCount}`} style={{ height: 5, borderRadius: 3, backgroundColor: "#FFFFFF26", overflow: "hidden" }}>
                <View style={{ width: `${p.verse / p.verseCount * 100}%`, height: 5, borderRadius: 3, backgroundColor: t.t1 }}/>
              </View>}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.t3, fontVariant: ["tabular-nums"] }}>Verse {p.verse} of {p.verseCount}</Text>
            {chip(`${p.rate}× speed`, p.onRate, "gauge.with.dots.needle.33percent", `Playback speed ${p.rate} times. Tap to change`)}
          </View>
          <View style={{ marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 34 }}>
            <Pressable onPress={p.onPreviousVerse} disabled={p.verse <= 1} accessibilityRole="button" accessibilityLabel="Previous verse" style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center", opacity: p.verse <= 1 ? .35 : 1 }}><SFSymbol name="backward.end.fill" size={24} color={t.t1}/></Pressable>
            {playButton(84)}
            <Pressable onPress={p.onNextVerse} disabled={p.verse >= p.verseCount} accessibilityRole="button" accessibilityLabel="Next verse" style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center", opacity: p.verse >= p.verseCount ? .35 : 1 }}><SFSymbol name="forward.end.fill" size={24} color={t.t1}/></Pressable>
          </View>
        </View>
      </>
    )}
  </View>;
}

const s = {
  kick: (color: string) => ({ fontSize: 12, lineHeight: 15, fontWeight: "800" as const, letterSpacing: 1, color, textTransform: "uppercase" as const }),
};
