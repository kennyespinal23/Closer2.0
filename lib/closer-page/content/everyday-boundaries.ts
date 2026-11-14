import type { Lesson } from "../lesson/types";

/* Everyday Faith: "When They Need You Again". Compassion and healthy boundaries.
   Variation: Galatians 6:2 and 6:5 side by side (bear one another's burdens / each bears his own), and Jesus
   himself taking rest (Mark 6:31). Boundaries are framed as part of love, not its opposite. If someone is in
   danger, the lesson points to getting them real help. Scripture is the WEB, word for word. */

const WEB = "World English Bible";
const call = "Can you come over? I can’t do this alone tonight.";

export const everydayBoundaries = {
  id: "everyday-boundaries",
  title: "When They Need You Again",
  subtitle: "Compassion, and healthy boundaries",
  kind: "Everyday faith",
  scripture: "Galatians 6:2, 5 · Mark 6:31",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      lines: [
        { say: "It’s 11pm. You’re exhausted. You have an early start.", mood: "tender", act: "settle" },
        { say: "Your friend has called every night this week. You love them.", mood: "thinking" },
        { say: "They’re calling again.", mood: "surprised" },
      ],
      display: { text: "When They Need You Again", sub: "Everyday faith · 5 min" },
      reply: "Answer",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Taylor", role: "Your friend" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: call,
          choices: [
            { text: "Of course. I’m on my way.", to: "a", page: { mood: "tender" } },
            { text: "I can’t tonight. Sorry.", to: "b", page: { mood: "thinking" } },
            { text: "(Let it ring.)", to: "c", page: { mood: "tender" } },
          ],
        },
        a: { says: "Thank you. You’re the only one I can talk to.", tone: "warm", choices: [
          { text: "I’ll always be here.", to: "a2", page: { mood: "thinking" } },
          { text: "I’m glad to help. Have you thought about talking to someone else too?", to: "a3", page: { mood: "moved" } },
        ] },
        a2: { says: "(You get home at 2am. Tomorrow is going to be rough.)", tone: "neutral" },
        a3: { says: "Maybe. I’ve been scared to. Will you help me look?", tone: "warm" },
        b: { says: "Oh. Okay. Never mind.", tone: "hurt" },
        c: { says: "(A text: “Guess you’re busy.” You lie awake feeling guilty.)", tone: "hurt" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s pause the phone call.", mood: "curious", act: "tilt" }],
      prompt: "What are you feeling?",
      options: [
        { text: "Worried about them.", reply: "Because you care. That’s good." },
        { text: "Exhausted.", reply: "You’re allowed to be. You’re a person too." },
        { text: "Guilty for wanting to say no.", reply: "A lot of caring people feel that. Let’s look at it." },
        { text: "Resentful.", reply: "Honest. Resentment often means a limit got crossed." },
      ],
      many: "Love and limits, tangled together. Very common.",
      after: [{ say: "Scripture says two things here that seem to pull in different directions.", at: "top", mood: "thinking" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Here are both, three verses apart.", show: "verse", mood: "curious", open: true }],
      verse: { text: "Bear one another’s burdens, and so fulfill the law of Christ. … For each man will bear his own burden.", ref: "Galatians 6:2, 5", translation: WEB },
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "Bear one another’s burdens", label: "Help carry theirs", note: "Help carry each other’s loads." },
        { phrase: "each man will bear his own burden", label: "Carry your own", note: "And each carries their own." },
      ],
      after: [
        { say: "Many readers take it this way: help with what’s too heavy, but you can’t carry all of someone’s life.", at: "top", mood: "thinking", open: false },
        { say: "Even Jesus told his tired disciples to come away and rest awhile.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "both",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Do you have to choose between caring and having limits?", mood: "curious", act: "tilt" }],
      a: "I care about them.",
      b: "I can’t carry everything.",
      joined: "I care about them, *and* I can’t carry everything.",
      prompt: "Drag one onto the other, or press the button",
      after: [
        { say: "A boundary can be a way of loving someone well over the long run.", mood: "moved", act: "nod" },
        { say: "And if someone’s in danger, the loving thing is getting them real help, fast.", mood: "tender" },
      ],
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "The phone’s ringing again. Let’s try it.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Taylor", role: "Your friend" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: call,
          choices: [
            { text: "I can’t come tonight, I’m wiped out. Can we talk for ten minutes now, and get coffee tomorrow?", to: "a", page: { mood: "moved" } },
            { text: "I love you, and I’m worried you’re carrying this alone. Can we find you some more support too?", to: "b", page: { mood: "moved" } },
            { text: "Are you safe right now? If not, I’ll call for help with you.", to: "c", page: { mood: "tender" } },
          ],
        },
        a: { says: "Okay. Yeah. Ten minutes would really help. Thank you.", tone: "warm" },
        b: { says: "I didn’t want to be a burden. But yeah. Maybe.", tone: "warm" },
        c: { says: "I’m safe. Just really low. Thanks for asking.", tone: "warm" },
      },
      after: [{ say: "Still caring. Still showing up. Just not carrying it all alone.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "When They Need You Again",
      lines: [{ say: "A gentle check-in.", mood: "tender" }],
      check: {
        prompt: "Is there a relationship where you need a healthier limit?",
        options: [
          { text: "Yes, and I know what it is.", reply: "Say it kindly, and clearly. That’s love too.", mood: "moved", act: "nod" },
          { text: "Yes, but I don’t know how.", reply: "Start small. And ask someone wise to help you think it through.", mood: "thinking", act: "nod" },
          { text: "Not right now.", reply: "Good. Remember this for when there is.", mood: "happy", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What would loving them well look like this week?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Care, with limits.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Scripture calls us to help carry each other’s burdens.",
        "It also says each carries their own, and Jesus himself made time to rest.",
        "Caring and having limits can go together.",
      ],
      verse: { text: "Bear one another’s burdens, and so fulfill the law of Christ.", ref: "Galatians 6:2", translation: WEB },
      refs: ["Galatians 6:2", "Galatians 6:5", "Mark 6:31"],
      related: [{ title: "The Person Everyone Ignores", sub: "Everyday faith · 5 min", lessonId: "everyday-ignored" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
