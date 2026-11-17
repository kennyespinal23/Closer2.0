import type { Lesson } from "../lesson/types";

/* Faith & Science: How Old Is the Earth?
   A dig through deep time. Rock layers give the order, a decay clock gives the years, four independent clocks agree,
   then the Deep Time Explorer zooms from 4.54 billion years down to recorded history. Last, Genesis 1's seven days
   rearrange under each Christian reading.

   Kept honest, line by line:
   - Science findings are labelled (observation, model); Christian readings are labelled interpretation, every one.
   - The cliff and the decay grid say they're simplified. The decay grid's counts follow the half-life exactly.
   - Ages: Earth 4.54 ± 0.05 billion years (USGS, Dalrymple); U-238 half-life about 4.47 billion years; Jack Hills
     zircon about 4.4; Apollo samples up to about 4.46; Acasta Gneiss about 4.03; meteorites about 4.56.
   - Each reading of Genesis is named for who holds or proposed it; nobody's view is called the only Christian one.
   - Scripture is the World English Bible, word for word. The reflection is optional and nothing in it is saved. */

const WEB = "World English Bible";

export const scienceEarthAge = {
  id: "science-earth-age",
  title: "How Old Is the Earth?",
  subtitle: "Rock layers, atomic clocks, and Genesis",
  kind: "Faith and science",
  scripture: "Genesis 1 · Psalm 90",
  minutes: 5,
  theme: "cosmos",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "cheeky" },
      display: { text: "How Old Is the Earth?", sub: "Faith & Science · Deep Time" },
      lines: [
        { say: "Here’s a question with a huge number in it.", mood: "cheeky", act: "stare" },
        { say: "How old is the Earth? And what does that mean for Genesis?", mood: "curious", act: "tilt" },
      ],
      reply: "Let’s dig in",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What’s your guess?",
      options: [
        { text: "Thousands of years", reply: "Some Christians hold that. Let’s look at the rocks.", mood: "thinking", act: "nod" },
        { text: "Billions of years", reply: "But how could anyone know that?", mood: "curious", act: "tilt" },
        { text: "No idea", reply: "Perfect. Let’s find out together.", mood: "happy", act: "hop" },
      ],
      after: [
        { say: "Let’s start with a cliff.", mood: "excited", act: "hop" },
      ],
    },

    // order: the layers
    {
      kind: "earthStrata",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Rock builds up in layers, like pages in a book.", mood: "curious" },
      ],
      guess: "Which layer formed first?",
      right: "Yes! The bottom. New layers settle on top of old ones.",
      wrong: "Think of a pile of mail. Which letter landed first?",
      hint: "Dig upward",
      layers: [
        { name: "Top", era: "Cenozoic", fossil: "tooth", fossilName: "A mammal’s tooth", color: "#E8C07E", say: "Mammal teeth. The youngest layer of all." },
        { name: "Fourth", era: "Mesozoic", fossil: "ammonite", fossilName: "Ammonites", color: "#C98A55", say: "Ammonites, from the dinosaurs’ seas." },
        { name: "Third", era: "Carboniferous", fossil: "fern", fossilName: "Fern forests", color: "#A0704E", say: "Ancient fern forests." },
        { name: "Second", era: "Devonian", fossil: "fish", fossilName: "Early fish", color: "#7E5A48", say: "Early fish, in an ancient sea." },
        { name: "Bottom", era: "Cambrian", fossil: "trilobite", fossilName: "Trilobites", color: "#5E4640", say: "Trilobites." },
      ],
      note: "Simplified: no single cliff holds every layer, and real sequences vary from place to place.",
      findings: [
        { tag: "observation", text: "Layers pile up, so lower ones were laid down first, unless something later tilted or folded them. Geologists call this superposition." },
        { tag: "observation", text: "Around the world, fossils turn up in a consistent order: trilobites far below dinosaurs, dinosaurs far below large mammals." },
      ],
      after: [
        { say: "So layers tell us the order.", mood: "happy", act: "nod" },
        { say: "But not how many years. For that, we need a clock.", mood: "curious", act: "tilt" },
      ],
    },

    // years: a decay clock
    {
      kind: "earthDecay",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Some atoms are natural clocks.", mood: "excited", act: "hop" },
        { say: "Uranium-238 slowly turns into lead-206, at a steady rate.", mood: "curious" },
      ],
      hint: "Let time pass until your atoms match the meteorite.",
      parent: "Uranium-238",
      daughter: "Lead-206",
      halfLife: 4.47,
      sample: { name: "A meteorite (uranium : lead)", left: 49 },
      notYet: "Not a match yet. Compare the two bars.",
      match: "A match! About one half-life: roughly 4.5 billion years.",
      note: "Simplified: real labs measure isotope ratios precisely, and check two uranium clocks against each other in the same crystal.",
      findings: [
        { tag: "model", text: "Uranium-238 decays to lead-206 with a half-life of about 4.47 billion years. After one half-life, half is left; after two, a quarter." },
        { tag: "observation", text: "Decay rates are measured in labs, and stay steady even under the heat and pressure inside rocks." },
        { tag: "model", text: "Carbon-14 is a different clock. With a half-life of about 5,730 years, it dates once-living things up to about 50,000 years old, not rocks." },
      ],
      after: [
        { say: "So rocks can carry their own clocks.", mood: "moved", act: "nod" },
      ],
    },

    // four independent clocks
    {
      kind: "earthClocks",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "One clock could be wrong.", mood: "thinking" },
        { say: "So let’s check four, from four different places.", mood: "excited", act: "hop" },
      ],
      hint: "Tap each specimen to date it.",
      clocks: [
        { id: "meteor", name: "Meteorites", what: "Leftovers from when the planets formed", age: 4.56, plus: 0.01, say: "Meteorites: about 4.56 billion years." },
        { id: "moon", name: "Moon rocks", what: "Brought back by Apollo astronauts", age: 4.46, plus: 0.04, say: "Moon rocks: up to about 4.46 billion years." },
        { id: "zircon", name: "Zircon grains", what: "Tiny crystals from Jack Hills, Australia", age: 4.4, plus: 0.01, say: "The oldest known pieces of Earth: about 4.4 billion years." },
        { id: "rock", name: "Oldest rock", what: "The Acasta Gneiss, Canada", age: 4.03, plus: 0.01, say: "Earth’s oldest known rock: about 4 billion years." },
      ],
      best: { age: 4.54, plus: 0.05, label: "Earth: about 4.54 billion years, give or take 50 million" },
      findings: [
        { tag: "observation", text: "Different materials, dated in different labs by different methods, cluster near 4.5 billion years." },
        { tag: "model", text: "Earth’s surface keeps being recycled, so its oldest surviving pieces are a little younger than the planet itself." },
        { tag: "model", text: "Earth formed with the rest of the solar system, about 4.54 billion years ago, give or take about 50 million." },
      ],
      after: [
        { say: "Independent clocks. One answer.", mood: "excited", act: "react" },
        { say: "That’s why geologists are so confident about it.", mood: "happy", act: "nod" },
      ],
    },

    // the signature: deep time
    {
      kind: "earthDeepTime",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Now the big one: 4.54 billion years.", mood: "excited", act: "hop" },
        { say: "Let’s see what fits inside it.", mood: "curious", act: "tilt" },
      ],
      hint: "Zoom in on the glowing sliver.",
      deepest: "Recorded history. A sliver of a sliver.",
      levels: [
        { label: "All of Earth’s history.", span: 4.54e9 },
        { label: "Animals: the last 539 million years.", span: 539e6 },
        { label: "After the dinosaurs: the last 66 million years.", span: 66e6 },
        { label: "Our species: the last 300,000 years.", span: 300e3 },
        { label: "Writing: the last 6,000 years.", span: 6e3 },
      ],
      events: [
        { ago: 4.54e9, title: "Earth forms", body: "From the disc of dust and gas around the young Sun." },
        { ago: 4.4e9, title: "Oldest known mineral", body: "Zircon grains, found at Jack Hills in Australia." },
        { ago: 3.5e9, title: "Earliest clear signs of life", body: "Microbial mats preserved as stromatolites. Some evidence may be older." },
        { ago: 2.4e9, title: "Oxygen fills the air", body: "The Great Oxidation Event, driven by microbes." },
        { ago: 539e6, title: "Animals diversify", body: "The Cambrian explosion: many animal groups appear in the fossil record." },
        { ago: 230e6, title: "First dinosaurs", body: "Early dinosaurs appear in the Triassic period." },
        { ago: 66e6, title: "Dinosaurs die out", body: "An asteroid impact ends the age of the dinosaurs, except the birds." },
        { ago: 300e3, title: "Our species appears", body: "The oldest known Homo sapiens fossils, from Jebel Irhoud in Morocco." },
        { ago: 5.2e3, title: "Writing begins", body: "Early writing in Mesopotamia, around 3200 BC." },
        { ago: 2e3, title: "Jesus’ life", body: "Jesus lived in Judea about 2,000 years ago." },
      ],
      after: [
        { say: "Now squeeze it all into one day.", show: "clock", mood: "excited", act: "hop" },
        { say: "Our species turns up about six seconds before midnight.", mood: "surprised", act: "react" },
        { say: "All of written history: the last tenth of a second.", mood: "moved", act: "nod" },
      ],
    },

    // Genesis, read several ways
    {
      kind: "earthReadings",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So how do Christians read Genesis 1?", mood: "curious", act: "tilt" },
        { say: "Not all the same way.", mood: "thinking", act: "nod" },
      ],
      hint: "Tap a reading. Watch the days rearrange.",
      verse: { text: "God called the light “day”, and the darkness he called “night”. There was evening and there was morning, the first day.", ref: "Genesis 1:5", translation: WEB },
      days: ["Light", "Sky and waters", "Land and plants", "Sun, moon and stars", "Birds and sea creatures", "Animals and humans", "God rests"],
      lenses: [
        { id: "yec", name: "Young earth", badge: "Six ordinary days", claim: "The days are ordinary 24-hour days, and the genealogies point to an Earth thousands of years old. Young-earth creationists dispute the standard dating methods.", held: "Held by many evangelical Christians.", say: "Six ordinary days, and a young Earth." },
        { id: "dayage", name: "Day-age", badge: "Each day a long age", claim: "The Hebrew word for day, yom, can mean a long period. Genesis 2:4 even calls the whole creation week “the day that Yahweh God made the earth and the heavens.”", held: "Held by many old-earth creationists.", say: "Each day, a long age." },
        { id: "gap", name: "Gap", badge: "A gap before the days", claim: "An unknown span of time may lie between Genesis 1:1 and 1:2, before the six days begin.", held: "Popular in the 1800s and 1900s, through the Scofield Reference Bible.", say: "An old Earth first. Then six days." },
        { id: "framework", name: "Framework", badge: "Days 1–3 pair with days 4–6", claim: "The days are a literary frame. Three realms are formed, then filled: light and lights, sky and sea with birds and fish, land with animals and people.", held: "Developed by Arie Noordtzij and Meredith Kline; held by many Reformed scholars.", say: "Look: the days pair up!" },
        { id: "analogical", name: "Analogical days", badge: "God’s workdays", claim: "The days are God’s workdays: like ours but not identical, setting a pattern of work and rest for people.", held: "Proposed by C. John Collins, an Old Testament scholar.", say: "God’s week, as a pattern for ours." },
        { id: "temple", name: "Cosmic temple", badge: "Day 7 is the goal", claim: "Read beside other ancient Near Eastern texts, Genesis 1 shows God ordering the world as his temple, then taking up his rest in it. It’s about function, not material origins.", held: "Proposed by John Walton, an Old Testament scholar.", say: "The whole week leads to day seven." },
      ],
      after: [
        { say: "This isn’t a new debate.", mood: "thinking" },
        { say: "Around AD 400, Augustine suggested the days may not be ordinary days.", mood: "curious", act: "tilt" },
      ],
    },

    // back to the question
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "So: how old is the Earth, and does Genesis disagree?",
      options: [
        { text: "Billions of years, and Genesis can fit", reply: "Many Christians read it that way.", mood: "happy", act: "nod" },
        { text: "Genesis means a young Earth", reply: "Many Christians hold that view too.", mood: "thinking", act: "nod" },
        { text: "I need to think more", reply: "Fair. It’s a big question.", mood: "tender", act: "nod" },
      ],
      after: [
        { say: "Many independent clocks point to about 4.54 billion years.", mood: "happy", act: "nod" },
        { say: "How to read Genesis is a separate question, about meaning.", show: "compare", mood: "thinking" },
        { say: "The Catholic Church and many Protestants accept an old Earth.", mood: "tender" },
        { say: "Many evangelicals hold a young Earth. Christians still disagree here.", mood: "tender", act: "nod" },
      ],
      compare: {
        not: { label: "Not this", text: "Rocks vs. Genesis: one must lose" },
        but: { label: "But this", text: "Evidence dates the Earth. Christians *read Genesis* in different ways." },
      },
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "4.54 billion years. How does that make you feel?",
      options: [
        { text: "Small", reply: "“Before the mountains were born… from everlasting to everlasting, you are God.” Psalm 90:2." },
        { text: "Amazed", reply: "Same. And we can actually measure it." },
        { text: "Curious for more", reply: "Good. There’s a lot more to dig into." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "How old is the Earth?",
      body: "",
      summary: [
        "Rock layers give the order; atomic clocks give the years.",
        "Independent clocks agree: about 4.54 billion years.",
        "Christians read Genesis 1 in several ways, and still disagree about its days.",
      ],
      verse: { text: "Before the mountains were born, before you had formed the earth and the world, even from everlasting to everlasting, you are God.", ref: "Psalm 90:2", translation: WEB },
      refs: ["Genesis 1:1–2:4", "Psalm 90:2"],
      sources: [
        { title: "Age of the Earth", publisher: "U.S. Geological Survey" },
        { title: "The Age of the Earth (1991)", publisher: "G. Brent Dalrymple, Stanford University Press" },
        { title: "Evidence from detrital zircons for the existence of continental crust and oceans on the Earth 4.4 Gyr ago (2001)", publisher: "Wilde and others, Nature" },
      ],
      related: [
        { title: "Can You Believe in God and the Big Bang?", sub: "Discovery Lab · 5 min", lessonId: "science-big-bang" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
