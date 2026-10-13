import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/CloserText';
import { BubbleBackButton } from '@/components/BubbleBackButton';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { SFSymbol } from '@/components/Symbol';
import { FilmBadge, filmNumber, openFilm, primaryPlatform } from '@/components/films';
import { COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW, useCommunityVideos, type CommunityVideo } from '@/lib/communityVideo';
import { uiText } from '@/lib/typography';
import { useReducedMotion } from '@/lib/useReducedMotion';
import * as haptics from '@/lib/haptics';

const ink = '#FFF1E4', muted = '#D8BDA5', gold = '#E9B949', ground = '#120D0A';
const ROTATE_MS = 5000;

/**
 * Closer Shorts, laid out like a streaming home: a billboard that rotates
 * through the newest films, then shelves of posters. Watching happens on
 * Instagram, TikTok or YouTube; every film also has its own page.
 */
export default function VideosScreen() {
  const router = useRouter(), videos = useCommunityVideos(), focused = useIsFocused();
  const insets = useSafeAreaInsets(), { width } = useWindowDimensions(), reduced = useReducedMotion();
  const featured = videos.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [opening, setOpening] = useState(false);
  const progress = useSharedValue(0);
  const current = featured[index] ?? null;

  // Rotate the billboard while the screen is visible; each bar fills as its film plays.
  useEffect(() => {
    if (!focused || featured.length < 2) { cancelAnimation(progress); progress.value = 0; return; }
    progress.value = 0;
    progress.value = withTiming(1, { duration: ROTATE_MS, easing: Easing.linear });
    const timer = setTimeout(() => setIndex(i => (i + 1) % featured.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, focused, featured.length, progress]);
  useEffect(() => { if (index >= featured.length) setIndex(0); }, [featured.length, index]);

  const open = (video: CommunityVideo) => { haptics.soft(); router.push({ pathname: '/community-video', params: { id: video.id } }); };
  const watch = async (video: CommunityVideo) => {
    if (opening) return;
    setOpening(true);
    try { await openFilm(primaryPlatform(video)?.url ?? video.watch_url); } finally { setOpening(false); }
  };
  const posterW = Math.min(124, (width - 40 - 20) / 3.2);

  return <View style={{ flex: 1, backgroundColor: ground }}>
    {focused && <StatusBar style="light" />}
    <Stack.Screen options={{ headerShown: false, animation: reduced ? 'fade' : 'slide_from_right' }} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      {/* the billboard */}
      <View style={{ height: Math.max(520, Math.min(620, width * 1.42)), overflow: 'hidden' }}>
        {featured.length ? featured.map((video, i) => <BillboardLayer key={video.id} video={video} shown={i === index} reduced={reduced}/>) :
          <Image source={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} style={StyleSheet.absoluteFill}/>}
        <ReaderMaterialGradient colors={['#120D0AF5', '#120D0AD1', '#120D0A59', '#120D0A00', '#120D0A80', '#120D0AE6', ground]} locations={[0, .14, .26, .34, .58, .78, 1]} style={StyleSheet.absoluteFill}/>
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <BubbleBackButton color={ink} backgroundColor="#120D0A66" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/community')}/>
          <Text accessibilityRole="header" style={s.wordmark}>Closer <Text style={{ color: gold }}>Shorts</Text></Text>
          <View style={{ width: 44 }}/>
        </View>
        <View style={s.billboardCopy}>
          <View key={current?.id ?? 'preview'} style={{ alignItems: 'center' }}>
            <FilmBadge label={current ? (index === 0 ? 'New this week' : `Short ${filmNumber(current, videos)}`) : 'Coming soon'}/>
            <Text style={s.billboardTitle}>{current?.title ?? COMMUNITY_VIDEO_PREVIEW.title}</Text>
            {!!current && <Text style={s.meta}>{new Date(current.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
          </View>
          {current && <View style={s.actions}>
            <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Watch ${current.title}`} disabled={opening} onPress={() => void watch(current)} style={[s.play, { opacity: opening ? .7 : 1 }]}>
              <SFSymbol name="play.fill" size={16} color="#17120F"/><Text style={s.playText}>{opening ? 'Opening…' : 'Watch'}</Text>
            </Pressable>
            <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`The story of ${current.title}`} onPress={() => open(current)} style={s.secondary}>
              <SFSymbol name="info.circle" size={18} color={ink}/><Text style={[s.playText, { color: ink }]}>The story</Text>
            </Pressable>
          </View>}
          {featured.length > 1 && <View style={s.bars} accessibilityElementsHidden>
            {featured.map((video, i) => <Pressable key={video.id} hitSlop={10} onPress={() => { haptics.tick(); setIndex(i); }} style={s.bar}>
              <BarFill progress={progress} state={i < index ? 'done' : i === index ? 'active' : 'idle'}/>
            </Pressable>)}
          </View>}
        </View>
      </View>

      {/* shelves */}
      {videos.length > 0 && <Shelf title="New from Closer" films={videos.slice(0, 8)} all={videos} width={posterW} onOpen={open}/>}
      {videos.length > 8 && <Shelf title="Earlier shorts" films={videos.slice(8)} all={videos} width={posterW} onOpen={open}/>}
      {!videos.length && <Text style={[uiText.body, { color: muted, paddingHorizontal: 24, marginTop: 16 }]}>New shorts arrive on Sundays. The first one is on its way.</Text>}
    </ScrollView>
  </View>;
}

/** One film on the billboard: cross-fades in and settles with a slow zoom. */
function BillboardLayer({ video, shown, reduced }: { video: CommunityVideo; shown: boolean; reduced: boolean }) {
  const t = useSharedValue(shown ? 1 : 0);
  useEffect(() => { t.value = withTiming(shown ? 1 : 0, { duration: reduced ? 200 : 800, easing: Easing.inOut(Easing.cubic) }); }, [shown, reduced, t]);
  const zoom = useSharedValue(1.1);
  useEffect(() => { if (shown && !reduced) { zoom.value = 1.1; zoom.value = withTiming(1, { duration: ROTATE_MS + 800, easing: Easing.out(Easing.quad) }); } }, [shown, reduced, zoom]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: reduced ? 1 : zoom.value }] }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
    <Image source={{ uri: video.thumbnail_url }} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} transition={0} style={StyleSheet.absoluteFill}/>
  </Animated.View>;
}

function BarFill({ progress, state }: { progress: { value: number }; state: 'done' | 'active' | 'idle' }) {
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: state === 'done' ? 1 : state === 'active' ? progress.value : 0 }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: ink, transformOrigin: 'left' }, style]}/>;
}

/** A shelf of tall posters with the title printed on the art. */
function Shelf({ title, films, all, width, onOpen }: { title: string; films: CommunityVideo[]; all: CommunityVideo[]; width: number; onOpen: (v: CommunityVideo) => void }) {
  return <View style={{ marginTop: 26 }}>
    <Text accessibilityRole="header" style={s.shelfTitle}>{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
      {films.map(video => <Pressable key={video.id} accessibilityRole="button" accessibilityLabel={`${video.title}. Short ${filmNumber(video, all)}`} onPress={() => onOpen(video)} style={[s.poster, { width, height: width * 1.5 }]}>
        <Image recyclingKey={video.id} source={{ uri: video.thumbnail_url }} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} style={StyleSheet.absoluteFill}/>
        <ReaderMaterialGradient colors={['#120D0A00', '#120D0AEB']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}/>
        {video.id === all[0]?.id && <View style={s.newTag}><Text style={s.newText}>New</Text></View>}
        <Text numberOfLines={3} style={s.posterTitle}>{video.title}</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  header: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { ...uiText.sectionTitle, fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: -.5, color: ink },
  billboardCopy: { position: 'absolute', left: 20, right: 20, bottom: 10, alignItems: 'center' },
  billboardTitle: { ...uiText.screenTitle, fontSize: 40, lineHeight: 42, letterSpacing: -1.2, color: ink, textAlign: 'center', marginTop: 10 },
  meta: { ...uiText.supporting, fontWeight: '700', color: muted, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' },
  play: { flex: 1, height: 52, borderRadius: 14, borderCurve: 'continuous', backgroundColor: ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondary: { flex: 1, height: 52, borderRadius: 14, borderCurve: 'continuous', backgroundColor: '#FFF1E429', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  playText: { ...uiText.body, fontWeight: '800', color: '#17120F' },
  bars: { flexDirection: 'row', gap: 6, marginTop: 18 },
  bar: { width: 22, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: '#FFF1E440' },
  shelfTitle: { ...uiText.sectionTitle, fontSize: 20, lineHeight: 24, fontWeight: '900', color: ink, marginHorizontal: 20, marginBottom: 12 },
  poster: { borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#2A1E17', justifyContent: 'flex-end' },
  posterTitle: { ...uiText.supporting, fontSize: 15, lineHeight: 16, fontWeight: '900', color: ink, padding: 9 },
  newTag: { position: 'absolute', left: 7, top: 7, height: 20, paddingHorizontal: 7, borderRadius: 6, backgroundColor: '#B82A15', justifyContent: 'center' },
  newText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
});

