import type { Lesson } from "../lesson/types";

/* Faith & Science: Did humans really evolve?
   A Tree of Life you grow yourself: first the common mix-up (chimps as our ancestors) fails in your hands, then the
   branch points reveal shared ancestors. Then a dig down the human branch, two chromosomes to fit together and two
   strands of DNA to scan, and four Christian voices at one table.

   Kept honest, line by line:
   - Dates are estimates and say so; where studies vary, the range is given. Sahelanthropus's place is marked open.
   - Common ancestry is presented as the strong scientific consensus; how it fits Genesis as theological disagreement.
   - Each Christian view is described as its own holders describe it, with no quotations invented. Papal teaching is
     paraphrased (Humani Generis, 1950; John Paul II's 1996 message), with the soul's direct creation by God included.
   - The DNA strands are illustrative and labelled; the genome-wide figures come from the 2005 chimpanzee genome paper.
   - Scripture is the World English Bible, word for word. The reflection is optional and nothing in it is saved. */

const WEB = "World English Bible";

export const scienceEvolution = {
  id: "science-evolution",
  title: "Did Humans Really Evolve?",
  subtitle: "Grow the Tree of Life, then hear four Christian voices",
  kind: "Faith and science",
  scripture: "Genesis 1:27",
  minutes: 5,
  theme: "cosmos",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "Did Humans Really Evolve?", sub: "Faith & Science · Tree of Life" },
      lines: [
        { say: "Here’s a question that can feel like a fault line.", mood: "curious", act: "hop" },
        { say: "Did humans really evolve? And if so, what about Genesis?", mood: "thinking", act: "tilt" },
        { say: "Evidence first. Then the faith questions.", mood: "happy", act: "nod" },
      ],
      reply: "Show me",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What do you think right now?",
      options: [
        { text: "Evolution and Christianity clash", reply: "Many people feel that. Let’s look closely.", mood: "thinking", act: "nod" },
        { text: "God could have used evolution", reply: "Some Christians say exactly that.", mood: "happy", act: "nod" },
        { text: "I’ve never really looked into it", reply: "Perfect. Let’s explore together.", mood: "happy", act: "hop" },
      ],
      after: [
        { say: "Let’s start with a common mix-up.", mood: "excited", act: "hop" },
      ],
    },

    // the Tree of Life
    {
      kind: "evoTree",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Four living apes. Including us.", mood: "curious" },
        { say: "People often say humans came from chimps. Let’s test that.", mood: "cheeky", act: "stare" },
      ],
      dragHint: "Drag the chimp into the empty spot, as our ancestor.",
      wrong: [
        { say: "It won’t fit!", mood: "surprised", act: "react" },
        { say: "Living chimps have been evolving just as long as we have.", mood: "thinking" },
        { say: "They’re not our grandparents. They’re our cousins.", mood: "happy", act: "nod" },
      ],
      hint: "Tap the glowing point where branches meet.",
      tips: [
        { id: "orangutan", name: "Orangutan" },
        { id: "gorilla", name: "Gorilla" },
        { id: "chimp", name: "Chimpanzee" },
        { id: "human", name: "Human" },
      ],
      nodes: [
        { id: "hc", label: "Humans and chimps meet", date: "about 6–7 million years ago", say: "Our branch meets the chimps’ here. Neither is the trunk." },
        { id: "hcg", label: "Gorillas join", date: "about 8–10 million years ago", say: "Deeper down, gorillas join the family." },
        { id: "hco", label: "Orangutans join", date: "about 12–16 million years ago", say: "Deeper still: orangutans. A tree, not a ladder." },
      ],
      findings: [
        { tag: "model", text: "Living chimps aren’t our ancestors. Both lines come from a shared ancestor that was neither a chimp nor a human." },
        { tag: "model", text: "A simplified family tree. Branch dates are estimates from fossils and DNA, and studies vary: for humans and chimps, roughly 5 to 8 million years." },
      ],
      after: [
        { say: "Cousins, not grandparents. That changes the picture.", mood: "moved", act: "nod" },
      ],
    },

    // down the human branch
    {
      kind: "evoDig",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "So what lies down our branch? Let’s dig.", mood: "excited", act: "hop" },
        { say: "Newest rock on top. Older the deeper you go.", mood: "curious" },
      ],
      hint: "Tap the glowing layer to dig.",
      layers: [
        { name: "Homo sapiens", nick: "us", when: "about 300,000 years ago", where: "Jebel Irhoud, Morocco", body: "The oldest fossils yet linked to our own species: faces much like ours, with longer skulls.", tag: "observation", say: "Our own species. Older than people once thought." },
        { name: "Neanderthals", when: "about 400,000 to 40,000 years ago", where: "Europe and western Asia", body: "Close cousins rather than direct ancestors. Many people today carry a little Neanderthal DNA, from where the two groups met.", tag: "observation", say: "Cousins again. And some of their DNA is in many of us!" },
        { name: "Homo erectus", when: "from about 1.9 million years ago", where: "Africa, then Asia", body: "Tall, with long legs, and among the first of our relatives found far beyond Africa.", tag: "observation", say: "Long legs, long journeys." },
        { name: "Australopithecus afarensis", nick: "“Lucy”", when: "about 3.2 million years ago", where: "Hadar, Ethiopia", body: "Walked upright on two legs, with a brain about the size of a chimpanzee’s.", tag: "observation", say: "Walking upright, long before big brains." },
        { name: "Ardipithecus ramidus", nick: "“Ardi”", when: "about 4.4 million years ago", where: "Middle Awash, Ethiopia", body: "Could walk upright on the ground and still climb well, with a grasping big toe.", tag: "observation", say: "Part walker, part climber." },
        { name: "Sahelanthropus", when: "about 7 million years ago", where: "Chad", body: "A skull from close to the time of the split. Whether it belongs on our branch is still debated.", tag: "open", say: "Close to the split. Scientists still debate this one." },
      ],
      findings: [
        { tag: "observation", text: "Fossils on our branch get older, and less like us, the deeper you go. These are six of many." },
        { tag: "model", text: "Scientists read them as a bushy branch, not a straight line: several kinds of human lived at the same time." },
      ],
      after: [
        { say: "Not a march of progress. A bushy branch.", mood: "thinking", act: "nod" },
      ],
    },

    // the genes
    {
      kind: "evoGenes",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Fossils are one kind of evidence. DNA is another.", mood: "curious" },
        { say: "Humans have 23 pairs of chromosomes. Chimps have 24.", mood: "thinking", act: "tilt" },
      ],
      joinHint: "Tap the two chimp pieces to slide them together.",
      joined: [
        { say: "They line up with our chromosome 2!", mood: "surprised", act: "react" },
        { say: "And inside: chromosome ends, stuck together in the middle.", mood: "excited" },
      ],
      scanHint: "Now scan two strands, letter by letter.",
      human: "GCTAAAGACAATTACATAACATACACGTCAGCACGAAACTTGTTGGCCCAGTGTGAATCGCTTAAGGGTTAAGTAAGTGT",
      chimp: "GCTAAAGACAATTACATAACATACACGTCAGCACGAAACTTGTTGGCCCAGTGCGAATCGCTTAAGGGTTAAGTAAGTGT",
      scanned: [
        { say: "One letter different, out of eighty.", mood: "surprised", act: "react" },
        { say: "Across whole genomes: about 98.8% for single letters.", mood: "thinking", act: "nod" },
      ],
      findings: [
        { tag: "observation", text: "Human chromosome 2 looks like two ape chromosomes joined end to end: end-cap repeats in its middle, and a leftover second centromere." },
        { tag: "observation", text: "Human and chimp DNA match at about 98.8% of single letters, or around 96% counting stretches added or lost." },
        { tag: "observation", text: "Both carry many of the same old viral ‘scars’: virus DNA left in exactly the same places in the genome." },
        { tag: "model", text: "Common ancestry explains all three at once. The chromosomes are simplified and the strands illustrative." },
      ],
      after: [
        { say: "Fossils and genes, telling the same story.", mood: "moved", act: "nod" },
      ],
    },

    // the faith questions
    {
      kind: "evoViews",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So where does that leave Genesis?", mood: "thinking", act: "tilt" },
        { say: "Christians answer differently. Let’s hear four voices.", mood: "tender" },
      ],
      hint: "Tap each voice to hear it.",
      views: [
        {
          name: "Evolutionary creation", who: "e.g. BioLogos",
          science: "Accepts evolution, including human common ancestry, as the way God created.",
          genesis: "Teaches who made the world and why, in an ancient way, not as modern science.",
          adam: "Views vary: a real pair within an early human population, or a figure who stands for us all.",
          say: "God creating through evolution.",
        },
        {
          name: "Catholic teaching", who: "the Catholic Church",
          science: "Pius XII (1950) allowed study of the human body’s evolution. John Paul II (1996) called evolution more than a hypothesis.",
          genesis: "Uses figurative language in places, but teaches real truths, says the Catechism.",
          adam: "Each soul is created directly by God. The Church teaches original sin, from our first parents.",
          say: "Open to the science, firm on the soul.",
        },
        {
          name: "Old-earth creation", who: "e.g. Reasons to Believe",
          science: "Accepts an old earth and universe, but not common ancestry for humans.",
          genesis: "The ‘days’ can be long ages.",
          adam: "Adam and Eve were specially created, the first humans.",
          say: "An old earth, and a special creation of humans.",
        },
        {
          name: "Young-earth creation", who: "e.g. Answers in Genesis",
          science: "Rejects common ancestry and an old earth, and reads the evidence another way.",
          genesis: "Six ordinary days, thousands of years ago.",
          adam: "Adam and Eve were the first two humans, made directly by God.",
          say: "A plain-days reading of Genesis.",
        },
      ],
      shared: { title: "What all four share", text: "God is the Creator, and every person bears his image." },
      note: "Among biologists, common ancestry is the strong scientific consensus. These differences are about theology and how to read Genesis.",
      after: [
        { say: "The science is broadly settled. The faith conversation goes on.", mood: "thinking" },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "moved" },
      before: [
        { say: "Here’s the line all four start from.", mood: "moved", act: "nod" },
      ],
      verse: { text: "God created man in his own image. In God’s image he created him; male and female he created them.", ref: "Genesis 1:27", translation: WEB },
      after: [
        { say: "Made in God’s image. That’s the heart of it.", mood: "tender", act: "nod" },
      ],
    },

    // back to the question
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "So: did humans really evolve?",
      options: [
        { text: "The evidence points that way", reply: "Most biologists agree, including many Christians.", mood: "happy", act: "nod" },
        { text: "I believe God made us directly", reply: "Many Christians hold that. You share the core.", mood: "tender", act: "nod" },
        { text: "I’m still weighing it", reply: "That’s honest. It’s worth weighing well.", mood: "happy" },
      ],
      after: [
        { say: "Scientifically, we share ancestors with other apes. That’s the consensus.", mood: "thinking" },
        { say: "How that fits Genesis is a question Christians answer differently.", mood: "tender", act: "nod" },
        { say: "And evolution can’t tell us whether God created. That’s a different question.", mood: "happy", act: "nod" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "What does being made in God’s image mean to you?",
      options: [
        { text: "That I matter to God", reply: "You do. Genesis says it on its first page." },
        { text: "That every person has dignity", reply: "Every one. No exceptions." },
        { text: "I’m not sure yet", reply: "That’s a good question to keep." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "Did humans really evolve?",
      body: "",
      summary: [
        "Humans and chimps are cousins: we share an ancestor, and neither came from the other.",
        "Fossils and DNA point the same way. Common ancestry is the scientific consensus.",
        "Christians differ on how it fits Genesis, but agree every person bears God’s image.",
      ],
      refs: ["Genesis 1:27"],
      sources: [
        { title: "Initial sequence of the chimpanzee genome (2005)", publisher: "Chimpanzee Sequencing and Analysis Consortium, Nature" },
        { title: "New fossils from Jebel Irhoud, Morocco (2017)", publisher: "J.-J. Hublin and colleagues, Nature" },
        { title: "Humani Generis (1950)", publisher: "Pope Pius XII" },
        { title: "Message to the Pontifical Academy of Sciences (1996)", publisher: "Pope John Paul II" },
      ],
      related: [
        { title: "Can You Believe in God and the Big Bang?", sub: "Faith & Science · 5 min", lessonId: "science-big-bang" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
