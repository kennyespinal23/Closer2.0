import type { Lesson } from "../lesson/types";

/* Faith & Science, the first Discovery Lab: Can you believe in God and the Big Bang?
   You work the evidence yourself (a model of expanding space, galaxy redshift, the cosmic microwave background), meet
   Georges Lemaître, then sort which questions science can test and which go further.

   Kept honest, line by line:
   - Every finding is labelled: observation, scientific model, interpretation, or open question.
   - The expansion is a simplified model, and says so: a patch of space, not a view from outside; no centre, no edge,
     not an explosion into empty space. Galaxies themselves don't grow; the gaps between them do.
   - Redshift values are illustrative, with distances worked from them (about 70 km/s per megaparsec).
   - Lemaître is one of several who built the model (Friedmann, Hubble, Alpher and Herman, Penzias and Wilson).
     His words are quoted only where they're on record; everything else is told as documented fact.
   - The Big Bang is never presented as proof of God, or as disproof. Christians don't all agree, and that's said.
   - Scripture is the World English Bible, word for word. The reflection is optional and nothing in it is saved. */

const WEB = "World English Bible";

export const scienceBigBang = {
  id: "science-big-bang",
  title: "Can You Believe in God and the Big Bang?",
  subtitle: "A Discovery Lab on how the universe began",
  kind: "Faith and science",
  scripture: "Genesis 1:1 · Psalm 19:1",
  minutes: 5,
  theme: "cosmos",
  pronoun: "he",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      display: { text: "Can You Believe in God and the Big Bang?", sub: "Faith & Science · Discovery Lab" },
      lines: [
        { say: "Welcome to the lab!", mood: "excited", act: "hop" },
        { say: "Today’s question is a big one. Literally.", mood: "cheeky", act: "stare" },
        { say: "If science explains how the universe developed, where does God fit in?", mood: "curious", act: "tilt" },
      ],
      reply: "Let’s find out",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What’s your first thought?",
      options: [
        { text: "Science leaves less room for God", reply: "Plenty of people feel that. Let’s test it.", mood: "thinking", act: "nod" },
        { text: "Maybe God works through it", reply: "Interesting. Keep that in mind.", mood: "happy", act: "nod" },
        { text: "Honestly, I’m not sure", reply: "Perfect lab attitude. Let’s look.", mood: "happy", act: "hop" },
      ],
      after: [
        { say: "First, the science. You get to run the universe.", mood: "excited", act: "hop" },
      ],
    },

    // the expanding universe
    {
      kind: "expand",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "This is a patch of space, with galaxies in it.", mood: "curious" },
        { say: "And the timeline is under your thumb.", mood: "happy", act: "nod" },
      ],
      hint: "Drag the timeline back. Watch the gaps.",
      note: "Simplified model: one patch of space, not the universe seen from outside. Space stretches everywhere at once, so there’s no centre and no edge.",
      early: [
        { say: "Everything gets closer. Denser. Hotter.", mood: "surprised", act: "react" },
        { say: "Far enough back, no galaxies yet. Just a hot, glowing fog.", mood: "thinking" },
        { say: "That’s the Big Bang model: once extremely hot and dense.", mood: "excited", act: "nod" },
        { say: "And expanding ever since.", mood: "happy" },
        { say: "Not an explosion into empty space.", mood: "thinking", act: "shake" },
        { say: "Space itself, stretching everywhere.", mood: "happy", act: "nod" },
      ],
      back: "Now bring it back to today.",
      after: [
        { say: "See? The galaxies didn’t fly out from one centre.", mood: "curious", act: "tilt" },
        { say: "Every gap grew. From any galaxy, the rest move away.", mood: "happy", act: "nod" },
        { say: "And the very first instant? Still an open question.", mood: "thinking" },
      ],
    },

    // the evidence: stretched light
    {
      kind: "redshift",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "But how do scientists know space is expanding?", mood: "curious", act: "tilt" },
        { say: "They read the light of galaxies.", mood: "happy" },
      ],
      hint: "Tap each galaxy. Compare its light with the lab’s.",
      galaxies: [
        { name: "Near", distance: "about 140 million light-years", z: 0.01, say: "Its dark lines sit a little toward the red." },
        { name: "Farther", distance: "about 560 million light-years", z: 0.04, say: "Farther away, shifted further." },
        { name: "Farthest", distance: "about 1.1 billion light-years", z: 0.08, say: "The farthest one is stretched the most!" },
      ],
      findings: [
        { tag: "observation", text: "The dark lines in distant galaxies’ light are shifted toward red. The farther the galaxy, the bigger the shift. (The values here are illustrative.)" },
        { tag: "model", text: "Scientists read this as space stretching the light on its way to us. Georges Lemaître predicted the pattern in 1927; Edwin Hubble’s 1929 data showed it clearly." },
      ],
      after: [
        { say: "So the light itself carries a clue.", mood: "moved", act: "nod" },
      ],
    },

    // the evidence: the oldest light
    {
      kind: "cmb",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "One more clue. The oldest light there is.", mood: "excited", act: "hop" },
        { say: "It’s hiding across the whole sky.", mood: "cheeky", act: "stare" },
      ],
      hint: "Drag your finger across the sky to clear it.",
      caption: "A simplified picture, like the Planck satellite’s map. The colours are exaggerated: the real differences are tiny.",
      findings: [
        { tag: "observation", text: "A faint glow of microwaves comes from every direction. Arno Penzias and Robert Wilson found it by accident in 1965." },
        { tag: "observation", text: "It’s almost perfectly even: about 2.7 degrees above absolute zero, varying by roughly 1 part in 100,000." },
        { tag: "model", text: "In the Big Bang model, it’s light released about 380,000 years in, when the young universe cooled enough for light to travel freely. Ralph Alpher and Robert Herman predicted it in 1948." },
      ],
      after: [
        { say: "Expanding space. Stretched light. A glow from the early universe.", mood: "excited" },
        { say: "Different clues, pointing the same way.", mood: "happy", act: "nod" },
        { say: "That’s a big part of why scientists accept the model.", mood: "moved" },
      ],
    },

    // the historical twist
    {
      kind: "timeline",
      page: { at: "top", mood: "cheeky" },
      before: [
        { say: "Here’s a twist most people don’t know.", mood: "cheeky", act: "stare" },
        { say: "An early expanding-universe pioneer was a Catholic priest.", show: "events", mood: "surprised", act: "react" },
      ],
      hint: "Tap each year",
      phases: [
        { id: "priest", label: "The priest", color: "#C9A8FF" },
        { id: "science", label: "The physicist", color: "#FFB547" },
      ],
      events: [
        { year: "1923", title: "Ordained a priest", phase: "priest", tag: "fact", body: "Georges Lemaître, a Belgian who had served in the First World War, was ordained a Catholic priest. He then studied astronomy in Cambridge, England, and in Cambridge, Massachusetts.", say: "A priest, and a physicist." },
        { year: "1927", title: "An expanding universe", phase: "science", tag: "fact", body: "Using Einstein’s equations, he proposed that the universe is expanding, and that galaxies’ redshifts should grow with distance. Alexander Friedmann had found expanding solutions on paper in 1922; Lemaître tied the idea to what astronomers observed.", say: "He linked the maths to real galaxies." },
        { year: "1929", title: "Hubble’s data", tag: "fact", body: "Edwin Hubble published measurements showing that farther galaxies have larger redshifts. In 2018 astronomers voted to call the pattern the Hubble–Lemaître law.", say: "Then the data came in." },
        { year: "1931", title: "The “primeval atom”", phase: "science", tag: "fact", body: "Run the expansion backwards, he proposed, and the universe began in a single, extremely dense state. The name “Big Bang” came later, from the astronomer Fred Hoyle in 1949.", say: "Run it backwards… sound familiar?" },
        { year: "1933", title: "Two paths", phase: "priest", tag: "own", body: "On being both a scientist and a priest.", quote: { text: "There were two ways of arriving at the truth. I decided to follow both of them.", source: "Quoted in The New York Times, 1933" }, say: "Both paths. Not one swallowing the other." },
        { year: "1951", title: "Keeping them apart", phase: "priest", tag: "fact", body: "When Pope Pius XII suggested the new cosmology bore witness to creation, Lemaître was uneasy. He held that his theory stayed outside any religious question: it could neither prove nor disprove God.", say: "He didn’t want his physics used as proof." },
        { year: "1966", title: "The glow is found", phase: "science", tag: "fact", body: "Shortly before he died, he learned of the newly discovered microwave glow: the oldest light you just uncovered.", say: "He heard about it just in time." },
      ],
      after: [
        { say: "Lemaître didn’t build Big Bang cosmology alone.", mood: "thinking" },
        { say: "But he followed both paths, and kept them distinct.", mood: "moved", act: "nod" },
      ],
    },

    // two kinds of questions
    {
      kind: "twoKinds",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Which brings us to two kinds of questions.", mood: "thinking" },
        { say: "Some, science can test. Some go deeper than any instrument.", mood: "curious", act: "tilt" },
      ],
      bins: [
        { id: "science", label: "Science can test it" },
        { id: "both", label: "Both" },
        { id: "beyond", label: "Philosophy & theology" },
      ],
      items: [
        { q: "How has the universe expanded?", bin: "science", why: "Measured with telescopes: redshifts, distances, the oldest light.", say: "Right. Instruments can measure that." },
        { q: "What evidence supports the Big Bang?", bin: "science", why: "Evidence is science’s home ground. You’ve just seen three kinds.", say: "Yes. You’ve seen the evidence yourself." },
        { q: "Did the universe have a beginning?", bin: "both", why: "Cosmology says a lot about the early universe. Whether there was an absolute beginning also takes philosophy and theology.", say: "Good call. Both have something to say." },
        { q: "Why does the universe exist at all?", bin: "beyond", why: "Science describes what exists and how it behaves. Why there’s anything at all is a philosophical and theological question.", say: "Yes. No telescope reaches that one." },
        { q: "Does the universe have a purpose?", bin: "beyond", why: "No experiment can measure it. People answer it from philosophy and faith, and they don’t all agree.", say: "Right. And people answer it differently." },
      ],
      after: [
        { say: "The two kinds overlap, and science can inform the deeper ones.", mood: "thinking", act: "nod" },
        { say: "But they’re not the same question.", mood: "happy" },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "The Bible’s first line asks a different question.", mood: "curious" },
        { say: "Not how. Who.", mood: "moved", act: "nod" },
      ],
      verse: { text: "In the beginning, God created the heavens and the earth.", ref: "Genesis 1:1", translation: WEB },
      after: [
        { say: "Genesis isn’t a physics paper. It tells who made it all.", mood: "tender" },
      ],
    },

    // back to the question
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "So: can you believe in God and the Big Bang?",
      options: [
        { text: "Yes, many Christians do", reply: "They do. And so did Lemaître.", mood: "excited", act: "hop" },
        { text: "Only if the Big Bang proves God", reply: "Careful: it doesn’t prove that, or the opposite.", mood: "thinking", act: "tilt" },
        { text: "I’m still thinking", reply: "Good. It’s worth thinking about.", mood: "happy", act: "nod" },
      ],
      after: [
        { say: "Accepting the Big Bang doesn’t, by itself, mean rejecting God.", mood: "happy", act: "nod" },
        { say: "Many Christians see science describing how creation unfolds…", show: "compare", mood: "thinking" },
        { say: "…and theology asking who the Creator is, and why.", mood: "happy", act: "nod" },
        { say: "But the Big Bang doesn’t scientifically prove God, either.", mood: "thinking", act: "tilt" },
        { say: "And Christians differ. Many churches, like the Catholic Church, accept the model.", mood: "tender" },
        { say: "Some read Genesis as teaching a young earth, and don’t.", mood: "tender", act: "nod" },
      ],
      compare: {
        not: { label: "Not this", text: "Science or God: pick one" },
        but: { label: "But this", text: "Science asks *how*. Theology asks *who and why*." },
      },
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "Before you go: what fills you with the most wonder?",
      options: [
        { text: "How big the universe is", reply: "“The heavens declare the glory of God.” Psalm 19:1." },
        { text: "That we can understand it at all", reply: "Many scientists, believers or not, find that astonishing." },
        { text: "That there’s anything at all", reply: "The oldest question there is. Keep asking it." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "God and the Big Bang",
      body: "",
      summary: [
        "Space is expanding: you saw it in a model, in stretched light, and in the oldest light.",
        "Georges Lemaître, a priest, helped propose it, and kept science and theology distinct.",
        "Science asks how the universe works. Why it exists, and what for, go further.",
      ],
      refs: ["Genesis 1:1", "Psalm 19:1"],
      sources: [
        { title: "Planck 2018 results", publisher: "ESA and the Planck Collaboration" },
        { title: "Resolution B4: the Hubble–Lemaître law (2018)", publisher: "International Astronomical Union" },
        { title: "“Un Univers homogène de masse constante et de rayon croissant” (1927)", publisher: "Georges Lemaître, Annales de la Société Scientifique de Bruxelles" },
      ],
      related: [
        { title: "How can we know God exists?", sub: "Big question · 6 min", lessonId: "god-exists" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
