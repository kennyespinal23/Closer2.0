import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover the Gospel of Luke" (Luke 1–24).
   - Feels different from Mark: Luke tells you his method (1:1–4), starts with births and songs, and gives ten
     chapters to one long journey. The turning point is 9:51, where Jesus "intently set his face to go to Jerusalem".
   - The four movements are teaching divisions, and the screen says so.
   - Authorship: the text names no author. It's addressed to Theophilus, as Acts is (Acts 1:1). Early tradition
     names Luke, Paul's companion (Paul calls him "the beloved physician", Colossians 4:14). Dates are scholars' views.
   - 23:34 ("Father, forgive them") is left out of the quotes: it's missing from some early manuscripts.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const lukeBook: Book = {
  name: "Luke",
  title: "The Gospel of Luke",
  kicker: "The Gospel of",
  genre: "gospel",
  shape: "arc",
  chapterLengths: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53],
  divisions: "These four movements are teaching divisions to help you see the shape. Luke didn’t write headings, and readers divide the book in different ways.",
  sections: [
    {
      id: "beginnings", title: "Beginnings", chapters: "Luke 1–4", from: [1, 1], to: [4, 13],
      gist: "Two births, angels, songs, and Jesus’ baptism and testing.",
      summary: "Luke starts in the temple, with a priest named Zechariah. Two births are announced: John’s and Jesus’. Mary sings, shepherds hear the news, and the boy Jesus listens to the teachers in the temple. Then come his baptism and forty days in the wilderness.",
      event: { title: "The shepherds hear the news", ref: "2:8–20" },
      verse: v("The angel said to them, “Don’t be afraid, for behold, I bring you good news of great joy which will be to all the people.", "Luke 2:10"),
      role: "It opens the theme Luke never drops: good news for everyone, starting with the people nobody expected.",
      say: "Shepherds first! Luke loves the unexpected guest.",
    },
    {
      id: "galilee", title: "In Galilee", chapters: "Luke 4–9", from: [4, 14], to: [9, 50],
      gist: "Jesus announces his mission, heals, calls followers and teaches.",
      summary: "In his hometown synagogue Jesus reads from Isaiah and says it is fulfilled today. He heals, calls fishermen and a tax collector, eats with sinners and teaches on a level place. Peter calls him “the Christ of God” (9:20).",
      event: { title: "Jesus reads Isaiah in Nazareth", ref: "4:16–21" },
      verse: v("The Spirit of the Lord is on me, because he has anointed me to preach good news to the poor.", "Luke 4:18"),
      role: "Jesus states his mission in his own words, and the rest of Luke shows him living it out.",
      say: "His first sermon is basically a mission statement.",
    },
    {
      id: "journey", title: "The Journey", chapters: "Luke 9–19", from: [9, 51], to: [19, 27],
      gist: "Ten chapters on the road to Jerusalem, full of parables found only in Luke.",
      summary: "Jesus heads for Jerusalem and teaches as he goes. Many of the best-known parables are found only here in Luke: the good Samaritan, the lost son, the Pharisee and the tax collector. It ends with Zacchaeus up a tree.",
      event: { title: "The lost son", ref: "15:11–32" },
      verse: v("For the Son of Man came to seek and to save that which was lost.", "Luke 19:10"),
      role: "The longest part of the book is a journey. Luke turns the road into a classroom.",
      say: "The longest part of Luke is a road trip!",
    },
    {
      id: "jerusalem", title: "In Jerusalem", chapters: "Luke 19–24", from: [19, 28], to: [24, 53],
      gist: "The city, the cross, the empty tomb, and the road to Emmaus.",
      summary: "Jesus weeps over Jerusalem, teaches in the temple, shares the last supper and prays on the Mount of Olives. He is crucified and raised. On the road to Emmaus he explains the Scriptures, and the book ends with his followers praising God in the temple.",
      event: { title: "The road to Emmaus", ref: "24:13–35" },
      verse: v("Beginning from Moses and from all the prophets, he explained to them in all the Scriptures the things concerning himself.", "Luke 24:27"),
      role: "Luke ends where he began, in the temple, with joy. And the story carries on in his second book, Acts.",
      say: "It ends where it started: in the temple, full of joy.",
    },
  ],
  pivot: {
    from: [9, 51], to: [9, 51], ref: "Luke 9:51",
    say: { before: "Galilee: healing, teaching, crowds.", at: "There! He sets his face toward Jerusalem.", after: "On the road now, all the way to the city." },
    verses: [
      v("It came to pass, when the days were near that he should be taken up, he intently set his face to go to Jerusalem,", "Luke 9:51"),
    ],
    why: "Luke slows the story right down here. From 9:51 the rest of Jesus’ ministry happens on the way to Jerusalem, and Luke keeps reminding you where the road leads (13:22; 17:11; 19:11), marked ▲ on the track.",
    before: { label: "In Galilee", text: "Jesus heals and teaches around Galilee, and his followers begin to see who he is." },
    after: { label: "“On his way to Jerusalem”", text: "Ten chapters of travel, teaching and parables, all heading for the city where he will die and rise." },
    echoes: [{ at: [13, 22], ref: "13:22" }, { at: [17, 11], ref: "17:11" }, { at: [19, 11], ref: "19:11" }],
    regions: [
      { from: [4, 14], to: [9, 50], label: "Galilee" },
      { from: [9, 51], to: [19, 27], label: "The journey" },
      { from: [19, 28], to: [24, 53], label: "Jerusalem" },
    ],
  },
  threads: [
    {
      id: "outsiders", title: "Outsiders welcomed", say: "Watch who keeps getting a seat at the table.",
      stops: [
        { at: [2, 10], label: "News for shepherds", note: "The first people told are shepherds working at night.", verse: v("I bring you good news of great joy which will be to all the people.", "Luke 2:10") },
        { at: [5, 31], label: "Not for the healthy", note: "Jesus explains why he eats with tax collectors.", verse: v("Those who are healthy have no need for a physician, but those who are sick do.", "Luke 5:31") },
        { at: [7, 34], label: "A friend of sinners", note: "His critics mean it as an insult. Luke lets it stand.", verse: v("a friend of tax collectors and sinners!", "Luke 7:34") },
        { at: [15, 2], label: "He eats with them", note: "This complaint sets off three parables about things lost and found.", verse: v("This man welcomes sinners, and eats with them.", "Luke 15:2") },
        { at: [17, 16], label: "The one who came back", note: "Ten are healed. The one who returns to give thanks is a Samaritan.", verse: v("He fell on his face at Jesus’ feet, giving him thanks; and he was a Samaritan.", "Luke 17:16") },
        { at: [19, 10], label: "Seek and save", note: "Said at Zacchaeus’ house: the whole thread in one line.", verse: v("For the Son of Man came to seek and to save that which was lost.", "Luke 19:10") },
      ],
    },
    {
      id: "prayer", title: "Jesus at prayer", say: "Luke shows Jesus praying more than any other Gospel.",
      stops: [
        { at: [5, 16], label: "Slipping away", note: "Even as crowds grow, he keeps making room to pray.", verse: v("But he withdrew himself into the desert, and prayed.", "Luke 5:16") },
        { at: [6, 12], label: "All night", note: "Before choosing the twelve, he prays through the night.", verse: v("he went out to the mountain to pray, and he continued all night in prayer to God.", "Luke 6:12") },
        { at: [9, 18], label: "Before the big question", note: "Luke sets Peter’s confession in a moment of prayer.", verse: v("As he was praying alone, the disciples were with him, and he asked them, “Who do the multitudes say that I am?”", "Luke 9:18") },
        { at: [11, 1], label: "Teach us", note: "Watching him pray, his disciples ask to learn.", verse: v("Lord, teach us to pray, just as John also taught his disciples.", "Luke 11:1") },
        { at: [22, 42], label: "On the Mount of Olives", note: "He asks for another way, and yields to his Father.", verse: v("Father, if you are willing, remove this cup from me. Nevertheless, not my will, but yours, be done.", "Luke 22:42") },
        { at: [23, 46], label: "His last words", note: "In Luke, Jesus dies praying.", verse: v("Father, into your hands I commit my spirit!", "Luke 23:46") },
      ],
    },
    {
      id: "joy", title: "The Spirit and joy", say: "Luke is full of singing and celebrating.",
      stops: [
        { at: [1, 47], label: "Mary’s song", note: "The book opens with songs of praise.", verse: v("My spirit has rejoiced in God my Savior,", "Luke 1:47") },
        { at: [4, 1], label: "Full of the Spirit", note: "Jesus goes into the wilderness led by the Spirit.", verse: v("Jesus, full of the Holy Spirit, returned from the Jordan, and was led by the Spirit into the wilderness", "Luke 4:1") },
        { at: [10, 21], label: "Jesus rejoices", note: "One of the few times a Gospel says Jesus rejoiced.", verse: v("In that same hour Jesus rejoiced in the Holy Spirit", "Luke 10:21") },
        { at: [15, 7], label: "Joy in heaven", note: "Every lost-and-found story ends in a party.", verse: v("there will be more joy in heaven over one sinner who repents, than over ninety-nine righteous people who need no repentance.", "Luke 15:7") },
        { at: [24, 49], label: "Wait for power", note: "Jesus promises the Spirit, which Luke’s second book, Acts, picks up.", verse: v("But wait in the city of Jerusalem until you are clothed with power from on high.", "Luke 24:49") },
        { at: [24, 52], label: "Great joy", note: "The last word on the disciples: joy.", verse: v("They worshiped him, and returned to Jerusalem with great joy,", "Luke 24:52") },
      ],
    },
  ],
  summary: {
    overview: "A careful, joyful account of Jesus, the Savior who seeks the lost and welcomes the outsider, on his long road to Jerusalem.",
    keys: ["Luke 1:1–4", "2:10–11", "4:18–19", "9:51", "15:11–32", "19:10", "24:27"],
  },
};

export const lukeOverview = BookOverviewExperience(lukeBook, {
  id: "book-luke",
  title: "Discover the Gospel of Luke",
  subtitle: "The long road to Jerusalem",
  scripture: "Luke 1–24",
  minutes: 5,
  cover: {
    before: [
      { say: "Twenty-four chapters.", mood: "curious", act: "tilt" },
      { say: "The longest Gospel, and maybe the most joyful.", mood: "excited", act: "hop" },
      { say: "Let’s see how it fits together.", mood: "happy", act: "nod" },
    ],
    open: "Open it up!",
    after: [{ say: "Luke is the only Gospel writer who tells you his method. Let’s look.", mood: "excited", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what is this book, and who’s it for?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "A Gospel, written as an orderly account. Luke says he traced everything carefully from the start, so that Theophilus could be sure of what he’d been taught.", verse: v("it seemed good to me also, having traced the course of all things accurately from the first, to write to you in order, most excellent Theophilus;", "Luke 1:3"), say: "He did his research!" },
      { title: "What’s it about?", tag: "overview", body: "Jesus as Savior for everyone: the poor, the sick, outsiders and sinners. It’s the longest Gospel, with many parables found nowhere else.", say: "Lots of stories you’ll only find here." },
      { title: "Who wrote it?", tag: "tradition", body: "The book doesn’t name its author. Acts is addressed to the same Theophilus (Acts 1:1), so most readers see them as one two-part work. Early tradition names Luke, Paul’s companion, whom Paul calls “the beloved physician” (Colossians 4:14).", say: "Tradition says Luke. The text never signs it." },
      { title: "When?", tag: "scholarship", body: "Many scholars date it around AD 80–90; some argue for the early 60s. Most think Luke used Mark as one of his sources. These are scholars’ views, not certainties.", say: "Scholars weigh this differently." },
    ],
    after: [{ say: "Now let’s lay the whole book out.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Here’s Luke, to scale.", mood: "excited", act: "spin" }],
    hint: "Tap a movement.",
    after: [
      { say: "See how long the journey is? Ten chapters on the road.", mood: "cheeky", act: "tilt" },
      { say: "Luke takes his time. Let’s look inside.", mood: "thinking", act: "nod" },
    ],
  },
  architecture: {
    before: [{ say: "Let’s open each movement.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "Temple to temple, with a long road in the middle.", mood: "moved", act: "nod" }],
  },
  pivot: {
    before: [
      { say: "One verse changes the whole direction of Luke.", mood: "curious", act: "tilt" },
      { say: "Slide the bookmark and watch the story set off.", mood: "excited", act: "hop" },
    ],
    hint: "Drag the bookmark, or use the arrow keys.",
    after: [{ say: "From here on, every step is toward Jerusalem.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Luke weaves a few threads through every part of the book.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "Outsiders, prayer and joy. That’s Luke’s heartbeat.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Luke, at a glance!", button: "Finish" },
});
