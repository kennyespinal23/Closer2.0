import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover the Gospel of John" (John 1–21).
   - Sections: prologue (1:1–18), the signs (1:19–12:50), the hour (13:1–20:31), epilogue (21). Teaching divisions.
   - Turning point: 12:23. Until then Jesus' "hour" is "not yet" (2:4; 7:30; 8:20); at 12:23 he says it has come,
     and from 13:1 the book turns to one night and the cross. 12:23 is chosen over 13:1 because it is where the
     countdown the reader has been following actually ends; 13:1 is shown alongside.
   - Purpose is stated in the text (20:30–31). John numbers only the first two signs (2:11; 4:54); "seven signs"
     is a common way of counting, so it's labelled as such.
   - Authorship: the text points to "the disciple whom Jesus loved" (21:20–24) without naming him. Tradition says
     John son of Zebedee. Scholars differ.
   - Textual block: 7:53–8:11 is in the WEB, but absent from the earliest manuscripts (Papyri 66 and 75, Codices
     Sinaiticus and Vaticanus); in some later ones it appears elsewhere (after 7:36, after 21:25, after Luke 21:38).
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const johnBook: Book = {
  name: "John",
  title: "The Gospel of John",
  kicker: "The Gospel of",
  genre: "gospel",
  shape: "arc",
  chapterLengths: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25],
  divisions: "These four parts are teaching divisions to help you see the shape. John didn’t write headings, though many readers notice the same break after chapter 12.",
  sections: [
    {
      id: "prologue", title: "The Word", chapters: "John 1", from: [1, 1], to: [1, 18],
      gist: "A poem: the Word who was with God, and was God, became flesh.",
      summary: "Instead of a birth story, John begins before creation. The Word was with God and was God, made all things, came into the world, and “became flesh, and lived among us.”",
      event: { title: "The Word becomes flesh", ref: "1:14" },
      verse: v("In the beginning was the Word, and the Word was with God, and the Word was God.", "John 1:1"),
      role: "It’s the overture: light, life, glory, believing. Every big word of the book appears here first.",
      say: "No manger. John starts at the very beginning!",
    },
    {
      id: "signs", title: "The Signs", chapters: "John 1–12", from: [1, 19], to: [12, 50],
      gist: "Miracles John calls “signs”, long conversations, and growing conflict.",
      summary: "Jesus turns water into wine, talks with Nicodemus at night and a Samaritan woman at noon, feeds a crowd, heals a man born blind and calls Lazarus out of the tomb. Each sign points beyond itself, and opinion about him splits.",
      event: { title: "Lazarus raised", ref: "11:1–44" },
      verse: v("This beginning of his signs Jesus did in Cana of Galilee, and revealed his glory; and his disciples believed in him.", "John 2:11"),
      role: "The signs show who Jesus is. Some believe, and some harden against him (12:37).",
      say: "Every miracle here is a signpost. Look where it points!",
    },
    {
      id: "hour", title: "The Hour", chapters: "John 13–20", from: [13, 1], to: [20, 31],
      gist: "One last night with his friends, then the cross and the empty tomb.",
      summary: "Jesus washes his disciples’ feet, gives a new commandment to love, talks with them through the night and prays for them. He is arrested, crucified and raised. He meets Mary Magdalene in the garden and Thomas behind locked doors.",
      event: { title: "The new commandment", ref: "13:34–35" },
      verse: v("A new commandment I give to you, that you love one another. Just as I have loved you, you also love one another.", "John 13:34"),
      role: "Five chapters cover a single evening. Then John states why he wrote the book (20:31).",
      say: "Five whole chapters for one night. John slows right down.",
    },
    {
      id: "epilogue", title: "By the Lake", chapters: "John 21", from: [21, 1], to: [21, 25],
      gist: "Breakfast on the beach, and Peter restored.",
      summary: "The risen Jesus cooks breakfast for his disciples by the Sea of Tiberias. Three times he asks Peter if he loves him, and three times gives him work to do. The book closes with the witness of the beloved disciple.",
      event: { title: "Peter asked three times", ref: "21:15–17" },
      verse: v("Jesus said to him, “Feed my sheep.", "John 21:17"),
      role: "After denying Jesus three times, Peter is given a new beginning, and the book hands its story on.",
      say: "Three denials, three questions. That’s on purpose.",
    },
  ],
  pivot: {
    from: [12, 23], to: [12, 24], ref: "John 12:23–24",
    say: { before: "Signs, crowds, and “not yet.”", at: "There! “The time has come.”", after: "Now it’s all about his hour." },
    verses: [
      v("Jesus answered them, “The time has come for the Son of Man to be glorified.", "John 12:23"),
      v("unless a grain of wheat falls into the earth and dies, it remains by itself alone. But if it dies, it bears much fruit.", "John 12:24"),
    ],
    why: "For eleven chapters, Jesus’ “hour” hasn’t come yet (2:4; 7:30; 8:20). Here he says it has, and explains it with a seed that has to die. Right after, the public signs end and John opens a new part: “his time had come” (13:1), marked ▲ on the track.",
    before: { label: "“My hour has not yet come”", text: "Signs, debates and growing opposition. Again and again, his time isn’t yet." },
    after: { label: "“Father, the time has come”", text: "No more public signs. One night with his friends, a long prayer (17:1), and the cross, which John calls his glory." },
    echoes: [{ at: [13, 1], ref: "13:1" }, { at: [17, 1], ref: "17:1" }],
  },
  threads: [
    {
      id: "iam", title: "The “I am” sayings", say: "Seven pictures of who Jesus is.",
      stops: [
        { at: [6, 35], label: "Bread", note: "Said the day after he fed five thousand.", verse: v("I am the bread of life. He who comes to me will not be hungry, and he who believes in me will never be thirsty.", "John 6:35") },
        { at: [8, 12], label: "Light", note: "He says it again before healing a man born blind (9:5).", verse: v("I am the light of the world. He who follows me will not walk in the darkness, but will have the light of life.", "John 8:12") },
        { at: [10, 11], label: "Shepherd", note: "A shepherd who gives his life, not just his time.", verse: v("I am the good shepherd. The good shepherd lays down his life for the sheep.", "John 10:11") },
        { at: [11, 25], label: "Resurrection", note: "Said to Martha, beside her brother’s tomb.", verse: v("I am the resurrection and the life. He who believes in me will still live, even if he dies.", "John 11:25") },
        { at: [14, 6], label: "The way", note: "An answer to Thomas: “How can we know the way?”", verse: v("I am the way, the truth, and the life. No one comes to the Father, except through me.", "John 14:6") },
        { at: [15, 5], label: "The vine", note: "The last one: life comes from staying connected.", verse: v("I am the vine. You are the branches. He who remains in me, and I in him, the same bears much fruit, for apart from me you can do nothing.", "John 15:5") },
      ],
    },
    {
      id: "signs", title: "Signs", say: "John calls them signs, not just miracles.",
      stops: [
        { at: [2, 11], label: "The first sign", note: "Water into wine at a wedding. John counts it: the beginning.", verse: v("This beginning of his signs Jesus did in Cana of Galilee, and revealed his glory; and his disciples believed in him.", "John 2:11") },
        { at: [4, 54], label: "The second sign", note: "An official’s son healed. After this John stops numbering; many readers count seven signs in all.", verse: v("This is again the second sign that Jesus did, having come out of Judea into Galilee.", "John 4:54") },
        { at: [11, 43], label: "The greatest sign", note: "Lazarus, four days dead, walks out.", verse: v("he cried with a loud voice, “Lazarus, come out!”", "John 11:43") },
        { at: [12, 37], label: "Signs refused", note: "Signs don’t force belief. Many still say no.", verse: v("But though he had done so many signs before them, yet they didn’t believe in him,", "John 12:37") },
        { at: [20, 30], label: "Why they were written", note: "John says he chose these signs on purpose.", verse: v("Therefore Jesus did many other signs in the presence of his disciples, which are not written in this book;", "John 20:30") },
      ],
    },
    {
      id: "believe", title: "Believe and live", say: "This is the whole point of the book, John says.",
      stops: [
        { at: [3, 16], label: "To Nicodemus", note: "The best-known verse in the Bible, from a conversation at night.", verse: v("For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.", "John 3:16") },
        { at: [11, 26], label: "“Do you believe this?”", note: "Jesus asks Martha directly, in her grief.", verse: v("Whoever lives and believes in me will never die. Do you believe this?", "John 11:26") },
        { at: [20, 28], label: "Thomas", note: "The doubter makes the boldest confession in the book.", verse: v("Thomas answered him, “My Lord and my God!”", "John 20:28") },
        { at: [20, 29], label: "Those who haven’t seen", note: "A blessing for every later reader.", verse: v("Blessed are those who have not seen, and have believed.", "John 20:29") },
        { at: [20, 31], label: "The purpose", note: "John’s own reason for writing.", verse: v("but these are written, that you may believe that Jesus is the Christ, the Son of God, and that believing you may have life in his name.", "John 20:31") },
      ],
    },
  ],
  summary: {
    overview: "A deep, reflective account of Jesus as the Word made flesh, told through signs and conversations so that readers may believe and have life.",
    keys: ["John 1:1–14", "2:11", "3:16", "11:25", "12:23–24", "13:34", "20:31"],
  },
};

export const johnOverview = BookOverviewExperience(johnBook, {
  id: "book-john",
  title: "Discover the Gospel of John",
  subtitle: "Written so that you may believe",
  scripture: "John 1–21",
  minutes: 6,
  cover: {
    before: [
      { say: "Twenty-one chapters.", mood: "curious", act: "tilt" },
      { say: "A Gospel that feels different from the other three.", mood: "excited", act: "hop" },
      { say: "Let’s see how it’s built.", mood: "happy", act: "nod" },
    ],
    open: "Go on, open it!",
    after: [{ say: "John even tells you why he wrote it. We’ll find that.", mood: "cheeky", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what makes John, John?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "Why was it written?", tag: "text", body: "John says so himself: he chose these signs so that readers would believe that Jesus is the Christ, the Son of God, and have life.", verse: v("but these are written, that you may believe that Jesus is the Christ, the Son of God, and that believing you may have life in his name.", "John 20:31"), say: "The purpose, in his own words." },
      { title: "How is it different?", tag: "text", body: "Long conversations instead of short parables, much of it set in Jerusalem, and three Passovers mentioned (2:13; 6:4; 11:55). Many stories here aren’t in the other Gospels.", say: "Fewer parables, more conversations." },
      { title: "Who wrote it?", tag: "tradition", body: "The book points to “the disciple whom Jesus loved” as its witness (21:20–24), but never names him. Early tradition says John, son of Zebedee. Scholars differ on how the book came together.", say: "A beloved disciple, never named." },
      { title: "When?", tag: "scholarship", body: "Many scholars date it to around AD 90–100, making it probably the last Gospel written. Some argue for earlier. These are views, not certainties.", say: "Probably the last of the four." },
    ],
    after: [{ say: "Now let’s unfold it.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s John, to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a part.",
    after: [
      { say: "A tiny opening poem, then two big halves.", mood: "cheeky", act: "tilt" },
      { say: "The break between them is where the story turns.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s look inside each part.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "From the beginning of time to breakfast on a beach!", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "John has a clock running in the background.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark and find where time runs out.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "His hour has come, and John calls it glory.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Three threads run all the way through John.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Who he is, what he shows, and what he asks: believe.", mood: "happy", act: "nod" }],
  },
  textual: {
    before: [
      { say: "One famous story in John has an unusual history.", mood: "curious", act: "tilt" },
      { say: "The woman caught in adultery. Let’s look at the copies.", mood: "thinking" },
    ],
    passage: [
      v("The scribes and the Pharisees brought a woman taken in adultery. Having set her in the middle,", "John 8:3"),
      v("She said, “No one, Lord.” Jesus said, “Neither do I condemn you. Go your way. From now on, sin no more.”", "John 8:11"),
    ],
    views: [
      { label: "Earliest manuscripts", ends: "Not here: 7:52 runs on to 8:12", note: "The earliest surviving copies of John, including Papyri 66 and 75 (around AD 200) and Codices Sinaiticus and Vaticanus (4th century), don’t include John 7:53–8:11." },
      { label: "Most later ones", ends: "7:53–8:11 appear here. A few manuscripts place the story elsewhere: after John 7:36, at the end of John, or after Luke 21:38.", note: "Most later manuscripts include the story at this point, and it has been read in churches for centuries." },
    ],
    body: [
      "Many Bibles print it in brackets with a note. Many scholars think it’s an early story about Jesus that was added to John later; some hold that it belongs where it is.",
      "Either way, it has been loved for centuries, and many readers see in it the same Jesus John shows everywhere: full of grace and truth (1:14).",
    ],
    after: [{ say: "Honest about its history, and still much loved.", mood: "moved", act: "nod" }],
  },
  summary: { say: "That’s John, at a glance!", button: "Finish" },
});
