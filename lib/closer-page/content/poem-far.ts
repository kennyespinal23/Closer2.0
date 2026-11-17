import type { Lesson } from "../lesson/types";

/* Closer Poetry: When I Feel Far Away
   A poem you walk. The road home at night, a lantern, one window lit on the far hill. Hold to walk; each stretch of
   road ends in a stanza. On the last stretch Page asks you to stop, and the light comes down the road to you
   instead: the father in Jesus' story, who ran while his son was "still far off" (Luke 15:20). Then dawn, the poem
   whole on one page, and a prayer if you want one.

   Kept honest, line by line:
   - The poem is original. Scripture is the World English Bible, word for word, shown labelled and apart from it;
     Psalm 139's line breaks are joined with spaces.
   - The running light stands for the father in Jesus' parable; nobody is drawn, and Jesus himself is not shown.
   - Page is a guide, not God's voice: he points to what the passages say, he doesn't promise on God's behalf.
   - The prayer is optional, and nothing here is saved or scored. */

const WEB = "World English Bible";

const stretches = [
  { dark: 0.15, lines: ["I said my prayers tonight", "the way you check a locked door.", "Twice. Quickly.", "Not sure anyone heard."] },
  { dark: 0.3, lines: ["On Sunday I stood with everyone", "and sang the words on the screen.", "It felt like a party at someone else’s house.", "I kept my coat on."] },
  { dark: 0.5, lines: ["At two in the morning", "the phone was the brightest thing in the room.", "I scrolled past a hundred lives,", "looking for the way back to mine."] },
  {
    dark: 0.95,
    lines: ["Somewhere along this road", "I stopped saying your name out loud.", "I told myself you’d gone quiet.", "Maybe I had."],
    verse: { text: "If I say, “Surely the darkness will overwhelm me; the light around me will be night”; even the darkness doesn’t hide from you, but the night shines as the day. The darkness is like light to you.", ref: "Psalm 139:11–12", translation: WEB },
  },
  { dark: 0.4, lines: ["I’m walking back with nothing ready.", "No better words. No clean record.", "Just this road,", "and one light on in the window."] },
];
const turn = ["And then the light was moving.", "Not waiting at the door.", "Running.", "Down the road, toward me,", "while I was still far off."];
const close = ["I had a speech.", "I never got to finish it."];

export const poemFar = {
  id: "poem-far",
  title: "When I Feel Far Away",
  subtitle: "A poem you walk through",
  kind: "Closer Poetry",
  scripture: "Luke 15:20 · Psalm 139:11–12",
  minutes: 5,
  theme: "dusk",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      display: { text: "When I Feel Far Away", sub: "Closer Poetry · 5 min" },
      lines: [
        { say: "This one is a poem. You don’t read it, you walk it.", mood: "tender", act: "settle" },
        { say: "It’s for the days God feels a long way off.", mood: "moved", act: "nod" },
      ],
      reply: "Show me the road",
    },
    {
      kind: "pfarRoad",
      before: [
        { say: "Hold the button to walk the lantern home.", at: "top", mood: "curious", act: "tilt" },
        { say: "Go as slowly as you like. The words will wait.", at: "top", mood: "tender", act: "nod" },
      ],
      hold: "Hold to walk",
      walking: "Walking…",
      stretches,
      stop: "Wait. Stop walking. Look at the window.",
      turn,
      verse: { text: "He arose, and came to his father. But while he was still far off, his father saw him, and was moved with compassion, and ran, and fell on his neck, and kissed him.", ref: "Luke 15:20", translation: WEB },
      close,
      after: [
        { say: "Jesus told that story so we’d know what God is like.", at: "top", mood: "moved", act: "nod" },
        { say: "Feeling far away isn’t the same as being far away.", at: "top", mood: "tender", act: "settle" },
      ],
    },
    {
      kind: "pfarPage",
      title: "When I Feel Far Away",
      stanzas: [...stretches.map(s => s.lines), turn, close],
      refs: ["Psalm 139:11–12", "Luke 15:20"],
      say: "Here it is, all on one page.",
    },
    {
      kind: "pfarAmen",
      ask: "Would you like to pray before you go?",
      pray: "Pray with me",
      skip: "Not right now",
      prayer: "Father, some days you feel so far away.\nThank you that the dark isn’t dark to you.\nI’m coming back with nothing ready.\nThank you for running to meet me.\nIn Jesus’ name, amen.",
      after: "Amen.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "settle" },
      calm: true,
      title: "When I Feel Far Away",
      body: "",
      summary: [
        "Feeling far from God is something the psalms say out loud, too.",
        "Even the dark doesn’t hide you from him (Psalm 139:12).",
        "In Jesus’ story the father runs while the son is still far off.",
      ],
      refs: ["Psalm 139:7–12", "Luke 15:11–24"],
      related: [
        { title: "Why does God sometimes feel far away?", sub: "Big Questions · 6 min", lessonId: "god-far-away" },
        { title: "The lost sheep", sub: "Luke 15 · 3 min", lessonId: "lost-sheep" },
        { title: "How Close Do You Feel to God?", sub: "Heart to Heart · 5 min", lessonId: "heart-close" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
