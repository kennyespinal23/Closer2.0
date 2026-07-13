/**
 * Home hero layout experiment — flip to revert without hunting
 * through component code. NOT for production; do not commit while on.
 */
export const HOME_CARD_PROTOTYPE = true;

/** Preview copy for the card layout — swap off to show today's sermon again. */
export const HOME_CARD_PROTOTYPE_USE_SAMPLE = true;

export const HOME_CARD_PROTOTYPE_SAMPLE = {
  scriptureReference: "Mark 1:41-44",
  scriptureText: [
    `41 Moved with compassion, Jesus reached out his hand, and touched him, and said to him, "I want to. Be made clean."`,
    `42 When he had said this, immediately the leprosy departed from him, and he was made clean.`,
    `43 He strictly warned him, and immediately sent him out,`,
    `44 and said to him, "See that you say nothing to anybody, but go show yourself to the priest, and offer for your cleansing the things which Moses commanded, for a testimony to them."`,
  ].join("\n"),
  verseInsight:
    "Jesus doesn't heal from a safe distance — he touches the person everyone else avoided. Compassion moves him toward what others turned away from.",
} as const;

/** Center home prompts — advance one step each time the app opens. */
export const HOME_FLOATING_PROMPTS = [
  "Seek Him first.",
  "Trust His process.",
  "Let faith arise.",
  "Peace is a person.",
  "Choose joy today.",
  "His love endures.",
  "Be the light.",
  "Pray without ceasing.",
  "Walk by faith.",
  "God is with us.",
  "Forgiven and free.",
] as const;

export type FloatingScriptureCard = {
  id: string;
  scriptureReference: string;
  scriptureText: string;
  verseInsight: string;
  illustrationPrompt: string;
  /** Degrees of rotation for the floating layout. */
  rotate: number;
  /** Absolute placement as fractions of the home canvas (can be <0 / >1 to peek). */
  x: number;
  y: number;
  /** Card width as a fraction of screen width. */
  width: number;
  z: number;
};

/** Edge-peeking floating cards — mostly off-canvas like the reference (no bottom-center card). */
export const HOME_FLOATING_CARDS: ReadonlyArray<FloatingScriptureCard> = [
  {
    id: "mark",
    scriptureReference: "Mark 1:41-44",
    scriptureText: HOME_CARD_PROTOTYPE_SAMPLE.scriptureText,
    verseInsight: HOME_CARD_PROTOTYPE_SAMPLE.verseInsight,
    illustrationPrompt: "gentle hands sunlight compassion",
    rotate: -11,
    x: -0.3,
    y: 0.02,
    width: 0.42,
    z: 3,
  },
  {
    id: "psalm",
    scriptureReference: "Psalm 23:1-3",
    scriptureText: [
      `1 The Lord is my shepherd; I shall not want.`,
      `2 He makes me lie down in green pastures. He leads me beside still waters.`,
      `3 He restores my soul. He leads me in paths of righteousness for his name's sake.`,
    ].join("\n"),
    verseInsight:
      "Rest is not laziness when God is the one leading you there. Still waters are part of the shepherd's care.",
    illustrationPrompt: "green pasture still water morning",
    rotate: 9,
    x: 0.78,
    y: -0.02,
    width: 0.4,
    z: 2,
  },
  {
    id: "isaiah",
    scriptureReference: "Isaiah 43:18-19",
    scriptureText: [
      `18 Remember not the former things, nor consider the things of old.`,
      `19 Behold, I am doing a new thing; now it springs forth, do you not perceive it? I will make a way in the wilderness and rivers in the desert.`,
    ].join("\n"),
    verseInsight:
      "God's new work often starts where the old maps end — in wilderness places we thought were finished.",
    illustrationPrompt: "desert river sunrise wilderness",
    rotate: -6,
    x: 0.82,
    y: 0.3,
    width: 0.38,
    z: 4,
  },
  {
    id: "john",
    scriptureReference: "John 11:25",
    scriptureText: `25 Jesus said to her, "I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live."`,
    verseInsight:
      "Resurrection is not only a future hope — it is Jesus naming himself as life in the middle of grief.",
    illustrationPrompt: "sunrise empty tomb soft light",
    rotate: 12,
    x: -0.34,
    y: 0.34,
    width: 0.4,
    z: 1,
  },
  {
    id: "romans",
    scriptureReference: "Romans 8:26",
    scriptureText: `26 Likewise the Spirit helps us in our weakness. For we do not know what to pray for as we ought, but the Spirit himself intercedes for us with groanings too deep for words.`,
    verseInsight:
      "When prayer feels empty, the Spirit is already praying through the silence — you are not alone in the quiet.",
    illustrationPrompt: "quiet mist forest prayer",
    rotate: -14,
    x: -0.28,
    y: 0.64,
    width: 0.4,
    z: 5,
  },
  {
    id: "philippians",
    scriptureReference: "Philippians 4:6-7",
    scriptureText: [
      `6 Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.`,
      `7 And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.`,
    ].join("\n"),
    verseInsight:
      "Peace is not the absence of requests — it is what guards you after you have brought them to God.",
    illustrationPrompt: "calm ocean horizon dusk",
    rotate: 8,
    x: 0.8,
    y: 0.62,
    width: 0.42,
    z: 3,
  },
];
