import type { Lesson } from "../lesson/types";

/* Misconception: "God won't give you more than you can handle."
   Kind: a popular saying wrongly attributed to Scripture (MYTH_TYPES.misattributed).
   It's usually drawn from 1 Corinthians 10:13, which is about temptation (the Greek word can also mean
   testing) and God's faithfulness in providing a way to endure, in a passage warning against idolatry
   (10:12-14). Paul himself says he was burdened beyond his strength, and that it taught him to rely on God
   (2 Corinthians 1:8-9).
   Scripture is the World English Bible, word for word; "…" marks where a quote starts or stops mid-verse. */

const WEB = "World English Bible";
const claim = "God will never give you more than you can handle.";
const cor = {
  text: "No temptation has taken you except what is common to man. God is faithful, who will not allow you to be tempted above what you are able, but will with the temptation also make the way of escape, that you may be able to endure it.",
  ref: "1 Corinthians 10:13",
  translation: WEB,
};

export const moreThanYouCanHandle = {
  id: "more-than-you-can-handle",
  title: "God won’t give you more than you can handle?",
  subtitle: "Is it actually in the Bible?",
  kind: "Misconception",
  scripture: "1 Corinthians 10 · 2 Corinthians 1",
  minutes: 5,
  theme: "navy",
  blocks: [
    // 1. The claim (MisconceptionClaim + TruthChoice)
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "excited" },
      claim,
      lines: [
        { say: "Okay, I’ve heard this one a lot.", mood: "cheeky", act: "stare" },
        { say: "“God will never give you more than you can handle.”", mood: "neutral", act: "settle" },
        { say: "Is that actually in the Bible?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "Lots of people think so. It really sounds like it could be. Let’s check.", mood: "happy", act: "nod" },
        { text: "No", reply: "Ooh, confident. Let’s see if the evidence backs you up.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Perfect. That’s exactly where a good investigation starts.", mood: "excited", act: "hop" },
      ],
    },
    // 2. The evidence (ScriptureEvidence)
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s the verse people usually mean.", mood: "curious", open: true }],
      verse: cor,
      reply: "I’ve read it",
    },
    // 3. Spot the difference (PhraseHighlight)
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: cor,
      target: "to be tempted above what you are able",
      before: [{ say: "Look closely. What’s Paul actually talking about?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark the words about temptation, or tap them",
      after: [
        { say: "Temptation!", at: "top", mood: "surprised", act: "spin" },
        { say: "He’s warning about temptation. Next line: run from idols.", mood: "thinking" },
        { say: "The word can also mean “testing”. Either way, it’s about God being faithful.", mood: "thinking", act: "nod" },
        { say: "He makes a way to endure. That’s not a promise life won’t get too heavy.", mood: "happy" },
      ],
    },
    // 4. Another clue (ContextReveal)
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Now look at what Paul says somewhere else.", mood: "cheeky", act: "stare", open: true },
        { say: "He’s writing about something that really happened to him.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "…that we were weighed down exceedingly, beyond our power, so much that we despaired even of life. Yes, we ourselves have had the sentence of death within ourselves, that we should not trust in ourselves, but in God who raises the dead…",
        ref: "2 Corinthians 1:8–9",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "weighed down exceedingly, beyond our power", label: "Beyond his strength", note: "Beyond his power. Paul says it straight out." },
        { phrase: "not trust in ourselves, but in God who raises the dead", label: "Trusting God", note: "And this is what it taught him." },
      ],
      after: [
        { say: "So Paul faced more than he could handle.", at: "top", mood: "surprised", act: "hop", open: false },
        { say: "It didn’t mean he’d failed. It didn’t mean God had left him.", mood: "tender" },
        { say: "It taught him to rely on God instead of himself.", mood: "moved", act: "nod" },
      ],
    },
    // 5. The reveal (MythCorrection)
    {
      kind: "correct",
      page: { at: "top", mood: "cheeky" },
      claim,
      type: "misattributed",
      before: [
        { say: "Okay. Back to our claim.", mood: "cheeky", act: "stare" },
        { say: "Based on the evidence…", mood: "curious", act: "tilt" },
      ],
      action: "Cross it out",
      after: [
        { say: "It’s a saying. Not a verse.", show: "type", mood: "excited" },
        { say: "Here’s what Scripture actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth: "God doesn’t promise a life without overwhelming hardship. He invites us to depend on him.",
    },
    // 6. Apply it (Reflection)
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "More than you can handle?",
      lines: [
        { say: "So if you’re feeling overwhelmed, it doesn’t mean you’ve failed.", mood: "tender" },
        { say: "You don’t have to carry everything by yourself.", mood: "moved" },
      ],
      ask: "What feels heavy right now?",
      write: "Write it down",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    // 7. Case closed (MisconceptionComplete)
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      title: "Case closed.",
      body: "The Lord is always closer than you think.",
      myth: {
        claim,
        truth: "God doesn’t promise a life without overwhelming hardship. He invites us to depend on him.",
        refs: ["1 Corinthians 10:13", "2 Corinthians 1:8–9"],
        type: "misattributed",
      },
      verse: cor,
      button: "Finish",
    },
  ],
} satisfies Lesson;
