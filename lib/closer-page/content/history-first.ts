import type { Lesson } from "../lesson/types";

/* Church History: What Happened to the First Christians?
   Rome, AD 30–313, investigated: follow the faith across the Roman world, read two Roman documents for clues, scrub
   three centuries of persecution and quiet, then hold to watch a small movement grow.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word.
   - Pliny (Letters 10.96–97) and Tacitus (Annals 15.44) are paraphrased and shortened, and labelled so. Dionysius of
     Alexandria (in Eusebius, Church History 7.22) and Julian (Letter to Arsacius) are paraphrased too.
   - Dates before AD 100 are approximate and said with "c.". Peter and Paul's deaths in Rome are early tradition,
     and named as tradition.
   - Persecution is shown as it was: intermittent and regional, with three empire-wide campaigns, not constant.
     Nothing is described in graphic detail.
   - Growth numbers are Rodney Stark's rough projection (The Rise of Christianity, 1996), labelled as an estimate.
   - The reflection is optional, and nothing chosen there is saved. */

const WEB = "World English Bible";

export const historyFirst = {
  id: "history-first",
  title: "What Happened to the First Christians?",
  subtitle: "Rome, AD 30–313",
  kind: "Church history",
  scripture: "Acts 1:8 · Acts 11:26 · Acts 2:44–45",
  minutes: 5,
  theme: "lapis",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "What Happened to the First Christians?", sub: "Church History · Rome, AD 30–313" },
      lines: [
        { say: "Around AD 30, Jesus’ followers were a small group in Jerusalem.", mood: "curious", act: "tilt" },
        { say: "Three centuries later, they were all over the empire. How?", mood: "thinking", act: "stare" },
      ],
      reply: "Let’s investigate",
    },

    // 1. the map
    {
      kind: "hfirstMap",
      page: { at: "top", mood: "happy" },
      before: [
        { say: "Here’s the Roman world, all around the Mediterranean Sea.", mood: "happy", act: "nod" },
      ],
      hint: "Tap the glowing city to follow the message.",
      stops: [
        {
          id: "jerusalem", name: "Jerusalem", year: "c. AD 30", at: [330, 149], above: true, tag: "text",
          text: "After Jesus rose and ascended, his followers began here, at Pentecost. He had already told them where it would go.",
          verse: { text: "You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.", ref: "Acts 1:8", translation: WEB },
          say: "It starts in one city. Watch where it goes.",
        },
        {
          id: "antioch", name: "Antioch", year: "c. AD 40", at: [338, 103], left: true, tag: "text",
          text: "Believers scattered by persecution reached Antioch in Syria. It became the base for Paul’s journeys.",
          verse: { text: "The disciples were first called Christians in Antioch.", ref: "Acts 11:26", translation: WEB },
          say: "This is where the name “Christian” started!",
        },
        {
          id: "corinth", name: "Corinth", year: "c. AD 50", at: [231, 85], left: true, tag: "text",
          text: "Paul worked here as a tentmaker for a year and a half (Acts 18:3, 11). Two of his letters to this church are in the Bible.",
          say: "A busy port city. Paul made tents here!",
        },
        {
          id: "ephesus", name: "Ephesus", year: "c. AD 53", at: [266, 85], tag: "text",
          text: "Paul taught here for two years, and the message spread through the whole province of Asia (Acts 19:10).",
          say: "Two years of teaching. The whole region heard.",
        },
        {
          id: "rome", name: "Rome", year: "c. AD 57–60", at: [148, 43], tag: "text",
          text: "There was already a church in the capital when Paul wrote Romans. A few years later he arrived as a prisoner, and kept teaching (Acts 28).",
          say: "The capital of the empire. In about thirty years!",
        },
      ],
      beyond: [
        { name: "Bithynia", at: [288, 55], year: "by 112" },
        { name: "Alexandria", at: [287, 155], year: "by 100s" },
        { name: "Carthage", at: [130, 96], year: "by 180" },
        { name: "Lyon", at: [86, 2], year: "by 177" },
      ],
      beyondSay: "And by the 100s, it was wherever the roads went.",
      after: [
        { say: "Not everyone welcomed it, though.", mood: "thinking", act: "tilt" },
        { say: "Let’s read what the Romans themselves wrote.", mood: "curious", act: "nod" },
      ],
    },

    // 2. the documents
    {
      kind: "hfirstDocs",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Historians love sources written by outsiders.", mood: "curious", act: "tilt" },
        { say: "These two Romans weren’t Christians at all.", mood: "cheeky", act: "stare" },
      ],
      hint: "Tap the underlined words. They’re clues.",
      docs: [
        {
          id: "pliny", tab: "Pliny’s letter",
          from: "Pliny the Younger, governor, to Emperor Trajan",
          when: "c. AD 112 · Bithynia, in today’s Turkey",
          source: "Pliny, Letters 10.96, shortened. Trajan wrote back: don’t hunt them down, and ignore anonymous accusations (10.97).",
          text: "Those accused who kept saying they were Christians, I had executed. Others told me this was the whole of it: they met on a fixed day before dawn and sang a hymn to Christ as to a god. They bound themselves by an oath, not to some crime, but not to steal, not to commit adultery, not to break their word. Then they met again to eat ordinary, harmless food. People of every age and rank, men and women, in towns and villages, have caught this.",
          clues: [
            { phrase: "met on a fixed day before dawn", tells: "They gathered every week, early enough to fit before a day’s work. Most historians take the fixed day to be Sunday, the day of the resurrection.", say: "Before sunrise, before work. Every week.", reading: true },
            { phrase: "sang a hymn to Christ as to a god", tells: "An outsider, about eighty years after the cross, reports that Christians worshipped Christ, not just remembered him as a teacher.", say: "Even a Roman governor noticed: they worshipped Jesus." },
            { phrase: "not to steal, not to commit adultery, not to break their word", tells: "Their “secret oath” was ordinary honesty and faithfulness. Pliny found no crime in it.", say: "The secret oath? To be honest and faithful!" },
            { phrase: "ordinary, harmless food", tells: "Rumours said Christians did terrible things at secret meals. Pliny looked into it and found ordinary food.", say: "So much for the rumours." },
            { phrase: "every age and rank, men and women", tells: "It wasn’t one kind of person. The faith crossed lines of age, class and sex that Roman society kept firmly in place.", say: "Young and old, slave and free, men and women." },
          ],
          sum: "A worried governor, and he still describes good neighbours.",
        },
        {
          id: "tacitus", tab: "Tacitus’s history",
          from: "Tacitus, a Roman historian",
          when: "c. AD 116 · about events in AD 64",
          source: "Tacitus, Annals 15.44, shortened.",
          text: "After the great fire in Rome, people blamed Nero. To end the rumour, Nero blamed a group the crowd hated, called Christians. The name comes from Christus, who was executed by the governor Pontius Pilate in the reign of Tiberius. The movement was checked for a moment, then broke out again, not only in Judea but in Rome itself. They were put to death cruelly, until even people who hated them began to pity them.",
          clues: [
            { phrase: "executed by the governor Pontius Pilate in the reign of Tiberius", tells: "A Roman historian with no love for Christians confirms that Jesus was executed under Pilate, just as the Gospels say.", say: "That’s the cross, recorded by a Roman." },
            { phrase: "broke out again, not only in Judea but in Rome itself", tells: "The movement didn’t end at the cross. Within about thirty years it was big enough in Rome to be blamed for a disaster.", say: "It should have ended at the cross. It didn’t." },
            { phrase: "even people who hated them began to pity them", tells: "Nero’s cruelty was so public that it turned some Romans’ hatred into pity.", say: "Cruelty that backfired." },
          ],
          sum: "A hostile witness, and he confirms the cross under Pilate.",
        },
      ],
      note: "Both are paraphrased from English translations and shortened. Neither writer was a Christian, which makes them useful witnesses.",
      after: [
        { say: "So they were known for worship, and for honesty.", mood: "moved", act: "nod" },
        { say: "And sometimes they died for it. How often?", mood: "thinking", act: "tilt" },
      ],
    },

    // 3. the years
    {
      kind: "hfirstYears",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Was it persecution all the time, everywhere?", mood: "thinking", act: "tilt" },
        { say: "Let’s check the record, year by year.", mood: "curious", act: "nod" },
      ],
      hint: "Drag along the years, left to right.",
      events: [
        {
          year: 34, label: "Stephen", place: "Jerusalem", scope: "local", tag: "text",
          text: "Stephen, one of the first deacons, was stoned after speaking to the council. Believers scattered, and took the message with them (Acts 8:4).",
          verse: { text: "He kneeled down, and cried with a loud voice, “Lord, don’t hold this sin against them!”", ref: "Acts 7:60", translation: WEB },
          say: "He forgave them as he died.",
        },
        {
          year: 64, label: "Nero blames the Christians", place: "Rome", scope: "local", tag: "record",
          text: "After the great fire, Nero turned on the Christians of Rome. Early tradition says Peter and Paul were killed in Rome in these years.",
          say: "Terrible. But it was one city, under one emperor.",
        },
        {
          year: 112, label: "Trials in Bithynia", place: "Bithynia", scope: "local", tag: "record",
          text: "Christians were tried only when someone accused them. Trajan’s rule: punish those accused who won’t deny Christ, but don’t go looking.",
          say: "Not a manhunt. Trouble came if a neighbour accused you.",
        },
        {
          year: 177, label: "The Christians of Lyon", place: "Gaul", scope: "local", tag: "record",
          text: "A mob turned on the church in Lyon. A letter from the survivors remembers Blandina, an enslaved woman, who would only say that she was a Christian.",
          say: "A slave woman’s courage, remembered for centuries.",
        },
        {
          year: 203, label: "Perpetua and Felicity", place: "Carthage", scope: "local", tag: "record",
          text: "Perpetua, a young noblewoman and new mother, and Felicity, an enslaved woman, died together. Perpetua’s prison diary survives: one of the earliest writings we have by a Christian woman.",
          say: "Her own diary survived. We can still read it.",
        },
        {
          year: 250, until: 251, label: "Decius: sacrifice or else", place: "The whole empire", scope: "empire", tag: "record",
          text: "For the first time, everyone had to sacrifice to the gods and get a certificate to prove it. Many Christians refused. Some gave in, and the church argued over welcoming them back.",
          say: "Now it was everywhere at once. And some gave in.",
        },
        {
          year: 257, until: 260, label: "Valerian targets the leaders", place: "The whole empire", scope: "empire", tag: "record",
          text: "Bishops and clergy were arrested and church meetings banned. Cyprian, bishop of Carthage, was executed in 258.",
          say: "A second wave, aimed at the leaders.",
        },
        {
          year: 303, until: 311, label: "The Great Persecution", place: "The whole empire", scope: "empire", tag: "record",
          text: "Under Diocletian, churches were destroyed and Scriptures burned. It was the longest and harshest wave, worst in the East, until Galerius called it off in 311.",
          say: "The biggest wave of all. Years long, in places.",
        },
        {
          year: 313, label: "The Edict of Milan", place: "The whole empire", scope: "peace", tag: "record",
          text: "The emperors Constantine and Licinius gave Christians, and everyone else, freedom to worship, and ordered church property returned.",
          say: "Freedom, after nearly three hundred years!",
        },
      ],
      finding: "Persecution came in waves: local outbreaks, then three empire-wide campaigns. In between, most Christians lived quietly beside their neighbours, sometimes for decades.",
      after: [
        { say: "So how did a hunted minority keep growing?", mood: "curious", act: "tilt" },
      ],
    },

    // 4. why it spread
    {
      kind: "hfirstGrow",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Three witnesses, three centuries apart.", mood: "curious", act: "nod" },
      ],
      hint: "Open each witness. Look at how they lived.",
      witnesses: [
        {
          id: "acts", who: "Luke, about the first church", when: "Jerusalem, the first days",
          text: "From the very start, sharing what they had was part of following Jesus.",
          verse: { text: "All who believed were together, and had all things in common. They sold their possessions and goods, and distributed them to all, according as anyone had need.", ref: "Acts 2:44–45", translation: WEB },
          source: "Acts 2:42–47",
          say: "It was there from the very first days.",
        },
        {
          id: "dionysius", who: "Dionysius, bishop of Alexandria", when: "During a plague, c. AD 260",
          text: "When the plague came, most people fled, even from their own sick relatives. Many Christians stayed to nurse the sick, their own and others, and some caught it and died doing so.",
          source: "Paraphrased from his letter, kept in Eusebius, Church History 7.22",
          say: "They stayed when everyone else ran.",
        },
        {
          id: "julian", who: "Emperor Julian, who wanted the old gods back", when: "c. AD 362",
          text: "He complained to a pagan priest that the “Galileans”, as he called Christians, fed not only their own poor but ours as well, while our people get no help from us.",
          source: "Paraphrased from Julian, Letter to Arsacius",
          say: "Even an emperor against them admitted it.",
        },
      ],
      hold: "Now hold the button, and watch the years go by.",
      points: [
        { year: 40, people: 1000 },
        { year: 100, people: 7530 },
        { year: 150, people: 40496 },
        { year: 200, people: 217795 },
        { year: 250, people: 1171356 },
        { year: 300, people: 6299832 },
      ],
      estimate: "Sociologist Rodney Stark’s projection (1996), assuming growth of about 40% a decade. Historians debate the numbers. The lights are illustrative.",
      finding: "Not armies or power. Ordinary people who worshipped Jesus, kept their word, and cared for the sick and the poor, Christian or not.",
      after: [
        { say: "By AD 300, maybe one in ten people in the empire.", mood: "excited", act: "hop" },
        { say: "Not by force. One life, then another.", mood: "moved", act: "nod" },
      ],
    },

    // the optional reflection
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "The faith was passed on, one life at a time. Who passed it to you?",
      options: [
        { text: "Someone in my family", reply: "Then it runs in a long line, all the way back to Jerusalem." },
        { text: "A friend", reply: "That’s exactly how it spread through Rome." },
        { text: "A church or a teacher", reply: "Like Antioch: a whole year of teaching, Acts says." },
        { text: "I’m still finding my way", reply: "Then you’re in good company. Everyone on that map was, once." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },

    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "What happened to the first Christians?",
      body: "",
      summary: [
        "From Jerusalem, the faith reached Rome in about thirty years, carried by Paul and by ordinary believers.",
        "Roman outsiders describe them worshipping Christ, keeping their word and sharing ordinary meals.",
        "Persecution came in waves, local and then empire-wide, until freedom of worship in 313.",
        "It kept growing as they cared for the sick and the poor, Christian or not.",
      ],
      verse: { text: "Therefore let us also, seeing we are surrounded by so great a cloud of witnesses, lay aside every weight and the sin which so easily entangles us, and let us run with perseverance the race that is set before us", ref: "Hebrews 12:1", translation: WEB },
      refs: ["Acts 1:8", "Acts 2:42–47", "Acts 7:54–8:4", "Acts 11:19–26", "Acts 18:1–11", "Acts 19:8–10", "Acts 28:14–31", "1 Peter 4:12–14", "Hebrews 12:1"],
      sources: [
        { title: "Pliny the Younger, Letters 10.96–97 (to and from Trajan)", publisher: "Primary source, c. AD 112" },
        { title: "Tacitus, Annals 15.44", publisher: "Primary source, c. AD 116" },
        { title: "Eusebius, Church History 5.1 (Lyon) and 7.22 (Dionysius on the plague)", publisher: "Primary source, early 300s" },
        { title: "The Passion of Perpetua and Felicity", publisher: "Primary source, c. AD 203" },
        { title: "Julian, Letter to Arsacius", publisher: "Primary source, c. AD 362" },
        { title: "Rodney Stark, The Rise of Christianity", publisher: "Princeton University Press, 1996" },
      ],
      related: [
        { title: "How Did We Get the Bible?", sub: "Church History · 5 min", lessonId: "history-bible" },
        { title: "Why Did Christianity Split?", sub: "Church History · 5 min", lessonId: "history-split" },
        { title: "The woman who forgave her captor", sub: "Testimonies · Corrie ten Boom", lessonId: "corrie-ten-boom" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
