import { PsalmExperience } from "../lesson/psalmExperience";
import type { Psalm } from "../lesson/types";

/* Psalms & Emotions: "When I Am Afraid" (Psalm 56). Suggested for fear; a suggestion, not a rule.
   - Four movements, because the psalm goes round twice: threat (1–2), trust (3–4), the threat again (5–9),
     the refrain again (10–13). The landscape darkens, lifts a little, darkens again, and ends in a partial light:
     "the light of the living" (13), not a sunrise. Fear and trust sit side by side, more than once.
   - The heading isn't quoted; the screen says many Bibles' heading links it to David seized by the Philistines in Gath
     (1 Samuel 21), and that this is ancient tradition. Nothing chosen on the entrance is saved.
   Scripture is the World English Bible, word for word, as poetry. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalm56: Psalm = {
  number: 56,
  title: "Psalm 56",
  about: "A prayer from someone surrounded. In many Bibles its heading links it to David when the Philistines seized him in Gath (1 Samuel 21); that heading is ancient tradition.",
  verses: [
    v("Be merciful to me, God, for man wants to swallow me up.\nAll day long, he attacks and oppresses me.", "Psalm 56:1"),
    v("My enemies want to swallow me up all day long,\nfor they are many who fight proudly against me.", "Psalm 56:2"),
    v("When I am afraid,\nI will put my trust in you.", "Psalm 56:3"),
    v("In God, I praise his word.\nIn God, I put my trust.\nI will not be afraid.\nWhat can flesh do to me?", "Psalm 56:4"),
    v("All day long they twist my words.\nAll their thoughts are against me for evil.", "Psalm 56:5"),
    v("They conspire and lurk,\nwatching my steps, they are eager to take my life.", "Psalm 56:6"),
    v("Shall they escape by iniquity?\nIn anger cast down the peoples, God.", "Psalm 56:7"),
    v("You count my wanderings.\nYou put my tears into your bottle.\nAren’t they in your book?", "Psalm 56:8"),
    v("Then my enemies shall turn back in the day that I call.\nI know this, that God is for me.", "Psalm 56:9"),
    v("In God, I will praise his word.\nIn Yahweh, I will praise his word.", "Psalm 56:10"),
    v("I have put my trust in God.\nI will not be afraid.\nWhat can man do to me?", "Psalm 56:11"),
    v("Your vows are on me, God.\nI will give thank offerings to you.", "Psalm 56:12"),
    v("For you have delivered my soul from death,\nand prevented my feet from falling,\nthat I may walk before God in the light of the living.", "Psalm 56:13"),
  ],
  key: v("When I am afraid,\nI will put my trust in you.", "Psalm 56:3"),
  movements: [
    {
      id: "threat", name: "Swallowed up", from: 1, to: 2, interaction: "landscape",
      summary: "He’s surrounded, attacked all day long, outnumbered.",
      start: { light: 0.06, mist: 0.3, rain: 0, cloud: 0.4, stars: 0.35, glow: 0 },
      end: { light: 0.03, mist: 0.45, rain: 0.2, cloud: 0.85, stars: 0.15, glow: 0 },
      phrases: [
        { text: "Be merciful to me, God", verse: 1, name: "He starts with God", note: "Before he describes the danger, he turns to God and asks for mercy.", scene: { stars: 0.3 } },
        { text: "man wants to swallow me up", verse: 1, name: "Threatened", note: "He feels about to be swallowed whole. He uses the picture twice in two verses.", scene: { cloud: 0.7 } },
        { text: "All day long, he attacks and oppresses me.", verse: 1, name: "Relentless", note: "Not one attack, but “all day long.” There’s no break.", scene: { mist: 0.45, rain: 0.2 } },
        { text: "they are many who fight proudly against me", verse: 2, name: "Outnumbered", note: "There are many of them, and they’re proud of it.", scene: { cloud: 0.85, stars: 0.15 } },
      ],
    },
    {
      id: "trust1", name: "Trust, while afraid", from: 3, to: 4, interaction: "landscape",
      summary: "He’s afraid, and he trusts: both in the same breath.",
      start: { light: 0.03, mist: 0.45, rain: 0.2, cloud: 0.85, stars: 0.15, glow: 0 },
      end: { light: 0.14, mist: 0.3, rain: 0, cloud: 0.55, stars: 0.3, glow: 0.15 },
      phrases: [
        { text: "When I am afraid,", verse: 3, name: "He names it", note: "Not “if” but “when.” He doesn’t pretend he isn’t afraid.", say: "He says it plainly." },
        { text: "I will put my trust in you.", verse: 3, name: "Trust, in the same breath", note: "Fear and trust sit in one sentence. One doesn’t have to leave for the other to arrive.", scene: { rain: 0, glow: 0.1, light: 0.1 } },
        { text: "I will not be afraid.", verse: 4, name: "A decision", note: "A verse ago he said he was afraid. Here he chooses where to put his weight.", scene: { cloud: 0.55, glow: 0.15 } },
        { text: "What can flesh do to me?", verse: 4, name: "A question back", note: "“Flesh” means mere human power. He sets it beside God.", scene: { light: 0.14, mist: 0.3 } },
      ],
    },
    {
      id: "again", name: "The threat returns", from: 5, to: 9, interaction: "transition",
      summary: "The danger comes back, and so do his tears. God keeps count of them.",
      start: { light: 0.14, mist: 0.3, rain: 0, cloud: 0.55, stars: 0.3, glow: 0.15 },
      end: { light: 0.05, mist: 0.5, rain: 0.35, cloud: 0.8, stars: 0.45, glow: 0.05 },
      phrases: [
        { text: "All day long they twist my words.", verse: 5, name: "It isn’t over", note: "Right after the trust of verse 4, the trouble is back. The psalm doesn’t pretend one prayer fixed it.", scene: { cloud: 0.8, rain: 0.35 } },
        { text: "watching my steps, they are eager to take my life", verse: 6, name: "Watched", note: "Someone is tracking every step he takes.", scene: { mist: 0.5, light: 0.05 } },
        { text: "You put my tears into your bottle.", verse: 8, name: "Tears kept", note: "He pictures God keeping his tears, counting his wanderings. Not one is lost.", scene: { stars: 0.45 }, say: "Not one tear lost." },
        { text: "I know this, that God is for me.", verse: 9, name: "What he knows", note: "He hasn’t been rescued yet. But he knows something: God is for him.", scene: { glow: 0.05 } },
      ],
    },
    {
      id: "refrain", name: "The refrain again", from: 10, to: 13, interaction: "shift",
      summary: "The words of trust come back, and he looks toward walking in the light.",
      start: { light: 0.05, mist: 0.5, rain: 0.35, cloud: 0.8, stars: 0.45, glow: 0.05 },
      end: { light: 0.4, mist: 0.2, rain: 0, cloud: 0.3, stars: 0.15, glow: 0.45 },
      phrases: [],
      hinge: { word: "In God", verse: 10, note: "The refrain comes back. Trust isn’t said once and done." },
      pairs: [
        { before: { text: "When I am afraid,", verse: 3 }, after: { text: "I will not be afraid.", verse: 11 }, note: "Almost word for word from verse 4. He says it a second time, because the fear came back a second time." },
        { before: { text: "watching my steps", verse: 6 }, after: { text: "prevented my feet from falling", verse: 13 }, note: "His steps were being watched by enemies; now he speaks of God keeping his feet from falling." },
        { before: { text: "they are eager to take my life", verse: 6 }, after: { text: "that I may walk before God in the light of the living", verse: 13 }, note: "He ends looking toward walking in the light of the living. The psalm doesn’t say the enemies are gone." },
      ],
    },
  ],
};

export const psalm56Experience = PsalmExperience(psalm56, {
  id: "psalm-56",
  title: "When I Am Afraid",
  subtitle: "Psalm 56 · fear and trust, side by side",
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
    notice: "This one is Psalm 56, often read by people who are afraid. That’s a suggestion, not a rule. Your answer isn’t saved.",
  },
  meet: {
    before: [
      { say: "This psalm is honest about fear.", mood: "tender", act: "settle" },
      { say: "Listen to how it begins.", mood: "thinking", act: "tilt", look: 0.4, show: "verse" },
    ],
    show: [1, 1],
    after: [{ say: "Thirteen verses. It goes round twice. Let’s follow it.", mood: "tender", act: "nod" }],
  },
  movements: {
    threat: {
      before: [{ say: "First, what he’s up against.", mood: "thinking", look: 0.4 }],
      hint: "Touch the underlined words.",
      ask: { question: "Is there something that feels like it’s closing in?", stay: "You don’t have to name it. The psalm names its own." },
      after: [{ say: "He doesn’t make it sound smaller than it is.", mood: "moved", act: "nod" }],
    },
    trust1: {
      before: [{ say: "Now, two short verses. Read slowly.", mood: "curious", act: "tilt" }],
      hint: "Touch the underlined words.",
      after: [{ say: "Afraid and trusting, at the same time.", mood: "tender", act: "nod" }],
    },
    again: {
      before: [{ say: "And then… the trouble comes back.", mood: "thinking", act: "tilt" }],
      hint: "Drag the words of trust up, or use the button.",
      after: [
        { say: "Trust in verse 4 didn’t end the danger in verse 5.", mood: "thinking" },
        { say: "So he keeps praying.", mood: "tender", act: "nod" },
      ],
    },
    refrain: {
      before: [
        { say: "Listen for something you’ve heard before.", mood: "curious", act: "tilt" },
        { say: "The psalm comes back to its refrain.", mood: "thinking", look: 0.4 },
      ],
      hint: "Find where the refrain starts.",
      after: [
        { say: "Not a sunrise. Just enough light to walk by.", mood: "moved", act: "nod" },
        { say: "And he may need the refrain again tomorrow.", mood: "tender", act: "settle" },
      ],
    },
  },
  arc: {
    before: [
      { say: "Here’s the whole psalm, all at once.", mood: "tender" },
      { say: "Dark, a little light, dark again. That’s how it goes.", mood: "moved", act: "nod" },
    ],
    after: [{ say: "Fear and trust both belong in this prayer.", mood: "tender", act: "settle" }],
  },
  quiet: {
    reflection: "You can be afraid and still bring it to God, as many times as you need to.",
    stay: "Stay as long as you like. There’s nothing to do here.",
  },
  close: {
    say: "You don’t have to stop being afraid before you pray.",
    coming: "There are more psalms in the library, for other feelings too.",
    button: "Finish",
  },
});
