import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol } from "@/components/Symbol";
import type { PrayerNote } from "@/constants/communityPreview";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { Face, Faces, Glass, HoldToPray, RoundButton, ToneGround, personFor, tone, useMe } from "./togetherKit";

/** One prayer request, as a page in the asker's colour. Their words are the hero; one action: hold to pray. */
export function PrayerPage({ note, prayed, onPray, onClose, onChange, onRemove, group }: {
  note: PrayerNote; prayed: boolean; onPray: () => void; onClose: () => void; onChange: (n: PrayerNote) => void; onRemove: () => void;
  /** When the request lives in a study group: its name, and a verse from the chapter they're reading. */
  group?: { name: string; verse?: { text: string; ref: string } };
}) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), me = useMe();
  const who = note.mine ? me : personFor(note.author), t = tone(who.color);
  const [writing, setWriting] = useState(false), [reply, setReply] = useState("");
  const [update, setUpdate] = useState(note.update ?? ""), [answered, setAnswered] = useState(note.tag === "Answered");
  const count = note.count + Number(prayed);
  const first = who.anonymous ? "them" : who.name;
  const saveReply = () => { if (!reply.trim()) return; onChange({ ...note, encouragements: [...(note.encouragements ?? []), reply.trim()] }); setReply(""); setWriting(false); haptics.soft(); };
  return <Modal visible presentationStyle="fullScreen" animationType={reduced ? "fade" : "slide"} onRequestClose={onClose}>
    <StatusBar style="light"/>
    <View style={{ flex: 1, backgroundColor: t.deep }}>
      <ToneGround t={t}/>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: insets.top + 4 }}>
          <RoundButton icon="chevron.left" label="Back" onPress={onClose}/>
          {note.mine && <RoundButton icon="trash" label="Remove prayer" onPress={() => Alert.alert("Remove prayer?", "This removes your prayer from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: onRemove }])}/>}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 26, paddingTop: 8, paddingBottom: 20 }}>
          {group && <Glass style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, gap: 7, marginBottom: 14 }}><SFSymbol name="book.closed.fill" size={12} color={t.t2}/><Text style={{ fontSize: 13, fontWeight: "800", color: t.t1 }}>{group.name}</Text></Glass>}
          <Face person={who} size={104} ring={mix2(t)}/>
          <Text style={{ marginTop: 12, fontSize: 20, fontWeight: "900", color: t.t1 }}>{note.mine ? "You" : who.name}</Text>
          <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: t.t3 }}>{group ? "Asked the group" : "Asked"} {note.age === "Now" ? "just now" : `${note.age} ago`}</Text>
          {note.tag === "Answered" && <View style={{ marginTop: 12, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#FFFFFF26", justifyContent: "center" }}><Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .6, color: "#FFFFFF" }}>ANSWERED</Text></View>}
          <Text accessibilityRole="header" style={{ marginTop: 22, fontSize: 27, lineHeight: 35, fontWeight: "800", letterSpacing: -.5, color: t.t1, textAlign: "center" }}>“{note.text}”</Text>
          {!!note.update && <Text style={{ marginTop: 12, fontSize: 16, lineHeight: 23, fontWeight: "700", color: t.t2, textAlign: "center" }}>{note.update}</Text>}
          <Glass style={{ marginTop: 18, height: 36, paddingLeft: prayed ? 6 : 14, paddingRight: 14, borderRadius: 18, gap: 8 }}>
            {prayed && <Faces people={[me]} ring={t.deep}/>}
            <Text style={{ fontSize: 13, fontWeight: "800", color: t.t1 }}>{prayed ? (count > 1 ? `You and ${count - 1} others prayed` : "You prayed") : count === 0 ? (note.mine ? "On the prayer wall" : "Be the first to pray") : `${count} ${count === 1 ? "person is" : "people are"} praying`}</Text>
          </Glass>
          <View style={{ flex: 1, minHeight: 24 }}/>
          {group?.verse ? <Card t={t} label="FROM THIS WEEK’S CHAPTER" text={`${group.verse.text} ${group.verse.ref}`}/>
            : !note.mine && <Card t={t} label={prayed ? `${first.toUpperCase()} WILL SEE` : "A PRAYER YOU COULD SAY"} text={prayed ? `${me.name} prayed for you. Nothing else is shared.` : `Lord, be near to ${first} tonight. Hold what they’re carrying, and give them your peace.`}/>}
          {(note.encouragements ?? []).map((r, i) => <View key={i} style={{ alignSelf: "stretch", marginTop: 10, borderRadius: 18, padding: 14, backgroundColor: "#0000003A" }}><Text style={{ fontSize: 12, fontWeight: "800", color: t.t3 }}>YOUR NOTE</Text><Text style={{ marginTop: 4, fontSize: 15, lineHeight: 21, fontWeight: "700", color: t.t1 }}>{r}</Text></View>)}
          {writing && <View style={{ alignSelf: "stretch", marginTop: 10, borderRadius: 18, padding: 6, backgroundColor: "#0000004A", flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
            <TextInput autoFocus accessibilityLabel={`A note for ${first}`} value={reply} onChangeText={setReply} multiline maxLength={500} placeholder={`A note for ${first}`} placeholderTextColor={t.t3} style={{ flex: 1, minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, lineHeight: 22, color: t.t1 }}/>
            <Pressable feedback="action" accessibilityRole="button" accessibilityLabel="Save note" disabled={!reply.trim()} onPress={saveReply} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center", opacity: reply.trim() ? 1 : .4 }}><SFSymbol name="arrow.up" size={16} color={t.deep}/></Pressable>
          </View>}
          {note.mine && <View style={{ alignSelf: "stretch", marginTop: 14, borderRadius: 22, padding: 16, gap: 12, backgroundColor: "#0000003A" }}>
            <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .9, color: t.t3 }}>YOUR UPDATE</Text>
            <TextInput accessibilityLabel="Prayer update" value={update} onChangeText={setUpdate} multiline maxLength={240} placeholder="How is it going?" placeholderTextColor={t.t3} style={{ minHeight: 44, fontSize: 16, lineHeight: 22, color: t.t1 }}/>
            <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: t.t1 }}>Answered</Text><Switch accessibilityLabel="Answered prayer" value={answered} onValueChange={setAnswered}/></View>
            <Pressable feedback="action" accessibilityRole="button" onPress={() => { onChange({ ...note, update: update.trim(), tag: answered ? "Answered" : note.tag === "Answered" ? "Request" : note.tag }); haptics.soft(); onClose(); }} style={{ height: 48, borderRadius: 24, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: t.deep }}>Save update</Text></Pressable>
          </View>}
        </ScrollView>
        {!note.mine && <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 26, paddingBottom: insets.bottom + 14 }}>
          <HoldToPray t={t} done={prayed} onDone={onPray}/>
          <Glass onPress={() => { haptics.soft(); setWriting(w => !w); }} accessibilityLabel={`Send ${first} a note`} style={{ width: 56, height: 56, borderRadius: 28 }}><SFSymbol name="bubble.left" size={20} color={t.t1}/></Glass>
        </View>}
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}

const mix2 = (t: ReturnType<typeof tone>) => t.t3;
function Card({ t, label, text }: { t: ReturnType<typeof tone>; label: string; text: string }) {
  return <View style={{ alignSelf: "stretch", borderRadius: 22, padding: 16, backgroundColor: "#0000003A", boxShadow: "inset 0 1px 0 #FFFFFF1A" }}>
    <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .9, color: t.t3 }}>{label}</Text>
    <Text style={{ marginTop: 6, fontSize: 16, lineHeight: 23, fontWeight: "700", color: t.t2 }}>{text}</Text>
  </View>;
}
