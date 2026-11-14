import type { Lesson } from "../lesson/types";

/* Big Question: Why doesn't God answer every prayer?
   Paul's "thorn" prayer got "my grace is sufficient" (2 Corinthians 12:8-9); Jesus prayed "not what I
   desire, but what you desire" (Matthew 26:39). Perspectives (no / not yet, motives, persistence) come with
   a caveat: none explains every unanswered prayer, and a "no" is not proof you prayed wrong.
   Scripture is the World English Bible, word for word; "…" marks a quote that stops mid-verse. */

const WEB = "World English Bible";

export const unansweredPrayer = {
  id: "unanswered-prayer",
  title: "Why doesn’t God answer every prayer?",
  subtitle: "Paul, Jesus, and the answer no",
  kind: "Big question",
  scripture: "2 Corinthians 12 · Matthew 26",
  minutes: 6,
  theme: "teal",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "Can I ask you something real?", mood: "thinking" },
        { say: "Have you ever prayed for something, and it just… didn’t happen?", mood: "tender", act: "settle" },
        { say: "People have wrestled with that for as long as they’ve prayed.", mood: "thinking", act: "nod" },
      ],
      display: { text: "Why doesn’t God answer every prayer?", sub: "Big question · World English Bible" },
      reply: "Let’s explore",
    },
    {
      kind: "ask",
      page: { at: "left", mood: "thinking", act: "tilt" },
      prompt: "What’s hardest about it for you?",
      options: [
        { text: "I prayed for something good.", reply: "That’s the hardest kind. It wasn’t a selfish prayer, and it still didn’t happen.", mood: "tender", act: "nod" },
        { text: "It feels like no one’s listening.", reply: "Silence is hard. The Bible is full of people who felt exactly that.", mood: "tender", act: "settle" },
        { text: "Other people’s prayers seem to work.", reply: "That comparison can really sting. It’s an honest thing to notice.", mood: "thinking", act: "tilt" },
      ],
      after: [{ say: "Let’s look at someone in the Bible whose prayer got a no.", at: "top", mood: "thinking" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Paul had something he called a “thorn in the flesh”.", mood: "thinking", open: true },
        { say: "We don’t know exactly what it was. But he wanted it gone.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "Concerning this thing, I begged the Lord three times that it might depart from me. He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.”",
        ref: "2 Corinthians 12:8–9",
        translation: WEB,
      },
      hint: "Tap what Paul asked, and what he heard",
      visual: "shift",
      links: [
        { phrase: "I begged the Lord three times", label: "Paul asked", note: "Three times. He really meant it." },
        { phrase: "My grace is sufficient for you", label: "God answered", note: "The answer wasn’t yes. It was “my grace is enough.”" },
      ],
      after: [
        { say: "Paul’s prayer was heard. The answer just wasn’t the one he asked for.", at: "top", mood: "thinking", open: false },
        { say: "And he found God’s strength in the very thing he wanted gone.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "tender" },
      verse: { text: "“My Father, if it is possible, let this cup pass away from me; nevertheless, not what I desire, but what you desire.”", ref: "Matthew 26:39", translation: WEB },
      target: "not what I desire, but what you desire",
      before: [
        { say: "Jesus prayed for something to be taken away, too. The night before he died.", mood: "tender", open: true },
        { say: "Look at how he ends his prayer.", show: "verse", mood: "thinking", act: "tilt", open: false },
      ],
      prompt: "Mark how Jesus ends it, or tap it",
      after: [
        { say: "He asked honestly. Then he trusted his Father with the answer.", at: "top", mood: "moved" },
        { say: "Prayer isn’t only getting what we ask for. It’s bringing it all to God.", mood: "thinking", act: "nod" },
      ],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Christians have a few ways of thinking about this.", mood: "thinking" },
        { say: "Open each one.", mood: "curious" },
      ],
      cards: [
        {
          title: "Sometimes it’s no, or not yet",
          say: "Sometimes the answer is no, or not yet.",
          body: "God may see what we can’t, the way a good parent does. A no isn’t the same as not listening.",
          verse: { text: "For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.", ref: "Isaiah 55:9", translation: WEB },
        },
        {
          title: "Our reasons matter",
          say: "Sometimes what we ask for isn’t good for us.",
          body: "James says some prayers go unanswered because of why we’re asking. Worth checking, but it doesn’t explain every unanswered prayer.",
          verse: { text: "You ask, and don’t receive, because you ask with wrong motives, so that you may spend it on your pleasures.", ref: "James 4:3", translation: WEB },
        },
        {
          title: "Keep praying anyway",
          say: "And Jesus told people not to give up.",
          body: "Jesus told a story about a persistent widow so people would keep praying. Unanswered doesn’t mean pointless.",
          verse: { text: "He also spoke a parable to them that they must always pray, and not give up…", ref: "Luke 18:1", translation: WEB },
        },
      ],
      caveat: "None of these explains every unanswered prayer. A no isn’t proof you prayed wrong, or that God doesn’t care.",
      after: [{ say: "Notice what none of these says: that God stopped listening.", at: "top", mood: "thinking", act: "nod" }],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what can we hold onto?", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "What Scripture teaches",
        items: [
          { text: "God hears his people", ref: "Psalm 34:17" },
          { text: "We can bring him anything", ref: "Philippians 4:6" },
          { text: "His peace can guard us, even without answers", ref: "Philippians 4:7" },
        ],
      },
      unknown: {
        label: "What Scripture doesn’t explain",
        items: [{ text: "Why a particular prayer got the answer it did", ref: "Isaiah 55:8" }],
      },
      after: [
        { say: "We can always ask.", mood: "happy", act: "nod" },
        { say: "We don’t always get to know why the answer was what it was.", mood: "tender" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Why doesn’t God answer every prayer?",
      lines: [{ say: "Thanks for thinking this through with me.", mood: "tender" }],
      check: {
        prompt: "Did this help you see the question differently?",
        options: [
          { text: "A little.", reply: "That’s plenty for today. This kind of thing settles in slowly.", mood: "moved", act: "nod" },
          { text: "I still have questions.", reply: "Keep asking them. Paul asked three times, and God didn’t turn him away.", mood: "thinking", act: "tilt" },
          { text: "I’d like to explore more.", reply: "Let’s keep going. I’ll point you somewhere at the end.", mood: "happy", act: "hop" },
        ],
      },
      ask: "What have you been praying for?",
      write: "Write a thought",
      prayer: {
        label: "Pray a short prayer",
        text: "God, you know what I’ve been asking for. Help me keep bringing it to you, and help me trust you with the answer.",
      },
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we explored.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Paul, and even Jesus, prayed prayers that weren’t answered the way they asked.",
        "A no, or a not yet, isn’t the same as not being heard.",
        "We can keep bringing everything to God.",
      ],
      refs: ["2 Corinthians 12:8–9", "Matthew 26:39", "Isaiah 55:9", "James 4:3", "Luke 18:1", "Philippians 4:6–7"],
      related: [
        { title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", lessonId: "god-far-away" },
        { title: "Why does God allow suffering?", sub: "Big question · 6 min", lessonId: "why-suffering" },
        { title: "Romans 8:28", sub: "Verse study · 5 min", lessonId: "romans-8-28" },
      ],
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
