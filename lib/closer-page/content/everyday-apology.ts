import type { Lesson } from "../lesson/types";

/* Everyday Faith: "The Apology You're Waiting For". Forgiveness and pride.
   Variation: a knowns block separates what's yours to do from what isn't (Romans 12:18 "as much as it is up
   to you"). Forgiving doesn't mean pretending it didn't hurt. Scripture is the WEB, word for word. */

const WEB = "World English Bible";
const text = "Hey. Are we still doing Sunday lunch?";

export const everydayApology = {
  id: "everyday-apology",
  title: "The Apology You’re Waiting For",
  subtitle: "Forgiveness, and a little pride",
  kind: "Everyday faith",
  scripture: "Colossians 3:13 · Romans 12:18",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "Two weeks ago, your brother said something that really hurt.", mood: "tender", act: "settle" },
        { say: "He never apologised. You’ve been waiting.", mood: "thinking" },
        { say: "Now he texts like nothing happened.", mood: "surprised", act: "shake" },
      ],
      display: { text: "The Apology You’re Waiting For", sub: "Everyday faith · 5 min" },
      reply: "Read his text",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Chris", role: "Your brother" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: text,
          choices: [
            { text: "Seriously? You’re just going to act like nothing happened?", to: "a", page: { mood: "surprised" } },
            { text: "Sure.", to: "b", page: { mood: "thinking" } },
            { text: "(Leave him on read.)", to: "c", page: { mood: "tender" } },
          ],
        },
        a: { says: "What are you talking about?", tone: "awkward", choices: [
          { text: "You know what. Forget it.", to: "a2", page: { mood: "tender" } },
          { text: "What you said at Mum’s. It really hurt.", to: "a3", page: { mood: "moved" } },
        ] },
        a2: { says: "Okay… see you Sunday then, I guess.", tone: "awkward" },
        a3: { says: "Oh. I didn’t realise. I’m sorry. I was stressed and took it out on you.", tone: "warm" },
        b: { says: "Great. 1pm?", tone: "neutral" },
        c: { says: "(The next day: “Hello?”)", tone: "hurt" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s stop the clock here.", mood: "curious", act: "tilt" }],
      prompt: "What’s going on underneath?",
      options: [
        { text: "Still hurt.", reply: "Of course. Two weeks doesn’t erase it." },
        { text: "I want him to go first.", reply: "That’s pride, and it’s very normal. Most of us feel it." },
        { text: "Tired of always being the one who fixes things.", reply: "That’s real. It’s worth saying out loud." },
        { text: "I just want things to be okay.", reply: "That longing is good. Hold onto it." },
      ],
      many: "A few at once. Family stuff tangles like that.",
      after: [{ say: "Let’s see what Scripture puts on the table.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.", ref: "Colossians 3:13", translation: WEB },
      target: "even as Christ forgave you",
      before: [{ say: "Look at the reason Paul gives for forgiving.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark the reason, or tap it",
      after: [
        { say: "Christ didn’t wait for us to apologise first.", at: "top", mood: "moved" },
        { say: "Forgiveness starts with what we’ve been given.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Romans 12:18 says: as much as it is up to you, be at peace.", mood: "thinking" },
        { say: "So what’s up to you, and what isn’t? Turn these over.", mood: "curious" },
      ],
      known: {
        label: "Up to you",
        items: [
          { text: "Choosing to forgive", ref: "Colossians 3:13" },
          { text: "Telling him honestly that it hurt", ref: "Ephesians 4:25" },
          { text: "Taking a step toward peace", ref: "Romans 12:18" },
        ],
      },
      unknown: {
        label: "Not up to you",
        items: [{ text: "Whether, or how, he apologises", ref: "Romans 12:18" }],
      },
      after: [
        { say: "Forgiving doesn’t mean pretending it didn’t hurt.", mood: "tender" },
        { say: "It means you stop making peace wait on his move.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Okay. His text again.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Chris", role: "Your brother" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: text,
          choices: [
            { text: "Yes. Can we talk about what you said at Mum’s first? It hurt.", to: "a", page: { mood: "moved" } },
            { text: "Yes, I’ll be there. I’ve decided to let the other thing go.", to: "b", page: { mood: "moved" } },
            { text: "Yes. I need a bit more time before we talk about the other day, though.", to: "c", page: { mood: "moved" } },
          ],
        },
        a: { says: "Yeah. I’ve felt bad about it. I’m sorry. I was out of line.", tone: "warm" },
        b: { says: "…thanks. I know I owe you an apology. I’m sorry.", tone: "warm" },
        c: { says: "Fair. Whenever you’re ready. See you Sunday.", tone: "warm" },
      },
      after: [{ say: "He might apologise. He might not. You took a step either way.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Apology You’re Waiting For",
      lines: [{ say: "A gentle question.", mood: "tender" }],
      check: {
        prompt: "Is there someone you’ve been waiting to apologise first?",
        options: [
          { text: "Yes, and I’m ready to take a step.", reply: "That takes courage. Go gently.", mood: "happy", act: "nod" },
          { text: "Yes, but I’m not ready yet.", reply: "That’s honest. Forgiveness can take time. Bring it to God.", mood: "moved", act: "nod" },
          { text: "Not right now.", reply: "Then remember this for when there is.", mood: "happy", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What would one step toward peace look like?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "As much as it’s up to you.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Waiting for someone else to go first is very human.",
        "We forgive because Christ forgave us first.",
        "You can be honest about the hurt, and still take the step toward peace.",
      ],
      verse: { text: "If it is possible, as much as it is up to you, be at peace with all men.", ref: "Romans 12:18", translation: WEB },
      refs: ["Colossians 3:13", "Romans 12:18"],
      related: [{ title: "Can God forgive anyone?", sub: "Big question · 6 min", lessonId: "forgive-anyone" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
