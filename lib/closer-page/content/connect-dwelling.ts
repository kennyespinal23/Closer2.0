import { ConnectionsExperience } from "../lesson/connections";

/* Connections: "God Dwelling With Us" (Exodus 25 → John 1 → Revelation 21).
   - Direct quotation: 2 Corinthians 6:16 ("Even as God said") draws on Leviticus 26:11–12 and Ezekiel 37:27.
   - Named in the text: Exodus completes its own promise (40:34); John explains "the temple of his body" (2:21).
   - Thematic readings: John 1:14's "lived among us" uses a Greek verb related to "tent" (skēnē), and "we saw his
     glory"; John doesn't name the tabernacle. Paul's temple image after John 2 is the reader's link. Revelation 21:3
     echoes the old promise very closely, without an "it is written".
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const connectDwelling = ConnectionsExperience({
  id: "connect-dwelling",
  title: "God Dwelling With Us",
  subtitle: "From a tent in the desert to all things new",
  scripture: "Exodus 25 · John 1 · Revelation 21",
  minutes: 5,
  intro: {
    lines: [
      { say: "What if God wanted to live right among his people?", mood: "curious", act: "tilt" },
      { say: "That wish runs from Exodus to the very last pages. Let’s trace it.", mood: "excited", act: "hop" },
    ],
    display: { text: "God Dwelling With Us", sub: "Exodus 25 → Revelation 21 · Connections" },
    reply: "Let’s pull",
  },
  pull: {
    before: [
      { say: "Exodus 25. Israel is camped in the desert, and God gives instructions.", mood: "thinking" },
      { say: "See the marked words? He wants to dwell among them.", mood: "moved", act: "nod" },
      { say: "Let’s see where this thread goes.", mood: "excited", act: "hop" },
    ],
    size: [600, 960],
    fragments: [
      { id: "ex258", title: "A tent for God", at: [150, 150], mark: "that I may dwell among them", verse: v("Let them make me a sanctuary, that I may dwell among them.", "Exodus 25:8") },
      { id: "ex4034", title: "The glory comes", at: [455, 200], mark: "Yahweh’s glory filled the tabernacle", verse: v("Then the cloud covered the Tent of Meeting, and Yahweh’s glory filled the tabernacle.", "Exodus 40:34") },
      { id: "jn114", title: "The Word lived among us", at: [300, 430], mark: "lived among us. We saw his glory", verse: v("The Word became flesh, and lived among us. We saw his glory, such glory as of the one and only Son of the Father, full of grace and truth.", "John 1:14") },
      { id: "jn221", title: "The temple of his body", at: [465, 650], mark: "he spoke of the temple of his body", verse: v("But he spoke of the temple of his body.", "John 2:21") },
      { id: "co616", title: "You are the temple", at: [140, 650], mark: "you are a temple of the living God", verse: v("What agreement has a temple of God with idols? For you are a temple of the living God. Even as God said, “I will dwell in them, and walk in them; and I will be their God, and they will be my people.”", "2 Corinthians 6:16") },
      { id: "lev2612", title: "The old promise", at: [140, 880], mark: "you will be my people", verse: v("I will walk among you, and will be your God, and you will be my people.", "Leviticus 26:12") },
      { id: "rev213", title: "God with us, at last", at: [455, 890], mark: "God’s dwelling is with people", verse: v("I heard a loud voice out of heaven saying, “Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God.", "Revelation 21:3") },
    ],
    strands: [
      {
        from: "ex258", to: "ex4034", kind: "explicit", label: "The promise kept",
        prompt: "Grab the glowing thread and pull it outward.", say: "They built it, and God came!",
        body: "Exodus closes its own loop. The people build the tent to God’s pattern, and at the end of the book “Yahweh’s glory filled the tabernacle.” The promise and its fulfilment are in the same book.",
      },
      {
        from: "ex4034", to: "jn114", kind: "theme", label: "He pitched his tent among us",
        prompt: "Where does God’s glory show up next?", say: "“We saw his glory”!",
        body: "John says the Word “lived among us,” using a Greek verb related to the word for “tent,” and “we saw his glory.” John doesn’t mention the tabernacle, but many readers hear God’s glory in the tent behind his words.",
      },
      {
        from: "jn114", to: "jn221", kind: "explicit", label: "“The temple of his body”",
        prompt: "In the next chapter, Jesus talks about a temple.", say: "John spells it out for us!",
        body: "Jesus says, “Destroy this temple, and in three days I will raise it up” (2:19). People think he means the building; John says plainly that “he spoke of the temple of his body.”",
      },
      {
        from: "jn221", to: "co616", kind: "theme", label: "From a body to a people",
        prompt: "Paul uses the temple picture too. Pull!", say: "Now the temple is… people?",
        body: "Paul tells the church, “you are a temple of the living God” (also 1 Corinthians 3:16). He doesn’t cite John 2; reading them together, the picture moves from a building, to Jesus’ body, to a people where God lives.",
      },
      {
        from: "co616", to: "lev2612", kind: "quote", label: "“Even as God said”",
        prompt: "Paul says “as God said.” Where?", say: "He’s quoting the old promise!",
        body: "Paul introduces it with “Even as God said,” and the words draw on Leviticus 26:11–12 and Ezekiel 37:27, combined: God dwelling and walking among his people, “and they will be my people.”",
      },
      {
        from: "lev2612", to: "rev213", kind: "theme", label: "At last",
        prompt: "One more. Where does the promise end up?", say: "Right at the end of the Bible!",
        body: "Revelation’s final vision echoes the old promise almost word for word: God dwelling with people, “and they will be his people.” It doesn’t say “it is written,” so it’s shown as an echo rather than a citation, but it’s a strong one.",
      },
    ],
    pattern: {
      title: "From a tent in the desert to all things new",
      body: "God asked for a tent so he could dwell among his people, and his glory filled it. John says the Word lived among us and we saw his glory; Jesus spoke of his body as the temple. Paul calls God’s people a temple and quotes the old promise, and Revelation ends with that promise fulfilled: God’s dwelling is with people. Some threads are named or quoted in the text; others are echoes readers hear.",
      say: "From the first tent to the last page!",
    },
    after: [{ say: "A promise that keeps getting closer. That’s quite a thread.", mood: "moved", act: "nod" }],
  },
  end: {
    title: "God with us.",
    summary: [
      "God asked for a tent so he could dwell among his people, and his glory filled it (Exodus 25, 40).",
      "John says the Word lived among us; Paul calls God’s people his temple.",
      "Revelation ends with the old promise: God’s dwelling is with people.",
    ],
    verse: v("Behold, God’s dwelling is with people, and he will dwell with them", "Revelation 21:3"),
    refs: ["Exodus 25:8", "Exodus 40:34", "John 1:14", "John 2:19–21", "2 Corinthians 6:16", "Leviticus 26:11–12", "Ezekiel 37:27", "Revelation 21:3"],
  },
});
