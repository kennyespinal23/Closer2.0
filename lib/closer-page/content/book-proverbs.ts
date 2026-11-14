import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Proverbs" (Proverbs 1–31).
   - A collection: no turning point. Its six parts follow headings the text gives itself (1:1, 10:1, 22:17, 25:1,
     30:1, 31:1); the short titles on the shelf are ours.
   - The parallels between 22:17–24:22 and the Egyptian Instruction of Amenemope are a widely held scholarly
     observation, labelled as such.
   - Proverbs are read as general wisdom, not promises; 26:4–5 shows two sayings that must be weighed against each other.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const proverbsBook: Book = {
  name: "Proverbs",
  title: "The Book of Proverbs",
  kicker: "The Book of",
  genre: "wisdom",
  shape: "collection",
  chapterLengths: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  divisions: "These six parts follow headings in the text itself (1:1, 10:1, 22:17, 25:1, 30:1, 31:1). The short names on the shelf are ours.",
  sections: [
    {
      id: "call", title: "Wisdom’s Call", chapters: "Proverbs 1–9", from: [1, 1], to: [9, 18],
      gist: "Long poems: a parent’s advice, and Wisdom herself calling in the streets.",
      summary: "After the title (1:1), a parent urges a son to choose wisdom over folly. Wisdom is pictured as a woman calling out in public (1:20; 8:1), and folly as a rival voice (9:13).",
      event: { title: "Wisdom calls out in the city", ref: "Proverbs 8" },
      verse: v("The fear of Yahweh is the beginning of knowledge; but the foolish despise wisdom and instruction.", "Proverbs 1:7"),
      role: "It gives the key for the whole book: wisdom starts with reverence for God (1:7; 9:10).",
      say: "Two voices calling. Which one do you follow?",
    },
    {
      id: "solomon", title: "Solomon’s Sayings", chapters: "Proverbs 10–22", from: [10, 1], to: [22, 16],
      gist: "Hundreds of two-line sayings, headed “The proverbs of Solomon.”",
      summary: "The style changes: short, punchy sayings, often contrasting the wise and the foolish, the diligent and the lazy. They’re mostly not grouped by topic, so they reward slow reading.",
      event: { title: "Two lines, one lesson", ref: "Proverbs 10:1" },
      verse: v("A gentle answer turns away wrath, but a harsh word stirs up anger.", "Proverbs 15:1"),
      role: "This is the heart of the book: wisdom for ordinary days, a sentence at a time.",
      say: "Two lines each. Tiny, but they pack a punch!",
    },
    {
      id: "wise", title: "Words of the Wise", chapters: "Proverbs 22–24", from: [22, 17], to: [24, 34],
      gist: "Longer sayings from “the wise,” with a note about “thirty excellent things.”",
      summary: "A new heading introduces “the words of the wise” (22:17), mentioning thirty sayings (22:20). Many scholars note close parallels with an Egyptian teaching text, the Instruction of Amenemope.",
      event: { title: "Thirty sayings of counsel", ref: "Proverbs 22:20" },
      verse: v("Turn your ear, and listen to the words of the wise. Apply your heart to my teaching.", "Proverbs 22:17"),
      role: "It shows wisdom gathered widely, then set within faith in Yahweh (22:19).",
      say: "Wisdom from more than one teacher.",
    },
    {
      id: "hezekiah", title: "Hezekiah’s Copy", chapters: "Proverbs 25–29", from: [25, 1], to: [29, 27],
      gist: "More of Solomon’s proverbs, copied out in King Hezekiah’s day.",
      summary: "The heading says the men of King Hezekiah copied these out (25:1), centuries after Solomon. They’re full of vivid comparisons: apples of gold, a door on its hinges.",
      event: { title: "Two sayings that seem to disagree", ref: "Proverbs 26:4–5" },
      verse: v("A word fitly spoken is like apples of gold in settings of silver.", "Proverbs 25:11"),
      role: "It shows the book being collected over time, and teaches that wisdom means knowing which saying fits.",
      say: "Don’t answer a fool… answer a fool! Wisdom knows when.",
    },
    {
      id: "agur", title: "Agur", chapters: "Proverbs 30", from: [30, 1], to: [30, 33],
      gist: "The humble words of Agur, with lists of things that amaze him.",
      summary: "Agur, son of Jakeh, admits what he doesn’t understand, prays a simple prayer, and lists things in fours: things never satisfied, things too wonderful, small things that are wise.",
      event: { title: "A prayer for just enough", ref: "Proverbs 30:7–9" },
      verse: v("Give me neither poverty nor riches. Feed me with the food that is needful for me", "Proverbs 30:8"),
      role: "It adds humility: the wise know how much they don’t know.",
      say: "Not too rich, not too poor. Just enough!",
    },
    {
      id: "lemuel", title: "Lemuel", chapters: "Proverbs 31", from: [31, 1], to: [31, 31],
      gist: "A king’s mother’s advice, and a poem praising a worthy woman.",
      summary: "King Lemuel records what his mother taught him (31:1). The book ends with a poem, each line beginning with the next letter of the Hebrew alphabet, praising a capable woman who fears Yahweh.",
      event: { title: "The worthy woman", ref: "Proverbs 31:10–31" },
      verse: v("Charm is deceitful, and beauty is vain; but a woman who fears Yahweh, she shall be praised.", "Proverbs 31:30"),
      role: "The book ends where it began: with the fear of Yahweh (1:7; 31:30), now lived out in a whole life.",
      say: "It ends the way it began. Look closely!",
    },
  ],
  threads: [
    {
      id: "words", title: "Words", say: "Proverbs has a lot to say about talking!",
      stops: [
        { at: [10, 19], label: "Fewer words", note: "More talk, more chances to go wrong.", verse: v("In the multitude of words there is no lack of disobedience, but he who restrains his lips does wisely.", "Proverbs 10:19") },
        { at: [12, 18], label: "Swords or healing", note: "Words can wound, or heal.", verse: v("There is one who speaks rashly like the piercing of a sword, but the tongue of the wise heals.", "Proverbs 12:18") },
        { at: [15, 1], label: "A gentle answer", note: "How you say it changes what happens next.", verse: v("A gentle answer turns away wrath, but a harsh word stirs up anger.", "Proverbs 15:1") },
        { at: [18, 21], label: "Life and death", note: "Words carry real weight.", verse: v("Death and life are in the power of the tongue", "Proverbs 18:21") },
        { at: [25, 11], label: "Fitly spoken", note: "The right word at the right time is a treasure.", verse: v("A word fitly spoken is like apples of gold in settings of silver.", "Proverbs 25:11") },
      ],
    },
    {
      id: "work", title: "Work and laziness", say: "Meet the sluggard. He’s a running joke!",
      stops: [
        { at: [6, 6], label: "Watch the ant", note: "Learn from creatures that just get on with it.", verse: v("Go to the ant, you sluggard. Consider her ways, and be wise", "Proverbs 6:6") },
        { at: [6, 10], label: "Just a little sleep", note: "Small delays add up.", verse: v("A little sleep, a little slumber, a little folding of the hands to sleep", "Proverbs 6:10") },
        { at: [14, 23], label: "Talk vs work", note: "Plans need doing, not just discussing.", verse: v("In all hard work there is profit, but the talk of the lips leads only to poverty.", "Proverbs 14:23") },
        { at: [22, 29], label: "Skilled work", note: "Good work is noticed.", verse: v("Do you see a man skilled in his work? He will serve kings.", "Proverbs 22:29") },
        { at: [26, 14], label: "The hinge", note: "The sluggard turns over in bed like a door on its hinges. Proverbs can be funny.", verse: v("As the door turns on its hinges, so does the sluggard on his bed.", "Proverbs 26:14") },
      ],
    },
    {
      id: "fear", title: "Wisdom and the fear of Yahweh", say: "This is the thread that holds the whole book together.",
      stops: [
        { at: [1, 7], label: "The beginning", note: "The book’s motto. “Fear” here means reverence and trust, not terror.", verse: v("The fear of Yahweh is the beginning of knowledge", "Proverbs 1:7") },
        { at: [3, 5], label: "Trust", note: "Wisdom isn’t only cleverness; it leans on God.", verse: v("Trust in Yahweh with all your heart, and don’t lean on your own understanding.", "Proverbs 3:5") },
        { at: [4, 7], label: "Get wisdom", note: "Worth more than anything you own.", verse: v("Wisdom is supreme. Get wisdom.", "Proverbs 4:7") },
        { at: [9, 10], label: "Said again", note: "The motto returns at the end of the opening poems.", verse: v("The fear of Yahweh is the beginning of wisdom.", "Proverbs 9:10") },
        { at: [16, 9], label: "Plans and steps", note: "We plan; God directs.", verse: v("A man’s heart plans his course, but Yahweh directs his steps.", "Proverbs 16:9") },
        { at: [31, 30], label: "The last word", note: "The book closes on the same note it began with.", verse: v("a woman who fears Yahweh, she shall be praised.", "Proverbs 31:30") },
      ],
    },
  ],
  summary: {
    overview: "Sayings and poems for living well before God, gathered from several teachers, all built on one idea: wisdom begins with the fear of Yahweh.",
    keys: ["Proverbs 1:7", "3:5–6", "8", "15:1", "26:4–5", "31:30"],
  },
};

export const proverbsOverview = BookOverviewExperience(proverbsBook, {
  id: "book-proverbs",
  title: "Discover Proverbs",
  subtitle: "Wisdom, two lines at a time",
  scripture: "Proverbs 1–31",
  minutes: 5,
  cover: {
    before: [
      { say: "Thirty-one chapters.", mood: "curious", act: "tilt" },
      { say: "Hundreds of tiny pieces of wisdom.", mood: "excited", act: "hop" },
      { say: "Let’s see how they’re collected.", mood: "happy", act: "nod" },
    ],
    open: "Open it up!",
    after: [{ say: "Fun fact: the book tells you who collected parts of it.", mood: "cheeky", act: "tilt" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "Wisdom: short sayings and longer poems about living well, with God at the centre.", verse: v("The fear of Yahweh is the beginning of knowledge; but the foolish despise wisdom and instruction.", "Proverbs 1:7"), say: "This line is the book’s motto." },
      { title: "Who wrote it?", tag: "text", body: "The book names several sources: Solomon (1:1; 10:1; 25:1), “the wise” (22:17), Agur (30:1) and King Lemuel’s mother (31:1). 1 Kings 4:32 says Solomon spoke three thousand proverbs.", verse: v("These also are proverbs of Solomon, which the men of Hezekiah king of Judah copied out.", "Proverbs 25:1"), say: "More than one author, and the text says so." },
      { title: "When?", tag: "scholarship", body: "The parts come from different times. The note about Hezekiah’s men (25:1) points to editing around 700 BC; when the whole book took its final form is debated.", say: "Collected over a long time." },
      { title: "How should I read it?", tag: "readings", body: "Proverbs describe how life usually works; they aren’t guarantees. The book even puts two sayings side by side that pull opposite ways (26:4–5), so you learn to weigh them.", verse: v("Don’t answer a fool according to his folly, lest you also be like him.", "Proverbs 26:4"), say: "Wisdom, not promises. Big difference!" },
    ],
    after: [{ say: "Now let’s see the collections on the shelf.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s the whole book as a shelf of collections.", mood: "excited", act: "spin" }],
    hint: "Tap a collection.",
    after: [
      { say: "See how much of it is Solomon’s sayings?", mood: "curious", act: "tilt" },
      { say: "And the last two are short: Agur and Lemuel.", mood: "happy", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each collection.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Long poems, then short sayings, then a beautiful ending.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "The sayings jump around. Threads help you follow a topic.", mood: "thinking" }],
    hint: "Pick a topic.",
    after: [{ say: "Read Proverbs slowly. One line can last all day.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Proverbs, at a glance!", button: "Finish" },
});
