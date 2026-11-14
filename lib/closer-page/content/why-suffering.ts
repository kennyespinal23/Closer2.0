import type { Lesson } from "../lesson/types";

/* Big Question: Why does God allow suffering?
   Not a puzzle with a correct answer: an honest walk through what Scripture says and doesn't say.
   - Job makes room for the question; God answers Job but never tells him why (Job 38-41), and says the
     friends who blamed Job were wrong (42:7). So suffering isn't automatically a punishment.
   - Three perspectives (human choices, a broken world, God bringing good from harm) are offered as help,
     with a plain caveat that none explains every tragedy and Christians differ on parts of this.
   - Jesus wept (John 11:35): Christians read this as God not being indifferent to suffering.
   Page is a guide, not an authority: he says "Christians believe" where it's interpretation.
   Scripture is the World English Bible, word for word; "…" marks a quote that starts or stops mid-verse.
   The prayer is written for the app and is not presented as Scripture. */

const WEB = "World English Bible";

export const whySuffering = {
  id: "why-suffering",
  title: "Why does God allow suffering?",
  subtitle: "An honest look, with Job and Jesus",
  kind: "Big question",
  scripture: "Job · Luke 13 · John 11",
  minutes: 6,
  theme: "teal",
  blocks: [
    // 1. The question (BigQuestionIntro)
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "Can I ask you a hard one?", mood: "thinking" },
        { say: "If God is good, why does he let people suffer?", mood: "tender", act: "settle" },
        { say: "That’s a hard question. People have asked it for thousands of years.", mood: "thinking", act: "nod" },
      ],
      display: { text: "Why does God allow suffering?", sub: "Big question · World English Bible" },
      reply: "Let’s explore",
    },
    // 2. Why it's difficult (PerspectiveChoice)
    {
      kind: "ask",
      page: { at: "left", mood: "thinking", act: "tilt" },
      prompt: "What makes this question so difficult?",
      options: [
        { text: "Good people suffer.", reply: "Yes. It doesn’t seem fair, and the Bible doesn’t pretend it is.", mood: "tender", act: "nod" },
        { text: "God could stop suffering.", reply: "That’s the heart of it. If he can, why doesn’t he? People in the Bible asked that too.", mood: "thinking", act: "tilt" },
        { text: "Sometimes suffering feels meaningless.", reply: "It can. Some pain doesn’t come with a lesson attached. That’s real.", mood: "tender", act: "settle" },
      ],
      after: [{ say: "Whichever one you picked, you’re not the first to wonder.", at: "top", mood: "tender" }],
    },
    // 3. Scripture makes room for questions (ScriptureExploration)
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "There’s a whole book of the Bible about this.", mood: "thinking", open: true },
        { say: "Job. The Bible calls him blameless. He lost his children, his wealth, his health.", mood: "tender" },
        { say: "And he asked God why. Over and over.", show: "verse", mood: "tender" },
      ],
      verse: { text: "Why hide you your face, and hold me for your enemy?", ref: "Job 13:24", translation: WEB },
      hint: "Tap what Job is asking",
      visual: "pair",
      links: [
        { phrase: "Why hide you your face", label: "Where are you?", note: "He feels like God has gone quiet." },
        { phrase: "hold me for your enemy", label: "Are you against me?", note: "He wonders if God has turned against him." },
      ],
      after: [
        { say: "God does answer Job, eventually.", at: "top", mood: "thinking", open: false },
        { say: "But he never tells Job why it all happened.", mood: "tender" },
        { say: "And the friends who said Job must have deserved it?", show: "more", mood: "curious", act: "tilt" },
        { say: "God says they were wrong. Job’s suffering wasn’t a punishment.", mood: "moved", act: "nod" },
        { say: "Job doesn’t hand us a simple answer. It makes room for the question.", mood: "thinking" },
      ],
      more: {
        text: "…for you have not spoken of me the thing that is right, as my servant Job has.",
        ref: "Job 42:7",
        translation: WEB,
      },
    },
    // 4. Different perspectives (TheologicalPerspective)
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Christians have thought about this for a long time.", mood: "thinking" },
        { say: "Here are three ideas from Scripture that help. Open each one.", mood: "curious" },
      ],
      cards: [
        {
          title: "Freedom has consequences",
          say: "Some suffering comes from what people choose to do.",
          body: "People are free to choose, and they can use that freedom to hurt each other. A lot of suffering comes from human choices, often someone else’s.",
          verse: { text: "Where do wars and fightings among you come from? Don’t they come from your pleasures that war in your members?", ref: "James 4:1", translation: WEB },
        },
        {
          title: "The world is broken",
          say: "And some just comes with a world that isn’t the way it should be.",
          body: "Jesus was asked about people killed when a tower fell. His answer: they weren’t worse than anyone else (Luke 13:5). Sickness and disaster aren’t a verdict on the people they hit.",
          verse: { text: "Or those eighteen, on whom the tower in Siloam fell, and killed them; do you think that they were worse offenders than all the men who dwell in Jerusalem?", ref: "Luke 13:4", translation: WEB },
        },
        {
          title: "God can bring good out of it",
          say: "And Christians believe God can bring good even out of the worst things.",
          body: "Joseph’s brothers sold him into slavery. Years later he told them God had used it to save many lives. That doesn’t make the harm good.",
          verse: { text: "As for you, you meant evil against me, but God meant it for good, to bring to pass, as it is today, to save many people alive.", ref: "Genesis 50:20", translation: WEB },
        },
      ],
      caveat: "These ideas help, but none of them explains every tragedy. Christians understand parts of this differently.",
      after: [
        { say: "None of these is the whole answer.", at: "top", mood: "thinking" },
        { say: "And none of them means someone’s suffering is their own fault.", mood: "tender", act: "nod" },
      ],
    },
    // 5. Jesus and suffering (ScriptureHighlight)
    {
      kind: "highlight",
      page: { at: "top", mood: "tender" },
      verse: { text: "Jesus wept.", ref: "John 11:35", translation: WEB },
      before: [
        { say: "There’s one more thing the Bible shows us.", mood: "tender" },
        { say: "When Jesus’ friend Lazarus died, Jesus went to the grave.", show: "verse", open: true, mood: "tender" },
        { say: "Look at what he did there.", mood: "tender", open: false },
      ],
      prompt: "Swipe across the words, slowly",
      after: [
        { say: "He wept.", mood: "moved" },
        { say: "He knew he was about to raise Lazarus. He grieved with them anyway.", mood: "moved" },
        { say: "Christians see this as a sign that God isn’t indifferent to our pain.", mood: "moved", act: "nod" },
      ],
    },
    // 6. What we know and what we don't (CompareUnderstanding)
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what can we actually say?", mood: "thinking" },
        { say: "Some things Scripture is clear on. Some it leaves open. Turn them over.", mood: "curious" },
      ],
      known: {
        label: "What Scripture teaches",
        items: [
          { text: "God cares about suffering", ref: "Psalm 34:18" },
          { text: "Jesus experienced suffering himself", ref: "1 Peter 2:21" },
          { text: "Christian hope includes restoration", ref: "Revelation 21:4" },
        ],
      },
      unknown: {
        label: "What Scripture doesn’t explain",
        items: [{ text: "Why each particular tragedy happens", ref: "Deuteronomy 29:29" }],
      },
      after: [
        { say: "We can know a lot about who God is.", mood: "happy", act: "nod" },
        { say: "We don’t always get to know why.", mood: "tender" },
        { say: "Faith doesn’t promise the pain will stop. It says you’re not alone in it.", mood: "moved" },
      ],
    },
    // 7. Personal reflection (PersonalReflection)
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Why does God allow suffering?",
      lines: [{ say: "Thanks for sitting with this one.", mood: "tender" }],
      check: {
        prompt: "Did this help you see the question differently?",
        options: [
          { text: "A little.", reply: "That’s plenty for one day. This kind of thing comes slowly.", mood: "moved", act: "nod" },
          { text: "I still have questions.", reply: "Good. Keep asking them. Job did, and God didn’t turn him away.", mood: "thinking", act: "tilt" },
          { text: "I’d like to explore more.", reply: "Let’s keep going. I’ll point you somewhere at the end.", mood: "happy", act: "hop" },
        ],
      },
      ask: "What’s on your heart about this?",
      write: "Write a thought",
      prayer: {
        label: "Pray a short prayer",
        text: "God, I don’t understand all of this. Thank you for being near to the brokenhearted. Help me trust you with what I can’t explain.",
      },
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    // 8. Closing (BigQuestionComplete)
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we explored.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Scripture makes room for hard questions. Job asked them too.",
        "Suffering isn’t always anyone’s fault, and it isn’t always explained.",
        "Jesus wept. God isn’t far from our pain.",
      ],
      refs: ["Job 13:24", "Job 42:7", "Luke 13:4", "Genesis 50:20", "John 11:35", "Psalm 34:18", "Revelation 21:4"],
      related: [
        { title: "Lazarus", sub: "Character study · John 11", lessonId: "lazarus" },
        { title: "Romans 8:28", sub: "Verse study · 5 min", lessonId: "romans-8-28" },
        { title: "More than you can handle?", sub: "Misconception · 5 min", lessonId: "more-than-you-can-handle" },
      ],
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
