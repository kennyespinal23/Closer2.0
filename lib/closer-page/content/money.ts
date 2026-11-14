import type { Lesson } from "../lesson/types";

/* Misconception: "Money is the root of all evil."
   Kind: a popular misquote (MYTH_TYPES.misattributed): the Bible doesn't say this. 1 Timothy 6:10 says
   "the love of money is a root of all kinds of evil" — the love, not the money; a root, not the only one.
   The same chapter tells the rich not to hope in riches but to be generous (1 Timothy 6:17-18).
   Scripture is the World English Bible, word for word; "…" marks a quote that stops mid-verse. */

const WEB = "World English Bible";
const claim = "Money is the root of all evil.";
const truth = "Money itself isn’t evil. Loving it leads people astray. Held loosely, it can do a lot of good.";
const tim = {
  text: "For the love of money is a root of all kinds of evil. Some have been led astray from the faith in their greed, and have pierced themselves through with many sorrows.",
  ref: "1 Timothy 6:10",
  translation: WEB,
};

export const money = {
  id: "money",
  title: "Money is the root of all evil?",
  subtitle: "Read the whole line",
  kind: "Misconception",
  scripture: "1 Timothy 6",
  minutes: 5,
  theme: "navy",
  blocks: [
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "excited" },
      claim,
      lines: [
        { say: "Okay. This one is almost a verse.", mood: "cheeky", act: "stare" },
        { say: "“Money is the root of all evil.”", mood: "neutral", act: "settle" },
        { say: "Is that what the Bible says?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "It’s really close to something in there. Let’s look at the exact words.", mood: "happy", act: "nod" },
        { text: "No", reply: "Ooh. Let’s see how close it gets.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Perfect. Details matter on this one.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s the actual verse. Read every word.", mood: "curious", open: true }],
      verse: tim,
      reply: "I’ve read it",
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: tim,
      target: "the love of money",
      before: [{ say: "Look at the start. What’s the root, exactly?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark what Paul calls the root, or tap it",
      after: [
        { say: "The love of money!", at: "top", mood: "surprised", act: "spin" },
        { say: "Money isn’t the problem. Loving it is.", mood: "thinking" },
        { say: "And it says “a root of all kinds of evil.” Not the root of everything.", mood: "cheeky", act: "nod" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Now, a few lines later, Paul talks to rich people.", mood: "cheeky", act: "stare", open: true },
        { say: "Does he tell them money is evil?", show: "verse", mood: "curious", act: "tilt" },
      ],
      verse: {
        text: "Charge those who are rich in this present world that they not be haughty, nor have their hope set on the uncertainty of riches, but on the living God, who richly provides us with everything to enjoy; that they do good, that they be rich in good works…",
        ref: "1 Timothy 6:17–18",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "nor have their hope set on the uncertainty of riches", label: "Not hoping in money", note: "Don’t put your hope in it. It’s uncertain." },
        { phrase: "rich in good works", label: "Rich in good works", note: "Be rich in something better." },
      ],
      after: [
        { say: "He doesn’t tell them money is evil.", at: "top", mood: "surprised", act: "hop", open: false },
        { say: "He tells them where to put their hope, and to be generous.", mood: "thinking" },
        { say: "Money held loosely can do a lot of good.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "correct",
      page: { at: "top", mood: "cheeky" },
      claim,
      type: "misattributed",
      before: [
        { say: "Back to our claim.", mood: "cheeky", act: "stare" },
        { say: "Based on the evidence…", mood: "curious", act: "tilt" },
      ],
      action: "Cross it out",
      after: [
        { say: "Close, but it drops three important words: “the love of”.", show: "type", mood: "excited" },
        { say: "Here’s what Scripture actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth,
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Money is the root of all evil?",
      lines: [
        { say: "Money’s a touchy subject. No judgment here.", mood: "tender" },
        { say: "But it’s worth asking where your hope sits.", mood: "thinking" },
      ],
      ask: "What would being generous look like for you this week?",
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
      myth: { claim, truth, refs: ["1 Timothy 6:10", "1 Timothy 6:17–18"], type: "misattributed" },
      verse: tim,
      button: "Finish",
    },
  ],
} satisfies Lesson;
