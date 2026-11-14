import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Genesis" (Genesis 1–50).
   - The four movements are teaching divisions. They follow the book's own marker, "This is the history of the
     generations of…" (11 times in the WEB, from 2:4 to 37:2), so Abraham's story starts at 11:27 (Terah's
     generations) and overlaps the end of the first movement.
   - Authorship: Jewish and Christian tradition credits Moses; the book names no author. Many scholars see older
     sources woven together over time; others hold to Mosaic authorship. Both labelled as views.
   - Chapters 1–11 are read in different ways by Christians (literal history, theological history, symbolic
     narrative); labelled "Ways it's read", no side taken.
   - The pivot is 12:1–3: the story narrows from all humanity to one family, with a promise for all families.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const genesisBook: Book = {
  name: "Genesis",
  title: "The Book of Genesis",
  kicker: "The Book of",
  genre: "narrative",
  shape: "arc",
  chapterLengths: [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],
  divisions: "These four movements are teaching divisions. They follow Genesis’ own repeated marker, “This is the history of the generations of…”, but readers group the book in different ways.",
  sections: [
    {
      id: "beginnings", title: "Beginnings", chapters: "Genesis 1–11", from: [1, 1], to: [11, 32],
      gist: "Creation, the first humans, and a world that goes wrong and keeps going wrong.",
      summary: "God creates the heavens and the earth and calls it very good. Then come the first disobedience, Cain and Abel, the flood, and the tower of Babel. Humanity keeps breaking things, and God keeps not giving up.",
      event: { title: "The first disobedience in the garden", ref: "3:1–24" },
      verse: v("God saw everything that he had made, and, behold, it was very good.", "Genesis 1:31"),
      role: "It sets the problem the rest of the Bible answers: a good world, broken by people, and a God who still calls out to them (3:9).",
      say: "Very good, then very broken. Fast.",
    },
    {
      id: "abraham", title: "Abraham", chapters: "Genesis 11–25", from: [11, 27], to: [25, 18],
      gist: "God calls one man and makes him a promise meant for the whole world.",
      summary: "God calls Abram to leave home for a land he will be shown, and promises him descendants, land and blessing. Abram trusts, stumbles, waits decades for a son, and is tested on a mountain with Isaac.",
      event: { title: "The test on the mountain", ref: "22:1–19" },
      verse: v("He believed in Yahweh, who credited it to him for righteousness.", "Genesis 15:6"),
      role: "The answer to a broken world starts small: one family, carrying a blessing for every family on earth.",
      say: "From the whole world to one family. Big shift!",
    },
    {
      id: "jacob", title: "Isaac and Jacob", chapters: "Genesis 25–36", from: [25, 19], to: [36, 43],
      gist: "The promise passes on, through a family full of rivalry.",
      summary: "Isaac’s twins, Esau and Jacob, fight from the womb. Jacob tricks his way to the blessing, runs away, is tricked himself, wrestles with God, and is renamed Israel. Years later the brothers meet again and weep.",
      event: { title: "Jacob wrestles and is renamed Israel", ref: "32:22–32" },
      verse: v("Behold, I am with you, and will keep you, wherever you go, and will bring you again into this land.", "Genesis 28:15"),
      role: "The promise doesn’t depend on good behaviour. It keeps moving through flawed people.",
      say: "This family is messy. The promise holds anyway.",
    },
    {
      id: "joseph", title: "Joseph", chapters: "Genesis 37–50", from: [37, 1], to: [50, 26],
      gist: "Sold by his brothers, raised up in Egypt, and the family saved.",
      summary: "Jacob’s favourite son is sold into slavery by his brothers. In Egypt he is falsely accused, imprisoned, then raised to power. When famine comes, his brothers arrive asking for food, and Joseph forgives them.",
      event: { title: "Joseph reveals himself to his brothers", ref: "45:1–15" },
      verse: v("As for you, you meant evil against me, but God meant it for good, to bring to pass, as it is today, to save many people alive.", "Genesis 50:20"),
      role: "It ends with the family safe but in Egypt, still waiting for the land, which sets up Exodus.",
      say: "The longest single story in Genesis. And a tearful one.",
    },
  ],
  pivot: {
    from: [12, 1], to: [12, 3], ref: "Genesis 12:1–3",
    say: { before: "Creation, floods, towers. The whole world.", at: "Here! God speaks to one man.", after: "Now it’s one family’s story." },
    verses: [
      v("Now Yahweh said to Abram, “Leave your country, and your relatives, and your father’s house, and go to the land that I will show you.", "Genesis 12:1"),
      v("All the families of the earth will be blessed through you.", "Genesis 12:3"),
    ],
    why: "Up to chapter 11 the story is about all humanity, and it ends with people scattered at Babel. In 12:1–3 God calls one man, Abram, and promises him a nation, a land and a blessing that reaches “all the families of the earth.” The rest of Genesis follows that promise down the generations, repeated to Isaac and Jacob (26:4; 28:14), marked ▲ on the track.",
    before: { label: "All of humanity", text: "Creation, the garden, the flood and Babel: a story about the whole human race, and how it keeps going wrong." },
    after: { label: "One family, for every family", text: "God works through Abraham’s family, a small, flawed household carrying a promise meant for the whole world." },
    echoes: [{ at: [26, 4], ref: "26:4" }, { at: [28, 14], ref: "28:14" }],
    regions: [
      { from: [1, 1], to: [11, 32], label: "The whole world" },
      { from: [12, 1], to: [36, 43], label: "Canaan and around" },
      { from: [37, 1], to: [50, 26], label: "Egypt" },
    ],
  },
  threads: [
    {
      id: "blessing", title: "A blessing for the world", say: "Watch this promise get passed down.",
      stops: [
        { at: [12, 2], label: "The promise", note: "God promises Abram a great nation, and that he will be a blessing.", verse: v("I will make of you a great nation. I will bless you and make your name great. You will be a blessing.", "Genesis 12:2") },
        { at: [15, 6], label: "Trust", note: "Abram has no child yet. He trusts the promise anyway.", verse: v("He believed in Yahweh, who credited it to him for righteousness.", "Genesis 15:6") },
        { at: [22, 18], label: "After the test", note: "On the mountain, the promise is repeated: all nations.", verse: v("All the nations of the earth will be blessed by your offspring, because you have obeyed my voice.", "Genesis 22:18") },
        { at: [26, 4], label: "To Isaac", note: "The same promise, now to Abraham’s son.", verse: v("In your offspring will all the nations of the earth be blessed", "Genesis 26:4") },
        { at: [28, 15], label: "To Jacob, running away", note: "Jacob is on the run when God promises to stay with him.", verse: v("Behold, I am with you, and will keep you, wherever you go", "Genesis 28:15") },
        { at: [50, 24], label: "Joseph’s last words", note: "The book ends in Egypt, still holding on to the promise of the land.", verse: v("I am dying, but God will surely visit you, and bring you up out of this land to the land which he swore to Abraham, to Isaac, and to Jacob.", "Genesis 50:24") },
      ],
    },
    {
      id: "broken", title: "Broken, but not abandoned", say: "People keep breaking things. God keeps showing up.",
      stops: [
        { at: [3, 9], label: "Where are you?", note: "After the first disobedience, God comes looking.", verse: v("Yahweh God called to the man, and said to him, “Where are you?”", "Genesis 3:9") },
        { at: [4, 9], label: "Where is your brother?", note: "The first murder, and the first excuse.", verse: v("Where is Abel, your brother?” He said, “I don’t know. Am I my brother’s keeper?", "Genesis 4:9") },
        { at: [6, 6], label: "Grief before the flood", note: "The text says God was grieved, not just angry.", verse: v("Yahweh was sorry that he had made man on the earth, and it grieved him in his heart.", "Genesis 6:6") },
        { at: [9, 13], label: "The rainbow", note: "After the flood, a promise to the whole earth.", verse: v("I set my rainbow in the cloud, and it will be a sign of a covenant between me and the earth.", "Genesis 9:13") },
        { at: [11, 4], label: "Babel", note: "People try to make a name for themselves. Next chapter, God promises to make Abram’s name great.", verse: v("let’s make a name for ourselves", "Genesis 11:4") },
      ],
    },
    {
      id: "brothers", title: "Brothers at odds", say: "Genesis is full of brothers who can’t get along.",
      stops: [
        { at: [4, 9], label: "Cain and Abel", note: "It starts with the worst version of it.", verse: v("Am I my brother’s keeper?", "Genesis 4:9") },
        { at: [33, 4], label: "Jacob and Esau", note: "Twenty years after the stolen blessing, Esau runs to meet Jacob.", verse: v("Esau ran to meet him, embraced him, fell on his neck, kissed him, and they wept.", "Genesis 33:4") },
        { at: [37, 3], label: "Joseph’s coat", note: "Favouritism, and the jealousy that follows.", verse: v("Now Israel loved Joseph more than all his children, because he was the son of his old age, and he made him a coat of many colors.", "Genesis 37:3") },
        { at: [45, 5], label: "Joseph forgives", note: "Joseph sees God’s hand even in what his brothers did.", verse: v("Now don’t be grieved, nor angry with yourselves, that you sold me here, for God sent me before you to preserve life.", "Genesis 45:5") },
        { at: [50, 20], label: "Meant for good", note: "The book’s last word on the family: evil meant, good done.", verse: v("you meant evil against me, but God meant it for good", "Genesis 50:20") },
      ],
    },
  ],
  summary: {
    overview: "Where everything begins: a good world broken by people, and a God who answers by making a promise to one family for the sake of every family.",
    keys: ["Genesis 1:1", "1:27", "3:9", "12:1–3", "15:6", "50:20"],
  },
};

export const genesisOverview = BookOverviewExperience(genesisBook, {
  id: "book-genesis",
  title: "Discover Genesis",
  subtitle: "Where everything begins",
  scripture: "Genesis 1–50",
  minutes: 5,
  cover: {
    before: [
      { say: "Fifty chapters.", mood: "curious", act: "tilt" },
      { say: "From the first light to a family in Egypt.", mood: "excited", act: "hop" },
      { say: "Let’s see how it all fits together.", mood: "happy", act: "nod" },
    ],
    open: "In the beginning… open it!",
    after: [{ say: "Genesis means “origin.” Let’s start with the big picture.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "overview", body: "Narrative: stories of beginnings, from creation to the family of Jacob settling in Egypt. It’s the first book of the Torah, the five books of Moses.", verse: v("In the beginning, God created the heavens and the earth.", "Genesis 1:1"), say: "The very first words of the Bible." },
      { title: "How is it built?", tag: "text", body: "Genesis marks its own sections with a repeated line: “This is the history of the generations of…”. It appears eleven times, from 2:4 to 37:2.", verse: v("This is the history of the generations of the heavens and of the earth when they were created", "Genesis 2:4"), say: "The book gives you its own chapter markers!" },
      { title: "Who wrote it?", tag: "tradition", body: "Jewish and Christian tradition credits Moses, though the book itself names no author. Many scholars think it brings together older sources over a long time; others hold to Moses. Both are views, not settled facts.", say: "Tradition says Moses. Scholars debate it." },
      { title: "How to read 1–11?", tag: "readings", body: "Christians read the early chapters in different ways: as literal history, as history told in a theological way, or as symbolic stories. Faithful readers land in different places.", say: "Thoughtful Christians disagree here, and that’s okay." },
    ],
    after: [{ say: "Now let’s open it right up.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s the whole book, laid out to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a movement.",
    after: [
      { say: "See how Abraham starts before Beginnings ends? That’s 11:27.", mood: "cheeky", act: "tilt" },
      { say: "Eleven chapters for the whole world. Thirty-nine for one family.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each movement.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "A broken world, then a promise, passed hand to hand.", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "Somewhere early on, the camera zooms right in.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark through the book and watch what changes.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "Every story after this follows that one promise.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "A few big ideas run through all fifty chapters.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Three threads, one family, one promise.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Genesis, at a glance!", button: "Finish" },
});
