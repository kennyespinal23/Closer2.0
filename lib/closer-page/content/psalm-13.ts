import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "When God Feels Far Away" (Psalm 13).
   - Three movements, because this psalm has three: the cry (1–2), the plea (3–4), the trust (5–6). Other psalms
     are built with their own shape.
   - The landscape follows the psalm's language, not the reader. It ends in light because the psalm's words turn to
     trust and song, and Page says plainly that the psalm never says the trouble was over.
   - The heading isn't quoted (it isn't in our checked text); the screen says many Bibles' heading names David and that
     tradition attributes the psalm to him.
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm13: Psalm = {
  number: 13,
  title: "Psalm 13",
  about: "A short prayer of six verses. In many Bibles its heading names David, and tradition attributes it to him.",
  verses: [
    v("How long, Yahweh?\nWill you forget me forever?\nHow long will you hide your face from me?", "Psalm 13:1"),
    v("How long shall I take counsel in my soul,\nhaving sorrow in my heart every day?\nHow long shall my enemy triumph over me?", "Psalm 13:2"),
    v("Behold, and answer me, Yahweh, my God.\nGive light to my eyes, lest I sleep in death;", "Psalm 13:3"),
    v("Lest my enemy say, “I have prevailed against him”;\nLest my adversaries rejoice when I fall.", "Psalm 13:4"),
    v("But I trust in your loving kindness.\nMy heart rejoices in your salvation.", "Psalm 13:5"),
    v("I will sing to Yahweh,\nbecause he has been good to me.", "Psalm 13:6"),
  ],
  key: v("But I trust in your loving kindness.\nMy heart rejoices in your salvation.", "Psalm 13:5"),
  movements: [
    {
      id: "cry", name: "The cry", from: 1, to: 2, interaction: "landscape",
      summary: "He cries out: forgotten, God hidden, sorrow every day, an enemy winning.",
      start: { light: 0.04, mist: 0.25, rain: 0, cloud: 0, stars: 0.7, glow: 0 },
      end: { light: 0.02, mist: 0.6, rain: 0.7, cloud: 0.9, stars: 0.12, glow: 0 },
      phrases: [
        { text: "How long, Yahweh?", verse: 1, name: "The question that repeats", note: "“How long” comes four times in two verses. The repetition is part of the cry.", scene: { mist: 0.4 }, say: "Four times." },
        { text: "Will you forget me forever?", verse: 1, name: "Feeling forgotten", note: "He feels as if God has forgotten him, and not for a moment: “forever.”", scene: { stars: 0.2 } },
        { text: "hide your face from me", verse: 1, name: "God seems hidden", note: "To see someone’s face is to be near them. He feels God has turned away.", scene: { cloud: 0.9 } },
        { text: "take counsel in my soul", verse: 2, name: "Inner struggle", note: "He turns it over and over inside, alone with his thoughts.", scene: { mist: 0.6 } },
        { text: "sorrow in my heart every day", verse: 2, name: "Sorrow", note: "Not one bad day. Sorrow “every day.”", scene: { rain: 0.7 } },
        { text: "my enemy triumph over me", verse: 2, name: "Distress", note: "There’s an outside threat too: someone is winning against him.", scene: { stars: 0.12, light: 0.02 } },
      ],
    },
    {
      id: "plea", name: "The plea", from: 3, to: 4, interaction: "transition",
      summary: "He brings it to God, and asks to be answered.",
      start: { light: 0.02, mist: 0.6, rain: 0.7, cloud: 0.9, stars: 0.12, glow: 0 },
      end: { light: 0.12, mist: 0.4, rain: 0, cloud: 0.45, stars: 0.2, glow: 0.06 },
      phrases: [
        { text: "Behold, and answer me", verse: 3, name: "He asks to be heard", note: "The questions become requests. “How long?” turns into “answer me.”", scene: { rain: 0 } },
        { text: "Yahweh, my God", verse: 3, name: "Still “my God”", note: "He felt forgotten, yet he still calls God “my God.” He doesn’t stop speaking to him.", scene: { cloud: 0.6 } },
        { text: "Give light to my eyes", verse: 3, name: "He asks for light", note: "He asks God to restore him, and the stakes are high: “lest I sleep in death.”", scene: { glow: 0.08, cloud: 0.45 } },
        { text: "Lest my adversaries rejoice when I fall", verse: 4, name: "He names his fear", note: "He tells God exactly what he’s afraid of.", scene: { mist: 0.4 } },
      ],
    },
    {
      id: "trust", name: "The trust", from: 5, to: 6, interaction: "shift",
      summary: "He chooses trust and song, with the questions still open.",
      start: { light: 0.12, mist: 0.4, rain: 0, cloud: 0.45, stars: 0.2, glow: 0.06 },
      end: { light: 0.72, mist: 0.12, rain: 0, cloud: 0, stars: 0, glow: 0.85 },
      phrases: [],
      hinge: { word: "But", verse: 5, note: "One small word, and the psalm turns." },
      pairs: [
        { before: { text: "sorrow in my heart every day", verse: 2 }, after: { text: "My heart rejoices in your salvation.", verse: 5 }, note: "The same heart: in verse 2 it holds sorrow, in verse 5 it rejoices. And “rejoice” was his enemies’ word in verse 4; now it’s his." },
        { before: { text: "Will you forget me forever?", verse: 1 }, after: { text: "But I trust in your loving kindness.", verse: 5 }, note: "From feeling forgotten to trusting God’s loving kindness. The Hebrew word behind it means loyal, faithful love." },
        { before: { text: "How long, Yahweh?", verse: 1 }, after: { text: "I will sing to Yahweh", verse: 6 }, note: "He began by asking Yahweh how long; he ends by singing to him, because “he has been good to me.” Nothing says the enemy is gone." },
      ],
    },
  ],
};

export const psalm13Experience = PsalmExperience(psalm13, {
  id: "psalm-13",
  title: "When God Feels Far Away",
  subtitle: "Psalm 13 · the cry, the plea, the trust",
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
    notice: "This one is Psalm 13, often read when God feels far away. That’s a suggestion, not a rule. Other psalms are in the library. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "Sometimes, people in the Bible felt far from God too.", mood: "tender", act: "settle" },
      { say: "Listen to how this Psalm begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Six short verses. Let’s go slowly.", mood: "tender", act: "nod" }],
  },
  movements: {
    cry: {
      before: [{ say: "The first two verses. Read them slowly.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Have you ever wanted to ask God how long something would last?", stay: "The psalm asks it four times. There’s no hurry here." },
      after: [{ say: "He doesn’t soften any of it.", mood: "moved", act: "nod" }],
    },
    plea: {
      before: [{ say: "Then, in verse 3, something shifts.", mood: "curious", act: "tilt" }],
      hint: "Drag the opening questions up, or use the button.",
      after: [
        { say: "He doesn’t hide what he’s feeling.", mood: "moved" },
        { say: "He brings it to God.", mood: "tender", act: "nod" },
      ],
    },
    trust: {
      before: [
        { say: "Notice something.", mood: "curious", act: "tilt" },
        { say: "The Psalm ends differently than it began.", mood: "thinking", look: 0.4 },
      ],
      hint: "Find the word where it turns.",
      after: [
        { say: "But it never tells us that every problem was solved.", mood: "thinking", act: "nod" },
        { say: "He trusts while the questions are still open.", mood: "moved", act: "settle" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "The dark beginning is still here. It belongs too.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "The cry, the plea and the trust: all of it is in Scripture.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can bring your questions, your sadness, and your hope to God.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "You don’t have to pretend you’re happy to speak to God.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
