import type { PtodayPoem } from "../lesson/ext/ptoday.types";
import type { Lesson } from "../lesson/types";

/* Closer Poetry: Thank You for Today.
   A gratitude poem you help write. You say how the day went, then gather three to five small, concrete things from
   it. Each one brings two lines of its own into the poem, always in the same order, so any handful reads well; a
   hard day changes the opening and the closing to an honest "thank you anyway". Then the whole poem, set on its
   page; then what Scripture says about giving thanks, kept apart from the poem; then a prayer made from your picks.

   Kept honest, line by line:
   - The poem is original, written for Closer; it is never presented as Scripture.
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - On a hard day, thanks is "in everything" (1 Thessalonians 5:18), never "for" the hard thing.
   - Nothing picked or typed is saved anywhere, and the screen says so. */

const WEB = "World English Bible";

const poem: PtodayPoem = {
  title: "Thank You for Today",
  byline: "Written today, by you and Page",
  frames: {
    good: {
      opening: ["Before today is folded up", "and put away with all the rest,", "let me say what I was given."],
      closing: ["None of it was owed to me.", "Every good thing came from you.", "So here is my thank you, small and true,", "for one ordinary, given day."],
    },
    hard: {
      opening: ["Today was hard. I won’t pretend.", "But even here, before it ends,", "let me look for what was given."],
      closing: ["It wasn’t the day I wanted, God.", "You were in it anyway.", "So here is my thank you, small and honest,", "for what was good, and for staying."],
    },
  },
  items: [
    { id: "light", icon: "light", label: "Sunlight through a window", short: "the light through the window", lines: ["The light came in across the floor", "as if it knew the way."] },
    { id: "cup", icon: "cup", label: "A warm drink", short: "a warm drink", lines: ["A warm cup, held in both my hands,", "the first slow minute of the day."] },
    { id: "walk", icon: "walk", label: "A walk", short: "a walk", lines: ["A walk with nowhere I had to be:", "the air, the sky, my own two feet."] },
    { id: "meal", icon: "meal", label: "A good meal", short: "a good meal", lines: ["A plate of food, still warm, enough,", "and nothing I did to deserve it."] },
    { id: "laugh", icon: "laugh", label: "Someone’s laugh", short: "someone’s laugh", lines: ["Someone laughed, and I laughed too,", "and for a moment the room was new."] },
    { id: "message", icon: "message", label: "A message from a friend", short: "a message from a friend", lines: ["A message from a friend that said,", "in so many words, I thought of you."] },
    { id: "song", icon: "song", label: "A song", short: "a song", lines: ["A song that found me halfway through", "and said what I couldn’t say."] },
    { id: "rest", icon: "rest", label: "Rest", short: "rest", lines: ["And rest: a chair, a breath, a pause,", "the weight of things put down a while."] },
    { id: "sprout", icon: "sprout", label: "A hard thing that taught me", short: "what the hard part taught me", lines: ["Even the hard part, the part I’d change,", "taught me something I needed to know."] },
    { id: "through", icon: "through", label: "I made it through today", short: "getting through today", lines: ["And I made it through. That counts.", "I made it through today."] },
  ],
  own: { label: "Something of my own", ask: "What else was good today?", placeholder: "my sister’s voice", line: "And {text}. I’m counting that too.", max: 40 },
};

export const poemToday = {
  id: "poem-today",
  title: "Thank You for Today",
  subtitle: "A poem you help write",
  kind: "Closer Poetry",
  scripture: "Psalm 118 · 1 Thessalonians 5 · James 1",
  minutes: 4,
  theme: "dusk",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "happy" },
      display: { text: "Thank You for Today", sub: "Closer Poetry · 4 min" },
      lines: [
        { say: "Let’s write a small poem together.", mood: "happy", act: "hop" },
        { say: "Out of your day, just as it was.", mood: "tender", act: "settle" },
      ],
      reply: "Let’s write it",
    },
    {
      kind: "ptodayGather",
      page: { at: "top", mood: "curious", act: "tilt" },
      poem,
      ask: "First, how was today? Honestly.",
      days: {
        good: { text: "A good day, mostly", reply: "Then let’s gather the good of it.", mood: "happy" },
        hard: { text: "Today was hard", reply: "Thank you for telling me. We’ll write an honest one.", mood: "tender" },
      },
      pick: "Tap three to five small things from today.",
      min: 3, max: 5,
      privacy: "Nothing you pick or type is saved.",
      button: "Read our poem",
    },
    { kind: "ptodayPoem", page: { at: "corner", mood: "moved" }, poem, done: "Continue" },
    {
      kind: "ptodayWord",
      page: { at: "top", mood: "tender", act: "nod" },
      label: "From Scripture",
      say: {
        good: "The Bible has words for a day like this.",
        hard: "Notice: “in everything,” not “for everything.”",
      },
      verses: {
        good: [
          { verse: { text: "This is the day that Yahweh has made. We will rejoice and be glad in it!", ref: "Psalm 118:24", translation: WEB } },
          { verse: { text: "Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom can be no variation, nor turning shadow.", ref: "James 1:17", translation: WEB } },
          { verse: { text: "Rejoice always. Pray without ceasing. In everything give thanks, for this is the will of God in Christ Jesus toward you.", ref: "1 Thessalonians 5:16–18", translation: WEB } },
        ],
        hard: [
          { verse: { text: "For though the fig tree doesn’t flourish, nor fruit be in the vines; the labor of the olive fails, the fields yield no food; the flocks are cut off from the fold, and there is no herd in the stalls: yet I will rejoice in Yahweh. I will be joyful in the God of my salvation!", ref: "Habakkuk 3:17–18", translation: WEB }, note: "Habakkuk wrote this with nothing in the fields." },
          { verse: { text: "In everything give thanks, for this is the will of God in Christ Jesus toward you.", ref: "1 Thessalonians 5:18", translation: WEB }, note: "Thanks in the hard day, not for the hard thing." },
          { verse: { text: "Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom can be no variation, nor turning shadow.", ref: "James 1:17", translation: WEB } },
        ],
      },
    },
    {
      kind: "ptodayPray",
      page: { at: "top", mood: "tender", act: "settle" },
      poem,
      ask: "Want to pray it back to God?",
      pray: "Pray it",
      skip: "Not right now",
      prayer: {
        good: "Father, thank you for today. Thank you for {list}. Every good thing I have comes from you. Help me notice you tomorrow too. In Jesus’ name, amen.",
        hard: "Father, today was hard, and you know it. Still, thank you for {list}. Thank you that you didn’t leave. Help me rest tonight. In Jesus’ name, amen.",
      },
      amen: "Amen",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "nod" },
      calm: true,
      title: "Thank You for Today",
      body: "",
      summary: [
        "You wrote a poem out of one ordinary day.",
        "Thanks isn’t only for good days: it’s “in everything.”",
        "Every good gift comes down from the Father of lights.",
      ],
      refs: ["Psalm 118:24", "1 Thessalonians 5:16–18", "James 1:17", "Habakkuk 3:17–18"],
      related: [
        { title: "A Prayer of Gratitude", sub: "Learning to Pray · Philippians 4", lessonId: "pray-gratitude" },
        { title: "Enter With Thanks", sub: "Psalms & Emotions · Psalm 100", lessonId: "psalm-100" },
        { title: "You Are Still Loved", sub: "Closer Poetry · 3 min", lessonId: "poem-loved" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
