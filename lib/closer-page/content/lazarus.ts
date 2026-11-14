import type { Lesson } from "../lesson/types";

/* Lazarus, John 11. Pure content: every screen of the experience is rendered from this object.
   Scripture is the World English Bible, word for word (closer-lounge/bible/web/john.json).
   Page retells the story in his own words, but every quote from Jesus is Scripture. */

const WEB = "World English Bible";

export const lazarus = {
  id: "lazarus",
  title: "Lazarus",
  subtitle: "The friend Jesus called out of the tomb",
  kind: "Character study",
  scripture: "John 11",
  minutes: 4,
  theme: "forest",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [{ say: "Hey! Have you ever heard of a man named Lazarus?", mood: "curious", act: "tilt" }],
      reply: "Tell me about him!",
    },
    {
      kind: "character",
      page: { at: "left", act: "hop", mood: "happy" },
      name: "Lazarus",
      place: "of Bethany",
      figure: "man",
      companions: [{ name: "Mary", figure: "woman" }, { name: "Martha", figure: "woman2" }],
      note: { text: "Now Jesus loved Martha, and her sister, and Lazarus.", ref: "John 11:5", translation: WEB },
      lines: [
        { say: "Lazarus lived in Bethany with his sisters, Mary and Martha.", show: "companions", look: 0.6 },
        { say: "And he was a friend of Jesus.", show: "note", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "tender" },
      beats: [
        { say: "One day, Lazarus got very sick.", mood: "tender" },
        {
          say: "So his sisters sent a message to Jesus.",
          mood: "neutral",
          card: { text: "“Lord, behold, he for whom you have great affection is sick.”", ref: "John 11:3", translation: WEB },
          task: { type: "send", label: "Send it to Jesus" },
        },
        {
          say: "Jesus loved this family. But he didn’t leave right away.",
          mood: "thinking",
          card: { text: "When therefore he heard that he was sick, he stayed two days in the place where he was.", ref: "John 11:6", translation: WEB },
        },
        {
          say: "By the time he set out for Bethany…",
          mood: "tender",
          task: { type: "hold", label: "Hold to let the days pass", unit: "Day", from: 1, to: 4, caption: "Waiting…" },
        },
        {
          say: "Lazarus had already died.",
          mood: "tender",
          card: { text: "So when Jesus came, he found that he had been in the tomb four days already.", ref: "John 11:17", translation: WEB },
        },
        {
          say: "Mary fell at his feet and said what they’d both been thinking.",
          mood: "tender",
          card: { text: "“Lord, if you would have been here, my brother wouldn’t have died.”", ref: "John 11:32", translation: WEB, big: true },
        },
      ],
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Quick one. Who sent word to Jesus that Lazarus was sick?",
      options: [
        { text: "His sisters", correct: true, reply: "Yes. Mary and Martha knew exactly who to ask." },
        { text: "His disciples", reply: "Close. It was his sisters, Mary and Martha. They knew exactly who to ask." },
        { text: "Lazarus himself", reply: "He was too sick for that. His sisters, Mary and Martha, sent for Jesus." },
      ],
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
      kind: "verse",
      theme: "burgundy",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Before any of that, Jesus told Martha who he is.", mood: "thinking", open: true }],
      verse: { text: "“I am the resurrection and the life. He who believes in me will still live, even if he dies.”", ref: "John 11:25", translation: WEB },
      after: [{ say: "Worth carrying with you today.", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s today’s story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "“I am the resurrection and the life. He who believes in me will still live, even if he dies.”", ref: "John 11:25", translation: WEB },
    },
  ],
} satisfies Lesson;
