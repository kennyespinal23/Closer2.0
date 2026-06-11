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

const CACHE_DAY_KEY = 'daily_image_day';
const CACHE_DATE_KEY = 'daily_image_date';
const CACHE_URL_KEY = 'daily_image_url';

export const fetchImageForQuery = async (query) => {
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
      return null;
    }
    const data = await response.json();
    return data?.urls?.regular ?? null;
  } catch (error) {
    console.log('Unsplash fetch failed, using fallback');
    return null;
  }
};

export const getDailyImage = async (query, day) => {
  try {
    const today = new Date().toDateString();
    const dayKey = String(day);

    const [storedDay, storedDate, storedUrl] = await Promise.all([
      AsyncStorage.getItem(CACHE_DAY_KEY),
      AsyncStorage.getItem(CACHE_DATE_KEY),
      AsyncStorage.getItem(CACHE_URL_KEY),
    ]);

    // Cache hit requires BOTH the same sermon day AND the
    // same calendar date — advancing to the next sermon
    // refetches a new image, and the image rotates at
    // midnight even if the user stays on the same sermon.
    if (storedDay === dayKey && storedDate === today && storedUrl) {
      return storedUrl;
    }

    const url = await fetchImageForQuery(query);
    if (url) {
      await AsyncStorage.multiSet([
        [CACHE_DAY_KEY, dayKey],
        [CACHE_DATE_KEY, today],
        [CACHE_URL_KEY, url],
      ]);
    }
    return url;
  } catch (error) {
    return null;
  }
};
