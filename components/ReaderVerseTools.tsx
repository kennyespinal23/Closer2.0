import { ContextualReaderTip } from "./ContextualReaderTip";
import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HIGHLIGHT_COLORS, type HighlightColorId } from "@/state/annotations";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { SFSymbol } from "./Symbol";
import { systemText } from "@/lib/typography";

/** Compact palette anchored near the press, with no sheet or verse preview. */
export function ReaderVerseTools({ anchorY, reference, currentHighlight, notes = [], multi = false, onColor, onNote, onEditNote, onAI, onShare, onClose }: {
  anchorY: number; reference: string; currentHighlight?: HighlightColorId | null;
  notes?: ReadonlyArray<{ id: string; text: string }>;
  multi?: boolean; onColor: (color: HighlightColorId | null) => void; onNote: () => void;
  onEditNote?: (id: string) => void; onAI: () => void; onShare: () => void; onClose: () => void;
}) {
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets();
  const reduced = useReducedMotion(), progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { progress.value = reduced ? 1 : withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }); }, []);
  useEffect(() => { const subscription = BackHandler.addEventListener("hardwareBackPress", () => { onClose(); return true; }); return () => subscription.remove(); }, [onClose]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: .96 + .04 * progress.value }] }));
  const compact = width < 400;
  const [panelHeight, setPanelHeight] = useState((compact ? 146 : 100) + 62 + (notes.length ? 44 : 0));
  const above = anchorY - panelHeight - 16 >= insets.top + 60;
  const top = Math.max(insets.top + 60, Math.min(height - insets.bottom - panelHeight - 20, above ? anchorY - panelHeight - 16 : anchorY + 28));
  const icon = (name: "note.text" | "sparkles" | "square.and.arrow.up", label: string, action: () => void) => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={action} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>{name === "note.text" ? <View style={{ width: 23, height: 25, backgroundColor: "#F9D96B", borderRadius: 2, transform: [{ rotate: "-6deg" }] }}><View style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, backgroundColor: "#C6A441", borderTopLeftRadius: 2 }} /></View> : <SFSymbol name={name} size={21} color="#F9F0EB" />}</Pressable>;
  return <View pointerEvents="box-none" accessibilityViewIsModal={!multi} style={{ position: "absolute", inset: 0, zIndex: 190 }}>
    {!multi && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss verse tools" onPress={onClose} style={{ position: "absolute", inset: 0 }} />}
    <Animated.View onLayout={event => { const measured = Math.ceil(event.nativeEvent.layout.height); setPanelHeight(old => old === measured ? old : measured); }} style={[{ position: "absolute", top, alignSelf: "center", maxWidth: width - 24, backgroundColor: "#2A241F", borderWidth: 1, borderColor: "#63584F", borderRadius: 16, paddingHorizontal: 8, paddingBottom: 6, boxShadow: "0 10px 24px #00000044" }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 8 }}><Text numberOfLines={1} style={{ ...systemText.caption1, flex: 1, color: "#D8CEC5" }}>{reference}</Text><Pressable accessibilityRole="button" accessibilityLabel="Done selecting verses" onPress={onClose} style={{ minWidth: 44, height: 44, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={13} color="#D8CEC5" /></Pressable></View>
      <View style={{ flexDirection: compact ? "column" : "row", alignItems: "center" }}>
        <View style={{ flexDirection: "row" }}>{HIGHLIGHT_COLORS.map(color => <Pressable key={color.id} accessibilityRole="button" accessibilityLabel={currentHighlight === color.id ? `Remove ${color.name} highlight` : `${color.name} highlight`} accessibilityState={{ selected: currentHighlight === color.id }} onPress={() => onColor(currentHighlight === color.id ? null : color.id)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><View style={{ width: 25, height: 25, borderRadius: 13, backgroundColor: color.swatch, borderWidth: currentHighlight === color.id ? 2 : 0, borderColor: "white", alignItems: "center", justifyContent: "center" }}>{currentHighlight === color.id && <SFSymbol name="checkmark" size={12} color="#201810" />}</View></Pressable>)}</View>
        {!compact && <View style={{ width: 1, height: 26, marginHorizontal: 3, backgroundColor: "#FFFFFF33" }} />}
        <View style={{ flexDirection: "row", gap: compact ? 24 : 0 }}>{icon("note.text", "Add a sticky note", onNote)}{icon("sparkles", "Understand verse with AI", onAI)}{icon("square.and.arrow.up", "Share verse", onShare)}</View>
      </View>
      <ContextualReaderTip id="verse-tools" text="Choose a color to highlight, or the sticky note to write a thought." color="#D8CEC5"/>
      {notes.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{notes.map((note, i) => <Pressable key={note.id} accessibilityRole="button" accessibilityLabel={`Edit note ${i + 1}`} onPress={() => onEditNote?.(note.id)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12 }}><Text numberOfLines={1} style={{ ...systemText.caption1, color: "#F9D96B", maxWidth: 150 }}>{note.text || `Note ${i + 1}`}</Text></Pressable>)}</ScrollView>}
      <View pointerEvents="none" style={{ position: "absolute", left: "46%", ...(above ? { bottom: -7 } : { top: -7 }), width: 12, height: 12, backgroundColor: "#2A241F", transform: [{ rotate: "45deg" }] }} />
    </Animated.View>
  </View>;
}
