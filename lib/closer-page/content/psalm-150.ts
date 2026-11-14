import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Let Everything Praise" (Psalm 150). Suggested for praise.
   - Two movements: where and why to praise (1–2), then how, instrument by instrument, until "everything that has
     breath" (3–6). There's no lament and no turn, so none is invented: the landscape is bright and grows brighter.
   - "Praise Yah" is the Hebrew hallelujah; the screen says so. Psalm 150 closes the whole book of Psalms.
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm150: Psalm = {
  number: 150,
  title: "Psalm 150",
  about: "The last psalm, six verses of praise that close the whole book. “Praise Yah” is the Hebrew “hallelujah.”",
  verses: [
    v("Praise Yah!\nPraise God in his sanctuary!\nPraise him in his heavens for his acts of power!", "Psalm 150:1"),
    v("Praise him for his mighty acts!\nPraise him according to his excellent greatness!", "Psalm 150:2"),
    v("Praise him with the sounding of the trumpet!\nPraise him with harp and lyre!", "Psalm 150:3"),
    v("Praise him with tambourine and dancing!\nPraise him with stringed instruments and flute!", "Psalm 150:4"),
    v("Praise him with loud cymbals!\nPraise him with resounding cymbals!", "Psalm 150:5"),
    v("Let everything that has breath praise Yah!\nPraise Yah!", "Psalm 150:6"),
  ],
  key: v("Let everything that has breath praise Yah!\nPraise Yah!", "Psalm 150:6"),
  movements: [
    {
      id: "where", name: "Where and why", from: 1, to: 2, interaction: "landscape",
      summary: "Praise in the sanctuary and the heavens, for what God has done and who he is.",
      start: { light: 0.55, mist: 0.1, rain: 0, cloud: 0.1, stars: 0, glow: 0.4 },
      end: { light: 0.65, mist: 0.05, rain: 0, cloud: 0, stars: 0, glow: 0.55 },
      phrases: [
        { text: "Praise God in his sanctuary!", verse: 1, name: "Where: here", note: "In his sanctuary, where his people gather to worship.", scene: { cloud: 0 } },
        { text: "Praise him in his heavens", verse: 1, name: "Where: everywhere", note: "And in the heavens. Earth and sky, all of it.", scene: { glow: 0.5 } },
        { text: "for his acts of power!", verse: 1, name: "Why: what he does", note: "For his mighty acts.", scene: { light: 0.6 } },
        { text: "according to his excellent greatness!", verse: 2, name: "Why: who he is", note: "And as great as he is. The praise is sized to God.", scene: { light: 0.65, glow: 0.55, mist: 0.05 } },
      ],
    },
    {
      id: "how", name: "Every instrument", from: 3, to: 6, interaction: "transition",
      summary: "Trumpet, harp, dancing, cymbals, and finally everything that breathes.",
      start: { light: 0.65, mist: 0.05, rain: 0, cloud: 0, stars: 0, glow: 0.55 },
      end: { light: 0.85, mist: 0, rain: 0, cloud: 0, stars: 0, glow: 1 },
      phrases: [
        { text: "the sounding of the trumpet", verse: 3, name: "Trumpet", note: "The loudest call there was.", scene: { glow: 0.7 } },
        { text: "harp and lyre", verse: 3, name: "Strings", note: "Then gentle strings.", scene: { light: 0.75 } },
        { text: "tambourine and dancing", verse: 4, name: "Dancing", note: "Bodies join in, not only voices.", scene: { glow: 0.8 } },
        { text: "stringed instruments and flute", verse: 4, name: "Flute", note: "Breath becomes music.", scene: { light: 0.8 } },
        { text: "resounding cymbals", verse: 5, name: "Cymbals", note: "Loud cymbals, then resounding ones. Nothing held back.", scene: { glow: 0.9 } },
        { text: "Let everything that has breath praise Yah!", verse: 6, name: "Everyone", note: "Not only instruments. Everything that breathes.", scene: { glow: 1, light: 0.85 } },
      ],
    },
  ],
};

export const psalm150Experience = PsalmExperience(psalm150, {
  id: "psalm-150",
  title: "Let Everything Praise",
  subtitle: "Psalm 150 · praise, instrument by instrument",
  minutes: 4,
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
    notice: "This one is Psalm 150, often read in praise. That’s a suggestion, not a rule. You don’t have to feel it to read it. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This is the very last psalm.", mood: "happy", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Six verses, and nearly every line says “praise.”", mood: "happy", act: "nod" }],
  },
  movements: {
    where: {
      before: [{ say: "First: where, and why.", mood: "curious", act: "tilt" }],
      hint: "Touch the underlined words.",
      after: [{ say: "Here and everywhere. For what he does and who he is.", mood: "happy", act: "nod" }],
    },
    how: {
      before: [{ say: "Then: how. Listen for the instruments.", mood: "happy", act: "tilt" }],
      hint: "Carry the first verses up, or use the button.",
      after: [
        { say: "Everything that has breath.", mood: "moved" },
        { say: "Loud or quiet, every breath counts.", mood: "tender", act: "settle" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm at once.", mood: "tender" },
      { say: "No struggle here. Just praise, getting fuller.", mood: "happy", act: "nod" },
    ],
    after: [{ say: "The whole book of Psalms ends right here.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "Praise can be loud. It can also be one quiet breath.",
    stay: "Stay as long as you like. Just breathe, if you want to.",
  },
  close: {
    say: "“Everything that has breath.” That includes yours, today.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
