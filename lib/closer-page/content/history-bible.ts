import type { Lesson } from "../lesson/types";

/* Church History: How Did We Get the Bible?
   An afternoon in the scriptorium. Copy Luke's line by hand and send it church to church; catch a scribe's slip
   across three copies; drag back through time to the oldest copies that survive; sort early Christian writings the
   way Eusebius recorded the churches treating them (c. 325); watch Athanasius's list of 367 fill a shelf with 27
   books; then see the Old Testament as Protestant, Catholic and Orthodox Bibles hold it, side by side.

   Kept honest, line by line:
   - Every claim wears a tag: "In the record" (documented), "Scholars' estimate" (counts and broad agreement),
     "Still debated" (dates and questions historians argue over).
   - The manuscript count is approximate and said so. P52's and P46's dates are given as ranges and marked debated.
   - The sort follows Eusebius, Church History 3.25, simplified to three shelves, and the simplification is stated.
     Revelation, which he listed twice, is left out of the sort and mentioned instead.
   - The Old Testament shelves are described, not ranked.
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - The reflection is optional, and nothing chosen there is saved. */

const WEB = "World English Bible";

export const historyBible = {
  id: "history-bible",
  title: "How Did We Get the Bible?",
  subtitle: "From hand-copied pages to the book you hold",
  kind: "Church history",
  scripture: "Luke 1 · Isaiah 40 · John 18",
  minutes: 5,
  theme: "lapis",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "How Did We Get the Bible?", sub: "Church History · 5 min" },
      lines: [
        { say: "Your Bible was written over many centuries.", mood: "curious", act: "hop" },
        { say: "So how did it get from then to you?", mood: "thinking", act: "tilt" },
        { say: "Let’s investigate, the way historians do.", mood: "excited", act: "nod" },
      ],
      reply: "Into the scriptorium",
    },
    {
      kind: "hbibleCopy",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Before printing, every Bible was copied by hand.", mood: "curious", act: "nod" },
        { say: "Let’s copy one line. Luke wrote it about why he wrote.", mood: "happy", act: "tilt" },
      ],
      hold: "Hold to copy it, letter by letter. Scribes did this for weeks.",
      verse: { text: "that you might know the certainty concerning the things in which you were instructed.", ref: "Luke 1:4", translation: WEB },
      cities: ["Jerusalem", "Antioch", "Ephesus", "Corinth", "Rome", "Alexandria", "Caesarea", "Carthage"],
      spread: "Thirty-two copies already. Now picture that for centuries.",
      compare: {
        hint: "Three copies. One scribe slipped. Find the odd word.",
        words: ["that", "you", "might", "know", "the", "certainty", "concerning", "the", "things", "in", "which", "you", "were", "instructed."],
        slip: { copy: 1, word: 5, reads: "certainly" },
        found: "Caught it! With many copies, a slip in one stands out.",
        miss: "That word matches the other copies. Look again.",
      },
      notes: [
        { tag: "estimate", text: "Roughly 5,800 handwritten Greek manuscripts of the New Testament survive, whole or in pieces. The count grows as more are catalogued." },
        { tag: "estimate", text: "Scholars broadly agree most differences between copies are spelling, word order or slips like this one. Comparing copies works back to the wording." },
        { tag: "record", text: "A few passages are genuinely uncertain, like the ending of Mark. Most Bibles say so in a footnote." },
      ],
      after: [
        { say: "So more copies doesn’t mean more confusion.", mood: "thinking", act: "nod" },
        { say: "It means more to check against.", mood: "happy", act: "hop" },
      ],
    },
    {
      kind: "hbibleWitness",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Some very old copies still exist.", mood: "curious", act: "nod" },
        { say: "You can visit them in museums today.", mood: "happy", act: "tilt" },
      ],
      hint: "Drag back through time and find the oldest copies we hold.",
      from: -200,
      to: 400,
      witnesses: [
        {
          id: "sinai", year: 350, date: "c. AD 330–360", name: "Codex Sinaiticus", where: "Kept at Sinai for centuries",
          body: "The oldest complete New Testament that survives, written by hand in one huge book. Most of it is now in the British Library.",
          tag: "record", say: "A whole New Testament, about 1,700 years old.",
        },
        {
          id: "p46", year: 200, date: "c. AD 200", name: "Papyrus 46", where: "Dublin and Michigan",
          body: "A book of Paul’s letters, copied around a century and a half after he wrote them. Some scholars date it earlier, some later.",
          tag: "debated", say: "Paul’s letters, in an early bound book.",
        },
        {
          id: "p52", year: 150, date: "c. AD 125–175", name: "Papyrus 52", where: "John Rylands Library, Manchester",
          body: "A scrap about the size of a credit card, from John 18, written on both sides. Often called the oldest piece of the New Testament, though its date is argued over.",
          tag: "debated",
          verse: { text: "For this reason I have been born, and for this reason I have come into the world, that I should testify to the truth.", ref: "John 18:37", translation: WEB },
          say: "Tiny, but it carries words from John 18.",
        },
        {
          id: "isaiah", year: -125, date: "c. 125 BC", name: "The Great Isaiah Scroll", where: "Found at Qumran, 1947",
          body: "All 66 chapters of Isaiah on one scroll, found in a cave by the Dead Sea. It is about a thousand years older than the oldest complete Hebrew Bibles known before it, and it reads almost the same.",
          tag: "record",
          verse: { text: "The grass withers, the flower fades; but the word of our God stands forever.", ref: "Isaiah 40:8", translation: WEB },
          say: "A thousand years older, and nearly word for word!",
        },
      ],
      after: [
        { say: "Old copies let us check the newer ones.", mood: "thinking", act: "nod" },
        { say: "But which books belong in the Bible at all?", mood: "curious", act: "tilt" },
      ],
    },
    {
      kind: "hbibleSort",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Early Christians read many writings.", mood: "curious", act: "nod" },
        { say: "Around AD 325, a historian named Eusebius wrote it down.", mood: "thinking", act: "tilt" },
      ],
      hint: "Sort each writing onto the shelf where Eusebius says it stood.",
      bins: [
        { id: "recognised", name: "Recognised", sub: "Read as Scripture everywhere" },
        { id: "disputed", name: "Disputed", sub: "Doubted by some, used by many" },
        { id: "not", name: "Not Scripture", sub: "Good reading, or rejected" },
      ],
      writings: [
        { id: "mark", name: "Gospel of Mark", what: "Jesus’ life, told fast", bin: "recognised", say: "Recognised. The four Gospels were never in doubt." },
        { id: "james", name: "James", what: "A letter on faith that works", bin: "disputed", say: "Disputed. Some doubted who wrote it, yet many read it." },
        { id: "hermas", name: "The Shepherd of Hermas", what: "Visions and teaching from Rome", bin: "not", say: "Not Scripture, though many loved it and read it aloud." },
        { id: "acts", name: "Acts", what: "Luke’s account of the first church", bin: "recognised", say: "Recognised. Eusebius lists it right after the Gospels." },
        { id: "2pet", name: "2 Peter", what: "A short letter in Peter’s name", bin: "disputed", say: "Disputed. It was accepted more slowly than 1 Peter." },
        { id: "gpeter", name: "Gospel of Peter", what: "A later gospel using Peter’s name", bin: "not", say: "Rejected. A bishop warned churches against it around AD 200." },
        { id: "1pet", name: "1 Peter", what: "Peter’s letter to scattered believers", bin: "recognised", say: "Recognised everywhere, Eusebius says." },
        { id: "jude", name: "Jude", what: "A one-page warning letter", bin: "disputed", say: "Disputed, but read in most churches, he adds." },
      ],
      nudge: "Not where Eusebius put it. Try another shelf.",
      source: "Following Eusebius, Church History 3.25 (c. AD 325). His own lists have more categories; three shelves keep it simple.",
      after: [
        { say: "Most books were never in question.", mood: "thinking", act: "nod" },
        { say: "Even Revelation took time. Eusebius listed it in two places!", mood: "cheeky", act: "tilt" },
      ],
    },
    {
      kind: "hbibleList",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Then, in AD 367, a bishop wrote an Easter letter.", mood: "curious", act: "nod" },
        { say: "His name was Athanasius, in Alexandria.", mood: "happy", act: "tilt" },
      ],
      hold: "Hold to unroll his letter. Watch the shelf.",
      books: ["Matt", "Mark", "Luke", "John", "Acts", "James", "1 Pet", "2 Pet", "1 John", "2 John", "3 John", "Jude", "Rom", "1 Cor", "2 Cor", "Gal", "Eph", "Phil", "Col", "1 Thess", "2 Thess", "Heb", "1 Tim", "2 Tim", "Titus", "Phlm", "Rev"],
      letter: "Twenty-seven books! The first list we know that matches ours.",
      councils: [{ year: 393, name: "Hippo" }, { year: 397, name: "Carthage" }],
      tests: [
        { name: "Linked to the apostles", body: "Written by an apostle, or someone close to one, the way tradition links Mark to Peter and Luke to Paul." },
        { name: "Read across the churches", body: "Used in worship far and wide, not only in one city." },
        { name: "True to the faith", body: "In line with what the apostles taught about Jesus: who he is, his death and his rising." },
      ],
      notes: [
        { tag: "record", text: "Athanasius’s Easter letter of 367 is the earliest known list of exactly these 27 books, in his own order." },
        { tag: "record", text: "Church councils at Hippo (393) and Carthage (397) affirmed the same list." },
        { tag: "debated", text: "Christians describe this as recognising books the churches already trusted, not inventing a Bible. Historians still discuss how quickly it settled." },
      ],
      after: [
        { say: "The list wasn’t made up in a day.", mood: "thinking", act: "nod" },
        { say: "Churches recognised it over centuries, reading these books.", mood: "moved", act: "settle" },
      ],
    },
    {
      kind: "hbibleShelves",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "One more honest detail.", mood: "curious", act: "nod" },
        { say: "Christians don’t all have the same Old Testament.", mood: "thinking", act: "tilt" },
      ],
      hint: "Tap each tradition to see its Old Testament shelf.",
      traditions: [
        { id: "protestant", name: "Protestant", count: "39 books", books: 39, extra: "The same books as the Hebrew Bible, which Jewish tradition counts as 24 by grouping some together.", say: "39 books, the same as the Hebrew Bible." },
        { id: "catholic", name: "Catholic", count: "46 books", books: 46, extra: "Seven more: Tobit, Judith, 1 and 2 Maccabees, Wisdom, Sirach and Baruch, plus longer Esther and Daniel. Catholics call them deuterocanonical.", say: "46 books. Seven more, called deuterocanonical." },
        { id: "orthodox", name: "Orthodox", count: "49 or more", books: 49, extra: "The Catholic seven and a few more, such as 1 Esdras, 3 Maccabees and the Prayer of Manasseh. The exact list varies between Orthodox churches.", say: "A few more again, and it varies by church." },
      ],
      note: { tag: "record", text: "The 27 New Testament books are the same in all three. The Old Testament differences trace back to Jewish writings in Greek that many early Christians read alongside the Hebrew books." },
      after: [
        { say: "Same 27 New Testament books in all three.", mood: "happy", act: "nod" },
        { say: "And now you know where yours came from.", mood: "moved", act: "settle" },
      ],
    },
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "Knowing how it reached you, how do you feel about your Bible?",
      options: [
        { text: "I trust it more", reply: "Many people feel that, seeing how carefully it was kept." },
        { text: "I have new questions", reply: "Good. Historians do too. Keep asking them." },
        { text: "I want to read it more", reply: "Start with Luke 1. He tells you why he wrote." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "How did we get the Bible?",
      body: "",
      summary: [
        "Copied by hand for centuries, in thousands of manuscripts that can be checked against each other.",
        "Very old copies survive, from the Isaiah scroll to a scrap of John 18.",
        "The 27 New Testament books were recognised over time; Athanasius listed them in 367.",
        "Protestant, Catholic and Orthodox Old Testaments differ in a few books.",
      ],
      refs: ["Luke 1:1–4", "Isaiah 40:8", "John 18:37", "2 Peter 3:15–16", "2 Timothy 3:16"],
      scripture: { label: "What the copies carried", text: "The grass withers, the flower fades; but the word of our God stands forever.", ref: "Isaiah 40:8", translation: WEB },
      sources: [
        { title: "Church History, Book 3, chapter 25", publisher: "Eusebius of Caesarea (c. 325)" },
        { title: "Festal Letter 39 (367)", publisher: "Athanasius of Alexandria" },
        { title: "Codex Sinaiticus Project", publisher: "British Library and partners", url: "https://codexsinaiticus.org" },
        { title: "The Great Isaiah Scroll", publisher: "The Israel Museum, Jerusalem" },
        { title: "Papyrus 52 (P. Ryl. Gk. 457)", publisher: "John Rylands Library, University of Manchester" },
      ],
      related: [
        { title: "What Happened to the First Christians?", sub: "Church History · 5 min", lessonId: "history-first" },
        { title: "The Gospel of Luke", sub: "Bible Books · 5 min", lessonId: "book-luke" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
