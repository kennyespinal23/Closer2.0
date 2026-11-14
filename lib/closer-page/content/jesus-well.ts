import type { Lesson } from "../lesson/types";

/* Jesus Only: "The Woman at the Well", John 4:1–42.
   Central question: who does Jesus cross lines for? He crosses three (Jew to Samaritan, man to woman, and her
   own story), knows her fully, offers living water, and tells her plainly who he is.
   - Why she came at about the sixth hour is not stated; the common reading that she was avoiding people is
     tagged as a reading. The lesson doesn't moralise about her marriages; the text doesn't either.
   Every spoken line is Scripture (World English Bible, word for word). */

const WEB = "World English Bible";

export const jesusWell = {
  id: "jesus-well",
  title: "The Woman at the Well",
  subtitle: "Who does Jesus cross lines for?",
  kind: "Jesus only",
  scripture: "John 4:1–42",
  minutes: 6,
  theme: "wine",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "A well in the middle of the day. A tired traveller. A woman with a water jar.", mood: "thinking" },
        { say: "By the rules of their world, they shouldn’t even speak.", mood: "cheeky", act: "stare" },
        { say: "He starts the conversation anyway.", mood: "surprised", act: "hop" },
      ],
      display: { text: "The Woman at the Well", sub: "John 4:1–42 · World English Bible" },
      reply: "Go to the well",
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        { tag: "text", intensity: 0, text: "Jesus stopped in Samaria, worn out from the journey.", verse: { text: "Jacob’s well was there. Jesus therefore, being tired from his journey, sat down by the well. It was about the sixth hour.", ref: "John 4:6", translation: WEB }, say: "Tired. Thirsty. Sitting down.", mood: "tender" },
        { tag: "context", intensity: 0, text: "Jews and Samaritans had centuries of hostility between them, over history, worship and where God should be worshipped.", say: "Old wounds between two peoples.", mood: "thinking" },
        { tag: "reading", intensity: 0, text: "The sixth hour was around midday, the heat of the day. Many readers think she came then to avoid other people. John doesn’t say.", say: "Maybe she came when no one else would be there.", mood: "tender" },
      ],
      after: [],
    },
    {
      kind: "exchange",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Here’s how it went. Every line is from John 4.", mood: "curious" }],
      lines: [
        { who: "Jesus", side: "right", text: "“Give me a drink.”", ref: "John 4:7", translation: WEB, say: "He asks her for help.", mood: "surprised" },
        { who: "The woman", text: "“How is it that you, being a Jew, ask for a drink from me, a Samaritan woman?”", ref: "John 4:9", translation: WEB, say: "She can’t believe he’s talking to her.", mood: "cheeky", act: "stare" },
        { who: "Jesus", side: "right", text: "“If you knew the gift of God, and who it is who says to you, ‘Give me a drink,’ you would have asked him, and he would have given you living water.”", ref: "John 4:10", translation: WEB, say: "Then he offers her something.", mood: "curious", act: "tilt" },
        { who: "Jesus", side: "right", text: "…“whoever drinks of the water that I will give him will never thirst again; but the water that I will give him will become in him a well of water springing up to eternal life.”", ref: "John 4:14", translation: WEB, say: "Water that never runs out.", mood: "moved" },
        { who: "The woman", text: "“Sir, give me this water, so that I don’t get thirsty, neither come all the way here to draw.”", ref: "John 4:15", translation: WEB, say: "She wants it.", mood: "happy", act: "nod" },
      ],
      after: [{ say: "Then the conversation gets personal.", at: "top", mood: "tender" }],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { tag: "text", intensity: 0, text: "Jesus told her about her own life, things a stranger couldn’t know.", verse: { text: "for you have had five husbands; and he whom you now have is not your husband. This you have said truly.”", ref: "John 4:18", translation: WEB }, say: "He knew her whole story.", mood: "tender" },
        { tag: "reading", intensity: 0, text: "John doesn’t tell us why she had five husbands. In her world, women had little say in marriage or divorce. Her story may hold as much loss as anything else.", say: "We shouldn’t fill in the gaps unkindly.", mood: "thinking" },
        { tag: "text", intensity: 0, text: "And he kept talking with her.", say: "He knew everything. And he stayed.", mood: "moved", act: "nod" },
      ],
      after: [],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "“I am he, the one who speaks to you.”", ref: "John 4:26", translation: WEB },
      target: "I am he",
      before: [{ say: "She mentions the Messiah who is coming. Look at his answer.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark what Jesus tells her, or tap it",
      after: [
        { say: "He told her plainly who he was.", at: "top", mood: "surprised", act: "hop" },
        { say: "Before he told almost anyone else.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "excited" },
      beats: [
        { tag: "text", intensity: 0, text: "She left her water jar and ran back to town.", verse: { text: "“Come, see a man who told me everything that I did. Can this be the Christ?”", ref: "John 4:29", translation: WEB }, say: "She forgot her water jar.", mood: "excited", act: "hop" },
        { tag: "text", intensity: 0, text: "The town came out to meet him.", verse: { text: "From that city many of the Samaritans believed in him because of the word of the woman, who testified, “He told me everything that I did.”", ref: "John 4:39", translation: WEB }, say: "The woman who came alone brought a whole town.", mood: "moved" },
        { tag: "text", intensity: 0, text: "He stayed with them two days, and they reached their own conclusion.", verse: { text: "They said to the woman, “Now we believe, not because of your speaking; for we have heard for ourselves, and know that this is indeed the Christ, the Savior of the world.”", ref: "John 4:42", translation: WEB }, say: "The Savior of the world. Samaritans included.", mood: "happy", act: "nod" },
      ],
      after: [],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what does this moment show us about Jesus?", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "Lines Jesus crossed",
        items: [
          { text: "A Jew, asking a Samaritan for help", ref: "John 4:9" },
          { text: "A teacher, talking with a woman alone", ref: "John 4:27" },
          { text: "Knowing her whole story, and staying", ref: "John 4:18" },
        ],
      },
      unknown: {
        label: "What he offered her",
        items: [{ text: "Living water, and the truth about who he is", ref: "John 4:10, 26" }],
      },
      after: [
        { say: "He wasn’t embarrassed by her, and he didn’t avoid the hard part of her story.", mood: "moved", act: "nod" },
        { say: "He crossed every line to reach her.", mood: "moved" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Woman at the Well",
      lines: [{ say: "Here’s a quiet question.", mood: "tender" }],
      check: {
        prompt: "What part of her story speaks to you most?",
        options: [
          { text: "Being fully known.", reply: "He knew everything, and stayed. That’s what changed her.", mood: "moved", act: "nod" },
          { text: "The living water.", reply: "A thirst that finally gets met. A lot of us know that feeling.", mood: "thinking", act: "nod" },
          { text: "She told everyone.", reply: "She went from avoiding people to bringing them. That’s quite a change.", mood: "happy", act: "hop" },
          { text: "I’m not sure yet.", reply: "That’s fine. Let it sit with you.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What are you thirsty for right now?",
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
        "He crossed lines his world drew, to talk with a Samaritan woman.",
        "He knew her whole story, and stayed in the conversation.",
        "He offered her living water, and told her who he is.",
      ],
      verse: { text: "“I am he, the one who speaks to you.”", ref: "John 4:26", translation: WEB },
      refs: ["John 4:1–42"],
      related: [
        { title: "The Man in the Tree", sub: "Jesus only · Luke 19", lessonId: "jesus-zacchaeus" },
        { title: "The Day Jesus Cried", sub: "Jesus only · John 11", lessonId: "jesus-wept" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
