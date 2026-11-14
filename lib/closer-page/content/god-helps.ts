import type { Lesson } from "../lesson/types";

/* Misconception: "God helps those who help themselves."
   Kind: a popular saying wrongly attributed to Scripture (MYTH_TYPES.misattributed). The line is an old
   proverb, made famous by Benjamin Franklin's Poor Richard's Almanack (1736). Scripture shows God helping
   the helpless (Romans 5:6) and salvation as a gift, not earned (Ephesians 2:8-9). It also calls us to
   work (Proverbs 6:6), so the correction isn't "do nothing": it's that God's help isn't a reward for effort.
   Scripture is the World English Bible, word for word; "…" marks a quote that starts or stops mid-verse. */

const WEB = "World English Bible";
const claim = "God helps those who help themselves.";
const truth = "God helps the helpless. We’re called to work hard, but his help is a gift, not a reward for effort.";
const rom = { text: "For while we were yet weak, at the right time Christ died for the ungodly.", ref: "Romans 5:6", translation: WEB };

export const godHelps = {
  id: "god-helps",
  title: "God helps those who help themselves?",
  subtitle: "Is it in there?",
  kind: "Misconception",
  scripture: "Romans 5 · Ephesians 2",
  minutes: 5,
  theme: "navy",
  blocks: [
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "excited" },
      claim,
      lines: [
        { say: "This one gets quoted like a verse all the time.", mood: "cheeky", act: "stare" },
        { say: "“God helps those who help themselves.”", mood: "neutral", act: "settle" },
        { say: "Is that in the Bible?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "You’re in good company. Loads of people think so. Let’s check.", mood: "happy", act: "nod" },
        { text: "No", reply: "Bold. Let’s see what the evidence says.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Great. Let’s find out together.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s how Paul describes when God stepped in for us.", mood: "curious", open: true }],
      verse: rom,
      reply: "I’ve read it",
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: rom,
      target: "while we were yet weak",
      before: [{ say: "Look closely. When did God help?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark when it happened, or tap it",
      after: [
        { say: "While we were weak!", at: "top", mood: "surprised", act: "spin" },
        { say: "Not once we’d got ourselves together. While we couldn’t.", mood: "thinking" },
        { say: "God helps the helpless. That’s good news for every one of us.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Clue number two.", mood: "cheeky", act: "stare", open: true },
        { say: "Here’s how Paul says we’re saved.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.",
        ref: "Ephesians 2:8–9",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "not of yourselves", label: "Not our effort", note: "Not of yourselves. So not by helping ourselves." },
        { phrase: "the gift of God", label: "God’s gift", note: "A gift. You can’t earn a gift." },
      ],
      after: [
        { say: "So God’s help isn’t a prize for trying hard enough.", at: "top", mood: "moved", act: "nod", open: false },
        { say: "But hang on. That doesn’t mean sit around.", show: "more", mood: "cheeky", act: "stare" },
        { say: "Work hard. Just don’t mistake it for earning God’s help.", mood: "happy", act: "nod" },
      ],
      more: { text: "Go to the ant, you sluggard. Consider her ways, and be wise;", ref: "Proverbs 6:6", translation: WEB },
    },
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
        { say: "It’s an old proverb. Benjamin Franklin made it famous in 1736.", show: "type", mood: "excited" },
        { say: "Here’s what Scripture actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth,
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "God helps those who help themselves?",
      lines: [
        { say: "If you’ve been trying to earn God’s help, you can put that down.", mood: "tender" },
        { say: "He’s for you, even on your weakest day.", mood: "moved" },
      ],
      ask: "Where do you need help right now?",
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
      myth: { claim, truth, refs: ["Romans 5:6", "Ephesians 2:8–9", "Proverbs 6:6"], type: "misattributed" },
      verse: rom,
      button: "Finish",
    },
  ],
} satisfies Lesson;
