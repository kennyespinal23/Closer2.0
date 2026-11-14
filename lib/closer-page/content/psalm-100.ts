import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Enter With Thanks" (Psalm 100). Suggested for gratitude; a suggestion, not a rule.
   - Two movements, because the psalm has two parts: an invitation (1–4) and its reason (5, "For Yahweh is good").
     It's praise from the first line, so the landscape is bright from the start and only grows brighter. No struggle
     is invented for it.
   - The heading isn't quoted; the screen says many Bibles call it a psalm of thanksgiving. Nothing chosen on the
     entrance is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm100: Psalm = {
  number: 100,
  title: "Psalm 100",
  about: "Five short verses of invitation. In many Bibles its heading calls it a psalm of thanksgiving.",
  verses: [
    v("Shout for joy to Yahweh, all you lands!", "Psalm 100:1"),
    v("Serve Yahweh with gladness.\nCome before his presence with singing.", "Psalm 100:2"),
    v("Know that Yahweh, he is God.\nIt is he who has made us, and we are his.\nWe are his people, and the sheep of his pasture.", "Psalm 100:3"),
    v("Enter into his gates with thanksgiving,\ninto his courts with praise.\nGive thanks to him, and bless his name.", "Psalm 100:4"),
    v("For Yahweh is good.\nHis loving kindness endures forever,\nhis faithfulness to all generations.", "Psalm 100:5"),
  ],
  key: v("For Yahweh is good.\nHis loving kindness endures forever,\nhis faithfulness to all generations.", "Psalm 100:5"),
  movements: [
    {
      id: "invite", name: "The invitation", from: 1, to: 4, interaction: "landscape",
      summary: "Come, all of you: shout, serve, know, enter, give thanks.",
      start: { light: 0.7, mist: 0.08, rain: 0, cloud: 0, stars: 0, glow: 0.55 },
      end: { light: 0.82, mist: 0.04, rain: 0, cloud: 0, stars: 0, glow: 0.75 },
      phrases: [
        { text: "Shout for joy to Yahweh, all you lands!", verse: 1, name: "Everyone’s invited", note: "Not just Israel: “all you lands.” The whole earth is called in.", scene: { glow: 0.62 } },
        { text: "Serve Yahweh with gladness.", verse: 2, name: "Gladly", note: "Serving God is pictured as gladness, not a chore.", scene: { light: 0.74 } },
        { text: "It is he who has made us, and we are his.", verse: 3, name: "Belonging", note: "We didn’t make ourselves. We belong to the one who did.", scene: { mist: 0.04 } },
        { text: "Enter into his gates with thanksgiving", verse: 4, name: "A procession", note: "It pictures worshippers walking up to the temple gates and into its courts, giving thanks as they go.", scene: { light: 0.82, glow: 0.75 }, say: "Step by step, closer in." },
      ],
    },
    {
      id: "reason", name: "The reason", from: 5, to: 5, interaction: "shift",
      summary: "Why give thanks? Because Yahweh is good, and his love lasts.",
      start: { light: 0.82, mist: 0.04, rain: 0, cloud: 0, stars: 0, glow: 0.75 },
      end: { light: 0.92, mist: 0.02, rain: 0, cloud: 0, stars: 0, glow: 0.95 },
      phrases: [],
      hinge: { word: "For", verse: 5, note: "Every invitation so far rests on this one word: because." },
      pairs: [
        { before: { text: "Shout for joy to Yahweh, all you lands!", verse: 1 }, after: { text: "For Yahweh is good.", verse: 5 }, note: "The joy isn’t forced. It has a reason, and the reason is who God is." },
        { before: { text: "We are his people", verse: 3 }, after: { text: "his faithfulness to all generations", verse: 5 }, note: "Not just us, today: every generation, before and after." },
      ],
    },
  ],
};

export const psalm100Experience = PsalmExperience(psalm100, {
  id: "psalm-100",
  title: "Enter With Thanks",
  subtitle: "Psalm 100 · an invitation to give thanks",
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
    notice: "This one is Psalm 100, often read with gratitude. That’s a suggestion, not a rule. You’re welcome however you feel. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This one is short, and it’s all invitation.", mood: "happy", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Five verses. Let’s walk in together.", mood: "happy", act: "nod" }],
  },
  movements: {
    invite: {
      before: [{ say: "Count the invitations as you go.", mood: "curious", act: "tilt", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Is there something you’re thankful for today?", stay: "Big or small, it counts. You don’t have to say it here." },
      after: [{ say: "Shout, serve, come, know, enter, give thanks.", mood: "happy", act: "nod" }],
    },
    reason: {
      before: [
        { say: "And then, the reason for all of it.", mood: "curious", act: "tilt" },
        { say: "It’s in the very last verse.", mood: "thinking", look: 0.4 },
      ],
      hint: "Find the word that gives the reason.",
      after: [{ say: "Thanks that rests on who God is, not on how today went.", mood: "moved", act: "settle" }],
    },
  },
  arc: {
    before: [{ say: "Here’s the whole psalm, all at once.", mood: "tender" }],
    after: [{ say: "An invitation, and the reason behind it.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can come to God with thanks, even on an ordinary day.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "Thanks doesn’t have to wait for a perfect day.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
