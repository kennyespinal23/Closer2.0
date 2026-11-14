import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';
export type CommunityVideo = { id: string; title: string; watch_url: string; thumbnail_url: string; published_at: string; synopsis?: string; instagram_url?: string | null; tiktok_url?: string | null; youtube_url?: string | null;
  /** bundled films: the poster in the app, and where to centre it when cropped */
  poster?: number; focus?: { left: string; top: string } };

/**
 * Closer Shorts bundled in the app (test content): shown when the films table has nothing (or can't be reached), so
 * Community always has films. Links are added when the films are posted; until then Watch says they're coming.
 */
export const LOCAL_FILMS: CommunityVideo[] = [
  { id: "local-i-got-lost", title: "I Got lost on the way", watch_url: "", thumbnail_url: "", published_at: "2026-11-09T12:00:00Z", poster: require("@/assets/films/i-got-lost.jpg"), focus: { left: "70%", top: "40%" },
    synopsis: "After six hours searching the ocean, a rescue officer finally finds a missing family.\nBut instead of going home, he stays out in the dark with Jesus.\nThere, he admits something he’s never been able to say out loud." },
  { id: "local-reach-for-me", title: "Reach for Me", watch_url: "", thumbnail_url: "", published_at: "2026-11-02T12:00:00Z", poster: require("@/assets/films/reach-for-me.jpg"), focus: { left: "56%", top: "50%" },
    synopsis: "A man trying to quit drinking sits in the rain outside the bar, bottle in hand. Jesus sits down beside him." },
  { id: "local-i-cant-sleep", title: "I Can’t Sleep", watch_url: "", thumbnail_url: "", published_at: "2026-10-26T12:00:00Z", poster: require("@/assets/films/i-cant-sleep.jpg"), focus: { left: "50%", top: "38%" },
    synopsis: "Late at night, with the lamp still on, a boy lies awake and can’t stop thinking." },
  { id: "local-the-gift", title: "The Gift", watch_url: "", thumbnail_url: "", published_at: "2026-10-19T12:00:00Z", poster: require("@/assets/films/the-gift.jpg"), focus: { left: "42%", top: "50%" },
    synopsis: "A girl waits in the wings, looking out at the lights on the stage." },
];

/** The image for a film: its bundled poster, or its thumbnail from the films table. */
export const filmImage = (v: CommunityVideo) => (v.poster ?? { uri: v.thumbnail_url });
export const filmFocus = (v: CommunityVideo) => v.focus ?? { left: "70%", top: "40%" };
export const COMMUNITY_VIDEO_PREVIEW = {
  title: 'I Got lost on the way',
  synopsis: 'After six hours searching the ocean, a rescue officer finally finds a missing family.\nBut instead of going home, he stays out in the dark with Jesus.\nThere, he admits something he’s never been able to say out loud.',
};
export const COMMUNITY_VIDEO_POSTER = require('@/assets/community/video-preview-lighthouse.jpg');
const CACHE_KEY = 'closer.community-videos.v2';
let cached: CommunityVideo[] = [];
let request: Promise<CommunityVideo[]> | null = null;
export function validCommunityVideo(value: unknown): value is CommunityVideo {
  if (!value || typeof value !== 'object') return false;
  const v = value as CommunityVideo;
  return typeof v.id === 'string' && typeof v.title === 'string' && !!v.title.trim() && v.title.length <= 120 &&
    [v.watch_url, v.thumbnail_url].every(url => { try { return new URL(url).protocol === 'https:'; } catch { return false; } }) &&
    Number.isFinite(Date.parse(v.published_at)) && Date.parse(v.published_at) <= Date.now();
}
async function refresh() {
  if (request) return request;
  request = (async () => {
    const client = getSupabase();
    if (!client) return cached;
    const catalog: CommunityVideo[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await client.from('community_videos').select('id,title,watch_url,thumbnail_url,published_at,synopsis,instagram_url,tiktok_url,youtube_url').eq('is_published', true).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 99);
      if (error) return cached; // Retain the full cached collection while offline.
      catalog.push(...(data ?? []).filter(validCommunityVideo));
      if (!data || data.length < 100) break;
    }
    cached = catalog;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached)).catch(() => {});
    return cached;
  })();
  try { return await request; } finally { request = null; }
}
/** Refresh when Community becomes visible or the app returns from the background. */
export function useCommunityVideos() {
  const [video, setVideo] = useState(cached);
  useFocusEffect(useCallback(() => {
    let live = true;
    const update = async () => { const next = await refresh().catch(() => cached); if (live) setVideo(next); };
    void (async () => {
      if (!cached.length) {
        try { const raw = await AsyncStorage.getItem(CACHE_KEY); const saved: unknown = raw ? JSON.parse(raw) : null; if (Array.isArray(saved)) { cached = saved.filter(validCommunityVideo); if (live) setVideo(cached); } } catch { /* Empty state is usable offline. */ }
      }
      if (live) await update();
    })();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void update(); });
    return () => { live = false; subscription.remove(); };
  }, []));
  return video.length ? video : LOCAL_FILMS;
}

/** Community keeps featuring the newest film; the video page offers the collection. */
export function useCommunityVideo() { return useCommunityVideos()[0] ?? null; }
