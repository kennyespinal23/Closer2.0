import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { findBookById } from "@/constants/books";
import { paintedCover } from "@/constants/paintedCovers";
import { getBookCover } from "@/constants/bookCovers";
import { useListening } from "@/state/listening";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { listenTone } from "./BibleAudioView";
import * as haptics from "@/lib/haptics";

/** While a chapter is being read aloud: a small player in the book's colour. Tap it to open Listen. */
export function ListeningMiniPlayer({ bottom, onOpen }: { bottom: number; onOpen: () => void }) {
  const { active, target, speech } = useListening();
  const reduced = useReducedMotion();
  if (!active || !target) return null;
  const book = findBookById(target.bookId), t = listenTone(target.bookId);
  const progress = speech.verseCount ? speech.verse / speech.verseCount : 0;
  return <Animated.View entering={reduced ? undefined : FadeInDown.duration(260)} exiting={reduced ? undefined : FadeOutDown.duration(180)}
    style={{ position: "absolute", left: 14, right: 14, bottom, zIndex: 45, borderRadius: 24, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 18px 34px -14px #000000E6" }}>
    <ReaderMaterialGradient colors={[t.mid, t.deep]} style={StyleSheet.absoluteFill}/>
    <Pressable onPress={() => { haptics.soft(); onOpen(); }} accessibilityRole="button" accessibilityLabel={`Listening to ${book?.name} ${target.chapter}, verse ${speech.verse} of ${speech.verseCount}. Open player`}
      style={{ height: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 9 }}>
      <Image source={paintedCover(target.bookId)?.source ?? getBookCover(target.bookId)} contentFit="cover" style={{ width: 48, height: 48, borderRadius: 14 }}/>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "900", color: t.t1 }}>{book?.name} {target.chapter}</Text>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: t.t2, marginTop: 1 }}>{speech.loading ? "Getting it ready" : speech.status === "paused" ? `Paused · verse ${speech.verse}` : `Verse ${speech.verse} of ${speech.verseCount}`}</Text>
      </View>
      <Pressable onPress={() => { haptics.soft(); speech.toggle(); }} accessibilityRole="button" accessibilityLabel={speech.playing ? "Pause" : "Play"} hitSlop={8}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <SFSymbol name={speech.playing ? "pause.fill" : "play.fill"} size={18} color={t.deep}/>
      </Pressable>
    </Pressable>
    <View pointerEvents="none" style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${progress * 100}%`, backgroundColor: t.t1 }}/>
  </Animated.View>;
}
