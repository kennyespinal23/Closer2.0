import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/CloserText';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { SFSymbol } from '@/components/Symbol';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { mix } from '@/components/HomeDeck';
import { K, nunito } from '@/components/closer/kit';
import { filmNumber, openFilm, platformsFor } from '@/components/films';
import { FilmTitle } from '@/components/FilmTitle';
import { PrayerPage } from './PrayerPage';
import { AskSheet } from './AskSheet';
import { Face, Faces, memberFor, personFor, tone, useMe } from './togetherKit';
import { type PrayerNote, type StudyGroup } from '@/constants/communityPreview';
import { useCommunityVideos, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW, filmFocus, filmImage, type CommunityVideo } from '@/lib/communityVideo';
import { findBookById } from '@/constants/books';
import { paintedCover } from '@/constants/paintedCovers';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useCommunity } from '@/state/community';
import * as haptics from '@/lib/haptics';
import { radius } from '@/constants/spacing';
import { fill, plural, useStrings } from '@/lib/i18n';

const GROUND = '#120D0A', INK = '#F4ECE1', GOLD = '#FFC72C';
const HERO_H = 600;

/**
 * Community, film first (CLOSER-PICKS.md, "Community tab, film first"): Closer Shorts across the top, edge to edge,
 * the latest three to swipe between; a shelf of earlier films; then asking for prayer and the prayer wall. Reading
 * groups live under You now.
 */
export function CommunityScreen() {
  const videos = useCommunityVideos(), insets = useSafeAreaInsets(), router = useRouter(), me = useMe(), focused = useIsFocused();
  const { state, hydrated, update } = useCommunity();
  const [mine, setMine] = useState(false), [asking, setAsking] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [onCream, setOnCream] = useState(false);
  const t = useStrings().native.community;
  const note = state.notes.find(n => n.id === noteId);
  const pray = (id: string) => { if (state.prayed.includes(id)) return; haptics.soft(); update(s => s.prayed.includes(id) ? s : { ...s, prayed: [...s.prayed, id] }); };
  const notes = mine ? state.notes.filter(n => n.mine) : state.notes;
  const openFilmPage = (v: CommunityVideo) => { haptics.soft(); router.push({ pathname: '/community-video', params: { id: v.id } }); };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { const c = e.nativeEvent.contentOffset.y > HERO_H - 80; if (c !== onCream) setOnCream(c); };

  return <View style={{ flex: 1, backgroundColor: K.cream }}>
    {focused && <StatusBar style={onCream ? 'dark' : 'light'} />}
    <ScrollView showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={64} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 140 }}>
      <Billboard films={videos.slice(0, 3)} all={videos} topInset={insets.top} me={me} onMe={() => router.navigate('/you' as never)} onInfo={openFilmPage} />
      <ReaderMaterialGradient pointerEvents="none" colors={[GROUND, K.cream]} style={{ height: 40 }} />

      {videos.length > 1 && <>
        <View style={st.head}><RNText accessibilityRole="header" style={st.h2}>{t.moreFilms}</RNText><RNText style={st.count}>{plural(videos.length, t.shorts)}</RNText></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 12, paddingBottom: 6 }}>
          {videos.slice(1).map((v, i) => <Pressable key={v.id} accessibilityRole="button" accessibilityLabel={v.title} onPress={() => openFilmPage(v)} style={{ width: 132 }}>
            <View style={st.poster}>
              <Image recyclingKey={v.id} source={filmImage(v)} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={filmFocus(v)} style={StyleSheet.absoluteFill} />
              <ReaderMaterialGradient pointerEvents="none" colors={['#00000000', '#000000C0']} locations={[.45, 1]} style={StyleSheet.absoluteFill} />
              {i === 0 && <View style={st.newTag}><RNText style={nunito(900, 10.5, { color: '#2A1C05' })}>{t.newTag}</RNText></View>}
              <View style={{ paddingBottom: 10, width: '100%' }}><FilmTitle title={v.title} size="poster" /></View>
            </View>
          </Pressable>)}
        </ScrollView>
      </>}

      <Pressable feedback="action" accessibilityRole="button" disabled={!hydrated} onPress={() => { haptics.soft(); setAsking(true); }} style={{ marginHorizontal: 20, marginTop: 24 }}>
        <View style={st.askLip} />
        <View style={st.ask}>
          <View style={st.askIcon}><SFSymbol name="heart.fill" size={17} color="#4A1C14" /></View>
          <RNText style={nunito(900, 17, { color: '#4A1C14' })}>{t.ask}</RNText>
        </View>
      </Pressable>

      <View style={[st.head, { marginTop: 28 }]}>
        <RNText accessibilityRole="header" style={st.h2}>{t.wall}</RNText>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: mine }} onPress={() => { haptics.tick(); setMine(m => !m); }} style={[st.mine, { backgroundColor: mine ? K.ink : K.creamDeep }]}>
          <RNText style={nunito(900, 14, { color: mine ? K.cream : K.ink })}>{mine ? t.everyone : t.mine}</RNText>
        </Pressable>
      </View>
      <View style={{ marginTop: 12 }}>
        {notes.map(n => <PrayerRow key={n.id} note={n} prayed={state.prayed.includes(n.id)} onOpen={() => setNoteId(n.id)} onPray={() => pray(n.id)} />)}
      </View>
      {!notes.length && <RNText style={nunito(700, 15, { color: K.inkSoft, marginHorizontal: 22 })}>{t.empty}</RNText>}
      <RNText style={nunito(700, 12.5, { color: K.inkFaint, textAlign: 'center', marginHorizontal: 26, marginTop: 24 })}>{t.previewNote}</RNText>
    </ScrollView>

    {asking && <AskSheet onClose={() => setAsking(false)} onSave={n => { update(s => ({ ...s, notes: [n, ...s.notes] })); setMine(true); setAsking(false); }} />}
    {note && <PrayerPage key={note.id} note={note} prayed={state.prayed.includes(note.id)} onPray={() => pray(note.id)} onClose={() => setNoteId(null)}
      onChange={n => update(s => ({ ...s, notes: s.notes.map(old => old.id === n.id ? n : old) }))}
      onRemove={() => { update(s => ({ ...s, notes: s.notes.filter(n => n.id !== note.id), prayed: s.prayed.filter(id => id !== note.id) })); setNoteId(null); }} />}
  </View>;
}

/* The billboard: each film edge to edge, a quiet "Closer Shorts" and your face over it, "NEW FILM now streaming",
   the title centred, Watch (YouTube first) and ⓘ, dots for the latest three. Swipe between them. */
function Billboard({ films, all, topInset, me, onMe, onInfo }: { films: CommunityVideo[]; all: CommunityVideo[]; topInset: number; me: ReturnType<typeof useMe>; onMe: () => void; onInfo: (v: CommunityVideo) => void }) {
  const { width } = useWindowDimensions(), reduced = useReducedMotion();
  const [i, setI] = useState(0), [opening, setOpening] = useState(false);
  const pager = useRef<ScrollView>(null);
  const t = useStrings().native.community;
  const f = films[i] ?? null;
  const url = f ? (f.youtube_url ?? platformsFor(f)[0]?.url ?? f.watch_url) : '';
  const watch = async () => {
    if (!f || opening) return;
    setOpening(true); haptics.soft();
    try { await openFilm(url); } finally { setOpening(false); }
  };
  const go = (k: number) => { setI(k); pager.current?.scrollTo({ x: k * width, animated: !reduced }); };
  // the poster drifts slowly, like a trailer still (none with reduce motion)
  const drift = useSharedValue(1);
  useEffect(() => { if (!reduced) drift.value = withRepeat(withTiming(1.08, { duration: 12000, easing: Easing.inOut(Easing.quad) }), -1, true); }, [reduced, drift]);
  const driftStyle = useAnimatedStyle(() => ({ transform: [{ scale: drift.value }] }));
  return <View style={{ height: HERO_H, backgroundColor: GROUND }}>
    <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={films.length > 1}
      onMomentumScrollEnd={e => { const k = Math.round(e.nativeEvent.contentOffset.x / width); if (k !== i) { setI(k); haptics.tick(); } }}>
      {(films.length ? films : [null]).map((v, k) => <View key={v?.id ?? 'preview'} style={{ width, height: HERO_H, overflow: 'hidden' }}>
        <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}><Image source={v ? filmImage(v) : COMMUNITY_VIDEO_POSTER} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={v ? filmFocus(v) : { left: '70%', top: '40%' }} transition={reduced ? 0 : 200} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors /></Animated.View>
      </View>)}
    </ScrollView>
    <ReaderMaterialGradient pointerEvents="none" colors={['#120D0AD1', '#120D0A0D', '#120D0A1F', '#120D0AF0', GROUND]} locations={[0, .22, .44, .8, 1]} style={StyleSheet.absoluteFill} />

    <View pointerEvents="box-none" style={{ position: 'absolute', left: 20, right: 20, top: topInset + 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <RNText accessibilityRole="header" style={nunito(800, 18, { color: INK })}>Closer <RNText style={{ color: GOLD }}>{t.shortsBrand}</RNText></RNText>
      <Pressable accessibilityRole="button" accessibilityLabel={t.profile} onPress={onMe}><Face person={me} size={42} ring="#FFFFFFCC" /></Pressable>
    </View>

    <View pointerEvents="box-none" style={{ position: 'absolute', left: 22, right: 22, bottom: 30, alignItems: 'center' }}>
      <Animated.View key={f?.id ?? 'preview'} entering={reduced ? undefined : FadeIn.duration(260)} exiting={reduced ? undefined : FadeOut.duration(120)} style={{ alignItems: 'center' }} pointerEvents="none">
        <RNText style={nunito(600, 11, { color: '#FFFFFFD9', letterSpacing: 2, textTransform: 'uppercase' })}>
          {!f ? t.comingSoon : i === 0 ? <><RNText style={{ fontFamily: 'NunitoBlack', color: GOLD }}>{t.newFilm} </RNText>{t.streaming}</> : fill(t.shortN, { n: filmNumber(f, all) })}
        </RNText>
        <View style={{ marginTop: 12, width: '100%' }}><FilmTitle title={f?.title ?? COMMUNITY_VIDEO_PREVIEW.title} size="hero" /></View>
      </Animated.View>
      {f && <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={fill(url ? t.watchA11y : t.soonA11y, { title: f.title })} disabled={opening || !url} onPress={() => void watch()} style={{ height: 52, opacity: url ? 1 : 0.85 }}>
          <View style={st.watchLip} />
          <View style={[st.watch, { opacity: opening ? .7 : 1 }]}>
            <Svg width={14} height={14} viewBox="0 0 16 16"><Path d="M4 2.5v11l9-5.5z" fill="#17120F" /></Svg>
            <RNText style={nunito(800, 17, { color: '#17120F' })}>{opening ? t.opening : url ? t.watch : t.comingSoon}</RNText>
          </View>
        </Pressable>
        <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={fill(t.about, { title: f.title })} onPress={() => onInfo(f)} style={st.info}>
          <SFSymbol name="info.circle" size={22} color="#FFFFFF" />
        </Pressable>
      </View>}
      {films.length > 1 && <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }} accessibilityRole="tablist">
        {films.map((v, k) => <Pressable key={v.id} accessibilityRole="tab" accessibilityLabel={v.title} accessibilityState={{ selected: k === i }} hitSlop={8} onPress={() => go(k)}
          style={{ height: 7, width: k === i ? 22 : 7, borderRadius: 4, backgroundColor: k === i ? '#FFFFFF' : '#FFFFFF59' }} />)}
      </View>}
    </View>
  </View>;
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  h2: nunito(900, 22, { color: K.ink, letterSpacing: -0.4 }),
  count: nunito(800, 13.5, { color: K.inkFaint }),
  poster: { width: 132, height: 198, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#2A1E17', justifyContent: 'flex-end' },
  posterTitle: nunito(800, 15, { color: '#FFFFFF', lineHeight: 17, padding: 10 }),
  newTag: { position: 'absolute', left: 8, top: 8, backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  ask: { height: 64, borderRadius: 22, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FBE6E0' },
  askLip: { position: 'absolute', left: 0, right: 0, top: 5, height: 64, borderRadius: 22, backgroundColor: '#E8B9AC' },
  askIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8A08F', alignItems: 'center', justifyContent: 'center' },
  mine: { height: 36, borderRadius: 18, paddingHorizontal: 16, justifyContent: 'center' },
  watch: { height: 52, borderRadius: 16, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: K.cream },
  watchLip: { position: 'absolute', left: 0, right: 0, top: 4, height: 52, borderRadius: 16, backgroundColor: '#00000066' },
  info: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF29', alignItems: 'center', justifyContent: 'center' },
});

export function GroupCover({ group, onOpen, small }: { group: StudyGroup; onOpen: () => void; small?: boolean }) {
  const me = useMe(), book = findBookById(group.bookId), cover = paintedCover(group.bookId), t = tone(cover?.color ?? '#5B4A9A');
  const members = group.members.map(m => memberFor(m, me)), w = small ? 200 : 250, h = small ? 240 : 300;
  const s = useStrings().native.community;
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`${group.name}. ${book?.name} ${group.chapter}. ${plural(members.length, s.reading)}`} onPress={() => { haptics.soft(); onOpen(); }}
    style={{ width: w, height: h, borderRadius: radius.card, overflow: 'hidden', backgroundColor: t.deep, boxShadow: 'inset 0 1px 0 #FFFFFF1F, 0 20px 34px -20px #000' }}>
    {cover && <Image source={cover.source} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill}/>}
    <ReaderMaterialGradient pointerEvents="none" colors={[`${t.deep}00`, `${t.deep}CC`, t.deep]} locations={[.3, .62, 1]} style={StyleSheet.absoluteFill}/>
    {!!group.mine && <View style={{ position: 'absolute', right: 12, top: 12, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: '#FFF8F2', justifyContent: 'center' }}><Text style={{ fontSize: 12, fontWeight: '900', color: t.deep }}>{s.yours}</Text></View>}
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
      <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: .9, color: t.t3 }}>{`${book?.name ?? ''} ${group.chapter}`.toUpperCase()} · {group.schedule.toUpperCase()}</Text>
      <Text numberOfLines={2} style={{ marginTop: 3, fontSize: small ? 18 : 21, lineHeight: small ? 22 : 25, fontWeight: '900', letterSpacing: -.3, color: t.t1 }}>{group.name}</Text>
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Faces people={members.slice(0, 4)} ring={t.deep}/><Text style={{ fontSize: 13, fontWeight: '700', color: t.t2 }}>{plural(members.length, s.reading)}</Text></View>
    </View>
  </Pressable>;
}

/** A prayer on the wall, in the asker's colour. */
function PrayerRow({ note, prayed, onOpen, onPray }: { note: PrayerNote; prayed: boolean; onOpen: () => void; onPray: () => void }) {
  const me = useMe(), p = note.mine ? me : personFor(note.author), t = tone(p.color), count = note.count + Number(prayed);
  const s = useStrings().native.community;
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`${note.mine ? s.prayerFromYou : fill(s.prayerFrom, { name: p.name })} ${note.text}`} onPress={() => { haptics.soft(); onOpen(); }}
    style={{ marginHorizontal: 16, marginBottom: 10, minHeight: 112, borderRadius: radius.card, overflow: 'hidden', flexDirection: 'row', backgroundColor: mix(p.color, '#000000', .4), boxShadow: 'inset 0 1px 0 #FFFFFF1F' }}>
    <View style={{ width: 96, alignItems: 'center', paddingTop: 18, backgroundColor: mix(p.color, '#000000', .55) }}><Face person={p} size={58} ring={t.t3}/></View>
    <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: t.t1, flex: 1 }}>{note.mine ? s.you : p.name}</Text>
        {note.tag !== 'Request' && <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#FFFFFF26', justifyContent: 'center' }}><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: .6, color: '#FFFFFF' }}>{((s.tags as Record<string, string>)[note.tag] ?? note.tag).toUpperCase()}</Text></View>}
      </View>
      <Text numberOfLines={3} style={{ marginTop: 4, fontSize: 15, lineHeight: 21, fontWeight: '700', color: t.t2 }}>{note.text}</Text>
      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: t.t3 }}>{note.age === 'Now' ? s.now : note.age}{count ? (prayed ? plural(count - 1, s.youAndPraying) : plural(count, s.praying)) : ''}</Text>
        <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={prayed ? s.youPrayed : note.mine ? s.prayForYourself : fill(s.prayFor, { name: p.name })} accessibilityState={{ disabled: prayed }} disabled={prayed} onPress={onPray} hitSlop={6}
          style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: prayed ? '#FFFFFF29' : '#FFFFFFEB' }}>
          <SFSymbol name={prayed ? 'checkmark' : 'heart.fill'} size={13} color={prayed ? '#FFFFFF' : t.deep}/>
          <Text style={{ fontSize: 14, fontWeight: '700', color: prayed ? '#FFFFFF' : t.deep }}>{prayed ? s.prayed : s.pray}</Text>
        </Pressable>
      </View>
    </View>
  </Pressable>;
}
