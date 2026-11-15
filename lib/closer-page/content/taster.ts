import type { Lesson } from "../lesson/types";

/* The onboarding taster: about a minute of Closer before any questions, the way a first lesson comes first.
   Lazarus's best moments, lifted from content/lazarus.ts (same WEB text, already checked): highlight two words,
   roll the stone away, one open question. Not in the library; Onboarding plays it. */

const WEB = "World English Bible";

export const taster = {
  id: "taster",
  title: "A taste of Closer",
  subtitle: "Lazarus, in a minute",
  kind: "Bible story",
  scripture: "John 11",
  minutes: 1,
  theme: "forest",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [
        { say: "Let’s try one together. It takes about a minute.", mood: "excited", act: "hop" },
        { say: "Jesus’ friend Lazarus had died. By the time Jesus came, he’d been in the tomb four days.", mood: "tender", act: "settle" },
      ],
      display: { text: "A taste of Closer", sub: "John 11 · 1 min" },
      reply: "Show me",
    },
    {
      kind: "highlight",
      theme: "burgundy",
      page: { at: "top", mood: "tender" },
      verse: { text: "Jesus wept.", ref: "John 11:35", translation: WEB },
      context: { text: "“See how much affection he had for him!”", ref: "John 11:36", translation: WEB },
      before: [
        { say: "Jesus saw Mary crying, and everyone who came with her.", mood: "tender" },
        { say: "Here’s what he did next.", show: "verse", open: true, mood: "neutral" },
        { say: "Two words. But they tell us something important.", mood: "thinking", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "Jesus knew what he was about to do. He still stopped, and wept with them.", mood: "moved" },
        { say: "He didn’t rush past their grief. He stepped into it.", mood: "moved", act: "nod" },
        { say: "The people standing there saw it too.", show: "context", mood: "tender" },
      ],
    },
    {
      kind: "reveal",
      theme: "night",
      scene: "tomb",
      page: { at: "right", mood: "tender", look: -1 },
      before: [
        { say: "They came to the tomb. A cave, with a stone across it.", mood: "tender", look: -1 },
        { say: "Jesus asked them to move it.", show: "command", mood: "curious", look: -1 },
      ],
      command: { text: "“Take away the stone.”", ref: "John 11:39", translation: WEB },
      drag: "Drag the stone away",
      call: { text: "“Lazarus, come out!”", ref: "John 11:43", translation: WEB },
      outcome: { text: "He who was dead came out, bound hand and foot with wrappings, and his face was wrapped around with a cloth.", ref: "John 11:44", translation: WEB },
      after: [
        { say: "Then Jesus called out.", show: "call", mood: "curious", act: "lean", look: -1 },
        { say: "And…", show: "out", mood: "surprised", act: "hop", look: -1 },
        { say: "Four days in a tomb. One word from Jesus.", show: "outcome", mood: "excited", act: "react" },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "What does this story tell us about Jesus?",
      options: [
        { text: "He feels our grief", reply: "He does. He cried with his friends, even knowing how the day would end." },
        { text: "Death doesn’t get the last word", reply: "Not with him around. One word, and a man four days in the tomb walked out." },
        { text: "He’s never too late", reply: "It looked like he was late. He was right on time for something bigger." },
        { text: "I’m still thinking about it", reply: "That’s a good place to be. This one stays with you." },
      ],
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "That’s Closer.",
      body: "A few minutes, one story, Page beside you.",
      summary: ["Jesus wept with his friends.", "Then he called Lazarus out of the tomb."],
      verse: { text: "Jesus wept.", ref: "John 11:35", translation: WEB },
      button: "Keep going",
    },
  ],
} satisfies Lesson;
