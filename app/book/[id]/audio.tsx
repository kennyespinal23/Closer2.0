import { buttonStyles } from "@/lib/buttonStyles";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/CloserText";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { findBookById, type Book } from "@/constants/books";
import { BibleAudioView, listenTone } from "@/components/audio/BibleAudioView";
import { goBackOr } from "@/lib/navigation";
import { useProgress } from "@/state/progress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { nextRate, useListening } from "@/state/listening";
import { fetchChapter } from "@/lib/bible";
import { usePreferences } from "@/state/preferences";
import { paintedCover } from "@/constants/paintedCovers";
import { getBookCover } from "@/constants/bookCovers";
import * as haptics from "@/lib/haptics";

export default function BibleAudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = findBookById(id ?? "");
  const router = useRouter();
  if (!book) return <View style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white" }}>Book not found</Text><Pressable onPress={() => goBackOr(router, "/library")} style={{ padding: 20 }}><Text style={[{ color: "white" }, buttonStyles.compactLabel]}>Back to Bible</Text></Pressable></View>;
  return <Listen key={book.id} book={book} />;
}

function Listen({ book }: { book: Book }) {
  const router = useRouter();
  const { chapter: chapterParam, autoplay } = useLocalSearchParams<{ chapter?: string; autoplay?: string }>();
  const requested = Number(chapterParam);
  const { lastVisited, hasReadChapter } = useProgress();
  const { translation } = usePreferences();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { target, open, speech, rate, setRate } = useListening();
  const [chaptersOpen, setChaptersOpen] = useState(false);

  // Already reading this book? Stay with the chapter being read. Otherwise start where they asked, or where they left off.
  const startChapter = Number.isInteger(requested) && requested >= 1 && requested <= book.chapters ? requested
    : lastVisited?.bookId === book.id ? Math.min(book.chapters, Math.max(1, lastVisited.chapter)) : 1;
  useEffect(() => { if (target?.bookId !== book.id || (Number.isInteger(requested) && requested !== target.chapter)) open(book.id, startChapter); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const chapter = target?.bookId === book.id ? target.chapter : startChapter;
  // closer://book/<id>/audio?autoplay=1 starts reading straight away (from Live Activities, links, Siri).
  useEffect(() => { if (autoplay === "1" && target?.bookId === book.id && speech.status === "idle") void speech.play(0); }, [autoplay, target?.bookId, target?.chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Before play: how long this chapter is, at about 160 words a minute.
  const [preview, setPreview] = useState({ count: 0, minutes: 0 });
  useEffect(() => {
    let live = true;
    fetchChapter(book.id, chapter, translation.id).then(data => {
      if (!live) return;
      const words = data.verses.reduce((n, v) => n + v.text.split(/\s+/).length, 0);
      setPreview({ count: data.verses.length, minutes: Math.max(1, Math.round(words / (160 * rate))) });
    }).catch(() => {});
    return () => { live = false; };
  }, [book.id, chapter, translation.id, rate]);

  const t = listenTone(book.id);
  const cover = paintedCover(book.id)?.source ?? getBookCover(book.id);
  const ours = target?.bookId === book.id && target.chapter === chapter;

  return <>
    <StatusBar style="light" />
    <BibleAudioView book={book} chapter={chapter} verses={ours ? speech.verses : []}
      verse={ours ? speech.verse : 0} verseCount={ours ? speech.verseCount : 0}
      previewCount={preview.count} previewMinutes={preview.minutes}
      playing={ours && speech.playing} loading={ours && speech.loading} paused={ours && speech.status === "paused"} error={ours ? speech.error : undefined} rate={rate}
      onClose={() => goBackOr(router, `/book/${book.id}`)}
      onPlay={() => { haptics.soft(); if (!ours) open(book.id, chapter); speech.toggle(); }}
      onPreviousVerse={() => { haptics.soft(); speech.seek(Math.max(0, speech.verse - 2)); }}
      onNextVerse={() => { haptics.soft(); speech.seek(speech.verse); }}
      onChapters={() => setChaptersOpen(true)} onRate={() => { haptics.soft(); setRate(nextRate(rate)); }}
      onReadAlong={() => router.push(`/book/${book.id}/${chapter}` as never)} />
    <Modal visible={chaptersOpen} presentationStyle="pageSheet" animationType={reducedMotion ? "none" : "slide"} onRequestClose={() => setChaptersOpen(false)} onDismiss={() => setChaptersOpen(false)}>
      <View style={{ flex: 1, backgroundColor: t.deep, paddingTop: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22 }}>
          <Image source={cover} contentFit="cover" style={{ width: 52, height: 52, borderRadius: 14 }}/>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={{ fontSize: 26, lineHeight: 28, fontWeight: "900", letterSpacing: -.6, color: t.t1 }}>{book.name}</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.t3, marginTop: 2 }}>{book.chapters} chapter{book.chapters === 1 ? "" : "s"}</Text>
          </View>
          <Pressable onPress={() => setChaptersOpen(false)} accessibilityRole="button" hitSlop={12} style={{ padding: 6 }}><Text style={{ fontSize: 16, fontWeight: "800", color: t.t1 }}>Done</Text></Pressable>
        </View>
        <Text style={{ marginTop: 26, paddingHorizontal: 22, fontSize: 12, fontWeight: "800", letterSpacing: 1, color: t.t3, textTransform: "uppercase" }}>Choose a chapter</Text>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 12, paddingBottom: insets.bottom + 24, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map(n => {
            const now = n === chapter, read = hasReadChapter(book.id, n);
            return <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Chapter ${n}${read ? ", read" : ""}`} accessibilityState={{ selected: now }}
              onPress={() => { haptics.soft(); open(book.id, n); setChaptersOpen(false); }}
              style={{ width: "17.6%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: now ? t.t1 : "#FFFFFF0F" }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: now ? t.deep : read ? t.t1 : t.t3 }}>{n}</Text>
              {read && !now && <View style={{ position: "absolute", right: 7, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: t.t2 }}/>}
            </Pressable>;
          })}
        </ScrollView>
      </View>
    </Modal>
  </>;
}

