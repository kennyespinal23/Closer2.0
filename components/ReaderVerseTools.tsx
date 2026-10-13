import { useEffect } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HIGHLIGHT_COLORS, type HighlightColorId } from "@/state/annotations";
import { useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";
import { ContextualReaderTip } from "./ContextualReaderTip";
import { SFSymbol, type SFSymbolName } from "./Symbol";

/**
 * The verse card: tap a verse and it rises from the bottom. The reference,
 * your highlight colours, then Meaning, Note and Share. While choosing
 * several verses there's no scrim, so you can keep tapping the page.
 */
export function ReaderVerseTools({ reference, currentHighlight, notes = [], multi = false, onColor, onNote, onEditNote, onAI, onShare, onClose }: {
  anchorY?: number; reference: string; currentHighlight?: HighlightColorId | null;
  notes?: ReadonlyArray<{ id: string; text: string }>;
  multi?: boolean; onColor: (color: HighlightColorId | null) => void; onNote: () => void;
  onEditNote?: (id: string) => void; onAI: () => void; onShare: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), dark = useResolvedScheme() === "dark";
  const t = { paper: dark ? "#26211C" : "#FFFDFA", ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", soft: dark ? "#FFFFFF12" : "#F3EEE8", line: dark ? "#FFFFFF24" : "#17120F2E", grab: dark ? "#FFFFFF2E" : "#17120F2E" };
  const shown = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) shown.value = withTiming(1, { duration: 360, easing: Easing.bezier(.2, .9, .25, 1) }); }, [reduced, shown]);
  useEffect(() => { const sub = BackHandler.addEventListener("hardwareBackPress", () => { onClose(); return true; }); return () => sub.remove(); }, [onClose]);
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.value) * 320 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));

  const action = (icon: SFSymbolName, label: string, onPress: () => void, key = false) =>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptics.soft(); onPress(); }} style={[s.act, { backgroundColor: key ? t.ink : t.soft }]}>
      <SFSymbol name={icon} size={21} color={key ? t.paper : t.ink}/>
      <Text style={{ fontSize: 13, lineHeight: 16, fontWeight: "800", color: key ? t.paper : t.ink }}>{label}</Text>
    </Pressable>;

  return <View pointerEvents="box-none" accessibilityViewIsModal={!multi} style={{ position: "absolute", inset: 0, zIndex: 190 }}>
    {!multi && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#17120F38" }, scrim]}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss verse tools" onPress={onClose} style={{ flex: 1 }}/></Animated.View>}
    <Animated.View style={[s.sheet, { backgroundColor: t.paper, paddingBottom: Math.max(insets.bottom, 12) + 4 }, rise]}>
      <View style={[s.grab, { backgroundColor: t.grab }]}/>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text accessibilityRole="header" numberOfLines={1} style={{ ...uiText.supporting, fontWeight: "800", color: t.muted, flex: 1 }}>{reference}</Text>
        {multi && <Pressable accessibilityRole="button" accessibilityLabel="Done selecting verses" onPress={onClose} hitSlop={10}><Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>Done</Text></Pressable>}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
        {HIGHLIGHT_COLORS.map(color => {
          const on = currentHighlight === color.id;
          return <Pressable key={color.id} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={on ? `Remove ${color.name} highlight` : `${color.name} highlight`}
            onPress={() => { haptics.tick(); onColor(on ? null : color.id); }}
            style={[s.swatch, { backgroundColor: color.swatch }, on && { borderWidth: 3, borderColor: t.paper, boxShadow: `0 0 0 2px ${t.ink}` }]}>
            {on && <SFSymbol name="checkmark" size={15} color="#FFFFFF" weight="bold"/>}
          </Pressable>;
        })}
        {!!currentHighlight && <Pressable accessibilityRole="button" accessibilityLabel="Remove highlight" onPress={() => { haptics.tick(); onColor(null); }} style={{ marginLeft: "auto", minHeight: 40, justifyContent: "center" }}>
          <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.muted }}>Clear</Text>
        </Pressable>}
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        {action("sparkles", "Meaning", onAI, true)}
        {action("note.text", "Note", onNote)}
        {action("square.and.arrow.up", "Share", onShare)}
      </View>

      {notes.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
        {notes.map((note, i) => <Pressable key={note.id} accessibilityRole="button" accessibilityLabel={`Edit note ${i + 1}`} onPress={() => onEditNote?.(note.id)} style={s.note}>
          <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: "#FFC93C" }}/>
          <Text numberOfLines={1} style={{ ...uiText.supporting, fontSize: 14, fontWeight: "700", color: t.ink, maxWidth: 190 }}>{note.text || `Note ${i + 1}`}</Text>
        </Pressable>)}
      </ScrollView>}
      <ContextualReaderTip id="verse-tools" text="Choose a colour to highlight, or Note to write a thought." color={t.muted}/>
    </Animated.View>
  </View>;
}

const s = StyleSheet.create({
  sheet: { position: "absolute", left: 8, right: 8, bottom: 8, borderRadius: 34, borderCurve: "continuous", paddingTop: 10, paddingHorizontal: 20, boxShadow: "0 -2px 6px #0000000F, 0 -20px 50px -20px #28140A66" },
  grab: { width: 36, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 14 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  act: { flex: 1, height: 70, borderRadius: 22, borderCurve: "continuous", alignItems: "center", justifyContent: "center", gap: 6 },
  note: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF4CC66" },
});
