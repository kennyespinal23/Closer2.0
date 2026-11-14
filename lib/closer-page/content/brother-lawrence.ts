import type { Lesson, Source } from "../lesson/types";
const page30: string = require("../assets/lawrence/kitchen-page-1895.jpg");

/* Testimony: Brother Lawrence (Nicolas Herman, c. 1614–1691), "The man who found God while washing dishes".
   The quietest testimony: no crisis, no rescue. A tree in winter, a clumsy footman, fifteen years in a kitchen.
   - He didn't write the book. Joseph de Beaufort recorded their conversations (from 3 August 1666) and published
     them with Lawrence's letters after his death in 1691. So most of what we know is Beaufort's record of what
     Lawrence told him: tagged "From his own telling" (reported) or "In his own words" where Beaufort quotes him.
   - Quotations are from the 1895 English translation (Fleming H. Revell, public domain), checked against the
     Internet Archive scan; GOD is printed in small capitals there.
   - Birth year is uncertain (sources give c. 1605–1614), shown as "Historians differ".
   - He was the community's cook (later the sandal-mender). "Washing dishes" is how he's often remembered,
     and the lesson says so.
   - No portrait from his lifetime is available to us; the image is a page of the 1895 edition. */

const WEB = "World English Bible";
const beaufort = "Joseph de Beaufort, recording Brother Lawrence (tr. 1895)";

const sources: Source[] = [
  { title: "The Practice of the Presence of God (Fleming H. Revell, 1895)", publisher: "Internet Archive", url: "https://archive.org/details/practiceofpresen00lawriala" },
  { title: "Brother Lawrence of the Resurrection", publisher: "Carmelites of Boston", url: "https://carmelitesofboston.org/history/our-carmelite-saints/brother-lawrence-of-the-resurrection" },
  { title: "Brother Lawrence", publisher: "Christian Classics Ethereal Library", url: "https://ccel.org/ccel/lawrence" },
  { title: "Brother Lawrence", publisher: "Christianity Today", url: "https://www.christianitytoday.com/history/people/innertravelers/brother-lawrence.html" },
];

export const brotherLawrence = {
  id: "brother-lawrence",
  title: "The man who found God while washing dishes",
  subtitle: "Brother Lawrence, c. 1614–1691",
  kind: "Testimony",
  scripture: "Paris · 17th century",
  minutes: 5,
  theme: "walnut",
  pronoun: "he",
  sources,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "happy" },
      lines: [
        { say: "Some testimonies have a storm, or a prison.", mood: "thinking" },
        { say: "This one has a kitchen.", mood: "cheeky", act: "stare" },
        { say: "A lame ex-soldier who found God in ordinary work.", mood: "happy", act: "nod" },
      ],
      display: { text: "Brother Lawrence", sub: "c. 1614–1691" },
      reply: "Tell me his story",
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "He was born Nicolas Herman, in Lorraine, in what’s now France.", mood: "thinking" },
        { say: "Poor, and not very promising.", mood: "cheeky" },
        { say: "Here’s his life before the kitchen.", show: "events", mood: "curious" },
      ],
      hint: "Tap each year",
      events: [
        { year: "c. 1614", title: "Born in Hériménil", tag: "disputed", body: "Most sources say about 1614. Others say as early as 1605. No reliable record of his birth survives.", say: "Even his birth year is uncertain." },
        {
          year: "At 18", title: "A tree in winter", tag: "account",
          body: "He told Joseph de Beaufort that his conversion came at eighteen, looking at a bare tree in winter and thinking about spring.",
          quote: { text: "That in the winter, seeing a tree stripped of its leaves, and considering that within a little time the leaves would be renewed, and after that the flowers and fruit appear, he received a high view of the providence and power of GOD", source: beaufort },
          say: "A bare tree. That was his turning point.",
        },
        { year: "1630s", title: "A soldier", tag: "fact", body: "He fought in the Thirty Years’ War and was wounded. He was lame for the rest of his life.", say: "Then war. He came home limping." },
        {
          year: "1630s", title: "A clumsy footman", tag: "account",
          body: "He worked as a footman to M. Fieubert, the treasurer.",
          quote: { text: "a great awkward fellow who broke everything", source: beaufort },
          say: "And, by his own description, he broke things.",
        },
        { year: "1640", title: "The Carmelites in Paris", tag: "fact", body: "He joined the Discalced Carmelite priory in Paris as a lay brother, taking the name Lawrence of the Resurrection.", say: "Then he joined a monastery." },
      ],
      after: [
        { say: "He thought the monastery would be hard on his clumsiness.", at: "top", mood: "cheeky", act: "stare" },
        { say: "Instead they put him in the kitchen.", mood: "surprised", act: "hop" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "happy" },
      beats: [
        { tag: "account", intensity: 0, text: "He became cook for the community, a job he told Beaufort he naturally disliked.", say: "He didn’t even like cooking.", mood: "cheeky" },
        {
          tag: "account", intensity: 0, text: "So he made a habit: doing each small task for the love of God, and talking to God as he worked.",
          quote: { text: "…we ought not to be weary of doing little things for the love of GOD, who regards not the greatness of the work, but the love with which it is performed.", source: beaufort },
          say: "So he did small things, for God.", mood: "happy", act: "nod",
        },
        { tag: "fact", intensity: 0, text: "He worked in the kitchen for about fifteen years. Later, lame and older, he mended the community’s sandals.", say: "Fifteen years of pots and pans.", mood: "thinking" },
        { tag: "interpretation", intensity: 0, text: "Lawrence understood every ordinary moment as a chance to be with God. Prayer wasn’t a separate time. It was the whole day.", say: "Here’s how he understood it.", mood: "moved" },
      ],
      after: [],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "After he died, a friend published what he’d said.", mood: "thinking" },
        { say: "Here’s a page from the English edition of 1895.", mood: "excited", act: "hop", open: true },
      ],
      title: "The Practice of the Presence of God",
      date: "1895",
      image: {
        src: page30,
        alt: "A printed book page, page 30 of Conversations, ending with Brother Lawrence’s words about the noise and clatter of his kitchen",
        credit: "The Practice of the Presence of God (New York: Fleming H. Revell, 1895), page 30. Scan: Internet Archive. Public domain.",
      },
      focus: { x: 0.45, y: 0.8, scale: 1.1 },
      transcription: {
        text: "“The time of business,” said he, “does not with me differ from the time of prayer, and in the noise and clatter of my kitchen, while several persons are at the same time calling for different things, I possess GOD in as great tranquillity as if I were upon my knees at the blessed sacrament.”",
        source: beaufort,
      },
      notes: [
        { tag: "fact", text: "Lawrence didn’t write this book. Joseph de Beaufort, who first met him on 3 August 1666, published his record of their talks, with Lawrence’s letters, after Lawrence died in 1691." },
        { tag: "legend", text: "Often said: he washed dishes. The record says he was the cook, and later mended sandals. Close enough, but now you know." },
        { tag: "fact", text: "For more than three centuries, it has been read by Catholics and Protestants alike." },
      ],
      after: [
        { say: "The noise and clatter of my kitchen. I love that line.", mood: "happy", open: false },
        { say: "A few things to keep straight.", show: "notes", mood: "curious", act: "tilt" },
        { say: "No miracle. Just a man paying attention to God, all day.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Nothing in his life looked important.", mood: "thinking" },
        { say: "Look at it anyway.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "Before 1640",
        items: ["A poor boy from Lorraine", "A soldier, wounded and lame", "A clumsy footman who broke things"],
      },
      later: {
        label: "1640–1691",
        items: ["Cook for a large Paris priory", "Then the sandal-mender", "Visitors came to him for advice", "Died on 12 February 1691, around 80"],
      },
      note: "He never led anything, built anything, or wrote a book himself. People still read him because of how he did ordinary things.",
      after: [
        { say: "Maybe the place you meet God is the place you already are.", mood: "moved" },
        { say: "Even a sink full of dishes.", mood: "cheeky", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Brother Lawrence",
      lines: [
        { say: "Want to try his practice?", mood: "happy" },
        { say: "Whatever you do next, do it with God. Even something small.", mood: "tender" },
      ],
      check: {
        prompt: "What stands out to you most about his story?",
        options: [
          { text: "God in ordinary work.", reply: "Yes. No special place required.", mood: "happy", act: "nod" },
          { text: "Doing small things with love.", reply: "Small things, for the love of God. That was his whole method.", mood: "moved", act: "nod" },
          { text: "He didn’t even like the job.", reply: "Ha. That makes it more real, doesn’t it?", mood: "cheeky", act: "stare" },
          { text: "I want to think about it.", reply: "Take your time. He’d approve.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What ordinary task could you do with God today?",
      write: "Write a thought",
      skip: "Just reflect",
      placeholder: "Only you will see this.",
      quiet: "Take a breath. Whatever comes next, he’s already there.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "Brother Lawrence, c. 1614–1691",
      body: "The Lord is always closer than you think.",
      summary: [
        "A lame former soldier and clumsy footman who became a monastery cook.",
        "He practised being with God in every ordinary task.",
        "His friend’s record of their talks has been read for over 300 years.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "And whatever you do, work heartily, as for the Lord, and not for men,",
        ref: "Colossians 3:23",
        translation: WEB,
      },
      sources,
      related: [
        { title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", lessonId: "god-far-away" },
        { title: "The restless heart", sub: "Testimony · Augustine", lessonId: "augustine" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
