import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { findBookById, type Book } from "@/constants/books";
import { BibleAudioView } from "@/components/audio/BibleAudioView";
import { goBackOr } from "@/lib/navigation";
import { useProgress } from "@/state/progress";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function BibleAudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = findBookById(id ?? "");
  const router = useRouter();
  if (!book) return <View style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white" }}>Book not found</Text><Pressable onPress={() => goBackOr(router, "/library")} style={{ padding: 20 }}><Text style={{ color: "white" }}>Back to Bible</Text></Pressable></View>;
  return <AudioPreview key={book.id} book={book} />;
}

function AudioPreview({ book }: { book: Book }) {
  const router = useRouter();
  const { lastVisited } = useProgress();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [chapter, setChapter] = useState(lastVisited?.bookId === book.id ? Math.min(book.chapters, Math.max(1, lastVisited.chapter)) : 1);
  const [rate, setRate] = useState(1);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  return <>
    <StatusBar style="light" />
    <BibleAudioView placeholder book={book} chapter={chapter} verse={0} verseCount={0} playing={false} loading={false} rate={rate}
      subtitle="Listen to scripture, one chapter at a time"
      onBack={() => goBackOr(router, `/book/${book.id}`)} onPlay={() => {}}
      onPrevious={() => setChapter(value => Math.max(1, value - 1))} onNext={() => setChapter(value => Math.min(book.chapters, value + 1))}
      onChapters={() => setChaptersOpen(true)} onRate={() => setRate(value => value >= 2 ? 0.75 : value + 0.25)} />
    <Modal visible={chaptersOpen} presentationStyle="pageSheet" animationType={reducedMotion ? "none" : "slide"} onRequestClose={() => setChaptersOpen(false)} onDismiss={() => setChaptersOpen(false)}>
      <View style={{ flex: 1, backgroundColor: "#101010", paddingTop: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 }}><Text accessibilityRole="header" style={{ color: "white", fontSize: 21, fontWeight: "700" }}>{book.name}</Text><Pressable onPress={() => setChaptersOpen(false)} accessibilityRole="button" style={{ padding: 14 }}><Text style={{ color: "white" }}>Done</Text></Pressable></View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}>{Array.from({ length: book.chapters }, (_, i) => i + 1).map(number => <Pressable key={number} accessibilityRole="button" accessibilityState={{ selected: number === chapter }} onPress={() => { setChapter(number); setChaptersOpen(false); }} style={{ padding: 18, marginBottom: 8, borderRadius: 16, backgroundColor: number === chapter ? "#383838" : "#1C1C1E" }}><Text style={{ color: "white", fontSize: 17 }}>Chapter {number}{number === chapter ? "  ✓" : ""}</Text></Pressable>)}</ScrollView>
      </View>
    </Modal>
  </>;
}
