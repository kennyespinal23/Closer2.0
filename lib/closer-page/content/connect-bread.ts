import { ConnectionsExperience } from "../lesson/connections";

/* Connections: "Bread from Heaven" (Exodus 16 → John 6).
   - Direct quotations: the crowd's "As it is written, 'He gave them bread out of heaven to eat'" (John 6:31) is
     closest to Psalm 78:24 (also Exodus 16:4, 15; Nehemiah 9:15); Jesus quotes Deuteronomy 8:3 in Matthew 4:4.
   - Named in the text: Psalm 78 retells the manna; Deuteronomy 8:3 explains it; Jesus sets the manna beside himself
     (John 6:32, 49–51).
   - Thematic reading: "daily bread" and the manna's "day's portion every day". The Greek word behind "daily" is rare
     and its meaning debated; the prayer doesn't cite Exodus.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const connectBread = ConnectionsExperience({
  id: "connect-bread",
  title: "Bread from Heaven",
  subtitle: "From the wilderness to the bread of life",
  scripture: "Exodus 16 · Deuteronomy 8 · John 6",
  minutes: 5,
  intro: {
    lines: [
      { say: "Hungry people in a desert. Bread on the ground every morning.", mood: "curious", act: "tilt" },
      { say: "That bread turns up again and again. Let’s follow it.", mood: "excited", act: "hop" },
    ],
    display: { text: "Bread from Heaven", sub: "Exodus 16 → John 6 · Connections" },
    reply: "Let’s pull",
  },
  pull: {
    before: [
      { say: "Exodus 16. The people are hungry, and God makes a promise.", mood: "thinking" },
      { say: "See the marked words? Bread, raining from the sky.", mood: "surprised", act: "react" },
      { say: "Let’s see where this thread goes.", mood: "excited", act: "hop" },
    ],
    size: [600, 900],
    fragments: [
      { id: "ex164", title: "Bread from the sky", at: [150, 170], mark: "I will rain bread from the sky for you", verse: v("Then Yahweh said to Moses, “Behold, I will rain bread from the sky for you, and the people shall go out and gather a day’s portion every day, that I may test them, whether they will walk in my law, or not.", "Exodus 16:4") },
      { id: "ps7824", title: "The psalm remembers", at: [455, 110], mark: "He rained down manna on them", verse: v("He rained down manna on them to eat, and gave them food from the sky.", "Psalm 78:24") },
      { id: "jn631", title: "The crowd quotes Scripture", at: [455, 390], mark: "He gave them bread out of heaven to eat", verse: v("Our fathers ate the manna in the wilderness. As it is written, ‘He gave them bread out of heaven to eat.’", "John 6:31") },
      { id: "jn635", title: "The bread of life", at: [455, 650], mark: "I am the bread of life", verse: v("Jesus said to them, “I am the bread of life. He who comes to me will not be hungry, and he who believes in me will never be thirsty.", "John 6:35") },
      { id: "mt611", title: "Daily bread", at: [275, 330], mark: "Give us today our daily bread.", verse: v("Give us today our daily bread.", "Matthew 6:11") },
      { id: "dt83", title: "Why the manna?", at: [150, 540], mark: "man does not live by bread only", verse: v("He humbled you, and allowed you to be hungry, and fed you with manna, which you didn’t know, neither did your fathers know; that he might teach you that man does not live by bread only, but man lives by every word that proceeds out of Yahweh’s mouth.", "Deuteronomy 8:3") },
      { id: "mt44", title: "Hungry in the wilderness", at: [190, 800], mark: "Man shall not live by bread alone", verse: v("But he answered, “It is written, ‘Man shall not live by bread alone, but by every word that proceeds out of the mouth of God.’”", "Matthew 4:4") },
    ],
    strands: [
      {
        from: "ex164", to: "ps7824", kind: "explicit", label: "The psalm remembers",
        prompt: "Grab the glowing thread and pull it outward.", say: "Israel sang about it for generations!",
        body: "Psalm 78 retells the wilderness years and names the manna outright: “He rained down manna on them to eat.” The psalm is looking back on Exodus 16 on purpose.",
      },
      {
        from: "ps7824", to: "jn631", kind: "quote", label: "“As it is written”",
        prompt: "Centuries later, someone quotes this. Pull!", say: "The crowd quotes the psalm to Jesus!",
        body: "After Jesus feeds the five thousand, the crowd asks for a sign and quotes Scripture: “He gave them bread out of heaven to eat.” The words are closest to Psalm 78:24, and also recall Exodus 16:4 and 15.",
      },
      {
        from: "jn631", to: "jn635", kind: "explicit", label: "“I am the bread of life”",
        prompt: "How does Jesus answer them?", say: "He answers with himself!",
        body: "Jesus says it wasn’t Moses who gave the bread, but “my Father gives you the true bread out of heaven” (6:32). Then: “I am the bread of life.” He sets them side by side himself: “Your fathers ate the manna in the wilderness, and they died” (6:49).",
      },
      {
        from: "ex164", to: "dt83", kind: "explicit", label: "What the manna was for",
        prompt: "Back to the wilderness. Why bread like this?", say: "Moses explains it himself.",
        body: "Looking back, Moses says the manna came to teach something: “man does not live by bread only, but man lives by every word that proceeds out of Yahweh’s mouth.”",
      },
      {
        from: "dt83", to: "mt44", kind: "quote", label: "“It is written”",
        prompt: "Someone else, hungry in a wilderness, quotes this.", say: "Jesus answers with Deuteronomy!",
        body: "After forty days without food in the wilderness (Matthew 4:2), Jesus is tempted to turn stones into bread. He answers by quoting Deuteronomy 8:3, the very verse about the manna.",
      },
      {
        from: "ex164", to: "mt611", kind: "theme", label: "Enough for today",
        prompt: "One more. A prayer you might know.", say: "A day’s portion, every day…",
        body: "The manna came as “a day’s portion every day.” Many readers hear that in “Give us today our daily bread.” The prayer doesn’t cite Exodus, and the Greek word translated “daily” is rare, so its exact sense is debated.",
      },
    ],
    pattern: {
      title: "From the wilderness to the bread of life",
      body: "In the wilderness God fed his people bread from heaven, a day at a time. Psalm 78 sang about it, Deuteronomy explained it, and when Jesus was hungry in a wilderness of his own, he quoted that explanation. In John 6 the crowd quotes the manna to him, and he answers: “I am the bread of life.” Some threads are quotations, some are named outright, and one is an echo readers hear.",
      say: "Bread all the way through!",
    },
    after: [{ say: "From a desert floor to “I am the bread of life.” What a thread.", mood: "moved", act: "nod" }],
  },
  end: {
    title: "Bread from heaven.",
    summary: [
      "God fed Israel with manna in the wilderness, a day at a time (Exodus 16).",
      "Jesus quoted Deuteronomy’s lesson about it, and called himself the bread of life (John 6).",
      "Some links are quoted or named in the text; one is an echo readers hear.",
    ],
    verse: v("I am the bread of life. He who comes to me will not be hungry, and he who believes in me will never be thirsty.", "John 6:35"),
    refs: ["Exodus 16", "Psalm 78:24", "Deuteronomy 8:3", "Matthew 4:4", "Matthew 6:11", "John 6:31–51"],
  },
});
