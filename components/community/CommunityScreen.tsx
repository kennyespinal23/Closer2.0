import { buttonStyles } from "@/lib/buttonStyles";
import { CloseButton } from "@/components/CloseButton";
import { sheetText } from "@/lib/sheetStyles";
import { tabContentClearance } from "@/lib/tabContentClearance";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { useTabContentFade } from '@/lib/useTabContentFade';
import { CreateStudyGroup as CreateGroup } from "./CreateStudyGroup";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, View, useWindowDimensions } from "react-native";
import { Text, TextInput } from "@/components/CloserText";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "react-native-bottom-tabs";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Animated, { Easing, FadeInDown, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { COMMUNITY_PREVIEW, COMMUNITY_TUTORIAL, GROUP_TUTORIAL, NOTE_COLORS, type CommunityPreviewState, type PrayerNote, type StudyGroup } from "@/constants/communityPreview";
import { BOOKS, findBookById } from "@/constants/books";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useOnboarding } from "@/state/onboarding";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { STORAGE_KEYS, usePersistence } from "@/lib/storage";
import { systemText } from "@/lib/typography";
import { SkyGradient } from "@/components/HomeSkyGradient";
import { LibraryBookCover } from "@/components/LibraryBookcase";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";

const INK = "#2A1F18", MUTED = "#6F5E50", CORAL = "#FF5A36";
const FACES = ["#FFB7A3", "#A9D8FB", "#F3D38A", "#B8DCCB", "#E9C2D8"];
const makeId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
type NoteFrame = { x: number; y: number; width: number; height: number };

export function CommunityScreen() {
  const colors = useColors(), scheme = useResolvedScheme(), insets = useSafeAreaInsets();
  const tabHeight = useBottomTabBarHeight(), reduced = useReducedMotion();
  const focusSpacing = useFocusMiniPlayerSpacing();
  const tabContentStyle = useTabContentFade(reduced);
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = answers.name?.trim().split(/\s+/)[0] || "You";
  const [state, setState] = useState<CommunityPreviewState>(COMMUNITY_PREVIEW);
  const hydrated = usePersistence(STORAGE_KEYS.communityPreview, state, loaded => {
    if (Array.isArray(loaded.notes) && Array.isArray(loaded.groups) && Array.isArray(loaded.prayed)) setState(loaded);
  });
  const [mode, setMode] = useState(0), [yours, setYours] = useState(false);
  const [composer, setComposer] = useState(false), [creatingGroup, setCreatingGroup] = useState(false);
  const [selected, setSelected] = useState<{ id: string; source: NoteFrame } | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupVisible, setGroupVisible] = useState(false);
  const [tutorial, setTutorial] = useState<number | null>(null);
  const tutorialChecked = useRef(false);
  const { tutorial: replayKind, replay } = useLocalSearchParams<{ tutorial?: string; replay?: string }>();
  useEffect(() => { if (!hydrated || !replay || !replayKind) return; setMode(replayKind === "groups" ? 1 : 0); setTutorial(0); }, [hydrated, replay, replayKind]);
  const pendingReading = useRef<{ bookId: string; chapter: number } | null>(null);
  useEffect(() => {
    if (!hydrated || tutorialChecked.current) return;
    tutorialChecked.current = true;
    if (!state.tutorialSeen) setTutorial(0);
  }, [hydrated, state.tutorialSeen]);
  const tutorialItems = mode === 1 ? GROUP_TUTORIAL : COMMUNITY_TUTORIAL;
  useEffect(() => { if (hydrated && mode === 1 && !state.groupTutorialSeen) setTutorial(0); }, [hydrated, mode]);
  const finishTutorial = () => { setTutorial(null); setState(s => ({ ...s, ...(mode === 1 ? { groupTutorialSeen: true } : { tutorialSeen: true }) })); };
  const pray = (id: string) => {
    setState(s => s.prayed.includes(id) ? s : { ...s, prayed: [...s.prayed, id] });
    haptics.soft();
  };
  const updateNote = (note: PrayerNote) => setState(s => ({ ...s, notes: s.notes.map(n => n.id === note.id ? note : n) }));
  const updateGroup = (group: StudyGroup) => setState(s => ({ ...s, groups: s.groups.map(g => g.id === group.id ? group : g) }));
  const selectedNote = state.notes.find(n => n.id === selected?.id);
  const selectedGroup = state.groups.find(g => g.id === groupId);
  const bottom = tabContentClearance(tabHeight, insets.bottom, focusSpacing);
  const wall = (notes: PrayerNote[]) => <PrayerWall notes={notes} prayed={state.prayed} onPray={pray} onOpen={(id, source) => setSelected({ id, source })} />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
    <SkyGradient />
    <Animated.ScrollView style={tabContentStyle} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: bottom, gap: 20 }}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 6 }}><Text accessibilityRole="header" style={[systemText.largeTitle, { color: colors.ink }]}>Community</Text><Text style={[systemText.subheadline, { color: colors.textSecondary }]}>You don’t have to pray alone.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="How Community works" onPress={() => setTutorial(0)} style={[styles.circle, { backgroundColor: colors.surface }]}><SFSymbol name="questionmark" size={20} color={colors.ink} /></Pressable>
      </View>
      <Text style={[systemText.caption1, { color: colors.textSecondary }]}>Local preview · sample community · saved on this device</Text>
      <SegmentedControl appearance={scheme} values={["Prayer wall", "Study groups"]} selectedIndex={mode} onChange={e => { setMode(e.nativeEvent.selectedSegmentIndex); haptics.tick(); }} style={{ height: 40 }} />
      {mode === 0 ? <>
        <Pressable accessibilityRole="button" onPress={() => setComposer(true)} disabled={!hydrated} style={[styles.ask, !hydrated && { opacity: .5 }]}><View style={styles.noteIcon}><SFSymbol name="plus" size={24} color={CORAL} /></View><View style={{ flex: 1, gap: 4 }}><Text style={[systemText.headline, { color: INK }]}>Ask for prayer</Text><Text style={[systemText.footnote, { color: INK }]}>Stick a note on the wall. Anonymous if you like.</Text></View></Pressable>
        <View style={[styles.row, { gap: 7 }]}><SFSymbol name="lock" size={14} color={colors.textSecondary} /><Text style={[systemText.caption1, { color: colors.textSecondary, flex: 1 }]}>First names only, or keep your note anonymous.</Text></View>
        <View accessibilityRole="tablist" style={[styles.row, { gap: 8 }]}>{["Everyone", "Yours"].map((label, i) => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: yours === Boolean(i) }} onPress={() => setYours(Boolean(i))} style={[styles.filter, { backgroundColor: yours === Boolean(i) ? colors.ink : colors.surface }]}><Text style={[systemText.subheadline, { fontWeight: "600", color: yours === Boolean(i) ? colors.bg : colors.ink }]}>{label}</Text></Pressable>)}</View>
        {yours ? <>
          <SectionLabel title="Your notes" />
          {state.notes.some(n => n.mine) ? wall(state.notes.filter(n => n.mine)) : <EmptyPaper text="There’s room for your first note." action="Ask for prayer" onPress={() => setComposer(true)} />}
          <SectionLabel title="You’re praying for" />
          {state.notes.some(n => !n.mine && state.prayed.includes(n.id)) ? wall(state.notes.filter(n => !n.mine && state.prayed.includes(n.id))) : <EmptyPaper text="The notes you pray for will be kept here." action="See the wall" onPress={() => setYours(false)} />}
        </> : wall(state.notes)}
      </> : <>
        {state.groups.map(group => <GroupCard key={group.id} group={group} onPress={() => { setGroupId(group.id); setGroupVisible(true); }} />)}
        <Pressable accessibilityRole="button" onPress={() => setCreatingGroup(true)} style={[styles.newGroup, { borderColor: colors.textSecondary }]}><Text style={[{ color: colors.ink }, buttonStyles.textLabel]}>+ Start a group with friends</Text></Pressable>
      </>}
    </Animated.ScrollView>
    {composer && <PrayerComposer name={firstName} onClose={() => setComposer(false)} onSave={note => { setState(s => ({ ...s, notes: [note, ...s.notes] })); setComposer(false); setYours(true); haptics.soft(); }} />}
    {selected && selectedNote && <NoteDetail key={selected.id} note={selectedNote} source={selected.source} prayed={state.prayed.includes(selected.id)} onPray={() => pray(selected.id)} onChange={updateNote} onClose={() => setSelected(null)} onRemove={() => { setState(s => ({ ...s, notes: s.notes.filter(n => n.id !== selected.id), prayed: s.prayed.filter(id => id !== selected.id) })); setSelected(null); }} />}
    {selectedGroup && <GroupDetail visible={groupVisible} group={selectedGroup} onChange={updateGroup} onClose={() => setGroupVisible(false)} onRead={() => { pendingReading.current = { bookId: selectedGroup.bookId, chapter: selectedGroup.chapter }; setGroupVisible(false); }} onDismiss={() => { setGroupId(null); const target = pendingReading.current; pendingReading.current = null; if (target) router.push(`/book/${target.bookId}/${target.chapter}`); }} />}
    {creatingGroup && <CreateGroup onClose={() => setCreatingGroup(false)} onSave={group => { setState(s => ({ ...s, groups: [group, ...s.groups] })); setCreatingGroup(false); }} />}
    {tutorial !== null && <Modal transparent animationType={reduced ? "none" : "fade"} onRequestClose={finishTutorial}><View style={styles.centered}><View style={styles.scrim} /><Animated.View key={tutorial} entering={reduced ? undefined : FadeInDown.springify().damping(18)} style={[styles.tutorial, { transform: [{ rotate: "-1deg" }] }]}><View style={styles.tape} /><Text style={[systemText.caption1, { color: MUTED }]}>{tutorial === 0 ? "WELCOME" : `${tutorial} OF ${tutorialItems.length - 1}`}</Text><Text accessibilityRole="header" style={[systemText.title2, { color: INK, marginTop: 10 }]}>{tutorialItems[tutorial].title}</Text><Text style={[systemText.body, { color: INK, marginTop: 12 }]}>{tutorialItems[tutorial].text}</Text><View style={[styles.row, { marginTop: 24, gap: 8 }]}><View style={[styles.row, { flex: 1, gap: 5 }]}>{tutorialItems.map((_, i) => <View key={i} style={{ width: i === tutorial ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === tutorial ? CORAL : "#2A1F1833" }} />)}</View><Pressable onPress={finishTutorial} accessibilityRole="button" style={styles.textButton}><Text style={[{ color: MUTED }, buttonStyles.textLabel]}>Skip</Text></Pressable><Pressable accessibilityRole="button" style={styles.darkButton} onPress={() => tutorial === tutorialItems.length - 1 ? finishTutorial() : setTutorial(tutorial + 1)}><Text style={[{ color: "#FFF6B8" }, buttonStyles.label]}>{tutorial === 0 ? "Show me" : tutorial === tutorialItems.length - 1 ? "Got it" : "Next"}</Text></Pressable></View></Animated.View></View></Modal>}
  </SafeAreaView>;
}

function SectionLabel({ title }: { title: string }) { const colors = useColors(); return <Text accessibilityRole="header" style={[systemText.title2, { color: colors.ink }]}>{title}</Text>; }
function EmptyPaper({ text, action, onPress }: { text: string; action: string; onPress: () => void }) { const colors = useColors(); return <View style={{ padding: 20, gap: 12, backgroundColor: colors.surface, borderRadius: 18 }}><Text style={[systemText.body, { color: colors.textSecondary }]}>{text}</Text><Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[{ color: colors.ink }, buttonStyles.compactLabel]}>{action}</Text></Pressable></View>; }

function PrayerWall({ notes, prayed, onPray, onOpen }: { notes: PrayerNote[]; prayed: string[]; onPray: (id: string) => void; onOpen: (id: string, frame: NoteFrame) => void }) {
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 370 || fontScale > 1.3 ? 1 : 2;
  return <View style={{ flexDirection: "row", gap: 14, paddingTop: 8 }}>{Array.from({ length: columns }, (_, column) => <View key={column} style={{ flex: 1, gap: 22 }}>{notes.filter((_, i) => i % columns === column).map(note => <PrayerCard key={note.id} note={note} index={notes.indexOf(note)} prayed={prayed.includes(note.id)} onPray={() => onPray(note.id)} onOpen={frame => onOpen(note.id, frame)} />)}</View>)}</View>;
}
function PrayerCard({ note, index, prayed, onPray, onOpen }: { note: PrayerNote; index: number; prayed: boolean; onPray: () => void; onOpen: (frame: NoteFrame) => void }) {
  const ref = useRef<View>(null), reduced = useReducedMotion();
  const lift = useSharedValue(0), glow = useSharedValue(0);
  const rotation = ((index * 7) % 5 - 2) * .7;
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation * (1 - lift.value)}deg` }, { translateY: -6 * lift.value }, { scale: 1 + .02 * lift.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const pressPray = () => { if (!reduced) { lift.value = withSequence(withSpring(1, { damping: 18 }), withTiming(0, { duration: 350 })); glow.value = withSequence(withTiming(.28, { duration: 160 }), withTiming(0, { duration: 700 })); } onPray(); };
  return <Animated.View ref={ref} collapsable={false} entering={reduced ? undefined : FadeInDown.duration(300)} style={[styles.paper, { backgroundColor: note.color }, cardStyle]}>
    <View style={styles.pin} /><Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFB43B" }, glowStyle]} />
    <Pressable accessibilityRole="button" accessibilityLabel={`Open note from ${note.author}: ${note.text}`} onPress={() => ref.current?.measureInWindow((x, y, width, height) => onOpen({ x, y, width, height }))}>
      <NoteTag note={note} /><Text style={[systemText.callout, { color: INK, marginTop: 10 }]}>{note.text}</Text>
      {note.update && <Text style={[systemText.footnote, styles.update]}>Update: {note.update}</Text>}
      <View style={[styles.row, { justifyContent: "space-between", marginTop: 14, gap: 4 }]}><Text style={[systemText.caption1, { color: MUTED, flex: 1 }]}>{note.author}</Text><Text style={[systemText.caption2, { color: MUTED }]}>{note.age}</Text></View>
    </Pressable>
    {note.mine ? <Text style={[systemText.caption1, { color: MUTED, marginTop: 12 }]}>Your note · local preview</Text> : <Pressable accessibilityRole="button" accessibilityLabel={`${prayed ? "Praying" : "I'll pray"}, ${note.count + Number(prayed)} sample prayers`} accessibilityState={{ selected: prayed }} onPress={pressPray} style={[styles.pray, { backgroundColor: prayed ? INK : "#FFFFFFAA" }]}><SFSymbol name={prayed ? "flame.fill" : "hands.sparkles"} size={18} color={prayed ? "#FFD36B" : INK} /><Text style={[systemText.caption1, { fontWeight: "600", flex: 1, color: prayed ? "#FFF6B8" : INK }]}>{prayed ? "Praying" : note.tag === "Praise" ? "Thank God" : "I’ll pray"}</Text><Text style={[systemText.caption1, { color: prayed ? "#FFD36B" : MUTED }]}>{note.count + Number(prayed)}</Text></Pressable>}
  </Animated.View>;
}
function NoteTag({ note }: { note: PrayerNote }) { return <Text style={[systemText.caption2, { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, fontWeight: "700", color: note.tag === "Answered" ? "#235E91" : MUTED, backgroundColor: "#FFFFFF66" }]}>{note.tag === "Praise" ? "Thankful" : note.tag}</Text>; }

function Sheet({ title, onClose, children, onDismiss, visible = true }: { visible?: boolean; title: string; onClose: () => void; children: ReactNode; onDismiss?: () => void }) {
  const colors = useColors(), reduced = useReducedMotion();
  return <Modal visible={visible} presentationStyle="pageSheet" animationType={reduced ? "none" : "slide"} onRequestClose={onClose} onDismiss={onDismiss}><SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}><SkyGradient /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={[styles.row, { padding: 20, gap: 12 }]}><Text accessibilityRole="header" style={[sheetText.title, { color: colors.ink, flex: 1 }]}>{title}</Text><CloseButton accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={onClose} style={[styles.circle, { backgroundColor: colors.surface }]} color={colors.ink} /></View><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 20 }}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.ask, { justifyContent: "center", opacity: disabled ? .4 : 1 }]}><Text style={[{ color: INK }, buttonStyles.label]}>{label}</Text></Pressable>; }
function PrayerComposer({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (note: PrayerNote) => void }) {
  const colors = useColors(), scheme = useResolvedScheme();
  const [text, setText] = useState(""), [kind, setKind] = useState(0), [anonymous, setAnonymous] = useState(true);
  return <Sheet title="Ask for prayer" onClose={onClose}><View style={[styles.paper, { backgroundColor: NOTE_COLORS[0], paddingTop: 24 }]}><View style={styles.tape} /><TextInput accessibilityLabel="Your prayer request" multiline maxLength={240} placeholder="What would you like people to pray for?" placeholderTextColor={MUTED} value={text} onChangeText={setText} style={[systemText.body, { minHeight: 140, color: INK, textAlignVertical: "top" }]} /><Text style={[systemText.caption1, { color: MUTED, textAlign: "right" }]}>{text.length}/240</Text></View><SegmentedControl appearance={scheme} values={["Prayer request", "Thankful"]} selectedIndex={kind} onChange={e => setKind(e.nativeEvent.selectedSegmentIndex)} style={{ height: 40 }} /><View style={styles.row}><View style={{ flex: 1, gap: 4 }}><Text style={[systemText.headline, { color: colors.ink }]}>Post as Anonymous</Text><Text style={[systemText.footnote, { color: colors.textSecondary }]}>Only your note shows, not your name.</Text></View><Switch accessibilityLabel="Post as Anonymous" value={anonymous} onValueChange={setAnonymous} /></View><PrimaryButton label="Stick it on the wall" disabled={!text.trim()} onPress={() => onSave({ id: makeId(), text: text.trim(), author: anonymous ? "Anonymous (you)" : `${name} (you)`, tag: kind ? "Praise" : "Request", age: "now", count: 0, mine: true, color: kind ? NOTE_COLORS[1] : NOTE_COLORS[0] })} /><Text style={[systemText.footnote, { color: colors.textSecondary, textAlign: "center" }]}>Local preview. Your note is saved on this device and is not posted publicly.</Text></Sheet>;
}

function NoteDetail({ note, source, prayed, onPray, onChange, onClose, onRemove }: { note: PrayerNote; source: NoteFrame; prayed: boolean; onPray: () => void; onChange: (note: PrayerNote) => void; onClose: () => void; onRemove: () => void }) {
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets(), reduced = useReducedMotion();
  const [update, setUpdate] = useState(note.update || ""), [answered, setAnswered] = useState(note.tag === "Answered");
  const entrance = useSharedValue(reduced ? 1 : 0);
  const closing = useRef(false);
  const w = Math.min(390, width - 32), top = Math.max(insets.top + 16, height * .14);
  const animation = useAnimatedStyle(() => ({ opacity: entrance.value, transform: [{ translateX: (source.x + source.width / 2 - width / 2) * (1 - entrance.value) }, { translateY: (source.y - top) * (1 - entrance.value) }, { scale: source.width / w + (1 - source.width / w) * entrance.value }, { rotate: `${-2 * (1 - entrance.value)}deg` }] }));
  const finish = () => onClose();
  const close = () => { if (closing.current) return; closing.current = true; if (reduced) return finish(); entrance.value = withTiming(0, { duration: 240, easing: Easing.inOut(Easing.quad) }, done => { if (done) runOnJS(finish)(); }); };
  return <Modal transparent animationType="none" onShow={() => { entrance.value = reduced ? 1 : withSpring(1, { damping: 22, stiffness: 240 }); }} onRequestClose={close}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Pressable accessibilityRole="button" accessibilityLabel="Put note back on wall" onPress={close} style={styles.scrim} /><Animated.View style={[{ width: w, alignSelf: "center", marginTop: top, maxHeight: height - top - insets.bottom - 24, backgroundColor: note.color, borderRadius: 5, padding: 22, boxShadow: "0px 20px 50px #00000066" }, animation]}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4 }}><View style={styles.row}><View style={{ flex: 1 }}><NoteTag note={note} /></View><CloseButton accessibilityRole="button" accessibilityLabel="Put note back on wall" style={[styles.circle, { backgroundColor: "#2A1F1811" }]} onPress={close} color={INK} /></View><Text style={[systemText.title3, { color: INK, lineHeight: 29 }]}>{note.text}</Text><Text style={[systemText.footnote, { color: MUTED }]}>{note.author} · {note.age}</Text>
      {!note.mine && <><View style={[styles.row, { backgroundColor: "#FFFFFF77", padding: 14, borderRadius: 14, gap: 10 }]}><SFSymbol name="flame.fill" size={25} color="#C96A16" /><Text style={[systemText.subheadline, { color: INK, flex: 1 }]}>{note.count + Number(prayed)} sample prayers{prayed ? " · including yours" : ""}</Text></View>{note.update && <Text style={[systemText.body, styles.update]}>Update: {note.update}</Text>}<View style={{ backgroundColor: "#FFFFFF88", borderRadius: 14, borderTopLeftRadius: 4, padding: 16, gap: 8 }}><Text style={[systemText.caption1, { color: MUTED }]}>Pray it, or use your own words</Text><Text style={[systemText.body, { color: INK }]}>God, you know exactly what they need. Meet them right there, and let them feel you close. In Jesus’ name, Amen.</Text></View><HoldToPray prayed={prayed} onPray={onPray} /><Text style={[systemText.caption1, { color: MUTED }]}>Leave a little encouragement</Text><View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>{["You’re not alone", "Praying with you", "God is near"].map(word => { const sent = note.encouragements?.includes(word); return <Pressable key={word} accessibilityRole="button" accessibilityState={{ selected: sent }} onPress={() => { if (!sent) { onChange({ ...note, encouragements: [...(note.encouragements || []), word] }); haptics.soft(); } }} style={[styles.filter, { backgroundColor: sent ? INK : "#FFFFFFAA" }]}><Text style={[{ color: sent ? "#FFF6B8" : INK }, buttonStyles.compactLabel]}>{sent ? "✓ " : ""}{word}</Text></Pressable>; })}</View></>}
      {note.mine && <><Text style={[systemText.headline, { color: INK }]}>Add an update</Text><TextInput accessibilityLabel="Prayer update" placeholder="What’s changed?" placeholderTextColor={MUTED} value={update} onChangeText={setUpdate} maxLength={240} multiline style={[systemText.body, { backgroundColor: "#FFFFFF88", borderRadius: 12, padding: 14, minHeight: 100, color: INK }]} /><View style={styles.row}><Text style={[systemText.subheadline, { flex: 1, color: INK }]}>This prayer was answered</Text><Switch accessibilityLabel="This prayer was answered" value={answered} onValueChange={setAnswered} /></View><PrimaryButton label="Save update" onPress={() => { onChange({ ...note, update: update.trim(), tag: answered ? "Answered" : note.tag === "Answered" ? "Request" : note.tag }); close(); }} /><Pressable accessibilityRole="button" onPress={() => Alert.alert("Remove this note?", "This removes your local preview note.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: onRemove }])} style={styles.textButton}><Text style={[{ color: "#AD301D" }, buttonStyles.textLabel]}>Take this note down</Text></Pressable></>}
      <Text style={[systemText.caption1, { color: MUTED }]}>Local preview · no notifications or messages are sent.</Text>
    </ScrollView></Animated.View></KeyboardAvoidingView></Modal>;
}
function HoldToPray({ prayed, onPray }: { prayed: boolean; onPray: () => void }) {
  const reduced = useReducedMotion(), progress = useSharedValue(0), lantern = useSharedValue(0);
  const done = useRef(false);
  const [celebrating, setCelebrating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimation(progress); cancelAnimation(lantern); }, []);
  const complete = () => { done.current = true; onPray(); setCelebrating(true); lantern.value = 0; lantern.value = reduced ? 0 : withTiming(1, { duration: 1000 }); clearTimeout(timer.current); timer.current = setTimeout(() => setCelebrating(false), 1300); };
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const float = useAnimatedStyle(() => ({ opacity: (1 - lantern.value) * .95, transform: [{ translateY: -130 * lantern.value }, { translateX: Math.sin(lantern.value * Math.PI) * 20 }, { scale: 1 - .25 * lantern.value }] }));
  return <View><Pressable accessibilityRole="button" accessibilityLabel={prayed ? "Pray again" : "Hold to pray"} accessibilityHint="Hold for one second to light a candle. Double tap with VoiceOver." onAccessibilityTap={complete} onPressIn={() => { done.current = false; progress.value = 0; progress.value = withTiming(1, { duration: reduced ? 0 : 1050, easing: Easing.linear }, finished => { if (finished) runOnJS(complete)(); }); }} onPressOut={() => { if (!done.current) { cancelAnimation(progress); progress.value = withTiming(0, { duration: reduced ? 0 : 150 }); } }} style={{ minHeight: 54, borderRadius: 14, overflow: "hidden", backgroundColor: INK, alignItems: "center", justifyContent: "center" }}><Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#8A4527" }, fill]} /><Text style={[{ color: "#FFF6B8" }, buttonStyles.label]}>{celebrating ? "Prayed" : prayed ? "Hold to pray again" : "Hold to pray"}</Text></Pressable>{celebrating && !reduced && <Animated.View pointerEvents="none" style={[{ position: "absolute", alignSelf: "center", top: -20, backgroundColor: "#FFE9AE", padding: 14, borderRadius: 15, boxShadow: "0px 0px 24px #FFB65099" }, float]}><SFSymbol name="flame.fill" size={24} color="#CB621C" /></Animated.View>}</View>;
}
function Faces({ members }: { members: string[] }) { return <View style={{ flexDirection: "row", paddingLeft: 6 }}>{members.slice(0, 5).map((initial, i) => <View key={`${initial}-${i}`} style={{ width: 28, height: 28, marginLeft: -6, backgroundColor: FACES[i % FACES.length], borderWidth: 2, borderColor: "#FFFBF4", borderRadius: 14, alignItems: "center", justifyContent: "center" }}><Text style={[systemText.caption2, { color: INK, fontWeight: "700" }]}>{initial}</Text></View>)}</View>; }
function GroupCard({ group, onPress }: { group: StudyGroup; onPress: () => void }) {
  const book = findBookById(group.bookId)!;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${group.name}, reading ${book.name} chapter ${group.chapter}${group.joined ? ", joined" : ""}`} onPress={onPress} style={styles.groupCard}><View style={[styles.row, { alignItems: "flex-start", gap: 16 }]}><View style={{ transform: [{ rotate: "-3deg" }] }}><LibraryBookCover book={book} width={54} /></View><View style={{ flex: 1, gap: 5 }}><Text style={[systemText.caption1, { color: MUTED }]}>{group.schedule}</Text><Text style={[systemText.headline, { color: INK }]}>{group.name}</Text><Text style={[systemText.footnote, { color: MUTED }]}>{book.name} · chapter {group.chapter}</Text>{group.joined && <Text style={[systemText.caption1, { color: "#248A3D", fontWeight: "600" }]}>✓ Joined</Text>}</View></View><View style={[styles.row, { marginTop: 16, gap: 12 }]}><Faces members={group.members} /><View style={{ flex: 1, height: 6, backgroundColor: "#EADFCC", borderRadius: 3, overflow: "hidden" }}><View style={{ width: `${group.chapter / book.chapters * 100}%`, height: 6, backgroundColor: CORAL }} /></View><Text style={[systemText.caption1, { color: MUTED }]}>{group.members.length} {group.mine ? "member" : "sample members"}</Text></View></Pressable>;
}
function GroupDetail({ group, onChange, onClose, onRead, onDismiss, visible }: { visible: boolean; group: StudyGroup; onChange: (g: StudyGroup) => void; onClose: () => void; onRead: () => void; onDismiss: () => void }) {
  const colors = useColors(), book = findBookById(group.bookId)!;
  const [reply, setReply] = useState("");
  const groupPrayer = group.prayer ?? COMMUNITY_PREVIEW.groups.find(g => g.id === group.id)?.prayer;
  return <Sheet visible={visible} title="Study groups" onClose={onClose} onDismiss={onDismiss}><View style={[styles.row, { gap: 20, alignItems: "flex-end" }]}><LibraryBookCover book={book} width={76} /><View style={{ flex: 1, gap: 6 }}><Text style={[systemText.title1, { color: colors.ink }]}>{group.name}</Text><Text style={[systemText.footnote, { color: colors.textSecondary }]}>{group.schedule}</Text></View></View><Text style={[systemText.caption1, { color: colors.textSecondary }]}>Local preview · {group.mine ? "your local group" : "sample group and discussion"}</Text><View style={styles.groupCard}><Text style={[systemText.headline, { color: INK }]}>Reading together</Text><Text style={[systemText.body, { color: MUTED, marginTop: 8 }]}>{book.name} {group.chapter}</Text><View style={[styles.row, { marginTop: 14, gap: 12 }]}><Faces members={group.members} /><Text style={[systemText.caption1, { color: MUTED }]}>{group.members.length} {group.mine ? "member" : "sample members"}</Text></View><View style={{ marginTop: 18 }}><PrimaryButton label={`Read ${book.name} ${group.chapter}`} onPress={onRead} /></View></View><View style={[styles.groupCard, { gap: 14 }]}><Text style={[systemText.headline, { color: INK }]}>Today’s question</Text><Text style={[systemText.body, { color: INK }]}>{group.question}</Text>{group.replies.map((item, i) => <View key={i} style={{ padding: 14, backgroundColor: item.author === "You" ? "#DDF0FD" : "#FBEFD6", borderRadius: 14, borderTopLeftRadius: 4, gap: 6 }}><Text style={[systemText.caption1, { color: MUTED, fontWeight: "700" }]}>{item.author}</Text><Text style={[systemText.callout, { color: INK }]}>{item.text}</Text></View>)}{group.joined ? <><TextInput accessibilityLabel="Your answer" multiline maxLength={500} value={reply} onChangeText={setReply} placeholder="What’s on your mind?" placeholderTextColor={MUTED} style={[systemText.body, { minHeight: 80, padding: 14, backgroundColor: "#F6ECDF", color: INK, borderRadius: 14 }]} /><PrimaryButton label="Save your answer" disabled={!reply.trim()} onPress={() => { onChange({ ...group, replies: [...group.replies, { author: "You", text: reply.trim() }] }); setReply(""); haptics.soft(); }} /></> : <Text style={[systemText.footnote, { color: MUTED }]}>Join this preview group to try the discussion.</Text>}</View>{groupPrayer && <View style={[styles.paper, { backgroundColor: "#DDF0FD", gap: 14 }]}><View style={styles.pin} /><Text style={[systemText.headline, { color: INK }]}>Praying for each other</Text><Text style={[systemText.body, { color: INK }]}>{groupPrayer.text}</Text><Text style={[systemText.caption1, { color: MUTED }]}>{groupPrayer.author} · sample request</Text><HoldToPray prayed={Boolean(group.prayerPrayed)} onPray={() => { onChange({ ...group, prayerPrayed: true }); haptics.soft(); }} /></View>}<PrimaryButton label={group.joined ? "Leave preview group" : `Join ${group.name}`} onPress={() => { onChange({ ...group, joined: !group.joined }); haptics.soft(); }} /><Text style={[systemText.footnote, { color: colors.textSecondary }]}>Answers and membership are saved only on this device. Invitations will be available when Community goes live.</Text></Sheet>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  ask: { minHeight: 56, padding: 16, borderRadius: 16, borderBottomLeftRadius: 5, flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: CORAL, boxShadow: "0px 3px 0px #C9431F" },
  noteIcon: { width: 36, height: 42, backgroundColor: "#FFF6B8", alignItems: "center", justifyContent: "center", borderRadius: 2, transform: [{ rotate: "-4deg" }] },
  filter: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", borderRadius: 22 },
  paper: { padding: 14, paddingTop: 20, borderRadius: 2, boxShadow: "0px 8px 18px #140A0426" },
  pin: { position: "absolute", alignSelf: "center", top: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: "#DD5737", borderTopWidth: 3, borderTopColor: "#FF9A75", boxShadow: "0px 2px 3px #00000044", zIndex: 2 },
  tape: { position: "absolute", alignSelf: "center", top: -8, width: 70, height: 18, backgroundColor: "#FFFFFF99", transform: [{ rotate: "2deg" }], zIndex: 2 },
  pray: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, minHeight: 44, marginTop: 12, borderRadius: 12 },
  update: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: "#2A1F1822", color: "#235E91" },
  groupCard: { padding: 18, borderRadius: 18, borderCurve: "continuous", backgroundColor: "#FFFBF4", boxShadow: "0px 3px 0px #C5A575, 0px 8px 18px #140A041A" },
  newGroup: { minHeight: 58, padding: 16, borderWidth: 1, borderStyle: "dashed", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  centered: { flex: 1, justifyContent: "center", padding: 24 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "#160D07AA" },
  tutorial: { backgroundColor: "#FFF6B8", padding: 24, borderRadius: 3, boxShadow: "0px 18px 40px #00000055" },
  textButton: { minHeight: 44, paddingHorizontal: 8, justifyContent: "center", alignItems: "center" },
  darkButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, borderBottomLeftRadius: 4, backgroundColor: INK, alignItems: "center", justifyContent: "center" },
});
