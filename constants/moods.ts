/**
 * Mood catalog for the daily check-in.
 *
 * Each mood is a feeling someone might bring to God. The app uses
 * the user's selection to surface a single verse from a small
 * curated pool — the verse rotates so a returning user doesn't see
 * the same scripture twice in a row for the same mood.
 *
 * Design constraints:
 *   • 20 moods on a 4×5 grid — broad enough to cover what shows up
 *     in someone's day across hard / steady / hopeful registers.
 *     Each mood ships with its own custom head illustration
 *     (see assets/moods/*.png) sampled from the same art family
 *     so the grid reads as one set.
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

import type { ImageSourcePropType } from "react-native";
import type { VerseRef } from "@/state/annotations";

export type MoodId =
  // ── Hard feelings ────────────────────────────────────────────
  | "anxious"
  | "sad"
  | "overwhelmed"
  | "lonely"
  | "tired"
  | "confused"
  | "worried"
  | "overlooked"
  | "discouraged"
  | "stressed"
  // ── Steady / hopeful ─────────────────────────────────────────
  | "grateful"
  | "hopeful"
  | "peaceful"
  | "forgiven"
  | "loved"
  | "determined"
  | "growing"
  | "hope-restored"
  | "letting-go"
  | "faithful";

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
  /**
   * Dominant color sampled from the head illustration. Used to tint
   * mood pills, the verse-delivery halo, and the focused-verse glow
   * when the user opens the chapter from a check-in.
   */
  swatch: string;
  /**
   * Single-glyph fallback indicator (used in dense surfaces where
   * the image asset would be too small to read, e.g. tiny inline
   * pills). Optional — the image is the primary visual identity.
   */
  glyph: string;
  /**
   * Head illustration for this mood. PNGs ship in assets/moods/ and
   * are normalized to a 256×256 transparent square so the check-in
   * grid renders every mood at identical scale. The asset is the
   * primary visual identity of a mood (color + form).
   */
  image: ImageSourcePropType;
  /**
   * What the verse delivery screen reflects back at the user
   * ("You're feeling ____.") — separated from `label` because
   * the grammatically correct form sometimes differs ("Lonely" →
   * "lonely"; "Hope Restored" → "hope restored", etc.).
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
    prompt: "Worry, nervousness, unease",
    swatch: "#7B6BB0",
    glyph: "≋",
    image: require("../assets/moods/anxious.png"),
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
    prompt: "Heavy heart, low mood",
    swatch: "#4D7AB0",
    glyph: "◌",
    image: require("../assets/moods/sad.png"),
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
    prompt: "Too much at once, mental clutter",
    swatch: "#D14B3F",
    glyph: "⌇",
    image: require("../assets/moods/overwhelmed.png"),
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
    prompt: "A sense of isolation, disconnection",
    swatch: "#4F4790",
    glyph: "◔",
    image: require("../assets/moods/lonely.png"),
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
    prompt: "Physically or mentally drained",
    swatch: "#E96B3D",
    glyph: "◐",
    image: require("../assets/moods/tired.png"),
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
    id: "confused",
    label: "Confused",
    prompt: "Unclear, uncertain, seeking answers",
    swatch: "#6B4B9E",
    glyph: "◍",
    image: require("../assets/moods/confused.png"),
    echo: "confused",
    verses: [
      {
        bookId: "james",
        chapter: 1,
        verse: 5,
        reference: "James 1:5",
        text: "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.",
      },
      {
        bookId: "proverbs",
        chapter: 3,
        verse: 5,
        reference: "Proverbs 3:5–6",
        text: "Trust in the Lord with all your heart, and don't lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.",
      },
      {
        bookId: "1-corinthians",
        chapter: 14,
        verse: 33,
        reference: "1 Corinthians 14:33",
        text: "For God is not a God of confusion, but of peace.",
      },
      {
        bookId: "isaiah",
        chapter: 55,
        verse: 8,
        reference: "Isaiah 55:8–9",
        text: "For my thoughts are not your thoughts, neither are your ways my ways, says the Lord. For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.",
      },
    ],
  },
  {
    id: "worried",
    label: "Worried",
    prompt: "Concerned about the future",
    swatch: "#E07B3E",
    glyph: "◇",
    image: require("../assets/moods/worried.png"),
    echo: "worried",
    verses: [
      {
        bookId: "matthew",
        chapter: 6,
        verse: 34,
        reference: "Matthew 6:34",
        text: "Therefore don't be anxious for tomorrow, for tomorrow will be anxious for itself. Each day has enough trouble of its own.",
      },
      {
        bookId: "1-peter",
        chapter: 5,
        verse: 7,
        reference: "1 Peter 5:7",
        text: "Cast all your worries on him, because he cares for you.",
      },
      {
        bookId: "psalms",
        chapter: 55,
        verse: 22,
        reference: "Psalm 55:22",
        text: "Cast your burden on the Lord, and he will sustain you. He will never allow the righteous to be moved.",
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
  {
    id: "overlooked",
    label: "Overlooked",
    prompt: "Feeling unseen, unimportant",
    swatch: "#4A6B4F",
    glyph: "◎",
    image: require("../assets/moods/overlooked.png"),
    echo: "overlooked",
    verses: [
      {
        bookId: "genesis",
        chapter: 16,
        verse: 13,
        reference: "Genesis 16:13",
        text: "She called the name of the Lord who spoke to her, 'You are a God who sees,' for she said, 'Have I even stayed alive after seeing him?'",
      },
      {
        bookId: "luke",
        chapter: 12,
        verse: 7,
        reference: "Luke 12:7",
        text: "But the very hairs of your head are all counted. Therefore don't be afraid. You are of more value than many sparrows.",
      },
      {
        bookId: "psalms",
        chapter: 139,
        verse: 1,
        reference: "Psalm 139:1–3",
        text: "Lord, you have searched me, and you know me. You know my sitting down and my rising up. You perceive my thoughts from afar. You search out my path and my lying down, and are acquainted with all my ways.",
      },
      {
        bookId: "1-samuel",
        chapter: 16,
        verse: 7,
        reference: "1 Samuel 16:7",
        text: "For the Lord sees not as man sees; for man looks at the outward appearance, but the Lord looks at the heart.",
      },
    ],
  },
  {
    id: "discouraged",
    label: "Discouraged",
    prompt: "Lacking motivation, feeling defeated",
    swatch: "#5E4B96",
    glyph: "↓",
    image: require("../assets/moods/discouraged.png"),
    echo: "discouraged",
    verses: [
      {
        bookId: "galatians",
        chapter: 6,
        verse: 9,
        reference: "Galatians 6:9",
        text: "Let us not be weary in doing good, for we will reap in due season if we don't give up.",
      },
      {
        bookId: "isaiah",
        chapter: 40,
        verse: 31,
        reference: "Isaiah 40:31",
        text: "Those who wait for the Lord will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.",
      },
      {
        bookId: "joshua",
        chapter: 1,
        verse: 9,
        reference: "Joshua 1:9",
        text: "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for the Lord your God is with you wherever you go.",
      },
      {
        bookId: "2-corinthians",
        chapter: 4,
        verse: 16,
        reference: "2 Corinthians 4:16–17",
        text: "Therefore we don't faint, but though our outward person is decaying, yet our inward person is renewed day by day. For our light affliction, which is for the moment, works for us more and more exceedingly an eternal weight of glory.",
      },
    ],
  },
  {
    id: "stressed",
    label: "Stressed",
    prompt: "Pressure, tension, mental strain",
    swatch: "#2D5862",
    glyph: "⌁",
    image: require("../assets/moods/stressed.png"),
    echo: "stressed",
    verses: [
      {
        bookId: "matthew",
        chapter: 11,
        verse: 28,
        reference: "Matthew 11:28–29",
        text: "Come to me, all you who labor and are heavily burdened, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and humble in heart; and you will find rest for your souls.",
      },
      {
        bookId: "psalms",
        chapter: 46,
        verse: 1,
        reference: "Psalm 46:1",
        text: "God is our refuge and strength, a very present help in trouble.",
      },
      {
        bookId: "john",
        chapter: 14,
        verse: 27,
        reference: "John 14:27",
        text: "Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don't let your heart be troubled, neither let it be fearful.",
      },
      {
        bookId: "philippians",
        chapter: 4,
        verse: 6,
        reference: "Philippians 4:6–7",
        text: "Be anxious for nothing, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.",
      },
    ],
  },

  // ─── Steady / hopeful ───────────────────────────────────────
  {
    id: "grateful",
    label: "Grateful",
    prompt: "Appreciation, thankfulness, seeing the good",
    swatch: "#F4A540",
    glyph: "☘",
    image: require("../assets/moods/grateful.png"),
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
    prompt: "Optimism, trust, looking ahead",
    swatch: "#5BA15C",
    glyph: "◉",
    image: require("../assets/moods/hopeful.png"),
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
    prompt: "Calm, quiet mind, inner stillness",
    swatch: "#4DB3B8",
    glyph: "○",
    image: require("../assets/moods/peaceful.png"),
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
    id: "forgiven",
    label: "Forgiven",
    prompt: "Release, relief, a clean slate",
    swatch: "#E8B947",
    glyph: "✦",
    image: require("../assets/moods/forgiven.png"),
    echo: "forgiven",
    verses: [
      {
        bookId: "psalms",
        chapter: 103,
        verse: 12,
        reference: "Psalm 103:12",
        text: "As far as the east is from the west, so far has he removed our transgressions from us.",
      },
      {
        bookId: "1-john",
        chapter: 1,
        verse: 9,
        reference: "1 John 1:9",
        text: "If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.",
      },
      {
        bookId: "isaiah",
        chapter: 1,
        verse: 18,
        reference: "Isaiah 1:18",
        text: "Though your sins be as scarlet, they shall be as white as snow. Though they be red like crimson, they shall be as wool.",
      },
      {
        bookId: "romans",
        chapter: 8,
        verse: 1,
        reference: "Romans 8:1",
        text: "There is therefore now no condemnation to those who are in Christ Jesus, who don't walk according to the flesh, but according to the Spirit.",
      },
    ],
  },
  {
    id: "loved",
    label: "Loved",
    prompt: "Valued, accepted, deep connection",
    swatch: "#C44339",
    glyph: "♥",
    image: require("../assets/moods/loved.png"),
    echo: "loved",
    verses: [
      {
        bookId: "1-john",
        chapter: 4,
        verse: 19,
        reference: "1 John 4:19",
        text: "We love him, because he first loved us.",
      },
      {
        bookId: "romans",
        chapter: 8,
        verse: 38,
        reference: "Romans 8:38–39",
        text: "For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing will be able to separate us from God's love which is in Christ Jesus our Lord.",
      },
      {
        bookId: "zephaniah",
        chapter: 3,
        verse: 17,
        reference: "Zephaniah 3:17",
        text: "The Lord, your God, is in the middle of you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.",
      },
      {
        bookId: "ephesians",
        chapter: 2,
        verse: 4,
        reference: "Ephesians 2:4–5",
        text: "But God, being rich in mercy, for his great love with which he loved us, even when we were dead through our trespasses, made us alive together with Christ — by grace you have been saved.",
      },
    ],
  },
  {
    id: "determined",
    label: "Determined",
    prompt: "Focused, driven, ready to push forward",
    swatch: "#8B3641",
    glyph: "▲",
    image: require("../assets/moods/determined.png"),
    echo: "determined",
    verses: [
      {
        bookId: "philippians",
        chapter: 3,
        verse: 13,
        reference: "Philippians 3:13–14",
        text: "Brothers, I don't regard myself as yet having taken hold, but one thing I do: forgetting the things which are behind, and stretching forward to the things which are before, I press on toward the goal for the prize of the high calling of God in Christ Jesus.",
      },
      {
        bookId: "philippians",
        chapter: 4,
        verse: 13,
        reference: "Philippians 4:13",
        text: "I can do all things through Christ, who strengthens me.",
      },
      {
        bookId: "1-corinthians",
        chapter: 9,
        verse: 24,
        reference: "1 Corinthians 9:24",
        text: "Don't you know that those who run in a race all run, but one receives the prize? Run like that, that you may win.",
      },
      {
        bookId: "isaiah",
        chapter: 50,
        verse: 7,
        reference: "Isaiah 50:7",
        text: "For the Lord God will help me. Therefore I have not been confounded. Therefore I have set my face like a flint, and I know that I won't be disappointed.",
      },
    ],
  },
  {
    id: "growing",
    label: "Growing",
    prompt: "Learning, improving, becoming more",
    swatch: "#3A6B45",
    glyph: "✧",
    image: require("../assets/moods/growing.png"),
    echo: "growing",
    verses: [
      {
        bookId: "2-peter",
        chapter: 3,
        verse: 18,
        reference: "2 Peter 3:18",
        text: "But grow in the grace and knowledge of our Lord and Savior Jesus Christ. To him be the glory both now and forever.",
      },
      {
        bookId: "philippians",
        chapter: 1,
        verse: 6,
        reference: "Philippians 1:6",
        text: "Being confident of this very thing, that he who began a good work in you will complete it until the day of Jesus Christ.",
      },
      {
        bookId: "romans",
        chapter: 5,
        verse: 3,
        reference: "Romans 5:3–4",
        text: "Not only this, but we also rejoice in our sufferings, knowing that suffering produces perseverance; and perseverance, proven character; and proven character, hope.",
      },
      {
        bookId: "colossians",
        chapter: 2,
        verse: 6,
        reference: "Colossians 2:6–7",
        text: "As therefore you received Christ Jesus, the Lord, walk in him, rooted and built up in him, and established in the faith, even as you were taught, abounding in it in thanksgiving.",
      },
    ],
  },
  {
    id: "hope-restored",
    label: "Hope Restored",
    prompt: "Renewed faith, new beginnings",
    swatch: "#B8842F",
    glyph: "❖",
    image: require("../assets/moods/hope-restored.png"),
    echo: "hope restored",
    verses: [
      {
        bookId: "lamentations",
        chapter: 3,
        verse: 22,
        reference: "Lamentations 3:22–23",
        text: "It is because of the Lord's loving kindnesses that we are not consumed, because his compassion doesn't fail. They are new every morning. Great is your faithfulness.",
      },
      {
        bookId: "isaiah",
        chapter: 43,
        verse: 19,
        reference: "Isaiah 43:19",
        text: "Behold, I will do a new thing. It springs out now. Don't you know it? I will even make a way in the wilderness, and rivers in the desert.",
      },
      {
        bookId: "romans",
        chapter: 15,
        verse: 13,
        reference: "Romans 15:13",
        text: "Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit.",
      },
      {
        bookId: "2-corinthians",
        chapter: 5,
        verse: 17,
        reference: "2 Corinthians 5:17",
        text: "Therefore if anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new.",
      },
    ],
  },
  {
    id: "letting-go",
    label: "Letting Go",
    prompt: "Release, surrender, moving forward",
    swatch: "#2A6B7A",
    glyph: "≈",
    image: require("../assets/moods/letting-go.png"),
    echo: "ready to let go",
    verses: [
      {
        bookId: "philippians",
        chapter: 3,
        verse: 13,
        reference: "Philippians 3:13–14",
        text: "Forgetting the things which are behind, and stretching forward to the things which are before, I press on toward the goal for the prize of the high calling of God in Christ Jesus.",
      },
      {
        bookId: "isaiah",
        chapter: 43,
        verse: 18,
        reference: "Isaiah 43:18–19",
        text: "Don't remember the former things, and don't consider the things of old. Behold, I will do a new thing. It springs out now. Don't you know it?",
      },
      {
        bookId: "psalms",
        chapter: 55,
        verse: 22,
        reference: "Psalm 55:22",
        text: "Cast your burden on the Lord, and he will sustain you. He will never allow the righteous to be moved.",
      },
      {
        bookId: "matthew",
        chapter: 6,
        verse: 25,
        reference: "Matthew 6:25",
        text: "Therefore I tell you, don't be anxious for your life: what you will eat, or what you will drink; nor yet for your body, what you will wear. Isn't life more than food, and the body more than clothing?",
      },
    ],
  },
  {
    id: "faithful",
    label: "Faithful",
    prompt: "Trusting, believing, holding on",
    swatch: "#5C2D9E",
    glyph: "✦",
    image: require("../assets/moods/faithful.png"),
    echo: "faithful",
    verses: [
      {
        bookId: "hebrews",
        chapter: 11,
        verse: 1,
        reference: "Hebrews 11:1",
        text: "Now faith is assurance of things hoped for, proof of things not seen.",
      },
      {
        bookId: "hebrews",
        chapter: 10,
        verse: 23,
        reference: "Hebrews 10:23",
        text: "Let us hold fast the confession of our hope without wavering; for he who promised is faithful.",
      },
      {
        bookId: "2-timothy",
        chapter: 4,
        verse: 7,
        reference: "2 Timothy 4:7",
        text: "I have fought the good fight. I have finished the course. I have kept the faith.",
      },
      {
        bookId: "lamentations",
        chapter: 3,
        verse: 23,
        reference: "Lamentations 3:23",
        text: "His compassions don't fail. They are new every morning. Great is your faithfulness.",
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
