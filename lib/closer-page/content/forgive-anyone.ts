import type { Lesson } from "../lesson/types";

/* Big Question: Can God forgive anyone?
   Paul the persecutor (1 Timothy 1:13-16), the thief on the cross (Luke 23:43), Jesus forgiving his
   executioners (Luke 23:34), Peter restored (John 21:17). Forgiveness comes with turning back (Acts 3:19,
   1 John 1:9) and doesn't call harm okay or always remove consequences.
   Mark 3:29 (the sin "never forgiven") is presented honestly as disputed: Christians understand it
   differently; the common pastoral view is given as a view, not a ruling.
   Scripture is the World English Bible, word for word; "…" marks a quote that starts or stops mid-verse. */

const WEB = "World English Bible";

export const forgiveAnyone = {
  id: "forgive-anyone",
  title: "Can God forgive anyone?",
  subtitle: "A persecutor, a thief, and a friend who ran",
  kind: "Big question",
  scripture: "1 Timothy 1 · Luke 23 · John 21",
  minutes: 6,
  theme: "teal",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "Here’s one people usually ask quietly.", mood: "thinking" },
        { say: "Is there anything God can’t forgive?", mood: "tender", act: "settle" },
        { say: "Let’s see what the Bible actually says.", mood: "curious", act: "nod" },
      ],
      display: { text: "Can God forgive anyone?", sub: "Big question · World English Bible" },
      reply: "Let’s explore",
    },
    {
      kind: "ask",
      page: { at: "left", mood: "thinking", act: "tilt" },
      prompt: "Why does this question matter to you?",
      options: [
        { text: "I’ve done things I regret.", reply: "Then this one’s for you. Stay with me.", mood: "tender", act: "nod" },
        { text: "Someone hurt me badly.", reply: "I’m sorry. That makes this harder. God forgiving someone never means what they did was okay.", mood: "tender", act: "settle" },
        { text: "I’m just curious.", reply: "Good thing to be curious about. Let’s dig in.", mood: "happy", act: "hop" },
      ],
      after: [{ say: "Let’s start with someone who did a lot of damage.", at: "top", mood: "thinking" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Before Paul wrote much of the New Testament, he hunted Christians down.", mood: "tender", open: true },
        { say: "Here’s how he describes himself.", show: "verse", mood: "thinking" },
      ],
      verse: { text: "although I was before a blasphemer, a persecutor, and insolent. However, I obtained mercy…", ref: "1 Timothy 1:13", translation: WEB },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "a blasphemer, a persecutor, and insolent", label: "Paul before", note: "He doesn’t soften it." },
        { phrase: "I obtained mercy", label: "Shown mercy", note: "And God showed him mercy." },
      ],
      after: [
        { say: "If anyone seemed past forgiving, it was him.", at: "top", mood: "surprised", open: false },
        { say: "And he says God did it on purpose, as an example for everyone after.", show: "more", mood: "moved", act: "nod" },
      ],
      more: { text: "However, for this cause I obtained mercy, that in me first, Jesus Christ might display all his patience, for an example of those who were going to believe in him for eternal life.", ref: "1 Timothy 1:16", translation: WEB },
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious" },
      verse: { text: "The saying is faithful and worthy of all acceptance, that Christ Jesus came into the world to save sinners; of whom I am chief.", ref: "1 Timothy 1:15", translation: WEB },
      target: "of whom I am chief",
      before: [{ say: "Here’s how Paul sums it up. Look at the end.", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark what Paul calls himself, or tap it",
      after: [
        { say: "Chief. First in line, as sinners go.", at: "top", mood: "surprised", act: "spin" },
        { say: "And that’s exactly who Jesus came for.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Paul isn’t the only one. Open each of these.", mood: "curious" },
      ],
      cards: [
        {
          title: "Forgiveness from the cross",
          say: "Jesus forgave even while it was happening.",
          body: "Nailed to the cross, Jesus prayed for the people putting him there.",
          verse: { text: "“Father, forgive them, for they don’t know what they are doing.”", ref: "Luke 23:34", translation: WEB },
        },
        {
          title: "A thief at the last minute",
          say: "One of the men crucified beside him asked at the very end.",
          body: "He had nothing to offer and no time to fix anything. He asked Jesus to remember him, and Jesus answered.",
          verse: { text: "“Assuredly I tell you, today you will be with me in Paradise.”", ref: "Luke 23:43", translation: WEB },
        },
        {
          title: "Peter’s second chance",
          say: "And Peter denied knowing Jesus three times.",
          body: "After the resurrection, Jesus asked Peter three times if he loved him, then gave him work to do.",
          verse: { text: "“Lord, you know everything. You know that I have affection for you.”", ref: "John 21:17", translation: WEB },
        },
      ],
      caveat: "Forgiveness isn’t pretending harm didn’t happen, and it doesn’t always remove consequences. Scripture ties it to turning back to God.",
      after: [{ say: "A persecutor, a dying thief, a friend who walked away. All forgiven.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what can we say for sure?", mood: "thinking" },
        { say: "Turn these over. The last one is honest about a hard verse.", mood: "curious" },
      ],
      known: {
        label: "What Scripture teaches",
        items: [
          { text: "Anyone who confesses can be forgiven", ref: "1 John 1:9" },
          { text: "Forgiveness comes with turning back to God", ref: "Acts 3:19" },
          { text: "Forgiven sin is really gone", ref: "Psalm 103:12" },
        ],
      },
      unknown: {
        label: "Where Christians read it differently",
        items: [{ text: "Exactly what Jesus meant by the sin “never forgiven”", ref: "Mark 3:29" }],
      },
      after: [
        { say: "About that last one: Christians understand it in different ways.", mood: "thinking" },
        { say: "Many believe it means rejecting God for good, not one terrible moment.", mood: "thinking", act: "nod" },
        { say: "And many pastors say: if you’re worried you’ve done it, that worry is a good sign you haven’t.", mood: "tender" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Can God forgive anyone?",
      lines: [{ say: "Thanks for sitting with this one.", mood: "tender" }],
      check: {
        prompt: "Did this help you see the question differently?",
        options: [
          { text: "A little.", reply: "That’s plenty. Mercy takes a while to sink in.", mood: "moved", act: "nod" },
          { text: "I still have questions.", reply: "Keep asking. The door doesn’t close on questions.", mood: "thinking", act: "tilt" },
          { text: "I’d like to explore more.", reply: "Let’s keep going. I’ll point you somewhere at the end.", mood: "happy", act: "hop" },
        ],
      },
      ask: "Is there something you want to bring to God?",
      write: "Write a thought",
      prayer: {
        label: "Pray a short prayer",
        text: "God, you know what I’ve done, and what’s been done to me. Thank you that your mercy is bigger. Help me receive it, and help me forgive too.",
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
        "Paul, the thief and Peter were all forgiven.",
        "God’s forgiveness is open to anyone who turns to him.",
        "Forgiveness doesn’t say harm was okay. It says mercy is bigger.",
      ],
      refs: ["1 Timothy 1:13–16", "Luke 23:34", "Luke 23:43", "John 21:17", "1 John 1:9", "Mark 3:29"],
      related: [
        { title: "Zacchaeus", sub: "Character study · Luke 19", lessonId: "zacchaeus" },
        { title: "The lost sheep", sub: "Bible story · Luke 15", lessonId: "lost-sheep" },
        { title: "Jonah", sub: "Character study · Jonah 1–4", lessonId: "jonah" },
      ],
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
