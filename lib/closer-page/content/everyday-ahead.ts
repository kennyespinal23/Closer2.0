import type { Lesson } from "../lesson/types";

/* Everyday Faith: "Everyone Else Is Ahead". Comparison and contentment.
   Variation: Paul's "I have learned" is explored (contentment as something learned, not a mood).
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const news = "Did you see Maya’s post? New house, new job, engaged. All in one year!";

export const everydayAhead = {
  id: "everyday-ahead",
  title: "Everyone Else Is Ahead",
  subtitle: "Comparison, and learning contentment",
  kind: "Everyday faith",
  scripture: "Philippians 4:11–12 · 1 Timothy 6:6",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "It’s late. You’re scrolling.", mood: "thinking" },
        { say: "Everyone you went to school with seems to be winning at life.", mood: "cheeky", act: "stare" },
        { say: "Then your friend texts.", mood: "surprised", act: "hop" },
      ],
      display: { text: "Everyone Else Is Ahead", sub: "Everyday faith · 5 min" },
      reply: "Read the text",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Alex", role: "Your friend" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: news,
          choices: [
            { text: "Good for her. Must be nice.", to: "a", page: { mood: "thinking" } },
            { text: "Yep. Meanwhile I’m still in the same place.", to: "b", page: { mood: "tender" } },
            { text: "That’s amazing! I should message her.", to: "c", page: { mood: "happy" } },
          ],
        },
        a: { says: "Ha. You okay? That sounded a bit sharp.", tone: "awkward", choices: [
          { text: "I’m fine.", to: "a2" }, { text: "Not really. I feel behind.", to: "a3", page: { mood: "moved" } },
        ] },
        a2: { says: "Okay… if you say so.", tone: "neutral" },
        a3: { says: "Same, honestly. Social media makes it worse.", tone: "warm" },
        b: { says: "Hey, you’re not behind. You’re just on your own road.", tone: "warm" },
        c: { says: "Yes! She’d love that.", tone: "warm" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s look under the scroll for a second.", mood: "curious", act: "tilt" }],
      prompt: "What does comparing leave you feeling?",
      options: [
        { text: "Behind.", reply: "Like everyone got a map but you. That’s a heavy feeling." },
        { text: "Not enough.", reply: "That one goes deep. Let’s be gentle with it." },
        { text: "Restless.", reply: "Like you should be somewhere else. That’s worth noticing." },
        { text: "Happy for them, flat for me.", reply: "Both at once. Very common." },
      ],
      many: "A few at once. Comparison tends to stir up a lot.",
      after: [{ say: "Here’s someone who learned something about this. In prison.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "Not that I speak because of lack, for I have learned in whatever state I am, to be content in it.", ref: "Philippians 4:11", translation: WEB },
      target: "I have learned",
      before: [{ say: "Paul wrote this from prison. Look at how he got there.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark how Paul became content, or tap it",
      after: [
        { say: "Learned. It didn’t come naturally to Paul either.", at: "top", mood: "surprised", act: "hop" },
        { say: "Contentment is practised, a bit at a time.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "So what is contentment, really?", show: "not", mood: "thinking" }],
      not: "I’ll be content once I catch up.",
      but: "I can learn to be content with God, right where I am.",
      prompt: "Drag the truer one into place, or tap it",
      after: [
        { say: "There’s always someone further ahead. The finish line keeps moving.", mood: "thinking" },
        { say: "Here’s how Scripture puts it.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "“But godliness with contentment is great gain.” (1 Timothy 6:6)",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Let’s go back to Alex’s text.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Alex", role: "Your friend" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: news,
          choices: [
            { text: "That’s great for her. Honestly I’ve been comparing a lot lately.", to: "a", page: { mood: "moved" } },
            { text: "Good for her! I’m going to send her a message.", to: "b", page: { mood: "happy" } },
            { text: "Nice. I’m logging off for the night, I think.", to: "c", page: { mood: "happy" } },
          ],
        },
        a: { says: "Me too. Want to grab a walk this weekend and talk about it?", tone: "warm" },
        b: { says: "She’ll love that. You’re a good friend.", tone: "warm" },
        c: { says: "Honestly, good idea. Night!", tone: "warm" },
      },
      after: [{ say: "Your road is yours. And God is on it with you.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Everyone Else Is Ahead",
      lines: [{ say: "A small practice.", mood: "happy" }],
      check: {
        prompt: "What could help you practise contentment this week?",
        options: [
          { text: "Name three things I’m grateful for.", reply: "Gratitude is contentment’s training ground.", mood: "happy", act: "nod" },
          { text: "Take a break from scrolling.", reply: "Even a day can quiet the comparison.", mood: "happy", act: "hop" },
          { text: "Celebrate someone ahead of me.", reply: "That one loosens comparison’s grip.", mood: "moved", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What’s one good thing about where you are right now?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Your road is yours.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Comparison makes the finish line keep moving.",
        "Paul learned contentment. It’s a practice, not a personality.",
        "God is with you right where you are.",
      ],
      verse: { text: "But godliness with contentment is great gain.", ref: "1 Timothy 6:6", translation: WEB },
      refs: ["Philippians 4:11–12", "1 Timothy 6:6"],
      related: [{ title: "They Got the Promotion", sub: "Everyday faith · 5 min", lessonId: "everyday-promotion" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
