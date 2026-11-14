import { ConnectionsExperience } from "../lesson/connections";

/* Connections: "The Lamb: From Passover to Jesus".
   Kinds of thread, kept honest:
   - Direct quotation: John 19:36 cites Scripture; the words match the Passover rule (Exodus 12:46; Numbers 9:12),
     and also echo Psalm 34:20. The wording is close rather than identical, and the note says so.
   - Named in the text: Paul calls Christ "our Passover" (1 Corinthians 5:7).
   - Thematic reading: John 1:29 never mentions Passover; John 19:14 places the cross at Passover, but linking the two
     is the reader's step; Revelation's Lamb uses a different Greek word (arnion) from John 1:29 (amnos).
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const connectLamb = ConnectionsExperience({
  id: "connect-lamb",
  title: "The Lamb",
  subtitle: "From Passover to Jesus",
  scripture: "Exodus 12 · John 1:29 · 1 Corinthians 5:7",
  minutes: 5,
  intro: {
    lines: [
      { say: "Some words in the Bible echo for centuries.", mood: "curious", act: "tilt" },
      { say: "Pull one thread, and others start to move.", mood: "excited", act: "hop" },
    ],
    display: { text: "The Lamb", sub: "From Passover to Jesus · Connections" },
    reply: "Let’s pull",
  },
  pull: {
    before: [
      { say: "Exodus 12. The night before Israel left Egypt.", mood: "thinking" },
      { say: "See the marked words? Every family kills a lamb.", mood: "curious", act: "tilt" },
      { say: "Let’s see where this thread goes.", mood: "excited", act: "hop" },
    ],
    size: [600, 860],
    fragments: [
      { id: "ex21", title: "The Passover lamb", at: [150, 190], mark: "kill the Passover", verse: v("Then Moses called for all the elders of Israel, and said to them, “Draw out, and take lambs according to your families, and kill the Passover.", "Exodus 12:21") },
      { id: "jn129", title: "The Lamb of God", at: [450, 330], mark: "Behold, the Lamb of God", verse: v("The next day, he saw Jesus coming to him, and said, “Behold, the Lamb of God, who takes away the sin of the world!", "John 1:29") },
      { id: "co57", title: "Christ, our Passover", at: [290, 540], mark: "Christ, our Passover, has been sacrificed", verse: v("Purge out the old yeast, that you may be a new lump, even as you are unleavened. For indeed Christ, our Passover, has been sacrificed in our place.", "1 Corinthians 5:7") },
      { id: "jn1936", title: "At the cross", at: [455, 730], mark: "A bone of him will not be broken", verse: v("For these things happened, that the Scripture might be fulfilled, “A bone of him will not be broken.”", "John 19:36") },
      { id: "ex46", title: "The Passover rule", at: [140, 790], mark: "Do not break any of its bones.", verse: v("It must be eaten in one house. You shall not carry any of the meat outside of the house. Do not break any of its bones.", "Exodus 12:46") },
      { id: "rev512", title: "The Lamb on the throne", at: [460, 100], mark: "Worthy is the Lamb who has been killed", verse: v("saying with a loud voice, “Worthy is the Lamb who has been killed to receive the power, wealth, wisdom, strength, honor, glory, and blessing!”", "Revelation 5:12") },
    ],
    strands: [
      {
        from: "ex21", to: "jn129", kind: "theme", label: "“The Lamb of God”",
        prompt: "Grab the glowing thread and pull it outward.", say: "A lamb again! And this one has a name.",
        body: "John the Baptist doesn’t mention Passover here. But with Exodus 12 in mind, many readers hear the Passover lamb in his words; some also think of Isaiah 53:7, “as a lamb that is led to the slaughter.” The text doesn’t say which he meant.",
      },
      {
        from: "ex21", to: "co57", kind: "explicit", label: "Christ, our Passover",
        prompt: "Back to Exodus. There’s another thread here.", say: "Paul says it outright!",
        body: "Here the link is spelled out: Paul calls Christ “our Passover” and says he “has been sacrificed.” He even borrows the Passover custom of clearing yeast from the house (Exodus 12:15) to talk about a fresh start.",
      },
      {
        from: "jn129", to: "jn1936", kind: "theme", label: "From the first chapter to the cross",
        prompt: "Follow the Lamb through John’s Gospel.", say: "Same Gospel, eighteen chapters later!",
        body: "John opens with “the Lamb of God,” and he sets the crucifixion on “the Preparation Day of the Passover” (19:14). The timing is in the text; reading the two moments together as one picture is a step many readers take.",
      },
      {
        from: "jn1936", to: "ex46", kind: "quote", label: "“Not one bone broken”",
        prompt: "John says this fulfils Scripture. Which one?", say: "He’s quoting the Passover rule itself!",
        body: "John says it happened “that the Scripture might be fulfilled.” The words match the rule for the Passover lamb (Exodus 12:46; also Numbers 9:12), close rather than identical, as New Testament quotations often are. They also echo Psalm 34:20, so John may have both in view.",
      },
      {
        from: "jn129", to: "rev512", kind: "theme", label: "The Lamb who was killed",
        prompt: "One more. Where does the Lamb end up?", say: "From a riverbank to the throne room!",
        body: "Revelation calls Jesus “the Lamb” again and again: a Lamb “as though it had been slain” (5:6), now at the centre of heaven’s worship. It uses a different Greek word from John 1:29, but readers have long heard the two together.",
      },
    ],
    pattern: {
      title: "From Passover to Jesus",
      body: "In Exodus, a lamb was killed at Passover, its blood marked the homes God passed over, and the people were brought out of Egypt. The New Testament writers saw Jesus’ death in that light: Paul names him “our Passover,” John sets the cross at Passover and cites its rule, and the Lamb runs right through to Revelation. Some threads are stated outright; others are echoes readers hear.",
      say: "Look at that! It all hangs together.",
    },
    after: [{ say: "Quotations, named links, and echoes. Each one worth seeing for what it is.", mood: "moved", act: "nod" }],
  },
  end: {
    title: "The Lamb.",
    summary: [
      "At the first Passover, a lamb’s blood marked the homes God passed over (Exodus 12).",
      "Paul calls Christ “our Passover,” and John sets the cross at Passover.",
      "Some links are quoted or named in the text; others are echoes readers hear.",
    ],
    verse: v("Behold, the Lamb of God, who takes away the sin of the world!", "John 1:29"),
    refs: ["Exodus 12", "John 1:29", "John 19:14, 36", "1 Corinthians 5:7", "Revelation 5:6–12"],
  },
});
