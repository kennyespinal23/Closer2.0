import type { Lesson } from "../lesson/types";

/* Everyday Faith: "They Got the Promotion". Jealousy, disappointment, and celebrating others.
   Shape: live the moment (branching conversation) → pause and name the feelings → Scripture → hold two
   feelings together → replay the same moment → one small action. Your first reply is remembered and shown
   on the replay. No choice is graded; the coworker simply responds.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const opener = "Hey! Did you hear the news?";

export const everydayPromotion = {
  id: "everyday-promotion",
  title: "They Got the Promotion",
  subtitle: "Jealousy, and celebrating someone else",
  kind: "Everyday faith",
  scripture: "Romans 12:15 · Philippians 2:3–4",
  minutes: 5,
  theme: "olive",
  blocks: [
    // 1. The setup
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "You’ve been working toward a promotion for months.", mood: "happy" },
        { say: "But today, your manager gives it to someone else.", mood: "surprised", act: "shake" },
        { say: "Now they’re walking over to talk to you.", mood: "cheeky", act: "stare" },
      ],
      display: { text: "They Got the Promotion", sub: "Everyday faith · 5 min" },
      reply: "Here they come",
    },
    // 2. Your first response (LifeScenario + DialogueChoice)
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Jordan", role: "Got the promotion" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: opener,
          choices: [
            { text: "Yeah! Congratulations!", to: "cheer", page: { mood: "happy" } },
            { text: "Yeah, I heard.", to: "flat", page: { mood: "thinking" } },
            { text: "Honestly, I was hoping I’d get it.", to: "honest", page: { mood: "surprised" } },
          ],
        },
        cheer: {
          says: "Thanks! I was nervous you’d be upset. I know you wanted it too.",
          tone: "warm",
          choices: [
            { text: "I did. But you earned it.", to: "cheerWarm", page: { mood: "happy" } },
            { text: "It’s fine.", to: "cheerShort", page: { mood: "thinking" } },
          ],
        },
        cheerWarm: { says: "That means a lot. Coffee’s on me this week.", tone: "warm" },
        cheerShort: { says: "Oh. Okay… well, thanks.", tone: "awkward" },
        flat: {
          says: "Oh… right. Are we okay?",
          tone: "awkward",
          choices: [
            { text: "Yeah, of course.", to: "flatFine", page: { mood: "thinking" } },
            { text: "I just need a minute.", to: "flatMinute", page: { mood: "tender" } },
          ],
        },
        flatFine: { says: "Okay. Good. I really didn’t want this to be weird.", tone: "neutral" },
        flatMinute: { says: "Totally fair. Take whatever time you need.", tone: "warm" },
        honest: {
          says: "I know. I’d feel the same. I’m sorry it couldn’t be both of us.",
          tone: "warm",
          choices: [
            { text: "Thanks for saying that.", to: "honestThanks", page: { mood: "moved" } },
            { text: "Yeah, well. It is what it is.", to: "honestCold", page: { mood: "tender" } },
          ],
        },
        honestThanks: { says: "Of course. You’re really good at this, you know.", tone: "warm" },
        honestCold: { says: "Yeah… okay.", tone: "hurt" },
      },
    },
    // 3. Pause the moment (EmotionalCheckIn)
    {
      kind: "feelings",
      page: { at: "top", mood: "cheeky", act: "hop" },
      before: [{ say: "Okay, can we talk about that for a second?", mood: "cheeky", act: "stare" }],
      prompt: "What would you actually be feeling?",
      options: [
        { text: "Jealous.", reply: "That’s honest. Most people feel a pang of that. It doesn’t make you a bad person." },
        { text: "Disappointed.", reply: "Of course. You worked for months. Disappointment makes sense." },
        { text: "Angry.", reply: "Anger often means something mattered to you. That’s worth noticing." },
        { text: "Happy for them, but sad for myself.", reply: "Two things at once. Hold onto that. We’ll come back to it." },
      ],
      many: "More than one at once. That’s how feelings usually work. Nothing wrong with any of them.",
      after: [{ say: "Let’s see what Scripture says about moments like this.", at: "top", mood: "thinking" }],
    },
    // 4. Scripture (ScriptureDiscovery)
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "Rejoice with those who rejoice. Weep with those who weep.", ref: "Romans 12:15", translation: WEB },
      target: "Rejoice with those who rejoice",
      before: [{ say: "Paul wrote this to a church full of ordinary people.", show: "verse", mood: "thinking" }],
      prompt: "Mark the first instruction, or tap it",
      after: [
        { say: "Celebrate when they celebrate.", at: "top", mood: "happy", act: "nod" },
        { say: "And notice the other half: weep with those who weep. Your sadness counts too.", mood: "moved" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Paul says something similar in another letter.", show: "verse", mood: "curious", open: true }],
      verse: {
        text: "doing nothing through rivalry or through conceit, but in humility, each counting others better than himself; each of you not just looking to his own things, but each of you also to the things of others.",
        ref: "Philippians 2:3–4",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "not just looking to his own things", label: "Your things", note: "Not just. He doesn’t say ignore your own." },
        { phrase: "also to the things of others", label: "Their things too", note: "Also. Their good matters to you too." },
      ],
      after: [
        { say: "Love doesn’t mean pretending you’re not disappointed.", at: "top", mood: "moved", open: false },
        { say: "A pang of jealousy is human. Scripture warns against letting rivalry drive us.", mood: "thinking" },
        { say: "So the question isn’t what you feel first. It’s what you do with it.", mood: "thinking", act: "nod" },
      ],
    },
    // 5. A different perspective (PerspectiveShift)
    {
      kind: "both",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Could you be disappointed for yourself and still be happy for someone else?", mood: "curious", act: "tilt" }],
      a: "I’m disappointed.",
      b: "I’m happy for them.",
      joined: "I’m disappointed, *and* I’m happy for them.",
      prompt: "Drag one onto the other, or press the button",
      after: [
        { say: "Both can be true at once.", mood: "happy", act: "hop" },
        { say: "You don’t have to choose between honesty and kindness.", mood: "moved", act: "nod" },
      ],
    },
    // 6. Replay the conversation (ScenarioReplay)
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Let’s go back to that moment. Same question. You know a bit more now.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Jordan", role: "Got the promotion" },
      replay: "first",
      start: "open",
      nodes: {
        open: {
          says: opener,
          choices: [
            { text: "Congratulations! I know how hard you worked.", to: "a", page: { mood: "happy" } },
            { text: "I’m still processing the news, but I’m happy for you.", to: "b", page: { mood: "moved" } },
            { text: "I was hoping for it too, so give me a day. But well done.", to: "c", page: { mood: "moved" } },
            { text: "Can we talk later? I need a minute.", to: "d", page: { mood: "tender" } },
          ],
        },
        a: { says: "Thank you. That really means a lot, coming from you.", tone: "warm" },
        b: { says: "That’s really honest. Thank you. Take all the time you need.", tone: "warm" },
        c: { says: "Fair enough. Thanks for being straight with me. It means a lot.", tone: "warm" },
        d: { says: "Of course. No rush at all.", tone: "neutral" },
      },
      after: [{ say: "There wasn’t one magic sentence. Honest and kind can sound a lot of ways.", at: "top", mood: "moved", act: "nod" }],
    },
    // 7. Take it into today (PracticalAction)
    {
      kind: "journal",
      page: { at: "center", mood: "happy", act: "settle" },
      ref: "They Got the Promotion",
      lines: [{ say: "One last thing.", mood: "happy" }],
      check: {
        prompt: "What’s one small way you could celebrate someone else this week?",
        options: [
          { text: "Send an encouraging message.", reply: "Short and sincere works. It doesn’t have to be a speech.", mood: "happy", act: "nod" },
          { text: "Congratulate someone sincerely.", reply: "Out loud, and meant. That’s rejoicing with them.", mood: "happy", act: "hop" },
          { text: "Pray for someone I compare myself to.", reply: "That one changes you. It’s hard to resent someone you’re praying for.", mood: "moved", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Who comes to mind?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    // 8. Completion (EverydayFaithComplete)
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "You can hold both.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Feeling jealous or disappointed is human. What you do next is the choice.",
        "Scripture calls us to rejoice with others, and makes room to weep too.",
        "You can acknowledge your own disappointment while choosing to treat someone else with love.",
      ],
      verse: { text: "Rejoice with those who rejoice. Weep with those who weep.", ref: "Romans 12:15", translation: WEB },
      refs: ["Romans 12:15", "Philippians 2:3–4"],
      related: [
        { title: "Everyone Else Is Ahead", sub: "Everyday faith · 5 min", lessonId: "everyday-ahead" },
        { title: "The King Who Washed Feet", sub: "Jesus only · John 13", lessonId: "jesus-washed-feet" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
