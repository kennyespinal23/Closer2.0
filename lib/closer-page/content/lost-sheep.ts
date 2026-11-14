import type { Lesson } from "../lesson/types";

/* The lost sheep, Luke 15:1-7. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const lostSheep = {
  id: "lost-sheep",
  title: "The lost sheep",
  subtitle: "The shepherd who goes after the one",
  kind: "Bible story",
  scripture: "Luke 15",
  minutes: 3,
  theme: "forest",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [{ say: "Hey! Want to hear a story Jesus told about a sheep?", mood: "curious", act: "tilt" }],
      reply: "Tell me!",
    },
    {
      kind: "story",
      page: { at: "top", mood: "neutral" },
      beats: [
        {
          say: "Jesus was spending time with people nobody else wanted around.",
          mood: "happy",
          card: { text: "Now all the tax collectors and sinners were coming close to him to hear him.", ref: "Luke 15:1", translation: WEB },
        },
        {
          say: "Some religious leaders were not impressed.",
          mood: "cheeky",
          act: "stare",
          card: { text: "“This man welcomes sinners, and eats with them.”", ref: "Luke 15:2", translation: WEB, big: true },
        },
        { say: "So Jesus told them a story.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "character",
      page: { at: "left", mood: "happy", act: "hop" },
      name: "A shepherd",
      place: "with a hundred sheep",
      figure: "man",
      note: { text: "“Which of you men, if you had one hundred sheep, and lost one of them, wouldn’t leave the ninety-nine in the wilderness, and go after the one that was lost, until he found it?", ref: "Luke 15:4", translation: WEB },
      lines: [
        { say: "Picture a shepherd with a hundred sheep." },
        { say: "One wanders off. What does he do?", show: "note", mood: "curious", act: "tilt" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "thinking" },
      beats: [
        {
          say: "He leaves the ninety-nine and goes looking. Until he finds it.",
          mood: "thinking",
          task: { type: "hold", label: "Hold to keep searching", unit: "Hill", from: 1, to: 4, caption: "Still looking…" },
        },
        {
          say: "There it is!",
          mood: "excited",
          act: "hop",
          card: { text: "When he has found it, he carries it on his shoulders, rejoicing.", ref: "Luke 15:5", translation: WEB },
        },
        { say: "No scolding. No long walk of shame. He carries it home.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "What does the shepherd do when he finds the sheep?",
      options: [
        { text: "Carries it home, rejoicing", correct: true, reply: "Yes. On his shoulders, happy the whole way home." },
        { text: "Tells it off for wandering", reply: "Not even a little. He carries it on his shoulders, rejoicing." },
        { text: "Lets it find its own way back", reply: "He doesn’t make it walk. He carries it on his shoulders, rejoicing." },
      ],
    },
    {
      kind: "highlight",
      theme: "burgundy",
      page: { at: "top", mood: "happy" },
      verse: { text: "“Rejoice with me, for I have found my sheep which was lost!”", ref: "Luke 15:6", translation: WEB },
      before: [
        { say: "When he gets home, he calls his friends and neighbors over.", mood: "happy" },
        { say: "And he says this.", show: "verse", open: true, mood: "excited" },
        { say: "One sheep. A whole party.", mood: "cheeky", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "That’s how he feels about the one who wandered off.", mood: "moved" },
        { say: "Jesus said heaven feels exactly the same way.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "Have you ever felt like the one that wandered off?",
      options: [
        { text: "Yes, more than once", reply: "Then you’re exactly who this story is about. The shepherd keeps looking." },
        { text: "I feel like that right now", reply: "Then hear this today: you’re not the one he gave up on. You’re the one he goes after." },
        { text: "Not really", reply: "Then you know how it feels to be safe. Someone near you might be out on the hills." },
        { text: "I’m not sure", reply: "That’s honest. Let the story sit with you for a bit." },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Here’s how Jesus finished the story.", mood: "thinking", open: true }],
      verse: { text: "I tell you that even so there will be more joy in heaven over one sinner who repents, than over ninety-nine righteous people who need no repentance.", ref: "Luke 15:7", translation: WEB },
      after: [{ say: "More joy over one. Including you.", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s the story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "I tell you that even so there will be more joy in heaven over one sinner who repents, than over ninety-nine righteous people who need no repentance.", ref: "Luke 15:7", translation: WEB },
    },
  ],
} satisfies Lesson;
