import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable as RNPressable, ScrollView, Share, StyleSheet, Text as RNText, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { SFSymbol } from '@/components/Symbol';
import { K, nunito } from '@/components/closer/kit';
import { openFilm, platformsFor } from '@/components/films';
import { FilmTitle } from '@/components/FilmTitle';
import { useCommunityVideos, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW, type CommunityVideo } from '@/lib/communityVideo';
import { useReducedMotion } from '@/lib/useReducedMotion';
import * as haptics from '@/lib/haptics';

const INK = '#F4ECE1', SOFT = '#F4ECE1BF', GROUND = '#120D0A', SHEET = '#211915';
const SAVED = 'closer.films.saved.v1';

/**
 * One film's page (CLOSER-PICKS.md, "Film page"): a full page sliding up; the poster moving slowly; the title centred
 * with the year under it; Watch, which asks where (each app leaves Closer); Save and Share; the whole story; more films.
 */
export default function CommunityVideoScreen() {
  const router = useRouter(), videos = useCommunityVideos(), reduced = useReducedMotion(), focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const video = videos.find(item => item.id === id) ?? (id === 'preview' ? null : videos[0]) ?? null;
  const [choose, setChoose] = useState(false), [opening, setOpening] = useState(false), [error, setError] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const launching = useRef(false);
  const close = () => router.canGoBack() ? router.back() : router.replace('/community' as never);

  useEffect(() => { void AsyncStorage.getItem(SAVED).then(v => { try { const a = v ? JSON.parse(v) : []; if (Array.isArray(a)) setSaved(a); } catch { /* fresh */ } }); }, []);
  const isSaved = !!video && saved.includes(video.id);
  const toggleSave = () => {
    if (!video) return;
    haptics.soft();
    const next = isSaved ? saved.filter(x => x !== video.id) : [...saved, video.id];
    setSaved(next); void AsyncStorage.setItem(SAVED, JSON.stringify(next));
  };

  const zoom = useSharedValue(1);
  useEffect(() => { if (!reduced) zoom.value = withRepeat(withTiming(1.1, { duration: 14000, easing: Easing.inOut(Easing.quad) }), -1, true); }, [reduced, zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  const places = video ? platformsFor(video) : [];
  const watch = async (url?: string | null) => {
    if (!url || launching.current) return;
    launching.current = true; setOpening(true); setError(''); setChoose(false);
    const ok = await openFilm(url);
    if (!ok) setError('The short couldn’t open. Please try again.');
    launching.current = false; setOpening(false);
  };
  const onWatch = () => { haptics.soft(); if (places.length > 1) setChoose(true); else void watch(places[0]?.url ?? video?.watch_url); };
  const share = () => { if (!video) return; haptics.soft(); void Share.share({ message: `${video.title}, a Closer Short\n${places[0]?.url ?? video.watch_url}`.trim() }); };
  const openOther = (other: CommunityVideo) => { haptics.soft(); router.replace({ pathname: '/community-video', params: { id: other.id } }); };

  const title = video?.title ?? COMMUNITY_VIDEO_PREVIEW.title;
  const synopsis = video ? video.synopsis : COMMUNITY_VIDEO_PREVIEW.synopsis;
  const year = video ? new Date(video.published_at).getFullYear() : null;
  const more = video ? videos.filter(v => v.id !== video.id) : [];

  return <View style={{ flex: 1, backgroundColor: GROUND }}>
    {focused && <StatusBar style="light" />}
    <Stack.Screen options={{ headerShown: false, animation: reduced ? 'fade' : 'slide_from_bottom' }} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <View style={{ height: 380, overflow: 'hidden' }}>
        <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
          <Image accessible={false} source={video ? { uri: video.thumbnail_url } : COMMUNITY_VIDEO_POSTER} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} transition={reduced ? 0 : 180} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <ReaderMaterialGradient pointerEvents="none" colors={['#120D0A8C', '#120D0A00', '#120D0A00', GROUND]} locations={[0, .3, .58, 1]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ paddingHorizontal: 22, marginTop: -44, alignItems: 'center' }}>
        <View style={{ width: '100%' }}><FilmTitle title={title} size="page" /></View>
        <RNText style={nunito(600, 14, { color: SOFT, marginTop: 8 })}>{video ? `${year} · Short film` : 'Coming soon'}</RNText>

        {video ? <>
          <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Watch ${title}`} disabled={opening} onPress={onWatch} style={{ alignSelf: 'stretch', height: 58, marginTop: 20 }}>
            <View style={st.watchLip} />
            <View style={[st.watch, { opacity: opening ? .7 : 1 }]}>
              <Svg width={14} height={14} viewBox="0 0 16 16"><Path d="M4 2.5v11l9-5.5z" fill="#17120F" /></Svg>
              <RNText style={nunito(800, 17, { color: '#17120F' })}>{opening ? 'Opening…' : 'Watch'}</RNText>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 48, marginTop: 16 }}>
            <RNPressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Saved. Tap to remove' : 'Save this short'} accessibilityState={{ selected: isSaved }} onPress={toggleSave} style={st.iconBtn}>
              <SFSymbol name={isSaved ? 'bookmark.fill' : 'bookmark'} size={21} color={isSaved ? K.gold : INK} />
              <RNText style={nunito(700, 12.5, { color: isSaved ? K.gold : INK })}>{isSaved ? 'Saved' : 'Save'}</RNText>
            </RNPressable>
            <RNPressable accessibilityRole="button" accessibilityLabel="Share this short" onPress={share} style={st.iconBtn}>
              <SFSymbol name="square.and.arrow.up" size={21} color={INK} />
              <RNText style={nunito(700, 12.5, { color: INK })}>Share</RNText>
            </RNPressable>
          </View>
        </> : null}
        {!!error && <RNText accessibilityLiveRegion="polite" style={nunito(700, 14, { color: INK, marginTop: 10 })}>{error}</RNText>}
        {!!synopsis && <RNText selectable style={nunito(600, 16.5, { color: '#E9D9C6', lineHeight: 26, marginTop: 22, alignSelf: 'stretch' })}>{synopsis}</RNText>}
      </View>

      {more.length > 0 && <>
        <RNText accessibilityRole="header" style={nunito(900, 20, { color: INK, letterSpacing: -0.4, marginTop: 30, paddingHorizontal: 22 })}>More films</RNText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 12, paddingTop: 12 }}>
          {more.map(other => <Pressable key={other.id} accessibilityRole="button" accessibilityLabel={other.title} onPress={() => openOther(other)} style={st.poster}>
            <Image recyclingKey={other.id} source={{ uri: other.thumbnail_url }} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} style={StyleSheet.absoluteFill} />
            <ReaderMaterialGradient pointerEvents="none" colors={['#00000000', '#000000C0']} locations={[.45, 1]} style={StyleSheet.absoluteFill} />
            <View style={{ paddingBottom: 9, width: '100%' }}><FilmTitle title={other.title} size="poster" /></View>
          </Pressable>)}
        </ScrollView>
      </>}
    </ScrollView>

    <View style={[st.bar, { top: insets.top + 6 }]}>
      <RNPressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={st.round}><SFSymbol name="xmark" size={17} weight="bold" color="#FFFFFF" /></RNPressable>
      {video && <RNPressable accessibilityRole="button" accessibilityLabel="Share" onPress={share} style={st.round}><SFSymbol name="square.and.arrow.up" size={18} weight="semibold" color="#FFFFFF" /></RNPressable>}
    </View>

    {/* Watch, then choose where */}
    <Modal visible={choose} transparent animationType={reduced ? 'fade' : 'slide'} onRequestClose={() => setChoose(false)}>
      <RNPressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setChoose(false)} style={{ flex: 1, backgroundColor: '#0000008C' }} />
      <View style={[st.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <RNText style={nunito(800, 20, { color: INK })}>Watch “{title}”</RNText>
        <RNText style={nunito(600, 14, { color: SOFT, marginTop: 2 })}>It opens in the app you choose.</RNText>
        <View style={{ gap: 8, marginTop: 14 }}>
          {places.map(p => <Pressable key={p.id} feedback="action" accessibilityRole="button" accessibilityLabel={`Watch on ${p.label}`} onPress={() => void watch(p.url)} style={st.place}>
            <Image source={p.icon} contentFit="contain" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <RNText style={nunito(800, 16, { color: INK, flex: 1 })}>{p.label}</RNText>
            <RNText style={nunito(700, 14, { color: SOFT })}>Watch ↗</RNText>
          </Pressable>)}
        </View>
        <RNPressable accessibilityRole="button" onPress={() => setChoose(false)} style={{ height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
          <RNText style={nunito(800, 15, { color: SOFT })}>Cancel</RNText>
        </RNPressable>
      </View>
    </Modal>
  </View>;
}

const st = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  watch: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: K.cream },
  watchLip: { position: 'absolute', left: 0, right: 0, top: 4, height: 54, borderRadius: 16, backgroundColor: '#00000066' },
  iconBtn: { minWidth: 56, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 5 },
  poster: { width: 112, height: 168, borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#2A1E17', justifyContent: 'flex-end' },
  sheet: { backgroundColor: SHEET, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 20 },
  place: { height: 58, borderRadius: 14, backgroundColor: '#FFFFFF12', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
});
