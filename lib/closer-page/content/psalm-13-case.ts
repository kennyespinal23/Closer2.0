import type { Lesson } from "../lesson/types";
import { psalm13 } from "./psalm-13";

/* Psalm 13, built on the lesson rules from the Misconceptions (CLOSER-PICKS.md, 2026-11-15): one question at the
   start, three clues from the psalm itself, one cross-out, a card to take away. The claim is a common belief, not
   a saying anyone attributes to Scripture, so its type is "contradicts": Psalm 13 is itself a prayer that doesn't
   sound okay. Page says plainly that the psalm never says the trouble was over.
   The earlier movement-by-movement version stays as "psalm-13-classic" for comparison.
   Scripture is the World English Bible, word for word; the psalm's line breaks are joined with spaces here. */

const WEB = "World English Bible";
const claim = "You have to sound okay to talk to God.";
const truth = "You can bring God your worst questions. David did, and still called him “my God.”";
const v1 = { text: "How long, Yahweh? Will you forget me forever? How long will you hide your face from me?", ref: "Psalm 13:1", translation: WEB };
const v3 = { text: "Behold, and answer me, Yahweh, my God. Give light to my eyes, lest I sleep in death;", ref: "Psalm 13:3", translation: WEB };
const v5 = { text: "But I trust in your loving kindness. My heart rejoices in your salvation.", ref: "Psalm 13:5", translation: WEB };

export const psalm13Case = {
  id: "psalm-13",
  title: "When God Feels Far Away",
  subtitle: "Psalm 13 · can you be honest with God?",
  kind: "Psalm",
  scripture: "Psalm 13",
  minutes: 5,
  theme: "seaglass",
  psalm: psalm13,
  blocks: [
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "tender" },
      claim,
      lines: [
        { say: "A lot of people quietly believe this one.", mood: "thinking", act: "tilt" },
        { say: "“You have to sound okay to talk to God.”", mood: "neutral", act: "settle" },
        { say: "Is that true?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "Lots of people feel that way. Let’s check.", mood: "tender", act: "nod" },
        { text: "No", reply: "Let’s see if the Bible agrees with you.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Good. Let’s find out together.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s how one of David’s prayers begins. Psalm 13.", mood: "curious", open: true }],
      verse: v1,
      reply: "I’ve read it",
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: v1,
      target: "Will you forget me forever?",
      before: [{ say: "Look closely. What does he ask God?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark his question, or tap it",
      after: [
        { say: "“Will you forget me forever?”", at: "top", mood: "surprised", act: "spin" },
        { say: "That doesn’t sound okay at all.", mood: "thinking" },
        { say: "And it’s in the Bible, as a prayer.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Clue number two.", mood: "cheeky", act: "stare", open: true },
        { say: "He’s still upset in verse 3. Watch what he says.", show: "verse", mood: "curious" },
      ],
      verse: v3,
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "answer me", label: "He asks", note: "He doesn’t wait to feel better. He asks God to answer." },
        { phrase: "my God", label: "Still “my God”", note: "He feels forgotten, and he still calls him “my God.”" },
      ],
      after: [
        { say: "Upset, and still talking to God.", at: "top", mood: "moved", act: "nod", open: false },
        { say: "Honest and close, at the same time.", mood: "tender" },
      ],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: v5,
      target: "But I trust in your loving kindness.",
      before: [
        { say: "Clue number three. Here’s how the prayer ends.", mood: "cheeky", act: "stare" },
        { say: "Find where it turns.", show: "verse", mood: "curious", act: "tilt" },
      ],
      prompt: "Mark where it turns, or tap it",
      after: [
        { say: "“But I trust.”", at: "top", mood: "surprised", act: "spin" },
        { say: "Nothing says his trouble was over.", mood: "thinking" },
        { say: "He got to trust by being honest first.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "correct",
      page: { at: "top", mood: "cheeky" },
      claim,
      type: "contradicts",
      before: [
        { say: "Okay. Back to our claim.", mood: "cheeky", act: "stare" },
        { say: "Based on the evidence…", mood: "curious", act: "tilt" },
      ],
      action: "Cross it out",
      after: [
        { say: "David prayed “How long?” and it became Scripture.", show: "type", mood: "excited" },
        { say: "Here’s what Psalm 13 actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth,
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Psalm 13",
      lines: [
        { say: "If you’ve been waiting to feel okay before you pray, you don’t have to.", mood: "tender" },
        { say: "You can start with “How long?”", mood: "moved" },
      ],
      ask: "What would you tell God if you were completely honest?",
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
      myth: { claim, truth, refs: ["Psalm 13:1", "Psalm 13:3", "Psalm 13:5"], type: "contradicts" },
      verse: v5,
      button: "Finish",
    },
  ],
} satisfies Lesson;
