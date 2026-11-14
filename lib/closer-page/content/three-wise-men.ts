import type { Lesson } from "../lesson/types";

/* Misconception: "There were three wise men."
   Kind: a traditional detail Scripture never gives (MYTH_TYPES.tradition). Matthew 2 says "wise men from
   the east" with no number; the three gifts (2:11) are the likely source of "three". Their names and the
   idea that they were kings come from later tradition. Matthew also says they came "into the house".
   Nothing here is wrong to picture; it's just not in the text.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const claim = "There were three wise men.";
const truth = "Matthew never says how many wise men came. He tells us they followed the star a long way to worship Jesus.";
const matt = {
  text: "Now when Jesus was born in Bethlehem of Judea in the days of King Herod, behold, wise men from the east came to Jerusalem, saying, “Where is he who is born King of the Jews? For we saw his star in the east, and have come to worship him.”",
  ref: "Matthew 2:1–2",
  translation: WEB,
};

export const threeWiseMen = {
  id: "three-wise-men",
  title: "Three wise men?",
  subtitle: "Count again",
  kind: "Misconception",
  scripture: "Matthew 2",
  minutes: 4,
  theme: "navy",
  blocks: [
    {
      kind: "claim",
      page: { at: "hero", act: "enter", mood: "excited" },
      claim,
      lines: [
        { say: "Picture a nativity scene.", mood: "happy" },
        { say: "Shepherds, a manger, and the three wise men.", mood: "cheeky", act: "stare" },
        { say: "Does the Bible actually say three?", show: "claim", at: "top", mood: "curious", act: "tilt" },
      ],
      options: [
        { text: "Yes", reply: "It’s in every nativity set I’ve ever seen. Let’s count.", mood: "happy", act: "nod" },
        { text: "No", reply: "Hmm. You might be onto something. Let’s check.", mood: "cheeky", act: "stare" },
        { text: "I’m not sure", reply: "Good. Let’s go count them ourselves.", mood: "excited", act: "hop" },
      ],
    },
    {
      kind: "read",
      page: { at: "top", mood: "curious", open: true },
      label: "Clue 1",
      lead: [{ say: "Here’s where they show up.", mood: "curious", open: true }],
      verse: matt,
      reply: "I’ve read it",
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse: matt,
      target: "wise men from the east",
      before: [{ say: "Find the wise men. How many does it say?", show: "verse", mood: "curious", act: "tilt", open: false }],
      prompt: "Mark the wise men, or tap them",
      after: [
        { say: "No number!", at: "top", mood: "surprised", act: "spin" },
        { say: "Just “wise men from the east.” Could be two. Could be twelve.", mood: "cheeky", act: "stare" },
        { say: "So where does three come from?", mood: "curious", act: "tilt" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Clue number two. The moment they find him.", mood: "cheeky", act: "stare", open: true },
        { say: "Look closely at this one.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "They came into the house and saw the young child with Mary, his mother, and they fell down and worshiped him. Opening their treasures, they offered to him gifts: gold, frankincense, and myrrh.",
        ref: "Matthew 2:11",
        translation: WEB,
      },
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "came into the house", label: "A house", note: "A house! Not quite the manger scene, is it?" },
        { phrase: "gold, frankincense, and myrrh", label: "Three gifts", note: "Three gifts. That’s probably where “three” comes from." },
      ],
      after: [
        { say: "Three gifts, so people pictured three givers.", at: "top", mood: "thinking", open: false },
        { say: "Later traditions gave them names and crowns too. Matthew doesn’t.", mood: "cheeky" },
        { say: "What he does tell us: they came a long way, just to worship.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "correct",
      page: { at: "top", mood: "cheeky" },
      claim,
      type: "tradition",
      before: [
        { say: "Back to the nativity scene.", mood: "cheeky", act: "stare" },
        { say: "Based on the evidence…", mood: "curious", act: "tilt" },
      ],
      action: "Cross it out",
      after: [
        { say: "It’s tradition. Keep your nativity set, just know which part it is.", show: "type", mood: "excited" },
        { say: "Here’s what Scripture actually shows.", show: "truth", mood: "moved", act: "nod" },
      ],
      truth,
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Three wise men?",
      lines: [
        { say: "The number isn’t the point. The journey is.", mood: "tender" },
        { say: "They came a long way just to worship him.", mood: "moved" },
      ],
      ask: "What could you bring to Jesus this week?",
      write: "Write it down",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      title: "Case closed.",
      body: "The Lord is always closer than you think.",
      myth: { claim, truth, refs: ["Matthew 2:1–2", "Matthew 2:11"], type: "tradition" },
      verse: matt,
      button: "Finish",
    },
  ],
} satisfies Lesson;
