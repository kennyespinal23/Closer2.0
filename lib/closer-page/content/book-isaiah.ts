import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Isaiah" (Isaiah 1–66).
   - Prophecy, drawn as a collection of parts (no turning point). The common reading is 1–39, 40–55, 56–66;
     here 1–39 is shown as 1–35 plus the narrative bridge of 36–39 (paralleled in 2 Kings 18–20).
   - Authorship: 1:1 names Isaiah son of Amoz (8th century BC). Tradition holds he wrote the whole book; many
     scholars assign 40–66 to later prophets in his tradition (Cyrus is named in 44:28; 45:1); others hold single
     authorship. All labelled.
   - The servant: Christians read 52:13–53:12 as about Jesus, as the New Testament does (Acts 8:32–35); Jewish
     interpreters have often read the servant as Israel (49:3). Both labelled as readings.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const isaiahBook: Book = {
  name: "Isaiah",
  title: "The Book of Isaiah",
  kicker: "The Book of",
  genre: "prophecy",
  shape: "collection",
  chapterLengths: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  divisions: "Many readers divide Isaiah into three parts: 1–39, 40–55 and 56–66. Here 36–39, a story section, is shown on its own. These are reading divisions, not headings in the text.",
  sections: [
    {
      id: "warning", title: "Warning and Hope", chapters: "Isaiah 1–35", from: [1, 1], to: [35, 10],
      gist: "Judah is warned about injustice, and promised a coming king of peace.",
      summary: "Isaiah confronts Jerusalem’s injustice and empty worship, sees God’s holiness in the temple (6), and speaks to kings facing Assyria. Woven through are promises of a child, a king from Jesse’s line, and peace.",
      event: { title: "Isaiah’s vision in the temple", ref: "Isaiah 6:1–8" },
      verse: v("I heard the Lord’s voice, saying, “Whom shall I send, and who will go for us?” Then I said, “Here I am. Send me!”", "Isaiah 6:8"),
      role: "It sets up the book’s two notes: judgment on sin, and hope beyond it.",
      say: "“Holy, holy, holy.” Isaiah never got over it!",
    },
    {
      id: "hezekiah", title: "Hezekiah’s Crisis", chapters: "Isaiah 36–39", from: [36, 1], to: [39, 8],
      gist: "A story break: Assyria besieges Jerusalem, and Babylon is foreshadowed.",
      summary: "The poetry pauses for narrative, much of it also found in 2 Kings 18–20. Assyria’s army threatens Jerusalem, King Hezekiah prays, the city is spared, and Isaiah warns that Babylon will one day carry everything away.",
      event: { title: "Assyria at the gates", ref: "Isaiah 36–37" },
      verse: v("Behold, the days are coming when all that is in your house, and that which your fathers have stored up until today, will be carried to Babylon.", "Isaiah 39:6"),
      role: "It’s the hinge: the threat changes from Assyria to Babylon, setting up what follows.",
      say: "A story in the middle of the poetry. And it points to Babylon.",
    },
    {
      id: "comfort", title: "Comfort My People", chapters: "Isaiah 40–55", from: [40, 1], to: [55, 13],
      gist: "Comfort for exiles: God will bring them home, and a servant will suffer for many.",
      summary: "The tone shifts to comfort. The audience seems to be exiles in Babylon; Cyrus of Persia is named as the one who will let them return (44:28; 45:1). Four passages describe the servant of Yahweh, ending with the servant who suffers (52:13–53:12).",
      event: { title: "The servant who suffers", ref: "Isaiah 52:13–53:12" },
      verse: v("“Comfort, comfort my people,” says your God.", "Isaiah 40:1"),
      role: "It turns judgment into hope: God hasn’t abandoned his people, and redemption will cost something.",
      say: "Listen to the change in tone. “Comfort, comfort!”",
    },
    {
      id: "new", title: "A New Creation", chapters: "Isaiah 56–66", from: [56, 1], to: [66, 24],
      gist: "Life back home: true worship, justice, and new heavens and a new earth.",
      summary: "These chapters address a community rebuilding. They call for real justice rather than empty fasting (58), open God’s house to foreigners (56:7), announce good news to the poor (61), and end with new heavens and a new earth (65–66).",
      event: { title: "Good news to the humble", ref: "Isaiah 61:1–3" },
      verse: v("For, behold, I create new heavens and a new earth; and the former things will not be remembered, nor come into mind.", "Isaiah 65:17"),
      role: "It carries the hope all the way out: one day, all things made new.",
      say: "It ends looking way, way ahead. New heavens, new earth!",
    },
  ],
  threads: [
    {
      id: "justice", title: "Justice for the oppressed", say: "Isaiah keeps coming back to how people are treated.",
      stops: [
        { at: [1, 17], label: "Seek justice", note: "Worship without justice doesn’t impress God (1:11–17).", verse: v("Learn to do well. Seek justice. Relieve the oppressed. Judge the fatherless. Plead for the widow.", "Isaiah 1:17") },
        { at: [5, 7], label: "The vineyard", note: "A song about a vineyard that grew bad fruit.", verse: v("he looked for justice, but, behold, oppression; for righteousness, but, behold, a cry of distress.", "Isaiah 5:7") },
        { at: [56, 7], label: "For all peoples", note: "God’s house opened to foreigners and outsiders. Jesus quotes this (Mark 11:17).", verse: v("for my house will be called a house of prayer for all peoples.", "Isaiah 56:7") },
        { at: [58, 6], label: "The real fast", note: "The worship God wants: setting people free.", verse: v("to release the bonds of wickedness, to undo the straps of the yoke, to let the oppressed go free, and that you break every yoke?", "Isaiah 58:6") },
        { at: [61, 1], label: "Good news to the humble", note: "Jesus read this passage aloud in Nazareth (Luke 4:16–21).", verse: v("He has sent me to bind up the broken hearted, to proclaim liberty to the captives", "Isaiah 61:1") },
      ],
    },
    {
      id: "servant", title: "The coming king and servant", say: "A child, a branch, a servant. Watch them appear.",
      stops: [
        { at: [9, 6], label: "A child is born", note: "A promised king of peace. Christians read this as fulfilled in Jesus.", verse: v("For to us a child is born. To us a son is given; and the government will be on his shoulders.", "Isaiah 9:6") },
        { at: [11, 1], label: "A shoot from Jesse", note: "A king from David’s family line (Jesse was David’s father).", verse: v("A shoot will come out of the stock of Jesse, and a branch out of his roots will bear fruit.", "Isaiah 11:1") },
        { at: [42, 1], label: "My servant", note: "The first of the servant passages.", verse: v("Behold, my servant, whom I uphold; my chosen, in whom my soul delights", "Isaiah 42:1") },
        { at: [49, 6], label: "A light to the nations", note: "The servant’s mission reaches the whole world. In 49:3 the servant is called “Israel.”", verse: v("I will also give you as a light to the nations, that you may be my salvation to the end of the earth.", "Isaiah 49:6") },
        { at: [53, 5], label: "Pierced for us", note: "Christians read this servant as Jesus, as the New Testament does (Acts 8:32–35). Jewish interpreters have often read the servant as Israel.", verse: v("But he was pierced for our transgressions. He was crushed for our iniquities.", "Isaiah 53:5") },
      ],
    },
    {
      id: "comfort", title: "Comfort and new creation", say: "This thread gets brighter the further you go.",
      stops: [
        { at: [2, 4], label: "Swords into plowshares", note: "Even early on, a vision of peace among nations.", verse: v("they shall beat their swords into plowshares, and their spears into pruning hooks.", "Isaiah 2:4") },
        { at: [11, 6], label: "Wolf and lamb", note: "Peace reaching all creation.", verse: v("The wolf will live with the lamb, and the leopard will lie down with the young goat", "Isaiah 11:6") },
        { at: [40, 1], label: "Comfort, comfort", note: "The great turn toward comfort.", verse: v("“Comfort, comfort my people,” says your God.", "Isaiah 40:1") },
        { at: [40, 31], label: "Wings like eagles", note: "Strength for people who are worn out.", verse: v("But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles.", "Isaiah 40:31") },
        { at: [65, 17], label: "All things new", note: "The hope at the very end of the book.", verse: v("For, behold, I create new heavens and a new earth", "Isaiah 65:17") },
        { at: [66, 13], label: "Like a mother", note: "One of the Bible’s most tender pictures of God.", verse: v("As one whom his mother comforts, so will I comfort you.", "Isaiah 66:13") },
      ],
    },
  ],
  summary: {
    overview: "A prophet’s vision of the Holy One who judges injustice, comforts his people, sends a suffering servant, and promises to make all things new.",
    keys: ["Isaiah 6", "9:6", "40:1", "40:31", "52:13–53:12", "65:17"],
  },
};

export const isaiahOverview = BookOverviewExperience(isaiahBook, {
  id: "book-isaiah",
  title: "Discover Isaiah",
  subtitle: "Judgment, comfort and a new creation",
  scripture: "Isaiah 1–66",
  minutes: 5,
  cover: {
    before: [
      { say: "Sixty-six chapters.", mood: "curious", act: "tilt" },
      { say: "Warnings, comfort, and huge hope.", mood: "excited", act: "hop" },
      { say: "Let’s see how it’s put together.", mood: "happy", act: "nod" },
    ],
    open: "Open it up!",
    after: [{ say: "Isaiah is quoted in the New Testament more than almost any book.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "Prophecy: mostly poetry, with some stories, speaking God’s word to Judah across the reigns of four kings.", verse: v("The vision of Isaiah the son of Amoz, which he saw concerning Judah and Jerusalem, in the days of Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah.", "Isaiah 1:1"), say: "Prophecy is more than predicting. It’s speaking for God." },
      { title: "Who wrote it?", tag: "tradition", body: "The first verse names Isaiah son of Amoz, who prophesied in the 700s BC. Jewish and Christian tradition hold that he wrote the whole book, and the New Testament quotes it under his name.", say: "Tradition says one prophet, Isaiah." },
      { title: "One author or more?", tag: "scholarship", body: "Many scholars think chapters 40–66 come from later prophets in Isaiah’s tradition, around and after the exile, partly because Cyrus of Persia is named. Others hold that Isaiah wrote it all, as prophecy. Both views have careful defenders.", verse: v("Who says of Cyrus, ‘He is my shepherd, and shall perform all my pleasure,’", "Isaiah 44:28"), say: "A real debate. We’ll show you both sides." },
      { title: "What’s it about?", tag: "overview", body: "The holiness of God, judgment on injustice and idolatry, and comfort and hope beyond the exile, all the way to a new creation.", verse: v("Holy, holy, holy, is Yahweh of Armies! The whole earth is full of his glory!", "Isaiah 6:3"), say: "Holy, holy, holy. That’s the heartbeat." },
    ],
    after: [{ say: "Now let’s see its parts on the shelf.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s Isaiah, part by part.", mood: "excited", act: "spin" }],
    hint: "Tap a part.",
    after: [
      { say: "See the little story part in the middle? It’s a hinge.", mood: "cheeky", act: "tilt" },
      { say: "Before it: Assyria. After it: Babylon, and comfort.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each part.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Warning, then comfort, then a whole new world.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Three big threads run through Isaiah.", mood: "thinking" }],
    hint: "Pick a thread.",
    after: [{ say: "Justice, a servant, and hope. Isaiah holds them together.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Isaiah, at a glance!", button: "Finish" },
});
