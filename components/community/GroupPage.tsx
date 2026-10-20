import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol } from "@/components/Symbol";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { mix } from "@/components/HomeDeck";
import { findBookById } from "@/constants/books";
import { paintedCover } from "@/constants/paintedCovers";
import type { PrayerNote, StudyGroup } from "@/constants/communityPreview";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { FLOOR, Face, Faces, INK_FAINT, RoundButton, memberFor, personFor, tone, useMe } from "./togetherKit";
import { PrayerPage } from "./PrayerPage";
import { AskSheet } from "./AskSheet";

/** A group's prayers: the legacy single prayer becomes the first note. */
export function groupPrayers(g: StudyGroup): PrayerNote[] {
  const legacy: PrayerNote[] = g.prayer ? [{ id: `${g.id}-prayer`, text: g.prayer.text, author: g.prayer.author, age: "This week", count: 0, tag: "Request", color: "#FFF6B8" }] : [];
  return [...(g.prayers ?? []), ...legacy];
}
const prayedIn = (g: StudyGroup, id: string) => (g.prayedIds ?? []).includes(id) || (id === `${g.id}-prayer` && !!g.prayerPrayed);

/** The group wears its book: the painted cover is its picture, the cover's colour is its colour. */
export function GroupPage({ group, onClose, onRead, onChange }: { group: StudyGroup; onClose: () => void; onRead: () => void; onChange: (g: StudyGroup) => void }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), { height } = useWindowDimensions(), me = useMe();
  const book = findBookById(group.bookId), cover = paintedCover(group.bookId), t = tone(cover?.color ?? "#5B4A9A");
  const [tab, setTab] = useState<"week" | "prayer">("week"), [answer, setAnswer] = useState(""), [open, setOpen] = useState<string | null>(null), [asking, setAsking] = useState(false);
  const members = group.members.map(m => memberFor(m, me));
  const prayers = groupPrayers(group), opened = prayers.find(p => p.id === open);
  const markPrayed = (id: string) => { if (prayedIn(group, id)) return; haptics.soft(); onChange({ ...group, prayedIds: [...(group.prayedIds ?? []), id], ...(id === `${group.id}-prayer` ? { prayerPrayed: true } : {}) }); };
  const save = () => { if (!answer.trim()) return; onChange({ ...group, replies: [...group.replies, { author: "You", text: answer.trim() }] }); setAnswer(""); haptics.soft(); };
  const heroH = Math.min(420, height * .46);
  return <Modal visible presentationStyle="fullScreen" animationType={reduced ? "fade" : "slide"} onRequestClose={onClose}>
    <StatusBar style="light"/>
    <View style={{ flex: 1, backgroundColor: FLOOR }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
          <View style={{ height: heroH }}>
            {cover && <Image source={cover.source} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill}/>}
            <ReaderMaterialGradient pointerEvents="none" colors={["#00000066", "#00000000", `${t.deep}C0`, FLOOR]} locations={[0, .28, .62, 1]} style={StyleSheet.absoluteFill}/>
            <View style={{ position: "absolute", left: 22, right: 22, bottom: 18, flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
              {cover && <View style={{ width: 92, height: 138, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, borderTopRightRadius: 14, borderBottomRightRadius: 14, overflow: "hidden", boxShadow: "0 14px 24px -12px #000" }}><Image source={cover.source} contentFit="cover" style={StyleSheet.absoluteFill}/><View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: "#00000040" }}/></View>}
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" numberOfLines={2} style={{ fontSize: 28, lineHeight: 32, fontWeight: "900", letterSpacing: -.5, color: t.t1 }}>{group.name}</Text>
                <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 19, fontWeight: "700", color: t.t2 }}>{book?.name} {group.chapter} of {book?.chapters} · {group.schedule}</Text>
                <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}><Faces people={members.slice(0, 4)} ring={t.deep}/><Text style={{ fontSize: 13, fontWeight: "800", color: t.t2 }}>{members.length} reading</Text></View>
              </View>
            </View>
          </View>
          <View style={{ marginHorizontal: 16, marginTop: 6, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF12", flexDirection: "row", padding: 3 }}>
            {(["week", "prayer"] as const).map(k => <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => { setTab(k); haptics.tick(); }}
              style={{ flex: 1, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: tab === k ? t.mid : "transparent" }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: tab === k ? t.t1 : "#A8A09C" }}>{k === "week" ? "This week" : `Prayer${prayers.length ? ` · ${prayers.length}` : ""}`}</Text>
            </Pressable>)}
          </View>
          {tab === "week" ? <>
            <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Read ${book?.name} ${group.chapter}`} onPress={() => { haptics.soft(); onRead(); }}
              style={{ marginHorizontal: 16, marginTop: 14, borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: t.mid, boxShadow: "inset 0 1px 0 #FFFFFF1F" }}>
              <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .9, color: t.t3 }}>THIS WEEK</Text><Text style={{ marginTop: 3, fontSize: 18, lineHeight: 22, fontWeight: "800", color: t.t1 }}>{book?.name} {group.chapter}</Text></View>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center" }}><SFSymbol name="arrow.right" size={18} color={t.deep}/></View>
            </Pressable>
            <View style={{ marginHorizontal: 22, marginTop: 22 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .9, color: INK_FAINT }}>THIS WEEK’S QUESTION</Text>
              <Text style={{ marginTop: 6, fontSize: 21, lineHeight: 27, fontWeight: "800", letterSpacing: -.3, color: "#F4EFEC" }}>{group.question}</Text>
            </View>
            {group.replies.map((r, i) => { const p = r.author === "You" ? me : personFor(r.author), pt = tone(p.color); return <View key={i} style={{ marginHorizontal: 16, marginTop: 10, borderRadius: 20, padding: 14, flexDirection: "row", gap: 12, backgroundColor: mix(p.color, "#000000", .55) }}>
              <Face person={p} size={34} ring={pt.t3}/><View style={{ flex: 1 }}><Text style={{ fontSize: 14, fontWeight: "800", color: pt.t1 }}>{r.author}</Text><Text style={{ marginTop: 2, fontSize: 15, lineHeight: 21, fontWeight: "700", color: pt.t2 }}>{r.text}</Text></View>
            </View>; })}
          </> : <>
            <Pressable feedback="action" accessibilityRole="button" onPress={() => { haptics.soft(); setAsking(true); }}
              style={{ marginHorizontal: 16, marginTop: 14, height: 58, borderRadius: 20, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: t.mid, boxShadow: "inset 0 1px 0 #FFFFFF1F" }}>
              <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: mix(t.c, "#FFFFFF", .6), alignItems: "center", justifyContent: "center" }}><SFSymbol name="heart.fill" size={15} color={t.deep}/></View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: t.t1 }}>Ask the group to pray</Text>
            </Pressable>
            {prayers.map(n => { const p = n.mine ? me : personFor(n.author), pt = tone(p.color), done = prayedIn(group, n.id); return <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={`Prayer from ${p.name}. ${n.text}`} onPress={() => setOpen(n.id)}
              style={{ marginHorizontal: 16, marginTop: 10, borderRadius: 24, padding: 16, backgroundColor: mix(p.color, "#000000", .5), boxShadow: "inset 0 1px 0 #FFFFFF1A" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Face person={p} size={34} ring={pt.t3}/><Text style={{ fontSize: 14, fontWeight: "800", color: pt.t1, flex: 1 }}>{n.mine ? "You" : p.name}</Text><Text style={{ fontSize: 12, fontWeight: "700", color: pt.t3 }}>{n.age}</Text></View>
              {n.tag === "Answered" && <View style={{ alignSelf: "flex-start", marginTop: 10, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#FFFFFF26", justifyContent: "center" }}><Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .6, color: "#FFFFFF" }}>ANSWERED</Text></View>}
              <Text style={{ marginTop: 10, fontSize: 18, lineHeight: 25, fontWeight: "800", color: pt.t1 }}>{n.text}</Text>
              {!!n.update && <Text style={{ marginTop: 6, fontSize: 15, lineHeight: 21, fontWeight: "700", color: pt.t2 }}>{n.update}</Text>}
              {!n.mine && <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                <Pressable feedback="action" accessibilityRole="button" accessibilityState={{ selected: done }} onPress={() => markPrayed(n.id)} hitSlop={6}
                  style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: "center", backgroundColor: done ? "#FFFFFF26" : "#FFF8F2" }}><Text style={{ fontSize: 13, fontWeight: "800", color: done ? "#FFFFFF" : mix(p.color, "#000000", .5) }}>{done ? "Prayed" : "Pray"}</Text></Pressable>
              </View>}
            </Pressable>; })}
            {!prayers.length && <Text style={{ marginHorizontal: 22, marginTop: 18, fontSize: 15, lineHeight: 21, fontWeight: "600", color: INK_FAINT }}>Nothing yet. When someone asks, it shows up here for the whole group.</Text>}
          </>}
          <Pressable accessibilityRole="button" onPress={() => { haptics.soft(); onChange({ ...group, joined: !group.joined }); }} style={{ alignSelf: "center", marginTop: 26, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: group.joined ? INK_FAINT : t.t2 }}>{group.joined ? "Leave group" : "Join this group"}</Text>
          </Pressable>
          <Text style={{ marginHorizontal: 22, marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "600", color: "#6E6764", textAlign: "center" }}>Local preview. Invitations and live discussion aren’t available yet.</Text>
        </ScrollView>
        {tab === "week" && group.joined && <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 8, minHeight: 52, borderRadius: 26, paddingLeft: 18, paddingRight: 6, flexDirection: "row", alignItems: "flex-end", backgroundColor: "#24201F", boxShadow: "inset 0 1px 0 #FFFFFF14, 0 10px 24px -10px #000" }}>
          <TextInput accessibilityLabel="Your answer" value={answer} onChangeText={setAnswer} multiline maxLength={500} placeholder="Add your answer" placeholderTextColor="#A8A09C" style={{ flex: 1, minHeight: 52, paddingVertical: 15, fontSize: 15, lineHeight: 21, color: "#F4EFEC" }}/>
          <Pressable feedback="action" accessibilityRole="button" accessibilityLabel="Share answer" disabled={!answer.trim()} onPress={save} style={{ width: 40, height: 40, marginBottom: 6, borderRadius: 20, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center", opacity: answer.trim() ? 1 : .4 }}><SFSymbol name="paperplane.fill" size={15} color="#2A1206"/></Pressable>
        </View>}
        <View style={{ position: "absolute", left: 16, right: 16, top: insets.top + 4, flexDirection: "row", justifyContent: "space-between" }} pointerEvents="box-none">
          <RoundButton icon="chevron.left" label="Back" onPress={onClose}/>
        </View>
      </KeyboardAvoidingView>
    </View>
    {opened && <PrayerPage note={opened} prayed={prayedIn(group, opened.id)} onPray={() => markPrayed(opened.id)} onClose={() => setOpen(null)} group={{ name: group.name }}
      onChange={n => onChange({ ...group, prayers: (group.prayers ?? []).some(p => p.id === n.id) ? (group.prayers ?? []).map(p => p.id === n.id ? n : p) : group.prayers })}
      onRemove={() => { onChange({ ...group, prayers: (group.prayers ?? []).filter(p => p.id !== opened.id) }); setOpen(null); }}/>}
    {asking && <AskSheet groupName={group.name} onClose={() => setAsking(false)} onSave={n => { onChange({ ...group, prayers: [n, ...(group.prayers ?? [])] }); setAsking(false); setTab("prayer"); }}/>}
  </Modal>;
}
