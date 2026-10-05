import { useRef, useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Animated from 'react-native-reanimated';
import { Text, TextInput } from '@/components/CloserText';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { CloseButton } from '@/components/CloseButton';
import { SFSymbol } from '@/components/Symbol';
import { LibraryBookCover } from '@/components/LibraryBookcase';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { useFocusMiniPlayerSpacing } from '@/components/FocusMiniPlayer';
import { CreateStudyGroup } from './CreateStudyGroup';
import { COMMUNITY_PREVIEW, NOTE_COLORS, type CommunityPreviewState, type PrayerNote, type StudyGroup } from '@/constants/communityPreview';
import { useCommunityVideo, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW } from '@/lib/communityVideo';
import { findBookById } from '@/constants/books';
import { useColors as useThemeColors, useResolvedScheme } from '@/state/theme';
import { useOnboarding } from '@/state/onboarding';
import { STORAGE_KEYS, usePersistence } from '@/lib/storage';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useTabContentFade } from '@/lib/useTabContentFade';
import { tabContentClearance } from '@/lib/tabContentClearance';
import { contentLayout } from '@/lib/contentStyles';
import { uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { paperActionColors } from '@/lib/paperControls';
import * as haptics from '@/lib/haptics';

function useColors() {
  const base = useThemeColors(), dark = useResolvedScheme() === 'dark';
  return { ...base, bg: dark ? '#211D19' : '#FAF2E5', surface: dark ? '#302920' : '#FFFBF4', surfaceSecondary: dark ? '#443930' : '#EFE4D4', ink: dark ? '#FFF4E5' : '#35291F', textSecondary: dark ? '#BAA58F' : '#897766', border: dark ? '#BAA58F22' : '#DAC9B580' };
}

const makeId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function CommunityScreen() {
  const video = useCommunityVideo();
  const colors = useColors(), scheme = useResolvedScheme(), insets = useSafeAreaInsets();
  const tabHeight = useBottomTabBarHeight(), spacing = useFocusMiniPlayerSpacing();
  const reduced = useReducedMotion(), tabStyle = useTabContentFade(reduced), router = useRouter();
  const { answers } = useOnboarding();
  const [state, setState] = useState<CommunityPreviewState>(COMMUNITY_PREVIEW);
  const hydrated = usePersistence(STORAGE_KEYS.communityPreview, state, loaded => {
    if (Array.isArray(loaded.notes) && Array.isArray(loaded.groups) && Array.isArray(loaded.prayed)) setState(loaded);
  });
  const [mode, setMode] = useState(0), [mine, setMine] = useState(false);
  const [composer, setComposer] = useState(false), [creating, setCreating] = useState(false), [info, setInfo] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null), [groupId, setGroupId] = useState<string | null>(null);
  const [groupVisible, setGroupVisible] = useState(false);
  const pendingRead = useRef<{ bookId: string; chapter: number } | null>(null);
  const note = state.notes.find(n => n.id === noteId), group = state.groups.find(g => g.id === groupId);
  const pray = (id: string) => { if (state.prayed.includes(id)) return; haptics.soft(); setState(s => s.prayed.includes(id) ? s : { ...s, prayed: [...s.prayed, id] }); };
  const finishGroup = () => { setGroupId(null); const target = pendingRead.current; pendingRead.current = null; if (target) router.push(`/book/${target.bookId}/${target.chapter}`); };
  const closeGroup = () => { setGroupVisible(false); if (Platform.OS !== 'ios') finishGroup(); };
  const notes = mine ? state.notes.filter(n => n.mine) : state.notes;
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
    <Animated.ScrollView style={tabStyle} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: contentLayout.gutter, paddingTop: contentLayout.screenTop, paddingBottom: tabContentClearance(tabHeight, insets.bottom, spacing), gap: 24 }}>
      <View style={s.row}><Text accessibilityRole="header" style={[uiText.screenTitle, { flex: 1, color: colors.ink }]}>Community</Text><Pressable accessibilityRole="button" accessibilityLabel="Ask for prayer" disabled={!hydrated} onPress={() => setComposer(true)} style={[s.circle, { backgroundColor: colors.surface }]}><SFSymbol name="plus" color={colors.ink} size={22} /></Pressable></View>
      <SegmentedControl appearance={scheme} tintColor={scheme === 'dark' ? '#3B332A' : '#FFFBF4'} backgroundColor={colors.surface} fontStyle={{ fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: colors.textSecondary }} activeFontStyle={{ fontFamily: 'Nunito-ExtraBold', fontSize: 15, color: colors.ink }} values={['Prayers', 'Study groups']} selectedIndex={mode} onChange={e => { setMode(e.nativeEvent.selectedSegmentIndex); haptics.tick(); }} style={{ height: 48, borderRadius: 24, overflow: 'hidden' }} />
      {mode === 0 ? <>
        <Pressable accessibilityRole="button" accessibilityLabel={video ? `Preview ${video.title}` : 'Preview our next video'} onPress={() => router.push('/community-video')} style={s.hero}>
          <Image source={video ? { uri: video.thumbnail_url } : COMMUNITY_VIDEO_POSTER} contentFit="cover" style={StyleSheet.absoluteFill} />
          <ReaderMaterialGradient colors={['#20160F05', '#20160FEF']} style={StyleSheet.absoluteFill} />
          <View style={{ flex: 1, gap: 6 }}><Text style={s.eyebrow}>{video ? 'NEW FROM CLOSER' : 'COMING SOON'}</Text><Text style={[uiText.sectionTitle, { color: '#FFF4E5' }]}>{video?.title ?? COMMUNITY_VIDEO_PREVIEW.title}</Text></View>
          <View style={[s.circle, { backgroundColor: '#FFF4E52A' }]}><SFSymbol name={video ? "play.fill" : "arrow.right"} size={18} color="#FFF4E5" /></View>
        </Pressable>
        <View style={s.row}><Text accessibilityRole="header" style={[uiText.sectionTitle, { color: colors.ink, flex: 1 }]}>Prayer wall</Text><Pressable accessibilityRole="button" accessibilityState={{ selected: mine }} onPress={() => setMine(!mine)} style={s.textAction}><Text style={[buttonStyles.compactLabel, { color: colors.textSecondary }]}>{mine ? 'All prayers' : 'My prayers'}</Text></Pressable></View>
        <View style={{ gap: 16 }}>{notes.map(n => <PrayerCard key={n.id} note={n} prayed={state.prayed.includes(n.id)} onPray={() => pray(n.id)} onOpen={() => setNoteId(n.id)} />)}{notes.length === 0 && <Surface><Text style={[uiText.body, { color: colors.textSecondary }]}>Your prayers will be here.</Text><Primary label="Ask for prayer" onPress={() => setComposer(true)} /></Surface>}</View>
      </> : <>
        <Text accessibilityRole="header" style={[uiText.sectionTitle, { color: colors.ink }]}>Your groups</Text>
        {state.groups.filter(g => g.joined).map(g => <GroupCard key={g.id} group={g} onOpen={() => { setGroupId(g.id); setGroupVisible(true); }} />)}
        {!state.groups.some(g => g.joined) && <Text style={[uiText.body, { color: colors.textSecondary }]}>Start a group or explore one below.</Text>}
        <Primary label="Start a study group" onPress={() => setCreating(true)} disabled={!hydrated} />
        {state.groups.some(g => !g.joined) && <Text accessibilityRole="header" style={[uiText.sectionTitle, { color: colors.ink }]}>Explore groups</Text>}
        {state.groups.filter(g => !g.joined).map(g => <GroupCard key={g.id} group={g} onOpen={() => { setGroupId(g.id); setGroupVisible(true); }} />)}
      </>}
      <Pressable accessibilityRole="button" onPress={() => setInfo(true)} style={s.textAction}><Text style={[uiText.supporting, { color: colors.textSecondary, textAlign: 'center' }]}>Community preview · saved on this device</Text></Pressable>
    </Animated.ScrollView>
    {info && <Sheet title="Community preview" onClose={() => setInfo(false)}><Text style={[uiText.body, { color: colors.ink }]}>Explore sample prayers and study groups. Your prayers, replies and group changes stay on this device. No messages or invitations are sent.</Text></Sheet>}
    {composer && <Composer name={answers.name?.trim().split(/\s+/)[0] || 'You'} onClose={() => setComposer(false)} onSave={n => { setState(s => ({ ...s, notes: [n, ...s.notes] })); setMode(0); setMine(true); setComposer(false); haptics.success(); }} />}
    {note && <PrayerDetail key={note.id} note={note} prayed={state.prayed.includes(note.id)} onPray={() => pray(note.id)} onClose={() => setNoteId(null)} onChange={n => setState(s => ({ ...s, notes: s.notes.map(old => old.id === n.id ? n : old) }))} onRemove={() => { setState(s => ({ ...s, notes: s.notes.filter(n => n.id !== note.id), prayed: s.prayed.filter(id => id !== note.id) })); setNoteId(null); }} />}
    {group && <GroupDetail key={group.id} group={group} visible={groupVisible} onClose={closeGroup} onDismiss={finishGroup} onRead={() => { pendingRead.current = { bookId: group.bookId, chapter: group.chapter }; closeGroup(); }} onChange={g => setState(s => ({ ...s, groups: s.groups.map(old => old.id === g.id ? g : old) }))} />}
    {creating && <CreateStudyGroup onClose={() => setCreating(false)} onSave={g => { setState(s => ({ ...s, groups: [g, ...s.groups] })); setCreating(false); }} />}
  </SafeAreaView>;
}

function Surface({ children }: { children: ReactNode }) { const c = useColors(); return <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>; }
function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { const a = paperActionColors(useResolvedScheme() === 'dark'); return <Pressable feedback="action" accessibilityRole="button" disabled={disabled} onPress={onPress} style={[buttonStyles.primary, { backgroundColor: a.backgroundColor, opacity: disabled ? .4 : 1 }]}><Text style={[buttonStyles.label, { color: a.color }]}>{label}</Text></Pressable>; }
function Sheet({ title, children, onClose, visible = true, onDismiss }: { title: string; children: ReactNode; onClose: () => void; visible?: boolean; onDismiss?: () => void }) {
  const c = useColors(), reduced = useReducedMotion();
  return <Modal visible={visible} presentationStyle="pageSheet" animationType={reduced ? 'fade' : 'slide'} onRequestClose={onClose} onDismiss={onDismiss}><SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={[s.row, { padding: 24, gap: 12 }]}><Text accessibilityRole="header" style={[uiText.sectionTitle, { color: c.ink, flex: 1 }]}>{title}</Text><CloseButton onPress={onClose} color={c.ink} style={{ backgroundColor: c.surface }} /></View><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 24 }}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
function PrayerCard({ note, prayed, onPray, onOpen }: { note: PrayerNote; prayed: boolean; onPray: () => void; onOpen: () => void }) {
  const c = useColors(), a = paperActionColors(useResolvedScheme() === 'dark');
  return <Surface><View style={[s.row, { gap: 10 }]}><View style={[s.avatar, { backgroundColor: c.surfaceSecondary }]}><Text style={{ color: c.ink, fontWeight: '800' }}>{note.author[0]}</Text></View><Text style={{ color: c.ink, fontWeight: '800', flex: 1 }}>{note.author}</Text><Text style={{ color: c.textSecondary, fontSize: 12 }}>{note.age}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open prayer from ${note.author}`} onPress={onOpen} style={{ gap: 10 }}>{note.tag === 'Answered' && <Text style={{ color: c.textSecondary, fontWeight: '800', fontSize: 13 }}>Answered prayer</Text>}<Text style={{ color: c.ink, fontSize: 18, lineHeight: 26 }}>{note.text}</Text>{note.update && <Text style={[uiText.supporting, { color: c.textSecondary }]}>{note.update}</Text>}</Pressable>
    <View style={[s.row, { gap: 8, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 14 }]}><Pressable feedback="action" accessibilityRole="button" accessibilityState={{ selected: prayed }} onPress={onPray} style={[s.pray, { backgroundColor: prayed ? c.surfaceSecondary : a.backgroundColor }]}><SFSymbol name={prayed ? 'checkmark' : 'heart'} size={18} color={prayed ? c.ink : a.color} /><Text style={[buttonStyles.compactLabel, { color: prayed ? c.ink : a.color }]}>{prayed ? 'Prayed' : 'I’ll pray'}</Text></Pressable><Pressable accessibilityRole="button" onPress={onOpen} style={[s.row, s.textAction, { gap: 6 }]}><SFSymbol name="bubble.right" size={18} color={c.textSecondary} /><Text style={{ color: c.textSecondary, fontSize: 13 }}>{note.encouragements?.length ?? 0} {note.encouragements?.length === 1 ? 'reply' : 'replies'}</Text></Pressable></View>
    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{note.count + Number(prayed)} {note.count + Number(prayed) === 1 ? 'person' : 'people'} praying</Text>
  </Surface>;
}
function Composer({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (n: PrayerNote) => void }) {
  const c = useColors(), [text, setText] = useState(''), [anonymous, setAnonymous] = useState(false);
  return <Sheet title="Ask for prayer" onClose={onClose}><TextInput accessibilityLabel="Your prayer request" multiline maxLength={240} value={text} onChangeText={setText} placeholder="What’s on your heart?" placeholderTextColor={c.textSecondary} style={[s.input, { minHeight: 160, backgroundColor: c.surface, color: c.ink }]} /><View style={s.row}><Text style={[uiText.body, { color: c.ink, flex: 1 }]}>Post anonymously</Text><Switch accessibilityLabel="Post anonymously" value={anonymous} onValueChange={setAnonymous} /></View><Primary label="Save prayer" disabled={!text.trim()} onPress={() => onSave({ id: makeId(), author: anonymous ? 'Anonymous (you)' : `${name} (you)`, text: text.trim(), age: 'Now', count: 0, tag: 'Request', mine: true, color: NOTE_COLORS[0] })} /><Text style={[uiText.supporting, { color: c.textSecondary }]}>Saved on this device. Not posted publicly.</Text></Sheet>;
}
function PrayerDetail({ note, prayed, onPray, onClose, onChange, onRemove }: { note: PrayerNote; prayed: boolean; onPray: () => void; onClose: () => void; onChange: (n: PrayerNote) => void; onRemove: () => void }) {
  const c = useColors(), [reply, setReply] = useState(''), [update, setUpdate] = useState(note.update ?? ''), [answered, setAnswered] = useState(note.tag === 'Answered');
  return <Sheet title={note.author} onClose={onClose}><Text style={{ color: c.ink, fontSize: 21, lineHeight: 30 }}>{note.text}</Text>{note.update && <Text style={[uiText.body, { color: c.textSecondary }]}>{note.update}</Text>}<Primary label={prayed ? 'Prayed' : 'I’ll pray'} onPress={onPray} disabled={prayed} />
    {(note.encouragements ?? []).map((r, i) => <Surface key={i}><Text style={{ color: c.textSecondary, fontWeight: '800' }}>You</Text><Text style={[uiText.body, { color: c.ink }]}>{r}</Text></Surface>)}
    <TextInput accessibilityLabel="Your reply" placeholder="Leave some encouragement" placeholderTextColor={c.textSecondary} value={reply} onChangeText={setReply} multiline maxLength={500} style={[s.input, { color: c.ink, backgroundColor: c.surface }]} /><Primary label="Save reply" disabled={!reply.trim()} onPress={() => { onChange({ ...note, encouragements: [...(note.encouragements ?? []), reply.trim()] }); setReply(''); haptics.soft(); }} />
    {note.mine && <><Text accessibilityRole="header" style={[uiText.sectionTitle, { color: c.ink }]}>Your update</Text><TextInput accessibilityLabel="Prayer update" value={update} onChangeText={setUpdate} multiline maxLength={240} style={[s.input, { color: c.ink, backgroundColor: c.surface }]} /><View style={s.row}><Text style={[uiText.body, { color: c.ink, flex: 1 }]}>Answered prayer</Text><Switch accessibilityLabel="Answered prayer" value={answered} onValueChange={setAnswered} /></View><Primary label="Save update" onPress={() => { onChange({ ...note, update: update.trim(), tag: answered ? 'Answered' : note.tag === 'Answered' ? 'Request' : note.tag }); onClose(); }} /><Pressable accessibilityRole="button" style={s.textAction} onPress={() => Alert.alert('Remove prayer?', 'This removes your saved prayer from this device.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: onRemove }])}><Text style={[buttonStyles.textLabel, { color: c.ink, textAlign: 'center' }]}>Remove prayer</Text></Pressable></>}
    <Text style={[uiText.supporting, { color: c.textSecondary }]}>Replies are saved on this device. No messages are sent.</Text>
  </Sheet>;
}
function GroupCard({ group, onOpen }: { group: StudyGroup; onOpen: () => void }) {
  const c = useColors(), book = findBookById(group.bookId); if (!book) return null;
  return <Surface><View style={[s.row, { gap: 18 }]}><LibraryBookCover book={book} width={84} /><View style={{ flex: 1, gap: 8 }}><Text style={[uiText.sectionTitle, { color: c.ink }]}>{group.name}</Text><Text style={[uiText.supporting, { color: c.textSecondary }]}>{book.name} · Chapter {group.chapter} of {book.chapters}</Text><View style={[s.row, { gap: 4 }]}>{group.members.slice(0, 3).map((m, i) => <View key={i} style={[s.avatar, { backgroundColor: c.surfaceSecondary }]}><Text style={{ color: c.ink, fontSize: 12, fontWeight: '800' }}>{m}</Text></View>)}</View></View></View><View style={{ height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' }}><View style={{ height: 6, backgroundColor: c.textSecondary, width: `${Math.min(100, group.chapter / book.chapters * 100)}%` }} /></View><Primary label={group.joined ? 'Open group' : 'View group'} onPress={onOpen} /></Surface>;
}
function GroupDetail({ group, visible, onClose, onDismiss, onRead, onChange }: { group: StudyGroup; visible: boolean; onClose: () => void; onDismiss: () => void; onRead: () => void; onChange: (g: StudyGroup) => void }) {
  const c = useColors(), book = findBookById(group.bookId), [reply, setReply] = useState('');
  const groupPrayer = group.prayer ?? COMMUNITY_PREVIEW.groups.find(g => g.id === group.id)?.prayer;
  return <Sheet title={group.name} visible={visible} onClose={onClose} onDismiss={onDismiss}><Text style={[uiText.supporting, { color: c.textSecondary }]}>{book?.name} {group.chapter} · {group.schedule}</Text><Primary label={`Read ${book?.name} ${group.chapter}`} onPress={onRead} /><Text style={[uiText.sectionTitle, { color: c.ink }]}>{group.question}</Text>{group.replies.map((r, i) => <Surface key={i}><Text style={{ color: c.textSecondary, fontWeight: '800' }}>{r.author}</Text><Text style={[uiText.body, { color: c.ink }]}>{r.text}</Text></Surface>)}
    {group.joined && <><TextInput accessibilityLabel="Your reflection" value={reply} onChangeText={setReply} placeholder="Share a reflection" placeholderTextColor={c.textSecondary} multiline maxLength={500} style={[s.input, { color: c.ink, backgroundColor: c.surface }]} /><Primary label="Save reflection" disabled={!reply.trim()} onPress={() => { onChange({ ...group, replies: [...group.replies, { author: 'You', text: reply.trim() }] }); setReply(''); haptics.soft(); }} /></>}
    {groupPrayer && <Surface><Text style={[uiText.sectionTitle, { color: c.ink }]}>Praying together</Text><Text style={[uiText.body, { color: c.ink }]}>{groupPrayer.text}</Text><Primary label={group.prayerPrayed ? 'Prayed' : 'I’ll pray'} disabled={group.prayerPrayed} onPress={() => { onChange({ ...group, prayerPrayed: true }); haptics.soft(); }} /></Surface>}
    <Primary label={group.joined ? 'Leave group' : 'Join group'} onPress={() => onChange({ ...group, joined: !group.joined })} /><Text style={[uiText.supporting, { color: c.textSecondary }]}>Local preview. Invitations and live discussions are not available yet.</Text>
  </Sheet>;
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 182, padding: 22, borderRadius: 24, borderCurve: 'continuous', overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#FFF4E5' },
  card: { borderWidth: 1, borderRadius: 22, borderCurve: 'continuous', padding: 18, gap: 16 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pray: { minHeight: 44, paddingHorizontal: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  textAction: { minHeight: 44, justifyContent: 'center' },
  input: { minHeight: 64, padding: 18, borderRadius: 18, borderCurve: 'continuous', fontSize: 18, lineHeight: 26, textAlignVertical: 'top' },
});
