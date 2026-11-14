import type { Lesson } from "../lesson/types";

/* Everyday Faith: "Just One More Lie". Honesty under pressure.
   Variation: the conversation branches deeper (a lie needs another lie to hold it up), and the middle is a
   perspectives block on why small lies grow. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const ask = "Quick one: did you send the client report on Friday like we said?";

export const everydayLie = {
  id: "everyday-lie",
  title: "Just One More Lie",
  subtitle: "Honesty when the truth is awkward",
  kind: "Everyday faith",
  scripture: "Ephesians 4:25 · Proverbs 12:22",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "cheeky" },
      lines: [
        { say: "You were supposed to send a report on Friday.", mood: "thinking" },
        { say: "You didn’t. It’s half done, sitting in your drafts.", mood: "cheeky", act: "stare" },
        { say: "Your manager stops by your desk.", mood: "surprised", act: "hop" },
      ],
      display: { text: "Just One More Lie", sub: "Everyday faith · 5 min" },
      reply: "Look up",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Mark", role: "Your manager" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: ask,
          choices: [
            { text: "Yep, sent it Friday.", to: "lie", page: { mood: "surprised" } },
            { text: "It’s… nearly there.", to: "dodge", page: { mood: "thinking" } },
            { text: "No, I didn’t. I’m sorry. It’s half done.", to: "truth", page: { mood: "moved" } },
          ],
        },
        lie: { says: "Great. They say they haven’t got it. Can you forward it to me?", tone: "neutral", choices: [
          { text: "Must have bounced. I’ll resend it.", to: "lie2", page: { mood: "surprised", act: "shake" } },
          { text: "Actually… I didn’t send it. Sorry.", to: "lie3", page: { mood: "moved" } },
        ] },
        lie2: { says: "Okay, send it now please, I’ll watch for it.", tone: "awkward" },
        lie3: { says: "Okay. I appreciate you telling me. When can it be ready?", tone: "neutral" },
        dodge: { says: "So, not sent? I need a straight answer, they’re asking.", tone: "awkward", choices: [
          { text: "Not sent, no. Sorry.", to: "lie3", page: { mood: "moved" } },
        ] },
        truth: { says: "Thanks for being straight. Can you get it out by two?", tone: "warm" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Freeze frame. What’s pulling at you?", mood: "curious", act: "tilt" }],
      prompt: "What makes a small lie tempting?",
      options: [
        { text: "Fear of looking bad.", reply: "Very real. Nobody likes being caught short." },
        { text: "It’s easier.", reply: "In the moment, yes. Let’s see if it stays that way." },
        { text: "Everyone does it.", reply: "Often true. Still worth asking if it’s good." },
        { text: "I don’t want to let anyone down.", reply: "That comes from caring. Honesty can honour that too." },
      ],
      many: "A few reasons at once. Pressure works like that.",
      after: [{ say: "Here’s what Scripture says about truth.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "Therefore putting away falsehood, speak truth each one with his neighbor. For we are members of one another.", ref: "Ephesians 4:25", translation: WEB },
      target: "speak truth each one with his neighbor",
      before: [{ say: "Look at the reason Paul gives at the end, too.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark the instruction, or tap it",
      after: [
        { say: "We are members of one another.", at: "top", mood: "moved" },
        { say: "Lies don’t just bend facts. They wear down trust between people.", mood: "thinking", act: "nod" },
      ],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Why do small lies matter? Open each one.", mood: "thinking" }],
      cards: [
        { title: "Lies need more lies", say: "One lie usually needs another to hold it up.", body: "One “I sent it” can quickly need an “it must have bounced”, and then another.", verse: { text: "Lying lips are an abomination to Yahweh, but those who do the truth are his delight.", ref: "Proverbs 12:22", translation: WEB } },
        { title: "Truth builds trust", say: "Honesty, even when it’s awkward, makes you someone people can rely on.", body: "Admitting a mistake costs a little now and earns a lot of trust later.", verse: { text: "Therefore putting away falsehood, speak truth each one with his neighbor. For we are members of one another.", ref: "Ephesians 4:25", translation: WEB } },
        { title: "Simple words", say: "Jesus said to keep your words simple.", body: "Yes means yes. No means no. No spin needed.", verse: { text: "But let your ‘Yes’ be ‘Yes’ and your ‘No’ be ‘No.’ Whatever is more than these is of the evil one.", ref: "Matthew 5:37", translation: WEB } },
      ],
      caveat: "Honesty isn’t the same as harshness. You can tell the truth kindly, and own your part without over-explaining.",
      after: [{ say: "Let’s go back to Mark.", at: "top", mood: "happy" }],
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      person: { name: "Mark", role: "Your manager" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: ask,
          choices: [
            { text: "No, I didn’t, and I should have told you Friday. It’s half done. I can finish it by two.", to: "a", page: { mood: "moved" } },
            { text: "Not yet, sorry. I got stuck on the numbers. Could you look at them with me?", to: "b", page: { mood: "happy" } },
          ],
        },
        a: { says: "Thanks for owning it. Two works. Just give me a heads-up next time.", tone: "warm" },
        b: { says: "Sure, let’s look now. Better than you struggling alone.", tone: "warm" },
      },
      after: [{ say: "Awkward for ten seconds. Then it’s over. That’s the gift of the truth.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Just One More Lie",
      lines: [{ say: "One small step.", mood: "happy" }],
      check: {
        prompt: "Where could honesty be hard for you this week?",
        options: [
          { text: "At work.", reply: "Small truths there build a lot of trust.", mood: "happy", act: "nod" },
          { text: "With family.", reply: "Truth told kindly is a gift there.", mood: "moved", act: "nod" },
          { text: "With myself.", reply: "That’s often where it starts. Good one to notice.", mood: "moved", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Is there something you need to come clean about?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Speak the truth.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Small lies usually need more lies to hold them up.",
        "Scripture calls us to speak truth, because we belong to one another.",
        "Honesty can be kind, and it’s freeing.",
      ],
      verse: { text: "Therefore putting away falsehood, speak truth each one with his neighbor. For we are members of one another.", ref: "Ephesians 4:25", translation: WEB },
      refs: ["Ephesians 4:25", "Proverbs 12:22", "Matthew 5:37"],
      related: [{ title: "The Message You Didn’t Send", sub: "Everyday faith · 5 min", lessonId: "everyday-message" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
