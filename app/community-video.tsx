import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/CloserText';
import { BubbleBackButton } from '@/components/BubbleBackButton';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { SFSymbol } from '@/components/Symbol';
import { FilmBadge, filmNumber, openFilm, platformsFor } from '@/components/films';
import { useCommunityVideos, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW, type CommunityVideo } from '@/lib/communityVideo';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { uiText } from '@/lib/typography';
import * as haptics from '@/lib/haptics';

const ink = '#FFF1E4', muted = '#D8BDA5', ground = '#120D0A';

/** One film's page: poster, story, and the apps you can watch it on. Also the pre-release state. */
export default function CommunityVideoScreen() {
  const router = useRouter(), videos = useCommunityVideos(), reduced = useReducedMotion(), focused = useIsFocused();
  const insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const video = videos.find(item => item.id === id) ?? (id === 'preview' ? null : videos[0]) ?? null;
  const [opening, setOpening] = useState(false), [error, setError] = useState('');
  const launching = useRef(false);
  const back = () => router.canGoBack() ? router.back() : router.replace('/videos');
  const watch = async (url?: string | null) => {
    if (!url || launching.current) return;
    launching.current = true; setOpening(true); setError('');
    const ok = await openFilm(url);
    if (!ok) setError('The short couldn’t open. Please try again.');
    launching.current = false; setOpening(false);
  };
  const platforms = video ? platformsFor(video) : [];
  const [main, ...others] = platforms;
  const mainUrl = main?.url ?? video?.watch_url;
  const more = video ? videos.filter(v => v.id !== video.id).slice(0, 3) : [];
  const title = video?.title ?? COMMUNITY_VIDEO_PREVIEW.title;
  const synopsis = video ? video.synopsis : COMMUNITY_VIDEO_PREVIEW.synopsis;
  const share = () => { if (!video) return; haptics.soft(); void Share.share({ message: `${video.title}, a Closer Short\n${mainUrl ?? ''}`.trim() }); };
  const openOther = (other: CommunityVideo) => { haptics.soft(); router.replace({ pathname: '/community-video', params: { id: other.id } }); };
  const posterH = Math.min(440, width * 1.05);

  return <View style={{ flex: 1, backgroundColor: ground }}>
    {focused && <StatusBar style="light" />}
    <Stack.Screen options={{ headerShown: false, animation: reduced ? 'fade' : 'slide_from_right' }} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={{ height: posterH }}>
        <Image accessible={false} source={video ? { uri: video.thumbnail_url } : COMMUNITY_VIDEO_POSTER} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} transition={reduced ? 0 : 180} style={StyleSheet.absoluteFill} />
        <ReaderMaterialGradient colors={['#120D0AA6', '#120D0A00', '#120D0A00', ground]} locations={[0, .22, .5, 1]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: -64, gap: 10 }}>
        <FilmBadge label={video ? `Short ${filmNumber(video, videos)}` : 'Coming soon'}/>
        <Text accessibilityRole="header" style={s.title}>{title}</Text>
        {video && <Text style={s.meta}>{new Date(video.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>}

        {video ? <>
          <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={main ? `Watch on ${main.label}` : 'Watch the short'} disabled={opening || !mainUrl} onPress={() => void watch(mainUrl)} style={[s.watch, { opacity: opening ? .7 : 1 }]}>
            {main ? <Image source={main.icon} contentFit="contain" style={s.watchIcon}/> : <SFSymbol name="play.fill" size={16} color="#17120F"/>}
            <Text style={s.watchText}>{opening ? 'Opening…' : main ? `Watch on ${main.label}` : 'Watch the short'}</Text>
          </Pressable>
          {others.length > 0 && <View style={{ flexDirection: 'row', gap: 10 }}>
            {others.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Watch on ${p.label}`} disabled={opening} onPress={() => void watch(p.url)} style={s.alt}>
              <Image source={p.icon} contentFit="contain" style={{ width: 20, height: 20, borderRadius: 5 }}/>
              <Text style={{ ...uiText.supporting, fontWeight: '800', color: ink }}>{p.label}</Text>
            </Pressable>)}
          </View>}
          <View style={s.icons}>
            <Pressable accessibilityRole="button" accessibilityLabel="Share this short" onPress={share} style={s.iconBtn}><SFSymbol name="square.and.arrow.up" size={21} color={ink}/><Text style={s.iconLabel}>Share</Text></Pressable>
          </View>
        </> : <View style={[s.watch, { backgroundColor: '#FFF1E429' }]}><Text style={[s.watchText, { color: muted }]}>Coming soon</Text></View>}

        {!!error && <Text accessibilityLiveRegion="polite" style={[uiText.supporting, { color: ink }]}>{error}</Text>}
        {!!synopsis && <Text selectable style={s.body}>{synopsis}</Text>}

        {more.length > 0 && <>
          <Text accessibilityRole="header" style={s.moreTitle}>More like this</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {more.map(other => <Pressable key={other.id} accessibilityRole="button" accessibilityLabel={other.title} onPress={() => openOther(other)} style={[s.poster, { width: (width - 40 - 16) / 3 }]}>
              <Image recyclingKey={other.id} source={{ uri: other.thumbnail_url }} placeholder={COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '70%', top: '40%' }} style={StyleSheet.absoluteFill}/>
              <ReaderMaterialGradient colors={['#120D0A00', '#120D0AEB']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}/>
              <Text numberOfLines={3} style={s.posterTitle}>{other.title}</Text>
            </Pressable>)}
          </View>
        </>}
      </View>
    </ScrollView>
    <View style={[s.bar, { top: insets.top + 4 }]}><BubbleBackButton onPress={back} color={ink} backgroundColor="#120D0A66" accessibilityLabel="Back to Closer Shorts" /></View>
  </View>;
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 16 },
  title: { ...uiText.screenTitle, fontSize: 34, lineHeight: 36, letterSpacing: -.9, color: ink },
  meta: { ...uiText.supporting, fontWeight: '700', color: muted },
  watch: { marginTop: 8, height: 54, borderRadius: 14, borderCurve: 'continuous', backgroundColor: ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  watchIcon: { width: 24, height: 24, borderRadius: 6 },
  watchText: { ...uiText.body, fontWeight: '800', color: '#17120F' },
  alt: { flex: 1, height: 46, borderRadius: 12, borderCurve: 'continuous', backgroundColor: '#FFF1E41A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  icons: { flexDirection: 'row', gap: 28, marginTop: 8, paddingLeft: 4 },
  iconBtn: { minWidth: 44, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  iconLabel: { fontSize: 12, fontWeight: '700', color: muted },
  body: { ...uiText.body, fontSize: 16, lineHeight: 25, color: '#E9D9C6', marginTop: 8 },
  moreTitle: { ...uiText.sectionTitle, fontSize: 18, lineHeight: 22, fontWeight: '900', color: ink, marginTop: 18 },
  poster: { aspectRatio: 2 / 3, borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#2A1E17', justifyContent: 'flex-end' },
  posterTitle: { fontSize: 14, lineHeight: 15, fontWeight: '900', color: ink, padding: 8 },
});
