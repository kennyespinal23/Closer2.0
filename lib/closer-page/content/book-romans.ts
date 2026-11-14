import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Romans" (Romans 1–16).
   - A letter, drawn as an argument that builds (shape "argument"): no story, so no turning point.
   - The five steps are a common teaching outline, and the screen says readers outline it differently.
   - In the text: Paul names himself (1:1); Tertius wrote it down (16:22); Paul hasn't visited Rome yet and plans
     to on the way to Spain (15:24), after taking a gift to Jerusalem (15:25–26).
   - Scholars' view: written mid-50s AD, probably from Corinth (Phoebe is from nearby Cenchreae, 16:1).
   - The WEB places the closing doxology at 14:24–26, so its Romans 16 has 24 verses (16:25 is empty). Manuscripts
     differ on where the doxology goes; not made into a scene here.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const romansBook: Book = {
  name: "Romans",
  title: "The Letter to the Romans",
  kicker: "The Letter to the",
  genre: "letter",
  shape: "argument",
  chapterLengths: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 26, 33, 25],
  divisions: "These five steps are a common way to outline Paul’s argument. Paul wrote a letter, not chapters with headings, and readers outline it in different ways.",
  sections: [
    {
      id: "need", title: "Everyone needs it", chapters: "Romans 1–3", from: [1, 1], to: [3, 20],
      gist: "Paul states his theme, then shows that Jews and Gentiles alike fall short.",
      summary: "Paul greets a church he has never visited and names his theme: the Good News is God’s power to save everyone who believes. Then he builds a case that nobody, Jew or Gentile, is right with God on their own.",
      event: { title: "The theme of the letter", ref: "1:16–17" },
      verse: v("For I am not ashamed of the Good News of Christ, because it is the power of God for salvation for everyone who believes; for the Jew first, and also for the Greek.", "Romans 1:16"),
      role: "It sets up the problem the rest of the letter answers: if no one is righteous (3:10), what hope is there?",
      say: "Paul starts with the bad news, so the good news lands.",
    },
    {
      id: "faith", title: "Right with God by faith", chapters: "Romans 3–5", from: [3, 21], to: [5, 21],
      gist: "“But now”: God’s righteousness given as a gift, through faith.",
      summary: "With “But now” the argument turns. God makes people right with himself as a free gift, through faith in Jesus. Paul points to Abraham, who believed God, and celebrates peace with God and a love shown while we were still sinners.",
      event: { title: "Abraham believed God", ref: "4:1–25" },
      verse: v("Being therefore justified by faith, we have peace with God through our Lord Jesus Christ;", "Romans 5:1"),
      role: "This is the answer to the problem of chapters 1–3, and the hinge the rest of the letter swings on.",
      say: "“But now.” Two little words, and everything changes.",
    },
    {
      id: "life", title: "New life", chapters: "Romans 6–8", from: [6, 1], to: [8, 39],
      gist: "Freed from sin, living by the Spirit, held by a love nothing can break.",
      summary: "If grace is free, should we keep sinning? Paul says no: in Christ we share a new life. He is honest about the struggle (chapter 7), then rises to the Spirit who gives life and the promise that nothing can separate us from God’s love.",
      event: { title: "Nothing can separate us", ref: "8:31–39" },
      verse: v("There is therefore now no condemnation to those who are in Christ Jesus, who don’t walk according to the flesh, but according to the Spirit.", "Romans 8:1"),
      role: "It shows what being made right with God does to a life, and ends on the letter’s highest note.",
      say: "Chapter 8 might be the most-loved chapter Paul ever wrote.",
    },
    {
      id: "israel", title: "God and Israel", chapters: "Romans 9–11", from: [9, 1], to: [11, 36],
      gist: "Paul’s grief for his own people, and God’s faithfulness to his promises.",
      summary: "Paul turns to a painful question: what about Israel, God’s people, many of whom haven’t believed? He grieves, wrestles with God’s choices and promises, and ends not with a neat answer but in worship.",
      event: { title: "Paul’s grief for his people", ref: "9:1–5" },
      verse: v("Oh the depth of the riches both of the wisdom and the knowledge of God! How unsearchable are his judgments, and his ways past tracing out!", "Romans 11:33"),
      role: "It asks whether God keeps his word. These chapters are read in quite different ways by Christians.",
      say: "Paul argues until he runs out of argument, then he praises.",
    },
    {
      id: "living", title: "Living it out", chapters: "Romans 12–16", from: [12, 1], to: [16, 24],
      gist: "A living sacrifice: love, peace between groups, travel plans and greetings.",
      summary: "“Therefore”: Paul turns everything into daily life. Offer yourselves to God, love one another, live at peace, and welcome each other across differences. He ends with travel plans and greetings to many friends, women and men, by name.",
      event: { title: "A living sacrifice", ref: "12:1–2" },
      verse: v("Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God.", "Romans 12:2"),
      role: "Belief becomes behaviour. The argument was always meant to end in a changed community.",
      say: "“Therefore.” Now it gets practical.",
    },
  ],
  threads: [
    {
      id: "righteous", title: "Righteousness by faith", say: "The thread the whole argument hangs on.",
      stops: [
        { at: [1, 17], label: "The theme", note: "Paul quotes the prophet Habakkuk to state his theme.", verse: v("For in it is revealed God’s righteousness from faith to faith. As it is written, “But the righteous shall live by faith.”", "Romans 1:17") },
        { at: [3, 10], label: "No one", note: "The low point of the argument, quoting the Psalms.", verse: v("There is no one righteous; no, not one.", "Romans 3:10") },
        { at: [3, 22], label: "But now", note: "The same word, righteousness, now given as a gift.", verse: v("even the righteousness of God through faith in Jesus Christ to all and on all those who believe. For there is no distinction,", "Romans 3:22") },
        { at: [4, 3], label: "Abraham", note: "Paul shows it’s not new: it was true of Abraham.", verse: v("Abraham believed God, and it was accounted to him for righteousness.", "Romans 4:3") },
        { at: [5, 1], label: "Peace", note: "What it leads to.", verse: v("Being therefore justified by faith, we have peace with God through our Lord Jesus Christ;", "Romans 5:1") },
        { at: [10, 9], label: "Confess and believe", note: "The argument put as simply as Paul ever puts it.", verse: v("that if you will confess with your mouth that Jesus is Lord, and believe in your heart that God raised him from the dead, you will be saved.", "Romans 10:9") },
      ],
    },
    {
      id: "grace", title: "Grace", say: "Watch how often Paul says it’s a gift.",
      stops: [
        { at: [3, 24], label: "Freely", note: "Not earned. Given.", verse: v("being justified freely by his grace through the redemption that is in Christ Jesus;", "Romans 3:24") },
        { at: [5, 8], label: "While we were sinners", note: "God’s love didn’t wait for us to improve.", verse: v("But God commends his own love toward us, in that while we were yet sinners, Christ died for us.", "Romans 5:8") },
        { at: [5, 20], label: "More than enough", note: "However big the problem, grace is bigger.", verse: v("where sin abounded, grace abounded more exceedingly;", "Romans 5:20") },
        { at: [6, 23], label: "A free gift", note: "Wages are earned; gifts aren’t.", verse: v("For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.", "Romans 6:23") },
        { at: [11, 6], label: "Grace is grace", note: "If you could earn it, it wouldn’t be grace.", verse: v("And if by grace, then it is no longer of works; otherwise grace is no longer grace.", "Romans 11:6") },
      ],
    },
    {
      id: "spirit", title: "Life in the Spirit", say: "Chapter 8 is where this thread blazes.",
      stops: [
        { at: [8, 2], label: "Set free", note: "The Spirit brings a new kind of law: life.", verse: v("For the law of the Spirit of life in Christ Jesus made me free from the law of sin and of death.", "Romans 8:2") },
        { at: [8, 11], label: "Resurrection life", note: "The same Spirit who raised Jesus lives in believers.", verse: v("But if the Spirit of him who raised up Jesus from the dead dwells in you, he who raised up Christ Jesus from the dead will also give life to your mortal bodies through his Spirit who dwells in you.", "Romans 8:11") },
        { at: [8, 14], label: "Children of God", note: "Led by the Spirit means belonging to the family.", verse: v("For as many as are led by the Spirit of God, these are children of God.", "Romans 8:14") },
        { at: [8, 26], label: "Help in weakness", note: "Even when we don’t know how to pray.", verse: v("the Spirit also helps our weaknesses, for we don’t know how to pray as we ought.", "Romans 8:26") },
        { at: [15, 13], label: "Overflowing hope", note: "Paul’s closing blessing comes back to the Spirit.", verse: v("Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit.", "Romans 15:13") },
      ],
    },
  ],
  summary: {
    overview: "Paul’s great letter of the Good News: everyone needs God’s righteousness, God gives it freely through faith in Jesus, and it creates a new life lived together.",
    keys: ["Romans 1:16–17", "3:21–24", "5:1", "8:1", "8:38–39", "11:33", "12:1–2"],
  },
};

export const romansOverview = BookOverviewExperience(romansBook, {
  id: "book-romans",
  title: "Discover Romans",
  subtitle: "An argument that builds",
  scripture: "Romans 1–16",
  minutes: 5,
  cover: {
    before: [
      { say: "Sixteen chapters.", mood: "curious", act: "tilt" },
      { say: "Not a story this time. A letter.", mood: "excited", act: "hop" },
      { say: "Let’s see how the argument is built.", mood: "happy", act: "nod" },
    ],
    open: "Open it up!",
    after: [{ say: "Paul builds this like a staircase. Step by step.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: who’s writing, and to whom?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "overview", body: "A letter, the longest Paul wrote, to the believers in Rome. It reads like a carefully built argument about the Good News.", say: "A letter with a big argument inside." },
      { title: "Who wrote it?", tag: "text", body: "Paul names himself in the first line. Near the end, the person who actually wrote the words down says hello too: Tertius (16:22).", verse: v("Paul, a servant of Jesus Christ, called to be an apostle, set apart for the Good News of God,", "Romans 1:1"), say: "Paul spoke, Tertius wrote it down!" },
      { title: "Why write it?", tag: "text", body: "Paul hadn’t been to Rome yet. He hoped to visit on his way to Spain, after taking a gift for the poor to Jerusalem.", verse: v("whenever I travel to Spain, I will come to you.", "Romans 15:24"), say: "He was introducing himself." },
      { title: "When and where?", tag: "scholarship", body: "Most scholars date it to the mid-50s AD, probably written from Corinth: Phoebe, who likely carried it, came from nearby Cenchreae (16:1).", say: "A good, well-supported guess." },
    ],
    after: [{ say: "Now, the shape of the argument.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s Romans, laid out like steps.", mood: "excited", act: "spin" }],
    hint: "Tap a step.",
    after: [
      { say: "Each step stands on the one before.", mood: "thinking", act: "nod" },
      { say: "Problem, answer, new life, a hard question, then everyday life.", mood: "cheeky", act: "tilt" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s climb it one step at a time.", mood: "curious" }],
    hint: "Open each step.",
    after: [{ say: "From “no one is righteous” to “accept one another.” What a climb.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Three ideas run through the whole letter.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Faith, grace and the Spirit. That’s Romans in three words.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Romans, at a glance!", button: "Finish" },
});
