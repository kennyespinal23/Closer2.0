import { useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { findBookById, type Book } from "@/constants/books";
import { getBookCover } from "@/constants/bookCovers";
import { EXPRESS_CLOSING, findExpressBook, type ExpressBook } from "@/constants/expressBooks";
import { SFSymbol } from "@/components/Symbol";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { goBackOr } from "@/lib/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useExpressProgress } from "@/state/expressProgress";
import { useColors, useResolvedScheme } from "@/state/theme";
import { usePreferences } from "@/state/preferences";
import * as haptics from "@/lib/haptics";

export default function ExpressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = findBookById(id ?? "");
  const express = findExpressBook(id ?? "");
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (!book || !express) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 28, paddingTop: insets.top }}>
    <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 26, fontWeight: "700" }}>Read the full story</Text>
    <Text style={{ color: colors.inkMuted, fontSize: 17, lineHeight: 26, marginTop: 12 }}>This book doesn't have an Express version. Its full text is ready to read.</Text>
    <Pressable accessibilityRole="button" onPress={() => book ? router.replace(`/book/${book.id}/1`) : goBackOr(router, "/(tabs)/library")} style={{ minHeight: 48, justifyContent: "center", marginTop: 24 }}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: "600" }}>{book ? "Read full book" : "Back to Bible"}</Text></Pressable>
  </View>;
  return <ExpressReader key={book.id} book={book} express={express} />;
}

function ExpressReader({ book, express }: { book: Book; express: ExpressBook }) {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const focusSpacing = useFocusMiniPlayerSpacing();
  const { textSize } = usePreferences();
  const progress = useExpressProgress(book.id, express.scenes.length);
  const scroll = useRef<ScrollView>(null);
  const closing = progress.index === express.scenes.length;
  const scene = express.scenes[progress.index];
  const unit = express.kind === "beats" ? "Key beat" : "Scene";
  const goTo = (index: number) => {
    haptics.soft();
    scroll.current?.scrollTo({ y: 0, animated: false });
    progress.goTo(index);
  };
  const fullBook = () => router.push(`/book/${book.id}/1`);
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <Stack.Screen options={{ animation: reduced ? "fade" : "slide_from_right" }} />
    <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => goBackOr(router, `/book/${book.id}`)} style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}><SFSymbol name="chevron.left" color={colors.ink} size={20} /></Pressable>
      <View style={{ flex: 1, alignItems: "center" }}><Text numberOfLines={1} style={{ color: colors.ink, fontSize: 17, fontWeight: "600" }}>{book.name}</Text><Text style={{ color: colors.inkSubtle, fontSize: 12, marginTop: 2 }}>Express version</Text></View>
      <Pressable accessibilityRole="button" onPress={fullBook} style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: "center" }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>Full book</Text></Pressable>
    </View>
    {progress.ready && <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 6 }}>
      {express.scenes.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${unit} ${index + 1}: ${item.title}`} accessibilityState={{ selected: index === progress.index }} onPress={() => goTo(index)} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: index <= progress.index ? colors.ink : colors.border }} />
      </Pressable>)}
    </View>}
    {!progress.ready ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      {progress.error ? <Pressable accessibilityRole="button" onPress={progress.retry} style={{ padding: 16 }}><Text style={{ color: colors.ink, fontSize: 17 }}>{progress.error}</Text></Pressable> : <ActivityIndicator accessibilityLabel="Loading your Express reading place" color={colors.ink} />}
    </View> : <>
      <ScrollView ref={scroll} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, width: "100%", maxWidth: 640, alignSelf: "center" }}>
        <Animated.View key={progress.index} entering={reduced ? undefined : FadeIn.duration(180)}>
          <View style={{ borderRadius: 24, borderCurve: "continuous", overflow: "hidden", marginBottom: 24 }}><Image source={getBookCover(book.id)} contentFit="cover" contentPosition="center" accessibilityLabel={`${book.name} cover artwork`} style={{ width: "100%", aspectRatio: closing ? 2.2 : 1.8 }} /></View>
          <Text style={{ color: colors.inkSubtle, fontSize: 12, fontWeight: "600", letterSpacing: 1.3, marginBottom: 10 }}>{closing ? "EXPRESS COMPLETE" : `${unit.toUpperCase()} ${progress.index + 1} OF ${express.scenes.length}`}</Text>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "700", letterSpacing: -0.6, marginBottom: 18 }}>{closing ? "The story stays with you." : scene.title}</Text>
          <Text selectable style={{ color: colors.ink, fontFamily: "System", fontSize: 19 * textSize.scale, lineHeight: 30 * textSize.scale }}>{closing ? EXPRESS_CLOSING : scene.body}</Text>
          {closing ? <Pressable accessibilityRole="button" onPress={() => goTo(0)} style={{ minHeight: 48, marginTop: 24, justifyContent: "center" }}><Text style={{ color: colors.inkMuted, fontSize: 16, fontWeight: "600" }}>Read Express again</Text></Pressable> : <View style={{ marginTop: 28, gap: 4 }}>
            <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>{express.kind === "beats" ? "A Closer summary" : "A Closer retelling"} · Explore the passage</Text>
            {scene.passages.map(passage => <Pressable key={passage.reference} accessibilityRole="button" accessibilityLabel={`Read ${passage.reference} in the full Bible`} onPress={() => router.push(`/book/${passage.bookId}/${passage.startChapter}?focus=${passage.startVerse}`)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}><Text style={{ color: colors.inkMuted, fontSize: 15, fontWeight: "600", flexShrink: 1 }}>{passage.reference}</Text><SFSymbol name="arrow.up.right" size={12} color={colors.inkMuted} /></Pressable>)}
          </View>}
        </Animated.View>
      </ScrollView>
      {progress.error && <Pressable accessibilityRole="button" onPress={progress.retry} style={{ minHeight: 44, paddingHorizontal: 24, justifyContent: "center" }}><Text accessibilityLiveRegion="polite" style={{ color: colors.inkMuted, fontSize: 13 }}>{progress.error}</Text></Pressable>}
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) + focusSpacing, flexDirection: "row", gap: 12, alignItems: "center", borderTopWidth: 0.5, borderTopColor: colors.border }}>
        <Pressable disabled={progress.index === 0} accessibilityRole="button" accessibilityLabel={`Previous ${express.kind === "beats" ? "beat" : "scene"}`} onPress={() => goTo(progress.index - 1)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceSecondary, opacity: progress.index === 0 ? 0.3 : 1, alignItems: "center", justifyContent: "center" }}><SFSymbol name="arrow.left" size={20} color={colors.ink} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => closing ? fullBook() : goTo(progress.index + 1)} style={{ flex: 1, minHeight: 52, borderRadius: 26, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.ink, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Text style={{ color: colors.bg, fontSize: 17, fontWeight: "600", flexShrink: 1 }}>{closing ? "Read full book" : progress.index === express.scenes.length - 1 ? "Finish Express" : "Continue"}</Text><SFSymbol name="arrow.right" size={18} color={colors.bg} />
        </Pressable>
      </View>
    </>}
  </View>;
}
