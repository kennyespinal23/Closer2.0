import type { Lesson } from "../lesson/types";

/* Jonah, Jonah 1-4. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const jonah = {
  id: "jonah",
  title: "Jonah",
  subtitle: "The prophet who ran the other way",
  kind: "Character study",
  scripture: "Jonah 1–4",
  minutes: 5,
  theme: "forest",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [{ say: "Hey! Want to hear about a guy who ran the wrong way? Like, really the wrong way?", mood: "cheeky", act: "stare" }],
      reply: "Tell me about him!",
    },
    {
      kind: "character",
      page: { at: "left", mood: "neutral", act: "hop" },
      name: "Jonah",
      place: "son of Amittai",
      figure: "man",
      note: { text: "“Arise, go to Nineveh, that great city, and preach against it, for their wickedness has come up before me.”", ref: "Jonah 1:2", translation: WEB },
      lines: [
        { say: "God gave Jonah a job: go to Nineveh.", show: "note" },
        { say: "Jonah did not want that job.", mood: "cheeky", act: "shake" },
      ],
    },
    {
      kind: "story",
      theme: "night",
      page: { at: "top", mood: "cheeky" },
      beats: [
        {
          say: "So he got on a ship going the opposite direction.",
          mood: "cheeky",
          card: { text: "But Jonah rose up to flee to Tarshish from the presence of Yahweh.", ref: "Jonah 1:3", translation: WEB },
        },
        {
          say: "Then the wind picked up.",
          mood: "surprised",
          act: "shake",
          card: { text: "But Yahweh sent out a great wind on the sea, and there was a mighty storm on the sea, so that the ship was likely to break up.", ref: "Jonah 1:4", translation: WEB },
        },
        {
          say: "Jonah knew it was about him. So the sailors threw him in.",
          mood: "tender",
          card: { text: "So they took up Jonah, and threw him into the sea; and the sea ceased its raging.", ref: "Jonah 1:15", translation: WEB },
        },
        {
          say: "And then a great fish swallowed him whole.",
          mood: "surprised",
          act: "hop",
          task: { type: "hold", label: "Hold to wait it out", unit: "Day", from: 1, to: 3, caption: "Inside the fish…" },
        },
        {
          say: "Three days. In a fish.",
          mood: "tender",
          card: { text: "Jonah was in the belly of the fish three days and three nights.", ref: "Jonah 1:17", translation: WEB },
        },
      ],
    },
    {
      kind: "highlight",
      theme: "burgundy",
      page: { at: "top", mood: "tender" },
      verse: { text: "He answered me.", ref: "Jonah 2:2", translation: WEB },
      context: { text: "Then Yahweh spoke to the fish, and it vomited out Jonah on the dry land.", ref: "Jonah 2:10", translation: WEB },
      before: [
        { say: "It’s dark in there. And Jonah prays anyway.", mood: "tender" },
        { say: "Here’s part of his prayer.", show: "verse", open: true, mood: "neutral" },
        { say: "Three words. After everything he did.", mood: "thinking", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "Jonah ran from God. God still answered.", mood: "moved" },
        { say: "Then the fish put him back on dry land. Not gently.", show: "context", mood: "cheeky", act: "react" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "happy" },
      beats: [
        {
          say: "Second chance. Same job.",
          mood: "happy",
          card: { text: "“Arise, go to Nineveh, that great city, and preach to it the message that I give you.”", ref: "Jonah 3:2", translation: WEB },
        },
        {
          say: "This time he went. And the whole city listened.",
          mood: "excited",
          act: "hop",
          card: { text: "The people of Nineveh believed God; and they proclaimed a fast, and put on sackcloth, from their greatest even to their least.", ref: "Jonah 3:5", translation: WEB },
        },
        {
          say: "And God showed them mercy.",
          mood: "moved",
          card: { text: "God saw their works, that they turned from their evil way. God relented of the disaster which he said he would do to them, and he didn’t do it.", ref: "Jonah 3:10", translation: WEB },
        },
        {
          say: "Happy ending, right? Jonah didn’t think so.",
          mood: "cheeky",
          act: "shake",
          card: { text: "But it displeased Jonah exceedingly, and he was angry.", ref: "Jonah 4:1", translation: WEB, big: true },
        },
      ],
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "So why did Jonah run in the first place?",
      options: [
        { text: "He knew God would be merciful to Nineveh", correct: true, reply: "Right. He said so himself. He just didn’t want mercy for them." },
        { text: "He was scared of the sea", reply: "He got on a ship, so not that. He ran because he knew God would show Nineveh mercy." },
        { text: "He didn’t hear God clearly", reply: "He heard just fine. He ran because he knew God would show Nineveh mercy." },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "Is there someone you find it hard to want good things for?",
      options: [
        { text: "Yes, honestly", reply: "Jonah gets you. And God was patient with him the whole way." },
        { text: "Not really", reply: "That’s a gift. Hold onto it." },
        { text: "I might be the Nineveh here", reply: "Then here’s the good news: God was hoping Nineveh would turn. He hopes the same for you." },
        { text: "I’d rather not say", reply: "Fair. That one can stay between you and God." },
      ],
    },
    {
      kind: "verse",
      theme: "burgundy",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Jonah said this like a complaint. Read it like good news.", mood: "cheeky", open: true }],
      verse: { text: "“…for I knew that you are a gracious God, and merciful, slow to anger, and abundant in loving kindness…”", ref: "Jonah 4:2", translation: WEB },
      after: [{ say: "Gracious. Merciful. Slow to anger. That’s who’s with you.", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s the story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "“…for I knew that you are a gracious God, and merciful, slow to anger, and abundant in loving kindness…”", ref: "Jonah 4:2", translation: WEB },
    },
  ],
} satisfies Lesson;
