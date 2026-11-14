import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Why Are You Downcast?" (Psalm 42). Suggested for grief.
   - Three movements: thirst and memory (1–4), the refrain and the fall straight back (5–6), deep calling to deep and
     the refrain again (7–11). The refrain (5, 11) repeats without resolving: the landscape ends roughly where it began,
     dark, with hope spoken into it, not dawn.
   - The heading isn't quoted; the screen says many Bibles link it to the sons of Korah. Psalm 43 continuing it is
     given as a scholars' view (its refrain returns in 43:5).
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm42: Psalm = {
  number: 42,
  title: "Psalm 42",
  about: "A song of longing in eleven verses. Many Bibles’ heading links it to the sons of Korah, a family of temple musicians. Many scholars think Psalm 43 continues it: the same refrain returns there (43:5).",
  verses: [
    v("As the deer pants for the water brooks,\nso my soul pants after you, God.", "Psalm 42:1"),
    v("My soul thirsts for God, for the living God.\nWhen shall I come and appear before God?", "Psalm 42:2"),
    v("My tears have been my food day and night,\nwhile they continually ask me, “Where is your God?”", "Psalm 42:3"),
    v("These things I remember, and pour out my soul within me,\nhow I used to go with the crowd, and led them to God’s house,\nwith the voice of joy and praise, a multitude keeping a holy day.", "Psalm 42:4"),
    v("Why are you in despair, my soul?\nWhy are you disturbed within me?\nHope in God!\nFor I shall still praise him for the saving help of his presence.", "Psalm 42:5"),
    v("My God, my soul is in despair within me.\nTherefore I remember you from the land of the Jordan,\nthe heights of Hermon, from the hill Mizar.", "Psalm 42:6"),
    v("Deep calls to deep at the noise of your waterfalls.\nAll your waves and your billows have swept over me.", "Psalm 42:7"),
    v("Yahweh will command his loving kindness in the daytime.\nIn the night his song shall be with me:\na prayer to the God of my life.", "Psalm 42:8"),
    v("I will ask God, my rock, “Why have you forgotten me?\nWhy do I go mourning because of the oppression of the enemy?”", "Psalm 42:9"),
    v("As with a sword in my bones, my adversaries reproach me,\nwhile they continually ask me, “Where is your God?”", "Psalm 42:10"),
    v("Why are you in despair, my soul?\nWhy are you disturbed within me?\nHope in God! For I shall still praise him,\nthe saving help of my countenance, and my God.", "Psalm 42:11"),
  ],
  key: v("Why are you in despair, my soul?\nWhy are you disturbed within me?\nHope in God!", "Psalm 42:5"),
  movements: [
    {
      id: "thirst", name: "Thirst", from: 1, to: 4, interaction: "landscape",
      summary: "He longs for God like a deer for water, eats tears, and remembers better days.",
      start: { light: 0.08, mist: 0.3, rain: 0, cloud: 0.3, stars: 0.4, glow: 0 },
      end: { light: 0.06, mist: 0.45, rain: 0.6, cloud: 0.5, stars: 0.3, glow: 0.05 },
      phrases: [
        { text: "As the deer pants for the water brooks", verse: 1, name: "Thirst", note: "A deer desperate for water. That’s how he longs for God.", scene: { mist: 0.35 } },
        { text: "My soul thirsts for God, for the living God.", verse: 2, name: "Longing", note: "He doesn’t only want comfort. He wants God himself.", scene: { stars: 0.35 } },
        { text: "My tears have been my food day and night", verse: 3, name: "Tears", note: "Tears instead of meals, day and night. Grief that won’t stop.", scene: { rain: 0.6 } },
        { text: "Where is your God?", verse: 3, name: "Taunted", note: "People keep asking him where his God is. The question hurts because he’s asking it too.", scene: { cloud: 0.5 } },
        { text: "These things I remember", verse: 4, name: "Memory", note: "He remembers leading the crowd to worship, full of joy. The memory is sweet and painful at once.", scene: { glow: 0.05 } },
      ],
    },
    {
      id: "refrain", name: "The refrain", from: 5, to: 6, interaction: "transition",
      summary: "He speaks hope to his own soul, then sinks straight back.",
      start: { light: 0.06, mist: 0.45, rain: 0.6, cloud: 0.5, stars: 0.3, glow: 0.05 },
      end: { light: 0.08, mist: 0.45, rain: 0.3, cloud: 0.5, stars: 0.3, glow: 0.06 },
      phrases: [
        { text: "Why are you in despair, my soul?", verse: 5, name: "Talking to himself", note: "He turns and speaks to his own soul, as if to someone he loves." },
        { text: "Hope in God!", verse: 5, name: "Hope, spoken into it", note: "Not a feeling he has, but words he says to himself: hope in God.", scene: { glow: 0.12 } },
        { text: "My God, my soul is in despair within me.", verse: 6, name: "Right back down", note: "The very next line, despair again. The refrain doesn’t fix it.", scene: { glow: 0.05, rain: 0.3 } },
        { text: "Therefore I remember you", verse: 6, name: "Remembering, on purpose", note: "From far away, he chooses to remember God anyway." },
      ],
    },
    {
      id: "deep", name: "Deep calls to deep", from: 7, to: 11, interaction: "landscape",
      summary: "Waves sweep over him, a song in the night, the question again, and the refrain again.",
      start: { light: 0.08, mist: 0.45, rain: 0.3, cloud: 0.5, stars: 0.3, glow: 0.06 },
      end: { light: 0.08, mist: 0.45, rain: 0.3, cloud: 0.4, stars: 0.5, glow: 0.06 },
      phrases: [
        { text: "Deep calls to deep", verse: 7, name: "Overwhelmed", note: "Water again, but not to drink now. It’s crashing over him.", scene: { mist: 0.7, rain: 0.7 } },
        { text: "In the night his song shall be with me", verse: 8, name: "A song in the night", note: "Even in the dark there’s a song, and a prayer to “the God of my life.”", scene: { stars: 0.6, rain: 0.4 } },
        { text: "Why have you forgotten me?", verse: 9, name: "The question returns", note: "He still calls God “my rock,” and still asks why he feels forgotten.", scene: { cloud: 0.6 } },
        { text: "Why are you in despair, my soul?", verse: 11, name: "The refrain again", note: "Almost word for word, the same refrain. He has to say it again.", scene: { mist: 0.45 } },
        { text: "Hope in God!", verse: 11, name: "Hope, spoken again", note: "The psalm ends here: hope spoken into the same darkness, not after it.", scene: { glow: 0.08, rain: 0.3, stars: 0.5 } },
      ],
    },
  ],
};

export const psalm42Experience = PsalmExperience(psalm42, {
  id: "psalm-42",
  title: "Why Are You Downcast?",
  subtitle: "Psalm 42 · thirst, a refrain, and the deep",
  minutes: 6,
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
    notice: "This one is Psalm 42, often read in grief. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This psalm is thirsty for God.", mood: "tender", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Eleven verses. We’ll take them slowly.", mood: "tender", act: "nod" }],
  },
  movements: {
    thirst: {
      before: [{ say: "The first four verses. Notice the water.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Have you ever missed a time when God felt close?", stay: "He remembers, and it hurts. There’s room for that here." },
      after: [{ say: "Thirst, tears, and memories. He says all of it.", mood: "moved", act: "nod" }],
    },
    refrain: {
      before: [{ say: "Then he does something unusual. He talks to himself.", mood: "curious", act: "tilt" }],
      hint: "Drag the first verses up, or use the button.",
      after: [
        { say: "He says “hope in God,” and sinks right back.", mood: "thinking" },
        { say: "Both are in the psalm, side by side.", mood: "tender", act: "nod" },
      ],
    },
    deep: {
      before: [{ say: "The last part. Watch for the refrain coming back.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      after: [
        { say: "Notice where it ends: still in the deep.", mood: "thinking", act: "nod" },
        { say: "With hope spoken into it.", mood: "tender", act: "settle" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm at once.", mood: "tender" },
      { say: "It ends close to where it began. That’s honest.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Thirst, a refrain, the deep: all of it is in Scripture.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "Hope can be spoken while the sorrow is still there.",
    stay: "You can stay here, just as you are.",
  },
  close: {
    say: "The psalm says “hope in God” twice, and still says it from the deep.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
