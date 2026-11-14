import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Like Streams in the Negev" (Psalm 126). Suggested for hope.
   - Two movements, looking both ways: remembered joy (1–3, bright and dreamlike), then a prayer for it again
     (4–6). The landscape goes from bright memory to a dry place waiting for rain; it doesn't end in a downpour,
     because the psalm ends with seed still being carried, before the harvest.
   - Negev: the dry south of Israel, whose stream beds fill quickly when the rains come (a note, not a quotation).
   - Many readers link the return to Zion with the return from exile in Babylon; the psalm doesn't name it, so the
     screen says "many readers".
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm126: Psalm = {
  number: 126,
  title: "Psalm 126",
  about: "A song of six verses that looks back at a joy God gave, then asks for it again. It’s one of the “Songs of Ascents,” Psalms 120–134.",
  verses: [
    v("When Yahweh brought back those who returned to Zion,\nwe were like those who dream.", "Psalm 126:1"),
    v("Then our mouth was filled with laughter,\nand our tongue with singing.\nThen they said among the nations,\n“Yahweh has done great things for them.”", "Psalm 126:2"),
    v("Yahweh has done great things for us,\nand we are glad.", "Psalm 126:3"),
    v("Restore our fortunes again, Yahweh,\nlike the streams in the Negev.", "Psalm 126:4"),
    v("Those who sow in tears will reap in joy.", "Psalm 126:5"),
    v("He who goes out weeping, carrying seed for sowing,\nwill certainly come again with joy, carrying his sheaves.", "Psalm 126:6"),
  ],
  key: v("Those who sow in tears will reap in joy.", "Psalm 126:5"),
  movements: [
    {
      id: "remember", name: "Remembered joy", from: 1, to: 3, interaction: "landscape",
      summary: "They remember a joy so great it felt like a dream.",
      start: { light: 0.55, mist: 0.3, rain: 0, cloud: 0, stars: 0, glow: 0.4 },
      end: { light: 0.75, mist: 0.15, rain: 0, cloud: 0, stars: 0, glow: 0.85 },
      phrases: [
        { text: "we were like those who dream.", verse: 1, name: "Too good to be true", note: "When God brought them back, it didn’t feel real. Many readers think of the return from exile in Babylon; the psalm doesn’t name it.", scene: { mist: 0.4 } },
        { text: "Then our mouth was filled with laughter,", verse: 2, name: "Laughter", note: "Joy so full it spilled out as laughing and singing.", scene: { light: 0.65, glow: 0.6 } },
        { text: "Yahweh has done great things for them.", verse: 2, name: "Others noticed", note: "Even the nations around them saw it.", scene: { mist: 0.2 } },
        { text: "Yahweh has done great things for us,", verse: 3, name: "Their own words", note: "They take the nations’ words and say them for themselves.", scene: { light: 0.75, glow: 0.85, mist: 0.15 }, say: "They say it for themselves." },
      ],
    },
    {
      id: "again", name: "Again, please", from: 4, to: 6, interaction: "transition",
      summary: "They ask God to do it again, while the ground is still dry.",
      start: { light: 0.75, mist: 0.15, rain: 0, cloud: 0, stars: 0, glow: 0.85 },
      end: { light: 0.35, mist: 0.1, rain: 0, cloud: 0.45, stars: 0, glow: 0.2 },
      phrases: [
        { text: "Restore our fortunes again, Yahweh,", verse: 4, name: "Again", note: "The joy was real, and it isn’t here now. So they ask for it again.", scene: { light: 0.4 } },
        { text: "like the streams in the Negev.", verse: 4, name: "Dry riverbeds", note: "The Negev is the dry south. Its stream beds sit empty for months, then fill fast when the rain comes.", scene: { cloud: 0.45 }, say: "Waiting for rain." },
        { text: "Those who sow in tears will reap in joy.", verse: 5, name: "Tears and seed", note: "Sowing happens while the tears are still there. The joy comes at harvest, later.", scene: { glow: 0.2 } },
        { text: "carrying seed for sowing,", verse: 6, name: "Not yet harvest", note: "The psalm ends with the seed still being carried. The sheaves are a promise, not yet in hand.", scene: { light: 0.35 } },
      ],
    },
  ],
};

export const psalm126Experience = PsalmExperience(psalm126, {
  id: "psalm-126",
  title: "Like Streams in the Negev",
  subtitle: "Psalm 126 · remembering, and asking again",
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
    notice: "This one is Psalm 126, often read for hope. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This psalm looks two ways: back, and forward.", mood: "curious", act: "tilt" },
      { say: "Listen to how it begins.", mood: "thinking", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "A memory first. Let’s step into it.", mood: "happy", act: "nod" }],
  },
  movements: {
    remember: {
      before: [{ say: "Three verses of remembering.", mood: "happy", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Is there a time you remember God being good to you?", stay: "You don’t need to name it. Just let it come to mind, if it does." },
      after: [{ say: "That was real joy. Now watch what happens next.", mood: "thinking", act: "nod" }],
    },
    again: {
      before: [{ say: "Then, in verse 4, the song asks for something.", mood: "curious", act: "tilt" }],
      hint: "Drag the memory up, or use the button.",
      after: [
        { say: "Hope here is remembering, and asking again.", mood: "tender" },
        { say: "Even while the ground is still dry.", mood: "moved", act: "nod" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "The bright memory and the dry ground, side by side.", mood: "thinking", act: "nod" },
    ],
    after: [{ say: "Joy remembered, and joy still hoped for. Both are in it.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can remember what God has done, and ask him for it again.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "Hoping can mean sowing while you’re still in tears.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
