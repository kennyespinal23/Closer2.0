import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Before You Lie Down" (Psalm 4). Suggested for anger; a suggestion, not a rule.
   - Three movements, an evening psalm: speaking to God (1), speaking to the people around him (2–5), lying down in
     peace (6–8). The landscape goes from dusk to a calm, starry night, not a dawn.
   - Verse 4 in the WEB reads "Stand in awe, and don’t sin." Some translations, following the Greek Old Testament,
     read "Be angry, and don’t sin", the wording Paul quotes in Ephesians 4:26. The note says so plainly.
   - The heading isn't quoted; the screen describes it and labels David's authorship as tradition. Nothing chosen on
     the entrance is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm4: Psalm = {
  number: 4,
  title: "Psalm 4",
  about: "An evening prayer of eight verses. In many Bibles its heading is for the music director, with stringed instruments, and names David; tradition attributes it to him.",
  verses: [
    v("Answer me when I call, God of my righteousness.\nGive me relief from my distress.\nHave mercy on me, and hear my prayer.", "Psalm 4:1"),
    v("You sons of men, how long shall my glory be turned into dishonor?\nWill you love vanity, and seek after falsehood?\nSelah.", "Psalm 4:2"),
    v("But know that Yahweh has set apart for himself him who is godly:\nYahweh will hear when I call to him.", "Psalm 4:3"),
    v("Stand in awe, and don’t sin.\nSearch your own heart on your bed, and be still.\nSelah.", "Psalm 4:4"),
    v("Offer the sacrifices of righteousness.\nPut your trust in Yahweh.", "Psalm 4:5"),
    v("Many say, “Who will show us any good?”\nYahweh, let the light of your face shine on us.", "Psalm 4:6"),
    v("You have put gladness in my heart,\nmore than when their grain and their new wine are increased.", "Psalm 4:7"),
    v("In peace I will both lay myself down and sleep,\nfor you, Yahweh alone, make me live in safety.", "Psalm 4:8"),
  ],
  key: v("In peace I will both lay myself down and sleep,\nfor you, Yahweh alone, make me live in safety.", "Psalm 4:8"),
  movements: [
    {
      id: "god", name: "To God", from: 1, to: 1, interaction: "landscape",
      summary: "He starts with God: answer me, relieve me, hear me.",
      start: { light: 0.38, mist: 0.15, rain: 0, cloud: 0.35, stars: 0.1, glow: 0.4 },
      end: { light: 0.3, mist: 0.2, rain: 0, cloud: 0.5, stars: 0.15, glow: 0.3 },
      phrases: [
        { text: "Answer me when I call", verse: 1, name: "Straight to God", note: "Before he says a word to anyone else, he speaks to God.", scene: { glow: 0.35 } },
        { text: "Give me relief from my distress.", verse: 1, name: "Pressed in", note: "The word pictures being hemmed in. He asks God for room to breathe.", scene: { cloud: 0.5 } },
        { text: "Have mercy on me, and hear my prayer.", verse: 1, name: "Asking to be heard", note: "He doesn’t claim he deserves it. He asks for mercy.", scene: { light: 0.3, glow: 0.3 } },
      ],
    },
    {
      id: "people", name: "To the people", from: 2, to: 5, interaction: "transition",
      summary: "He turns to the people wronging him, and to his own heart.",
      start: { light: 0.3, mist: 0.2, rain: 0, cloud: 0.5, stars: 0.15, glow: 0.3 },
      end: { light: 0.14, mist: 0.15, rain: 0, cloud: 0.25, stars: 0.5, glow: 0.1 },
      phrases: [
        { text: "how long shall my glory be turned into dishonor?", verse: 2, name: "What’s making him angry", note: "People are turning his honour into shame, and loving lies. He says it to their faces.", scene: { cloud: 0.6 } },
        { text: "Stand in awe, and don’t sin.", verse: 4, name: "Feel it, don’t act on it", note: "Some translations read “Be angry, and don’t sin” here, following the old Greek translation. Paul quotes that wording in Ephesians 4:26.", scene: { cloud: 0.4 }, say: "Strong feelings, held carefully." },
        { text: "Search your own heart on your bed, and be still.", verse: 4, name: "Before you lie down", note: "Think it through on your bed, and be still. Not every feeling has to be acted on tonight.", scene: { stars: 0.4, light: 0.18 } },
        { text: "Put your trust in Yahweh.", verse: 5, name: "Where to put it", note: "He hands over what he can’t settle himself.", scene: { cloud: 0.25, glow: 0.1 } },
      ],
    },
    {
      id: "sleep", name: "Lying down", from: 6, to: 8, interaction: "shift",
      summary: "He asks for God’s light, and lies down in peace.",
      start: { light: 0.14, mist: 0.15, rain: 0, cloud: 0.25, stars: 0.5, glow: 0.1 },
      end: { light: 0.04, mist: 0.08, rain: 0, cloud: 0, stars: 0.95, glow: 0 },
      phrases: [],
      hinge: { word: "In peace", verse: 8, note: "Not “my troubles are over.” Just: tonight, he can sleep." },
      pairs: [
        { before: { text: "Give me relief from my distress.", verse: 1 }, after: { text: "In peace I will both lay myself down and sleep", verse: 8 }, note: "He began hemmed in. He ends lying down in peace. Nothing says the people of verse 2 have changed." },
        { before: { text: "how long shall my glory be turned into dishonor?", verse: 2 }, after: { text: "You have put gladness in my heart", verse: 7 }, note: "His honour was being turned to shame; now there’s gladness, put there by God." },
        { before: { text: "Many say, “Who will show us any good?”", verse: 6 }, after: { text: "Yahweh, let the light of your face shine on us.", verse: 6 }, note: "Others ask where the good is. His answer is a prayer for God’s face to shine." },
      ],
    },
  ],
};

export const psalm4Experience = PsalmExperience(psalm4, {
  id: "psalm-4",
  title: "Before You Lie Down",
  subtitle: "Psalm 4 · an evening prayer",
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
    notice: "This one is Psalm 4, often read by people who are angry. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This is a psalm for the end of the day.", mood: "tender", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Eight verses, from dusk to sleep.", mood: "tender", act: "nod" }],
  },
  movements: {
    god: {
      before: [{ say: "He starts by talking to God.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      after: [{ say: "Then he turns to face the people around him.", mood: "curious", act: "tilt" }],
    },
    people: {
      before: [{ say: "Now he speaks to the ones who’ve wronged him.", mood: "thinking", act: "tilt" }],
      hint: "Drag his prayer up, or use the button.",
      after: [
        { say: "Honest about what’s wrong.", mood: "thinking" },
        { say: "And careful about what he does with it.", mood: "tender", act: "nod" },
      ],
    },
    sleep: {
      before: [
        { say: "Night is falling.", mood: "tender", act: "settle" },
        { say: "Watch how the psalm ends.", mood: "thinking", look: 0.4 },
      ],
      hint: "Find where it comes to rest.",
      after: [
        { say: "The wrongs weren’t fixed by bedtime.", mood: "thinking", act: "nod" },
        { say: "He lies down anyway, in peace.", mood: "moved", act: "settle" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "From dusk to a quiet, starry night.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Anger, honesty, and rest, all in one evening.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can tell God what’s wrong before you sleep, and leave it with him for the night.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "You can be honest about anger, and still lie down in peace.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
