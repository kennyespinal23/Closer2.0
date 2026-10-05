import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/CloserText';
import { CloseButton } from '@/components/CloseButton';
import { BubbleBackButton } from '@/components/BubbleBackButton';
import { FeedbackPressable as Pressable } from '@/components/FeedbackPressable';
import { SFSymbol } from '@/components/Symbol';
import { useCommunityVideos, COMMUNITY_VIDEO_POSTER, COMMUNITY_VIDEO_PREVIEW } from '@/lib/communityVideo';
import { ReaderMaterialGradient } from '@/components/ReaderMaterialGradient';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { contentLayout } from '@/lib/contentStyles';
import { uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { SOCIAL_APP_ICON_SOURCES } from '@/lib/socialAppIconAssets';
import { paperActionColors } from '@/lib/paperControls';

/** A stable destination for Community's weekly film, including the pre-release state. */
export default function CommunityVideoScreen() {
  const router = useRouter(), videos = useCommunityVideos(), reduced = useReducedMotion();
  const [collectionOpen, setCollectionOpen] = useState(false), [selectedId, setSelectedId] = useState<string | null>(null);
  const video = videos.find(item => item.id === selectedId) ?? videos[0] ?? null;
  const collection: { id: string; title: string; thumbnail_url: string | null }[] = videos.length ? videos : [{ ...COMMUNITY_VIDEO_PREVIEW, id: 'preview', thumbnail_url: null }];
  const scroll = useRef<ScrollView>(null);
  const focused = useIsFocused();
  const action = paperActionColors(true);
  const bg = '#080B12', ink = '#FFF4E5', muted = '#E2D9CC', surface = '#00000055';
  const [opening, setOpening] = useState(false), [error, setError] = useState('');
  const launching = useRef(false);
  const back = () => router.canGoBack() ? router.back() : router.replace('/community');
  const watch = async (url = video?.watch_url) => {
    if (!url || launching.current) return;
    try { if (new URL(url).protocol !== 'https:') return; } catch { return; }
    launching.current = true; setOpening(true); setError('');
    try { await WebBrowser.openBrowserAsync(url, { toolbarColor: bg, controlsColor: ink }); }
    catch { setError('The video couldn’t open. Please try again.'); }
    finally { launching.current = false; setOpening(false); }
  };
  return <View style={{ flex: 1, backgroundColor: bg }}>
    {focused && <StatusBar style="light" />}
    <Stack.Screen options={{ animation: reduced ? 'fade' : 'slide_from_right' }} />
    <Image accessible={false} source={video ? { uri: video.thumbnail_url } : COMMUNITY_VIDEO_POSTER} placeholder={video ? undefined : COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '76%', top: '50%' }} transition={reduced ? 0 : 180} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#00000026' }]} />
    <ReaderMaterialGradient colors={['#00000035', '#00000008', '#00000085', '#000000E0']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={{ flex: 1 }}>
    <View style={s.header}><BubbleBackButton onPress={back} color={ink} backgroundColor={surface} accessibilityLabel="Back to Community" /><View style={{ flex: 1, alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel="New, browse all videos" accessibilityState={{ expanded: collectionOpen }} onPress={() => setCollectionOpen(true)} style={[s.selector, { backgroundColor: surface }]}><Text style={[buttonStyles.label, { color: ink }]}>New</Text><SFSymbol name="chevron.down" size={13} color={ink} /></Pressable></View><View style={{ width: 44 }} /></View>
    <ScrollView ref={scroll} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={{ gap: 12 }}><Text accessibilityRole="header" style={[uiText.screenTitle, { color: ink }]}>{video?.title ?? COMMUNITY_VIDEO_PREVIEW.title}</Text></View>
      {!!(video ? video.synopsis : COMMUNITY_VIDEO_PREVIEW.synopsis) && <Text selectable style={[uiText.body, { color: muted, lineHeight: 27 }]}>{video ? video.synopsis : COMMUNITY_VIDEO_PREVIEW.synopsis}</Text>}
      <View style={s.socials}>{([
        { id: 'instagram', label: 'Instagram', url: video?.instagram_url },
        { id: 'tiktok', label: 'TikTok', url: video?.tiktok_url },
        { id: 'youtube', label: 'YouTube', url: video?.youtube_url },
      ] as const).map(platform => <Pressable key={platform.id} accessibilityRole="button" accessibilityLabel={`${platform.label}${platform.url ? ', watch video' : ', video link coming soon'}`} accessibilityState={{ disabled: !platform.url || opening }} disabled={!platform.url || opening} onPress={() => void watch(platform.url ?? undefined)} style={s.social}><Image source={SOCIAL_APP_ICON_SOURCES[platform.id]} contentFit="contain" style={s.socialIcon} /><Text style={{ color: muted, fontSize: 13, fontWeight: '800' }}>{platform.label}</Text></Pressable>)}</View>
    </ScrollView>
    {video && <View style={s.footer}>{!!error && <Text accessibilityLiveRegion="polite" style={[uiText.supporting, { color: ink }]}>{error}</Text>}<Pressable feedback="action" accessibilityRole="button" accessibilityState={{ disabled: !video || opening }} disabled={!video || opening} onPress={() => void watch()} style={[buttonStyles.primary, { backgroundColor: video ? action.backgroundColor : surface, flexDirection: 'row', gap: 10 }]}>{video && <SFSymbol name="play.fill" size={18} color={action.color} />}<Text style={[buttonStyles.label, { color: video ? action.color : muted }]}>{opening ? 'Opening…' : video ? 'Watch video' : 'Coming soon'}</Text></Pressable></View>}
  </SafeAreaView>
    <Modal visible={collectionOpen} presentationStyle="pageSheet" animationType={reduced ? 'fade' : 'slide'} onRequestClose={() => setCollectionOpen(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#211D19' }} edges={['top', 'bottom']}>
        <View style={[s.header, { paddingTop: 24 }]}><Text accessibilityRole="header" style={[uiText.sectionTitle, { color: ink, flex: 1 }]}>All videos</Text><CloseButton color={ink} style={{ backgroundColor: '#302920' }} onPress={() => setCollectionOpen(false)} accessibilityLabel="Close video collection" /></View>
        <FlatList data={collection} numColumns={2} keyExtractor={item => item.id} columnWrapperStyle={{ gap: 16 }} contentContainerStyle={{ padding: 24, gap: 24 }} renderItem={({ item, index }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}${index === 0 ? ', newest video' : ''}`} accessibilityState={{ selected: item.id === (video?.id ?? 'preview') }} onPress={() => { setSelectedId(item.id); setError(''); scroll.current?.scrollTo({ y: 0, animated: false }); setCollectionOpen(false); }} style={{ flex: 1, maxWidth: '48%', gap: 10 }}>
          <View style={{ aspectRatio: 3 / 4, borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#302920', borderWidth: item.id === (video?.id ?? 'preview') ? 2 : 0, borderColor: ink }}><Image source={item.thumbnail_url ? { uri: item.thumbnail_url } : COMMUNITY_VIDEO_POSTER} contentFit="cover" contentPosition={{ left: '76%', top: '50%' }} style={StyleSheet.absoluteFill} />{index === 0 && <View style={{ position: 'absolute', left: 10, top: 10, backgroundColor: '#000000B3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color: ink, fontSize: 12, fontWeight: '800' }}>New</Text></View>}</View>
          <Text style={{ color: ink, fontSize: 17, lineHeight: 23, fontWeight: '800' }}>{item.title}</Text>
        </Pressable>} />
      </SafeAreaView>
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: contentLayout.gutter, paddingTop: contentLayout.screenTop, paddingBottom: 20, gap: 12 },
  selector: { minHeight: 44, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
  content: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: contentLayout.gutter, paddingTop: 180, paddingBottom: 24, gap: 20 },
  socials: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingTop: 8 },
  social: { minWidth: 60, minHeight: 76, alignItems: 'center', gap: 10 },
  socialIcon: { width: 44, height: 44, borderRadius: 12, borderCurve: 'continuous' },
  footer: { paddingHorizontal: contentLayout.gutter, paddingTop: 12, paddingBottom: 16, gap: 12 },
});
