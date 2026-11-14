import { ConnectionsExperience } from "../lesson/connections";

/* Connections: "The Shepherd" (Psalm 23 → Ezekiel 34 → John 10).
   - Direct quotations: Matthew 26:31 ("it is written") quotes Zechariah 13:7; 1 Peter 2:25 takes up Isaiah 53:6's
     words (as 2:24 does 53:5), without an "it is written".
   - Thematic readings: God as shepherd (Psalm 23, Ezekiel 34); Ezekiel 34 behind John 10 is widely heard, but
     John doesn't cite it; the good shepherd and the struck shepherd are from different Gospels; 1 Peter names Jesus
     "the Shepherd" but doesn't cite John 10.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const connectShepherd = ConnectionsExperience({
  id: "connect-shepherd",
  title: "The Shepherd",
  subtitle: "From Psalm 23 to the good shepherd",
  scripture: "Psalm 23 · Ezekiel 34 · John 10",
  minutes: 5,
  intro: {
    lines: [
      { say: "One of the oldest pictures of God in the Bible is a shepherd.", mood: "curious", act: "tilt" },
      { say: "Let’s see who else picks it up.", mood: "excited", act: "hop" },
    ],
    display: { text: "The Shepherd", sub: "Psalm 23 → John 10 · Connections" },
    reply: "Let’s pull",
  },
  pull: {
    before: [
      { say: "Psalm 23. You might know this one by heart.", mood: "happy" },
      { say: "See the marked words? God, as a shepherd.", mood: "moved", act: "nod" },
      { say: "Let’s see where this thread goes.", mood: "excited", act: "hop" },
    ],
    size: [600, 960],
    fragments: [
      { id: "ps231", title: "My shepherd", at: [150, 150], mark: "Yahweh is my shepherd", verse: v("Yahweh is my shepherd: I shall lack nothing.", "Psalm 23:1") },
      { id: "ezk3415", title: "God will do it himself", at: [455, 230], mark: "I myself will be the shepherd", verse: v("I myself will be the shepherd of my sheep, and I will cause them to lie down,” says the Lord Yahweh.", "Ezekiel 34:15") },
      { id: "jn1011", title: "The good shepherd", at: [300, 460], mark: "I am the good shepherd.", verse: v("I am the good shepherd. The good shepherd lays down his life for the sheep.", "John 10:11") },
      { id: "mt2631", title: "The night of the arrest", at: [465, 680], mark: "I will strike the shepherd", verse: v("Then Jesus said to them, “All of you will be made to stumble because of me tonight, for it is written, ‘I will strike the shepherd, and the sheep of the flock will be scattered.’", "Matthew 26:31") },
      { id: "zec137", title: "Zechariah’s words", at: [465, 890], mark: "Strike the shepherd", verse: v("“Awake, sword, against my shepherd, and against the man who is close to me,” says Yahweh of Armies. “Strike the shepherd, and the sheep will be scattered; and I will turn my hand against the little ones.", "Zechariah 13:7") },
      { id: "pe225", title: "Back to the Shepherd", at: [135, 690], mark: "returned to the Shepherd", verse: v("For you were going astray like sheep; but now have returned to the Shepherd and Overseer of your souls.", "1 Peter 2:25") },
      { id: "isa536", title: "Like sheep gone astray", at: [135, 900], mark: "All we like sheep have gone astray.", verse: v("All we like sheep have gone astray. Everyone has turned to his own way; and Yahweh has laid on him the iniquity of us all.", "Isaiah 53:6") },
    ],
    strands: [
      {
        from: "ps231", to: "ezk3415", kind: "theme", label: "God as shepherd",
        prompt: "Grab the glowing thread and pull it outward.", say: "God says he’ll be the shepherd himself!",
        body: "In Ezekiel 34, God condemns Israel’s leaders as shepherds who fed themselves instead of the flock, then promises: “I myself will be the shepherd of my sheep.” Ezekiel doesn’t quote Psalm 23, but it’s the same picture of God.",
      },
      {
        from: "ezk3415", to: "jn1011", kind: "theme", label: "“I am the good shepherd”",
        prompt: "Who claims to be that shepherd?", say: "Jesus says it about himself!",
        body: "Ezekiel promises God will shepherd his people, through “one shepherd… my servant David” (34:23). In John 10 Jesus says, “I am the good shepherd.” He doesn’t cite Ezekiel, but many readers hear Ezekiel 34 behind his words.",
      },
      {
        from: "jn1011", to: "mt2631", kind: "theme", label: "The shepherd who is struck",
        prompt: "The good shepherd “lays down his life.” Follow that.", say: "On the night he’s arrested…",
        body: "In John, the good shepherd “lays down his life for the sheep.” In Matthew, on the night of his arrest, Jesus speaks of himself as the shepherd who will be struck. Two Gospels, one picture; reading them together is the reader’s step.",
      },
      {
        from: "mt2631", to: "zec137", kind: "quote", label: "“For it is written”",
        prompt: "Jesus says “it is written.” Where?", say: "He’s quoting Zechariah!",
        body: "Jesus introduces the words with “it is written,” and they come from Zechariah 13:7, close rather than word for word: “Strike the shepherd, and the sheep will be scattered.” That night, his disciples did scatter (26:56).",
      },
      {
        from: "jn1011", to: "pe225", kind: "theme", label: "Back to the Shepherd",
        prompt: "Someone writing to scattered believers uses the picture too.", say: "Peter calls Jesus the Shepherd!",
        body: "1 Peter calls Jesus “the Shepherd and Overseer of your souls.” It doesn’t cite John 10, but it’s the same picture: sheep who wandered, brought home.",
      },
      {
        from: "pe225", to: "isa536", kind: "quote", label: "Isaiah’s words, woven in",
        prompt: "“Going astray like sheep.” Where’s that from?", say: "Straight from Isaiah 53!",
        body: "In 1 Peter 2:22–25, Peter weaves in Isaiah 53 again and again: “by whose stripes you were healed” (53:5) and here, sheep going astray (53:6). He doesn’t say “it is written”; the borrowed words are woven into his own.",
      },
    ],
    pattern: {
      title: "From Psalm 23 to the good shepherd",
      body: "Israel sang of God as their shepherd, and the prophets promised God would shepherd his scattered people himself. In the Gospels Jesus calls himself the good shepherd, and the shepherd struck for the flock, quoting Zechariah. 1 Peter brings it home with Isaiah’s words: we were sheep gone astray, now returned. Two threads are quotations; the rest are echoes that many readers hear.",
      say: "One picture, from the psalms to the letters!",
    },
    after: [{ say: "Most of these threads are echoes, and that’s worth knowing too.", mood: "moved", act: "nod" }],
  },
  end: {
    title: "The Shepherd.",
    summary: [
      "Psalm 23 and Ezekiel 34 picture God himself as his people’s shepherd.",
      "Jesus calls himself the good shepherd, and the shepherd who is struck (Zechariah 13:7).",
      "Two threads are quotations; the others are echoes readers hear.",
    ],
    verse: v("I am the good shepherd. The good shepherd lays down his life for the sheep.", "John 10:11"),
    refs: ["Psalm 23", "Ezekiel 34", "John 10:11–16", "Matthew 26:31", "Zechariah 13:7", "1 Peter 2:22–25", "Isaiah 53:5–6"],
  },
});
