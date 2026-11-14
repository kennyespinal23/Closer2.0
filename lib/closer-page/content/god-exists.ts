import type { Lesson } from "../lesson/types";

/* Big Question: How can we know God exists?
   Offered as reasons, not proofs: creation (Psalm 19:1, Romans 1:20), Jesus in history (1 Corinthians 15:6),
   changed lives (John 9:25). The caveat says none of them forces belief and people weigh them differently.
   God wants to be found and isn't far (Acts 17:27, Jeremiah 29:13); doubt is met kindly (John 20:27).
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const godExists = {
  id: "god-exists",
  title: "How can we know God exists?",
  subtitle: "Reasons, not a formula",
  kind: "Big question",
  scripture: "Acts 17 · Psalm 19 · 1 Corinthians 15",
  minutes: 6,
  theme: "teal",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [
        { say: "Okay. This is a big one.", mood: "excited" },
        { say: "How can anyone know God is real?", mood: "curious", act: "tilt" },
        { say: "Thoughtful people have asked this forever. Let’s think it through.", mood: "thinking", act: "nod" },
      ],
      display: { text: "How can we know God exists?", sub: "Big question · World English Bible" },
      reply: "Let’s explore",
    },
    {
      kind: "ask",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "What’s behind the question for you?",
      options: [
        { text: "I want to be more sure.", reply: "That’s a good thing to want. Faith isn’t afraid of questions.", mood: "happy", act: "nod" },
        { text: "I’ve had real doubts.", reply: "Thanks for saying so. Doubt isn’t the opposite of faith. Even Jesus’ friends had it.", mood: "tender", act: "settle" },
        { text: "Someone asked me and I froze.", reply: "Ha, it happens. Let’s look at a few things you could talk about.", mood: "cheeky", act: "stare" },
      ],
      after: [{ say: "Let’s start with what Paul told a crowd of thinkers in Athens.", at: "top", mood: "curious" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Paul once spoke to philosophers in Athens.", mood: "curious", open: true },
        { say: "He said God made people to look for him.", show: "verse", mood: "thinking" },
      ],
      verse: { text: "that they should seek the Lord, if perhaps they might reach out for him and find him, though he is not far from each one of us.", ref: "Acts 17:27", translation: WEB },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "seek the Lord", label: "Seek him", note: "God wants people to look for him." },
        { phrase: "he is not far from each one of us", label: "He’s near", note: "And he isn’t hiding far away." },
      ],
      after: [
        { say: "Not far from each one of us.", at: "top", mood: "moved", open: false },
        { say: "That’s pretty much our tagline, by the way.", mood: "cheeky", act: "stare" },
      ],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "excited" },
      verse: { text: "The heavens declare the glory of God. The expanse shows his handiwork.", ref: "Psalm 19:1", translation: WEB },
      before: [
        { say: "The Bible often points to the world itself first.", mood: "curious" },
        { say: "Look up for a second.", show: "verse", open: true, mood: "excited" },
        { say: "Read it slowly.", mood: "happy", open: false },
      ],
      prompt: "Swipe across the words",
      after: [
        { say: "The world looks made. A lot of people find that a strong clue.", mood: "thinking" },
        { say: "Paul says something similar in his letter to the Romans.", mood: "curious", act: "nod" },
      ],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Christians usually point to a few kinds of reasons.", mood: "thinking" },
        { say: "Open each one.", mood: "curious" },
      ],
      cards: [
        {
          title: "Creation points beyond itself",
          say: "A universe this ordered makes a lot of people wonder who’s behind it.",
          body: "Why is there something rather than nothing? Why does the universe follow laws? Many find a Creator the best explanation.",
          verse: { text: "For the invisible things of him since the creation of the world are clearly seen, being perceived through the things that are made, even his everlasting power and divinity; that they may be without excuse.", ref: "Romans 1:20", translation: WEB },
        },
        {
          title: "Jesus in history",
          say: "Christianity makes claims you can actually look into.",
          body: "Paul lists people who saw Jesus alive after his death, and says most were still around. People you could go and ask.",
          verse: { text: "Then he appeared to over five hundred brothers at once, most of whom remain until now, but some have also fallen asleep.", ref: "1 Corinthians 15:6", translation: WEB },
        },
        {
          title: "Changed lives",
          say: "And then there’s what people experience.",
          body: "A man Jesus healed couldn’t answer every question. He just knew what had happened to him. Experience isn’t proof for everyone, but it counts.",
          verse: { text: "“I don’t know if he is a sinner. One thing I do know: that though I was blind, now I see.”", ref: "John 9:25", translation: WEB },
        },
      ],
      caveat: "None of these forces anyone to believe. Thoughtful people weigh them differently, and Christians say faith also involves trust, not argument alone.",
      after: [{ say: "Put together, they’re reasons. Not a formula.", at: "top", mood: "thinking", act: "nod" }],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what does Scripture actually promise here?", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "What Scripture teaches",
        items: [
          { text: "God wants to be found", ref: "Jeremiah 29:13" },
          { text: "Creation points to him", ref: "Psalm 19:1" },
          { text: "Honest doubts are met, not punished", ref: "John 20:27" },
        ],
      },
      unknown: {
        label: "What Scripture doesn’t give",
        items: [{ text: "A proof that removes the need for faith", ref: "Hebrews 11:6" }],
      },
      after: [
        { say: "Even Thomas, who doubted, got invited closer. Jesus didn’t send him away.", mood: "moved", act: "nod" },
        { say: "Faith isn’t believing with no reasons. It’s trusting, with reasons, without having every answer.", mood: "thinking" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "How can we know God exists?",
      lines: [{ say: "Thanks for thinking this through with me.", mood: "happy" }],
      check: {
        prompt: "Did this help you see the question differently?",
        options: [
          { text: "A little.", reply: "That’s great. Questions like this are worth coming back to.", mood: "happy", act: "nod" },
          { text: "I still have questions.", reply: "Good. Keep looking. God says those who seek him find him.", mood: "thinking", act: "tilt" },
          { text: "I’d like to explore more.", reply: "Let’s keep going. I’ll point you somewhere at the end.", mood: "excited", act: "hop" },
        ],
      },
      ask: "What would help you take a next step?",
      write: "Write a thought",
      prayer: {
        label: "Pray a short prayer",
        text: "God, help me see you more clearly. Meet me in my questions, and help me find you.",
      },
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "What we explored.",
      body: "The Lord is always closer than you think.",
      summary: [
        "God wants to be found, and isn’t far from any of us.",
        "Creation, history and changed lives are real reasons people believe.",
        "Faith is trust with reasons, not a leap with none.",
      ],
      refs: ["Acts 17:27", "Psalm 19:1", "Romans 1:20", "1 Corinthians 15:6", "John 9:25", "Jeremiah 29:13"],
      related: [
        { title: "Lazarus", sub: "Character study · John 11", lessonId: "lazarus" },
        { title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", lessonId: "god-far-away" },
        { title: "The storm", sub: "Bible story · Mark 4", lessonId: "storm" },
      ],
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
