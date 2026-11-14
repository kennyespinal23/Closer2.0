import type { Lesson } from "../lesson/types";

/* Learning to Pray: "I Don't Know What to Say". Matthew 6:7–8.
   Core message: prayer doesn't need impressive or perfect words.
   - Jesus warns against "vain repetitions": praying as a performance, as if more words earn a hearing. That's not
     a rule against ever repeating a prayer (he gives a prayer to pray in the next verses, and prayed the same
     words three times himself in Matthew 26:44); Page says so.
   - The topic you pick shapes the starter phrases in the builder. Your prayer lives only in memory for this
     lesson; it's kept on the device only if you choose that at the end.
   Scripture is the World English Bible, word for word. Starter phrases and prompts are suggestions, not Scripture. */

const WEB = "World English Bible";
const passage = {
  text: "In praying, don’t use vain repetitions, as the Gentiles do; for they think that they will be heard for their much speaking. Therefore don’t be like them, for your Father knows what things you need, before you ask him.",
  ref: "Matthew 6:7–8",
  translation: WEB,
};

export const prayNoWords = {
  id: "pray-no-words",
  title: "I Don’t Know What to Say",
  subtitle: "You don’t need perfect words",
  kind: "Learning to pray",
  scripture: "Matthew 6:7–8",
  minutes: 5,
  theme: "rose",
  blocks: [
    // 1. Welcome
    {
      kind: "dialogue",
      page: { at: "hero", act: "hop", mood: "happy" },
      lines: [
        { say: "Not sure what to say to God?", mood: "curious", act: "tilt" },
        { say: "That’s okay. We can start small.", mood: "happy", act: "nod" },
      ],
      display: { text: "I Don’t Know What to Say", sub: "Learning to pray · take your time" },
      reply: "Let’s start",
    },
    // 2. Discover Jesus' teaching
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: passage,
      target: "vain repetitions",
      before: [
        { say: "Jesus talked about this. Some people back then thought more words meant a better prayer.", mood: "thinking" },
        { say: "Find the phrase he uses.", show: "verse", mood: "curious", act: "tilt" },
      ],
      prompt: "Mark it, or tap it",
      after: [
        { say: "Empty words. Prayer as a performance, as if a long speech earns God’s attention.", at: "top", mood: "thinking" },
        { say: "It’s not that repeating a prayer is wrong. Jesus gave his friends a prayer to pray right after this.", mood: "happy", act: "nod" },
        { say: "And look at the reason he gives: your Father already knows what you need.", mood: "moved" },
      ],
    },
    // 3. Choose a topic
    {
      kind: "topic",
      page: { at: "top", mood: "curious" },
      key: "topic",
      prompt: "What would you like to talk to God about?",
      options: [
        { id: "thanks", text: "Something I’m thankful for", reply: "A lovely place to start." },
        { id: "worry", text: "Something that’s worrying me", reply: "You can bring worries, just as they are." },
        { id: "help", text: "Something I need help with", reply: "Asking for help is a very honest prayer." },
        { id: "someone", text: "Someone I care about", reply: "Praying for someone is a gift to them." },
        { id: "unsure", text: "I’m not sure yet", reply: "That’s okay. Not knowing can be where prayer starts." },
      ],
    },
    // 4. Build a prayer
    {
      kind: "builder",
      page: { at: "corner", mood: "happy" },
      topicKey: "topic",
      save: "prayer",
      label: "Your words",
      placeholder: "Start anywhere. A few words is plenty.",
      prompts: {
        thanks: ["God, thank you for…", "I noticed today…", "It made me feel…"],
        worry: ["God, I’ve been worried about…", "I don’t know how to…", "Please help me…"],
        help: ["God, I need help with…", "I’m finding it hard to…", "Please give me…"],
        someone: ["God, I want to pray for…", "They’re going through…", "Please be with them…"],
        unsure: ["God, I’m not sure what to say.", "I’m here.", "Here’s what’s on my mind…"],
      },
      fallback: ["God, I’m here.", "Here’s what’s on my mind…", "Thank you for listening."],
    },
    // 5. Hold to be still
    {
      kind: "still",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Before we go on, let’s be quiet for a moment. No words needed.", mood: "tender", act: "settle" }],
      invite: "Press the circle when you’re ready",
      text: "Breathe slowly. You don’t have to say anything. Just be here.",
      verse: { text: "your Father knows what things you need", ref: "Matthew 6:8", translation: WEB },
    },
    // 6. Pray through Scripture
    {
      kind: "scripturePrayer",
      page: { at: "top", mood: "happy" },
      before: [{ say: "Here’s another way to pray: let Scripture give you words to start with.", mood: "happy", act: "nod" }],
      verse: passage,
      phrases: [
        { phrase: "they will be heard for their much speaking", prompt: "God, I don’t need to say a lot. Here’s what’s true for me right now…" },
        { phrase: "your Father knows what things you need", prompt: "Father, you already know what I need. Thank you that I don’t have to explain it perfectly." },
        { phrase: "before you ask him", prompt: "God, even before I find the words, I want to bring this to you…" },
      ],
      after: [{ say: "Prayers that start from Scripture can be short, and still real.", at: "top", mood: "moved", act: "nod" }],
    },
    // 7. Release
    {
      kind: "release",
      page: { at: "top", mood: "moved" },
      before: [{ say: "When you’re ready, you can close this prayer.", mood: "tender", act: "settle" }],
      from: "prayer",
      fallback: "You didn’t write anything down, and that’s fine. Prayer can be the quiet you just had.",
      ref: "I Don’t Know What to Say",
    },
    // 8. Completion
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "You don’t need perfect words to begin.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Jesus said prayer isn’t about many words or a good performance.",
        "Your Father knows what you need before you ask.",
        "A few honest words, or even quiet, is a real place to start.",
      ],
      verse: { text: "Therefore don’t be like them, for your Father knows what things you need, before you ask him.", ref: "Matthew 6:8", translation: WEB },
      refs: ["Matthew 6:7–8"],
      related: [
        { title: "Teach Me to Pray", sub: "Learning to pray · Matthew 6", lessonId: "pray-teach-me" },
        { title: "When You Don’t Have the Words", sub: "Learning to pray · Romans 8", lessonId: "pray-no-words-spirit" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
