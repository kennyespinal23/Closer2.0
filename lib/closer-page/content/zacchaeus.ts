import type { Lesson } from "../lesson/types";

/* Zacchaeus, Luke 19:1-10. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const zacchaeus = {
  id: "zacchaeus",
  title: "Zacchaeus",
  subtitle: "The man in the tree Jesus called by name",
  kind: "Character study",
  scripture: "Luke 19",
  minutes: 4,
  theme: "burgundy",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [
        { say: "Hey! Ever tried to see something over a crowd?", mood: "cheeky", act: "stare" },
        { say: "Zacchaeus had that problem. And a bigger one.", mood: "curious", act: "tilt" },
      ],
      reply: "What happened?",
    },
    {
      kind: "character",
      page: { at: "left", mood: "neutral", act: "hop" },
      name: "Zacchaeus",
      place: "of Jericho",
      figure: "man",
      note: { text: "He was trying to see who Jesus was, and couldn’t because of the crowd, because he was short.", ref: "Luke 19:3", translation: WEB },
      lines: [
        { say: "Zacchaeus was a chief tax collector. Rich, and not very popular.", mood: "thinking" },
        { say: "He wanted to see Jesus. There was just one problem.", show: "note", mood: "cheeky", act: "stare" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "excited" },
      beats: [
        {
          say: "So he ran ahead and found a tree.",
          mood: "excited",
          task: { type: "hold", label: "Hold to climb", unit: "Branch", from: 1, to: 3, caption: "Higher…" },
        },
        {
          say: "Not the most dignified look for a rich man.",
          mood: "cheeky",
          card: { text: "He ran on ahead, and climbed up into a sycamore tree to see him, for he was going to pass that way.", ref: "Luke 19:4", translation: WEB },
        },
        { say: "Then Jesus walked right up to that tree. And looked up.", mood: "surprised", act: "hop", look: 0 },
        {
          say: "Everyone grumbled about where Jesus was going.",
          mood: "tender",
          card: { text: "“He has gone in to lodge with a man who is a sinner.”", ref: "Luke 19:7", translation: WEB, big: true },
        },
      ],
    },
    {
      kind: "highlight",
      theme: "forest",
      page: { at: "top", mood: "excited" },
      verse: { text: "“Zacchaeus, hurry and come down, for today I must stay at your house.”", ref: "Luke 19:5", translation: WEB },
      before: [
        { say: "Let’s go back to the tree for a second.", mood: "neutral" },
        { say: "Here’s what Jesus said when he looked up.", show: "verse", open: true, mood: "excited" },
        { say: "Out of everyone there, he picked him. By name.", mood: "moved", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "Today. Not once he’d sorted himself out. Today.", mood: "moved" },
        { say: "And Zacchaeus changed, right there.", show: "context", mood: "happy", act: "nod" },
      ],
      context: { text: "“Behold, Lord, half of my goods I give to the poor. If I have wrongfully exacted anything of anyone, I restore four times as much.”", ref: "Luke 19:8", translation: WEB },
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Where did Zacchaeus go to get a look at Jesus?",
      options: [
        { text: "Up a sycamore tree", correct: true, reply: "Yes. A rich man, up a tree. Love it." },
        { text: "Onto a rooftop", reply: "Good guess, but it was a sycamore tree." },
        { text: "To the front of the crowd", reply: "The crowd wouldn’t let him through. So he climbed a sycamore tree." },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "Why do you think Jesus chose Zacchaeus’ house?",
      options: [
        { text: "He saw who he could become", reply: "And Zacchaeus became it, the same day." },
        { text: "Nobody else would have", reply: "That’s exactly why. Jesus went where nobody else would." },
        { text: "He was looking for him", reply: "That’s how Jesus put it himself. Keep going and see." },
        { text: "I’m not sure", reply: "Fair. Sometimes grace doesn’t explain itself." },
      ],
    },
    {
      kind: "verse",
      theme: "forest",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Here’s how Jesus summed it up.", mood: "thinking", open: true }],
      verse: { text: "For the Son of Man came to seek and to save that which was lost.", ref: "Luke 19:10", translation: WEB },
      after: [{ say: "Seek and save. He still does.", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s the story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "For the Son of Man came to seek and to save that which was lost.", ref: "Luke 19:10", translation: WEB },
    },
  ],
} satisfies Lesson;
