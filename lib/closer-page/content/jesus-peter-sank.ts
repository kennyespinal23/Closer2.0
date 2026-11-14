import type { Lesson } from "../lesson/types";

/* Jesus Only: "The Moment Peter Sank", Matthew 14:22–33.
   Central question: what does Jesus do when our faith falters? He calls Peter out, and when Peter sinks he
   reaches out "immediately". The takeaway is about Jesus' response, not a lecture on Peter's doubt.
   Every spoken line is Scripture (World English Bible, word for word). */

const WEB = "World English Bible";

export const jesusPeterSank = {
  id: "jesus-peter-sank",
  title: "The Moment Peter Sank",
  subtitle: "What does Jesus do when faith falters?",
  kind: "Jesus only",
  scripture: "Matthew 14:22–33",
  minutes: 5,
  theme: "wine",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "surprised" },
      lines: [
        { say: "Middle of the night. Middle of the lake. A figure walking across the waves.", mood: "surprised", act: "shake" },
        { say: "One man climbs out of the boat to meet him. And starts to sink.", mood: "curious", act: "tilt" },
        { say: "The question is what Jesus does next.", mood: "thinking", act: "nod" },
      ],
      display: { text: "The Moment Peter Sank", sub: "Matthew 14:22–33 · World English Bible" },
      reply: "Out on the water",
    },
    {
      kind: "turning",
      scene: "storm",
      page: { at: "top", mood: "thinking" },
      beats: [
        { tag: "text", intensity: 0, text: "Jesus sent the disciples ahead by boat, and went up the mountain alone to pray.", verse: { text: "After he had sent the multitudes away, he went up into the mountain by himself to pray. When evening had come, he was there alone.", ref: "Matthew 14:23", translation: WEB }, say: "Jesus, alone, praying.", mood: "tender" },
        { tag: "text", intensity: 2, text: "Out on the lake, the wind was against them.", verse: { text: "But the boat was now in the middle of the sea, distressed by the waves, for the wind was contrary.", ref: "Matthew 14:24", translation: WEB }, say: "Hours of fighting the wind.", mood: "surprised" },
        { tag: "context", intensity: 2, text: "The fourth watch of the night was roughly 3 to 6 in the morning. They had been rowing most of the night.", say: "Exhausted. In the dark.", mood: "thinking" },
        { tag: "text", intensity: 3, text: "Then they saw someone walking on the water.", verse: { text: "In the fourth watch of the night, Jesus came to them, walking on the sea.", ref: "Matthew 14:25", translation: WEB }, say: "Walking. On the sea.", mood: "surprised", act: "hop" },
      ],
      after: [],
    },
    {
      kind: "exchange",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Here’s what was said out there. Every line is Scripture.", mood: "thinking" }],
      lines: [
        { who: "The disciples", text: "“It’s a ghost!”", ref: "Matthew 14:26", translation: WEB, say: "Understandable.", mood: "surprised", act: "shake" },
        { who: "Jesus", side: "right", text: "“Cheer up! It is I! Don’t be afraid.”", ref: "Matthew 14:27", translation: WEB, say: "Immediately, he speaks.", mood: "happy" },
        { who: "Peter", text: "“Lord, if it is you, command me to come to you on the waters.”", ref: "Matthew 14:28", translation: WEB, say: "Of course it’s Peter.", mood: "cheeky", act: "stare" },
        { who: "Jesus", side: "right", text: "“Come!”", ref: "Matthew 14:29", translation: WEB, say: "One word. And Peter steps out.", mood: "excited", act: "hop" },
        { who: "Peter", text: "“Lord, save me!”", ref: "Matthew 14:30", translation: WEB, say: "He saw the wind. And he started to sink.", mood: "surprised" },
      ],
      after: [{ say: "Now look closely at what Jesus does.", at: "top", mood: "curious", act: "lean" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "Immediately Jesus stretched out his hand, took hold of him, and said to him, “You of little faith, why did you doubt?”", ref: "Matthew 14:31", translation: WEB },
      target: "Immediately Jesus stretched out his hand",
      before: [{ say: "Find the first thing Jesus does.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark what Jesus does first, or tap it",
      after: [
        { say: "Immediately.", at: "top", mood: "surprised", act: "react" },
        { say: "Rescue first. The question comes after he’s safe.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "ask",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Why do you think Peter sank?",
      options: [
        { text: "He looked at the wind.", reply: "That’s what Matthew says: he saw the wind, and was afraid.", mood: "thinking", act: "nod" },
        { text: "He didn’t believe enough.", reply: "Jesus did ask why he doubted. But notice what Jesus did first.", mood: "thinking", act: "tilt" },
        { text: "Anyone would have.", reply: "Probably. And only Peter even got out of the boat.", mood: "cheeky", act: "stare" },
      ],
      after: [
        { say: "Whatever the reason, Jesus didn’t let him go under.", at: "top", mood: "moved", show: "compare" },
        { say: "Then they climbed into the boat together, and the wind stopped.", mood: "happy", act: "nod" },
      ],
      compare: {
        not: { label: "Not", text: "Peter doubted, so Jesus let him sink." },
        but: { label: "In the story", text: "Peter cried out, and Jesus caught him *immediately*." },
      },
    },
    {
      kind: "verse",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "And here’s how the men in the boat responded.", mood: "thinking", open: true }],
      verse: { text: "Those who were in the boat came and worshiped him, saying, “You are truly the Son of God!”", ref: "Matthew 14:33", translation: WEB },
      after: [{ say: "Fear turned into worship.", mood: "moved", act: "nod", open: false }],
      reply: "Continue",
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Moment Peter Sank",
      lines: [{ say: "Can I ask you something?", mood: "tender" }],
      check: {
        prompt: "Where do you feel like you’re sinking right now?",
        options: [
          { text: "In something I stepped out to do.", reply: "Then you’re in Peter’s spot. And he got caught.", mood: "moved", act: "nod" },
          { text: "In fear about the future.", reply: "“Lord, save me” is a perfectly good prayer. It’s in the Bible.", mood: "tender", act: "nod" },
          { text: "In my own doubts.", reply: "Peter doubted, and Jesus still reached him first.", mood: "moved", act: "nod" },
          { text: "I’m on solid ground today.", reply: "Good. Remember this for the day you’re not.", mood: "happy", act: "hop" },
        ],
      },
      ask: "What would you say to him, if you were the one sinking?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we discovered about Jesus",
      body: "The Lord is always closer than you think.",
      summary: [
        "He came to his friends in the middle of the night, across the waves.",
        "He invited Peter to come to him.",
        "When Peter sank, he reached out immediately.",
      ],
      verse: { text: "Immediately Jesus stretched out his hand, took hold of him, and said to him, “You of little faith, why did you doubt?”", ref: "Matthew 14:31", translation: WEB },
      refs: ["Matthew 14:22–33"],
      related: [
        { title: "The Storm That Obeyed Him", sub: "Jesus only · Mark 4", lessonId: "jesus-storm" },
        { title: "The King Who Washed Feet", sub: "Jesus only · John 13", lessonId: "jesus-washed-feet" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
