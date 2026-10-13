import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@/components/CloserText';
import { SOCIAL_APP_ICON_SOURCES } from '@/lib/socialAppIconAssets';
import type { CommunityVideo } from '@/lib/communityVideo';

/** Where a film can be watched, in the order we offer them. */
export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', key: 'instagram_url', icon: SOCIAL_APP_ICON_SOURCES.instagram },
  { id: 'tiktok', label: 'TikTok', key: 'tiktok_url', icon: SOCIAL_APP_ICON_SOURCES.tiktok },
  { id: 'youtube', label: 'YouTube', key: 'youtube_url', icon: SOCIAL_APP_ICON_SOURCES.youtube },
] as const;

export function platformsFor(video: CommunityVideo) {
  return PLATFORMS.flatMap(p => { const url = video[p.key]; return url ? [{ ...p, url }] : []; });
}
export const primaryPlatform = (video: CommunityVideo) => platformsFor(video)[0] ?? null;

/** Films are numbered from the first one ever published: the newest is the highest. */
export function filmNumber(video: CommunityVideo, all: CommunityVideo[]): string {
  const i = all.findIndex(v => v.id === video.id);
  return String(i < 0 ? 1 : all.length - i).padStart(2, '0');
}

/** Opens a film link in the in-app browser, which hands off to Instagram, TikTok or YouTube. */
export async function openFilm(url?: string | null): Promise<boolean> {
  if (!url) return false;
  try { if (new URL(url).protocol !== 'https:') return false; } catch { return false; }
  try { await WebBrowser.openBrowserAsync(url, { toolbarColor: '#120D0A', controlsColor: '#FFF1E4' }); return true; } catch { return false; }
}

/** The small gold Closer mark with a label: "NEW THIS WEEK", "FILM 07". */
export function FilmBadge({ label }: { label: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Svg width={16} height={16} viewBox="0 0 16 16"><Rect width={16} height={16} rx={4} fill="#E9B949"/><Path d="M10.6 5.2a3.6 3.6 0 1 0 0 5.6" fill="none" stroke="#17120F" strokeWidth={2.2} strokeLinecap="round"/></Svg>
    <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', color: '#E9B949' }}>{label}</Text>
  </View>;
}
