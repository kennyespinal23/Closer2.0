import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/CloserText';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { SFSymbol } from '@/components/Symbol';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { useFocusMiniPlayerSpacing } from '@/components/FocusMiniPlayer';
import { mix } from '@/components/HomeDeck';
import { CreateStudyGroup } from './CreateStudyGroup';
import { PrayerPage } from './PrayerPage';
import { AskSheet } from './AskSheet';
import { GroupPage } from './GroupPage';
import { FLOOR, Face, Faces, INK_FAINT, Section, memberFor, personFor, tone, useMe } from './togetherKit';
import { COMMUNITY_PREVIEW, type CommunityPreviewState, type PrayerNote, type StudyGroup } from '@/constants/communityPreview';
import { useCommunityVideo, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW } from '@/lib/communityVideo';
import { findBookById } from '@/constants/books';
import { paintedCover } from '@/constants/paintedCovers';
import { STORAGE_KEYS, usePersistence } from '@/lib/storage';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useTabContentFade } from '@/lib/useTabContentFade';
import { tabContentClearance } from '@/lib/tabContentClearance';
import * as haptics from '@/lib/haptics';

/** Together: groups wear their book, people wear their avatar's colour, on a near-black room. */
export function CommunityScreen() {
  const video = useCommunityVideo(), insets = useSafeAreaInsets(), router = useRouter(), me = useMe();
  const tabHeight = useBottomTabBarHeight(), spacing = useFocusMiniPlayerSpacing();
  const reduced = useReducedMotion(), tabStyle = useTabContentFade(reduced);
  const [state, setState] = useState<CommunityPreviewState>(COMMUNITY_PREVIEW);
  const hydrated = usePersistence(STORAGE_KEYS.communityPreview, state, loaded => {
    if (Array.isArray(loaded.notes) && Array.isArray(loaded.groups) && Array.isArray(loaded.prayed)) setState(loaded);
  });
  const [mine, setMine] = useState(false), [asking, setAsking] = useState(false), [creating, setCreating] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null), [groupId, setGroupId] = useState<string | null>(null);
  const pendingRead = useRef<{ bookId: string; chapter: number } | null>(null);
  const note = state.notes.find(n => n.id === noteId), group = state.groups.find(g => g.id === groupId);
  // Other mounted screens can leave the bar dark; this room is always dark, so claim it on focus.
  useFocusEffect(useCallback(() => { setStatusBarStyle("light", true); }, []));
  const pray = (id: string) => { if (state.prayed.includes(id)) return; haptics.soft(); setState(s => s.prayed.includes(id) ? s : { ...s, prayed: [...s.prayed, id] }); };
  const setGroup = (g: StudyGroup) => setState(s => ({ ...s, groups: s.groups.map(old => old.id === g.id ? g : old) }));
  const closeGroup = () => {
    setGroupId(null);
    const target = pendingRead.current; pendingRead.current = null;
    if (target) setTimeout(() => router.push(`/book/${target.bookId}/${target.chapter}` as never), Platform.OS === 'ios' ? 450 : 0);
  };
  const notes = mine ? state.notes.filter(n => n.mine) : state.notes;
  const joined = state.groups.filter(g => g.joined), explore = state.groups.filter(g => !g.joined);
  return <View style={{ flex: 1, backgroundColor: FLOOR }}>
    <StatusBar style="light"/>
    <Animated.ScrollView style={tabStyle} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: tabContentClearance(tabHeight, insets.bottom, spacing) }}>
      <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -.7, color: '#FCFCFC' }}>Together</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => router.navigate('/profile' as never)}><Face person={me} size={44}/></Pressable>
      </View>
      <Pressable feedback="action" accessibilityRole="button" disabled={!hydrated} onPress={() => { haptics.soft(); setAsking(true); }}
        style={{ marginHorizontal: 16, marginTop: 16, height: 64, borderRadius: 22, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#3A1C17', boxShadow: 'inset 0 1px 0 #FFFFFF14' }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8A08F', alignItems: 'center', justifyContent: 'center' }}><SFSymbol name="heart.fill" size={17} color="#4A1C14"/></View>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#F6DCD5' }}>Ask someone to pray for you</Text>
      </Pressable>

      <Section title="Your groups" action={{ label: 'New', icon: 'plus', onPress: () => setCreating(true) }}/>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {joined.map(g => <GroupCover key={g.id} group={g} onOpen={() => setGroupId(g.id)}/>)}
        <Pressable feedback="action" accessibilityRole="button" disabled={!hydrated} onPress={() => { haptics.soft(); setCreating(true); }}
          style={{ width: 120, height: 300, borderRadius: 28, backgroundColor: '#221D1C', boxShadow: 'inset 0 0 0 2px #FFFFFF1A', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF14', alignItems: 'center', justifyContent: 'center' }}><SFSymbol name="plus" size={20} color="#FFFFFF"/></View>
          <Text style={{ fontSize: 14, lineHeight: 18, fontWeight: '800', color: '#E8E3E0', textAlign: 'center' }}>Start a{'\n'}group</Text>
        </Pressable>
      </ScrollView>

      <Section title="Prayer wall" action={{ label: mine ? 'Everyone' : 'Mine', onPress: () => setMine(m => !m) }}/>
      {notes.map(n => <PrayerRow key={n.id} note={n} prayed={state.prayed.includes(n.id)} onOpen={() => setNoteId(n.id)}/>)}
      {!notes.length && <Text style={{ marginHorizontal: 22, fontSize: 15, lineHeight: 21, fontWeight: '600', color: INK_FAINT }}>Your prayers will be here.</Text>}

      <Pressable accessibilityRole="button" accessibilityLabel="Browse Closer Shorts" onPress={() => router.push('/videos')}
        style={{ marginHorizontal: 16, marginTop: 26, height: 150, borderRadius: 26, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <Image source={video ? { uri: video.thumbnail_url } : COMMUNITY_VIDEO_POSTER} contentFit="cover" style={StyleSheet.absoluteFill}/>
        <ReaderMaterialGradient colors={['#0B090900', '#0B0909E6']} style={StyleSheet.absoluteFill}/>
        <View style={{ flex: 1, gap: 4 }}><Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: .9, color: '#E8E3E0B3' }}>{video ? 'NEW FROM CLOSER' : 'COMING SOON'}</Text><Text style={{ fontSize: 19, lineHeight: 23, fontWeight: '900', color: '#FCFCFC' }}>{video?.title ?? COMMUNITY_VIDEO_PREVIEW.title}</Text></View>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF2A', alignItems: 'center', justifyContent: 'center' }}><SFSymbol name={video ? 'play.fill' : 'arrow.right'} size={16} color="#FFFFFF"/></View>
      </Pressable>

      {explore.length > 0 && <>
        <Section title="Explore groups"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {explore.map(g => <GroupCover key={g.id} group={g} onOpen={() => setGroupId(g.id)} small/>)}
        </ScrollView>
      </>}
      <Text style={{ marginHorizontal: 22, marginTop: 26, fontSize: 12, lineHeight: 17, fontWeight: '600', color: '#6E6764', textAlign: 'center' }}>Community preview · Sample prayers and groups. What you add stays on this device.</Text>
    </Animated.ScrollView>
    {asking && <AskSheet onClose={() => setAsking(false)} onSave={n => { setState(s => ({ ...s, notes: [n, ...s.notes] })); setMine(true); setAsking(false); }}/>}
    {note && <PrayerPage key={note.id} note={note} prayed={state.prayed.includes(note.id)} onPray={() => pray(note.id)} onClose={() => setNoteId(null)}
      onChange={n => setState(s => ({ ...s, notes: s.notes.map(old => old.id === n.id ? n : old) }))}
      onRemove={() => { setState(s => ({ ...s, notes: s.notes.filter(n => n.id !== note.id), prayed: s.prayed.filter(id => id !== note.id) })); setNoteId(null); }}/>}
    {group && <GroupPage key={group.id} group={group} onClose={closeGroup} onChange={setGroup} onRead={() => { pendingRead.current = { bookId: group.bookId, chapter: group.chapter }; closeGroup(); }}/>}
    {creating && <CreateStudyGroup onClose={() => setCreating(false)} onSave={g => { setState(s => ({ ...s, groups: [g, ...s.groups] })); setCreating(false); setGroupId(g.id); }}/>}
  </View>;
}

/** A group on the shelf: its book's painted cover, fading into the cover's colour. */
function GroupCover({ group, onOpen, small }: { group: StudyGroup; onOpen: () => void; small?: boolean }) {
  const me = useMe(), book = findBookById(group.bookId), cover = paintedCover(group.bookId), t = tone(cover?.color ?? '#5B4A9A');
  const members = group.members.map(m => memberFor(m, me)), w = small ? 200 : 250, h = small ? 240 : 300;
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`${group.name}. ${book?.name} ${group.chapter}. ${members.length} reading`} onPress={() => { haptics.soft(); onOpen(); }}
    style={{ width: w, height: h, borderRadius: 28, overflow: 'hidden', backgroundColor: t.deep, boxShadow: 'inset 0 1px 0 #FFFFFF1F, 0 20px 34px -20px #000' }}>
    {cover && <Image source={cover.source} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill}/>}
    <ReaderMaterialGradient pointerEvents="none" colors={[`${t.deep}00`, `${t.deep}CC`, t.deep]} locations={[.3, .62, 1]} style={StyleSheet.absoluteFill}/>
    {!!group.mine && <View style={{ position: 'absolute', right: 12, top: 12, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: '#FFF8F2', justifyContent: 'center' }}><Text style={{ fontSize: 12, fontWeight: '900', color: t.deep }}>Yours</Text></View>}
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
      <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: .9, color: t.t3 }}>{`${book?.name ?? ''} ${group.chapter}`.toUpperCase()} · {group.schedule.toUpperCase()}</Text>
      <Text numberOfLines={2} style={{ marginTop: 3, fontSize: small ? 18 : 21, lineHeight: small ? 22 : 25, fontWeight: '900', letterSpacing: -.3, color: t.t1 }}>{group.name}</Text>
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Faces people={members.slice(0, 4)} ring={t.deep}/><Text style={{ fontSize: 13, fontWeight: '700', color: t.t2 }}>{members.length} reading</Text></View>
    </View>
  </Pressable>;
}

/** A prayer on the wall, in the asker's colour. */
function PrayerRow({ note, prayed, onOpen }: { note: PrayerNote; prayed: boolean; onOpen: () => void }) {
  const me = useMe(), p = note.mine ? me : personFor(note.author), t = tone(p.color), count = note.count + Number(prayed);
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Prayer from ${note.mine ? 'you' : p.name}. ${note.text}`} onPress={() => { haptics.soft(); onOpen(); }}
    style={{ marginHorizontal: 16, marginBottom: 10, minHeight: 112, borderRadius: 26, overflow: 'hidden', flexDirection: 'row', backgroundColor: mix(p.color, '#000000', .4), boxShadow: 'inset 0 1px 0 #FFFFFF1F' }}>
    <View style={{ width: 96, alignItems: 'center', paddingTop: 18, backgroundColor: mix(p.color, '#000000', .55) }}><Face person={p} size={58} ring={t.t3}/></View>
    <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: t.t1, flex: 1 }}>{note.mine ? 'You' : p.name}</Text>
        {note.tag !== 'Request' && <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#FFFFFF26', justifyContent: 'center' }}><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: .6, color: '#FFFFFF' }}>{note.tag.toUpperCase()}</Text></View>}
      </View>
      <Text numberOfLines={3} style={{ marginTop: 4, fontSize: 15, lineHeight: 21, fontWeight: '700', color: t.t2 }}>{note.text}</Text>
      <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '700', color: t.t3 }}>{note.age}{count ? ` · ${prayed ? 'you and ' + (count - 1) : count} praying` : ''}</Text>
    </View>
  </Pressable>;
}
