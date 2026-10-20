import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol } from "@/components/Symbol";
import { mix } from "@/components/HomeDeck";
import { NOTE_COLORS, type PrayerNote } from "@/constants/communityPreview";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { Face, INK_FAINT, INK_SOFT, ToneGround, tone, useMe, personFor } from "./togetherKit";

const makeId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** "What can we pray for?" You type straight into a preview of your card, in your colour. */
export function AskSheet({ onClose, onSave, groupName }: { onClose: () => void; onSave: (n: PrayerNote) => void; groupName?: string }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), me = useMe();
  const [text, setText] = useState(""), [anonymous, setAnonymous] = useState(false), [sent, setSent] = useState<PrayerNote | null>(null);
  const who = anonymous ? personFor("Anonymous") : me, t = tone(who.color);
  const send = () => {
    if (!text.trim()) return;
    const n: PrayerNote = { id: makeId(), author: anonymous ? "Anonymous (you)" : `${me.name} (you)`, text: text.trim(), age: "Now", count: 0, tag: "Request", mine: true, color: NOTE_COLORS[0]! };
    haptics.success(); setSent(n);
  };
  const finish = () => { if (sent) onSave(sent); else onClose(); };
  return <Modal visible presentationStyle={sent ? "fullScreen" : "pageSheet"} animationType={reduced ? "fade" : "slide"} onRequestClose={finish}>
    {sent ? <Sent t={tone(me.color)} onDone={finish} groupName={groupName}/> :
    <View style={{ flex: 1, backgroundColor: "#191514" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ height: 52, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}><Text style={{ fontSize: 16, fontWeight: "700", color: INK_SOFT }}>Cancel</Text></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text accessibilityRole="header" style={{ fontSize: 28, lineHeight: 33, fontWeight: "900", letterSpacing: -.6, color: "#FFFFFF" }}>{groupName ? "Ask the group to pray" : "What can we pray for?"}</Text>
          <View style={{ marginTop: 16, borderRadius: 26, overflow: "hidden", flexDirection: "row", minHeight: 150, backgroundColor: t.mid, boxShadow: "inset 0 1px 0 #FFFFFF1F" }}>
            <View style={{ width: 92, alignItems: "center", paddingTop: 18, backgroundColor: mix(t.c, "#000000", .45) }}><Face person={who} size={60} ring={t.t3}/></View>
            <View style={{ flex: 1, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: t.t1 }}>{who.name}</Text>
              <TextInput autoFocus accessibilityLabel="Your prayer request" value={text} onChangeText={setText} multiline maxLength={240} placeholder="What’s on your heart?" placeholderTextColor={t.t3}
                style={{ marginTop: 6, minHeight: 75, fontSize: 18, lineHeight: 25, fontWeight: "700", color: t.t1, textAlignVertical: "top" }}/>
              <Text style={{ marginTop: 6, fontSize: 12, fontWeight: "700", color: t.t3 }}>{groupName ? `${groupName} sees it like this` : "This is how it looks"}</Text>
            </View>
          </View>
          <View style={{ marginTop: 18, minHeight: 56, borderRadius: 18, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF0A" }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "700", color: "#E8E3E0" }}>Keep my name private</Text><Text style={{ fontSize: 12, fontWeight: "600", color: INK_FAINT }}>Shows as “A friend”</Text></View>
            <Switch accessibilityLabel="Keep my name private" value={anonymous} onValueChange={v => { setAnonymous(v); haptics.tick(); }}/>
          </View>
          <Text style={{ marginTop: 14, fontSize: 13, lineHeight: 18, fontWeight: "600", color: INK_FAINT }}>Community is a preview for now. Your request is saved on this device and isn’t sent to anyone yet.</Text>
        </ScrollView>
        <Pressable feedback="action" accessibilityRole="button" disabled={!text.trim()} onPress={send}
          style={{ marginHorizontal: 20, marginBottom: insets.bottom + 12, height: 56, borderRadius: 28, backgroundColor: "#FFF8F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: text.trim() ? 1 : .4, boxShadow: `0 14px 30px -12px ${t.c}B3` }}>
          <SFSymbol name="paperplane.fill" size={15} color="#2A1206"/><Text style={{ fontSize: 17, fontWeight: "800", color: "#2A1206" }}>Ask for prayer</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>}
  </Modal>;
}

function Sent({ t, onDone, groupName }: { t: ReturnType<typeof tone>; onDone: () => void; groupName?: string }) {
  const insets = useSafeAreaInsets(), me = useMe();
  return <View style={{ flex: 1, backgroundColor: t.deep }}>
    <ToneGround t={t}/>
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }}>
      <View style={{ width: 230, height: 230, borderRadius: 115, alignItems: "center", justifyContent: "center", backgroundColor: `${t.c}1F` }}>
        <View style={{ width: 172, height: 172, borderRadius: 86, alignItems: "center", justifyContent: "center", backgroundColor: `${t.c}33`, borderWidth: 1.5, borderColor: "#FFFFFF47" }}><Face person={me} size={120}/></View>
      </View>
      <Text accessibilityRole="header" style={{ marginTop: 36, fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -.6, color: t.t1, textAlign: "center" }}>{groupName ? `Shared with ${groupName}` : "Your prayer is up"}</Text>
      <Text style={{ marginTop: 8, fontSize: 16, lineHeight: 22, fontWeight: "700", color: t.t2, textAlign: "center" }}>You won’t carry this one alone. Add an update any time.</Text>
    </View>
    <Pressable feedback="action" accessibilityRole="button" onPress={onDone} style={{ alignSelf: "center", marginBottom: insets.bottom + 24, height: 56, paddingHorizontal: 30, borderRadius: 28, backgroundColor: "#FFF8F2", justifyContent: "center" }}>
      <Text style={{ fontSize: 17, fontWeight: "800", color: t.deep }}>{groupName ? "Back to the group" : "Back to Together"}</Text>
    </Pressable>
  </View>;
}
