import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover the Psalms" (Psalms 1–150).
   - A collection, not a story: no turning point. The five books are the text's own divisions, each closing with a
     blessing of God (41:13, 72:19, 89:52, 106:48; Psalm 150 closes the whole).
   - Headings like "of David" are in the Hebrew text but read three ways (by, for, belonging to); the screen says so.
     This WEB edition doesn't number the headings, so none are quoted.
   - The comparison of five books of Psalms with the five books of Moses is an old Jewish tradition (Midrash on Psalms),
     labelled as tradition.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const psalmsBook: Book = {
  name: "Psalms",
  title: "The Book of Psalms",
  kicker: "The Book of",
  genre: "poetry",
  shape: "collection",
  chapterWord: "psalms",
  chapterLengths: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  divisions: "These five books are the Psalms’ own divisions: each ends with a blessing of God. The names and summaries here are ours, to help you see the shape.",
  sections: [
    {
      id: "one", title: "Book One", chapters: "Psalms 1–41", from: [1, 1], to: [41, 13],
      gist: "Mostly psalms headed “of David”: honest cries for help, and quiet trust.",
      summary: "Psalm 1 opens the door with two paths: the way of the righteous and the way of the wicked. Most psalms here are headed “of David,” and many are laments that turn toward trust.",
      event: { title: "A psalm to know: the shepherd psalm", ref: "Psalm 23" },
      verse: v("Blessed be Yahweh, the God of Israel, from everlasting and to everlasting! Amen and amen.", "Psalm 41:13"),
      role: "It sets the tone: prayer is honest. You can bring God anything, and still end in trust.",
      say: "Every book ends with a blessing. Look at this one!",
    },
    {
      id: "two", title: "Book Two", chapters: "Psalms 42–72", from: [42, 1], to: [72, 20],
      gist: "Songs of the sons of Korah, more of David’s prayers, and a psalm for the king.",
      summary: "It opens with a soul thirsty for God (42–43) and psalms of the sons of Korah, then more of David’s, including his great prayer for mercy (51). It closes with a note: “This ends the prayers by David” (72:20).",
      event: { title: "A psalm to know: a prayer for mercy", ref: "Psalm 51" },
      verse: v("Blessed be his glorious name forever! Let the whole earth be filled with his glory! Amen and amen.", "Psalm 72:19"),
      role: "It widens the view: from one person’s prayers to the king, and to the whole earth filled with God’s glory.",
      say: "“This ends the prayers by David,” and then there are more!",
    },
    {
      id: "three", title: "Book Three", chapters: "Psalms 73–89", from: [73, 1], to: [89, 52],
      gist: "The darkest book: hard questions, national loss, and a promise that seems broken.",
      summary: "Many of these are headed for Asaph (73–83) and the sons of Korah. They wrestle with why the wicked prosper (73) and grieve disaster. Psalm 88 ends in darkness, and Psalm 89 asks where God’s promises to David have gone.",
      event: { title: "A psalm to know: a lament with no happy ending", ref: "Psalm 88" },
      verse: v("Lord, where are your former loving kindnesses, which you swore to David in your faithfulness?", "Psalm 89:49"),
      role: "It shows that faith can live with unanswered questions. Even here, the book still closes with a blessing (89:52).",
      say: "Even the darkest book still ends: “Blessed be Yahweh.”",
    },
    {
      id: "four", title: "Book Four", chapters: "Psalms 90–106", from: [90, 1], to: [106, 48],
      gist: "Looking back to Moses, and singing that Yahweh still reigns.",
      summary: "It begins with the only psalm headed for Moses (90). Then comes a run of “Yahweh reigns” songs (93, 95–99), and two long psalms retelling Israel’s story (105–106).",
      event: { title: "A psalm to know: God, our dwelling place", ref: "Psalm 90" },
      verse: v("Yahweh reigns! He is clothed with majesty! Yahweh is armed with strength.", "Psalm 93:1"),
      role: "After the questions of Book Three, it answers with a bigger picture: kings come and go, but God reigns.",
      say: "After the darkness: “Yahweh reigns!”",
    },
    {
      id: "five", title: "Book Five", chapters: "Psalms 107–150", from: [107, 1], to: [150, 6],
      gist: "Thanksgiving, pilgrim songs, the long love-song to God’s word, and a flood of praise.",
      summary: "It opens with “Give thanks to Yahweh” (107). It holds Psalm 119, the longest chapter in the Bible, the Songs of Ascents sung on the way up to Jerusalem (120–134), and ends with five psalms of pure praise (146–150).",
      event: { title: "Songs for the road: the Songs of Ascents", ref: "Psalms 120–134" },
      verse: v("Let everything that has breath praise Yah! Praise Yah!", "Psalm 150:6"),
      role: "The whole collection lands here: from lament to praise. The last word of the book is praise.",
      say: "And it all ends in one big “Praise Yah!”",
    },
  ],
  threads: [
    {
      id: "lament", title: "Lament", say: "The most common kind of psalm is a complaint to God!",
      stops: [
        { at: [13, 1], label: "How long?", note: "Laments say plainly what hurts, and say it to God.", verse: v("How long, Yahweh? Will you forget me forever? How long will you hide your face from me?", "Psalm 13:1") },
        { at: [13, 5], label: "But I trust", note: "Most laments turn, often with a “but.” The trouble isn’t gone yet; trust comes first.", verse: v("But I trust in your loving kindness. My heart rejoices in your salvation.", "Psalm 13:5") },
        { at: [22, 1], label: "Forsaken", note: "Jesus prayed these words from the cross (Mark 15:34).", verse: v("My God, my God, why have you forsaken me?", "Psalm 22:1") },
        { at: [42, 5], label: "Talking to yourself", note: "Here the psalmist argues with their own despair.", verse: v("Why are you in despair, my soul? Why are you disturbed within me? Hope in God!", "Psalm 42:5") },
        { at: [88, 1], label: "No resolution", note: "Psalm 88 never turns. It’s in the Bible anyway: prayer can end in the dark.", verse: v("Yahweh, the God of my salvation, I have cried day and night before you.", "Psalm 88:1") },
      ],
    },
    {
      id: "praise", title: "Praise", say: "Praise gets louder as the book goes on.",
      stops: [
        { at: [8, 1], label: "How majestic", note: "Praise looks up at creation and is amazed by its Maker.", verse: v("Yahweh, our Lord, how majestic is your name in all the earth", "Psalm 8:1") },
        { at: [34, 1], label: "At all times", note: "Praise as a habit, not just a feeling.", verse: v("I will bless Yahweh at all times. His praise will always be in my mouth.", "Psalm 34:1") },
        { at: [103, 1], label: "My soul", note: "Sometimes you call yourself to praise.", verse: v("Praise Yahweh, my soul! All that is within me, praise his holy name!", "Psalm 103:1") },
        { at: [150, 6], label: "Everything", note: "The last line of the whole book.", verse: v("Let everything that has breath praise Yah! Praise Yah!", "Psalm 150:6") },
      ],
    },
    {
      id: "trust", title: "Trust and thanks", say: "These are the ones people pray in hospital rooms.",
      stops: [
        { at: [23, 1], label: "The shepherd", note: "The best-known psalm: God as a shepherd who provides.", verse: v("Yahweh is my shepherd: I shall lack nothing.", "Psalm 23:1") },
        { at: [30, 11], label: "Mourning to dancing", note: "Thanksgiving remembers a rescue that already happened.", verse: v("You have turned my mourning into dancing for me.", "Psalm 30:11") },
        { at: [46, 1], label: "Refuge", note: "Trust in the middle of trouble, not after it.", verse: v("God is our refuge and strength, a very present help in trouble.", "Psalm 46:1") },
        { at: [107, 1], label: "Give thanks", note: "Book Five opens with thanks, and a line that recurs through the Psalms.", verse: v("Give thanks to Yahweh, for he is good, for his loving kindness endures forever.", "Psalm 107:1") },
        { at: [139, 14], label: "Wonderfully made", note: "Thanks for being known and made by God.", verse: v("I will give thanks to you, for I am fearfully and wonderfully made.", "Psalm 139:14") },
      ],
    },
  ],
  summary: {
    overview: "Israel’s book of prayer and song: 150 psalms in five books, moving through honest lament and trust toward a final burst of praise.",
    keys: ["Psalm 1", "22", "23", "51", "90", "150"],
  },
};

export const psalmsOverview = BookOverviewExperience(psalmsBook, {
  id: "book-psalms",
  title: "Discover the Psalms",
  subtitle: "150 prayers and songs",
  scripture: "Psalms 1–150",
  minutes: 5,
  cover: {
    before: [
      { say: "A hundred and fifty songs.", mood: "curious", act: "tilt" },
      { say: "Every feeling a person can bring to God.", mood: "moved", act: "nod" },
      { say: "Let’s see how they’re gathered.", mood: "excited", act: "hop" },
    ],
    open: "Open the songbook!",
    after: [{ say: "This one isn’t a story. It’s a collection. Watch.", mood: "cheeky", act: "tilt" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "Poetry: prayers and songs for worship, private and together. Hebrew poems often say a thing twice, the second line echoing or sharpening the first.", verse: v("Yahweh is my shepherd: I shall lack nothing.", "Psalm 23:1"), say: "Read them as songs, not as a manual." },
      { title: "Who wrote them?", tag: "tradition", body: "Many psalms carry a heading naming a person: David most often, also Asaph, the sons of Korah, Solomon and Moses (90). Many have no name. “Of David” can mean by, for or belonging to David, and scholars differ on what the headings tell us.", say: "Headings are old, but read in more than one way." },
      { title: "How was it put together?", tag: "scholarship", body: "Scholars think the psalms were written over many centuries and gathered gradually, reaching their final shape around or after the exile. An old Jewish tradition compares the five books of Psalms with the five books of Moses.", say: "Gathered over centuries, not written in one go." },
      { title: "Why does it matter?", tag: "overview", body: "It gives words for every season: complaint, confession, trust, thanks, praise. Jesus prayed the Psalms, even on the cross.", verse: v("My God, my God, why have you forsaken me?", "Psalm 22:1"), say: "These were Jesus’ prayers too." },
    ],
    after: [{ say: "Now let’s pull the five books off the shelf.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here are all 150 psalms, on one shelf.", mood: "excited", act: "spin" }],
    hint: "Tap a book on the shelf.",
    after: [
      { say: "Five books, each ending with a blessing of God.", mood: "happy", act: "nod" },
      { say: "Some people see an echo of the five books of Moses. Neat!", mood: "cheeky", act: "tilt" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each one.", mood: "curious" }],
    hint: "Open each book.",
    after: [{ say: "From lament, through hard questions, to praise. That’s the journey.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Psalms come in kinds. Let’s follow three of them.", mood: "thinking" }],
    hint: "Pick a kind of psalm.",
    after: [{ say: "Whatever you’re feeling, there’s a psalm for it.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s the Psalms, at a glance!", button: "Finish" },
});
