import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "No One Cares for My Soul" (Psalm 142). Suggested for loneliness.
   - Two movements: the cry from isolation (1–4), then turning to God as refuge (5–7).
   - It ends in a hope not yet reached: "the righteous will surround me" is future. The landscape stays dark and
     cave-like, with only a faint opening; there is no dawn, because the psalm doesn't give one.
   - The heading isn't quoted (it isn't in our checked text); the screen says many Bibles' heading links it to David
     in the cave, as tradition.
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm142: Psalm = {
  number: 142,
  title: "Psalm 142",
  about: "A short prayer from a place of being alone. In many Bibles its heading links it to David hiding in a cave; that link comes from tradition.",
  verses: [
    v("I cry with my voice to Yahweh.\nWith my voice, I ask Yahweh for mercy.", "Psalm 142:1"),
    v("I pour out my complaint before him.\nI tell him my troubles.", "Psalm 142:2"),
    v("When my spirit was overwhelmed within me,\nyou knew my route.\nOn the path in which I walk,\nthey have hidden a snare for me.", "Psalm 142:3"),
    v("Look on my right, and see;\nfor there is no one who is concerned for me.\nRefuge has fled from me.\nNo one cares for my soul.", "Psalm 142:4"),
    v("I cried to you, Yahweh.\nI said, “You are my refuge,\nmy portion in the land of the living.”", "Psalm 142:5"),
    v("Listen to my cry,\nfor I am in desperate need.\ndeliver me from my persecutors,\nFor they are stronger than me.", "Psalm 142:6"),
    v("Bring my soul out of prison,\nthat I may give thanks to your name.\nThe righteous will surround me,\nfor you will be good to me.", "Psalm 142:7"),
  ],
  key: v("I cried to you, Yahweh.\nI said, “You are my refuge,\nmy portion in the land of the living.”", "Psalm 142:5"),
  movements: [
    {
      id: "alone", name: "Alone", from: 1, to: 4, interaction: "landscape",
      summary: "He pours out his troubles: trapped, overwhelmed, with no one at his side.",
      start: { light: 0.02, mist: 0.3, rain: 0, cloud: 0.7, stars: 0.1, glow: 0 },
      end: { light: 0, mist: 0.55, rain: 0.2, cloud: 1, stars: 0, glow: 0 },
      phrases: [
        { text: "I pour out my complaint before him.", verse: 2, name: "Holding nothing back", note: "He doesn’t tidy it up. He pours it out, and he pours it out before God.", scene: { mist: 0.4 } },
        { text: "When my spirit was overwhelmed within me,", verse: 3, name: "Overwhelmed", note: "Inside, it’s too much for him.", scene: { mist: 0.55 } },
        { text: "you knew my route.", verse: 3, name: "Known, even so", note: "In the middle of it, he says God knew the way he was walking.", scene: { stars: 0.08 } },
        { text: "they have hidden a snare for me.", verse: 3, name: "Trapped", note: "Danger is hidden on the very path he walks.", scene: { cloud: 1 } },
        { text: "there is no one who is concerned for me.", verse: 4, name: "No one beside him", note: "A helper or defender often stood at someone’s right hand. He looks, and the place is empty.", scene: { rain: 0.2 } },
        { text: "No one cares for my soul.", verse: 4, name: "Loneliness", note: "Four short words of the bare truth as he feels it.", scene: { light: 0, stars: 0 }, say: "He says it plainly." },
      ],
    },
    {
      id: "refuge", name: "Refuge", from: 5, to: 7, interaction: "transition",
      summary: "He turns to God as his refuge, and hopes for a day not yet here.",
      start: { light: 0, mist: 0.55, rain: 0.2, cloud: 1, stars: 0, glow: 0 },
      end: { light: 0.05, mist: 0.4, rain: 0, cloud: 0.75, stars: 0.12, glow: 0.12 },
      phrases: [
        { text: "You are my refuge,", verse: 5, name: "Where refuge is", note: "In verse 4, “refuge has fled from me.” Now he says God himself is his refuge.", scene: { rain: 0 } },
        { text: "for I am in desperate need.", verse: 6, name: "Still in need", note: "Trusting God hasn’t made the need smaller. He still calls it desperate.", scene: { mist: 0.45 } },
        { text: "Bring my soul out of prison,", verse: 7, name: "Still inside", note: "He asks to be brought out. He isn’t out yet.", scene: { glow: 0.08 } },
        { text: "The righteous will surround me,", verse: 7, name: "A hope ahead", note: "From no one beside him to people all around. But it’s future: “will.” The psalm ends before it happens.", scene: { glow: 0.12, stars: 0.12 } },
      ],
    },
  ],
};

export const psalm142Experience = PsalmExperience(psalm142, {
  id: "psalm-142",
  title: "No One Cares for My Soul",
  subtitle: "Psalm 142 · alone, and a refuge",
  minutes: 5,
  entrance: {
    prompt: "How are you feeling today?",
    options: [
      { text: "Anxious", reply: "Thank you for telling me. You’re welcome here as you are." },
      { text: "Sad", reply: "Thank you for telling me. You don’t have to explain." },
      { text: "Angry", reply: "That’s honest. Honest is welcome here." },
      { text: "Grateful", reply: "That’s lovely. Gratitude belongs here too." },
      { text: "Lonely", reply: "Thank you for telling me. You’re welcome here." },
      { text: "Hopeful", reply: "Good to hear. Hope belongs here too." },
      { text: "I’d rather just explore", reply: "Of course. Let’s explore." },
    ],
    skip: "Skip for now",
    notice: "This one is Psalm 142, often read by people who feel alone. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This psalm comes from someone who felt completely alone.", mood: "tender", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 2],
    after: [{ say: "He speaks out loud, with his own voice. Let’s stay with him.", mood: "tender", act: "nod" }],
  },
  movements: {
    alone: {
      before: [{ say: "Four verses. Notice how alone he sounds.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Have you ever looked around and felt no one was there?", stay: "He felt that too, and he still spoke. There’s no hurry here." },
      after: [{ say: "He doesn’t pretend anyone is there.", mood: "moved", act: "nod" }],
    },
    refuge: {
      before: [{ say: "Then, in verse 5, he turns.", mood: "curious", act: "tilt" }],
      hint: "Drag his words up, or use the button.",
      after: [
        { say: "He’s still in the cave when the psalm ends.", mood: "thinking" },
        { say: "But he isn’t speaking to no one.", mood: "tender", act: "nod" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "It never quite reaches the light. That belongs too.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Alone, and then a refuge, with the hope still ahead.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can tell God your troubles, even when no one else is there to hear them.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "Feeling alone doesn’t mean you have to stay silent.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
