import type { Lesson } from "../lesson/types";

/* The storm, Mark 4:35-41. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const storm = {
  id: "storm",
  title: "The storm",
  subtitle: "Three words, and the sea went quiet",
  kind: "Bible story",
  scripture: "Mark 4",
  minutes: 3,
  theme: "night",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [{ say: "Hey! Ever been caught in a really bad storm?", mood: "curious", act: "tilt" }],
      reply: "Once or twice",
    },
    {
      kind: "story",
      page: { at: "top", mood: "neutral" },
      beats: [
        {
          say: "One evening, Jesus said this to his friends.",
          mood: "happy",
          card: { text: "“Let’s go over to the other side.”", ref: "Mark 4:35", translation: WEB, big: true },
        },
        { say: "So they pushed off across the lake.", mood: "happy", act: "nod" },
        {
          say: "Then the storm hit. Hard.",
          mood: "surprised",
          act: "shake",
          card: { text: "A big wind storm arose, and the waves beat into the boat, so much that the boat was already filled.", ref: "Mark 4:37", translation: WEB },
        },
        {
          say: "And Jesus? Asleep. On a cushion.",
          mood: "cheeky",
          act: "stare",
          card: { text: "He himself was in the stern, asleep on the cushion", ref: "Mark 4:38", translation: WEB },
        },
        {
          say: "They woke him up, terrified.",
          mood: "tender",
          card: { text: "“Teacher, don’t you care that we are dying?”", ref: "Mark 4:38", translation: WEB, big: true },
        },
      ],
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Where was Jesus while the storm was raging?",
      options: [
        { text: "Asleep in the boat", correct: true, reply: "Yes. Asleep on a cushion, in the middle of all that." },
        { text: "Back on the shore", reply: "He was right there with them, asleep in the back of the boat." },
        { text: "Rowing with everyone", reply: "Not quite. He was asleep on a cushion in the back of the boat." },
      ],
    },
    {
      kind: "highlight",
      theme: "burgundy",
      page: { at: "top", mood: "curious" },
      verse: { text: "“Peace! Be still!”", ref: "Mark 4:39", translation: WEB },
      context: { text: "The wind ceased, and there was a great calm.", ref: "Mark 4:39", translation: WEB },
      before: [
        { say: "He got up, and spoke to the wind and the sea.", mood: "curious", act: "lean" },
        { say: "This is what he said.", show: "verse", open: true, mood: "surprised" },
        { say: "Run your finger across it. Slowly.", mood: "thinking", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "And the wind just… stopped.", mood: "surprised", act: "hop" },
        { say: "Not a bit calmer. A great calm.", show: "context", mood: "moved" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "thinking" },
      beats: [
        {
          say: "Then he turned to his friends.",
          mood: "thinking",
          card: { text: "“Why are you so afraid? How is it that you have no faith?”", ref: "Mark 4:40", translation: WEB, big: true },
        },
        { say: "Fair question. He was in the boat the whole time.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "What storm are you in right now?",
      options: [
        { text: "Work or school stuff", reply: "He’s in that boat with you. Ask him about it today." },
        { text: "Something at home", reply: "That’s a heavy one. You can wake him up about it. He doesn’t mind." },
        { text: "Something in my head", reply: "The loudest storms can be the quiet ones. He can speak to those too." },
        { text: "Calm seas for now", reply: "Love that. Enjoy it, and remember who’s in the boat for the next one." },
      ],
    },
    {
      kind: "verse",
      theme: "burgundy",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "His friends were left with one big question.", mood: "thinking", open: true }],
      verse: { text: "“Who then is this, that even the wind and the sea obey him?”", ref: "Mark 4:41", translation: WEB },
      after: [{ say: "That’s who’s in your boat.", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s the story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "“Who then is this, that even the wind and the sea obey him?”", ref: "Mark 4:41", translation: WEB },
    },
  ],
} satisfies Lesson;
