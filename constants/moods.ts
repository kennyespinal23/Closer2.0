/**
 * Mood catalog for the daily check-in.
 *
 * Each mood is a feeling someone might bring to God. The app uses
 * the user's selection to surface a single verse from a small
 * curated pool — the verse rotates so a returning user doesn't see
 * the same scripture twice in a row for the same mood.
 *
 * Design constraints:
 *   • 12 moods on a 3×4 grid — covers most of what shows up in
 *     someone's day without being overwhelming. The 12 are split
 *     into 8 "hard" feelings + 4 "good" ones so the screen reads
 *     as honest, not toxic-positive.
 *   • Each mood ships with 4 verses. Verse text is bundled so the
 *     check-in works offline and is instant (no network roundtrip
 *     before the user gets their response).
 *   • Translation is fixed to a widely accessible public-domain
 *     phrasing (WEB / KJV-style) so we can ship the text directly.
 *
 * IMPORTANT: this file ships scripture text inline. When the time
 * comes to honor the user's translation preference, swap to a
 * lookup keyed by (bookId, chapter, verse) and pull from lib/bible.
 * The shape of `MoodVerse` already accommodates that — only the
 * `text` field becomes dynamic.
 */

import type { VerseRef } from "@/state/annotations";

export type MoodId =
  | "anxious"
  | "sad"
  | "overwhelmed"
  | "lonely"
  | "tired"
  | "afraid"
  | "angry"
  | "lost"
  | "grateful"
  | "hopeful"
  | "peaceful"
  | "joyful";

/**
 * A verse the check-in flow can deliver. `text` is the actual
 * scripture body so the delivery screen has zero-latency content;
 * `ref` is kept around so the "Open in reader" button knows where
 * to jump and the journey timeline can render a clickable card.
 */
export type MoodVerse = VerseRef & {
  /** Display reference, e.g. "Psalm 34:18". */
  reference: string;
  /** Verse text (pre-formatted, ready to render). */
  text: string;
};

export type Mood = {
  id: MoodId;
  /** One-word label rendered on the mood card. */
  label: string;
  /** Quiet, honest sub-prompt under the label (mood "flavor"). */
  prompt: string;
  /** Soft accent color for the card border / icon. */
  swatch: string;
  /** Single-glyph emoji-style indicator (renders inside a circle). */
  glyph: string;
  /**
   * What the verse delivery screen reflects back at the user
   * ("You're feeling ____.") — separated from `label` because
   * the grammatically correct form sometimes differs ("Lonely" →
   * "lonely"; "Joyful" → "joyful", etc.).
   */
  echo: string;
  /** Verse pool the delivery screen picks from. */
  verses: MoodVerse[];
};

// ─────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────

export const MOODS: ReadonlyArray<Mood> = [
  // ─── Hard feelings ──────────────────────────────────────────
  {
    id: "anxious",
    label: "Anxious",
    prompt: "Worry won't sit still",
    swatch: "#7BAEDC",
    glyph: "≋",
    echo: "anxious",
    verses: [
      {
        bookId: "philippians",
        chapter: 4,
        verse: 6,
        reference: "Philippians 4:6–7",
        text: "Be anxious for nothing, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.",
      },
      {
        bookId: "1-peter",
        chapter: 5,
        verse: 7,
        reference: "1 Peter 5:7",
        text: "Cast all your worries on him, because he cares for you.",
      },
      {
        bookId: "matthew",
        chapter: 6,
        verse: 34,
        reference: "Matthew 6:34",
        text: "Therefore don't be anxious for tomorrow, for tomorrow will be anxious for itself. Each day has enough trouble of its own.",
      },
      {
        bookId: "psalms",
        chapter: 94,
        verse: 19,
        reference: "Psalm 94:19",
        text: "In the multitude of my thoughts within me, your comforts delight my soul.",
      },
    ],
  },
  {
    id: "sad",
    label: "Sad",
    prompt: "Heaviness, sorrow, tears",
    swatch: "#9F90C7",
    glyph: "◌",
    echo: "sad",
    verses: [
      {
        bookId: "psalms",
        chapter: 34,
        verse: 18,
        reference: "Psalm 34:18",
        text: "The Lord is near to those who have a broken heart, and saves those who have a crushed spirit.",
      },
      {
        bookId: "matthew",
        chapter: 5,
        verse: 4,
        reference: "Matthew 5:4",
        text: "Blessed are those who mourn, for they shall be comforted.",
      },
      {
        bookId: "revelation",
        chapter: 21,
        verse: 4,
        reference: "Revelation 21:4",
        text: "He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.",
      },
      {
        bookId: "psalms",
        chapter: 30,
        verse: 5,
        reference: "Psalm 30:5",
        text: "Weeping may stay for the night, but joy comes in the morning.",
      },
    ],
  },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    prompt: "Too much, too fast",
    swatch: "#E3A06A",
    glyph: "⌇",
    echo: "overwhelmed",
    verses: [
      {
        bookId: "psalms",
        chapter: 61,
        verse: 2,
        reference: "Psalm 61:2",
        text: "From the end of the earth I will call to you when my heart is overwhelmed. Lead me to the rock that is higher than I.",
      },
      {
        bookId: "matthew",
        chapter: 11,
        verse: 28,
        reference: "Matthew 11:28–29",
        text: "Come to me, all you who labor and are heavily burdened, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and humble in heart; and you will find rest for your souls.",
      },
      {
        bookId: "psalms",
        chapter: 55,
        verse: 22,
        reference: "Psalm 55:22",
        text: "Cast your burden on the Lord, and he will sustain you. He will never allow the righteous to be moved.",
      },
      {
        bookId: "exodus",
        chapter: 14,
        verse: 14,
        reference: "Exodus 14:14",
        text: "The Lord will fight for you, and you shall be still.",
      },
    ],
  },
  {
    id: "lonely",
    label: "Lonely",
    prompt: "Disconnected, unseen",
    swatch: "#7B98C9",
    glyph: "◔",
    echo: "lonely",
    verses: [
      {
        bookId: "deuteronomy",
        chapter: 31,
        verse: 6,
        reference: "Deuteronomy 31:6",
        text: "Be strong and courageous. Don't be afraid or scared of them; for the Lord your God himself is who goes with you. He will not fail you, nor forsake you.",
      },
      {
        bookId: "psalms",
        chapter: 139,
        verse: 7,
        reference: "Psalm 139:7–10",
        text: "Where could I go from your Spirit? Or where could I flee from your presence? If I ascend up into heaven, you are there. If I make my bed in Sheol, behold, you are there! If I take the wings of the dawn, and settle in the uttermost parts of the sea, even there your hand will lead me, and your right hand will hold me.",
      },
      {
        bookId: "matthew",
        chapter: 28,
        verse: 20,
        reference: "Matthew 28:20",
        text: "I am with you always, even to the end of the age.",
      },
      {
        bookId: "isaiah",
        chapter: 43,
        verse: 1,
        reference: "Isaiah 43:1",
        text: "Don't be afraid, for I have redeemed you. I have called you by your name. You are mine.",
      },
    ],
  },
  {
    id: "tired",
    label: "Tired",
    prompt: "Weary, depleted",
    swatch: "#A89A87",
    glyph: "◐",
    echo: "tired",
    verses: [
      {
        bookId: "isaiah",
        chapter: 40,
        verse: 31,
        reference: "Isaiah 40:31",
        text: "Those who wait for the Lord will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.",
      },
      {
        bookId: "matthew",
        chapter: 11,
        verse: 28,
        reference: "Matthew 11:28",
        text: "Come to me, all you who labor and are heavily burdened, and I will give you rest.",
      },
      {
        bookId: "psalms",
        chapter: 23,
        verse: 1,
        reference: "Psalm 23:1–3",
        text: "The Lord is my shepherd; I shall lack nothing. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
      },
      {
        bookId: "2-corinthians",
        chapter: 12,
        verse: 9,
        reference: "2 Corinthians 12:9",
        text: "My grace is sufficient for you, for my power is made perfect in weakness.",
      },
    ],
  },
  {
    id: "afraid",
    label: "Afraid",
    prompt: "Fear, uncertainty",
    swatch: "#B07A8E",
    glyph: "◇",
    echo: "afraid",
    verses: [
      {
        bookId: "isaiah",
        chapter: 41,
        verse: 10,
        reference: "Isaiah 41:10",
        text: "Don't be afraid, for I am with you. Don't be dismayed, for I am your God. I will strengthen you. I will help you. I will uphold you with the right hand of my righteousness.",
      },
      {
        bookId: "psalms",
        chapter: 23,
        verse: 4,
        reference: "Psalm 23:4",
        text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.",
      },
      {
        bookId: "2-timothy",
        chapter: 1,
        verse: 7,
        reference: "2 Timothy 1:7",
        text: "For God didn't give us a spirit of fear, but of power, love, and self-control.",
      },
      {
        bookId: "joshua",
        chapter: 1,
        verse: 9,
        reference: "Joshua 1:9",
        text: "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for the Lord your God is with you wherever you go.",
      },
    ],
  },
  {
    id: "angry",
    label: "Angry",
    prompt: "Frustrated, hurt",
    swatch: "#C97B7B",
    glyph: "◊",
    echo: "angry",
    verses: [
      {
        bookId: "ephesians",
        chapter: 4,
        verse: 26,
        reference: "Ephesians 4:26–27",
        text: "Be angry, and don't sin. Don't let the sun go down on your wrath, and don't give place to the devil.",
      },
      {
        bookId: "james",
        chapter: 1,
        verse: 19,
        reference: "James 1:19–20",
        text: "Let every man be swift to hear, slow to speak, and slow to anger; for the anger of man doesn't produce the righteousness of God.",
      },
      {
        bookId: "proverbs",
        chapter: 15,
        verse: 1,
        reference: "Proverbs 15:1",
        text: "A gentle answer turns away wrath, but a harsh word stirs up anger.",
      },
      {
        bookId: "psalms",
        chapter: 4,
        verse: 4,
        reference: "Psalm 4:4",
        text: "Stand in awe, and don't sin. Search your own heart on your bed, and be still.",
      },
    ],
  },
  {
    id: "lost",
    label: "Lost",
    prompt: "Confused, directionless",
    swatch: "#8FA890",
    glyph: "◍",
    echo: "lost",
    verses: [
      {
        bookId: "proverbs",
        chapter: 3,
        verse: 5,
        reference: "Proverbs 3:5–6",
        text: "Trust in the Lord with all your heart, and don't lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.",
      },
      {
        bookId: "psalms",
        chapter: 119,
        verse: 105,
        reference: "Psalm 119:105",
        text: "Your word is a lamp to my feet, and a light for my path.",
      },
      {
        bookId: "isaiah",
        chapter: 30,
        verse: 21,
        reference: "Isaiah 30:21",
        text: "Your ears will hear a word behind you, saying, 'This is the way. Walk in it,' when you turn to the right, and when you turn to the left.",
      },
      {
        bookId: "jeremiah",
        chapter: 29,
        verse: 11,
        reference: "Jeremiah 29:11",
        text: "For I know the thoughts that I think toward you, says the Lord, thoughts of peace, and not of evil, to give you hope and a future.",
      },
    ],
  },

  // ─── Good feelings ──────────────────────────────────────────
  {
    id: "grateful",
    label: "Grateful",
    prompt: "Thankful, full",
    swatch: "#F4C77B",
    glyph: "☘",
    echo: "grateful",
    verses: [
      {
        bookId: "1-thessalonians",
        chapter: 5,
        verse: 16,
        reference: "1 Thessalonians 5:16–18",
        text: "Rejoice always. Pray without ceasing. In everything give thanks, for this is the will of God in Christ Jesus toward you.",
      },
      {
        bookId: "psalms",
        chapter: 100,
        verse: 4,
        reference: "Psalm 100:4–5",
        text: "Enter into his gates with thanksgiving, into his courts with praise. Give thanks to him, and bless his name. For the Lord is good. His loving kindness endures forever, his faithfulness to all generations.",
      },
      {
        bookId: "colossians",
        chapter: 3,
        verse: 15,
        reference: "Colossians 3:15",
        text: "And let the peace of God rule in your hearts, to which also you were called in one body. And be thankful.",
      },
      {
        bookId: "psalms",
        chapter: 103,
        verse: 2,
        reference: "Psalm 103:2",
        text: "Praise the Lord, my soul, and don't forget all his benefits.",
      },
    ],
  },
  {
    id: "hopeful",
    label: "Hopeful",
    prompt: "Looking up, expectant",
    swatch: "#93C572",
    glyph: "◉",
    echo: "hopeful",
    verses: [
      {
        bookId: "romans",
        chapter: 15,
        verse: 13,
        reference: "Romans 15:13",
        text: "Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit.",
      },
      {
        bookId: "lamentations",
        chapter: 3,
        verse: 22,
        reference: "Lamentations 3:22–23",
        text: "It is because of the Lord's loving kindnesses that we are not consumed, because his compassion doesn't fail. They are new every morning. Great is your faithfulness.",
      },
      {
        bookId: "hebrews",
        chapter: 11,
        verse: 1,
        reference: "Hebrews 11:1",
        text: "Now faith is assurance of things hoped for, proof of things not seen.",
      },
      {
        bookId: "psalms",
        chapter: 27,
        verse: 13,
        reference: "Psalm 27:13–14",
        text: "I am still confident of this: I will see the goodness of the Lord in the land of the living. Wait for the Lord. Be strong, and let your heart take courage.",
      },
    ],
  },
  {
    id: "peaceful",
    label: "Peaceful",
    prompt: "Quiet, settled",
    swatch: "#A8C8B6",
    glyph: "○",
    echo: "peaceful",
    verses: [
      {
        bookId: "john",
        chapter: 14,
        verse: 27,
        reference: "John 14:27",
        text: "Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don't let your heart be troubled, neither let it be fearful.",
      },
      {
        bookId: "psalms",
        chapter: 46,
        verse: 10,
        reference: "Psalm 46:10",
        text: "Be still, and know that I am God.",
      },
      {
        bookId: "isaiah",
        chapter: 26,
        verse: 3,
        reference: "Isaiah 26:3",
        text: "You will keep whoever's mind is steadfast in perfect peace, because he trusts in you.",
      },
      {
        bookId: "philippians",
        chapter: 4,
        verse: 7,
        reference: "Philippians 4:7",
        text: "The peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.",
      },
    ],
  },
  {
    id: "joyful",
    label: "Joyful",
    prompt: "Light, bright",
    swatch: "#F0B968",
    glyph: "✦",
    echo: "joyful",
    verses: [
      {
        bookId: "nehemiah",
        chapter: 8,
        verse: 10,
        reference: "Nehemiah 8:10",
        text: "The joy of the Lord is your strength.",
      },
      {
        bookId: "psalms",
        chapter: 16,
        verse: 11,
        reference: "Psalm 16:11",
        text: "You will show me the path of life. In your presence is fullness of joy. In your right hand there are pleasures forever more.",
      },
      {
        bookId: "psalms",
        chapter: 118,
        verse: 24,
        reference: "Psalm 118:24",
        text: "This is the day that the Lord has made. We will rejoice and be glad in it!",
      },
      {
        bookId: "philippians",
        chapter: 4,
        verse: 4,
        reference: "Philippians 4:4",
        text: "Rejoice in the Lord always! Again I will say, Rejoice!",
      },
    ],
  },
] as const;

/**
 * Lookup a mood by id. Returns null when the id is unknown (e.g.
 * a stale param from an older app version).
 */
export function findMood(id: string | null | undefined): Mood | null {
  if (!id) return null;
  return MOODS.find((m) => m.id === id) ?? null;
}

/**
 * Pick a verse from the mood's pool. Strategy: prefer one the user
 * hasn't seen recently (passed in via `recentVerseRefs`), falling
 * back to a deterministic rotation when every verse has been seen.
 *
 * The function is pure — the provider decides what counts as
 * "recent" and feeds it in.
 */
export function pickVerseForMood(
  mood: Mood,
  recentVerseRefs: ReadonlyArray<string>,
): MoodVerse {
  const recent = new Set(recentVerseRefs);
  const unseen = mood.verses.filter((v) => !recent.has(verseKey(v)));
  const pool = unseen.length > 0 ? unseen : mood.verses;
  // Random within the pool — feels like the verse "finds" the
  // user rather than cycling predictably.
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx]!;
}

/** Stable key for de-duplication across check-ins. */
export function verseKey(v: VerseRef): string {
  return `${v.bookId}-${v.chapter}-${v.verse}`;
}
