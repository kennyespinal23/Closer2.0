import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 003: "Who Wrote Hebrews?" Status: unresolved.
   What the case rests on, and how it's kept honest:
   - Scripture (World English Bible, word for word): Hebrews 1:1–2; 2:3; 13:22–24; Galatians 1:12; Acts 18:24.
   - The letter names no author; the title "of Paul" in some later Bibles isn't part of the original text.
   - Early views, described rather than quoted, as reported by Eusebius (Church History 6.14 and 6.25): Clement of
     Alexandria (Paul wrote it in Hebrew, Luke translated it into Greek) and Origen (the thoughts are Paul's, the
     wording someone else's; who wrote it, only God knows). Tertullian named Barnabas (On Modesty 20). Martin Luther
     suggested Apollos; Adolf von Harnack suggested Priscilla.
   - Style comparisons are scholars' observations, labelled as such. No candidate is presented as settled. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

const heb11 = v("God, having in the past spoken to the fathers through the prophets at many times and in various ways,", "Hebrews 1:1");
const heb23 = v("how will we escape if we neglect so great a salvation—which at the first having been spoken through the Lord, was confirmed to us by those who heard;", "Hebrews 2:3");
const heb1323 = v("Know that our brother Timothy has been freed, with whom, if he comes shortly, I will see you.", "Hebrews 13:23");
const heb1324 = v("Greet all of your leaders and all the saints. The Italians greet you.", "Hebrews 13:24");
const gal112 = v("For neither did I receive it from man, nor was I taught it, but it came to me through revelation of Jesus Christ.", "Galatians 1:12");
const acts1824 = v("Now a certain Jew named Apollos, an Alexandrian by race, an eloquent man, came to Ephesus. He was mighty in the Scriptures.", "Acts 18:24");

export const mysteryHebrews = {
  id: "mystery-hebrews",
  title: "Who Wrote Hebrews?",
  subtitle: "A letter with no name on it",
  kind: "Bible mystery",
  scripture: "Hebrews 1:1 · 2:3 · 13:22–24",
  minutes: 5,
  theme: "copper",
  case: { id: "003", status: "Unresolved" },
  sources: [
    { title: "Eusebius, Church History 6.14 and 6.25", publisher: "Reporting Clement of Alexandria and Origen, early 4th century" },
    { title: "Tertullian, On Modesty 20", publisher: "Early 3rd century" },
    { title: "Martin Luther’s suggestion of Apollos", publisher: "16th century" },
    { title: "Adolf von Harnack’s suggestion of Priscilla", publisher: "1900" },
    { title: "World English Bible", publisher: "Public domain" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Most New Testament letters start with a name: “Paul,” “Peter,” “James.”", mood: "curious", act: "tilt" },
        { say: "Hebrews doesn’t.", mood: "surprised", act: "react" },
        { say: "So who wrote it?", mood: "cheeky", act: "stare" },
      ],
      open: "An unsigned letter. Let’s open it!",
      title: "Who Wrote Hebrews?",
      refs: ["Hebrews 1:1", "Hebrews 2:3", "Hebrews 13:22–24"],
      after: [{ say: "We’ll read it like detectives: what does the letter say about its writer?", mood: "excited", act: "hop" }],
    },
    // 2. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Here are the clues inside the letter, and two from outside it.", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "open", title: "No greeting, no name", ref: "Hebrews 1:1", exhibit: { label: "Hebrews 1:1", verses: [heb11], note: "Compare Paul’s letters, which open with his name: “Paul, a servant of Jesus Christ…” (Romans 1:1)." } },
        { id: "heard", title: "Heard it from others", ref: "Hebrews 2:3", exhibit: { label: "Hebrews 2:3", verses: [heb23] } },
        { id: "tim", title: "“Our brother Timothy”", ref: "Hebrews 13:23", exhibit: { label: "Hebrews 13:23", verses: [heb1323] } },
        { id: "italy", title: "“The Italians greet you”", ref: "Hebrews 13:24", exhibit: { label: "Hebrews 13:24", verses: [heb1324] } },
        { id: "gal", title: "Paul: not taught by anyone", ref: "Galatians 1:12", exhibit: { label: "Galatians 1:12", verses: [gal112] } },
        { id: "apollos", title: "Apollos, eloquent", ref: "Acts 18:24", exhibit: { label: "Acts 18:24", verses: [acts1824] } },
      ],
      links: [
        {
          a: "heard", b: "gal", label: "Secondhand, or not?", strength: "inference",
          say: "Ooh, these two pull against each other!",
          body: "The writer says the message “was confirmed to us by those who heard.” Paul insists he received his gospel directly, “through revelation of Jesus Christ.” Many scholars think the two don’t sit easily together. Others answer that 2:3 could simply mean the writer includes himself with his readers.",
        },
        {
          a: "tim", b: "gal", label: "Paul’s circle", strength: "inference",
          say: "Timothy! He travelled with Paul.",
          body: "Timothy was one of Paul’s closest co-workers. So the writer knew Paul’s circle. That fits Paul, but it fits his friends just as well.",
        },
        {
          a: "open", b: "gal", label: "A missing signature", strength: "stated",
          say: "Paul always signs his letters.",
          body: "Paul’s letters begin with his name. Hebrews begins straight into its subject, more like a sermon; the writer even calls it a “word of exhortation” (13:22).",
        },
        {
          a: "apollos", b: "open", label: "An eloquent hand", strength: "inference",
          say: "Hebrews is written in very polished Greek.",
          body: "Scholars widely note that Hebrews’ Greek is among the most polished in the New Testament, and its style differs from Paul’s. Acts calls Apollos “eloquent” and “mighty in the Scriptures.” That’s why Luther suggested him. It’s a fit, not proof.",
        },
        {
          a: "italy", b: "tim", label: "Where was it written?", strength: "inference",
          say: "Even the place is a puzzle!",
          body: "“The Italians greet you” could mean people in Italy sending greetings, or Italians abroad greeting friends back home. Readers can’t tell which, so the letter’s location is uncertain too.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Interesting. Let’s sort what’s solid.", mood: "thinking", act: "nod" }],
    },
    // 3. Explore the theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Christians have suggested many names since the early centuries.", mood: "thinking" }],
      theories: [
        {
          title: "Paul", kind: "tradition", strength: "tradition",
          origin: "Accepted early in the churches of the East; later, the titles in many Bibles name Paul.",
          body: "Hebrews shares many of Paul’s themes, mentions Timothy, and was copied among Paul’s letters in early collections. Clement of Alexandria, as Eusebius reports, thought Paul wrote it in Hebrew and Luke translated it.",
          against: "No name, a different Greek style, and 2:3 sounds like someone who heard the message secondhand. The church in Rome long hesitated to call it Paul’s.",
          say: "The traditional answer, debated even in the early church.",
        },
        {
          title: "Paul’s thoughts, someone else’s words", kind: "tradition", strength: "tradition",
          origin: "Origen, an early 3rd-century scholar, as Eusebius reports.",
          body: "Origen thought the ideas were Paul’s but the wording someone else’s, perhaps a follower writing them down. And then, famously, he said that who actually wrote it, only God knows.",
          against: "A careful guess; Origen himself didn’t claim to know.",
          say: "Even in AD 200 they weren’t sure!",
        },
        {
          title: "Barnabas", kind: "tradition", strength: "tradition",
          origin: "Tertullian, early 3rd century.",
          body: "Barnabas was a Levite (Acts 4:36), which would fit the letter’s deep interest in priests and sacrifice, and he worked closely with Paul.",
          against: "Nothing in Hebrews names him, and few other early writers followed this view.",
          say: "A Levite writing about priests?",
        },
        {
          title: "Apollos", kind: "scholarship", strength: "inference",
          origin: "Suggested by Martin Luther in the 16th century; favoured by many since.",
          body: "An eloquent Jew from Alexandria, “mighty in the Scriptures” (Acts 18:24), known to Paul’s circle. The polished Greek and the careful use of the Old Testament fit him well.",
          against: "No early writer names him, and nothing he wrote survives to compare.",
          say: "A good fit, with no surviving writing to check.",
        },
        {
          title: "Priscilla", kind: "scholarship", strength: "unverified",
          origin: "Suggested by the scholar Adolf von Harnack in 1900.",
          body: "Priscilla taught Apollos (Acts 18:26) and worked with Paul. Harnack suggested her name may have been left off the letter because she was a woman.",
          against: "In 11:32 the writer refers to himself with a masculine Greek participle, which most scholars think rules this out.",
          say: "A bold suggestion, with a grammar problem.",
        },
      ],
      caveat: "None of these is proven. The letter is unsigned, and the earliest evidence already disagrees.",
      after: [{ say: "Now let’s test some claims.", mood: "excited", act: "nod" }],
    },
    // 4. Weigh the evidence
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims about Hebrews. Where does each one stand?", mood: "curious", act: "tilt" }],
      claims: [
        {
          text: "The writer of Hebrews knew Timothy.", fits: ["scripture"],
          why: "Hebrews 13:23 calls him “our brother Timothy” and hopes to travel with him.",
          exhibit: { label: "Hebrews 13:23", verses: [heb1323] },
        },
        {
          text: "The letter itself says Paul wrote it.", fits: ["unknown"],
          why: "It doesn’t. Titles naming Paul were added later. The text never names its author.",
          exhibit: { label: "Hebrews 1:1", verses: [heb11], note: "The letter begins without a greeting or a name. Titles like “The Epistle of Paul to the Hebrews” come from later copies and printed Bibles." },
        },
        {
          text: "Early church leaders disagreed about who wrote it.", fits: ["historical"],
          why: "As Eusebius reports, Clement and Origen held different views, and Tertullian named Barnabas. The disagreement is well documented.",
          exhibit: { label: "Eusebius, Church History 6.14, 6.25", note: "Eusebius, writing in the early 4th century, records Clement of Alexandria’s and Origen’s views on the letter’s authorship." },
        },
        {
          text: "Apollos wrote Hebrews.", fits: ["hypothesis"],
          why: "A thoughtful suggestion that fits the letter’s style and learning, but no ancient source names him.",
          exhibit: { label: "Acts 18:24", verses: [acts1824] },
        },
        {
          text: "The writer may have heard the gospel from others.", fits: ["hypothesis", "scripture"],
          why: "Hebrews 2:3 says the message “was confirmed to us by those who heard.” The words are in the text; what they tell us about the writer is a reading.",
          exhibit: { label: "Hebrews 2:3", verses: [heb23] },
        },
      ],
      after: [{ say: "Time to write it up.", mood: "excited", act: "hop" }],
    },
    // 5. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "Who Wrote Hebrews?",
      scripture: [
        "The letter never names its writer.",
        "The writer knew Timothy (13:23) and calls the letter “a word of exhortation” (13:22).",
        "He says the message was “confirmed to us by those who heard” (2:3).",
      ],
      uncertain: [
        "Who wrote it.",
        "Where it was written, and to whom exactly.",
        "Why the writer’s name was never included.",
      ],
      proposed: [
        "Paul (an early tradition, debated from the start).",
        "Paul’s ideas, written by a follower (Origen).",
        "Barnabas (Tertullian).",
        "Apollos (Luther, and many since).",
        "Priscilla (Harnack; most scholars think the grammar rules it out).",
      ],
      note: "Even the earliest Christians said they didn’t know. Saying so honestly is the finding.",
      refs: ["Hebrews 1:1–2", "Hebrews 2:3", "Hebrews 13:22–24", "Galatians 1:12", "Acts 18:24–26"],
      sources: [
        { title: "Eusebius, Church History 6.14 and 6.25", publisher: "Early 4th century" },
        { title: "Tertullian, On Modesty 20", publisher: "Early 3rd century" },
        { title: "Luther (Apollos) · Harnack (Priscilla)", publisher: "16th century · 1900" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
