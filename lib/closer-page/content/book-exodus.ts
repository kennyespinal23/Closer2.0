import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Exodus" (Exodus 1–40).
   - Four movements, teaching divisions: rescue from Egypt (1:1–15:21), the wilderness (15:22–18:27),
     covenant at Sinai (19–24), and a place for God to dwell (25–40, with the golden calf in 32–34).
   - Authorship: tradition credits Moses; the text says Moses wrote down certain things (24:4) but names no
     author for the whole book. Scholars differ. Dating the exodus (15th or 13th century BC, or other views) and
     the route and the location of Mount Sinai are debated; labelled as scholars' views.
   - The pivot is 19:1–6: the rescued people arrive at Sinai and are invited into covenant. The book turns from
     being freed from Pharaoh to living with God.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const exodusBook: Book = {
  name: "Exodus",
  title: "The Book of Exodus",
  kicker: "The Book of",
  genre: "law",
  shape: "arc",
  chapterLengths: [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38],
  divisions: "These four movements are teaching divisions to help you see the shape. Exodus has no headings of its own, and readers divide it in different ways.",
  sections: [
    {
      id: "rescue", title: "Out of Egypt", chapters: "Exodus 1–15", from: [1, 1], to: [15, 21],
      gist: "Slavery, a burning bush, ten plagues, and a path through the sea.",
      summary: "Jacob’s family has grown into a people, now enslaved by a Pharaoh who fears them. God calls Moses from a burning bush, confronts Pharaoh through ten plagues, and brings Israel out through the sea. They sing.",
      event: { title: "Crossing the sea", ref: "14:1–31" },
      verse: v("I have surely seen the affliction of my people who are in Egypt, and have heard their cry because of their taskmasters, for I know their sorrows.", "Exodus 3:7"),
      role: "It shows who God is: the one who hears, remembers his promise to Abraham (2:24), and rescues.",
      say: "God hears the cry. Then everything moves!",
    },
    {
      id: "wilderness", title: "Into the Wilderness", chapters: "Exodus 15–18", from: [15, 22], to: [18, 27],
      gist: "Free, hungry and thirsty, and learning to trust day by day.",
      summary: "Days after the sea, the people grumble about water and food. God gives sweet water, manna each morning and water from a rock. Moses’ father-in-law Jethro helps him share the load of leading.",
      event: { title: "Manna from heaven", ref: "16:1–36" },
      verse: v("Behold, I will rain bread from the sky for you, and the people shall go out and gather a day’s portion every day", "Exodus 16:4"),
      role: "Freedom isn’t the end. The people have to learn to depend on God one day at a time.",
      say: "Three days after a miracle, they’re complaining. Relatable?",
    },
    {
      id: "sinai", title: "Covenant at Sinai", chapters: "Exodus 19–24", from: [19, 1], to: [24, 18],
      gist: "At the mountain, God gives the Ten Commandments and makes a covenant.",
      summary: "At Mount Sinai, God invites Israel to be his own people. Thunder and smoke cover the mountain; God speaks the Ten Commandments and further laws, and the people agree to the covenant.",
      event: { title: "The Ten Commandments", ref: "20:1–17" },
      verse: v("I am Yahweh your God, who brought you out of the land of Egypt, out of the house of bondage.", "Exodus 20:2"),
      role: "The commandments start with rescue: God first frees them, then shows them how to live as free people.",
      say: "Notice: rescue first, rules second.",
    },
    {
      id: "dwell", title: "A Place to Dwell", chapters: "Exodus 25–40", from: [25, 1], to: [40, 38],
      gist: "Plans for the tabernacle, a golden calf, and God’s glory filling the tent.",
      summary: "God gives detailed plans for a portable sanctuary. While Moses is on the mountain, the people make a golden calf. Moses pleads for them, God reveals his character, and the tabernacle is built. God’s glory fills it.",
      event: { title: "The golden calf", ref: "32:1–35" },
      verse: v("Let them make me a sanctuary, that I may dwell among them.", "Exodus 25:8"),
      role: "The book’s goal turns out to be God living among his people, and even their failure in chapter 32 doesn’t stop it.",
      say: "Lots of measurements here. Hang on, there’s a reason!",
    },
  ],
  pivot: {
    from: [19, 1], to: [19, 6], ref: "Exodus 19:1–6",
    say: { before: "Plagues, the sea, the desert. Escape!", at: "Here! They reach the mountain.", after: "Now they learn to live with God." },
    verses: [
      v("You have seen what I did to the Egyptians, and how I bore you on eagles’ wings, and brought you to myself.", "Exodus 19:4"),
      v("and you shall be to me a kingdom of priests, and a holy nation.", "Exodus 19:6"),
    ],
    why: "Up to chapter 18 the question is: will they get free? At Sinai the question changes: now that they’re free, what kind of people will they be? God says he brought them “to myself,” and invites them into a covenant. Everything after this is about living with God: the commandments (20), and the tabernacle where he will dwell among them (25:8; 40:34), marked ▲ on the track.",
    before: { label: "“Let my people go”", text: "Slavery in Egypt, ten plagues and the escape through the sea: a story of rescue." },
    after: { label: "“That I may dwell among them”", text: "At Sinai and after: covenant, commandments and a tent where God lives among his people." },
    echoes: [{ at: [25, 8], ref: "25:8" }, { at: [40, 34], ref: "40:34" }],
    regions: [
      { from: [1, 1], to: [12, 36], label: "Egypt" },
      { from: [12, 37], to: [18, 27], label: "The desert" },
      { from: [19, 1], to: [40, 38], label: "Mount Sinai" },
    ],
  },
  threads: [
    {
      id: "hears", title: "The God who hears", say: "Listen to how often God hears and sees.",
      stops: [
        { at: [2, 24], label: "He remembered", note: "The first time God acts in Exodus, it’s to hear and remember.", verse: v("God heard their groaning, and God remembered his covenant with Abraham, with Isaac, and with Jacob.", "Exodus 2:24") },
        { at: [3, 7], label: "I have seen", note: "At the burning bush: seen, heard, known.", verse: v("I have surely seen the affliction of my people who are in Egypt, and have heard their cry", "Exodus 3:7") },
        { at: [3, 14], label: "I AM", note: "Moses asks God’s name, and gets this answer.", verse: v("I AM WHO I AM", "Exodus 3:14") },
        { at: [14, 14], label: "Be still", note: "At the edge of the sea, Moses tells the people God will fight for them.", verse: v("Yahweh will fight for you, and you shall be still.", "Exodus 14:14") },
        { at: [34, 6], label: "Merciful and gracious", note: "After the golden calf, God describes himself. These words are echoed again and again in the Old Testament.", verse: v("Yahweh! Yahweh, a merciful and gracious God, slow to anger, and abundant in loving kindness and truth", "Exodus 34:6") },
      ],
    },
    {
      id: "free", title: "Free to serve", say: "Freedom from something, and for something.",
      stops: [
        { at: [1, 8], label: "A new king", note: "It starts with a ruler who forgot Joseph.", verse: v("Now there arose a new king over Egypt, who didn’t know Joseph.", "Exodus 1:8") },
        { at: [8, 1], label: "Let my people go", note: "The famous demand has a second half: so they may serve God.", verse: v("Let my people go, that they may serve me.", "Exodus 8:1") },
        { at: [15, 2], label: "A song", note: "Just across the sea, the first response is praise.", verse: v("Yah is my strength and song. He has become my salvation.", "Exodus 15:2") },
        { at: [20, 2], label: "Before the commandments", note: "The law begins by reminding them who set them free.", verse: v("I am Yahweh your God, who brought you out of the land of Egypt, out of the house of bondage.", "Exodus 20:2") },
        { at: [24, 7], label: "We will do it", note: "The people agree to the covenant.", verse: v("All that Yahweh has spoken will we do, and be obedient.", "Exodus 24:7") },
      ],
    },
    {
      id: "presence", title: "God with his people", say: "Follow where God’s presence goes.",
      stops: [
        { at: [13, 21], label: "Cloud and fire", note: "God leads them, day and night.", verse: v("Yahweh went before them by day in a pillar of cloud, to lead them on their way, and by night in a pillar of fire, to give them light", "Exodus 13:21") },
        { at: [25, 8], label: "A sanctuary", note: "The reason for all those building plans.", verse: v("Let them make me a sanctuary, that I may dwell among them.", "Exodus 25:8") },
        { at: [32, 1], label: "Make us gods", note: "Impatient, the people want a god they can see.", verse: v("Come, make us gods, which shall go before us", "Exodus 32:1") },
        { at: [33, 14], label: "My presence will go", note: "After the calf, Moses pleads, and God promises to go with them.", verse: v("My presence will go with you, and I will give you rest.", "Exodus 33:14") },
        { at: [40, 34], label: "Glory fills the tent", note: "The book’s last scene: God moves in.", verse: v("Then the cloud covered the Tent of Meeting, and Yahweh’s glory filled the tabernacle.", "Exodus 40:34") },
      ],
    },
  ],
  summary: {
    overview: "God hears his enslaved people, rescues them from Egypt, binds himself to them in covenant at Sinai, and comes to live among them.",
    keys: ["Exodus 2:24", "3:14", "14:13–14", "19:4–6", "20:1–17", "40:34"],
  },
};

export const exodusOverview = BookOverviewExperience(exodusBook, {
  id: "book-exodus",
  title: "Discover Exodus",
  subtitle: "Rescued, and brought near",
  scripture: "Exodus 1–40",
  minutes: 5,
  cover: {
    before: [
      { say: "Forty chapters.", mood: "curious", act: "tilt" },
      { say: "A people set free, and a God who moves in.", mood: "excited", act: "hop" },
      { say: "Let’s see how it all fits together.", mood: "happy", act: "nod" },
    ],
    open: "Let my people… open it!",
    after: [{ say: "“Exodus” means “the way out.” Let’s start with the big picture.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "overview", body: "Narrative and law woven together: the story of Israel’s rescue, then the commandments and the plans for the tabernacle. It’s the second book of the Torah.", say: "Story and law, side by side." },
      { title: "What’s it about?", tag: "text", body: "God hears Israel’s cry in Egypt, sets them free and makes them his people, so that he can dwell among them.", verse: v("Let them make me a sanctuary, that I may dwell among them.", "Exodus 25:8"), say: "Rescue is the start, not the end." },
      { title: "Who wrote it?", tag: "tradition", body: "Tradition credits Moses. The text says Moses wrote down God’s words at Sinai (24:4), but it doesn’t name an author for the whole book. Many scholars think it took shape over time; others hold to Moses.", verse: v("Moses wrote all Yahweh’s words", "Exodus 24:4"), say: "Moses writes in it. The rest is debated." },
      { title: "When and where?", tag: "scholarship", body: "Scholars disagree about when the exodus happened (often placed in the 15th or 13th century BC) and about the route and the location of Mount Sinai. The book doesn’t give dates we can pin to a modern calendar.", say: "The map and the dates are still debated." },
    ],
    after: [{ say: "Now let’s open it right up.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s the whole book, laid out to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a movement.",
    after: [
      { say: "Look how big the last movement is. Nearly half the book!", mood: "surprised", act: "react" },
      { say: "That tells you where Exodus is heading.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each movement.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Out, through, up the mountain, and then God moves in.", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "Partway through, the question the book asks changes.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark through the book and watch what changes.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "Free from Pharaoh. Free for God.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Some big ideas run through the whole book.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "A God who hears, frees and stays.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Exodus, at a glance!", button: "Finish" },
});
