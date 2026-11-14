import type { Lesson } from "../lesson/types";

/* Verse study: Romans 8:28. Pure content, played by the same engine as the stories.
   Scripture is the World English Bible, word for word (closer-lounge/bible/web/romans.json).
   Page explains in his own words; anything in quotation marks from the Bible is exact. */

const WEB = "World English Bible";
const verse = {
  text: "We know that all things work together for good for those who love God, to those who are called according to his purpose.",
  ref: "Romans 8:28",
  translation: WEB,
};

export const romans828 = {
  id: "romans-8-28",
  title: "Romans 8:28",
  subtitle: "All things, and what that really means",
  kind: "Verse study",
  scripture: "Romans 8",
  minutes: 5,
  theme: "burgundy",
  blocks: [
    // 1. Introduction
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [
        { say: "Okay, I’ve got a verse I want to show you.", mood: "excited" },
        { say: "It’s one people quote all the time.", mood: "cheeky", act: "stare" },
        { say: "But there’s something interesting about it.", mood: "curious", act: "tilt" },
      ],
      display: { text: "Romans 8:28", sub: "Verse study · World English Bible" },
      reply: "Let’s look",
    },
    // 2. Read it, at your own pace
    { kind: "read", page: { at: "corner", mood: "thinking", look: -1 }, verse, reply: "I’ve read it" },
    // 3. Highlight a phrase
    {
      kind: "highlight",
      page: { at: "top", mood: "curious", act: "tilt" },
      verse,
      target: "all things",
      before: [{ say: "Wait. Look at these two words.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Drag across “all things”, or tap it",
      after: [{ say: "That’s a pretty big promise, isn’t it?", at: "top", mood: "excited", act: "react" }],
      reply: "Keep going",
    },
    // 4. The big question
    {
      kind: "ask",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Does this mean everything that happens to us is good?",
      options: [
        { text: "Yes, everything is good.", reply: "I get why it sounds that way. Look closer, though. It’s a little different.", mood: "thinking", act: "tilt" },
        { text: "No, God can work through difficult things.", reply: "That’s it. You read it closely.", mood: "happy", act: "hop" },
        { text: "I’m not sure.", reply: "That’s a good instinct, honestly. Let’s look closer together.", mood: "tender", act: "nod" },
      ],
      after: [
        { say: "Paul doesn’t say everything that happens is good.", at: "top", mood: "thinking", show: "compare" },
        { say: "He says God works for good in all things.", mood: "happy", act: "nod" },
      ],
      compare: {
        not: { label: "Paul doesn’t say", text: "Everything that happens is good." },
        but: { label: "Paul says", text: "God works for good in *all things*." },
      },
    },
    // 5. The context
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Want to see something else?", mood: "excited", act: "hop", open: true },
        { say: "Look at what Paul was talking about earlier.", show: "verse", mood: "curious" },
      ],
      verse: { text: "For I consider that the sufferings of this present time are not worthy to be compared with the glory which will be revealed toward us.", ref: "Romans 8:18", translation: WEB },
      hint: "Tap the marked words",
      links: [
        { phrase: "the sufferings of this present time", label: "Suffering now", note: "Real pain. Paul doesn’t pretend it isn’t there.", },
        { phrase: "the glory which will be revealed toward us", label: "Glory to come", note: "And this outweighs it. It’s not even close." },
      ],
      after: [
        { say: "Paul knew life could be painful.", at: "top", mood: "tender", open: false },
        { say: "He wasn’t promising that nothing bad would happen.", mood: "thinking" },
        { say: "His hope was in what God could do.", mood: "moved", act: "nod" },
        { say: "And 8:28 is for those who love God, called according to his purpose.", mood: "thinking" },
        { say: "Then Paul asks one more question.", show: "more", mood: "curious", act: "tilt" },
        { say: "His answer: nothing can. Not even the hard things.", mood: "happy", act: "hop" },
      ],
      more: { text: "Who shall separate us from the love of Christ?", ref: "Romans 8:35", translation: WEB },
    },
    // 6. Put it together
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s put it together.", show: "not", mood: "thinking" }],
      not: "Everything that happens is good.",
      but: "God can work for good through what happens.",
      prompt: "Drag the true one into place, or tap it",
      after: [
        { say: "There it is.", mood: "moved", act: "nod" },
        { say: "Here’s the heart of it.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "God’s promise isn’t that life will always be easy. It’s that suffering doesn’t place us beyond his purposes.",
    },
    // 7. Reflection
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Romans 8:28",
      lines: [
        { say: "Can I ask you something?", mood: "tender" },
        { say: "Is there something in your life right now that’s hard to understand?", mood: "tender" },
      ],
      write: "Write a thought",
      skip: "Just reflect",
      placeholder: "Whatever’s on your mind. Only you will see this.",
      quiet: "Take your time. You don’t have to understand it all today.",
    },
    // 8. Finish
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "Here’s what you found.",
      body: "The Lord is always closer than you think.",
      summary: [
        "“All things” means all things, the hard ones too.",
        "Paul doesn’t say everything is good. He says God works for good in it.",
        "Suffering is real, and it doesn’t put you beyond God’s purposes.",
      ],
      verse,
      keep: verse,
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
