import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Text, TextInput } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { findBookById } from "@/constants/books";
import { paintedCover } from "@/constants/paintedCovers";
import type { StudyGroup } from "@/constants/communityPreview";
import * as haptics from "@/lib/haptics";
import { Face, INK_FAINT, INK_SOFT, ToneGround, tone, useMe } from "./togetherKit";

const templates: { title: string; name: string; book: string; pace: number; icon: SFSymbolName }[] = [
  { title: "A partner", name: "Us two", book: "ruth", pace: 0, icon: "heart" },
  { title: "Family", name: "Our family", book: "genesis", pace: 0, icon: "house" },
  { title: "Friends", name: "Friends in John", book: "john", pace: 1, icon: "person.2" },
  { title: "Small group", name: "Our Bible study", book: "acts", pace: 2, icon: "book" },
];
const books = ["john", "ruth", "psalms", "genesis", "luke", "acts", "proverbs", "philippians", "james"];
const PACES = ["Daily", "3 times a week", "Weekly"], SCHEDULE = ["Reads daily", "Three times a week", "Meets weekly"], PER_WEEK = [7, 3, 1];

/** Start a group: who it's for, one book (the painted covers), how often, with a live preview of the group. */
export function CreateStudyGroup({ onClose, onSave }: { onClose: () => void; onSave: (group: StudyGroup) => void }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), me = useMe();
  const [template, setTemplate] = useState<number | null>(null), [name, setName] = useState(""), [bookId, setBookId] = useState("john"), [pace, setPace] = useState(1), [created, setCreated] = useState(false);
  const group = useRef<StudyGroup | null>(null);
  const book = findBookById(bookId), cover = paintedCover(bookId), t = tone(cover?.color ?? "#5B4A9A");
  const weeks = book ? Math.max(1, Math.ceil(book.chapters / PER_WEEK[pace]!)) : 0;
  const ready = template !== null && !!name.trim();
  const save = () => {
    if (group.current || !ready) return;
    group.current = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), bookId, chapter: 1, schedule: SCHEDULE[pace]!, members: [me.name], mine: true, joined: true, question: `What made you want to read ${book?.name} together?`, replies: [] };
    haptics.success(); setCreated(true);
  };
  const finish = () => { if (group.current) { const value = group.current; group.current = null; onSave(value); } else onClose(); };
  const Chip = ({ on, label, icon, onPress }: { on: boolean; label: string; icon?: SFSymbolName; onPress: () => void }) =>
    <Pressable feedback="action" accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptics.tick(); onPress(); }}
      style={{ flexGrow: 1, flexBasis: icon ? "45%" : undefined, height: icon ? 50 : 38, paddingHorizontal: 14, borderRadius: icon ? 16 : 19, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: on ? "#FFF8F2" : "#FFFFFF0F" }}>
      {icon && <SFSymbol name={icon} size={17} color={on ? "#2A1206" : "#E8E3E0"}/>}<Text style={{ fontSize: icon ? 15 : 14, fontWeight: "800", color: on ? "#2A1206" : "#E8E3E0" }}>{label}</Text>
    </Pressable>;
  const Label = ({ children }: { children: string }) => <Text style={{ marginTop: 22, fontSize: 12, fontWeight: "800", letterSpacing: .9, color: INK_FAINT }}>{children}</Text>;
  return <Modal presentationStyle={created ? "fullScreen" : "pageSheet"} animationType={reduced ? "fade" : "slide"} onRequestClose={finish}>
    {created ? <View style={{ flex: 1, backgroundColor: t.deep }}>
      <ToneGround t={t}/>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
        {cover && <Animated.View entering={reduced ? undefined : FadeInDown.springify().damping(16)} style={{ width: 150, height: 225, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 18, borderBottomRightRadius: 18, overflow: "hidden", transform: [{ rotate: "-4deg" }], boxShadow: "0 30px 50px -20px #000" }}>
          <Image source={cover.source} contentFit="cover" style={StyleSheet.absoluteFill}/><View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: "#00000040" }}/>
        </Animated.View>}
        <Text accessibilityRole="header" style={{ marginTop: 30, fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -.6, color: t.t1, textAlign: "center" }}>{name.trim()}</Text>
        <Text style={{ marginTop: 8, fontSize: 16, lineHeight: 22, fontWeight: "700", color: t.t2, textAlign: "center" }}>{book?.name}, {PACES[pace]!.toLowerCase()}. About {weeks} {weeks === 1 ? "week" : "weeks"}.</Text>
        <Animated.View entering={reduced ? undefined : ZoomIn.delay(180).springify().damping(14)} style={{ marginTop: 22, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Face person={me} size={52} ring={t.t3}/>
          {[0, 1, 2].map(i => <View key={i} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "#FFFFFF40", alignItems: "center", justifyContent: "center" }}><SFSymbol name="plus" size={16} color={t.t3}/></View>)}
        </Animated.View>
        <Text style={{ marginTop: 16, fontSize: 13, lineHeight: 18, fontWeight: "600", color: t.t3, textAlign: "center" }}>Invitations open when Community goes live. For now your group is saved on this device.</Text>
      </View>
      <Pressable feedback="action" accessibilityRole="button" onPress={finish} style={{ marginHorizontal: 26, marginBottom: insets.bottom + 16, height: 56, borderRadius: 28, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: t.deep }}>Open the group</Text>
      </Pressable>
    </View> :
    <View style={{ flex: 1, backgroundColor: "#191514" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ height: 52, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}><Text style={{ fontSize: 16, fontWeight: "700", color: INK_SOFT }}>Cancel</Text></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text accessibilityRole="header" style={{ fontSize: 28, lineHeight: 33, fontWeight: "900", letterSpacing: -.6, color: "#FFFFFF" }}>Start a study group</Text>
          <Label>WHO IT’S FOR</Label>
          <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {templates.map((tp, i) => <Chip key={tp.title} on={template === i} label={tp.title} icon={tp.icon} onPress={() => { setTemplate(i); setName(tp.name); setBookId(tp.book); setPace(tp.pace); }}/>)}
          </View>
          {template !== null && <Animated.View entering={reduced ? undefined : FadeInDown.springify().damping(22)}>
            <Label>ONE BOOK, TOGETHER</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 12 }}>
              {books.map(id => { const b = findBookById(id)!, c = paintedCover(id), on = id === bookId; return <Pressable key={id} accessibilityRole="button" accessibilityLabel={b.name} accessibilityState={{ selected: on }} onPress={() => { setBookId(id); haptics.tick(); }} style={{ alignItems: "center", gap: 7 }}>
                <View style={{ width: 70, height: 104, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 12, borderBottomRightRadius: 12, overflow: "hidden", boxShadow: on ? "0 0 0 3px #191514, 0 0 0 5.5px #FFF8F2" : "0 10px 18px -10px #000" }}>
                  {c && <Image source={c.source} contentFit="cover" style={StyleSheet.absoluteFill}/>}<View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: "#00000040" }}/>
                </View>
                <Text style={{ fontSize: 12, fontWeight: on ? "800" : "700", color: on ? "#FFFFFF" : INK_SOFT }}>{b.name}</Text>
              </Pressable>; })}
            </ScrollView>
            <Label>HOW OFTEN</Label>
            <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>{PACES.map((p, i) => <Chip key={p} on={pace === i} label={p} onPress={() => setPace(i)}/>)}</View>
            <View style={{ marginTop: 18, borderRadius: 24, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: t.mid, boxShadow: "inset 0 1px 0 #FFFFFF1F" }}>
              {cover && <View style={{ width: 46, height: 68, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 9, borderBottomRightRadius: 9, overflow: "hidden" }}><Image source={cover.source} contentFit="cover" style={StyleSheet.absoluteFill}/></View>}
              <View style={{ flex: 1 }}>
                <TextInput accessibilityLabel="Group name" value={name} onChangeText={setName} maxLength={40} placeholder="Group name" placeholderTextColor={t.t3} style={{ fontSize: 17, fontWeight: "800", color: t.t1, paddingVertical: 2 }}/>
                <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: t.t2 }}>{book?.chapters} chapters · {PACES[pace]!.toLowerCase()} · about {weeks} {weeks === 1 ? "week" : "weeks"}</Text>
              </View>
              <SFSymbol name="pencil" size={14} color={t.t3}/>
            </View>
          </Animated.View>}
        </ScrollView>
        <Pressable feedback="action" accessibilityRole="button" disabled={!ready} onPress={save} style={{ marginHorizontal: 20, marginBottom: insets.bottom + 12, height: 56, borderRadius: 28, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center", opacity: ready ? 1 : .4 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#2A1206" }}>Create group</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>}
  </Modal>;
}
