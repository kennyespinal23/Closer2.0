// services/unsplashService.js
//
// Daily image fetcher backed by Unsplash. Caches one image per
// (day, calendar-date) so we burn at most ~1 request/day per
// device against Unsplash's free-tier limit (50/hr).

import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo SDK 49+ env vars are stripped from the client bundle
// unless prefixed `EXPO_PUBLIC_`. Define this in your project
// root .env file:
//   EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

/** Bundled fallback when the network fetch fails or the CDN 404s. */
export const HERO_BACKDROP_FALLBACK = require('../assets/backdrops/sky.jpg');

/** In-memory cache so tab remounts don't flash blank while AsyncStorage reads. */
const memoryCache = new Map();

export const fetchImageForQuery = async (query, attempt = 0) => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('Unsplash: missing EXPO_PUBLIC_UNSPLASH_ACCESS_KEY');
    return null;
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      },
    );
    if (!response.ok) {
      console.log('Unsplash fetch failed:', response.status);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return fetchImageForQuery(query, attempt + 1);
      }
      return null;
    }
    const data = await response.json();
    return data?.urls?.regular ?? null;
  } catch (error) {
    console.log('Unsplash fetch failed, using fallback');
    if (attempt < 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return fetchImageForQuery(query, attempt + 1);
    }
    return null;
  }
};

async function getCachedImage(query, storageKey) {
  try {
    const today = new Date().toDateString();
    const dayKeyName = `${storageKey}_day`;
    const dateKeyName = `${storageKey}_date`;
    const urlKeyName = `${storageKey}_url`;
    const memoryKey = `${storageKey}_${today}`;

    if (memoryCache.has(memoryKey)) {
      return memoryCache.get(memoryKey);
    }

    const [storedDay, storedDate, storedUrl] = await Promise.all([
      AsyncStorage.getItem(dayKeyName),
      AsyncStorage.getItem(dateKeyName),
      AsyncStorage.getItem(urlKeyName),
    ]);

    if (storedDay === query && storedDate === today && storedUrl) {
      memoryCache.set(memoryKey, storedUrl);
      return storedUrl;
    }

    const url = await fetchImageForQuery(query);
    if (url) {
      await AsyncStorage.multiSet([
        [dayKeyName, query],
        [dateKeyName, today],
        [urlKeyName, url],
      ]);
      memoryCache.set(memoryKey, url);
      return url;
    }

    // Network blip or rate limit — reuse the last good URL for this
    // sermon day/query instead of leaving the hero blank.
    if (storedUrl && storedDay === query) {
      memoryCache.set(memoryKey, storedUrl);
      return storedUrl;
    }

    return null;
  } catch {
    return null;
  }
}

/** Unsplash search terms keyed by sermon-type id — used for the
 *  home editorial hero backgrounds. Kept here so content can
 *  tune queries without touching UI code. */
export const SERMON_TYPE_UNSPLASH_QUERIES = {
  "daily-church": "mountain sunrise spiritual fog",
  "jesus-only": "ocean sunset golden hour",
  "letters-struggling": "stormy ocean waves dark",
  "letters-grateful": "sunrise meadow peaceful",
  "character-studies": "forest path misty nature",
  "deep-verse": "open bible light warm",
  misconceptions: "lightbulb dawn sky",
  testimonies: "hands raised sunset",
  questions: "night sky stars peaceful",
  "prayer-nights": "moon stars quiet night",
};

export const getHeroImage = async (typeId, day, illustrationPrompt) => {
  const query =
    illustrationPrompt?.trim() ||
    SERMON_TYPE_UNSPLASH_QUERIES[typeId] ||
    "peaceful spiritual nature landscape";
  return getSermonBackdrop(query, day);
};

/** Shared Unsplash backdrop for home + scripture — one photo per
 *  sermon day so both surfaces feel like the same moment. */
export const getSermonBackdrop = async (query, day) => {
  const q = (query || "peaceful spiritual nature landscape").trim();
  return getCachedImage(q, `sermon_backdrop_${day}_${q}`);
};

export const getDailyImage = async (query, day) => {
  return getSermonBackdrop(query, day);
};
