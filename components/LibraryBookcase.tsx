import { Image } from "expo-image";
import { getBookCover } from "@/constants/bookCovers";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View,  } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import type { Book } from "@/constants/books";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText } from "@/lib/typography";
import { useProgress } from "@/state/progress";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { useLibraryLight } from "./LibraryEnvironment";
import * as haptics from "@/lib/haptics";
export type LibraryBookFrame = { x: number; y: number; width: number; height: number };

export function LibraryBookCover({ book, width = 104 }: { book: Book; width?: number }) {
  return <View style={{ width, height: width * 1.42, borderRadius: 3, backgroundColor: "#E0D2BA", boxShadow: "5px 7px 12px #140A0466" }}>
    {[5, 3, 1].map((offset, i) => <View key={offset} style={{ position: "absolute", inset: 0, left: offset, right: -offset, top: i, bottom: -i, borderRadius: 3, backgroundColor: ["#C9B89C", "#E0D2BA", "#F4EBDD"][i] }} />)}
    <Image source={getBookCover(book.id)} contentFit="fill" transition={0} style={{ width, height: width * 1.42, borderRadius: 3 }} />
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
export function LibraryBookcase({ books, onPick, onSettled }: { books: readonly Book[]; onSettled?: () => void; onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const { dark } = useLibraryLight();
  const { chaptersRead } = useProgress();
  const groups = SHELF_GROUPS.map(group => ({ ...group, books: books.filter(book => group.categories.includes(book.category)) })).filter(group => group.books.length);
  return <View style={{ marginHorizontal: 12, marginTop: 20, backgroundColor: "#A36A3A", paddingHorizontal: 10, paddingTop: 14, paddingBottom: 10, borderRadius: 10, boxShadow: "0 16px 28px #28140544" }}>
    <ReaderMaterialGradient colors={["#D29A62", "#9C6536", "#7A4C26"]} style={{ position: "absolute", left: -5, right: -5, top: -10, height: 20, borderRadius: 5 }} />
    <View style={{ borderRadius: 4, overflow: "hidden", backgroundColor: dark ? "#2A190E" : "#50321F" }}>
      {groups.map(group => <View key={group.title}>
        <View style={{ paddingHorizontal: 12, paddingTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ minWidth: group.title.length * 7 + 26, minHeight: 30, paddingHorizontal: 11, paddingVertical: 5, justifyContent: "center" }}><ReaderMaterialGradient pointerEvents="none" colors={["#F1D08C", "#C99A4B"]} style={{ position: "absolute", inset: 0, borderRadius: 3 }} /><Text style={{ ...systemText.caption1, fontWeight: "700", color: "#3A2410" }}>{group.title}</Text></View><Text style={{ ...systemText.caption1, color: "#E4CCAF" }}>{group.books.length} books</Text></View>
        <ScrollView horizontal onMomentumScrollEnd={onSettled} onScrollEndDrag={onSettled} showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={118} contentContainerStyle={{ paddingTop: 28, paddingHorizontal: 16, gap: 14, paddingBottom: 8 }}>
          {group.books.map((book, index) => { const count = new Set(chaptersRead.filter(c => c.bookId === book.id).map(c => c.chapter)).size; return <View key={book.id} style={{ alignItems: "center", gap: 10 }}><LibraryBook book={book} index={index} onPick={onPick} /><View style={{ height: 6, width: 40, borderRadius: 3, backgroundColor: "#FFFFFF18", overflow: "hidden" }}>{count > 0 && <View style={{ height: 6, width: `${Math.min(100, count / book.chapters * 100)}%`, backgroundColor: count >= book.chapters ? "#92BD91" : "#FF986B" }} />}</View></View>; })}
        </ScrollView>
        <ReaderMaterialGradient colors={["#DBA46A", "#C98E55", "#85532A", "#5E3A1C"]} style={{ height: 20, borderTopWidth: 1, borderColor: "#E9BA87" }} />
      </View>)}
    </View>
  </View>;
}
