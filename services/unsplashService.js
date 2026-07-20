// services/unsplashService.js
//
// Daily image fetcher backed by Unsplash. Caches one image per
// (day, calendar-date) so we burn at most ~1 request/day per
// device against Unsplash's free-tier limit (50/hr).
//
// Card / hero photos are intentionally nature + atmosphere only —
// never people portraits. Callers must pass a landscape query
// (or use `natureBackdropQueryForDay`); sermon titles are NOT
// valid search terms (they return random stock people).

import AsyncStorage from "@react-native-async-storage/async-storage";

// In Expo SDK 49+ env vars are stripped from the client bundle
// unless prefixed `EXPO_PUBLIC_`. Define this in your project
// root .env file:
//   EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

/** Bundled fallback when the network fetch fails or the CDN 404s. */
export const HERO_BACKDROP_FALLBACK = require("../assets/backdrops/sky.jpg");

/**
 * Four backdrop moods that alternate by sermon day:
 *   0 luscious green → 1 bright blue sky → 2 ocean → 3 night sky → …
 * Multiple variants per mood so weeks don't feel identical while
 * consecutive days still rotate through the four settings.
 */
export const BACKDROP_THEME_QUERIES = [
  // Luscious green
  [
    "lush green forest canopy sunlight landscape",
    "verdant green hills meadow landscape",
    "tropical green jungle foliage landscape",
  ],
  // Bright blue skies
  [
    "bright blue sky fluffy white clouds landscape",
    "clear azure blue sky open field landscape",
    "vivid blue daytime sky horizon landscape",
  ],
  // The ocean
  [
    "turquoise ocean water horizon landscape",
    "calm blue ocean sea surface landscape",
    "coastal ocean waves bright day landscape",
  ],
  // Night sky
  [
    "night sky stars milky way landscape",
    "dark starry night sky peaceful landscape",
    "moonlit night sky landscape stars",
  ],
];

/** Flat list kept for callers that iterate the pool. */
export const NATURE_BACKDROP_QUERIES = BACKDROP_THEME_QUERIES.flat();

/** Deterministic mood for a catalog day (1…N) — cycles the four themes. */
export function natureBackdropQueryForDay(day) {
  const themes = BACKDROP_THEME_QUERIES;
  if (!themes.length) return "peaceful spiritual nature landscape";
  const dayNum = Math.max(1, Math.floor(Number(day) || 1));
  const themeIndex = (dayNum - 1) % themes.length;
  const variants = themes[themeIndex];
  const variantIndex = Math.floor((dayNum - 1) / themes.length) % variants.length;
  return variants[variantIndex];
}

/** In-memory cache so tab remounts don't flash blank while AsyncStorage reads. */
const memoryCache = new Map();

/**
 * Fetch a random Unsplash photo biased to nature landscapes.
 * Uses the public `nature` topic so portrait / people results
 * are rare even if the query is imperfect.
 */
export const fetchImageForQuery = async (query, attempt = 0) => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("Unsplash: missing EXPO_PUBLIC_UNSPLASH_ACCESS_KEY");
    return null;
  }
  try {
    const params = new URLSearchParams({
      query: query || "peaceful nature landscape",
      orientation: "portrait",
      content_filter: "high",
      // Public Unsplash topic slug — landscapes, flora, sky, water.
      // Keeps people-portrait stock out of home / sermon cards.
      topics: "nature",
    });
    const response = await fetch(
      `https://api.unsplash.com/photos/random?${params.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      },
    );
    if (!response.ok) {
      console.log("Unsplash fetch failed:", response.status);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return fetchImageForQuery(query, attempt + 1);
      }
      return null;
    }
    const data = await response.json();
    return data?.urls?.regular ?? null;
  } catch (error) {
    console.log("Unsplash fetch failed, using fallback");
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
  "daily-church": "lush green forest canopy sunlight landscape",
  "jesus-only": "turquoise ocean water horizon landscape",
  "letters-struggling": "calm blue ocean sea surface landscape",
  "letters-grateful": "verdant green hills meadow landscape",
  "character-studies": "tropical green jungle foliage landscape",
  "deep-verse": "bright blue sky fluffy white clouds landscape",
  misconceptions: "clear azure blue sky open field landscape",
  testimonies: "coastal ocean waves bright day landscape",
  questions: "night sky stars milky way landscape",
  "prayer-nights": "dark starry night sky peaceful landscape",
};

export const getHeroImage = async (typeId, day, illustrationPrompt) => {
  // Prefer an explicit nature prompt, then type defaults, then
  // the day-indexed nature pool — never a free-text sermon title.
  const query =
    illustrationPrompt?.trim() ||
    SERMON_TYPE_UNSPLASH_QUERIES[typeId] ||
    natureBackdropQueryForDay(day);
  return getSermonBackdrop(query, day);
};

/** Shared Unsplash backdrop for home + scripture — one photo per
 *  sermon day so both surfaces feel like the same moment. */
export const getSermonBackdrop = async (query, day) => {
  const q = (query || natureBackdropQueryForDay(day)).trim();
  return getCachedImage(q, `sermon_backdrop_${day}_${q}`);
};

export const getDailyImage = async (query, day) => {
  return getSermonBackdrop(query, day);
};
