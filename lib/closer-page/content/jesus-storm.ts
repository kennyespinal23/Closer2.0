import type { Lesson } from "../lesson/types";

/* Jesus Only: "The Storm That Obeyed Him", Mark 4:35–41.
   Central question: the disciples' own, "Who then is this?" The takeaway is about Jesus' identity: he does what
   the Hebrew Scriptures say God does (Psalm 107:29 is shown as a connection readers make, tagged as a reading).
   Every spoken line is Scripture (World English Bible, word for word). */

const WEB = "World English Bible";

export const jesusStorm = {
  id: "jesus-storm",
  title: "The Storm That Obeyed Him",
  subtitle: "Who then is this?",
  kind: "Jesus only",
  scripture: "Mark 4:35–41",
  minutes: 5,
  theme: "wine",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "surprised" },
      lines: [
        { say: "A small boat. A huge storm. Experienced fishermen, terrified.", mood: "surprised", act: "shake" },
        { say: "By the end, they’re asking one question.", mood: "curious", act: "tilt" },
        { say: "“Who then is this?” Let’s ask it with them.", mood: "thinking", act: "nod" },
      ],
      display: { text: "The Storm That Obeyed Him", sub: "Mark 4:35–41 · World English Bible" },
      reply: "Into the boat",
    },
    {
      kind: "turning",
      scene: "storm",
      page: { at: "top", mood: "thinking" },
      beats: [
        { when: "Evening", tag: "text", intensity: 0, text: "After a long day of teaching, Jesus suggested they cross the lake.", verse: { text: "On that day, when evening had come, he said to them, “Let’s go over to the other side.”", ref: "Mark 4:35", translation: WEB }, say: "A simple trip across the lake.", mood: "happy" },
        { tag: "text", intensity: 3, text: "Then the storm hit.", verse: { text: "A big wind storm arose, and the waves beat into the boat, so much that the boat was already filled.", ref: "Mark 4:37", translation: WEB }, say: "The boat was filling with water.", mood: "surprised", act: "shake" },
        { tag: "text", intensity: 3, text: "And Jesus was asleep.", verse: { text: "He himself was in the stern, asleep on the cushion", ref: "Mark 4:38", translation: WEB }, say: "Asleep. On a cushion.", mood: "cheeky", act: "stare" },
        { tag: "context", intensity: 2, text: "Several of these men were fishermen who knew this lake well. If they were terrified, it was serious.", say: "These weren’t nervous beginners.", mood: "thinking" },
      ],
      after: [],
    },
    {
      kind: "exchange",
      page: { at: "top", mood: "tender" },
      before: [{ say: "Here’s what was said in that boat. Every word of it is Scripture.", mood: "thinking" }],
      lines: [
        { who: "The disciples", text: "“Teacher, don’t you care that we are dying?”", ref: "Mark 4:38", translation: WEB, say: "Don’t you care? That’s an honest prayer.", mood: "tender" },
        { who: "Jesus, to the sea", side: "right", text: "“Peace! Be still!”", ref: "Mark 4:39", translation: WEB, say: "He speaks to the wind. Like it can hear him.", mood: "surprised", act: "hop" },
        { who: "Jesus", side: "right", text: "“Why are you so afraid? How is it that you have no faith?”", ref: "Mark 4:40", translation: WEB, say: "Then he turns to them.", mood: "thinking" },
        { who: "The disciples", text: "“Who then is this, that even the wind and the sea obey him?”", ref: "Mark 4:41", translation: WEB, say: "And there’s the question.", mood: "curious", act: "tilt" },
      ],
      after: [{ say: "The storm stopped. Their fear didn’t. It just changed shape.", at: "top", mood: "thinking" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Why would that question be so big for them?", mood: "curious", act: "tilt" },
        { say: "Their Scriptures already said who calms the sea.", show: "verse", mood: "thinking", open: true },
      ],
      verse: { text: "Then they cry to Yahweh in their trouble, and he brings them out of their distress. He makes the storm a calm, so that its waves are still.", ref: "Psalm 107:28–29", translation: WEB },
      hint: "Tap the marked words",
      visual: "shift",
      links: [
        { phrase: "they cry to Yahweh in their trouble", label: "They cry out", note: "People in trouble cry out to God." },
        { phrase: "He makes the storm a calm", label: "God stills the sea", note: "And God is the one who calms the storm." },
      ],
      after: [
        { say: "In the boat, Jesus did exactly that.", at: "top", mood: "surprised", act: "hop", open: false },
        { say: "Many Christians read Mark as showing Jesus doing what only God does.", mood: "thinking", act: "nod" },
      ],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what does this moment show us about Jesus?", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "What the passage shows",
        items: [
          { text: "He was fully human: tired enough to sleep in a storm", ref: "Mark 4:38" },
          { text: "The wind and sea obeyed his word", ref: "Mark 4:39" },
          { text: "He was in the boat with them the whole time", ref: "Mark 4:36" },
        ],
      },
      unknown: {
        label: "What it leaves with us",
        items: [{ text: "The disciples’ question: who then is this?", ref: "Mark 4:41" }],
      },
      after: [
        { say: "Mark doesn’t answer the question for them here. He leaves it hanging.", mood: "thinking" },
        { say: "Because every reader has to answer it too.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Storm That Obeyed Him",
      lines: [{ say: "So let me ask you their question.", mood: "thinking" }],
      check: {
        prompt: "Who do you think Jesus is?",
        options: [
          { text: "The Son of God.", reply: "That’s exactly what Mark says at the very start of his book.", mood: "happy", act: "nod" },
          { text: "A great teacher.", reply: "He was. This story asks if he was even more than that.", mood: "thinking", act: "tilt" },
          { text: "I’m still figuring it out.", reply: "So were they, sitting in that wet boat. Keep asking.", mood: "moved", act: "nod" },
        ],
      },
      ask: "What would change if he really is the one the wind obeys?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we discovered about Jesus",
      body: "The Lord is always closer than you think.",
      summary: [
        "He was human enough to fall asleep in a storm.",
        "He spoke, and the wind and the sea obeyed him.",
        "He left his friends, and us, with the question: who then is this?",
      ],
      verse: { text: "“Who then is this, that even the wind and the sea obey him?”", ref: "Mark 4:41", translation: WEB },
      refs: ["Mark 4:35–41", "Psalm 107:28–29"],
      related: [
        { title: "The Moment Peter Sank", sub: "Jesus only · Matthew 14", lessonId: "jesus-peter-sank" },
        { title: "How can we know God exists?", sub: "Big question · 6 min", lessonId: "god-exists" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
