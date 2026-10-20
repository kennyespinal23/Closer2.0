import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { mix } from "@/components/HomeDeck";
import { chapterLook } from "@/lib/chapterLook";
import { captureViewToPhotos, shareViewImage } from "@/lib/saveToPhotos";
import * as haptics from "@/lib/haptics";

/**
 * Share a verse as a picture: the chapter's painting with the verse set big, the reference and a
 * small mark. Three backgrounds (the painting, its colour, plain paper). Text sharing stays one tap away.
 */
type Ground = "painting" | "colour" | "paper";

export function VerseShareSheet({ bookId, chapter, reference, text, translation, onShareText, onClose }: {
  bookId: string; chapter: number; reference: string; text: string; translation: string;
  onShareText: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const look = chapterLook(bookId, chapter);
  const c = look.color;
  const t = { sheet: mix(c, "#08090C", .74), deep: mix(c, "#06070A", .66), ink: mix("#FFFFFF", c, .12), soft: mix("#FFFFFF", c, .36) };
  const [ground, setGround] = useState<Ground>(look.art ? "painting" : "colour");
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const card = useRef<View>(null);
  const paper = ground === "paper";
  const size = text.length > 260 ? 16 : text.length > 160 ? 19 : 22;

  const save = async () => { if (busy) return; setBusy("save"); haptics.soft(); try { if (await captureViewToPhotos(card)) haptics.success(); } finally { setBusy(null); } };
  const share = async () => { if (busy) return; setBusy("share"); haptics.soft(); try { await shareViewImage({ ref: card, title: `${reference} · Closer`, filenameBase: reference }); } finally { setBusy(null); } };

  return <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: "#00000080" }]}/>
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: insets.top + 14, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderCurve: "continuous", backgroundColor: t.sheet, paddingTop: 16, paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom, 12) + 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF14", alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={15} weight="bold" color={t.ink}/></Pressable>
        <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: "900", color: t.ink }}>Share {reference}</Text>
        <View style={{ width: 44 }}/>
      </View>

      {/* The picture itself: this exact view is what gets saved and shared */}
      <View style={{ flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center", marginTop: 18 }}>
        <View ref={card} collapsable={false} style={{ height: "100%", maxHeight: 420, aspectRatio: 4 / 5, borderRadius: 26, borderCurve: "continuous", overflow: "hidden", backgroundColor: paper ? "#F4EEE4" : t.deep }}>
          {ground === "painting" && look.art && <Image source={look.art} contentFit="cover" style={StyleSheet.absoluteFill}/>}
          {ground === "painting" && <ReaderMaterialGradient colors={[`${t.deep}1A`, `${t.deep}1A`, `${t.deep}EB`]} locations={[0, .25, .64]} style={StyleSheet.absoluteFill}/>}
          {ground === "colour" && <ReaderMaterialGradient colors={[c, t.deep]} style={StyleSheet.absoluteFill}/>}
          <View style={{ position: "absolute", left: 20, right: 20, bottom: 18, top: paper || ground === "colour" ? 20 : undefined, justifyContent: "flex-end" }}>
            <Text style={{ fontSize: size, lineHeight: size * 1.2, fontWeight: "900", letterSpacing: -.4, color: paper ? "#2A211A" : "#FFFFFF" }}>{text}</Text>
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: .8, color: paper ? "#7A6A5A" : mix("#FFFFFF", c, .3), textTransform: "uppercase" }}>{reference} · {translation}</Text>
              <Text style={{ fontSize: 12, fontWeight: "900", color: paper ? "#9A8A7A" : mix("#FFFFFF", c, .4) }}>Closer</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 12 }}>
        {(["painting", "colour", "paper"] as const).filter(g => g !== "painting" || look.art).map(g => {
          const on = g === ground;
          return <Pressable key={g} onPress={() => { haptics.tick(); setGround(g); }} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={g === "painting" ? "Painting background" : g === "colour" ? "Colour background" : "Plain background"}
            style={{ width: 56, height: 70, borderRadius: 14, borderCurve: "continuous", overflow: "hidden", backgroundColor: g === "paper" ? "#F4EEE4" : t.deep, ...(on ? { borderWidth: 3, borderColor: t.sheet, boxShadow: "0 0 0 2px #FFFFFF" } : null) }}>
            {g === "painting" && look.art && <Image source={look.art} contentFit="cover" style={StyleSheet.absoluteFill}/>}
            {g === "colour" && <ReaderMaterialGradient colors={[c, t.deep]} style={StyleSheet.absoluteFill}/>}
          </Pressable>;
        })}
      </View>

      <View style={{ marginTop: 18, flexDirection: "row", gap: 10 }}>
        <Pressable onPress={save} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Save to Photos" style={{ flex: 1, height: 56, borderRadius: 20, backgroundColor: "#FFFFFF14", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy === "save" ? .6 : 1 }}>
          <SFSymbol name="arrow.down.to.line" size={17} color={t.ink}/><Text style={{ fontSize: 15, fontWeight: "800", color: t.ink }}>Save</Text>
        </Pressable>
        <Pressable onPress={share} disabled={!!busy} accessibilityRole="button" style={{ flex: 1.4, height: 56, borderRadius: 20, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy === "share" ? .6 : 1 }}>
          <SFSymbol name="square.and.arrow.up" size={17} color={t.deep}/><Text style={{ fontSize: 16, fontWeight: "800", color: t.deep }}>Share image</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => { onClose(); onShareText(); }} accessibilityRole="button" style={{ minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: t.soft }}>Share as text instead</Text>
      </Pressable>
    </View>
  </Modal>;
}
