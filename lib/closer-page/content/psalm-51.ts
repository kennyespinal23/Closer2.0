import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "Create in Me a Clean Heart" (Psalm 51). Suggested for repentance.
   - Four movements, by the text: confession (1–6), cleansing and renewal (7–12, turning on "Purify"), what he'll do
     and the offering God wants (13–17), and a prayer for Zion (18–19).
   - Gentle on purpose: Page never assumes the reader has done anything in particular, never asks them to confess,
     and there's no writing. The psalm's honesty is shown; the reader's is left to them.
   - The heading isn't quoted (it isn't in our checked text); the screen says many Bibles' heading links it to David
     after the prophet Nathan confronted him (2 Samuel 12), as tradition.
   - Verses 18–19 are often thought to be a later addition for the community; the screen doesn't claim either way.
   - Nothing chosen on the entrance screen is saved. Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm51: Psalm = {
  number: 51,
  title: "Psalm 51",
  about: "A prayer of confession, nineteen verses long. In many Bibles its heading links it to David after the prophet Nathan confronted him (2 Samuel 12); that link comes from tradition.",
  verses: [
    v("Have mercy on me, God, according to your loving kindness.\nAccording to the multitude of your tender mercies, blot out my transgressions.", "Psalm 51:1"),
    v("Wash me thoroughly from my iniquity.\nCleanse me from my sin.", "Psalm 51:2"),
    v("For I know my transgressions.\nMy sin is constantly before me.", "Psalm 51:3"),
    v("Against you, and you only, I have sinned,\nand done that which is evil in your sight;\nthat you may be proved right when you speak,\nand justified when you judge.", "Psalm 51:4"),
    v("Behold, I was born in iniquity.\nIn sin my mother conceived me.", "Psalm 51:5"),
    v("Behold, you desire truth in the inward parts.\nYou teach me wisdom in the inmost place.", "Psalm 51:6"),
    v("Purify me with hyssop, and I will be clean.\nWash me, and I will be whiter than snow.", "Psalm 51:7"),
    v("Let me hear joy and gladness,\nThat the bones which you have broken may rejoice.", "Psalm 51:8"),
    v("Hide your face from my sins,\nand blot out all of my iniquities.", "Psalm 51:9"),
    v("Create in me a clean heart, O God.\nRenew a right spirit within me.", "Psalm 51:10"),
    v("Don’t throw me from your presence,\nand don’t take your holy Spirit from me.", "Psalm 51:11"),
    v("Restore to me the joy of your salvation.\nUphold me with a willing spirit.", "Psalm 51:12"),
    v("Then I will teach transgressors your ways.\nSinners shall be converted to you.", "Psalm 51:13"),
    v("Deliver me from the guilt of bloodshed, O God, the God of my salvation.\nMy tongue shall sing aloud of your righteousness.", "Psalm 51:14"),
    v("Lord, open my lips.\nMy mouth shall declare your praise.", "Psalm 51:15"),
    v("For you don’t delight in sacrifice, or else I would give it.\nYou have no pleasure in burnt offering.", "Psalm 51:16"),
    v("The sacrifices of God are a broken spirit.\nA broken and contrite heart, O God, you will not despise.", "Psalm 51:17"),
    v("Do well in your good pleasure to Zion.\nBuild the walls of Jerusalem.", "Psalm 51:18"),
    v("Then you will delight in the sacrifices of righteousness,\nin burnt offerings and in whole burnt offerings.\nThen they will offer bulls on your altar.", "Psalm 51:19"),
  ],
  key: v("Create in me a clean heart, O God.\nRenew a right spirit within me.", "Psalm 51:10"),
  movements: [
    {
      id: "confess", name: "Confession", from: 1, to: 6, interaction: "landscape",
      summary: "He asks for mercy, and names what he’s done without excuses.",
      start: { light: 0.1, mist: 0.35, rain: 0.2, cloud: 0.5, stars: 0.3, glow: 0 },
      end: { light: 0.06, mist: 0.5, rain: 0.45, cloud: 0.7, stars: 0.2, glow: 0 },
      phrases: [
        { text: "Have mercy on me, God, according to your loving kindness.", verse: 1, name: "Where he starts", note: "Before anything else, he leans on God’s loving kindness: his loyal, faithful love.", scene: { stars: 0.35 } },
        { text: "For I know my transgressions.", verse: 3, name: "No excuses", note: "He doesn’t explain it away. He knows, and he says so.", scene: { rain: 0.35 } },
        { text: "My sin is constantly before me.", verse: 3, name: "He can’t look away", note: "It’s always in front of him.", scene: { mist: 0.5, cloud: 0.7 } },
        { text: "you desire truth in the inward parts.", verse: 6, name: "Truth inside", note: "God wants honesty all the way down, not just on the surface.", scene: { rain: 0.45 }, say: "Honest, all the way down." },
      ],
    },
    {
      id: "renew", name: "Clean again", from: 7, to: 12, interaction: "shift",
      summary: "He asks to be washed, made new, and given back his joy.",
      start: { light: 0.06, mist: 0.5, rain: 0.45, cloud: 0.7, stars: 0.2, glow: 0 },
      end: { light: 0.5, mist: 0.15, rain: 0, cloud: 0.1, stars: 0, glow: 0.5 },
      phrases: [],
      hinge: { word: "Purify", verse: 7, note: "Here he stops naming what’s wrong and asks to be made clean." },
      pairs: [
        { before: { text: "Wash me thoroughly from my iniquity.", verse: 2 }, after: { text: "Wash me, and I will be whiter than snow.", verse: 7 }, note: "He asked to be washed before. Now he says what washing will do: whiter than snow." },
        { before: { text: "My sin is constantly before me.", verse: 3 }, after: { text: "Hide your face from my sins,", verse: 9 }, note: "He can’t stop seeing it. He asks God to look away from it." },
        { before: { text: "For I know my transgressions.", verse: 3 }, after: { text: "Create in me a clean heart, O God.", verse: 10 }, note: "He doesn’t ask only for a clean record, but for a new heart. “Create” is the word Genesis 1 uses for God making the world." },
      ],
    },
    {
      id: "offer", name: "A broken spirit", from: 13, to: 17, interaction: "transition",
      summary: "He says what he’ll do, and what God wants more than sacrifice.",
      start: { light: 0.5, mist: 0.15, rain: 0, cloud: 0.1, stars: 0, glow: 0.5 },
      end: { light: 0.55, mist: 0.1, rain: 0, cloud: 0.05, stars: 0, glow: 0.55 },
      phrases: [
        { text: "Then I will teach transgressors your ways.", verse: 13, name: "Passing it on", note: "Having been forgiven, he wants to help others find the way back.", scene: { glow: 0.52 } },
        { text: "Lord, open my lips.", verse: 15, name: "Even the praise", note: "He asks God even for the words to praise him.", scene: { mist: 0.1 } },
        { text: "The sacrifices of God are a broken spirit.", verse: 17, name: "What God wants", note: "Not a bigger offering, but an honest, humbled heart.", scene: { light: 0.55 } },
        { text: "you will not despise.", verse: 17, name: "Not turned away", note: "A broken heart, brought to God, isn’t rejected.", scene: { glow: 0.55 }, say: "Not despised." },
      ],
    },
    {
      id: "zion", name: "For the city", from: 18, to: 19, interaction: "landscape",
      summary: "The prayer widens to the whole community.",
      start: { light: 0.55, mist: 0.1, rain: 0, cloud: 0.05, stars: 0, glow: 0.55 },
      end: { light: 0.62, mist: 0.1, rain: 0, cloud: 0, stars: 0, glow: 0.62 },
      phrases: [
        { text: "Build the walls of Jerusalem.", verse: 18, name: "Wider than one person", note: "The prayer opens out from one heart to a whole city.", scene: { light: 0.6 } },
        { text: "the sacrifices of righteousness,", verse: 19, name: "Worship again", note: "Earlier he said God doesn’t delight in sacrifice alone. Here offerings return, given rightly.", scene: { glow: 0.62, light: 0.62 } },
      ],
    },
  ],
};

export const psalm51Experience = PsalmExperience(psalm51, {
  id: "psalm-51",
  title: "Create in Me a Clean Heart",
  subtitle: "Psalm 51 · honesty, and a new heart",
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
    notice: "This one is Psalm 51, often read when people want a fresh start with God. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This psalm is a confession. Someone being honest with God.", mood: "tender", act: "settle" },
      { say: "You don’t need to bring anything in particular. Just listen.", mood: "thinking", look: 0.4, show: "verse" },
    ],
    show: [1, 2],
    after: [{ say: "Notice where he starts: with God’s kindness.", mood: "tender", act: "nod" }],
  },
  movements: {
    confess: {
      before: [{ say: "The first six verses. He doesn’t hide anything.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      after: [{ say: "Honest, and still asking for mercy.", mood: "moved", act: "nod" }],
    },
    renew: {
      before: [
        { say: "Then the psalm changes direction.", mood: "curious", act: "tilt" },
        { say: "Listen for what he asks for now.", mood: "thinking", look: 0.4 },
      ],
      hint: "Find the word where it turns.",
      after: [
        { say: "He asks for more than a clean slate.", mood: "thinking", act: "nod" },
        { say: "He asks for a new heart.", mood: "moved", act: "settle" },
      ],
    },
    offer: {
      before: [{ say: "Then he says what he’ll do next.", mood: "curious", act: "tilt" }],
      hint: "Drag the earlier verses up, or use the button.",
      after: [{ say: "What God wants isn’t a performance. It’s an honest heart.", mood: "tender", act: "nod" }],
    },
    zion: {
      before: [{ say: "The last two verses widen the prayer.", mood: "thinking" }],
      hint: "Touch the underlined words.",
      after: [{ say: "From one person to a whole city.", mood: "tender", act: "nod" }],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "The confession stays in the picture. It’s part of the prayer.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Honesty, renewal, an offering and a city: all in one prayer.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can be honest with God, and ask him to make your heart new.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "You don’t have to clean yourself up before you come to God.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
