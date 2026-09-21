import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { CardGlass } from "@/components/CardGlass";
import { NEW_YORK } from "@/lib/typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { loadJSON, saveJSON } from "@/lib/storage";

const KEY = "closer.reader-tutorial.v1";
const slides: { title: string; body: string; icon: SFSymbolName; tint: string; demo: string; tag?: string }[] = [
  { title: "Read in your own words", body: "Tap the Bible version in the reading toolbar to choose a translation that helps you connect with Scripture.", icon: "book", tint: "#183245", demo: "WEB   ·   KJV   ·   ASV" },
  { title: "Make room to listen", body: "Open a book’s menu and choose Listen to book to explore Bible Audio. Narration is coming soon.", icon: "headphones", tint: "#30273E", demo: "BIBLE AUDIO", tag: "COMING SOON" },
  { title: "Keep what speaks to you", body: "Tap a verse to highlight it or add a personal note. Hold an ordinary verse to select several, then choose a color or add a note.", icon: "pencil.tip", tint: "#3D3320", demo: "A thought worth keeping." },
  { title: "Go a little deeper", body: "Tap any verse, then AI, to open its meaning card. Verse explanations are coming soon; you can explore the preview now.", icon: "sparkles", tint: "#20362E", demo: "VERSE MEANING", tag: "PREVIEW" },
  { title: "Discover Bible Moments", body: "Look for a softly glowing verse. Hold it to reveal a special moment and learn why it matters. Try Genesis 1:1 or Matthew 28:6.", icon: "sun.max", tint: "#3D2D24", demo: "In the beginning…" },
];

export function ReaderTutorial({ preview = false, onClose }: { preview?: boolean; onClose?: () => void }) {
  const focused = useIsFocused();
  const [visible, setVisible] = useState(preview);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const pageWidth = Math.min(width - 32, 430);
  const cardHeight = Math.min(610, height - insets.top - insets.bottom - 52);
  useEffect(() => {
    if (preview) return;
    let active = true;
    void loadJSON<boolean>(KEY).then((seen) => { if (active && !seen) setVisible(true); });
    return () => { active = false; };
  }, [preview]);
  const finish = () => { setVisible(false); if (!preview) void saveJSON(KEY, true); onClose?.(); };
  return <Modal visible={visible && focused} transparent animationType={reduced ? "none" : "slide"} onRequestClose={finish}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.28)", justifyContent: "flex-end", alignItems: "center", paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }}>
      <View accessibilityViewIsModal style={{ width: pageWidth, height: cardHeight, borderRadius: 30, overflow: "hidden", backgroundColor: "transparent", borderWidth: 1, borderColor: "#FFFFFF30" }}>
        <CardGlass />
        <FlatList ref={list} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.title}
          extraData={pageWidth} getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth))}
          renderItem={({ item, index: slideIndex }) => <View accessibilityElementsHidden={slideIndex !== index} importantForAccessibility={slideIndex === index ? "auto" : "no-hide-descendants"} style={{ width: pageWidth }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={{ height: Math.min(238, cardHeight * 0.4), backgroundColor: `${item.tint}66`, alignItems: "center", justifyContent: "center", paddingTop: 24 }}>
                <View style={{ width: pageWidth * 0.65, minHeight: 132, padding: 22, borderRadius: 18, backgroundColor: "#FFFFFF0F", borderWidth: 1, borderColor: "#FFFFFF28", alignItems: "center", justifyContent: "center", transform: [{ rotate: slideIndex % 2 ? "3deg" : "-3deg" }], shadowColor: "#132636", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } }}>
                  <SFSymbol name={item.icon} size={38} color="#F5EEDF" />
                  <Text style={{ marginTop: 18, fontSize: 15, fontWeight: "600", color: "#F5EEDF", textAlign: "center" }}>{item.demo}</Text>
                  {slideIndex === 2 && <View style={{ flexDirection: "row", gap: 9, marginTop: 14 }}>{["#FFD43B", "#5CABF2", "#73BA91", "#DD83AA"].map((color) => <View key={color} style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: color }} />)}</View>}
                </View>
              </View>
              <View style={{ paddingHorizontal: 26, paddingTop: 24 }}>
                {item.tag && <Text style={{ color: "#F3B788", letterSpacing: 1.5, fontSize: 11, fontWeight: "700", textAlign: "center", marginBottom: 10 }}>{item.tag}</Text>}
                <Text accessibilityRole="header" style={{ fontFamily: NEW_YORK, fontSize: 28, color: "#F7F3EB", textAlign: "center", marginBottom: 14 }}>{item.title}</Text>
                <Text style={{ fontSize: 16, lineHeight: 24, color: "#C4C4CA", textAlign: "center" }}>{item.body}</Text>
              </View>
            </ScrollView>
          </View>} />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip reading tutorial" onPress={finish} style={{ position: "absolute", right: 12, top: 12, width: 44, height: 44, backgroundColor: "#FFFFFF18", borderRadius: 22, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={16} color="#FFFFFF" /></Pressable>
        <View style={{ paddingHorizontal: 24, paddingBottom: 22, paddingTop: 10 }}>
          <Pressable accessibilityRole="button" onPress={() => { if (index === slides.length - 1) finish(); else { const next = index + 1; setIndex(next); list.current?.scrollToIndex({ index: next, animated: !reduced }); } }} style={{ minHeight: 50, borderRadius: 25, backgroundColor: "#FF4B16", alignItems: "center", justifyContent: "center", padding: 12 }}><Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>{index === slides.length - 1 ? "Start reading" : "Next"}</Text></Pressable>
        </View>
      </View>
      <View accessibilityLabel={`Tutorial page ${index + 1} of ${slides.length}`} style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>{slides.map((slide, i) => <View key={slide.title} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? "white" : "#FFFFFF65" }} />)}</View>
    </View>
  </Modal>;
}
