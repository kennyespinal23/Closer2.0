import type { Lesson } from "../lesson/types";

/* It Is Written: the first Daily Experience, played before any sign-up (screens/FirstRun.tsx), and kept on the Jesus
   Only shelf afterwards. Matthew 4:1–11, followed back to Deuteronomy and Psalm 91.
   Every word spoken by Jesus or the devil is Matthew's text, labelled with its speaker; Page only comments between.
   The twist (the devil quotes Scripture too) is never said before you find it yourself.
   Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces. */

const WEB = "World English Bible";

const m4_4 = "“It is written, ‘Man shall not live by bread alone, but by every word that proceeds out of the mouth of God.’”";
const m4_6 = "“If you are the Son of God, throw yourself down, for it is written, ‘He will put his angels in charge of you.’ and, ‘On their hands they will bear you up, so that you don’t dash your foot against a stone.’”";
const m4_7 = "“Again, it is written, ‘You shall not test the Lord, your God.’”";

export const itIsWritten = {
  id: "it-is-written",
  title: "It Is Written",
  subtitle: "How did Jesus answer the devil?",
  kind: "Jesus only",
  scripture: "Matthew 4 · Deuteronomy 8 · Psalm 91",
  minutes: 5,
  theme: "wine",
  blocks: [
    // the question, before anything is explained
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "It Is Written", sub: "Matthew 4 · 5 min" },
      lines: [
        { say: "Here’s a question for you.", mood: "excited", act: "hop" },
        { say: "How did Jesus respond when the devil tempted him?", mood: "curious", act: "tilt" },
        { say: "The answer has a surprise in it. Let’s find it.", mood: "cheeky", act: "stare" },
      ],
      reply: "Let’s find out",
    },
    // Scene 1: the wilderness
    {
      kind: "wilderness",
      page: { at: "top", mood: "tender", act: "settle" },
      before: [
        { say: "Jesus had just been baptized. Then this happened.", show: "first", mood: "tender" },
      ],
      first: { text: "Then Jesus was led up by the Spirit into the wilderness to be tempted by the devil.", ref: "Matthew 4:1", translation: WEB },
      hold: "Hold to pass the days",
      days: 40,
      then: { text: "When he had fasted forty days and forty nights, he was hungry afterward.", ref: "Matthew 4:2", translation: WEB },
      after: [
        { say: "Forty days without food.", show: "then", mood: "moved", act: "nod" },
        { say: "That’s when the tempter came.", mood: "thinking" },
      ],
    },
    // Scene 2: the first temptation
    {
      kind: "exchange",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Listen to what he said.", mood: "curious", act: "tilt" }],
      lines: [
        { who: "The tempter", text: "“If you are the Son of God, command that these stones become bread.”", ref: "Matthew 4:3", translation: WEB, mood: "thinking" },
        { who: "Jesus", side: "right", text: m4_4, ref: "Matthew 4:4", translation: WEB, mood: "surprised", act: "react" },
      ],
      after: [
        { say: "Jesus didn’t argue with him.", mood: "thinking" },
        { say: "He said “It is written,” and quoted something.", mood: "curious", act: "tilt" },
      ],
    },
    {
      kind: "written",
      page: { at: "top", mood: "curious" },
      before: [{ say: "But quoted it from where?", show: "quote", mood: "curious", act: "tilt" }],
      quote: { who: "Jesus", text: m4_4, ref: "Matthew 4:4", translation: WEB },
      mark: "It is written",
      drag: "Drag “It is written” to the scroll",
      source: { book: "Deuteronomy", text: "He humbled you, and allowed you to be hungry, and fed you with manna, which you didn’t know, neither did your fathers know; that he might teach you that man does not live by bread only, but man lives by every word that proceeds out of Yahweh’s mouth.", ref: "Deuteronomy 8:3", translation: WEB },
      match: ["man does not live by bread only, but man lives by every word that proceeds out of Yahweh’s mouth"],
      after: [
        { say: "Deuteronomy! Moses said this to Israel.", mood: "excited", act: "hop" },
        { say: "They had been hungry in the wilderness too. For forty years.", mood: "moved", act: "nod" },
        { say: "Jesus answered with words he already knew.", mood: "happy" },
      ],
    },
    // Scene 3: the twist
    {
      kind: "exchange",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "The devil wasn’t done.", mood: "thinking", act: "lean" }],
      lines: [
        { who: "Matthew tells us", text: "Then the devil took him into the holy city. He set him on the pinnacle of the temple,", ref: "Matthew 4:5", translation: WEB, mood: "curious" },
        { who: "The devil", text: m4_6, ref: "Matthew 4:6", translation: WEB, mood: "thinking", act: "tilt" },
      ],
      after: [{ say: "Wait. Read what he said again.", mood: "surprised", act: "stare" }],
    },
    {
      kind: "written",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Look closely. Notice anything?", show: "quote", mood: "curious", act: "tilt" }],
      quote: { who: "The devil", text: m4_6, ref: "Matthew 4:6", translation: WEB },
      find: "it is written",
      findHint: "Tap the words that sound familiar",
      wow: "The devil quoted Scripture.",
      wowSay: "He knows the Bible?!",
      mark: "it is written",
      drag: "So where is it written? Drag it to the scroll",
      source: { book: "Psalms", text: "For he will put his angels in charge of you, to guard you in all your ways. They will bear you up in their hands, so that you won’t dash your foot against a stone.", ref: "Psalm 91:11–12", translation: WEB },
      match: ["he will put his angels in charge of you", "They will bear you up in their hands, so that you won’t dash your foot against a stone."],
      skipped: "to guard you in all your ways",
      after: [
        { say: "Psalm 91. Almost word for word.", mood: "surprised", act: "spin" },
        { say: "Almost. One line never made it into his quote.", show: "skipped", mood: "thinking", act: "tilt" },
        { say: "So he knew the words. Did he understand them?", mood: "curious" },
      ],
    },
    // Scene 4: understanding Scripture
    {
      kind: "written",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Here’s how Jesus answered him.", show: "quote", mood: "curious", act: "nod" }],
      quote: { who: "Jesus", text: m4_7, ref: "Matthew 4:7", translation: WEB },
      mark: "it is written",
      drag: "Drag it to the scroll",
      source: { book: "Deuteronomy", text: "You shall not tempt Yahweh your God, as you tempted him in Massah.", ref: "Deuteronomy 6:16", translation: WEB },
      match: ["You shall not tempt Yahweh your God"],
      after: [
        { say: "Deuteronomy again.", mood: "excited", act: "hop" },
        { say: "Scripture against Scripture? Not quite. Let’s look closer.", mood: "thinking", act: "tilt" },
      ],
    },
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Here’s what Psalm 91 says just before the part he quoted.", show: "verse", mood: "curious", open: true },
      ],
      verse: { text: "Because you have made Yahweh your refuge, and the Most High your dwelling place, no evil shall happen to you, neither shall any plague come near your dwelling. For he will put his angels in charge of you, to guard you in all your ways.", ref: "Psalm 91:9–11", translation: WEB },
      hint: "Tap the marked words",
      visual: "pair",
      links: [
        { phrase: "made Yahweh your refuge", label: "Who it’s for", note: "It’s a promise for someone who trusts God and rests in him." },
        { phrase: "to guard you in all your ways", label: "The line he left out", note: "God’s care along the way. Not a stunt to make God prove himself." },
      ],
      after: [
        { say: "And Massah, in Jesus’ answer? That’s a place in Exodus.", show: "more", at: "top", mood: "curious", act: "tilt", open: false },
        { say: "Israel demanded that God prove he was with them.", mood: "thinking" },
        { say: "“If you are the Son of God…” Sound familiar?", mood: "cheeky", act: "stare" },
      ],
      more: { text: "He called the name of the place Massah, and Meribah, because the children of Israel quarreled, and because they tested Yahweh, saying, “Is Yahweh among us, or not?”", ref: "Exodus 17:7", translation: WEB },
    },
    // Scene 5: the conclusion
    {
      kind: "exchange",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "The devil tried one last time.", mood: "thinking" }],
      lines: [
        { who: "The devil", text: "“I will give you all of these things, if you will fall down and worship me.”", ref: "Matthew 4:9", translation: WEB, mood: "thinking" },
        { who: "Jesus", side: "right", text: "“Get behind me, Satan! For it is written, ‘You shall worship the Lord your God, and you shall serve him only.’”", ref: "Matthew 4:10", translation: WEB, mood: "excited", act: "react" },
        { who: "Matthew tells us", text: "Then the devil left him, and behold, angels came and served him.", ref: "Matthew 4:11", translation: WEB, mood: "moved", act: "nod" },
      ],
      after: [
        { say: "Angels came.", mood: "moved" },
        { say: "Jesus didn’t jump to prove who he was.", mood: "tender", act: "nod" },
        { say: "He is the Son of God. He had nothing to prove.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "So what made the difference?", show: "not", mood: "thinking", act: "tilt" }],
      not: "Knowing the words of Scripture is enough.",
      but: "Understanding what they mean is what matters.",
      prompt: "Drag the true one into place",
      after: [
        { say: "Here’s the heart of it.", show: "takeaway", mood: "moved", act: "nod", handoff: "corner" },
      ],
      takeaway: "The devil knew the words. Jesus knew what they meant.",
    },
    {
      kind: "verse",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "When it was hard, Jesus already knew the words.", mood: "tender" },
        { say: "A psalm puts it like this.", show: "verse", mood: "moved", act: "nod" },
      ],
      verse: { text: "I have hidden your word in my heart, that I might not sin against you.", ref: "Psalm 119:11", translation: WEB },
      after: [
        { say: "Keep the words, and what they mean.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "It is written.",
      body: "",
      summary: [
        "Jesus answered every temptation with Scripture.",
        "The devil quoted Scripture too, and bent it.",
        "Knowing God’s Word means knowing what it means.",
      ],
      refs: ["Matthew 4:1–11", "Deuteronomy 8:3", "Deuteronomy 6:16", "Psalm 91:11–12"],
      button: "Finish",
    },
  ],
} satisfies Lesson;
