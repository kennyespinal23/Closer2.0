import type { Lesson } from "../lesson/types";

/* Christian Theology, the first experience: If Jesus is God, who was he praying to?
   Built as a guided mystery. You find the three at the baptism, collect what three passages say, build the Shield of
   the Trinity yourself, and only then does Page name it. The answer to the opening question waits until the end.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - What the text says, what the church later named it ("Trinity", "person", the Shield diagram), and what stays a
     mystery are kept apart on screen.
   - Jesus is God the Son: never phrased as less than God. The Son is not the Father, and both are God.
   - Nothing is drawn of Jesus himself: the Son is shown by the water he rises from.
   - The reflection is optional, nothing chosen there is saved, and nothing in it is scored. */

const WEB = "World English Bible";

export const theologyPraying = {
  id: "theology-praying",
  title: "If Jesus Is God, Who Was He Praying To?",
  subtitle: "One God, and a Son who prayed",
  kind: "Christian theology",
  scripture: "Matthew 3 · Deuteronomy 6 · John 1 · John 17",
  minutes: 5,
  theme: "indigo",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "If Jesus Is God, Who Was He Praying To?", sub: "Christian Theology · 5 min" },
      lines: [
        { say: "Here’s a question people quietly wonder about.", mood: "curious", act: "hop" },
        { say: "Christians say Jesus is God.", mood: "thinking", act: "nod" },
        { say: "But the Gospels show him praying to God. Often.", mood: "cheeky", act: "tilt" },
      ],
      reply: "So who was he talking to?",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What’s your first thought?",
      options: [
        { text: "Was Jesus praying to himself?", reply: "That’s the puzzle, isn’t it?", mood: "curious", act: "tilt" },
        { text: "Maybe Jesus and God are different?", reply: "Hold that thought. It matters.", mood: "thinking", act: "nod" },
        { text: "I’m not really sure.", reply: "Good place to start. Let’s look.", mood: "happy", act: "nod" },
      ],
      after: [
        { say: "Let’s not guess. Let’s look at a moment where it all happens at once.", mood: "excited", act: "hop" },
      ],
    },

    // the first clue: the baptism
    {
      kind: "jordan",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "The day Jesus was baptized in the Jordan River.", mood: "tender" },
      ],
      hint: "Read it, then tap each thing it names in the picture.",
      verse: { text: "Jesus, when he was baptized, went up directly from the water: and behold, the heavens were opened to him. He saw the Spirit of God descending as a dove, and coming on him. Behold, a voice out of the heavens said, “This is my beloved Son, with whom I am well pleased.”", ref: "Matthew 3:16–17", translation: WEB },
      finds: [
        { who: "son", name: "Jesus, the Son", phrase: "Jesus, when he was baptized, went up directly from the water", say: "Jesus, coming up out of the water." },
        { who: "spirit", name: "The Spirit of God", phrase: "the Spirit of God descending as a dove", say: "The Spirit of God, coming down like a dove." },
        { who: "father", name: "A voice from heaven", phrase: "a voice out of the heavens said", say: "And a voice. From heaven itself." },
      ],
      notice: {
        prompt: "Did you notice something? Look at what the voice says.",
        quote: { text: "“This is my beloved Son, with whom I am well pleased.”", ref: "Matthew 3:17", translation: WEB },
        hint: "Tap the two marked words",
        marks: [
          { word: "my", who: "father", label: "the one speaking", say: "“My.” Someone in heaven is speaking." },
          { word: "Son", who: "son", label: "the one he’s speaking of", say: "“Son.” He means Jesus, in the water." },
        ],
      },
      after: [
        { say: "One speaks from heaven. One stands in the water. One comes down on him.", mood: "surprised", act: "react" },
        { say: "All three, in the same moment.", mood: "excited" },
        { say: "Not one person taking turns. They’re distinct from each other.", mood: "thinking", act: "nod" },
        { say: "Christians call them the Father, the Son, and the Holy Spirit.", mood: "happy", act: "nod" },
      ],
    },

    // the second question: three gods?
    {
      kind: "clues",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Which raises a new question.", mood: "thinking" },
        { say: "If they’re different, do Christians believe in three gods?", mood: "curious", act: "stare" },
        { say: "Let’s open three passages and see.", mood: "happy", act: "nod" },
      ],
      hint: "Open a passage and tap the marked words.",
      passages: [
        {
          id: "deut", title: "Deuteronomy 6:4", context: "Moses to Israel. Jesus called it the greatest commandment.",
          verses: [{ text: "Hear, Israel: Yahweh is our God. Yahweh is one.", ref: "Deuteronomy 6:4", translation: WEB }],
          marks: [
            { phrase: "Yahweh is one", clue: "There is one God", group: "one", say: "One. Not three gods. This is Israel’s great confession." },
          ],
        },
        {
          id: "john1", title: "John 1:1–3", context: "How John’s Gospel begins. By verse 14, “the Word” is Jesus.",
          verses: [
            { text: "In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made through him. Without him was not anything made that has been made.", ref: "John 1:1–3", translation: WEB },
            { text: "The Word became flesh, and lived among us.", ref: "John 1:14", translation: WEB },
          ],
          marks: [
            { phrase: "the Word was with God", clue: "With God", group: "distinct", say: "With God. So the Word is someone distinct." },
            { phrase: "the Word was God", clue: "Was God", group: "god", say: "And the Word was God. Not a lesser being." },
            { phrase: "The Word became flesh", clue: "The Word is Jesus", group: "god", say: "The Word became a human being. That’s Jesus." },
          ],
        },
        {
          id: "john17", title: "John 17:1–5", context: "Jesus praying, the night before the cross.",
          verses: [{ text: "Jesus said these things, and lifting up his eyes to heaven, he said, “Father, the time has come. Glorify your Son, that your Son may also glorify you; even as you gave him authority over all flesh, so he will give eternal life to all whom you have given him. This is eternal life, that they should know you, the only true God, and him whom you sent, Jesus Christ. I glorified you on the earth. I have accomplished the work which you have given me to do. Now, Father, glorify me with your own self with the glory which I had with you before the world existed.", ref: "John 17:1–5", translation: WEB }],
          marks: [
            { phrase: "lifting up his eyes to heaven, he said, “Father", clue: "He prays to the Father", group: "distinct", say: "There it is. The Son, praying to his Father." },
            { phrase: "the glory which I had with you before the world existed", clue: "With the Father before the world", group: "god", say: "Before the world existed, he shared the Father’s glory." },
          ],
        },
      ],
      groups: [
        { id: "one", label: "There is one God." },
        { id: "god", label: "The Son is God." },
        { id: "distinct", label: "The Son is not the Father." },
      ],
      after: [
        { say: "Put the clues together.", show: "one", mood: "thinking" },
        { say: "Scripture says the Son is God.", show: "god", mood: "curious", act: "nod" },
        { say: "And that he’s not the Father. He’s with him, and prays to him.", show: "distinct", mood: "surprised", act: "react" },
        { say: "All three are true at once. So how do they fit?", mood: "curious", act: "tilt" },
      ],
    },

    // the central discovery, built by hand
    {
      kind: "shield",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Let’s build it.", mood: "excited", act: "hop" },
        { say: "The three from the Jordan, and the one God.", mood: "happy" },
      ],
      center: "God",
      persons: [
        { who: "father", name: "The Father", verse: { text: "For God the Father has sealed him.", ref: "John 6:27", translation: WEB }, say: "“God the Father.” Nobody doubts this one." },
        { who: "son", name: "The Son", verse: { text: "In the beginning was the Word, and the Word was with God, and the Word was God.", ref: "John 1:1", translation: WEB }, say: "“The Word was God.” And the Word became flesh." },
        { who: "spirit", name: "The Holy Spirit", verse: { text: "You haven’t lied to men, but to God.", ref: "Acts 5:4", translation: WEB }, say: "Peter says lying to the Holy Spirit is lying to God." },
      ],
      isHint: "Connect each one to God.",
      notHint: "But are they the same as each other?",
      pairs: [
        { a: "father", b: "son", why: "At the Jordan the Father speaks about his Son. And the Son prays to his Father.", ref: "Matthew 3:17 · John 17:1", say: "You don’t talk to yourself like that." },
        { a: "son", b: "spirit", why: "The Spirit comes down on the Son. Jesus calls the Spirit “another Counselor.”", ref: "Matthew 3:16 · John 14:16", say: "“Another.” Not Jesus himself." },
        { a: "father", b: "spirit", why: "Jesus says the Father will send the Holy Spirit.", ref: "John 14:26", say: "The one who sends, and the one who is sent." },
      ],
      title: "One God. Three persons.",
      caption: "You just built the Shield of the Trinity, a teaching picture from the Middle Ages. It shows what Christians believe. It doesn’t explain how.",
      after: [
        { say: "Look what you built.", show: "name", mood: "excited", act: "spin" },
        { say: "Each one is God. None is the others.", mood: "moved", act: "nod" },
        { say: "And there’s still one God.", mood: "happy" },
        { say: "Christians call this the Trinity.", mood: "happy" },
        { say: "That word isn’t in the Bible.", mood: "thinking", act: "tilt" },
        { say: "It’s the church’s name for what these passages say together.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "misreads",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Two common pictures of this sound close, but miss it.", mood: "thinking" },
      ],
      hint: "Tap each one to check it.",
      stamp: "Not it",
      items: [
        { title: "Three gods working as a team?", why: "Scripture says there is one God. Three persons sharing one divine being, not three beings.", ref: "Deuteronomy 6:4", say: "Three gods would break Israel’s oldest confession." },
        { title: "One person wearing three masks?", why: "At the Jordan all three are there at once, and the Son prays to his Father. Pictures like water, ice and steam make this same mistake.", ref: "Matthew 3:16–17 · John 17:1", say: "Then the voice and the Son would be one person. The baptism says otherwise." },
      ],
      after: [
        { say: "Not three gods. Not one person in disguise.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "What Christians are sure of, and what stays a mystery.", mood: "tender" },
      ],
      known: {
        label: "What Christians affirm",
        items: [
          { text: "There is one God.", ref: "Deuteronomy 6:4" },
          { text: "The Father, the Son and the Holy Spirit are each God.", ref: "John 1:1 · Acts 5:4" },
          { text: "They are not each other.", ref: "Matthew 3:16–17" },
        ],
      },
      unknown: {
        label: "What stays a mystery",
        items: [
          { text: "How one God is three persons. No picture fully shows it.", ref: "Isaiah 55:9" },
        ],
      },
      after: [
        { say: "Catholic, Orthodox and Protestant churches have confessed this for centuries, in words like the Nicene Creed.", mood: "happy", act: "nod" },
        { say: "They word some finer points differently. One God in three persons, they share.", mood: "thinking" },
      ],
    },

    // back to the question
    {
      kind: "verse",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Now, back to our question. Luke tells the baptism too.", mood: "excited", act: "hop" },
        { say: "Look what Jesus was doing when it happened.", mood: "curious", act: "tilt" },
      ],
      verse: { text: "Now when all the people were baptized, Jesus also had been baptized, and was praying. The sky was opened, and the Holy Spirit descended in a bodily form like a dove on him; and a voice came out of the sky, saying “You are my beloved Son. In you I am well pleased.”", ref: "Luke 3:21–22", translation: WEB },
      after: [
        { say: "He was praying. And his Father answered.", mood: "surprised", act: "react" },
      ],
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "So: if Jesus is God, who was he praying to?",
      options: [
        { text: "To himself", reply: "Remember the Jordan? Two persons there, not one.", mood: "thinking", act: "tilt" },
        { text: "To God the Father", reply: "Yes! The Son, with his Father.", mood: "excited", act: "hop" },
        { text: "To a different, greater god", reply: "Close! But there’s only one God.", mood: "curious", act: "nod" },
      ],
      after: [
        { say: "Jesus was praying to God the Father.", mood: "happy", act: "nod" },
        { say: "Jesus is God the Son. Not the Father, but sharing the same divine nature.", show: "compare", mood: "thinking" },
        { say: "So his prayers weren’t a conversation with himself. They show a real relationship.", mood: "moved", act: "nod" },
      ],
      compare: {
        not: { label: "Not this", text: "Jesus talking to himself" },
        but: { label: "But this", text: "The Son *talking with his Father*" },
      },
    },
    {
      kind: "verse",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "And Jesus was truly human, too.", mood: "tender" },
        { say: "He prayed the way people pray. Early, alone, in the dark.", mood: "tender" },
      ],
      verse: { text: "Early in the morning, while it was still dark, he rose up and went out, and departed into a deserted place, and prayed there.", ref: "Mark 1:35", translation: WEB },
      after: [
        { say: "Fully God, and fully human. He really prayed.", mood: "moved", act: "nod" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "Jesus prayed to his Father. What does that make you wonder about your own prayers?",
      options: [
        { text: "That prayer can be a real conversation", reply: "It was for Jesus. Real words, to a Father who listens." },
        { text: "Whether I can call God Father too", reply: "Jesus taught his friends to pray “Our Father in heaven.” So yes." },
        { text: "That I’m not praying into empty air", reply: "Jesus wasn’t. He prayed to someone. So do you." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "Who was he praying to?",
      body: "",
      summary: [
        "At the Jordan, the Father speaks, the Son rises from the water, and the Spirit comes down.",
        "Scripture says there is one God, that the Son is God, and that the Son is not the Father.",
        "Jesus prayed to his Father: a real relationship, not a conversation with himself.",
      ],
      refs: ["Matthew 3:16–17", "Luke 3:21–22", "Deuteronomy 6:4", "John 1:1–14", "John 17:1–5", "John 14:16–26", "Acts 5:3–4"],
      related: [
        { title: "It Is Written", sub: "Right after the baptism · Matthew 4", lessonId: "it-is-written" },
        { title: "Teach Me to Pray", sub: "“Our Father” · Matthew 6", lessonId: "pray-teach-me" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
