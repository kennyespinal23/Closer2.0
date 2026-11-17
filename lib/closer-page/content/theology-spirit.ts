import type { Lesson } from "../lesson/types";

/* Christian Theology: Who Is the Holy Spirit?
   Three windows into Scripture, each opened its own way: the baptism (guide the dove down), Jesus' teaching in
   John 14 (gather what the Counselor does), and Pentecost (hold for the wind). Then the question they raise:
   is the Spirit a force, or someone? Four things he does swing a needle to "someone"; three verses put him on
   God's side of the line.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - Notes on the Greek are labelled commentary, never presented as Scripture.
   - "Trinity" and "person" are named as the church's words for what the passages say together.
   - The Spirit is never phrased as less than God, and neither is Jesus. Nothing is drawn of Jesus himself.
   - The phrase in other languages is Acts 2:11's "the mighty works of God" as Bibles render it (Luke's Greek, the
     Latin Vulgate, the Arabic Van Dyck), labelled as such.
   - The reflection is optional, and nothing chosen there is saved or scored. */

const WEB = "World English Bible";

export const theologySpirit = {
  id: "theology-spirit",
  title: "Who Is the Holy Spirit?",
  subtitle: "A force, or someone?",
  kind: "Christian theology",
  scripture: "Matthew 3 · John 14 · Acts 2",
  minutes: 5,
  theme: "indigo",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "Who Is the Holy Spirit?", sub: "Christian Theology · 5 min" },
      lines: [
        { say: "Christians talk about the Holy Spirit a lot.", mood: "curious", act: "hop" },
        { say: "But who is he? A power? A feeling? Someone?", mood: "thinking", act: "tilt" },
      ],
      reply: "Let’s find out",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What comes to mind first?",
      options: [
        { text: "A force, like energy", reply: "A lot of people picture that.", mood: "thinking", act: "nod" },
        { text: "God’s presence, somehow", reply: "That’s close to something real.", mood: "happy", act: "nod" },
        { text: "Someone, I think", reply: "Hold on to that. Let’s check.", mood: "curious", act: "tilt" },
      ],
      after: [
        { say: "Let’s look through three windows into Scripture.", mood: "excited", act: "hop" },
      ],
    },

    // three windows
    {
      kind: "spiritWindows",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Three scenes. Each one shows him differently.", mood: "curious" },
      ],
      hint: "Open any window you like.",
      panes: [
        {
          kind: "dove", title: "The river", ref: "Matthew 3", teaser: "The Spirit comes down, while the Father speaks over the Son.",
          hint: "Guide the dove down from the open sky.",
          verse: { text: "Jesus, when he was baptized, went up directly from the water: and behold, the heavens were opened to him. He saw the Spirit of God descending as a dove, and coming on him.", ref: "Matthew 3:16", translation: WEB },
          phrases: [
            { phrase: "the heavens were opened to him", say: "The heavens open." },
            { phrase: "the Spirit of God descending as a dove", say: "The Spirit of God, coming down like a dove." },
            { phrase: "and coming on him", say: "Onto Jesus, as he comes up out of the water!" },
          ],
          voice: { text: "Behold, a voice out of the heavens said, “This is my beloved Son, with whom I am well pleased.”", ref: "Matthew 3:17", translation: WEB },
          trio: [
            { who: "father", label: "The voice" },
            { who: "son", label: "The Son" },
            { who: "spirit", label: "The Spirit" },
          ],
          done: "The Spirit isn’t the voice, and isn’t Jesus. He’s his own.",
        },
        {
          kind: "words", title: "The upper room", ref: "John 14", teaser: "Jesus describes the Spirit doing what a person does.",
          hint: "Tap what Jesus says about the Counselor.",
          verses: [
            { text: "I will pray to the Father, and he will give you another Counselor, that he may be with you forever,— the Spirit of truth, whom the world can’t receive; for it doesn’t see him, neither knows him. You know him, for he lives with you, and will be in you.", ref: "John 14:16–17", translation: WEB },
            { text: "But the Counselor, the Holy Spirit, whom the Father will send in my name, he will teach you all things, and will remind you of all that I said to you.", ref: "John 14:26", translation: WEB },
          ],
          marks: [
            { phrase: "another Counselor", does: "Helps, like Jesus did", say: "“Another” Counselor. Jesus had been their helper." },
            { phrase: "he lives with you", does: "Lives with them", say: "He lives with them. Not just near them." },
            { phrase: "he will teach you all things", does: "Teaches", say: "He teaches. That takes a mind." },
            { phrase: "will remind you of all that I said to you", does: "Reminds", say: "And he reminds them of Jesus’ words." },
          ],
          heading: "What the Counselor does",
          reveal: "Helping, living with, teaching, reminding. These are things someone does.",
          note: {
            label: "A note on the Greek · commentary",
            text: "“Counselor” translates paraklētos: someone called alongside to help, like an advocate. Many readers take “another” to mean another like Jesus, who had been with them.",
          },
          done: "Jesus talks about the Spirit the way you’d talk about a friend.",
        },
        {
          kind: "fire", title: "The house", ref: "Acts 2", teaser: "The Spirit fills a room, and the good news goes out in every language.",
          hold: "Hold for the wind",
          verses: [
            { text: "Suddenly there came from the sky a sound like the rushing of a mighty wind, and it filled all the house where they were sitting.", ref: "Acts 2:2", translation: WEB },
            { text: "Tongues like fire appeared and were distributed to them, and one sat on each of them.", ref: "Acts 2:3", translation: WEB },
            { text: "They were all filled with the Holy Spirit, and began to speak with other languages, as the Spirit gave them the ability to speak.", ref: "Acts 2:4", translation: WEB },
          ],
          people: 9,
          languages: [
            { lang: "Luke’s Greek", text: "τὰ μεγαλεῖα τοῦ θεοῦ" },
            { lang: "Latin Bible", text: "magnalia Dei" },
            { lang: "Arabic Bible", text: "عظائم الله", rtl: true },
            { lang: "English", text: "the mighty works of God" },
          ],
          heard: { text: "we hear them speaking in our languages the mighty works of God!", ref: "Acts 2:11", translation: WEB },
          done: "“As the Spirit gave them the ability.” He gives, he fills.",
        },
      ],
      after: [
        { say: "Three windows. In every one, the Spirit is doing something.", mood: "moved", act: "nod" },
        { say: "Coming down. Teaching. Filling a whole house.", mood: "excited" },
      ],
    },

    // the discovery: someone, not something
    {
      kind: "spiritPerson",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "So: a force, or someone?", mood: "curious", act: "stare" },
        { say: "Here are four more passages. Find what he does.", mood: "happy", act: "nod" },
      ],
      hint: "Tap the marked words.",
      meter: ["Something", "Someone"],
      actions: [
        { verse: { text: "he will teach you all things, and will remind you of all that I said to you.", ref: "John 14:26", translation: WEB }, verb: "he will teach you", does: "He teaches", say: "A force can’t teach." },
        { verse: { text: "As they served the Lord and fasted, the Holy Spirit said, “Separate Barnabas and Saul for me, for the work to which I have called them.”", ref: "Acts 13:2", translation: WEB }, verb: "the Holy Spirit said", does: "He speaks", say: "He speaks. And says “for me.”" },
        { verse: { text: "the Spirit himself makes intercession for us with groanings which can’t be uttered.", ref: "Romans 8:26", translation: WEB }, verb: "makes intercession for us", does: "He prays for us", say: "He prays for us, when we can’t find words." },
        { verse: { text: "Don’t grieve the Holy Spirit of God, in whom you were sealed for the day of redemption.", ref: "Ephesians 4:30", translation: WEB }, verb: "Don’t grieve", does: "He can be grieved", say: "Grieved. You can hurt him." },
      ],
      wow: [
        { say: "Teaching. Speaking. Praying. Grieving.", mood: "surprised", act: "react" },
        { say: "Wind can’t be sad. Only someone can.", mood: "moved", act: "nod" },
        { say: "So is he God himself? Look at these.", mood: "curious", act: "tilt" },
      ],
      identityHint: "Tap the marked words.",
      identity: [
        { verse: { text: "But Peter said, “Ananias, why has Satan filled your heart to lie to the Holy Spirit, and to keep back part of the price of the land?", ref: "Acts 5:3", translation: WEB }, mark: "to lie to the Holy Spirit", note: "Peter says Ananias lied to the Holy Spirit…", say: "Lied to the Holy Spirit…" },
        { verse: { text: "You haven’t lied to men, but to God.", ref: "Acts 5:4", translation: WEB }, mark: "but to God", note: "…and in the same breath, that he lied to God.", say: "…which Peter calls lying to God!" },
        { verse: { text: "baptizing them in the name of the Father and of the Son and of the Holy Spirit,", ref: "Matthew 28:19", translation: WEB }, mark: "in the name", note: "One name, not three names: the Father, the Son and the Holy Spirit share it.", say: "One name. Shared by all three." },
      ],
      summary: {
        title: "Someone. And God.",
        lines: [
          "He teaches, speaks, prays for us, and can be grieved.",
          "Lying to him is lying to God. He shares one name with the Father and the Son.",
          "Christians call him the third person of the Trinity: fully God, not a force God uses.",
        ],
      },
      after: [
        { say: "“Person” here means a distinct someone. Not a body.", mood: "thinking", act: "tilt" },
        { say: "The Nicene Creed calls him “the Lord, the giver of life.”", mood: "happy", act: "nod" },
        { say: "Christians differ on some things, like spiritual gifts today.", mood: "thinking" },
        { say: "On who he is, the historic churches agree.", mood: "moved", act: "nod" },
      ],
    },

    // he is near
    {
      kind: "verse",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "And here’s the gentle part.", mood: "tender" },
        { say: "A psalm asks a question with only one answer.", mood: "moved" },
      ],
      verse: { text: "Where could I go from your Spirit? Or where could I flee from your presence?", ref: "Psalm 139:7", translation: WEB },
      after: [
        { say: "Nowhere. He’s not a passing feeling.", mood: "tender", act: "nod" },
        { say: "He’s God, with you.", mood: "moved" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "Jesus said the Spirit lives with his people. Where would you like his guidance?",
      options: [
        { text: "A decision I’m facing", reply: "“He will guide you into all truth,” Jesus said. John 16:13." },
        { text: "When I don’t know how to pray", reply: "Romans 8 says the Spirit helps right there, and prays for you." },
        { text: "Just knowing God is near", reply: "You can’t go anywhere he isn’t. Psalm 139." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "Who is the Holy Spirit?",
      body: "",
      summary: [
        "At the Jordan, the Spirit comes down, distinct from the Father’s voice and the Son.",
        "He teaches, speaks, prays for us, and can be grieved: someone, not something.",
        "Scripture treats him as God: lying to him is lying to God.",
      ],
      refs: ["Matthew 3:16–17", "John 14:16–26", "Acts 2:1–11", "Acts 5:3–4", "Acts 13:2", "Romans 8:26", "Ephesians 4:30", "Matthew 28:19", "Psalm 139:7"],
      related: [
        { title: "If Jesus Is God, Who Was He Praying To?", sub: "Christian Theology · 5 min", lessonId: "theology-praying" },
        { title: "When You Don’t Have the Words", sub: "Romans 8", lessonId: "pray-no-words-spirit" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
