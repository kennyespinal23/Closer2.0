import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { getBookCover, getCoverBloom } from "@/constants/bookCovers";
import type { Book } from "@/constants/books";

type Props = {
  placeholder?: boolean; book: Book; chapter: number; verse: number; verseCount: number; playing: boolean; loading: boolean;
  subtitle: string; error?: string; rate: number;
  onBack: () => void; onPlay: () => void; onPrevious: () => void; onNext: () => void; onChapters: () => void; onRate: () => void;
};
export function BibleAudioView(p: Props) {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const bloom = getCoverBloom(p.book.id);
  const coverWidth = Math.min(width * 0.57, height * 0.3, 280);
  const control = (icon: SFSymbolName, label: string, action: () => void, large = false, disabled = false) => <Pressable onPress={action} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={{ width: large ? 76 : 52, height: large ? 76 : 52, borderRadius: 999, backgroundColor: large ? "white" : "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }}><SFSymbol name={icon} size={large ? 30 : 22} color={large ? "#101010" : "white"} /></Pressable>;
  return <View style={{ flex: 1, backgroundColor: "black" }}>
    <Svg width="100%" height="100%" style={{ position: "absolute" }}><Defs><LinearGradient id="audioHue" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#050505" /><Stop offset="0.45" stopColor={bloom?.outer ?? "#292329"} /><Stop offset="1" stopColor={bloom?.inner ?? "#5A4B43"} /></LinearGradient><LinearGradient id="audioShade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="black" stopOpacity={0.1} /><Stop offset="1" stopColor="black" stopOpacity={0.66} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#audioHue)" /><Rect width="100%" height="100%" fill="url(#audioShade)" /></Svg>
    <ScrollView contentContainerStyle={{ minHeight: height, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>{control("chevron.left", "Back", p.onBack)}<Text style={{ color: "#E2E2E2", fontWeight: "600", letterSpacing: 2, fontSize: 14 }}>BIBLE AUDIO</Text>{control("list.bullet", "Choose chapter", p.onChapters)}</View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 28, gap: 20 }}>
        <View style={{ width: coverWidth, height: coverWidth * 1.4, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}><Image source={getBookCover(p.book.id)!} contentFit="cover" style={{ width: "100%", height: "100%" }} /></View>
        <View style={{ alignItems: "center", gap: 6 }}><Text allowFontScaling={false} style={{ color: "white", fontSize: 27 * fontScale, lineHeight: 34 * fontScale, textAlign: "center", fontWeight: "700" }}>{p.book.name}</Text><Text style={{ color: "white", fontSize: 18 }}>Chapter {p.chapter}</Text><Text style={{ color: "#D0D0D0", textAlign: "center", fontSize: 13 }}>{p.subtitle}</Text></View>
      </View>
      <View style={{ width: "100%", maxWidth: 460, alignSelf: "center", gap: 20 }}>
        {p.error ? <Text accessibilityRole="alert" style={{ color: "#FFE0D6", textAlign: "center" }}>{p.error}</Text> : null}
        <View accessibilityLabel={p.placeholder ? "Audio narration coming soon" : `Verse ${p.verse} of ${p.verseCount}`}><View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}><View style={{ height: 4, width: `${p.verseCount ? p.verse / p.verseCount * 100 : 0}%`, backgroundColor: "white" }} /></View><Text style={{ color: "#D0D0D0", marginTop: 10, fontSize: 13 }}>{p.placeholder ? "Narration coming soon" : p.loading ? "Preparing audio…" : `Verse ${p.verse} of ${p.verseCount}`}</Text></View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 }}>{control("backward.end.fill", "Previous chapter", p.onPrevious, false, p.chapter <= 1)}{control(p.playing ? "pause.fill" : "play.fill", p.placeholder ? "Narration coming soon" : p.playing ? "Pause narration" : "Play narration", p.onPlay, true, p.loading || p.placeholder)}{control("forward.end.fill", "Next chapter", p.onNext, false, p.chapter >= p.book.chapters)}</View>
        <Pressable onPress={p.onRate} accessibilityRole="button" accessibilityLabel={`Playback speed ${p.rate} times`} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white", fontSize: 15 }}>{p.rate}× speed</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}
