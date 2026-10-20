import { useEffect } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HIGHLIGHT_COLORS, type HighlightColorId } from "@/state/annotations";
import { useColors } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { ContextualReaderTip } from "./ContextualReaderTip";
import { SFSymbol, type SFSymbolName } from "./Symbol";

/**
 * The verse sheet. Tap a verse and it lifts out of the page into a sheet in the chapter's colour,
 * shown at full size: the verse is the hero. Below it the five highlight inks, then Note, Meaning,
 * Listen and Share (the one white button), then your notes on it. While choosing several verses
 * there's no scrim: a bar names the range at the top and a panel floats at the bottom.
 */
export function ReaderVerseTools({ reference, verseText, currentHighlight, notes = [], multi = false, count = 1, onColor, onNote, onEditNote, onAI, onListen, onShare, onClose }: {
  anchorY?: number; reference: string; verseText?: string; currentHighlight?: HighlightColorId | null;
  notes?: ReadonlyArray<{ id: string; text: string; updatedAt?: number; createdAt?: number }>;
  multi?: boolean; count?: number; onColor: (color: HighlightColorId | null) => void; onNote: () => void;
  onEditNote?: (id: string) => void; onAI: () => void; onListen?: () => void; onShare: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), colors = useColors();
  const { height } = useWindowDimensions();
  const sheet = colors.surface, ink = colors.ink, soft = colors.inkSecondary, faint = colors.inkSubtle;
  // On a dark page the one bright button is white; on light paper it's the ink.
  const darkPage = (() => { const h = colors.bg.replace("#", ""); if (h.length < 6) return true; const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); return r * .299 + g * .587 + b * .114 < 128; })();
  const goBg = darkPage ? "#FFFFFF" : ink, goFg = darkPage ? colors.bg : sheet;
  const shown = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) shown.value = withTiming(1, { duration: 360, easing: Easing.bezier(.2, .9, .25, 1) }); }, [reduced, shown]);
  useEffect(() => { const sub = BackHandler.addEventListener("hardwareBackPress", () => { onClose(); return true; }); return () => sub.remove(); }, [onClose]);
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.value) * 360 }] }));
  const drop = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateY: (1 - shown.value) * -40 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));

  const tile = (icon: SFSymbolName, label: string, onPress: () => void, primary = false, row = false) =>
    <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptics.soft(); onPress(); }}
      style={[s.tile, row ? { height: 56, flexDirection: "row", gap: 8 } : { height: 76, gap: 6 }, { backgroundColor: primary ? goBg : `${ink}14` }]}>
      <SFSymbol name={icon} size={row ? 18 : 21} color={primary ? goFg : ink}/>
      <Text style={{ fontSize: 13, lineHeight: 16, fontWeight: "800", color: primary ? goFg : ink }}>{label}</Text>
    </Pressable>;

  const inks = <View style={{ flexDirection: "row", alignItems: "center", gap: 12, justifyContent: multi ? "space-between" : "flex-start" }}>
    {HIGHLIGHT_COLORS.map(color => {
      const on = currentHighlight === color.id;
      return <Pressable key={color.id} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={on ? `Remove ${color.name} highlight` : `${color.name} highlight`}
        onPress={() => { haptics.tick(); onColor(on ? null : color.id); }}
        style={[s.ink, { backgroundColor: color.swatch }, on && { borderWidth: 3, borderColor: sheet, boxShadow: `0 0 0 2px ${darkPage ? "#FFFFFF" : ink}` }]}/>;
    })}
    {!multi && !!currentHighlight && <Pressable accessibilityRole="button" accessibilityLabel="Remove highlight" onPress={() => { haptics.tick(); onColor(null); }} style={{ marginLeft: "auto", minHeight: 40, justifyContent: "center" }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: faint }}>Clear</Text>
    </Pressable>}
  </View>;

  if (multi) return <View pointerEvents="box-none" style={{ position: "absolute", inset: 0, zIndex: 190 }}>
    {/* The range, where the reader's top bar was */}
    <Animated.View style={[s.bar, { top: insets.top + 6, backgroundColor: sheet, borderColor: `${ink}1F` }, drop]}>
      <Text accessibilityRole="header" numberOfLines={1} style={{ fontSize: 16, fontWeight: "900", color: ink, flexShrink: 1 }}>{reference}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: faint, marginLeft: 8 }}>{count} verse{count === 1 ? "" : "s"}</Text>
      <View style={{ flex: 1 }}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Done selecting verses" onPress={onClose} style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: `${ink}14`, justifyContent: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: ink }}>Done</Text>
      </Pressable>
    </Animated.View>
    <Animated.View style={[s.panel, { bottom: Math.max(insets.bottom, 12) + 4, backgroundColor: sheet }, rise]}>
      {inks}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {tile("note.text", "Note", onNote, false, true)}
        {onListen && tile("headphones", "Listen", onListen, false, true)}
        {tile("square.and.arrow.up", "Share", onShare, true, true)}
      </View>
    </Animated.View>
  </View>;

  return <View pointerEvents="box-none" accessibilityViewIsModal style={{ position: "absolute", inset: 0, zIndex: 190 }}>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#00000094" }, scrim]}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss verse tools" onPress={onClose} style={{ flex: 1 }}/></Animated.View>
    <Animated.View style={[s.sheet, { backgroundColor: sheet, paddingBottom: Math.max(insets.bottom, 12) + 6, maxHeight: height - insets.top - 40 }, rise]}>
      <View style={[s.grab, { backgroundColor: `${ink}38` }]}/>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={{ fontSize: 12, lineHeight: 15, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: soft }}>{reference}</Text>
        {!!verseText && <Text style={{ marginTop: 8, fontSize: verseText.length > 220 ? 21 : 25, lineHeight: verseText.length > 220 ? 27 : 31, fontWeight: "900", letterSpacing: -.5, color: ink }}>{verseText}</Text>}
        <View style={{ marginTop: 22 }}>{inks}</View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
          {tile("note.text", "Note", onNote)}
          {tile("sparkles", "Meaning", onAI)}
          {onListen && tile("headphones", "Listen", onListen)}
          {tile("square.and.arrow.up", "Share", onShare, true)}
        </View>
        {notes.map((note, i) => <Pressable key={note.id} accessibilityRole="button" accessibilityLabel={`Edit note ${i + 1}`} onPress={() => onEditNote?.(note.id)}
          style={{ marginTop: i ? 8 : 16, padding: 14, paddingHorizontal: 16, borderRadius: 20, borderCurve: "continuous", backgroundColor: `${ink}0D`, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF5A4E", marginTop: 6 }}/>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 19, fontWeight: "800", color: ink }}>{note.text || `Note ${i + 1}`}</Text>
            <Text style={{ marginTop: 3, fontSize: 12, fontWeight: "700", color: faint }}>Your note{note.updatedAt || note.createdAt ? ` · ${new Date(note.updatedAt ?? note.createdAt!).toLocaleDateString("en-US", { month: "long", day: "numeric" })}` : ""}</Text>
          </View>
        </Pressable>)}
        <ContextualReaderTip id="verse-tools" text="Choose a colour to highlight, or Note to write a thought." color={faint}/>
      </ScrollView>
    </Animated.View>
  </View>;
}

const s = StyleSheet.create({
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderCurve: "continuous", paddingTop: 12, paddingHorizontal: 22, boxShadow: "0 -20px 40px -20px #000000" },
  grab: { width: 38, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  ink: { width: 40, height: 40, borderRadius: 20 },
  tile: { flex: 1, borderRadius: 20, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
  bar: { position: "absolute", left: 16, right: 16, height: 48, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 6 },
  panel: { position: "absolute", left: 12, right: 12, borderRadius: 30, borderCurve: "continuous", padding: 16, boxShadow: "0 20px 40px -18px #000000" },
});
