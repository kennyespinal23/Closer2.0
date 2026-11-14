import type { Lesson } from "../lesson/types";

/* Everyday Faith: "The Message You Didn't Send". Anger, and what to do with it.
   Variation: you draft a reply in a group chat; the middle uses a Not/But on anger itself (Ephesians 4:26
   doesn't call all anger sin). Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const jab = "Classic. Always late, always an excuse.";

export const everydayMessage = {
  id: "everyday-message",
  title: "The Message You Didn’t Send",
  subtitle: "Anger, and the reply you almost sent",
  kind: "Everyday faith",
  scripture: "James 1:19–20 · Ephesians 4:26",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "cheeky" },
      lines: [
        { say: "You were twenty minutes late to dinner. Traffic. You apologised.", mood: "thinking" },
        { say: "Later, in the group chat, Sam posts this. Everyone can see it.", mood: "surprised", act: "shake" },
        { say: "Your thumbs are already moving.", mood: "cheeky", act: "stare" },
      ],
      display: { text: "The Message You Didn’t Send", sub: "Everyday faith · 5 min" },
      reply: "Open the chat",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Sam", role: "The group chat" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: jab,
          choices: [
            { text: "At least I show up. Unlike some people.", to: "fire", page: { mood: "surprised" } },
            { text: "Wow. Thanks.", to: "cold", page: { mood: "thinking" } },
            { text: "(Say nothing, and stew about it all night.)", to: "stew", page: { mood: "tender" } },
          ],
        },
        fire: { says: "Whoa. It was a joke. Relax.", tone: "awkward", choices: [
          { text: "It didn’t feel like one.", to: "fire2", page: { mood: "thinking" } },
          { text: "Whatever.", to: "fire3", page: { mood: "tender" } },
        ] },
        fire2: { says: "…okay. Didn’t mean it like that.", tone: "hurt" },
        fire3: { says: "(Nobody posts anything else for an hour.)", tone: "awkward" },
        cold: { says: "lol come on, you know I’m kidding", tone: "neutral", choices: [
          { text: "Sure.", to: "cold2", page: { mood: "tender" } },
          { text: "It stung a bit, honestly.", to: "cold3", page: { mood: "moved" } },
        ] },
        cold2: { says: "(Thumbs up emoji.)", tone: "neutral" },
        cold3: { says: "Oh. Sorry. That wasn’t fair.", tone: "warm" },
        stew: { says: "(Two hours later, you’re still replaying it in your head.)", tone: "hurt" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "cheeky", act: "hop" },
      before: [{ say: "Pause. Before you hit send on anything.", mood: "cheeky", act: "stare" }],
      prompt: "What’s going on inside?",
      options: [
        { text: "Angry.", reply: "That makes sense. It was a public jab." },
        { text: "Embarrassed.", reply: "In front of everyone. That stings in its own way." },
        { text: "Hurt.", reply: "Underneath anger there’s often hurt. Worth noticing." },
        { text: "Want to get even.", reply: "Honest. That urge is very human. Let’s look at it." },
      ],
      many: "A tangle of a few. That’s usually what anger is.",
      after: [{ say: "Here’s some old, very practical wisdom.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "So, then, my beloved brothers, let every man be swift to hear, slow to speak, and slow to anger;", ref: "James 1:19", translation: WEB },
      target: "slow to speak",
      before: [{ say: "Find the bit that applies to your thumbs.", show: "verse", mood: "cheeky", act: "tilt" }],
      prompt: "Mark it, or tap it",
      after: [
        { say: "Slow to speak. Or type.", at: "top", mood: "cheeky", act: "nod" },
        { say: "James adds why: the anger of man doesn’t produce the righteousness of God.", mood: "thinking" },
      ],
    },
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "But is being angry itself wrong?", mood: "curious", act: "tilt" },
        { say: "Paul quotes a psalm: “Be angry, and don’t sin.” Then: don’t let the sun go down on your wrath.", show: "not", mood: "thinking" },
      ],
      not: "Feeling angry means I’ve already failed.",
      but: "I can feel angry, and still choose what I do next.",
      prompt: "Drag the truer one into place, or tap it",
      after: [
        { say: "Anger is a signal. Sending the message is a choice.", mood: "moved", act: "nod" },
        { say: "Here’s the heart of it.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "Be angry, and don’t sin. Don’t let the sun go down on your wrath.",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Let’s rewind. Same message. Take a breath first.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Sam", role: "The group chat" },
      replay: "first",
      replayLabel: "The first time, you went with:",
      start: "open",
      nodes: {
        open: {
          says: jab,
          choices: [
            { text: "(Wait an hour, then message Sam privately.) That comment stung. Can we talk?", to: "a", page: { mood: "moved" } },
            { text: "Ha, fair. Traffic was brutal. Sorry again, everyone.", to: "b", page: { mood: "happy" } },
            { text: "(Pray about it, and let it go.)", to: "c", page: { mood: "moved" } },
          ],
        },
        a: { says: "Oh man. Sorry. I didn’t think. That was a cheap shot.", tone: "warm" },
        b: { says: "All good! Glad you made it.", tone: "warm" },
        c: { says: "(The next morning, it’s smaller. You find you’re not carrying it anymore.)", tone: "warm" },
      },
      after: [{ say: "Different paths. None of them was the angry reply you almost sent.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Message You Didn’t Send",
      lines: [{ say: "One small step.", mood: "happy" }],
      check: {
        prompt: "What could help next time you’re angry?",
        options: [
          { text: "Wait before replying.", reply: "Even ten minutes changes a lot.", mood: "happy", act: "nod" },
          { text: "Talk privately, not publicly.", reply: "Much more likely to end in peace.", mood: "moved", act: "nod" },
          { text: "Pray before I type.", reply: "A short “help” is a real prayer.", mood: "moved", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Is there a message you need to not send, or one you need to send?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Slow to speak.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Anger is a signal, not a sin in itself.",
        "Scripture says be slow to speak, and don’t let anger settle in overnight.",
        "You can feel it fully, and still choose the reply that builds peace.",
      ],
      verse: { text: "“Be angry, and don’t sin.” Don’t let the sun go down on your wrath,", ref: "Ephesians 4:26", translation: WEB },
      refs: ["James 1:19–20", "Ephesians 4:26"],
      related: [{ title: "The Argument at Dinner", sub: "Everyday faith · 5 min", lessonId: "everyday-dinner" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
