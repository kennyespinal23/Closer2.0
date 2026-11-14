import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 005: "What Was Paul's Thorn in the Flesh?" Status: unresolved.
   - The text: 2 Corinthians 12:7–10. Paul calls it "a thorn in the flesh, a messenger of Satan", asked three times
     for it to go, and was answered "My grace is sufficient for you". He never says what it was.
   - Clues people weigh, each labelled as an inference: Galatians 4:13–15 (a "weakness in the flesh"; they'd have
     given him their eyes), Galatians 6:11 (large letters), 2 Corinthians 10:10 (weak bodily presence), Acts 9:8–9
     (three days blind), Numbers 33:55 (thorns as a picture for enemies).
   - Readings: an illness (eye trouble is a common guess), opponents, an inner struggle. Early Christian writers
     already differed; no named early author is quoted here.
   - Blocks follow the plan, plus a reconstruction of the passage's own sequence (v7–10), because the passage has an
     order even though the thorn has no identity.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

const thorn = v("there was given to me a thorn in the flesh, a messenger of Satan to torment me, that I should not be exalted excessively.", "2 Corinthians 12:7");
const asked = v("Concerning this thing, I begged the Lord three times that it might depart from me.", "2 Corinthians 12:8");
const grace = v("“My grace is sufficient for you, for my power is made perfect in weakness.”", "2 Corinthians 12:9");
const gal413 = v("but you know that because of weakness in the flesh I preached the Good News to you the first time.", "Galatians 4:13");
const gal415 = v("For I testify to you that, if possible, you would have plucked out your eyes and given them to me.", "Galatians 4:15");
const gal611 = v("See with what large letters I write to you with my own hand.", "Galatians 6:11");
const presence = v("For, “His letters”, they say, “are weighty and strong, but his bodily presence is weak, and his speech is despised.”", "2 Corinthians 10:10");
const num = v("then those you let remain of them will be as pricks in your eyes and as thorns in your sides, and they will harass you in the land in which you dwell.", "Numbers 33:55");

export const mysteryThorn = {
  id: "mystery-thorn",
  title: "What Was Paul’s Thorn in the Flesh?",
  subtitle: "Paul names it, and never explains it",
  kind: "Bible mystery",
  scripture: "2 Corinthians 12:7–10 · Galatians 4 · Galatians 6",
  minutes: 5,
  theme: "copper",
  case: { id: "005", status: "Unresolved" },
  sources: [
    { title: "2 Corinthians 12:7–10; 10:10; 11:23–29", publisher: "World English Bible" },
    { title: "Galatians 4:13–15; 6:11", publisher: "World English Bible" },
    { title: "Acts 9:8–9; Numbers 33:55", publisher: "World English Bible" },
  ],
  blocks: [
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Paul tells us he had a thorn in the flesh.", mood: "curious", act: "tilt" },
        { say: "He begged God three times to take it away.", mood: "thinking" },
        { say: "And he never tells us what it was!", mood: "surprised", act: "react" },
      ],
      open: "Open the file. Let’s look at his own words.",
      title: "What Was Paul’s Thorn in the Flesh?",
      refs: ["2 Corinthians 12", "Galatians 4", "Galatians 6", "2 Corinthians 10"],
      after: [{ say: "We’ll weigh every clue. Gently: these are guesses about a real man’s pain.", mood: "tender", act: "nod" }],
    },
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Here’s the evidence board. Six clues from Paul’s letters and beyond.", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "thorn", title: "“A thorn in the flesh”", ref: "2 Cor 12:7", exhibit: { label: "2 Corinthians 12:7–9", verses: [thorn, asked, grace] } },
        { id: "gal4", title: "“Weakness in the flesh”", ref: "Galatians 4:13", exhibit: { label: "Galatians 4:13", verses: [gal413] } },
        { id: "eyes", title: "They’d give him their eyes", ref: "Galatians 4:15", exhibit: { label: "Galatians 4:15", verses: [gal415] } },
        { id: "letters", title: "“Large letters”", ref: "Galatians 6:11", exhibit: { label: "Galatians 6:11", verses: [gal611] } },
        { id: "presence", title: "“Bodily presence is weak”", ref: "2 Cor 10:10", exhibit: { label: "2 Corinthians 10:10", verses: [presence], note: "These are his critics’ words, quoted by Paul." } },
        { id: "num", title: "Thorns in your sides", ref: "Numbers 33:55", exhibit: { label: "Numbers 33:55", verses: [num], note: "In the Old Testament, thorns can be a picture for enemies." } },
      ],
      links: [
        {
          a: "thorn", b: "gal4", label: "Both “in the flesh”", strength: "inference",
          say: "Same phrase! Is it the same problem?",
          body: "Paul mentions a “weakness in the flesh” when he first preached in Galatia, and a “thorn in the flesh” in 2 Corinthians. Many readers connect them. But he never says they’re the same thing, and the letters were written years apart.",
        },
        {
          a: "gal4", b: "eyes", label: "Was it his eyes?", strength: "inference",
          say: "Why mention their eyes?",
          body: "The Galatians would have “plucked out your eyes and given them to me.” Some read that as a hint he had eye trouble. Others take it as a vivid way of saying how much they loved him.",
        },
        {
          a: "eyes", b: "letters", label: "Big handwriting", strength: "inference",
          say: "Large letters… poor eyesight?",
          body: "Paul writes the end of Galatians “with large letters” in his own hand. Some think poor eyesight. Others think he wrote large for emphasis, the way we might underline. The verse doesn’t say.",
        },
        {
          a: "thorn", b: "num", label: "Thorns as enemies", strength: "inference",
          say: "Thorns can be people!",
          body: "In Numbers 33:55, enemies left in the land become “thorns in your sides.” And Paul calls his thorn “a messenger.” So some read it as opponents who harassed him, like those he lists in 2 Corinthians 11.",
        },
        {
          a: "thorn", b: "presence", label: "Weak in person", strength: "inference",
          say: "His critics noticed something.",
          body: "Critics said his “bodily presence is weak.” That could fit an illness, or just a plain speaker. It shows people saw weakness in him; it doesn’t say what the thorn was.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Lots of “maybe.” Let’s sort what’s solid from what’s guessed.", mood: "thinking", act: "nod" }],
    },
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims about the thorn. Where does each one really stand?", mood: "curious", act: "tilt" }],
      claims: [
        { text: "Paul asked the Lord three times to take it away.", fits: ["scripture"], why: "2 Corinthians 12:8 says so directly.", exhibit: { label: "2 Corinthians 12:8", verses: [asked] } },
        { text: "Paul had a weakness in the flesh when he first preached in Galatia.", fits: ["scripture"], why: "Galatians 4:13 says it in so many words, though it doesn’t say what the weakness was.", exhibit: { label: "Galatians 4:13", verses: [gal413] } },
        { text: "The thorn was an eye disease.", fits: ["hypothesis"], why: "A common guess, built from Galatians 4:15 and 6:11. Neither verse says Paul’s eyes were the problem.", exhibit: { label: "Galatians 4:15 · 6:11", verses: [gal415, gal611] } },
        { text: "The thorn and the Galatian weakness were the same thing.", fits: ["hypothesis", "unknown"], why: "Possible, and many think so. But Paul never links them, so it can’t be shown.", exhibit: { label: "2 Corinthians 12:7 · Galatians 4:13", verses: [thorn, gal413] } },
        { text: "We know what the thorn was.", fits: ["unknown"], why: "Paul doesn’t say, and nothing else in Scripture or history settles it.", exhibit: { label: "The record", note: "No biblical text, and no early source that can be checked, identifies the thorn." } },
      ],
      after: [{ say: "Two solid facts, and a lot of honest guessing. Now the theories.", mood: "excited", act: "hop" }],
    },
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Christians have wondered about this for centuries. Here’s what they suggest.", mood: "thinking" }],
      theories: [
        {
          title: "An illness, perhaps his eyes", kind: "scholarship", strength: "inference",
          origin: "Inferred from Galatians 4:13–15 and 6:11, and the phrase “in the flesh”.",
          body: "Paul had some bodily weakness, and the Galatians’ eyes and his large handwriting make eye trouble a common guess. Others suggest different illnesses.",
          against: "No verse names an illness, and the eye clues have other good readings.",
          say: "The most common guess. Still a guess.",
        },
        {
          title: "Opponents who harassed him", kind: "scholarship", strength: "inference",
          origin: "Inferred from “a messenger of Satan”, Old Testament thorn imagery (Numbers 33:55), and 2 Corinthians 10–12.",
          body: "A “messenger” could be a person. In these chapters Paul is battling critics and rivals, and he lists persecutions and dangers just before this passage (2 Corinthians 11:23–29).",
          against: "Paul says “in the flesh”, which many read as bodily. He doesn’t name anyone.",
          say: "Thorns as people. Interesting!",
        },
        {
          title: "An inner struggle or temptation", kind: "tradition", strength: "tradition",
          origin: "Later Christian writers, especially in the medieval West.",
          body: "Some read the thorn as a recurring temptation or spiritual trial that kept Paul humble.",
          against: "Nothing in the passage points to temptation; Paul talks about weakness, insults and hardship (12:10).",
          say: "An old reading, but the text doesn’t lead there.",
        },
        {
          title: "Left unnamed on purpose", kind: "scholarship", strength: "inference",
          origin: "A reading of the passage’s focus, held by many commentators.",
          body: "Paul may leave it vague because the point isn’t the thorn but the answer: “My grace is sufficient for you.” Readers with any weakness can stand where he stood.",
          against: "This explains the silence; it doesn’t identify the thorn.",
          say: "Maybe the not-knowing is the point.",
        },
      ],
      caveat: "Early Christian writers already disagreed about this. None of these readings is proven, and Paul’s own words leave it open.",
      after: [{ say: "Let’s rebuild what the passage actually tells us.", mood: "excited", act: "nod" }],
    },
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Paul’s four verses have an order, even if the thorn has no name.", mood: "thinking" },
        { say: "Where he doesn’t say, we leave a gap.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of the passage.",
      slots: [
        { id: "given", when: "v7", text: "Given so he wouldn’t become proud", ref: "2 Corinthians 12:7" },
        { gap: "What the thorn actually was", say: "Paul never fills this in. Neither will we." },
        { id: "asked", when: "v8", text: "He begged three times for it to go", ref: "2 Corinthians 12:8" },
        { id: "answer", when: "v9", text: "The answer: “My grace is sufficient”", ref: "2 Corinthians 12:9" },
        { id: "strong", when: "v10", text: "“When I am weak, then am I strong”", ref: "2 Corinthians 12:10" },
      ],
      theory: { text: "Eye trouble?", say: "That can sit beside the gap as a guess. It doesn’t fill it." },
      after: [{ say: "The thorn stays unnamed. The answer doesn’t.", mood: "moved", act: "nod" }],
    },
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "What Was Paul’s Thorn in the Flesh?",
      scripture: [
        "Paul had “a thorn in the flesh, a messenger of Satan”, given so he wouldn’t become proud (2 Corinthians 12:7).",
        "He asked three times for it to be removed (12:8).",
        "The answer he received: “My grace is sufficient for you, for my power is made perfect in weakness” (12:9).",
        "Elsewhere he mentions a “weakness in the flesh” when he first preached in Galatia (Galatians 4:13).",
      ],
      uncertain: [
        "What the thorn was: an illness, people, or something else.",
        "Whether it was the same as the Galatian weakness.",
        "Whether it ever went away.",
      ],
      proposed: [
        "An illness, often guessed to be eye trouble (scholarly inference).",
        "Opponents who harassed him (scholarly inference).",
        "An inner temptation (later tradition).",
        "Left unnamed on purpose (a reading of the passage).",
      ],
      note: "Paul’s silence keeps the spotlight on the answer, not the ailment. An open case can still be clear about what matters.",
      refs: ["2 Corinthians 12:7–10", "Galatians 4:13–15", "Galatians 6:11", "2 Corinthians 10:10", "2 Corinthians 11:23–29", "Numbers 33:55"],
      sources: [
        { title: "2 Corinthians 10–12; Galatians 4 and 6; Acts 9:8–9; Numbers 33:55", publisher: "World English Bible" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
