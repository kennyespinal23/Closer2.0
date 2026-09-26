import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop, SvgXml } from "react-native-svg";
import type { Book } from "@/constants/books";
import { LIBRARY_BOOK_ART } from "@/constants/libraryBookArt";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText } from "@/lib/typography";
import { useProgress } from "@/state/progress";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol } from "./Symbol";
import { useLibraryLight } from "./LibraryEnvironment";
import * as haptics from "@/lib/haptics";
export type LibraryBookFrame = { x: number; y: number; width: number; height: number };

export function LibraryBookCover({ book, width = 104 }: { book: Book; width?: number }) {
  const art = LIBRARY_BOOK_ART[book.order - 1];
  return <View style={{ width, height: width * 1.42, borderRadius: 3, backgroundColor: "#E0D2BA", boxShadow: "5px 7px 12px #140A0466" }}>
    {[5, 3, 1].map((offset, i) => <View key={offset} style={{ position: "absolute", inset: 0, left: offset, right: -offset, top: i, bottom: -i, borderRadius: 3, backgroundColor: ["#C9B89C", "#E0D2BA", "#F4EBDD"][i] }} />)}
    <View style={{ flex: 1, backgroundColor: art.background, borderRadius: 3, overflow: "hidden", paddingLeft: width * .1, alignItems: "center", justifyContent: "center", gap: width * .07 }}>
      <Svg pointerEvents="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}><Defs><LinearGradient id="binding" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#000" stopOpacity=".3" /><Stop offset=".07" stopColor="#000" stopOpacity=".08" /><Stop offset=".085" stopColor="#FFF" stopOpacity=".28" /><Stop offset=".14" stopColor="#FFF" stopOpacity="0" /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#binding)" /></Svg>
      <View pointerEvents="none" style={{ position: "absolute", top: width * .07, bottom: width * .07, left: width * .14, right: width * .07, borderWidth: 1, borderColor: art.ink, opacity: .35 }} />
      <SvgXml xml={`<svg viewBox="0 0 48 48" fill="none" stroke="${art.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${art.motif}</svg>`} width={width * .44} height={width * .44} />
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontFamily: "System", fontWeight: "600", fontSize: width * (book.name.length > 10 ? .105 : .14), lineHeight: width * .16, color: art.ink, textAlign: "center", paddingHorizontal: width * .1 }}>{book.name}</Text>
    </View>
  </View>;
}

export function LibraryBook({ book, index = 0, width = 104, onPick }: { book: Book; index?: number; width?: number; onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const ref = useRef<View>(null), reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0), lift = useSharedValue(0);
  const rotation = ((book.order * 37) % 7 - 3) * .55;
  useEffect(() => { enter.value = reduced ? 1 : withDelay(Math.min(index * 45, 240), withSpring(1, { damping: 17, stiffness: 175 })); return () => { cancelAnimation(enter); cancelAnimation(lift); }; }, [reduced]);
  const style = useAnimatedStyle(() => ({ opacity: enter.value, transformOrigin: "bottom", transform: [{ translateY: -60 * (1 - enter.value) - 8 * lift.value }, { rotate: `${rotation * (1 - lift.value)}deg` }, { scale: .94 + ((book.order * 53) % 7) / 100 + lift.value * .035 }] }));
  return <Animated.View ref={ref} collapsable={false} style={[{ width, height: width * 1.42 }, style]}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${book.name}, ${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}`} onPressIn={() => { lift.value = reduced ? 0 : withSpring(1, { damping: 20, stiffness: 350 }); }} onPressOut={() => { lift.value = withTiming(0, { duration: reduced ? 0 : 160 }); }} onPress={() => { haptics.soft(); ref.current?.measureInWindow((x, y, w, height) => onPick(book, { x, y, width: w, height })); }}><LibraryBookCover book={book} width={width} /></Pressable></Animated.View>;
}

const SHELF_GROUPS = [
  { title: "The Law", categories: ["The Law"] },
  { title: "History", categories: ["Historical Books"] },
  { title: "Poetry & Wisdom", categories: ["Wisdom & Poetry"] },
  { title: "The Prophets", categories: ["Major Prophets", "Minor Prophets"] },
  { title: "Gospels & Acts", categories: ["Gospels", "Acts"] },
  { title: "Letters & Revelation", categories: ["Pauline Epistles", "General Epistles", "Apocalyptic"] },
];
export function LibraryBookcase({ books, onPick }: { books: readonly Book[]; onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const { dark } = useLibraryLight();
  const { chaptersRead } = useProgress();
  const groups = SHELF_GROUPS.map(group => ({ ...group, books: books.filter(book => group.categories.includes(book.category)) })).filter(group => group.books.length);
  return <View style={{ marginHorizontal: 12, marginTop: 20, backgroundColor: "#A36A3A", paddingHorizontal: 10, paddingTop: 14, paddingBottom: 10, borderRadius: 10, boxShadow: "0 16px 28px #28140544" }}>
    <ReaderMaterialGradient colors={["#D29A62", "#9C6536", "#7A4C26"]} style={{ position: "absolute", left: -5, right: -5, top: -10, height: 20, borderRadius: 5 }} />
    <View style={{ borderRadius: 4, overflow: "hidden", backgroundColor: dark ? "#2A190E" : "#50321F" }}>
      {groups.map(group => <View key={group.title}>
        <View style={{ paddingHorizontal: 12, paddingTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ minWidth: group.title.length * 7 + 26, minHeight: 30, paddingHorizontal: 11, paddingVertical: 5, justifyContent: "center" }}><ReaderMaterialGradient pointerEvents="none" colors={["#F1D08C", "#C99A4B"]} style={{ position: "absolute", inset: 0, borderRadius: 3 }} /><Text style={{ ...systemText.caption1, fontWeight: "700", color: "#3A2410" }}>{group.title}</Text></View><Text style={{ ...systemText.caption1, color: "#E4CCAF" }}>{group.books.length} books</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={118} contentContainerStyle={{ paddingTop: 28, paddingHorizontal: 16, gap: 14, paddingBottom: 8 }}>
          {group.books.map((book, index) => { const count = new Set(chaptersRead.filter(c => c.bookId === book.id).map(c => c.chapter)).size; return <View key={book.id} style={{ alignItems: "center", gap: 10 }}><LibraryBook book={book} index={index} onPick={onPick} /><View style={{ height: 6, width: 40, borderRadius: 3, backgroundColor: "#FFFFFF18", overflow: "hidden" }}>{count > 0 && <View style={{ height: 6, width: `${Math.min(100, count / book.chapters * 100)}%`, backgroundColor: count >= book.chapters ? "#92BD91" : "#FF986B" }} />}</View></View>; })}
        </ScrollView>
        <ReaderMaterialGradient colors={["#DBA46A", "#C98E55", "#85532A", "#5E3A1C"]} style={{ height: 20, borderTopWidth: 1, borderColor: "#E9BA87" }} />
      </View>)}
    </View>
  </View>;
}

export function LibraryLamp() {
  const { dark, toggle } = useLibraryLight(), reduced = useReducedMotion();
  const tug = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: tug.value * 12 }] }));
  return <View style={{ width: 94, height: 138 }}>
    <View pointerEvents="none" style={{ position: "absolute", left: 42, top: -50, width: 2, height: 98, backgroundColor: "#4D382A" }} />
    <Svg pointerEvents="none" width="80" height="50" style={{ position: "absolute", top: 40 }} viewBox="0 0 84 50"><Path d="M42 2C20 2 6 22 2 42h80C78 22 64 2 42 2Z" fill="#FF5A36" /><Path d="M14 20c6-8 14-12 22-13" stroke="#FFB99C" strokeWidth="2" /><Path d="M33 43h18v3q-9 8-18 0Z" fill={dark ? "#FFD985" : "#EBD9BF"} /></Svg>
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: dark }} accessibilityLabel="Library evening lighting" onPress={() => { haptics.soft(); tug.value = reduced ? 0 : 1; tug.value = withSpring(0, { damping: 9, stiffness: 180 }); toggle(); }} style={{ position: "absolute", right: 0, top: 60, width: 44, height: 76, alignItems: "center" }}><Animated.View style={[{ alignItems: "center" }, style]}><View style={{ width: 2, height: 35, backgroundColor: "#B58F52" }} /><View style={{ width: 11, height: 13, borderRadius: 6, backgroundColor: "#D7B06A", borderWidth: 1, borderColor: "#9A7139" }} /></Animated.View></Pressable>
  </View>;
}

/** HTML sequence: curved lift, settle, then a hinged cover; navigation stays behind the overlay. */
export function LibraryBookOpening({ book, source, snapshot, onOpen }: { book: Book; source: LibraryBookFrame; snapshot?: string; onOpen: () => void }) {
  const { width, height } = useWindowDimensions(), reduced = useReducedMotion();
  const travel = useSharedValue(0), hinge = useSharedValue(0), fade = useSharedValue(1);
  const w = Math.min(340, width * .86), h = Math.min(w * 1.42, height - 120);
  const callbacks = useRef({ onOpen });
  callbacks.current = { onOpen };
  const finish = () => callbacks.current.onOpen();
  const frame = useAnimatedStyle(() => ({ transform: [
    { translateX: (source.x + source.width / 2 - width / 2) * (1 - travel.value) },
    { translateY: (source.y + source.height / 2 - height / 2 + 10) * (1 - travel.value) - 10 - Math.sin(travel.value * Math.PI) * 40 },
    { scale: source.width / w + (1 - source.width / w) * travel.value },
    { rotate: `${-5 * Math.sin(travel.value * Math.PI)}deg` },
  ] }));
  const veil = useAnimatedStyle(() => ({ opacity: fade.value }));
  const scrim = useAnimatedStyle(() => ({ opacity: interpolate(travel.value, [0, .35, 1], [0, .5, 1]) }));
  const cover = useAnimatedStyle(() => ({ opacity: interpolate(hinge.value, [0, .65, 1], [1, 1, 0]), transformOrigin: "left", backfaceVisibility: "hidden", transform: [{ perspective: 1800 }, { rotateY: `${hinge.value * -178}deg` }] }));
  useEffect(() => {
    if (reduced) { finish(); return; }
    // No competing spring or navigation animation during the lift.
    travel.value = withTiming(1, { duration: 640, easing: Easing.bezier(.25, .8, .25, 1) });
    hinge.value = withDelay(640, withTiming(1, { duration: 700, easing: Easing.bezier(.65, 0, .35, 1) }, done => {
      if (!done) return;
      fade.value = withTiming(0, { duration: 300 }, finished => { if (finished) runOnJS(finish)(); });
    }));
    return () => { cancelAnimation(travel); cancelAnimation(hinge); cancelAnimation(fade); };
  }, []);
  return <Animated.View accessibilityViewIsModal style={[{ position: "absolute", inset: 0, zIndex: 100, justifyContent: "center", alignItems: "center" }, veil]}>
    <View style={{ position: "absolute", inset: 0, backgroundColor: "#3A2B2A" }}>{snapshot && <Image source={{ uri: snapshot }} contentFit="fill" style={{ position: "absolute", inset: 0 }} />}</View>
    <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "#160D07ED" }, scrim]} />
    <Animated.View style={[{ width: w, height: h }, frame]}>
      <View style={{ position: "absolute", inset: 0, backgroundColor: "#FFFBF4", borderRadius: 4, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }}><Text style={{ ...systemText.caption1, color: "#7A6653" }}>{book.testament === "old" ? "OLD TESTAMENT" : "NEW TESTAMENT"}</Text><Text style={{ ...systemText.title1, color: "#2A1F18", textAlign: "center" }}>{book.name}</Text><Text style={{ ...systemText.footnote, color: "#7A6653" }}>{book.chapters} chapters</Text></View>
      <Animated.View style={cover}><LibraryBookCover book={book} width={w} /></Animated.View>
    </Animated.View>
  </Animated.View>;
}
