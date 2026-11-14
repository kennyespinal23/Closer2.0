import type { Lesson } from "../lesson/types";

/* Jesus Only: "The Man in the Tree", Luke 19:1–10.
   Central question: who moved first, Zacchaeus or Jesus? The takeaway is about Jesus: he seeks the lost, and
   his welcome comes before the change. (Closer's character study tells the same story from Zacchaeus' side.)
   Every spoken line is Scripture (World English Bible, word for word). */

const WEB = "World English Bible";

export const jesusZacchaeus = {
  id: "jesus-zacchaeus",
  title: "The Man in the Tree",
  subtitle: "Who moved first?",
  kind: "Jesus only",
  scripture: "Luke 19:1–10",
  minutes: 5,
  theme: "wine",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "A crowded street. A man everyone avoids, up a tree.", mood: "cheeky", act: "stare" },
        { say: "And Jesus stops right underneath him.", mood: "surprised" },
        { say: "This one’s about who Jesus goes looking for.", mood: "curious", act: "tilt" },
      ],
      display: { text: "The Man in the Tree", sub: "Luke 19:1–10 · World English Bible" },
      reply: "Show me",
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        { tag: "text", intensity: 0, text: "Jesus was passing through Jericho, with crowds around him.", verse: { text: "He entered and was passing through Jericho.", ref: "Luke 19:1", translation: WEB }, say: "Just passing through.", mood: "happy" },
        { tag: "text", intensity: 0, text: "In the crowd was a rich man.", verse: { text: "There was a man named Zacchaeus. He was a chief tax collector, and he was rich.", ref: "Luke 19:2", translation: WEB }, say: "A chief tax collector.", mood: "cheeky", act: "stare" },
        { tag: "context", intensity: 0, text: "Tax collectors collected money for Rome and could take extra for themselves. Many people saw them as traitors and cheats.", say: "Nobody liked tax collectors.", mood: "thinking" },
        { tag: "text", intensity: 0, text: "Zacchaeus was too short to see over the crowd, so he climbed a sycamore tree.", verse: { text: "He was trying to see who Jesus was, and couldn’t because of the crowd, because he was short.", ref: "Luke 19:3", translation: WEB }, say: "So up the tree he went.", mood: "cheeky", act: "hop" },
      ],
      after: [],
    },
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Now watch what Jesus does.", mood: "curious", act: "lean" },
        { say: "Tap through it, in order.", show: "verse", mood: "curious" },
      ],
      verse: { text: "When Jesus came to the place, he looked up and saw him, and said to him, “Zacchaeus, hurry and come down, for today I must stay at your house.”", ref: "Luke 19:5", translation: WEB },
      hint: "Tap each step in the verse",
      visual: "steps",
      links: [
        { phrase: "he looked up and saw him", label: "He sees him", note: "Out of the whole crowd, he looks up. At him." },
        { phrase: "Zacchaeus, hurry and come down", label: "He calls him by name", note: "He knows his name." },
        { phrase: "today I must stay at your house", label: "He invites himself in", note: "And he invites himself over. Today." },
      ],
      after: [
        { say: "Zacchaeus climbed the tree to see Jesus.", at: "top", mood: "thinking" },
        { say: "But Jesus was the one who stopped, looked, and called.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "exchange",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Not everyone was happy about it.", mood: "tender" }],
      lines: [
        { who: "The crowd", text: "“He has gone in to lodge with a man who is a sinner.”", ref: "Luke 19:7", translation: WEB, say: "The crowd grumbled.", mood: "tender" },
        { who: "Zacchaeus", text: "“Behold, Lord, half of my goods I give to the poor. If I have wrongfully exacted anything of anyone, I restore four times as much.”", ref: "Luke 19:8", translation: WEB, say: "And Zacchaeus changed. Right there.", mood: "surprised", act: "hop" },
        { who: "Jesus", side: "right", text: "“Today, salvation has come to this house, because he also is a son of Abraham.", ref: "Luke 19:9", translation: WEB, say: "Today, Jesus says. Not someday.", mood: "moved" },
      ],
      after: [{ say: "Then Jesus says why he came at all.", at: "top", mood: "curious" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "For the Son of Man came to seek and to save that which was lost.", ref: "Luke 19:10", translation: WEB },
      target: "to seek and to save",
      before: [{ say: "Find what Jesus says he came to do.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark his mission, or tap it",
      after: [
        { say: "Seek, and save.", at: "top", mood: "moved", act: "nod" },
        { say: "He didn’t wait for Zacchaeus to come looking for him.", mood: "thinking" },
      ],
    },
    {
      kind: "ask",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "So who moved first?",
      options: [
        { text: "Zacchaeus changed, so Jesus came.", reply: "Look at the order again. Jesus called him before he changed anything.", mood: "thinking", act: "tilt" },
        { text: "Jesus came, and Zacchaeus changed.", reply: "That’s it. The welcome came first. The change followed.", mood: "excited", act: "hop" },
        { text: "I’m not sure.", reply: "Fair. Let’s look at the order together.", mood: "tender", act: "nod" },
      ],
      after: [
        { say: "Jesus didn’t make Zacchaeus earn the visit.", at: "top", mood: "moved", show: "compare" },
        { say: "Being welcomed is what changed him.", mood: "moved", act: "nod" },
      ],
      compare: {
        not: { label: "Not", text: "Clean yourself up, then Jesus will come." },
        but: { label: "In the story", text: "Jesus came to Zacchaeus *first*, and then he changed." },
      },
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Man in the Tree",
      lines: [{ say: "Here’s a gentle question.", mood: "tender" }],
      check: {
        prompt: "Do you ever feel you have to get it together before Jesus would want you?",
        options: [
          { text: "Yes, often.", reply: "Zacchaeus didn’t get it together first. Jesus called him down from the tree as he was.", mood: "moved", act: "nod" },
          { text: "Sometimes.", reply: "Then remember the order: welcome first, change after.", mood: "thinking", act: "nod" },
          { text: "Not really.", reply: "Then maybe there’s someone you could welcome the way he did.", mood: "happy", act: "nod" },
          { text: "I’d rather not say.", reply: "That’s fine. It can stay between you and him.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What would it mean for Jesus to stop for you today?",
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
        "He stopped for the man the crowd despised, and called him by name.",
        "His welcome came first. Zacchaeus’ change followed.",
        "He said he came to seek and to save the lost.",
      ],
      verse: { text: "For the Son of Man came to seek and to save that which was lost.", ref: "Luke 19:10", translation: WEB },
      refs: ["Luke 19:1–10"],
      related: [
        { title: "The Woman at the Well", sub: "Jesus only · John 4", lessonId: "jesus-well" },
        { title: "Zacchaeus", sub: "Character study · Luke 19", lessonId: "zacchaeus" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
