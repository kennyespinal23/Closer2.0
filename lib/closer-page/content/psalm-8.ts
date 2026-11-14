import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "What Is Man?" (Psalm 8). Suggested for wonder.
   - Four movements: the name (1–2), under the night sky (3–4), crowned (5–8), and the same line again (9). The psalm
     opens and closes with the same words (1, 9), and the experience shows that.
   - The landscape is a starry night throughout: more stars, a little glow, never dawn. There's no struggle to resolve.
   - Hebrews 2:6–8 quotes verses 4–6 and reads them about Jesus; Page mentions it as how Christians read it.
   - The heading isn't quoted; the screen says many Bibles' heading names David. Scripture is the World English Bible. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm8: Psalm = {
  number: 8,
  title: "Psalm 8",
  about: "A hymn of nine verses that begins and ends with the same line. Many Bibles’ heading names David, and tradition attributes it to him.",
  verses: [
    v("Yahweh, our Lord, how majestic is your name in all the earth,\nwho has set your glory above the heavens!", "Psalm 8:1"),
    v("From the lips of babes and infants you have established strength,\nbecause of your adversaries, that you might silence the enemy and the avenger.", "Psalm 8:2"),
    v("When I consider your heavens, the work of your fingers,\nthe moon and the stars, which you have ordained;", "Psalm 8:3"),
    v("what is man, that you think of him?\nWhat is the son of man, that you care for him?", "Psalm 8:4"),
    v("For you have made him a little lower than the angels,\nand crowned him with glory and honor.", "Psalm 8:5"),
    v("You make him ruler over the works of your hands.\nYou have put all things under his feet:", "Psalm 8:6"),
    v("All sheep and cattle,\nyes, and the animals of the field,", "Psalm 8:7"),
    v("The birds of the sky, the fish of the sea,\nand whatever passes through the paths of the seas.", "Psalm 8:8"),
    v("Yahweh, our Lord,\nhow majestic is your name in all the earth!", "Psalm 8:9"),
  ],
  key: v("what is man, that you think of him?\nWhat is the son of man, that you care for him?", "Psalm 8:4"),
  movements: [
    {
      id: "name", name: "The name", from: 1, to: 2, interaction: "landscape",
      summary: "It opens in wonder at God’s name, over all the earth and above the heavens.",
      start: { light: 0.03, mist: 0.1, rain: 0, cloud: 0, stars: 0.8, glow: 0 },
      end: { light: 0.04, mist: 0.05, rain: 0, cloud: 0, stars: 0.95, glow: 0.05 },
      phrases: [
        { text: "how majestic is your name in all the earth", verse: 1, name: "Wonder", note: "The psalm starts by simply marvelling at who God is.", scene: { stars: 0.95 } },
        { text: "set your glory above the heavens!", verse: 1, name: "Higher than the sky", note: "However big the night sky is, God’s glory is above it.", scene: { glow: 0.05 } },
        { text: "From the lips of babes and infants", verse: 2, name: "Strength from the small", note: "God’s strength is shown through the smallest voices.", scene: { mist: 0.05 } },
      ],
    },
    {
      id: "sky", name: "Under the night sky", from: 3, to: 4, interaction: "transition",
      summary: "He looks up at the moon and stars and asks why God thinks of people at all.",
      start: { light: 0.04, mist: 0.05, rain: 0, cloud: 0, stars: 0.95, glow: 0.05 },
      end: { light: 0.05, mist: 0.05, rain: 0, cloud: 0, stars: 1, glow: 0.08 },
      phrases: [
        { text: "When I consider your heavens", verse: 3, name: "Looking up", note: "He stops and really looks at the night sky.", scene: { stars: 1 } },
        { text: "the moon and the stars", verse: 3, name: "God’s handiwork", note: "He calls them “the work of your fingers,” as if the whole sky were fine craft.", scene: { glow: 0.08 } },
        { text: "what is man, that you think of him?", verse: 4, name: "Small", note: "Next to all that, people seem tiny. Why would God think of us?" },
        { text: "that you care for him?", verse: 4, name: "Cared for", note: "The wonder isn’t only that we’re small. It’s that God cares." },
      ],
    },
    {
      id: "crowned", name: "Crowned", from: 5, to: 8, interaction: "shift",
      summary: "Small under the sky, yet crowned with glory and given God’s works to rule.",
      start: { light: 0.05, mist: 0.05, rain: 0, cloud: 0, stars: 1, glow: 0.08 },
      end: { light: 0.1, mist: 0.05, rain: 0, cloud: 0, stars: 1, glow: 0.2 },
      phrases: [],
      hinge: { word: "For", verse: 5, note: "Here’s the answer to “what is man?”" },
      pairs: [
        { before: { text: "what is man, that you think of him?", verse: 4 }, after: { text: "crowned him with glory and honor.", verse: 5 }, note: "Small under the stars, yet crowned. Both are true at once." },
        { before: { text: "the work of your fingers", verse: 3 }, after: { text: "You make him ruler over the works of your hands.", verse: 6 }, note: "The same works of God are put in human hands. Many read this as a calling to care for them." },
        { before: { text: "the moon and the stars", verse: 3 }, after: { text: "The birds of the sky, the fish of the sea", verse: 8 }, note: "From the heavens down to the sea: all of creation fills the psalm." },
      ],
    },
    {
      id: "again", name: "The name again", from: 9, to: 9, interaction: "landscape",
      summary: "It ends with the very words it began with.",
      start: { light: 0.1, mist: 0.05, rain: 0, cloud: 0, stars: 1, glow: 0.2 },
      end: { light: 0.1, mist: 0.05, rain: 0, cloud: 0, stars: 1, glow: 0.25 },
      phrases: [
        { text: "how majestic is your name in all the earth!", verse: 9, name: "Back where it began", note: "The last line repeats the first. Wonder at the start, wonder at the end.", scene: { glow: 0.25 } },
      ],
    },
  ],
};

export const psalm8Experience = PsalmExperience(psalm8, {
  id: "psalm-8",
  title: "What Is Man?",
  subtitle: "Psalm 8 · wonder under the night sky",
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
    notice: "This one is Psalm 8, often read with a sense of wonder. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "Have you ever looked up at a night sky and felt small?", mood: "curious", act: "tilt" },
      { say: "Listen to how this psalm begins.", mood: "thinking", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Nine verses. Remember that first line.", mood: "tender", act: "nod" }],
  },
  movements: {
    name: {
      before: [{ say: "It starts with wonder.", mood: "happy", act: "settle" }],
      hint: "Touch the underlined words.",
      after: [{ say: "Then he looks up.", mood: "curious", act: "tilt", look: 0.4 }],
    },
    sky: {
      before: [{ say: "Verses 3 and 4. Night, moon and stars.", mood: "thinking" }],
      hint: "Carry the opening up into the sky, or use the button.",
      after: [
        { say: "Why would God think of us?", mood: "thinking" },
        { say: "The psalm asks it and lets it hang.", mood: "tender", act: "nod" },
      ],
    },
    crowned: {
      before: [{ say: "Then comes the answer.", mood: "curious", act: "tilt" }],
      hint: "Find the word where it turns.",
      after: [
        { say: "Small and crowned, both at once.", mood: "moved", act: "nod" },
        { say: "Hebrews 2 quotes this and reads it about Jesus too.", mood: "thinking", act: "settle" },
      ],
    },
    again: {
      before: [{ say: "And the last verse. Sound familiar?", mood: "cheeky", act: "tilt" }],
      hint: "Touch the underlined words.",
      after: [{ say: "It ends where it began: in wonder.", mood: "moved", act: "settle" }],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "It stays night the whole way. Full of stars.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Wonder, smallness and honour: all of it is in Scripture.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You are small under a very big sky, and you are not forgotten.",
    stay: "Stay as long as you like. Look up, if you can.",
  },
  close: {
    say: "Wonder is a way of speaking to God too.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
