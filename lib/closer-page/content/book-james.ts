import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover the Letter of James" (James 1–5).
   - Shape: a collection. James has no agreed outline; the four topics are one way to group it, and the screen says so.
   - Author: the letter names "James" (1:1) but not which one. James the brother of Jesus is the usual tradition;
     some scholars think it was written later in his name.
   - Faith and works: 2:24 is quoted as it stands, beside Paul's wording in Romans 3:28 (paraphrased), labelled as a
     much-discussed passage that Christians reconcile in different ways.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const jamesBook: Book = {
  name: "James",
  title: "The Letter of James",
  kicker: "The Letter of",
  genre: "letter",
  shape: "collection",
  chapterLengths: [27, 26, 18, 17, 20],
  divisions: "James has no agreed outline. These four topics are one helpful way to group it, and themes like speech, wealth and patience come back more than once.",
  sections: [
    {
      id: "trials", title: "Trials and wisdom", chapters: "James 1", from: [1, 1], to: [1, 27],
      gist: "Hard times, wisdom from God, and doing what you hear.",
      summary: "James opens with joy in hard times, asking God for wisdom, and being doers of the word, not only hearers.",
      event: { title: "Be doers, not only hearers", ref: "1:22–25" },
      verse: v("But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.", "James 1:5"),
      role: "It sets the tone for the whole letter: faith gets tested, and faith gets lived.",
      say: "Joy in trials? James starts bold!",
    },
    {
      id: "faith", title: "Faith that acts", chapters: "James 2", from: [2, 1], to: [2, 26],
      gist: "No favourites, and a faith you can see.",
      summary: "Don’t favour the rich over the poor. Faith without works is dead, as James shows with Abraham and Rahab.",
      event: { title: "Favouritism at the meeting", ref: "2:1–4" },
      verse: v("Even so faith, if it has no works, is dead in itself.", "James 2:17"),
      role: "For many readers this is the heart of the letter: real faith shows up in what you do.",
      say: "Faith that just sits there? James isn’t having it.",
    },
    {
      id: "words", title: "Words and wisdom", chapters: "James 3", from: [3, 1], to: [3, 18],
      gist: "A small tongue, a big fire, and wisdom from above.",
      summary: "The tongue is small but powerful, like a bit, a rudder or a spark. Then two kinds of wisdom: earthly, and the wisdom from above.",
      event: { title: "The tongue as a fire", ref: "3:5–6" },
      verse: v("But the wisdom that is from above is first pure, then peaceful, gentle, reasonable, full of mercy and good fruits, without partiality, and without hypocrisy.", "James 3:17"),
      role: "It brings faith down to something we do all day long: talk.",
      say: "A tiny spark, a whole forest. Yikes!",
    },
    {
      id: "humble", title: "Humility, wealth and patience", chapters: "James 4–5", from: [4, 1], to: [5, 20],
      gist: "Draw near to God, hold plans loosely, wait patiently, pray together.",
      summary: "Quarrels start inside us. Draw near to God, don’t boast about tomorrow, hear a sharp warning to rich oppressors, wait patiently, and pray for one another.",
      event: { title: "Pray for one another", ref: "5:13–16" },
      verse: v("Draw near to God, and he will draw near to you.", "James 4:8"),
      role: "It ends where faith is lived out together: patience, honesty and prayer.",
      say: "James ends where faith lives: together, in prayer.",
    },
  ],
  threads: [
    {
      id: "words", title: "Our words", say: "Mouths come up a lot in James!",
      stops: [
        { at: [1, 19], label: "Swift to hear", note: "Listen first. Speak slowly. Anger last.", verse: v("let every man be swift to hear, slow to speak, and slow to anger", "James 1:19") },
        { at: [3, 5], label: "A small fire", note: "The tongue is tiny, and it can set a whole forest alight.", verse: v("So the tongue is also a little member, and boasts great things. See how a small fire can spread to a large forest!", "James 3:5") },
        { at: [3, 10], label: "Same mouth", note: "Blessing God and cursing people from one mouth doesn’t fit.", verse: v("Out of the same mouth comes blessing and cursing. My brothers, these things ought not to be so.", "James 3:10") },
        { at: [3, 18], label: "Peacemakers", note: "Words can also sow peace.", verse: v("Now the fruit of righteousness is sown in peace by those who make peace.", "James 3:18") },
      ],
    },
    {
      id: "action", title: "Faith in action", say: "Watch faith get its hands dirty.",
      stops: [
        { at: [1, 22], label: "Doers", note: "Hearing isn’t the same as doing.", verse: v("But be doers of the word, and not only hearers, deluding your own selves.", "James 1:22") },
        { at: [1, 27], label: "Pure religion", note: "James defines real religion with people: orphans and widows.", verse: v("Pure religion and undefiled before our God and Father is this: to visit the fatherless and widows in their affliction, and to keep oneself unstained by the world.", "James 1:27") },
        { at: [2, 17], label: "Faith without works", note: "A faith that does nothing, James says, is dead.", verse: v("Even so faith, if it has no works, is dead in itself.", "James 2:17") },
        { at: [2, 26], label: "Body and spirit", note: "He closes the argument with a picture.", verse: v("For as the body apart from the spirit is dead, even so faith apart from works is dead.", "James 2:26") },
        { at: [5, 16], label: "Pray for each other", note: "Action includes prayer, done together.", verse: v("Confess your offenses to one another, and pray for one another, that you may be healed.", "James 5:16") },
      ],
    },
    {
      id: "rich", title: "The poor and the rich", say: "James is very direct about money.",
      stops: [
        { at: [2, 1], label: "No favourites", note: "Treating people differently by their clothes doesn’t fit with faith in Jesus.", verse: v("My brothers, don’t hold the faith of our Lord Jesus Christ of glory with partiality.", "James 2:1") },
        { at: [2, 5], label: "Rich in faith", note: "God chose the poor to be rich in faith.", verse: v("Didn’t God choose those who are poor in this world to be rich in faith, and heirs of the Kingdom which he promised to those who love him?", "James 2:5") },
        { at: [4, 14], label: "A vapor", note: "Plans for profit, held loosely: life is short.", verse: v("For what is your life? For you are a vapor, that appears for a little time, and then vanishes away.", "James 4:14") },
        { at: [5, 4], label: "Wages held back", note: "A sharp warning: unpaid workers’ cries reach God.", verse: v("Behold, the wages of the laborers who mowed your fields, which you have kept back by fraud, cry out, and the cries of those who reaped have entered into the ears of the Lord of Armies.", "James 5:4") },
      ],
    },
  ],
  summary: {
    overview: "A practical letter of wisdom that says faith is real when it shows up in what we do, say and give.",
    keys: ["James 1:5", "1:22", "2:17", "3:5", "4:8", "5:16"],
  },
};

export const jamesOverview = BookOverviewExperience(jamesBook, {
  id: "book-james",
  title: "Discover the Letter of James",
  subtitle: "Five chapters of faith in action",
  scripture: "James 1–5",
  minutes: 5,
  cover: {
    before: [
      { say: "Five short chapters.", mood: "curious", act: "tilt" },
      { say: "Packed with practical wisdom.", mood: "excited", act: "hop" },
      { say: "Let’s see how it’s put together.", mood: "happy", act: "nod" },
    ],
    open: "Open it up!",
    after: [{ say: "James gets straight to the point. Let’s look at the big picture.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "A letter “to the twelve tribes which are in the Dispersion,” though it reads more like wisdom teaching: short, practical and full of pictures.", verse: v("James, a servant of God and of the Lord Jesus Christ, to the twelve tribes which are in the Dispersion: Greetings.", "James 1:1"), say: "A letter that sounds like Proverbs!" },
      { title: "Who wrote it?", tag: "tradition", body: "The letter names James, but not which James. Tradition usually holds it was James the brother of Jesus, a leader of the church in Jerusalem. Some scholars think it was written later in his name.", say: "A name in the text. Which James is tradition." },
      { title: "What’s it about?", tag: "overview", body: "Living out faith: in hard times, in what we say, in how we treat the poor, and in patience and prayer.", say: "Everyday faith, start to finish." },
      { title: "Faith and works?", tag: "readings", body: "James 2:24 says a person is justified by works, and not only by faith. Paul writes in Romans 3:28 that a person is justified by faith apart from the works of the law. Christians reconcile the two in different ways; many read James as saying real faith shows itself in action.", verse: v("You see then that by works, a man is justified, and not only by faith.", "James 2:24"), say: "A much-discussed verse. Read it slowly." },
    ],
    after: [{ say: "Now let’s take it off the shelf.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "James isn’t a story. It’s more like a shelf of teachings.", mood: "excited", act: "spin" }],
    hint: "Tap a topic.",
    after: [{ say: "One way to group it. The topics keep circling back, like good advice does.", mood: "cheeky", act: "tilt" }],
  },
  architecture: {
    before: [{ say: "Let’s look inside each one.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Trials, actions, words, patience. All of life, really.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "A few big ideas run through all five chapters.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Words, actions, money. James covers the lot.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s James, at a glance!", button: "Finish" },
});
