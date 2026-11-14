import type { Lesson, Source } from "../lesson/types";
const fresco: string = require("../assets/augustine/lateran-fresco.jpg");
const botticelli: string = require("../assets/augustine/botticelli-1480.jpg");

/* Testimony: Augustine of Hippo (354–430).
   - Dates follow the Stanford Encyclopedia of Philosophy entry (born 13 Nov 354, Thagaste; Manichee about
     nine years; Milan and Ambrose; conversion summer 386; baptised by Ambrose Easter 387; priest at Hippo 391;
     bishop c. 396; Confessions c. 396–400; City of God 412–426; died 28 Aug 430 during the Vandal siege).
   - The garden scene is known only from his own account in the Confessions, written about a decade later
     as a prayer: tagged "From his own telling", and his understanding of it as "How he understood it".
   - Every quotation is from E. B. Pusey's public-domain translation (1838), checked word for word against
     Project Gutenberg #3296.
   - No portrait from his lifetime survives. Both images are labelled as later depictions, not likenesses. */

const WEB = "World English Bible";
const pusey = (book: string) => `Augustine, Confessions, Book ${book} (tr. E. B. Pusey, 1838)`;

const sources: Source[] = [
  { title: "Saint Augustine", publisher: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/entries/augustine/" },
  { title: "The Confessions of Saint Augustine, tr. E. B. Pusey (1838)", publisher: "Project Gutenberg", url: "https://www.gutenberg.org/ebooks/3296" },
  { title: "The earliest portrait of Saint Augustine, 6th-century fresco, Lateran", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:Augustine_Lateran.jpg" },
  { title: "Sandro Botticelli, Saint Augustine in His Study (c. 1480)", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:Sandro_Botticelli_050.jpg" },
];

export const augustine = {
  id: "augustine",
  title: "The restless heart",
  subtitle: "Augustine of Hippo, 354–430",
  kind: "Testimony",
  scripture: "Confessions · Romans 13",
  minutes: 6,
  theme: "walnut",
  pronoun: "he",
  sources,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "Have you ever felt restless, like something important was missing?", mood: "curious", act: "tilt" },
        { say: "A teacher from North Africa wrote about that feeling over 1,600 years ago.", mood: "thinking" },
        { say: "His name was Augustine.", show: "portrait", at: "left", mood: "happy" },
      ],
      portrait: {
        src: fresco,
        alt: "Faded fresco of a seated man in a white robe, reading from an open book",
        credit: "The oldest known picture of Augustine: a 6th-century fresco in the Lateran, Rome, made long after his death. Not a likeness. Public domain.",
        name: "Augustine of Hippo",
        dates: "354–430",
      },
      reply: "Tell me his story",
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "He grew up in Roman North Africa, in what’s now Algeria.", mood: "thinking" },
        { say: "Brilliant, ambitious, and searching.", mood: "curious" },
        { say: "Here’s how the search went.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      events: [
        { year: "354", title: "Born in Thagaste", tag: "fact", body: "His mother, Monica, was a Christian. His father, Patricius, was baptised only near the end of his life.", say: "A Christian mother, a father who wasn’t, yet." },
        { year: "c. 372", title: "Set on fire by a book", tag: "account", body: "At 18 he read Cicero, the Roman writer, and by his own telling it made him long for wisdom. Around then he began a 14-year relationship, and had a son, Adeodatus.", say: "A book lit something in him." },
        { year: "c. 373", title: "Nine years with the Manichees", tag: "fact", body: "He joined the Manichees, a movement that claimed to explain good and evil. He stayed about nine years, then grew disillusioned.", say: "He tried a philosophy that promised answers." },
        { year: "384", title: "A top job in Milan", tag: "fact", body: "He became professor of rhetoric in Milan, and went to hear the bishop, Ambrose, preach.", say: "Then success. And a bishop worth listening to." },
        { year: "c. 385", title: "Sending her away", tag: "fact", body: "Planning a marriage that would help his career, he sent away the mother of his son. He later wrote about it with real pain.", say: "Some of this story is hard to read." },
      ],
      after: [
        { say: "Successful, respected, and by his own account, miserable.", at: "top", mood: "tender" },
        { say: "He wanted God. Sort of. Just not yet.", mood: "cheeky", act: "stare" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        {
          when: "Summer 386", tag: "account", intensity: 0,
          text: "In a garden in Milan, Augustine was in turmoil. Years before, he says, he had prayed for self-control, but asked God not to give it too soon.",
          quote: { text: "Give me chastity and continency, only not yet.", source: pusey("VIII") },
          say: "He was honest about it.", mood: "thinking",
        },
        {
          tag: "account", intensity: 0,
          text: "Weeping under a fig tree, he heard a child’s voice from a neighbouring house, chanting a phrase over and over.",
          quote: { text: "Take up and read; Take up and read.", source: pusey("VIII") },
          say: "Then he heard something.", mood: "curious", act: "tilt",
        },
        {
          tag: "account", intensity: 0,
          text: "He picked up Paul’s letters and read the first passage his eyes fell on, Romans 13:13–14.",
          quote: { text: "No further would I read; nor needed I: for instantly at the end of this sentence, by a light as it were of serenity infused into my heart, all the darkness of doubt vanished away.", source: pusey("VIII") },
          say: "And that was that.", mood: "moved",
        },
        {
          tag: "interpretation", intensity: 0,
          text: "Augustine understood the voice as God calling him. He told it about a decade later in the Confessions, his life written as a prayer about grace.",
          say: "Only his own account tells us this. Here’s how he understood it.", mood: "thinking", act: "nod",
        },
        {
          when: "Easter 387", tag: "fact", intensity: 0,
          text: "He was baptised in Milan by Bishop Ambrose, together with his son Adeodatus and his friend Alypius.",
          say: "Then he made it public.", mood: "happy", act: "nod",
        },
      ],
      after: [],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "happy" },
      before: [
        { say: "Augustine became one of the most painted saints in history.", mood: "happy" },
        { say: "Here’s how one painter imagined him, about 1,100 years later.", mood: "excited", act: "hop", open: true },
      ],
      title: "Saint Augustine in His Study",
      date: "c. 1480",
      image: {
        src: botticelli,
        alt: "Painting of a bearded bishop at his desk, hand on his chest, gazing upward, surrounded by books and instruments",
        credit: "Sandro Botticelli, Saint Augustine in His Study (c. 1480), Ognissanti, Florence. Public domain. An artist’s imagining, not a likeness.",
      },
      focus: { x: 0.62, y: 0.32, scale: 2.1 },
      transcription: { text: "Thou madest us for Thyself, and our heart is restless, until it repose in Thee.", source: pusey("I") },
      notes: [
        { tag: "legend", text: "Paintings like this one aren’t likenesses. No portrait made in Augustine’s lifetime survives." },
        { tag: "account", text: "“Take up and read” comes only from his own telling. There are no other witnesses." },
        { tag: "legend", text: "Often said: Bishop Ambrose told Monica her son couldn’t be lost. In the Confessions, the bishop who said “the son of these tears” is never named." },
        { tag: "fact", text: "He wrote the Confessions in the late 390s, about ten years after his conversion." },
      ],
      after: [
        { say: "The restless heart. People still quote that line today.", mood: "moved", open: false },
        { say: "A few things to keep straight.", show: "notes", mood: "curious", act: "tilt" },
        { say: "His story is real. It’s also told by him, years later, as a prayer.", mood: "thinking", act: "nod" },
      ],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what did his life become?", mood: "thinking" },
        { say: "Look at him in two seasons.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "Before 386",
        items: ["A brilliant teacher chasing success", "Nine years with the Manichees", "Searching for God, and putting him off"],
      },
      later: {
        label: "391–430",
        items: [
          "Ordained a priest in Hippo in 391, apparently against his wishes",
          "Bishop of Hippo from about 396 until his death",
          "Wrote the Confessions and The City of God",
          "Died in 430, while the Vandals were besieging Hippo",
        ],
      },
      quote: { text: "Too late loved I Thee, O Thou Beauty of ancient days, yet ever new! too late I loved Thee!", source: pusey("X") },
      note: "He shaped Christian thought for centuries. Christians still debate some of his ideas, and still read his story of a restless heart finding rest.",
      after: [
        { say: "He never stopped calling himself someone who’d been found.", mood: "moved" },
        { say: "And he spent the rest of his life writing about grace.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Augustine",
      lines: [{ say: "That’s Augustine’s story.", mood: "thinking" }],
      check: {
        prompt: "What stands out to you most about his story?",
        options: [
          { text: "The restless heart.", reply: "Me too. It’s honest about something a lot of people feel.", mood: "moved", act: "nod" },
          { text: "His honesty about “not yet”.", reply: "Right? He doesn’t make himself look good. That’s rare.", mood: "cheeky", act: "stare" },
          { text: "How long the search took.", reply: "Years and years. Searching isn’t failing.", mood: "thinking", act: "nod" },
          { text: "I want to think about it.", reply: "Take your time. He certainly did.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What are you restless for right now?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "Augustine of Hippo, 354–430",
      body: "The Lord is always closer than you think.",
      summary: [
        "A gifted, restless teacher who searched for years.",
        "In a garden in Milan in 386, by his own account, he finally turned to God.",
        "He became a bishop, and one of Christianity’s most influential writers.",
      ],
      scripture: {
        label: "The passage he read, in today’s English",
        text: "Let us walk properly, as in the day; not in reveling and drunkenness, not in sexual promiscuity and lustful acts, and not in strife and jealousy. But put on the Lord Jesus Christ, and make no provision for the flesh, for its lusts.",
        ref: "Romans 13:13–14",
        translation: WEB,
      },
      sources,
      related: [
        { title: "How can we know God exists?", sub: "Big question · 6 min", lessonId: "god-exists" },
        { title: "The lost sheep", sub: "Bible story · Luke 15", lessonId: "lost-sheep" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
