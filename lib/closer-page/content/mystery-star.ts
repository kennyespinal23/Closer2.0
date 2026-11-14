import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 007: "What Was the Star of Bethlehem?" Status: unresolved.
   What the case rests on, and how it's kept honest:
   - Only Matthew records the star (2:1–12). The WEB says the magi saw it "in the east"; some translations read
     "at its rising". The star "went before them" and "stood over" the place (2:9): hard to fit to ordinary
     astronomy, and readers disagree whether Matthew means a natural event at all.
   - Dating clues: Jesus born "in the days of King Herod" (2:1); Herod asks the exact time the star appeared and
     kills boys "two years old and under" (2:7, 16); Herod died (2:19), usually dated 4 BC from Josephus (some argue
     1 BC): a scholars' reckoning, not a date in the text.
   - Proposals, each labelled: a Jupiter–Saturn conjunction in 7 BC (Kepler famously proposed a conjunction);
     a comet or new star (some cite Chinese records of a long-lasting "broom star" around 5 BC); an astrological
     sign that magi would read (some propose Jupiter as a royal planet); a miraculous sign. None is established.
   - Numbers 24:17 ("A star will come out of Jacob") is a text some readers connect; Matthew doesn't quote it.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const mysteryStar = {
  id: "mystery-star",
  title: "What Was the Star of Bethlehem?",
  subtitle: "A light only Matthew mentions",
  kind: "Bible mystery",
  scripture: "Matthew 2:1–12",
  minutes: 5,
  theme: "copper",
  case: { id: "007", status: "Unresolved" },
  sources: [
    { title: "Matthew 2:1–19", publisher: "World English Bible" },
    { title: "Josephus, Antiquities of the Jews 17 (Herod’s death)", publisher: "1st-century Jewish historian" },
    { title: "Johannes Kepler, De Stella Nova (1606)", publisher: "On the conjunction theory" },
    { title: "Han dynasty astronomical records (as cited for a ‘broom star’ c. 5 BC)", publisher: "Chinese court records, as reported by modern writers" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Visitors from the east follow a star to a child.", mood: "curious", act: "tilt" },
        { say: "Only one Gospel tells the story.", mood: "surprised", act: "react" },
        { say: "So what did they actually see?", mood: "cheeky", act: "stare" },
      ],
      open: "Here’s the file. Open it up!",
      title: "What Was the Star of Bethlehem?",
      refs: ["Matthew 2:1–12", "Matthew 2:16", "Matthew 2:19", "Numbers 24:17"],
      after: [{ say: "First, exactly what Matthew says. No more, no less.", mood: "excited", act: "hop" }],
    },
    // 2. The order of events
    {
      kind: "caseTimeline",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Four moments from Matthew 2. Put them in order.", mood: "curious", act: "tilt" }],
      hint: "Earliest first. Tap Read to check any card.",
      cards: [
        {
          id: "seen", when: "First", title: "The magi see a star “in the east”", basis: "stated",
          body: "They see it before they travel. Some translations say “at its rising.”",
          exhibit: { label: "Matthew 2:2", verses: [v("“Where is he who is born King of the Jews? For we saw his star in the east, and have come to worship him.”", "Matthew 2:2")] },
        },
        {
          id: "herod", when: "In Jerusalem", title: "Herod asks exactly when the star appeared", basis: "stated",
          body: "The king wants the timing. Matthew doesn’t tell us the answer.",
          exhibit: { label: "Matthew 2:7", verses: [v("Then Herod secretly called the wise men, and learned from them exactly what time the star appeared.", "Matthew 2:7")] },
        },
        {
          id: "stood", when: "On to Bethlehem", title: "The star goes ahead and stands over the place", basis: "stated",
          body: "It leads them to a house where they find “the young child.”",
          exhibit: { label: "Matthew 2:9–11", verses: [v("They, having heard the king, went their way; and behold, the star, which they saw in the east, went before them, until it came and stood over where the young child was.", "Matthew 2:9"), v("They came into the house and saw the young child with Mary, his mother", "Matthew 2:11")] },
        },
        {
          id: "two", when: "Afterwards", title: "Herod orders boys two and under killed", basis: "inference",
          body: "He goes by the time the magi gave him, which suggests the star appeared up to two years earlier. That’s an inference.",
          exhibit: { label: "Matthew 2:16", verses: [v("from two years old and under, according to the exact time which he had learned from the wise men.", "Matthew 2:16")], note: "The verse states the order; the timing it implies is a reader’s inference." },
        },
      ],
      inOrder: "Spot on. And notice the timing clue in the last card.",
      outOfOrder: "Close! Here’s Matthew’s order. Notice the timing clue at the end.",
      after: [
        { say: "Herod asked about timing. That gives us a clue.", mood: "thinking" },
        { say: "Let’s pin the clues up and see what connects.", mood: "excited", act: "hop" },
      ],
    },
    // 3. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Evidence board time!", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "east", title: "“His star in the east”", ref: "Matthew 2:2", exhibit: { label: "Matthew 2:2", verses: [v("For we saw his star in the east, and have come to worship him.", "Matthew 2:2")] } },
        { id: "stood", title: "It stood over the place", ref: "Matthew 2:9", exhibit: { label: "Matthew 2:9", verses: [v("the star, which they saw in the east, went before them, until it came and stood over where the young child was.", "Matthew 2:9")] } },
        { id: "herodtime", title: "Herod asks the exact time", ref: "Matthew 2:7", exhibit: { label: "Matthew 2:7", verses: [v("Then Herod secretly called the wise men, and learned from them exactly what time the star appeared.", "Matthew 2:7")] } },
        { id: "twoyears", title: "Boys two and under", ref: "Matthew 2:16", exhibit: { label: "Matthew 2:16", verses: [v("from two years old and under, according to the exact time which he had learned from the wise men.", "Matthew 2:16")] } },
        { id: "herodead", title: "Herod dies", ref: "Matthew 2:19", exhibit: { label: "Matthew 2:19", verses: [v("But when Herod was dead, behold, an angel of the Lord appeared in a dream to Joseph in Egypt", "Matthew 2:19")], note: "Matthew gives no year. Historians usually date Herod’s death to 4 BC, from the historian Josephus; some argue for 1 BC." } },
        { id: "jacob", title: "“A star will come out of Jacob”", ref: "Numbers 24:17", exhibit: { label: "Numbers 24:17", verses: [v("A star will come out of Jacob.", "Numbers 24:17")], note: "An old prophecy about a coming ruler. Matthew doesn’t quote it." } },
      ],
      links: [
        {
          a: "herodtime", b: "twoyears", label: "A timing clue", strength: "inference",
          say: "Two years! The star may have shown up a while back.",
          body: "Herod asks exactly when the star appeared, then kills boys “two years old and under, according to the exact time.” That suggests the star appeared up to two years before. Matthew never states the date.",
        },
        {
          a: "twoyears", b: "herodead", label: "Before Herod’s death", strength: "inference",
          say: "So it happened before Herod died.",
          body: "Herod is alive when the magi come and dies afterwards (2:19). If he died in 4 BC, as most historians think, the star appeared a few years earlier; some argue for 1 BC instead. That’s why many proposals look at about 7–4 BC.",
        },
        {
          a: "east", b: "stood", label: "Hard to fit to the sky", strength: "stated",
          say: "Wait. Stars don’t usually stop over houses…",
          body: "Matthew says the star “went before them” and “stood over” the place. Ordinary stars and planets don’t do that, which is why readers disagree: was this a natural event described from the ground, or a sign beyond astronomy?",
        },
        {
          a: "east", b: "jacob", label: "An old prophecy?", strength: "inference",
          say: "A star connected to a coming king…",
          body: "Numbers 24:17 speaks of “a star” coming out of Jacob, a ruler for Israel. Some readers connect it to Matthew 2. Matthew never quotes it, so this is a reading, not something the text says.",
        },
        {
          a: "east", b: "herodtime", label: "Only the magi saw it coming", strength: "inference",
          say: "Herod had to ask them about it!",
          body: "Herod has to ask the magi when the star appeared. That might suggest it wasn’t something everyone in Jerusalem had noticed, though Matthew doesn’t say so either way.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Some threads are timing. Some are mystery. Let’s weigh them.", mood: "thinking", act: "nod" }],
    },
    // 4. Weigh the evidence
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims people make about the star. Where does each stand?", mood: "curious", act: "tilt" }],
      claims: [
        {
          text: "Magi saw a star and travelled to find a newborn king.", fits: ["scripture"],
          why: "Matthew 2:2 says it in their own words.",
          exhibit: { label: "Matthew 2:2", verses: [v("“Where is he who is born King of the Jews? For we saw his star in the east, and have come to worship him.”", "Matthew 2:2")] },
        },
        {
          text: "There were three wise men.", fits: ["unknown"],
          why: "Matthew lists three gifts but never says how many magi came. “Three” is a later tradition.",
          exhibit: { label: "Matthew 2:11", verses: [v("Opening their treasures, they offered to him gifts: gold, frankincense, and myrrh.", "Matthew 2:11")], note: "Three gifts are named. The number of visitors isn’t." },
        },
        {
          text: "Herod died around 4 BC.", fits: ["historical"],
          why: "Matthew says Herod died but gives no year. The date comes from historians reading Josephus; most say 4 BC, some argue 1 BC.",
          exhibit: { label: "Matthew 2:19 · Josephus", verses: [v("But when Herod was dead, behold, an angel of the Lord appeared in a dream to Joseph in Egypt", "Matthew 2:19")], note: "The year is worked out from Josephus, a first-century historian, not from Matthew." },
        },
        {
          text: "The star was a conjunction of Jupiter and Saturn.", fits: ["hypothesis"],
          why: "A real conjunction did happen in 7 BC, and Kepler famously proposed something like it. Whether that’s what Matthew describes is a hypothesis.",
          exhibit: { label: "The conjunction theory", note: "Astronomers can calculate past planetary positions. Jupiter and Saturn met three times in 7 BC. Matching that to Matthew’s star is the proposal." },
        },
        {
          text: "We know exactly what the star was.", fits: ["unknown"],
          why: "Only Matthew records it, and he doesn’t describe it in astronomical terms. That part of the case is open.",
          exhibit: { label: "The record", note: "No other ancient text clearly identifies the star of Matthew 2." },
        },
      ],
      after: [{ say: "Solid story, uncertain sky. Now the theories!", mood: "excited", act: "hop" }],
    },
    // 5. The theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Astronomers, historians and theologians have all had a go.", mood: "thinking" }],
      theories: [
        {
          title: "A meeting of planets", kind: "scholarship", strength: "inference",
          origin: "Proposed by Johannes Kepler in the 1600s; developed by modern astronomers.",
          body: "Jupiter and Saturn met three times in 7 BC, in the constellation Pisces. To watchers of the sky, that could look like a sign.",
          against: "A conjunction doesn’t move ahead of travellers or stop over a house (2:9).",
          say: "Real astronomy. Does it fit Matthew? Debated.",
        },
        {
          title: "A comet or a new star", kind: "scholarship", strength: "inference",
          origin: "Some cite Chinese court records of a long-lasting “broom star” around 5 BC.",
          body: "A comet or a nova would be bright, new and memorable, the kind of thing someone might travel because of.",
          against: "Linking those records to Matthew is a proposal, and comets were often read as bad omens.",
          say: "A bright newcomer in the sky…",
        },
        {
          title: "A sign magi would read", kind: "scholarship", strength: "inference",
          origin: "Some propose readings based on ancient astrology, such as Jupiter as a royal planet.",
          body: "Magi were sky-watchers. Something ordinary people missed might mean “a king is born” to them.",
          against: "It depends on reconstructing how ancient astrologers thought; scholars disagree on the details.",
          say: "Maybe the meaning mattered more than the brightness.",
        },
        {
          title: "A miraculous sign", kind: "tradition", strength: "tradition",
          origin: "A long-held Christian reading of Matthew 2.",
          body: "A light given by God for this purpose, which is why it could go ahead of them and stop over the place.",
          against: "It can’t be tested by astronomy, by its nature.",
          say: "Many readers take it this way.",
        },
        {
          title: "A story with a meaning", kind: "scholarship", strength: "inference",
          origin: "Some scholars read Matthew 2 mainly as theology, echoing Numbers 24:17.",
          body: "On this view the point is who the child is: a king even foreigners come to honour.",
          against: "Matthew tells it as an event, and many readers take it as history.",
          say: "Some focus on what it means, not what it was.",
        },
      ],
      caveat: "None of these is proven. Some readers combine them. The honest answer is still: we don’t know what the magi saw.",
      after: [{ say: "Let’s rebuild what we can actually show.", mood: "excited", act: "nod" }],
    },
    // 6. Reconstruct the case
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Last job: rebuild the case.", mood: "thinking" },
        { say: "Where the record is silent, we leave a gap.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of evidence.",
      slots: [
        { id: "seen", when: "Before the visit", text: "Magi see “his star in the east”", ref: "Matthew 2:2" },
        { gap: "What the star actually was", say: "Nothing in the record settles this. We leave it open." },
        { id: "herod", when: "In Jerusalem", text: "Herod asks when it appeared", ref: "Matthew 2:7" },
        { id: "stood", when: "In Bethlehem", text: "It stands over the place", ref: "Matthew 2:9" },
        { id: "dead", when: "Afterwards", text: "Herod dies (often dated 4 BC)", ref: "Matthew 2:19" },
        { gap: "The exact year", say: "Clues narrow it down. None pins it." },
      ],
      theory: { text: "A conjunction in 7 BC?", say: "That can sit beside the gap as a possibility. It doesn’t fill it." },
      after: [{ say: "Four solid pieces. Two honest gaps.", mood: "moved", act: "nod" }],
    },
    // 7. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "What Was the Star of Bethlehem?",
      scripture: [
        "Magi from the east saw “his star” and came to worship a newborn king (Matthew 2:2).",
        "Herod asked when it appeared, and later killed boys two and under (2:7, 16).",
        "The star went ahead of them and stood over where the child was (2:9).",
      ],
      uncertain: [
        "What the star was, in astronomical terms.",
        "The exact year: Herod’s death is usually dated 4 BC, but some argue for 1 BC.",
        "Whether Matthew describes a natural event, a miraculous one, or both.",
      ],
      proposed: [
        "A Jupiter–Saturn conjunction in 7 BC (Kepler’s idea, developed by astronomers).",
        "A comet or new star (some cite Chinese records around 5 BC).",
        "A sign read by astrologers, such as Jupiter as a royal planet.",
        "A miraculous sign (a long-held Christian reading).",
      ],
      note: "Only Matthew tells this story, and he cares more about the king than the sky. The star stays a mystery; the child it pointed to is the point.",
      refs: ["Matthew 2:1–19", "Numbers 24:17"],
      sources: [
        { title: "Josephus, Antiquities of the Jews 17", publisher: "On Herod’s death" },
        { title: "Johannes Kepler, De Stella Nova (1606)", publisher: "The conjunction theory" },
        { title: "Han dynasty records of a ‘broom star’ c. 5 BC", publisher: "As cited by modern writers" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
