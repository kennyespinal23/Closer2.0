import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover the Gospel of Mark" (Mark 1–16).
   - The four movements are teaching divisions, and the screen says so. Two of them meet in chapter 8:
     4:1–8:26 and 8:27–10:52.
   - Authorship: the text names no author. The link to John Mark and Peter is early tradition (Papias, quoted by
     Eusebius, Church History 3.39). Dating (around AD 65–75) and Mark being written first are scholars' views.
   - The ending: Codex Sinaiticus and Codex Vaticanus (4th century) end at 16:8. Most later manuscripts have
     16:9–20; a few have a shorter ending. Told plainly, without calling 9–20 original or not.
   - Movement four runs to 16:8 on the map, so the longer ending sits visibly apart.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const mark: Book = {
  name: "Mark",
  title: "The Gospel of Mark",
  kicker: "The Gospel of",
  genre: "gospel",
  shape: "arc",
  chapterLengths: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
  divisions: "These four movements are teaching divisions to help you see the shape. Mark didn’t write headings, and readers divide the book in different ways.",
  sections: [
    {
      id: "beginning", title: "The Beginning", chapters: "Mark 1–3", from: [1, 1], to: [3, 35],
      gist: "Jesus bursts onto the scene in Galilee: baptism, healing, teaching, and the first opposition.",
      summary: "Mark skips Jesus’ birth and starts with John the Baptist. Jesus is baptized, calls his first followers, heals, forgives and teaches with authority. Crowds flock to him, and religious leaders start to plot (3:6).",
      event: { title: "Jesus’ baptism and the voice from heaven", ref: "1:9–11" },
      verse: v("The time is fulfilled, and God’s Kingdom is at hand! Repent, and believe in the Good News.", "Mark 1:15"),
      role: "It raises the question the whole book chases: who is this man, with authority to heal and even to forgive sins (2:7)?",
      say: "Mark moves fast. “Immediately” is everywhere!",
    },
    {
      id: "questions", title: "Growing Questions", chapters: "Mark 4–8", from: [4, 1], to: [8, 26],
      gist: "Parables and miracles, and everyone asking: who is this?",
      summary: "Jesus teaches in parables, calms a storm, feeds thousands and heals. His hometown takes offence (6:3), and even his closest followers struggle to understand.",
      event: { title: "The storm stilled on the lake", ref: "4:35–41" },
      verse: v("They were greatly afraid, and said to one another, “Who then is this, that even the wind and the sea obey him?”", "Mark 4:41"),
      role: "The question gets louder. People see what Jesus does, but can’t yet say who he is.",
      say: "Everyone’s asking the same question. Even his friends!",
    },
    {
      id: "turn", title: "The Turning Point", chapters: "Mark 8–10", from: [8, 27], to: [10, 52],
      gist: "Peter names Jesus as the Christ, and Jesus begins to speak about his suffering.",
      summary: "On the road, Peter says Jesus is the Christ. Then Jesus teaches, three times, that he will suffer, die and rise. The disciples argue about who is greatest, and Jesus teaches that the first will be last.",
      event: { title: "Peter’s confession", ref: "8:27–30" },
      verse: v("For the Son of Man also came not to be served, but to serve, and to give his life as a ransom for many.", "Mark 10:45"),
      role: "One question is answered, and a harder one opens: what kind of Christ, and what does following him cost?",
      say: "This is where the book changes direction.",
    },
    {
      id: "week", title: "The Final Week", chapters: "Mark 11–16", from: [11, 1], to: [16, 8],
      gist: "Jerusalem: the last week, the cross, and the empty tomb.",
      summary: "Jesus enters Jerusalem to cheers, clears the temple, debates the leaders and shares a last meal. He is arrested, tried and crucified. On the first day of the week, women find the tomb empty.",
      event: { title: "The crucifixion", ref: "15:21–39" },
      verse: v("When the centurion, who stood by opposite him, saw that he cried out like this and breathed his last, he said, “Truly this man was the Son of God!”", "Mark 15:39"),
      role: "Mark gives more than a third of his book to this one week. Everything has been heading here.",
      say: "A third of the book, for one week!",
    },
  ],
  pivot: {
    from: [8, 27], to: [8, 33], ref: "Mark 8:27–33",
    say: { before: "Crowds, miracles, and one big question.", at: "Here! Everything turns here.", after: "Now he’s on the road to Jerusalem." },
    verses: [
      v("“But who do you say that I am?” Peter answered, “You are the Christ.”", "Mark 8:29"),
      v("He began to teach them that the Son of Man must suffer many things, and be rejected by the elders, the chief priests, and the scribes, and be killed, and after three days rise again.", "Mark 8:31"),
    ],
    why: "Halfway through, “Who is he?” gets an answer: the Christ. Straight away Jesus says the Christ must suffer, and Peter pushes back (8:32–33). From here the story turns toward Jerusalem and the cross, and Jesus repeats the warning twice more (9:31; 10:33–34), marked ▲ on the track.",
    before: { label: "“Who is this?”", text: "In and around Galilee, crowds gather, miracles pile up, and people keep asking who Jesus is." },
    after: { label: "“The Son of Man must suffer”", text: "On the road to Jerusalem, Jesus speaks openly about his suffering, and teaches what it really means to follow him." },
    echoes: [{ at: [9, 31], ref: "9:31" }, { at: [10, 33], ref: "10:33–34" }],
    regions: [
      { from: [1, 1], to: [9, 50], label: "Galilee and around" },
      { from: [10, 1], to: [10, 52], label: "Road" },
      { from: [11, 1], to: [16, 20], label: "Jerusalem" },
    ],
  },
  threads: [
    {
      id: "who", title: "Who is Jesus?", say: "Watch how the answer builds.",
      stops: [
        { at: [1, 1], label: "The first line", note: "Mark tells you the answer in his first sentence. The people in the story take much longer to see it.", verse: v("The beginning of the Good News of Jesus Christ, the Son of God.", "Mark 1:1") },
        { at: [1, 11], label: "At his baptism", note: "A voice from heaven calls Jesus “my beloved Son.”", verse: v("A voice came out of the sky, “You are my beloved Son, in whom I am well pleased.”", "Mark 1:11") },
        { at: [2, 7], label: "Who can forgive sins?", note: "Teachers of the law object when Jesus forgives sins. Only God can do that, they say.", verse: v("Why does this man speak blasphemies like that? Who can forgive sins but God alone?", "Mark 2:7") },
        { at: [4, 41], label: "After the storm", note: "His own disciples ask it outright.", verse: v("Who then is this, that even the wind and the sea obey him?", "Mark 4:41") },
        { at: [8, 29], label: "Peter’s answer", note: "The turning point: a disciple finally says it.", verse: v("Peter answered, “You are the Christ.”", "Mark 8:29") },
        { at: [15, 39], label: "At the cross", note: "Earlier, the voice from heaven and unclean spirits call Jesus God’s Son. The first person to say it is a Roman centurion, watching him die.", verse: v("Truly this man was the Son of God!", "Mark 15:39") },
      ],
    },
    {
      id: "follow", title: "What does it mean to follow him?", say: "Following him looks different the further you go.",
      stops: [
        { at: [1, 17], label: "The first call", note: "It starts simply: come after me.", verse: v("Come after me, and I will make you into fishers for men.", "Mark 1:17") },
        { at: [8, 34], label: "Take up your cross", note: "Right after the turning point, following means giving yourself away.", verse: v("Whoever wants to come after me, let him deny himself, and take up his cross, and follow me.", "Mark 8:34") },
        { at: [9, 35], label: "Last of all", note: "The disciples have just argued about which of them is greatest.", verse: v("If any man wants to be first, he shall be last of all, and servant of all.", "Mark 9:35") },
        { at: [10, 52], label: "On the way", note: "Bartimaeus, a blind beggar, receives his sight and follows: a picture of what a disciple is.", verse: v("Immediately he received his sight, and followed Jesus on the way.", "Mark 10:52") },
        { at: [14, 50], label: "They all fled", note: "At the arrest, every disciple runs. Mark doesn’t hide it.", verse: v("They all left him, and fled.", "Mark 14:50") },
        { at: [16, 7], label: "He goes before you", note: "Even after they ran, the invitation stands, and Peter is named.", verse: v("But go, tell his disciples and Peter, ‘He goes before you into Galilee. There you will see him, as he said to you.’", "Mark 16:7") },
      ],
    },
    {
      id: "suffer", title: "Why does Jesus suffer?", say: "This thread runs right through the middle.",
      stops: [
        { at: [3, 6], label: "The plot begins", note: "As early as chapter 3, his opponents start planning to destroy him.", verse: v("The Pharisees went out, and immediately conspired with the Herodians against him, how they might destroy him.", "Mark 3:6") },
        { at: [8, 31], label: "He must suffer", note: "The first of three times Jesus says it plainly.", verse: v("He began to teach them that the Son of Man must suffer many things, and be rejected by the elders, the chief priests, and the scribes, and be killed, and after three days rise again.", "Mark 8:31") },
        { at: [9, 31], label: "He says it again", note: "The second time. They don’t understand, and are afraid to ask (9:32).", verse: v("The Son of Man is being handed over to the hands of men, and they will kill him; and when he is killed, on the third day he will rise again.", "Mark 9:31") },
        { at: [10, 45], label: "To give his life", note: "Jesus gives a reason: he came to serve, and to give his life as a ransom for many.", verse: v("For the Son of Man also came not to be served, but to serve, and to give his life as a ransom for many.", "Mark 10:45") },
        { at: [14, 36], label: "In the garden", note: "He asks for another way, and still chooses his Father’s will.", verse: v("Abba, Father, all things are possible to you. Please remove this cup from me. However, not what I desire, but what you desire.", "Mark 14:36") },
        { at: [15, 34], label: "On the cross", note: "He cries out the opening words of Psalm 22.", verse: v("My God, my God, why have you forsaken me?", "Mark 15:34") },
      ],
    },
  ],
  summary: {
    overview: "A fast-moving account of who Jesus is: the Christ who serves, suffers, dies and rises, and calls people to follow him.",
    keys: ["Mark 1:1", "1:15", "8:29–31", "10:45", "15:39", "16:6–8"],
  },
};

export const markOverview = BookOverviewExperience(mark, {
  id: "book-mark",
  title: "Discover the Gospel of Mark",
  subtitle: "Sixteen chapters, one story",
  scripture: "Mark 1–16",
  minutes: 5,
  cover: {
    before: [
      { say: "Sixteen chapters.", mood: "curious", act: "tilt" },
      { say: "One extraordinary story.", mood: "excited", act: "hop" },
      { say: "Let’s see how it all fits together.", mood: "happy", act: "nod" },
    ],
    open: "Go on, open it!",
    after: [{ say: "Mark doesn’t waste a word. Let’s start with the big picture.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "A Gospel: the good news about Jesus, told as one fast-moving story. Mark is the shortest of the four Gospels.", verse: v("The beginning of the Good News of Jesus Christ, the Son of God.", "Mark 1:1"), say: "“Gospel” means good news." },
      { title: "What’s it about?", tag: "overview", body: "Who Jesus is, what he did and taught, and above all his suffering, death and resurrection.", say: "Watch how much of it is about one week." },
      { title: "Who wrote it?", tag: "tradition", body: "The book never names its author. From early on, Christians linked it to John Mark, who was said to have written down what Peter preached. The earliest source for this is Papias, an early 2nd-century church leader quoted by the historian Eusebius.", say: "A tradition, not a name in the text." },
      { title: "When?", tag: "scholarship", body: "Many scholars date it to around AD 65–75, and many think it was the first Gospel written. Both are well-supported views, not certainties.", say: "Scholars weigh this differently." },
    ],
    after: [{ say: "Now let’s open it right up.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s the whole book, laid out to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a movement.",
    after: [
      { say: "See how two of them meet in chapter 8? That’s on purpose. We’ll come back to it.", mood: "cheeky", act: "tilt" },
      { say: "And the last movement is long: one week, six chapters.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each movement.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Questions, then an answer, then the cross. You can feel it building.", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "Halfway through, something shifts.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark through the book and watch what changes.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "From here on, the cross is never far away.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Mark weaves a few big questions through the whole book.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Three threads, one story.", mood: "happy", act: "nod" }],
  },
  textual: {
    before: [
      { say: "Now, the ending. It’s more interesting than you might think.", mood: "curious", act: "tilt" },
      { say: "The oldest copies of Mark don’t all stop in the same place. Let’s look.", mood: "thinking" },
    ],
    passage: [
      v("He said to them, “Don’t be amazed. You seek Jesus, the Nazarene, who has been crucified. He has risen. He is not here. Behold, the place where they laid him!", "Mark 16:6"),
      v("They went out, and fled from the tomb, for trembling and astonishment had come on them. They said nothing to anyone; for they were afraid.", "Mark 16:8"),
    ],
    views: [
      { label: "Earliest manuscripts", ends: "Ends at 16:8", note: "The two oldest complete copies of Mark that survive, Codex Sinaiticus and Codex Vaticanus (both 4th century), stop here." },
      { label: "Most later ones", ends: "Verses 9–20 continue: Jesus appears to Mary Magdalene, to two followers and to the eleven, sends them out, and is taken up into heaven.", note: "Most later manuscripts include these verses. A few have a different, shorter ending instead." },
    ],
    body: [
      "Many Bibles print verses 9–20 with a note or in brackets. Many scholars think they were added later; some Christians hold that they belong to Mark.",
      "Did Mark mean to end with fear and silence, or was an ending lost? Readers still discuss it. Either way, the news at the heart of it is in verse 6: “He has risen.”",
    ],
    after: [{ say: "An ending that leaves you holding the question. Very Mark.", mood: "cheeky", act: "nod" }],
  },
  summary: { say: "That’s Mark, at a glance!", button: "Finish" },
});
