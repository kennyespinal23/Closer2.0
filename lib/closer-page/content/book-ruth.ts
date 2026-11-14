import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Ruth" (Ruth 1–4).
   - Four chapters, four scenes; the divisions follow the chapters, which the screen still calls teaching
     divisions (chapter numbers were added much later).
   - Author unknown; the date of writing is debated (from the time of the kings to after the exile).
   - The pivot is 2:19–20: Naomi learns the field belongs to Boaz, "one of our near kinsmen", and the bitter
     "empty" of 1:21 turns to blessing. Chosen because it's where Naomi's outlook changes in her own words.
   - Readings labelled: Jewish tradition reads Ruth at Shavuot; Christians note Ruth in Jesus' genealogy
     (Matthew 1:5).
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const ruthBook: Book = {
  name: "Ruth",
  title: "The Book of Ruth",
  kicker: "The Book of",
  genre: "narrative",
  shape: "arc",
  unit: { unit: "scene", plural: "scenes" },
  chapterLengths: [22, 23, 18, 22],
  divisions: "These four scenes follow the book’s chapters, which were added long after it was written. They’re a way to see the shape, not part of the original story.",
  sections: [
    {
      id: "empty", title: "Emptied", chapters: "Ruth 1", from: [1, 1], to: [1, 22],
      gist: "Famine, three funerals, and a daughter-in-law who refuses to leave.",
      summary: "A family from Bethlehem moves to Moab to escape famine. The father and both sons die. Naomi heads home, and her Moabite daughter-in-law Ruth insists on going with her. Naomi arrives bitter.",
      event: { title: "Ruth’s promise to Naomi", ref: "1:16–17" },
      verse: v("where you go, I will go; and where you stay, I will stay. Your people will be my people, and your God my God.", "Ruth 1:16"),
      role: "It sets the problem: two widows with nothing, one of them a foreigner, and a God Naomi feels has turned against her.",
      say: "One of the most loyal promises in the whole Bible.",
    },
    {
      id: "glean", title: "Gleaning", chapters: "Ruth 2", from: [2, 1], to: [2, 23],
      gist: "Ruth gathers leftover grain, in the field of a kind man named Boaz.",
      summary: "Ruth goes out to glean, picking up grain the harvesters leave behind. She “happens” to end up in the field of Boaz, a relative of Naomi’s husband, who protects her and makes sure she takes home plenty.",
      event: { title: "Ruth meets Boaz", ref: "2:8–16" },
      verse: v("Why have I found favor in your sight, that you should take knowledge of me, since I am a foreigner?", "Ruth 2:10"),
      role: "Kindness starts to answer emptiness, through ordinary work and generous people.",
      say: "She just “happened” to pick his field. Sure, Ruth.",
    },
    {
      id: "floor", title: "At the Threshing Floor", chapters: "Ruth 3", from: [3, 1], to: [3, 18],
      gist: "A bold, risky night-time request, and an honourable answer.",
      summary: "Naomi sends Ruth to Boaz at night at the threshing floor. Ruth asks him to spread his garment over her, as a near kinsman. Boaz agrees, but there’s a closer relative who must be asked first.",
      event: { title: "Ruth’s request", ref: "3:6–13" },
      verse: v("You have shown more kindness in the latter end than at the beginning", "Ruth 3:10"),
      role: "It brings the question to a head: will someone act as redeemer for this family?",
      say: "Tense scene! And Boaz handles it with care.",
    },
    {
      id: "redeemed", title: "Redeemed", chapters: "Ruth 4", from: [4, 1], to: [4, 22],
      gist: "At the town gate Boaz redeems the family land, marries Ruth, and a son is born.",
      summary: "Boaz settles the matter publicly at the gate. He buys the land, marries Ruth, and they have a son, Obed. The women of Bethlehem bless Naomi. The book ends with a family line leading to King David.",
      event: { title: "Boaz redeems the land at the gate", ref: "4:1–12" },
      verse: v("Blessed be Yahweh, who has not left you today without a near kinsman.", "Ruth 4:14"),
      role: "Naomi, who came home empty, holds a grandson, and a small family story turns out to lead to Israel’s great king.",
      say: "From empty to full. And then: David!",
    },
  ],
  pivot: {
    from: [2, 19], to: [2, 20], ref: "Ruth 2:19–20",
    say: { before: "Loss, a long walk, and a bitter homecoming.", at: "Here! Naomi hears one name: Boaz.", after: "Now there’s hope, and a plan." },
    verses: [
      v("May he be blessed by Yahweh, who has not abandoned his kindness to the living and to the dead.", "Ruth 2:20"),
      v("The man is a close relative to us, one of our near kinsmen.", "Ruth 2:20"),
    ],
    why: "In chapter 1 Naomi says the Lord has brought her home empty (1:21). When Ruth comes back with grain from Boaz’s field, Naomi realises who he is: a near kinsman, someone who could redeem the family. Her bitterness turns to blessing, and from here the story moves toward Boaz acting as redeemer (3:9; 4:10), marked ▲ on the track.",
    before: { label: "“Call me Mara”", text: "Famine, death and loss. Naomi changes her name to Mara, “bitter,” and says she has come home empty." },
    after: { label: "“One of our near kinsmen”", text: "Naomi sees God’s kindness again, and makes a plan. The rest of the book moves toward a redeemer." },
    echoes: [{ at: [3, 9], ref: "3:9" }, { at: [4, 10], ref: "4:10" }],
    regions: [
      { from: [1, 1], to: [1, 18], label: "Moab" },
      { from: [1, 19], to: [4, 22], label: "Bethlehem" },
    ],
  },
  threads: [
    {
      id: "kindness", title: "Loyal kindness", say: "Watch one word keep coming back: kindness.",
      stops: [
        { at: [1, 8], label: "Naomi’s blessing", note: "The Hebrew word here, hesed, means loyal, committed love. It runs through the whole book.", verse: v("May Yahweh deal kindly with you, as you have dealt with the dead, and with me.", "Ruth 1:8") },
        { at: [1, 16], label: "Ruth stays", note: "Ruth chooses loyalty over safety.", verse: v("Your people will be my people, and your God my God.", "Ruth 1:16") },
        { at: [2, 12], label: "Under his wings", note: "Boaz blesses Ruth for taking refuge in God.", verse: v("May Yahweh repay your work, and a full reward be given to you from Yahweh, the God of Israel, under whose wings you have come to take refuge.", "Ruth 2:12") },
        { at: [2, 20], label: "Not abandoned", note: "Naomi sees God’s kindness through Boaz.", verse: v("who has not abandoned his kindness to the living and to the dead", "Ruth 2:20") },
        { at: [3, 10], label: "More kindness", note: "Boaz praises Ruth’s kindness to the family.", verse: v("You have shown more kindness in the latter end than at the beginning", "Ruth 3:10") },
      ],
    },
    {
      id: "full", title: "Empty to full", say: "Follow Naomi from empty to full.",
      stops: [
        { at: [1, 21], label: "Brought home empty", note: "Naomi’s lowest point, in her own words.", verse: v("I went out full, and Yahweh has brought me home again empty.", "Ruth 1:21") },
        { at: [2, 3], label: "A field", note: "The first small sign of provision.", verse: v("she happened to come to the portion of the field belonging to Boaz", "Ruth 2:3") },
        { at: [3, 17], label: "Not empty", note: "Boaz sends Ruth home with grain, using the very word Naomi used.", verse: v("Don’t go empty to your mother-in-law.", "Ruth 3:17") },
        { at: [4, 15], label: "Restorer of life", note: "The women bless Naomi over her grandson.", verse: v("He shall be to you a restorer of life, and sustain you in your old age", "Ruth 4:15") },
        { at: [4, 16], label: "In her arms", note: "The book ends with Naomi holding a child.", verse: v("Naomi took the child, and laid him in her bosom, and became nurse to it.", "Ruth 4:16") },
      ],
    },
    {
      id: "redeemer", title: "The redeemer", say: "Who will step in for this family?",
      stops: [
        { at: [2, 20], label: "A near kinsman", note: "A close relative could buy back family land and carry on a family’s name.", verse: v("The man is a close relative to us, one of our near kinsmen.", "Ruth 2:20") },
        { at: [3, 9], label: "Ruth asks", note: "Ruth asks Boaz to act as that kinsman.", verse: v("spread the corner of your garment over your servant; for you are a near kinsman.", "Ruth 3:9") },
        { at: [4, 10], label: "Boaz acts", note: "Publicly, at the town gate, Boaz redeems the land and marries Ruth.", verse: v("Moreover Ruth the Moabitess, the wife of Mahlon, I have purchased to be my wife, to raise up the name of the dead on his inheritance", "Ruth 4:10") },
        { at: [4, 17], label: "To David", note: "The foreigner who came with nothing becomes great-grandmother to King David.", verse: v("They named him Obed. He is the father of Jesse, the father of David.", "Ruth 4:17") },
      ],
    },
  ],
  summary: {
    overview: "A short story of loss and loyal kindness, in which a foreign widow and her mother-in-law are redeemed and their family line leads to King David.",
    keys: ["Ruth 1:16", "1:21", "2:12", "2:20", "3:9", "4:14–17"],
  },
};

export const ruthOverview = BookOverviewExperience(ruthBook, {
  id: "book-ruth",
  title: "Discover Ruth",
  subtitle: "Four chapters, one loyal love",
  scripture: "Ruth 1–4",
  minutes: 5,
  cover: {
    before: [
      { say: "Four chapters.", mood: "curious", act: "tilt" },
      { say: "Two widows, one field, one redeemer.", mood: "excited", act: "hop" },
      { say: "Let’s see how it all fits together.", mood: "happy", act: "nod" },
    ],
    open: "Short and lovely. Open it!",
    after: [{ say: "You could read Ruth in fifteen minutes. Let’s start with the big picture.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "overview", body: "A short story, carefully told: four scenes, a few characters, and lots of dialogue. It’s set in the time of Israel’s judges.", verse: v("In the days when the judges judged, there was a famine in the land.", "Ruth 1:1"), say: "Small book, big heart." },
      { title: "Who’s it about?", tag: "text", body: "Naomi, an Israelite widow; Ruth, her Moabite daughter-in-law; and Boaz, a relative of Naomi’s husband. A foreigner is at the centre of the story.", say: "A foreigner as the hero. That matters." },
      { title: "Who wrote it, and when?", tag: "scholarship", body: "The author is unknown. Scholars date its writing anywhere from the time of the kings to after the exile; the book itself doesn’t say.", say: "Nobody knows who wrote it." },
      { title: "How is it read?", tag: "readings", body: "In Jewish tradition Ruth is read at Shavuot, the harvest Feast of Weeks. Christians also notice that Ruth appears in Jesus’ family line in Matthew’s Gospel.", verse: v("Boaz became the father of Obed by Ruth. Obed became the father of Jesse.", "Matthew 1:5"), say: "Ruth shows up again in the New Testament!" },
    ],
    after: [{ say: "Now let’s open it right up.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s the whole book, laid out to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a scene.",
    after: [
      { say: "Four scenes, almost the same length. A neat little story.", mood: "happy", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each scene.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Empty, gleaning, asking, redeemed. You can feel it lifting.", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "There’s a moment where Naomi’s whole outlook changes.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark through the book and watch what changes.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "One name, and bitterness becomes hope.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "A few big ideas run through these four chapters.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Kindness, fullness, a redeemer. One small, beautiful story.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Ruth, at a glance!", button: "Finish" },
});
