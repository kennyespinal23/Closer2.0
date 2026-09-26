import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HIGHLIGHT_COLORS, findHighlightColor, type HighlightColorId } from "@/state/annotations";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText } from "@/lib/typography";
import type { NoteEditor } from "./NoteEditor";

/** Reader-only paper composer; existing notes elsewhere keep their original editor. */
export function ReaderStickyNote({ visible, reference, initialNote, initialColor, onSave, onDelete, onCancel }: ComponentProps<typeof NoteEditor>) {
  const [text, setText] = useState(initialNote);
  const [color, setColor] = useState<HighlightColorId>("amber");
  const input = useRef<TextInput>(null), closing = useRef(false);
  const reduced = useReducedMotion(), insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const paper = findHighlightColor(color)!;
  useEffect(() => {
    if (!visible) return;
    closing.current = false; setText(initialNote);
    setColor(findHighlightColor(initialColor as HighlightColorId)?.id ?? "amber");
    progress.value = reduced ? 1 : 0;
    progress.value = reduced ? 1 : withSpring(1, { damping: 16, stiffness: 180, mass: .8 });
    const timer = setTimeout(() => input.current?.focus(), reduced ? 0 : 400);
    return () => clearTimeout(timer);
  }, [visible, initialNote, initialColor, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 3), transform: [{ translateY: -560 * (1 - progress.value) }, { rotate: `${-8 + progress.value * 6.5}deg` }] }));
  const dismiss = (action: () => void) => { if (closing.current) return; closing.current = true; Keyboard.dismiss(); progress.value = withTiming(0, { duration: reduced ? 0 : 320 }, done => { if (done) runOnJS(action)(); }); };
  return <Modal visible={visible} transparent animationType="none" onRequestClose={() => dismiss(onCancel)} statusBarTranslucent>
    <View style={{ flex: 1, backgroundColor: "#00000066" }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel note" onPress={() => dismiss(onCancel)} style={{ position: "absolute", inset: 0 }} />
      <KeyboardAvoidingView pointerEvents="box-none" style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 70, paddingHorizontal: 28, paddingBottom: 24 }}>
          <Animated.View style={[{ maxWidth: 420, width: "100%", alignSelf: "center", backgroundColor: "#FFFBF4", borderRadius: 3, boxShadow: "0 18px 30px #00000055" }, style]}>
            <View style={{ backgroundColor: paper.fill, padding: 20, paddingBottom: 24, gap: 12 }}>
              <View pointerEvents="none" style={{ position: "absolute", top: -8, alignSelf: "center", width: 70, height: 20, backgroundColor: "#FFFFFF99", transform: [{ rotate: "2deg" }] }} />
              <Text accessibilityRole="header" style={{ ...systemText.footnote, fontWeight: "600", color: "#514122" }}>Note on {reference}</Text>
              <View style={{ minHeight: 150 }}>
                <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>{[0, 1, 2, 3, 4].map(i => <View key={i} style={{ position: "absolute", left: 0, right: 0, top: 29 + i * 30, height: 1, backgroundColor: "#785A1430" }} />)}</View>
                <TextInput ref={input} accessibilityLabel={`Your note on ${reference}`} multiline value={text} onChangeText={setText} placeholder="What stood out to you?" placeholderTextColor="#786441" textAlignVertical="top" style={{ minHeight: 150, maxHeight: 210, padding: 0, color: "#2A1F18", fontFamily: "System", fontSize: 18, lineHeight: 30 }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "center" }}>{HIGHLIGHT_COLORS.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.name} note color`} accessibilityState={{ selected: color === c.id }} onPress={() => setColor(c.id)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.swatch, borderColor: "#2A1F18", borderWidth: color === c.id ? 2 : 0 }} /></Pressable>)}</View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {!!initialNote.trim() && <Pressable accessibilityRole="button" onPress={() => dismiss(onDelete)} style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center", marginRight: "auto" }}><Text style={{ ...systemText.footnote, color: "#84331F" }}>Delete</Text></Pressable>}
                <Pressable accessibilityRole="button" onPress={() => dismiss(onCancel)} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#2A1F181A", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: "#2A1F18" }}>Cancel</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={!text.trim()} accessibilityState={{ disabled: !text.trim() }} onPress={() => dismiss(() => onSave(text.trim(), color))} style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#2A1F18", opacity: text.trim() ? 1 : .4, justifyContent: "center" }}><Text style={{ ...systemText.headline, color: "#FFF4D6" }}>Stick it</Text></Pressable>
              </View>
              <View pointerEvents="none" style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderTopLeftRadius: 3, backgroundColor: "#9B7D4455" }} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}
