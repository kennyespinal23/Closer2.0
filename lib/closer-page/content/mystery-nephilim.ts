import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 002: "Who Were the Nephilim?" Status: unresolved.
   What the case rests on, and how it's kept honest:
   - Scripture (World English Bible, word for word): Genesis 6:1–5; Numbers 13:32–33; Job 1:6; Jude 6; 2 Peter 2:4;
     Genesis 4:25–26.
   - No artifact, inscription or physical evidence exists, so there is no inspector and no timeline: the case is
     words, and how readers have read them.
   - Readings, each labelled as a reading: heavenly beings (1 Enoch's Book of Watchers, a Jewish text from the last
     centuries BC; Josephus; many early Christian writers), the line of Seth (a later Christian reading, e.g. Augustine,
     City of God 15.23), human rulers (an Aramaic translation, Targum Onkelos, renders "God's sons" as sons of nobles).
   - The Greek translation (the Septuagint) renders the word "giants"; the Hebrew word's origin is debated (many
     connect it with a verb meaning "to fall"). Neither is stated as fact. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

const gen62 = v("God’s sons saw that men’s daughters were beautiful, and they took any that they wanted for themselves as wives.", "Genesis 6:2");
const gen64 = v("The Nephilim were in the earth in those days, and also after that, when God’s sons came in to men’s daughters and had children with them. Those were the mighty men who were of old, men of renown.", "Genesis 6:4");
const num1333 = v("There we saw the Nephilim, the sons of Anak, who come from the Nephilim. We were in our own sight as grasshoppers, and so we were in their sight.", "Numbers 13:33");

export const mysteryNephilim = {
  id: "mystery-nephilim",
  title: "Who Were the Nephilim?",
  subtitle: "Four verses, and centuries of questions",
  kind: "Bible mystery",
  scripture: "Genesis 6:1–4 · Numbers 13:33",
  minutes: 5,
  theme: "copper",
  case: { id: "002", status: "Unresolved" },
  sources: [
    { title: "1 Enoch 6–16 (the Book of Watchers)", publisher: "Jewish text, last centuries BC; not in most Bibles" },
    { title: "Josephus, Antiquities of the Jews 1.73", publisher: "Jewish historian, 1st century AD" },
    { title: "Augustine, City of God 15.23", publisher: "Christian bishop, 5th century AD" },
    { title: "Targum Onkelos on Genesis 6:2", publisher: "Aramaic translation of the Torah" },
    { title: "World English Bible", publisher: "Public domain" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Four short verses in Genesis have puzzled readers for over two thousand years.", mood: "curious", act: "tilt" },
        { say: "The Nephilim.", mood: "surprised", act: "react" },
        { say: "So who were they?", mood: "cheeky", act: "stare" },
      ],
      open: "The file’s thin. Open it anyway!",
      title: "Who Were the Nephilim?",
      refs: ["Genesis 6:1–4", "Numbers 13:33", "Job 1:6", "Jude 6"],
      after: [{ say: "No bones, no tablets. Just words. So let’s read very carefully.", mood: "excited", act: "hop" }],
    },
    // 2. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Here’s every clue we’ve got. It’s all text.", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "sons", title: "“God’s sons” take wives", ref: "Genesis 6:2", exhibit: { label: "Genesis 6:2", verses: [gen62] } },
        { id: "neph", title: "“The Nephilim were in the earth”", ref: "Genesis 6:4", exhibit: { label: "Genesis 6:4", verses: [gen64] } },
        { id: "spies", title: "The spies see Nephilim", ref: "Numbers 13:33", exhibit: { label: "Numbers 13:32–33", verses: [v("They brought up an evil report of the land which they had spied out to the children of Israel, saying, “The land, through which we have gone to spy it out, is a land that eats up its inhabitants; and all the people who we saw in it are men of great stature.", "Numbers 13:32"), num1333] } },
        { id: "job", title: "“God’s sons” in heaven", ref: "Job 1:6", exhibit: { label: "Job 1:6", verses: [v("Now on the day when God’s sons came to present themselves before Yahweh, Satan also came among them.", "Job 1:6")] } },
        { id: "jude", title: "Angels who left their place", ref: "Jude 6", exhibit: { label: "Jude 6 · 2 Peter 2:4", verses: [v("Angels who didn’t keep their first domain, but deserted their own dwelling place, he has kept in everlasting bonds under darkness for the judgment of the great day.", "Jude 1:6"), v("For if God didn’t spare angels when they sinned, but cast them down to Tartarus, and committed them to pits of darkness, to be reserved for judgment;", "2 Peter 2:4")], note: "Neither passage names Genesis 6. Whether they refer to it is itself a reading." } },
        { id: "seth", title: "Seth’s line calls on God", ref: "Genesis 4:26", exhibit: { label: "Genesis 4:25–26", verses: [v("A son was also born to Seth, and he named him Enosh. At that time men began to call on Yahweh’s name.", "Genesis 4:26")] } },
      ],
      links: [
        {
          a: "sons", b: "job", label: "Same phrase, other book", strength: "inference",
          say: "“God’s sons” turns up in Job too!",
          body: "In Job, “God’s sons” come before Yahweh in heaven, with Satan among them. If the phrase means the same in Genesis 6, these are heavenly beings. That’s a strong argument, but a phrase can mean different things in different books.",
        },
        {
          a: "sons", b: "neph", label: "Who are their children?", strength: "inference",
          say: "Wait, read verse 4 slowly.",
          body: "Verse 4 says the Nephilim were around “in those days, and also after that,” when God’s sons had children. Readers differ on whether the Nephilim are those children, or simply people who lived at the same time. The grammar allows both.",
        },
        {
          a: "neph", b: "spies", label: "After the flood?", strength: "stated",
          say: "Nephilim, again, centuries later!",
          body: "The spies say they saw Nephilim in Canaan. Genesis 6:4 itself says “and also after that.” The puzzle: if the flood wiped out everyone but Noah’s family, how were there Nephilim later? Some take the spies’ word as fact; others note it’s called “an evil report” (13:32), a frightened exaggeration.",
        },
        {
          a: "sons", b: "jude", label: "Angels who left their place", strength: "inference",
          say: "Some readers link these two.",
          body: "Jude and 2 Peter speak of angels who sinned and left their place. Many early readers, and many today, connect this with Genesis 6. Neither letter mentions Genesis 6 by name, so the link is a reading, not a statement.",
        },
        {
          a: "sons", b: "seth", label: "A different family tree", strength: "inference",
          say: "Here’s a completely different idea.",
          body: "Genesis 4 ends with Seth’s family calling on Yahweh’s name. Some later Christian readers took “God’s sons” to mean Seth’s faithful line, and “men’s daughters” to mean Cain’s. The text doesn’t say so; it’s a reading built from the order of the chapters.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Lots of threads, all from a few verses. Let’s sort what’s actually said.", mood: "thinking", act: "nod" }],
    },
    // 3. Weigh the evidence
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims you might hear about the Nephilim. Where do they stand?", mood: "curious", act: "tilt" }],
      claims: [
        {
          text: "Genesis says the Nephilim were “the mighty men who were of old, men of renown.”", fits: ["scripture"],
          why: "Genesis 6:4 says it in so many words. Whether that phrase describes the Nephilim or the children of God’s sons is debated.",
          exhibit: { label: "Genesis 6:4", verses: [gen64] },
        },
        {
          text: "The Nephilim were giants.", fits: ["hypothesis"],
          why: "The Greek translation renders the word as “giants,” and the spies felt like grasshoppers beside them. But Genesis 6 never gives their size, and the spies’ report is called “evil.”",
          exhibit: { label: "Numbers 13:33", verses: [num1333], note: "The Septuagint, an ancient Greek translation, uses the word for “giants”. That’s an interpretation made by translators." },
        },
        {
          text: "“God’s sons” were angels.", fits: ["hypothesis"],
          why: "A very old and widely held reading, supported by the phrase in Job 1:6. But Genesis 6 doesn’t say “angels,” so it stays a reading.",
          exhibit: { label: "Job 1:6", verses: [v("Now on the day when God’s sons came to present themselves before Yahweh, Satan also came among them.", "Job 1:6")] },
        },
        {
          text: "Ancient bones of the Nephilim have been found.", fits: ["unknown"],
          why: "No archaeological find has been shown to be Nephilim remains. Claims online are unverified or hoaxes.",
          exhibit: { label: "The record", note: "There is no physical evidence of the Nephilim. Everything we know comes from a few biblical verses and later writings about them." },
        },
        {
          text: "The Book of 1 Enoch tells a longer story about them.", fits: ["historical"],
          why: "It does: 1 Enoch’s Book of Watchers tells of angels taking wives and giants being born. That it says this is historical fact; whether it’s right is another question. It isn’t in most Bibles.",
          exhibit: { label: "1 Enoch 6–16", note: "A Jewish text from the last few centuries BC, known from manuscripts including fragments among the Dead Sea Scrolls. It expands Genesis 6 into a long story about “Watchers”." },
        },
      ],
      after: [{ say: "Very little is stated. A lot is read in. Now, the theories!", mood: "excited", act: "hop" }],
    },
    // 4. Explore the theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Three main readings have been around for centuries.", mood: "thinking" }],
      theories: [
        {
          title: "Heavenly beings and human women", kind: "tradition", strength: "tradition",
          origin: "1 Enoch; the historian Josephus; many early Christian writers. Held by many scholars today.",
          body: "“God’s sons” are heavenly beings, as in Job 1:6, who took human wives. Their children were the Nephilim, or lived alongside them. Some connect Jude 6 and 2 Peter 2:4.",
          against: "Genesis never says “angels,” and Jesus says angels don’t marry (Matthew 22:30), though that may speak only of angels in heaven.",
          say: "The oldest reading we know of.",
        },
        {
          title: "Seth’s line and Cain’s", kind: "tradition", strength: "tradition",
          origin: "Later Christian interpreters, such as Augustine (City of God 15.23).",
          body: "“God’s sons” are the faithful descendants of Seth; “men’s daughters” are from Cain’s line. Their mixing marks the world’s slide into wickedness (6:5).",
          against: "The text never names Seth or Cain here, and doesn’t explain why such marriages would produce “mighty men.”",
          say: "Built from the order of the chapters.",
        },
        {
          title: "Kings and powerful men", kind: "scholarship", strength: "inference",
          origin: "Some ancient Jewish translators and interpreters; an Aramaic translation (Targum Onkelos) speaks of sons of nobles.",
          body: "“God’s sons” are rulers who took any women they wanted, a picture of power abused. The Nephilim are famous warriors of old.",
          against: "Elsewhere, “God’s sons” isn’t a title for kings, and nothing in the passage says “kings.”",
          say: "Power, not the supernatural.",
        },
      ],
      caveat: "None of these can be proved from the text alone. They’re ways faithful readers have tried to make sense of four very compressed verses.",
      after: [{ say: "Time to file the report.", mood: "excited", act: "nod" }],
    },
    // 5. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "Who Were the Nephilim?",
      scripture: [
        "The Nephilim were on the earth “in those days, and also after that” (Genesis 6:4).",
        "Their time is linked with “God’s sons” taking wives, and with “mighty men… of renown.”",
        "Israel’s spies later reported seeing Nephilim in Canaan (Numbers 13:33).",
      ],
      uncertain: [
        "Who “God’s sons” were.",
        "Whether the Nephilim were their children, or lived alongside them.",
        "How there were Nephilim after the flood, and how big they were, if at all.",
      ],
      proposed: [
        "Heavenly beings and human women (1 Enoch, Josephus, many early readers).",
        "Seth’s line and Cain’s (later Christian readers, such as Augustine).",
        "Powerful human rulers (some ancient Jewish interpreters).",
      ],
      note: "A short text can carry a big question. Knowing exactly what it says, and doesn’t, is the finding.",
      refs: ["Genesis 6:1–5", "Numbers 13:32–33", "Job 1:6", "Jude 6", "2 Peter 2:4"],
      sources: [
        { title: "1 Enoch 6–16 (the Book of Watchers)", publisher: "Jewish text, last centuries BC" },
        { title: "Josephus, Antiquities of the Jews 1.73", publisher: "1st century AD" },
        { title: "Augustine, City of God 15.23", publisher: "5th century AD" },
        { title: "Targum Onkelos on Genesis 6:2", publisher: "Aramaic translation" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
