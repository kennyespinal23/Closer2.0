import type { Lesson, Source } from "../lesson/types";
const portrait: string = require("../assets/muller/muller-1889.jpg");
const funeral: string = require("../assets/muller/funeral-1898.jpg");

/* Testimony: George Müller (1805–1898), "The man who built an orphanage on prayer".
   A prodigal-son shape: a wild youth, a quiet Saturday-evening conversion, then sixty years of prayer and
   careful account-keeping.
   - Facts: born 27 Sept 1805, Kroppenstedt, Prussia; jailed as a teenager at Wolfenbüttel for running up bills
     he couldn't pay; a divinity student at Halle; converted at a Saturday-evening Bible meeting, mid-November
     1825; Bristol from 1832; first orphan house in rented No. 6 Wilson Street, 1836; children moved into the new
     Orphan House on Ashley Down on 18 June 1849; five houses by 1870 (room for about 2,000); more than 10,000
     children cared for in his lifetime; died 10 March 1898.
   - Quotations are his own, from his Narrative as printed in The Life of Trust (Boston, 1868), checked against
     the Internet Archive scan.
   - The famous "empty breakfast table, then the baker and the milkman" story is not in his Narrative: it is
     shown as a later legend. The critique that his published reports made needs known is shown as disputed. */

const WEB = "World English Bible";
const trust = "George Müller, Narrative, in The Life of Trust (1868)";

const sources: Source[] = [
  { title: "The Life of Trust: Being a Narrative of the Lord’s Dealings with George Müller (1868)", publisher: "Internet Archive", url: "https://archive.org/details/lifeoftrustbeing00mlrich" },
  { title: "George Müller", publisher: "Christian History Institute", url: "https://christianhistoryinstitute.org/magazine/article/did-you-know-mueller" },
  { title: "The story of the Müller Homes", publisher: "Evangelical Times", url: "https://www.evangelical-times.org/the-story-of-the-muller-homes/" },
  { title: "New Orphan Houses, Ashley Down", publisher: "Wikipedia (overview)", url: "https://en.wikipedia.org/wiki/New_Orphan_Houses,_Ashley_Down" },
  { title: "Portrait of George Müller, The Christian Portrait Gallery (1889)", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:George_M%C3%BCller.jpg" },
  { title: "Funeral of George Müller in Bristol, The Sketch, 23 March 1898", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:Funeral_of_George_M%C3%BCller_(1805%E2%80%931898)_in_Bristol.png" },
];

export const georgeMuller = {
  id: "george-muller",
  title: "The man who built an orphanage on prayer",
  subtitle: "George Müller, 1805–1898",
  kind: "Testimony",
  scripture: "Bristol · 1836–1898",
  minutes: 6,
  theme: "walnut",
  pronoun: "he",
  sources,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "A teenage con artist. A jail cell. And, years later, homes for thousands of children.", mood: "cheeky", act: "stare" },
        { say: "Same man.", mood: "surprised", act: "hop" },
        { say: "His name was George Müller.", show: "portrait", at: "left", mood: "happy" },
      ],
      portrait: {
        src: portrait,
        alt: "Engraved portrait of an older man with a high collar and side whiskers",
        credit: "George Müller, engraving from The Christian Portrait Gallery (1889). Public domain.",
        name: "George Müller",
        dates: "1805–1898",
      },
      reply: "Tell me his story",
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "He grew up in Prussia, in what’s now Germany.", mood: "thinking" },
        { say: "And by his own account, he was a mess.", mood: "cheeky", act: "stare" },
        { say: "Here’s how it went.", show: "events", mood: "curious" },
      ],
      hint: "Tap each year",
      events: [
        { year: "1805", title: "Born in Kroppenstedt", tag: "fact", body: "Born in Prussia, the son of a tax collector.", say: "An ordinary start." },
        { year: "c. 1821", title: "Jailed as a teenager", tag: "account", body: "He ran up hotel bills he couldn’t pay, tried to slip away from an inn at Wolfenbüttel, and was arrested and jailed. He tells it himself.", say: "He ended up in jail. His own telling." },
        { year: "1825", title: "Studying for the church, believing none of it", tag: "account", body: "At university in Halle he studied divinity, mostly so he could get a good parish, he said, while living as wildly as ever.", say: "Training to be a pastor. Not believing a word." },
        {
          year: "1825", title: "A Saturday evening meeting", tag: "own",
          body: "In mid-November a friend mentioned a Saturday-evening meeting at a Christian’s home, where people read the Bible, sang and prayed. Müller went, and his life turned.",
          quote: { text: "No sooner had I heard this than it was to me as if I had found something after which I had been seeking all my life long.", source: trust },
          say: "Then a friend mentioned a Bible meeting.",
        },
        { year: "1832", title: "Bristol", tag: "fact", body: "After moving to England, he settled in Bristol as a preacher, with his friend Henry Craik.", say: "Then Bristol." },
      ],
      after: [
        { say: "No storm. No voice. Just a living room, and a door that opened.", at: "top", mood: "moved" },
        { say: "And Bristol’s streets were full of orphaned children.", mood: "tender" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        { when: "1836", tag: "fact", intensity: 0, text: "He rented No. 6 Wilson Street in Bristol and opened his first orphan house.", say: "It started with one rented house.", mood: "happy", act: "nod" },
        {
          tag: "own", intensity: 0, text: "He said the point wasn’t only to care for children. It was to show that God answers prayer.",
          quote: { text: "…the first and primary object of the work was, and still is, that God might be magnified by the fact that the orphans under my care are provided with all they need, only by prayer and faith, without any one being asked by me or my fellow-laborers…", source: trust },
          say: "He wouldn’t ask anyone for money. Only God.", mood: "curious", act: "tilt",
        },
        { tag: "account", intensity: 0, text: "His journals record day after day of needs met, often at the last moment, and he refused to run up any debt.", say: "He kept careful records. Every gift. Every need.", mood: "thinking" },
        { when: "18 June 1849", tag: "fact", intensity: 0, text: "Children moved from the four Wilson Street houses into a new building he had built on Ashley Down.", say: "Then a building of their own.", mood: "excited", act: "hop" },
        { when: "1870", tag: "fact", intensity: 0, text: "By 1870 there were five large houses on Ashley Down, with room for about 2,000 children.", say: "Then five.", mood: "surprised" },
        { tag: "interpretation", intensity: 0, text: "Müller saw every gift as God answering prayer. We can’t measure that. We can see what he built.", say: "Here’s how he understood it.", mood: "moved" },
      ],
      after: [],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "He lived to 92.", mood: "thinking" },
        { say: "Here’s Bristol on the day of his funeral, in 1898.", mood: "moved", open: true },
      ],
      title: "The Sketch",
      date: "23 March 1898",
      image: {
        src: funeral,
        alt: "Black-and-white photograph of a crowded street filled with people and horse-drawn carriages",
        credit: "Funeral of George Müller in Bristol. The Sketch, 23 March 1898. Photo: Midwinter, Clifton. Public domain.",
      },
      focus: { x: 0.5, y: 0.55, scale: 1.7 },
      notes: [
        { tag: "fact", text: "Müller died on 10 March 1898. Crowds filled Bristol’s streets for his funeral." },
        { tag: "fact", text: "In his lifetime, the homes cared for more than 10,000 children." },
        { tag: "legend", text: "Often told: the children sat at an empty breakfast table, then a baker and a milkman arrived. That story isn’t in Müller’s own Narrative. It comes from later retellings." },
        { tag: "disputed", text: "Some critics said his widely read annual reports made the homes’ needs known. Müller insisted he never asked anyone for money." },
      ],
      after: [
        { say: "A whole city came out.", mood: "moved", open: false },
        { say: "Here’s what’s documented, and what isn’t.", show: "notes", mood: "curious", act: "tilt" },
        { say: "The real story is quieter than the legends. And it’s more than enough.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Two lives, really.", mood: "thinking" },
        { say: "Look at them side by side.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "Before 1825",
        items: ["Lying, stealing and running up debts", "Jailed as a teenager", "Studying divinity without believing it"],
      },
      later: {
        label: "1825–1898",
        items: [
          "Gave up a fixed salary and lived on gifts",
          "Opened orphan houses in Bristol from 1836",
          "Built five homes on Ashley Down, never taking on debt",
          "In his seventies and eighties, travelled the world preaching",
        ],
      },
      note: "His faith didn’t make him careless. He kept meticulous accounts, published them, and refused to borrow.",
      after: [
        { say: "Bold prayer, and careful work. He didn’t see those as opposites.", mood: "thinking", act: "nod" },
        { say: "He called God “the Father of the fatherless”. And acted like it was true.", mood: "moved" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "George Müller",
      lines: [{ say: "That’s George Müller’s story.", mood: "happy" }],
      check: {
        prompt: "What stands out to you most about his story?",
        options: [
          { text: "Praying for everyday needs.", reply: "Bread, coal, rent. He prayed about all of it. Nothing was too small.", mood: "happy", act: "nod" },
          { text: "Caring for children no one wanted.", reply: "Yes. That’s where his faith went: to the kids on the street.", mood: "moved", act: "nod" },
          { text: "How far he came from his past.", reply: "From a jail cell to all that. Nobody’s too far gone.", mood: "excited", act: "hop" },
          { text: "I want to think about it.", reply: "Take your time.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What need could you bring to God in prayer today?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "George Müller, 1805–1898",
      body: "The Lord is always closer than you think.",
      summary: [
        "A teenage swindler who came to faith at a Saturday-evening Bible meeting in 1825.",
        "He opened homes for orphans in Bristol, asking no one but God for money.",
        "More than 10,000 children were cared for in his lifetime.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "A father of the fatherless, and a defender of the widows, is God in his holy habitation.",
        ref: "Psalm 68:5",
        translation: WEB,
      },
      sources,
      related: [
        { title: "Why doesn’t God answer every prayer?", sub: "Big question · 6 min", lessonId: "unanswered-prayer" },
        { title: "The lost sheep", sub: "Bible story · Luke 15", lessonId: "lost-sheep" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
