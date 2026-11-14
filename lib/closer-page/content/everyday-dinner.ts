import type { Lesson } from "../lesson/types";

/* Everyday Faith: "The Argument at Dinner". Patience with family.
   Variation: the conversation escalates or calms depending on your tone (Proverbs 15:1 played out), then a
   Not/But on patience. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const jab = "You never call unless you need something.";

export const everydayDinner = {
  id: "everyday-dinner",
  title: "The Argument at Dinner",
  subtitle: "Patience with the people closest to you",
  kind: "Everyday faith",
  scripture: "Proverbs 15:1 · Colossians 3:12–13",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "cheeky" },
      lines: [
        { say: "Family dinner. Everyone’s finally around one table.", mood: "happy" },
        { say: "You mention you might need help moving next month.", mood: "thinking" },
        { say: "Your dad puts his fork down.", mood: "surprised", act: "shake" },
      ],
      display: { text: "The Argument at Dinner", sub: "Everyday faith · 5 min" },
      reply: "Uh oh",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Dad", role: "Across the table" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: jab,
          choices: [
            { text: "That’s not fair, and you know it.", to: "hot", page: { mood: "surprised" } },
            { text: "Wow. Okay. Forget I asked.", to: "cold", page: { mood: "tender" } },
            { text: "Ouch. Is that really how it feels to you?", to: "soft", page: { mood: "moved" } },
          ],
        },
        hot: { says: "Isn’t it? When did you last call just to talk?", tone: "awkward", choices: [
          { text: "Here we go again.", to: "hot2", page: { mood: "tender", act: "shake" } },
          { text: "…Okay. Maybe not for a while.", to: "soft2", page: { mood: "moved" } },
        ] },
        hot2: { says: "(Mum changes the subject. Nobody enjoys the rest of dinner.)", tone: "hurt" },
        cold: { says: "(Silence. Someone passes the potatoes very carefully.)", tone: "awkward" },
        soft: { says: "…Sometimes. I miss hearing from you, that’s all.", tone: "warm", choices: [
          { text: "I didn’t realise. I’m sorry, Dad.", to: "soft2", page: { mood: "moved" } },
        ] },
        soft2: { says: "Well. I’d help you move anyway, you know.", tone: "warm" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Freeze. Before the potatoes go flying.", mood: "cheeky", act: "stare" }],
      prompt: "What are you feeling at that table?",
      options: [
        { text: "Defensive.", reply: "Of course. It felt like an accusation." },
        { text: "Hurt.", reply: "Family words land deeper than most." },
        { text: "Guilty.", reply: "Maybe there’s a little truth in it. That stings." },
        { text: "Tired of this same fight.", reply: "Old arguments wear us out. Very real." },
      ],
      many: "A few at once. Family is like that.",
      after: [{ say: "Here’s a proverb you just watched play out.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "A gentle answer turns away wrath, but a harsh word stirs up anger.", ref: "Proverbs 15:1", translation: WEB },
      target: "A gentle answer turns away wrath",
      before: [{ say: "Remember how the conversation went? Look at this.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark the first half, or tap it",
      after: [
        { say: "Harsh words stirred it up. Gentle ones cooled it down.", at: "top", mood: "thinking", act: "nod" },
        { say: "Gentle doesn’t mean agreeing. It means not adding fuel.", mood: "moved" },
      ],
    },
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "So what does patience with family look like?", show: "not", mood: "thinking" }],
      not: "Patience means never saying how I feel.",
      but: "Patience means answering gently, even when I disagree.",
      prompt: "Drag the truer one into place, or tap it",
      after: [
        { say: "Paul describes what to “put on”, like clothes.", mood: "thinking" },
        { say: "Here it is.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "“…a heart of compassion, kindness, lowliness, humility, and perseverance; bearing with one another…” (Colossians 3:12–13)",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Back to the table. Same words from Dad.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Dad", role: "Across the table" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: jab,
          choices: [
            { text: "That stings, but maybe you’re right. I’ll call more. Just to talk.", to: "a", page: { mood: "moved" } },
            { text: "I hear you. Can we talk about it after dinner, just us?", to: "b", page: { mood: "moved" } },
            { text: "I do want to call more. Life’s been a lot. But I miss you too.", to: "c", page: { mood: "moved" } },
          ],
        },
        a: { says: "…I’d like that. And of course I’ll help you move.", tone: "warm" },
        b: { says: "Yeah. Okay. That’s fair.", tone: "warm" },
        c: { says: "I know. I’m proud of you, you know. I just miss you.", tone: "warm" },
      },
      after: [{ say: "Same dad. Same table. A very different dinner.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Argument at Dinner",
      lines: [{ say: "Small step time.", mood: "happy" }],
      check: {
        prompt: "Who in your family could use a little more patience from you?",
        options: [
          { text: "A parent.", reply: "They’re often trying, in their own way.", mood: "moved", act: "nod" },
          { text: "A sibling.", reply: "Old patterns run deep there. Gentleness helps.", mood: "thinking", act: "nod" },
          { text: "A partner or child.", reply: "The people closest get the best and worst of us. Gentle answers help.", mood: "moved", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What’s a gentle answer you could practise?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "A gentle answer.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Family words hit deep, and old arguments wear us out.",
        "A gentle answer cools things down; a harsh word stirs them up.",
        "Patience isn’t silence. It’s answering with kindness.",
      ],
      verse: { text: "A gentle answer turns away wrath, but a harsh word stirs up anger.", ref: "Proverbs 15:1", translation: WEB },
      refs: ["Proverbs 15:1", "Colossians 3:12–13"],
      related: [{ title: "The Apology You’re Waiting For", sub: "Everyday faith · 5 min", lessonId: "everyday-apology" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
