import type { Lesson, Source } from "../lesson/types";
const walk: string = require("../assets/lewis/addisons-walk-2008.jpg");

/* Testimony: C. S. Lewis (1898–1963). A story with no single dramatic moment.
   - Dates: born 29 Nov 1898, Belfast; mother died of cancer 1908 (he was nine); wounded in France, April 1918;
     fellow of Magdalen College, Oxford, from 1925; belief in God dated by Lewis to 1929, by Alister McGrath to
     1930 (shown as "Historians differ"); Addison's Walk conversation with Tolkien and Dyson, 19 Sept 1931;
     Whipsnade trip, 28 Sept 1931; BBC talks 1941–44, Mere Christianity 1952; Narnia 1950–56; Cambridge 1954;
     married Joy Davidman 1956, she died 1960; A Grief Observed 1961; died 22 Nov 1963.
   - His books are under copyright and we have no permission to quote them, so nothing of his is quoted; his
     own accounts are described and tagged "From his own telling".
   - We have no licensed photograph of him, so there is no portrait. The one photo is of Addison's Walk today
     (CC BY-SA 3.0), labelled as the place now, not as evidence from 1931. */

const WEB = "World English Bible";

const sources: Source[] = [
  { title: "C.S. Lewis", publisher: "Marion E. Wade Center, Wheaton College", url: "https://www.wheaton.edu/academics/academic-centers/wadecenter/authors/cs-lewis" },
  { title: "The Life of C.S. Lewis Timeline", publisher: "C.S. Lewis Foundation", url: "https://www.cslewis.org/resource/chronocsl/" },
  { title: "C.S. Lewis and Addison’s Walk", publisher: "C.S. Lewis Tour", url: "https://cslewistour.uk/oxford/addisonswalk/" },
  { title: "Tolkien convinces C. S. Lewis that Christ is the true myth (on McGrath’s dating)", publisher: "The Gospel Coalition", url: "https://thegospelcoalition.org/blogs/evangelical-history/85-years-ago-today-j-r-r-tolkien-convinces-c-s-lewis-that-christ-is-the-true-myth" },
  { title: "Addison’s Walk, Magdalen College, Oxford, 2008 (photo: Morel)", publisher: "Wikimedia Commons (CC BY-SA 3.0)", url: "https://commons.wikimedia.org/wiki/File:Addison%27s_Walk,_Magdalen_College,_Oxford_2008.jpg" },
  { title: "His books are under copyright, so this lesson describes his account instead of quoting it", publisher: "Closer" },
];

export const csLewis = {
  id: "cs-lewis",
  title: "The atheist who became a Christian",
  subtitle: "C. S. Lewis, 1898–1963",
  kind: "Testimony",
  scripture: "Oxford · 1929–1931",
  minutes: 6,
  theme: "walnut",
  pronoun: "he",
  sources,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "cheeky" },
      lines: [
        { say: "You might know him from Narnia.", mood: "cheeky", act: "stare" },
        { say: "But C. S. Lewis spent years as a convinced atheist.", mood: "curious", act: "tilt" },
        { say: "And he didn’t change his mind in a flash. It took years.", mood: "thinking", act: "nod" },
      ],
      display: { text: "C. S. Lewis", sub: "1898–1963" },
      reply: "Tell me his story",
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "He grew up in Belfast, surrounded by books.", mood: "happy" },
        { say: "Then life got hard, early.", mood: "tender" },
        { say: "Here’s how he lost his faith.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      events: [
        { year: "1898", title: "Born in Belfast", tag: "fact", body: "Clive Staples Lewis. From childhood he insisted on being called Jack.", say: "Clive Staples Lewis. Call him Jack." },
        { year: "1908", title: "His mother dies", tag: "fact", body: "His mother, Flora, died of cancer when he was nine.", say: "He later wrote that he had prayed she would get better." },
        { year: "Teens", title: "No God, he decides", tag: "account", body: "By his mid-teens he had decided there was no God, as he later told it.", say: "So he decided there was no God." },
        { year: "1918", title: "Wounded in the war", tag: "fact", body: "He served as an officer in the First World War, and was wounded in France in April 1918.", say: "Then the trenches." },
        { year: "1925", title: "Oxford", tag: "fact", body: "He became a fellow of Magdalen College, Oxford, teaching English. Among his new colleagues: J. R. R. Tolkien.", say: "And he met Tolkien." },
      ],
      after: [
        { say: "Brilliant, argumentative, and sure there was no God.", at: "top", mood: "cheeky", act: "stare" },
        { say: "So how did he end up writing about Christianity?", mood: "curious", act: "tilt" },
      ],
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Not in one moment. In two steps, with friends and arguments in between.", mood: "thinking" },
        { say: "Tap through them.", show: "events", mood: "curious" },
      ],
      hint: "Tap each step",
      phases: [
        { id: "god", label: "Believes in God", color: "#A8DCD2" },
        { id: "christ", label: "Believes in Christ", color: "#FFC72C" },
      ],
      events: [
        { year: "1929?", title: "God is real, he admits", phase: "god", tag: "disputed", body: "Lewis dated this to 1929. His biographer Alister McGrath argues the evidence points to 1930. Either way, Lewis described himself as a very reluctant convert.", say: "Step one: God is real. He came reluctantly." },
        { year: "1931", title: "A long night on Addison’s Walk", phase: "christ", tag: "fact", body: "On 19 September, after dinner at Magdalen, he walked and talked late into the night with Tolkien and Hugo Dyson about myth, and whether the story of Christ could be a myth that really happened.", say: "Then a long night of talking with friends." },
        { year: "1931", title: "On the way to the zoo", phase: "christ", tag: "account", body: "On 28 September, riding in the sidecar of his brother Warren’s motorbike to Whipsnade Zoo, he later wrote, he set out not believing Jesus was the Son of God, and arrived believing it.", say: "And step two happened in a motorbike sidecar." },
      ],
      span: { from: 1929, to: 1931, label: "From his first step (1929, or perhaps 1930) to believing in Christ." },
      after: [
        { say: "No storm. No voice. Thinking, arguing, friends, and time.", at: "top", mood: "thinking", act: "nod" },
        { say: "Faith can arrive like that too.", mood: "moved" },
      ],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "That long night happened on a real path in Oxford.", mood: "curious" },
        { say: "Here’s the path today.", mood: "happy", act: "hop", open: true },
      ],
      title: "Addison’s Walk",
      date: "Oxford",
      image: {
        src: walk,
        alt: "A tree-lined riverside path in autumn, misty, with leaves on the ground",
        credit: "Addison’s Walk, Magdalen College, Oxford, in 2008. Photo: Morel, CC BY-SA 3.0, via Wikimedia Commons. The path today, not a photo from 1931.",
      },
      focus: { x: 0.5, y: 0.6, scale: 1.6 },
      notes: [
        { tag: "fact", text: "This is the path where Lewis, Tolkien and Hugo Dyson walked and talked on 19 September 1931." },
        { tag: "account", text: "Lewis later wrote that the long night talk with Dyson and Tolkien had a lot to do with his conversion." },
        { tag: "legend", text: "Often said: he converted in one moment on this walk. His journey took years, and he dated his belief in Christ to a few days later." },
        { tag: "disputed", text: "Historians differ on when his first step happened: 1929, as Lewis said, or 1930, as McGrath argues." },
      ],
      after: [
        { say: "A path, a few friends, and a lot of questions.", mood: "thinking", open: false },
        { say: "Here’s what we know, and what’s often said.", show: "notes", mood: "curious", act: "tilt" },
        { say: "Friends who’ll argue with you can be a gift from God.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "What did he do with his faith?", mood: "thinking" },
        { say: "Look at two seasons.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "Before 1929",
        items: ["A confident atheist", "Sure Christianity was just another myth", "Carrying losses he never forgot"],
      },
      later: {
        label: "1931–1963",
        items: [
          "Gave BBC radio talks on Christianity during the war (1941–44), later published as Mere Christianity (1952)",
          "Wrote The Chronicles of Narnia (1950–56)",
          "Became a professor at Cambridge in 1954",
          "Married Joy Davidman in 1956. After she died in 1960, he wrote A Grief Observed, honest about doubt in grief",
          "Died on 22 November 1963",
        ],
      },
      note: "Faith didn’t make his life easy. After Joy died, he wrote openly about doubting God’s goodness, and about finding his way through.",
      after: [
        { say: "He didn’t pretend to have no questions. He kept bringing them.", mood: "moved" },
        { say: "His books have helped a great many people think about faith since.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "C. S. Lewis",
      lines: [{ say: "That’s C. S. Lewis’s story.", mood: "thinking" }],
      check: {
        prompt: "What stands out to you most about his story?",
        options: [
          { text: "Faith took years.", reply: "It did. Slow isn’t less real.", mood: "moved", act: "nod" },
          { text: "Friends helped him think.", reply: "Tolkien and Dyson didn’t give up on him. Good friends.", mood: "happy", act: "nod" },
          { text: "Honest doubt, even later.", reply: "Yes. Belief and honest questions lived side by side for him.", mood: "thinking", act: "tilt" },
          { text: "I want to think about it.", reply: "Take your time. He did.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Who helps you think through faith?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "C. S. Lewis, 1898–1963",
      body: "The Lord is always closer than you think.",
      summary: [
        "An Oxford scholar who spent years as an atheist.",
        "He came to faith in two steps, through friends, arguments and time.",
        "He wrote Narnia and Mere Christianity, and was honest about doubt and grief.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "The Word became flesh, and lived among us. We saw his glory, such glory as of the one and only Son of the Father, full of grace and truth.",
        ref: "John 1:14",
        translation: WEB,
      },
      sources,
      related: [
        { title: "How can we know God exists?", sub: "Big question · 6 min", lessonId: "god-exists" },
        { title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", lessonId: "god-far-away" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
