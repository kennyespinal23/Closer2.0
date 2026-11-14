import type { Lesson } from "../lesson/types";

/* Misconception: "Adam and Eve ate an apple."
   Kind: a traditional detail Scripture never gives (MYTH_TYPES.tradition). Genesis says only "fruit" from
   "the tree of the knowledge of good and evil". The apple comes from later tradition and art; one popular
   explanation (not certain) is the Latin wordplay malum, "evil", and mālum, "apple". The story's focus is
   trust in God's word, not the kind of fruit.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const claim = "Adam and Eve ate an apple.";
const truth = "The Bible never names the fruit. The story is about trusting God, not about what grew on the tree.";
const gen = {
  text: "When the woman saw that the tree was good for food, and that it was a delight to the eyes, and that the tree was to be desired to make one wise, she took some of its fruit, and ate; and she gave some to her husband with her, and he ate it, too.",
  ref: "Genesis 3:6",
  translation: WEB,
};

export const apple = {
  id: "apple",
  title: "Was it an apple?",
  subtitle: "Check the fruit",
  kind: "Misconception",
  scripture: "Genesis 2–3",
  minutes: 4,
  theme: "navy",
  blocks: [
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "excited" },
      claim,
      lines: [
        { say: "Okay. The garden of Eden. The forbidden fruit.", mood: "cheeky", act: "stare" },
        { say: "Everybody pictures the same thing.", mood: "neutral", act: "settle" },
        { say: "But does the Bible say it was an apple?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "It’s in every painting, so fair enough. Let’s check the text.", mood: "happy", act: "nod" },
        { text: "No", reply: "Suspicious of the apple. I like it. Let’s look.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Great. Let’s go read it for ourselves.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s the moment itself.", mood: "curious", open: true }],
      verse: gen,
      reply: "I’ve read it",
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: gen,
      target: "she took some of its fruit",
      before: [{ say: "Find the fruit. What kind does it say?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark the fruit, or tap it",
      after: [
        { say: "Just “fruit”!", at: "top", mood: "surprised", act: "spin" },
        { say: "No apple. No fig. No pomegranate. It never says.", mood: "cheeky", act: "stare" },
        { say: "One popular idea: in Latin, “evil” and “apple” are both malum.", mood: "thinking" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Clue number two. What God actually said.", mood: "cheeky", act: "stare", open: true },
        { say: "Look at what it names, and what it doesn’t.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "Yahweh God commanded the man, saying, “You may freely eat of every tree of the garden; but you shall not eat of the tree of the knowledge of good and evil; for in the day that you eat of it, you will surely die.”",
        ref: "Genesis 2:16–17",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "freely eat of every tree of the garden", label: "Every tree but one", note: "Every tree! God was generous." },
        { phrase: "the tree of the knowledge of good and evil", label: "The tree is named", note: "The tree gets a name. The fruit never does." },
      ],
      after: [
        { say: "The story cares about the tree, and about trust.", at: "top", mood: "thinking", open: false },
        { say: "Would they believe God was good, or go their own way?", mood: "tender" },
        { say: "That’s the question that still matters.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "correct",
      page: { at: "top", mood: "cheeky" },
      claim,
      type: "tradition",
      before: [
        { say: "Back to our claim.", mood: "cheeky", act: "stare" },
        { say: "Based on the evidence…", mood: "curious", act: "tilt" },
      ],
      action: "Cross it out",
      after: [
        { say: "It’s tradition. Apples everywhere can relax.", show: "type", mood: "excited" },
        { say: "Here’s what Scripture actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth,
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Was it an apple?",
      lines: [
        { say: "Here’s the real question underneath this story.", mood: "tender" },
        { say: "Do you trust that God is good, even when you can’t see why?", mood: "thinking" },
      ],
      ask: "Where is it hard to trust God right now?",
      write: "Write it down",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      title: "Case closed.",
      body: "The Lord is always closer than you think.",
      myth: { claim, truth, refs: ["Genesis 3:6", "Genesis 2:16–17"], type: "tradition" },
      verse: gen,
      button: "Finish",
    },
  ],
} satisfies Lesson;
