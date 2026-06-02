/**
 * Verse-of-the-day catalog + selector.
 *
 * The goal is a *small, calm* presence on the home screen — one
 * short verse a day, surfaced under the sermon hero. Two design
 * constraints drove the data shape:
 *
 *   1. **Deterministic per-day, no network required.**
 *      Everyone using the app on the same calendar day sees the
 *      same verse. We rotate by day-of-year against the catalog
 *      length, so the cycle automatically lengthens when the
 *      catalog grows. No remote fetch, no AsyncStorage, no
 *      timezone-shifting once today's verse is computed — the
 *      home screen reads the value once on mount and uses it for
 *      the whole session.
 *
 *   2. **Short, plain-text verses only.**
 *      The card has limited vertical room above the timeline.
 *      Anything longer than ~25 words pushes the card into a
 *      multi-line block that visually competes with the sermon
 *      hero. Every entry here is hand-trimmed to read well in a
 *      14–15pt italic body without ellipsis truncation.
 *
 * Reference style is "Book Chapter:Verse" (e.g. "Psalm 23:1") for
 * the well-known single-verse pulls, and "Book Chapter:Verse–Verse"
 * for the rare two-verse pulls we kept (Isaiah 41:10 is a textbook
 * example — losing the "do not fear" opener would gut the verse).
 *
 * Translation: ESV throughout. We don't surface the translation in
 * the UI today, but we record it here so future "verse settings"
 * work (NIV, NLT, KJV) has somewhere obvious to plug in.
 */

export type VerseOfDayEntry = {
  /** Stable id — used for analytics events and React keys. */
  id: string;
  /** "Psalm 46:10" — surfaced as the small reference line below the verse. */
  reference: string;
  /** The verse itself. Kept ≤ 25 words to fit a 3-line italic block at 15pt. */
  text: string;
  /** Translation tag, retained for future surfacing in a settings sheet. */
  translation: "ESV";
};

/**
 * The catalog. Order doesn't really matter (we rotate by index,
 * not by ID), but we keep verses grouped by theme so that future
 * editorial passes can rebalance the mix without re-keying every
 * entry. Themes interleaved on purpose: comfort, courage,
 * stillness, hope, surrender, identity. Avoids stretches of
 * three-in-a-row on the same emotional note.
 */
const VERSES: ReadonlyArray<VerseOfDayEntry> = [
  {
    id: "psalm-46-10",
    reference: "Psalm 46:10",
    text: "Be still, and know that I am God.",
    translation: "ESV",
  },
  {
    id: "philippians-4-13",
    reference: "Philippians 4:13",
    text: "I can do all things through him who strengthens me.",
    translation: "ESV",
  },
  {
    id: "isaiah-41-10",
    reference: "Isaiah 41:10",
    text: "Fear not, for I am with you; be not dismayed, for I am your God.",
    translation: "ESV",
  },
  {
    id: "proverbs-3-5-6",
    reference: "Proverbs 3:5–6",
    text: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
    translation: "ESV",
  },
  {
    id: "psalm-23-1",
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd; I shall not want.",
    translation: "ESV",
  },
  {
    id: "romans-8-28",
    reference: "Romans 8:28",
    text: "And we know that for those who love God all things work together for good.",
    translation: "ESV",
  },
  {
    id: "matthew-11-28",
    reference: "Matthew 11:28",
    text: "Come to me, all who labor and are heavy laden, and I will give you rest.",
    translation: "ESV",
  },
  {
    id: "jeremiah-29-11",
    reference: "Jeremiah 29:11",
    text: "I know the plans I have for you, plans for welfare and not for evil, to give you a future and a hope.",
    translation: "ESV",
  },
  {
    id: "joshua-1-9",
    reference: "Joshua 1:9",
    text: "Be strong and courageous. Do not be frightened, for the Lord your God is with you wherever you go.",
    translation: "ESV",
  },
  {
    id: "psalm-34-18",
    reference: "Psalm 34:18",
    text: "The Lord is near to the brokenhearted and saves the crushed in spirit.",
    translation: "ESV",
  },
  {
    id: "2-corinthians-12-9",
    reference: "2 Corinthians 12:9",
    text: "My grace is sufficient for you, for my power is made perfect in weakness.",
    translation: "ESV",
  },
  {
    id: "psalm-27-1",
    reference: "Psalm 27:1",
    text: "The Lord is my light and my salvation; whom shall I fear?",
    translation: "ESV",
  },
  {
    id: "isaiah-40-31",
    reference: "Isaiah 40:31",
    text: "They who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.",
    translation: "ESV",
  },
  {
    id: "lamentations-3-22-23",
    reference: "Lamentations 3:22–23",
    text: "His mercies never come to an end; they are new every morning; great is your faithfulness.",
    translation: "ESV",
  },
  {
    id: "matthew-6-33",
    reference: "Matthew 6:33",
    text: "Seek first the kingdom of God and his righteousness, and all these things will be added to you.",
    translation: "ESV",
  },
  {
    id: "james-1-2-3",
    reference: "James 1:2–3",
    text: "Count it all joy when you meet trials, for the testing of your faith produces steadfastness.",
    translation: "ESV",
  },
  {
    id: "psalm-37-4",
    reference: "Psalm 37:4",
    text: "Delight yourself in the Lord, and he will give you the desires of your heart.",
    translation: "ESV",
  },
  {
    id: "1-peter-5-7",
    reference: "1 Peter 5:7",
    text: "Cast all your anxieties on him, because he cares for you.",
    translation: "ESV",
  },
  {
    id: "john-14-27",
    reference: "John 14:27",
    text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you.",
    translation: "ESV",
  },
  {
    id: "romans-12-2",
    reference: "Romans 12:2",
    text: "Be transformed by the renewal of your mind, that you may discern the will of God.",
    translation: "ESV",
  },
  {
    id: "psalm-119-105",
    reference: "Psalm 119:105",
    text: "Your word is a lamp to my feet and a light to my path.",
    translation: "ESV",
  },
  {
    id: "ephesians-2-8-9",
    reference: "Ephesians 2:8",
    text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.",
    translation: "ESV",
  },
  {
    id: "galatians-5-22-23",
    reference: "Galatians 5:22",
    text: "The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness.",
    translation: "ESV",
  },
  {
    id: "psalm-91-1-2",
    reference: "Psalm 91:1",
    text: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.",
    translation: "ESV",
  },
  {
    id: "hebrews-11-1",
    reference: "Hebrews 11:1",
    text: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
    translation: "ESV",
  },
  {
    id: "matthew-5-16",
    reference: "Matthew 5:16",
    text: "Let your light shine before others, so that they may see your good works and give glory to your Father.",
    translation: "ESV",
  },
  {
    id: "john-3-16",
    reference: "John 3:16",
    text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish.",
    translation: "ESV",
  },
  {
    id: "psalm-139-14",
    reference: "Psalm 139:14",
    text: "I praise you, for I am fearfully and wonderfully made.",
    translation: "ESV",
  },
  {
    id: "deuteronomy-31-6",
    reference: "Deuteronomy 31:6",
    text: "Be strong and courageous. Do not fear, for it is the Lord your God who goes with you.",
    translation: "ESV",
  },
  {
    id: "romans-15-13",
    reference: "Romans 15:13",
    text: "May the God of hope fill you with all joy and peace in believing.",
    translation: "ESV",
  },
];

/**
 * Day-of-year (1..366) for the given local date. Matches the
 * day numbering most calendar libraries return — we don't care
 * about the leap-year +1 case beyond it being stable for the
 * lifetime of a single day, which is all the rotation needs.
 */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - start.getTime();
  return Math.floor(diffMs / 86_400_000);
}

/**
 * Pull today's verse. Pure function — same input always returns
 * the same entry — so the caller can `useMemo` against `new Date()`
 * without worrying about flicker on re-render.
 *
 * `date` defaults to "now" so the typical caller passes nothing;
 * tests can pass an explicit date to verify rotation behavior.
 */
export function getVerseOfDay(date: Date = new Date()): VerseOfDayEntry {
  if (VERSES.length === 0) {
    throw new Error("verseOfDay catalog is empty");
  }
  const idx = dayOfYear(date) % VERSES.length;
  return VERSES[idx];
}

/** Catalog size, exposed for tests / future analytics. */
export const VERSE_OF_DAY_COUNT = VERSES.length;
