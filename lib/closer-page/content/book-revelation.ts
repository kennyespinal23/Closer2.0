import { BookOverviewExperience } from "../lesson/bookOverview";
import type { Book } from "../lesson/types";

/* Bible Books: "Discover Revelation" (Revelation 1–22).
   - Shape: visions, not a timeline. The six groupings are one common outline; the visions may overlap or repeat,
     and the screen says readers disagree.
   - Author: the text names John, on Patmos (1:1, 1:4, 1:9). Early tradition says the apostle John; since ancient
     times some have thought it was another John. Labelled as tradition.
   - Four ways of reading it (preterist, historicist, futurist, idealist) are described side by side, none endorsed.
     No claims about when or how anything in it will happen.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const revelationBook: Book = {
  name: "Revelation",
  title: "The Revelation to John",
  kicker: "The Book of",
  genre: "apocalyptic",
  shape: "visions",
  chapterLengths: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21],
  divisions: "These six parts are one common way to group the visions. Revelation gives no headings, and its visions may repeat or overlap rather than run in order. Readers disagree about that too.",
  sections: [
    {
      id: "vision", title: "A vision of Jesus", chapters: "Revelation 1", from: [1, 1], to: [1, 20],
      gist: "John, on the island of Patmos, sees the risen Jesus.",
      summary: "John greets seven churches in Asia, then sees the risen Jesus standing among seven golden lampstands, and is told to write what he sees.",
      event: { title: "The risen Jesus among the lampstands", ref: "1:12–18" },
      verse: v("I was dead, and behold, I am alive forever and ever.", "Revelation 1:18"),
      role: "Everything after flows from this: the one who died and lives is the one speaking.",
      say: "“Don’t be afraid.” That’s how it begins.",
    },
    {
      id: "letters", title: "Letters to seven churches", chapters: "Revelation 2–3", from: [2, 1], to: [3, 22],
      gist: "Seven short letters to real churches.",
      summary: "Each church in the Roman province of Asia gets praise, warning or both, and a promise “to him who overcomes.”",
      event: { title: "The letter to Laodicea", ref: "3:14–22" },
      verse: v("Behold, I stand at the door and knock. If anyone hears my voice and opens the door, then I will come in to him, and will dine with him, and he with me.", "Revelation 3:20"),
      role: "It grounds the visions in real congregations facing real pressures.",
      say: "Seven letters, each one personal.",
    },
    {
      id: "throne", title: "The throne room", chapters: "Revelation 4–5", from: [4, 1], to: [5, 14],
      gist: "Worship around God’s throne, and a Lamb who was slain.",
      summary: "John is shown heaven’s worship around God’s throne. No one can open a sealed scroll, until a Lamb that had been slain takes it.",
      event: { title: "The Lamb takes the scroll", ref: "5:1–10" },
      verse: v("Worthy is the Lamb who has been killed to receive the power, wealth, wisdom, strength, honor, glory, and blessing!", "Revelation 5:12"),
      role: "Many readers see this as the centre of the book: before anything happens on earth, John sees who is on the throne.",
      say: "This might be the heart of the whole book.",
    },
    {
      id: "sevens", title: "Seals, trumpets and bowls", chapters: "Revelation 6–16", from: [6, 1], to: [16, 21],
      gist: "Three series of seven: judgment and rescue, in waves.",
      summary: "Seven seals, seven trumpets and seven bowls bring judgment on evil, with pauses that show God’s people kept safe, and visions of a dragon and beasts in between (12–13).",
      event: { title: "A great multitude no one could count", ref: "7:9–10" },
      verse: v("a great multitude, which no man could count, out of every nation and of all tribes, peoples, and languages, standing before the throne and before the Lamb", "Revelation 7:9"),
      role: "Readers differ on what these refer to, but the pattern repeats: evil is judged, and God keeps his people.",
      say: "Lots of sevens. Watch for the pauses between them.",
    },
    {
      id: "babylon", title: "Babylon falls", chapters: "Revelation 17–19", from: [17, 1], to: [19, 21],
      gist: "The great city falls, and heaven sings.",
      summary: "“Babylon the great” falls, mourned by kings and merchants while heaven celebrates. Then a rider on a white horse appears, called Faithful and True (19:11).",
      event: { title: "Hallelujah in heaven", ref: "19:1–8" },
      verse: v("Hallelujah! For the Lord our God, the Almighty, reigns!", "Revelation 19:6"),
      role: "The powers that opposed God and his people are brought down.",
      say: "Who is “Babylon”? Readers have suggested many answers.",
    },
    {
      id: "new", title: "All things new", chapters: "Revelation 20–22", from: [20, 1], to: [22, 21],
      gist: "A new heaven and earth, and God living with his people.",
      summary: "After the final defeat of evil, John sees a new heaven and a new earth, the New Jerusalem, and the river of the water of life. The book ends with a prayer: come, Lord Jesus.",
      event: { title: "The new heaven and earth", ref: "21:1–5" },
      verse: v("He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more.", "Revelation 21:4"),
      role: "Many readers notice it echoes Genesis: the tree of life appears again (22:2).",
      say: "It ends with tears wiped away. Every one.",
    },
  ],
  threads: [
    {
      id: "lamb", title: "The Lamb", say: "Watch for the Lamb. He’s everywhere!",
      stops: [
        { at: [5, 6], label: "A Lamb, slain", note: "John hears of a Lion (5:5), turns, and sees a Lamb that had been slain. It becomes the book’s central picture of Jesus.", verse: v("a Lamb standing, as though it had been slain", "Revelation 5:6") },
        { at: [5, 12], label: "Worthy", note: "All of heaven praises the Lamb.", verse: v("Worthy is the Lamb who has been killed to receive the power, wealth, wisdom, strength, honor, glory, and blessing!", "Revelation 5:12") },
        { at: [7, 17], label: "The shepherd Lamb", note: "The Lamb turns out to be a shepherd too.", verse: v("for the Lamb who is in the middle of the throne shepherds them, and leads them to springs of life-giving waters.", "Revelation 7:17") },
        { at: [17, 14], label: "The Lamb overcomes", note: "The one who looked weakest wins.", verse: v("the Lamb will overcome them, for he is Lord of lords, and King of kings", "Revelation 17:14") },
        { at: [19, 7], label: "The wedding", note: "The story turns into a celebration.", verse: v("For the marriage of the Lamb has come, and his wife has made herself ready.", "Revelation 19:7") },
        { at: [22, 1], label: "The river", note: "At the very end, life flows from the throne of God and of the Lamb.", verse: v("He showed me a river of water of life, clear as crystal, proceeding out of the throne of God and of the Lamb", "Revelation 22:1") },
      ],
    },
    {
      id: "worship", title: "Worship around the throne", say: "Revelation is full of songs.",
      stops: [
        { at: [4, 8], label: "Holy, holy, holy", note: "The living creatures never stop.", verse: v("Holy, holy, holy is the Lord God, the Almighty, who was and who is and who is to come!", "Revelation 4:8") },
        { at: [4, 11], label: "Worthy, Creator", note: "The elders praise God for making all things.", verse: v("Worthy are you, our Lord and God, the Holy One, to receive the glory, the honor, and the power, for you created all things", "Revelation 4:11") },
        { at: [7, 10], label: "Every nation", note: "A crowd from every people sings together.", verse: v("Salvation be to our God, who sits on the throne, and to the Lamb!", "Revelation 7:10") },
        { at: [11, 15], label: "He will reign", note: "Loud voices in heaven at the seventh trumpet.", verse: v("The kingdom of the world has become the Kingdom of our Lord, and of his Christ. He will reign forever and ever!", "Revelation 11:15") },
        { at: [15, 3], label: "The song of Moses", note: "An old song of rescue, sung again.", verse: v("Great and marvelous are your works, Lord God, the Almighty! Righteous and true are your ways, you King of the nations.", "Revelation 15:3") },
        { at: [19, 6], label: "Hallelujah", note: "A sound like thunder and many waters.", verse: v("Hallelujah! For the Lord our God, the Almighty, reigns!", "Revelation 19:6") },
      ],
    },
    {
      id: "hope", title: "All things new", say: "This one’s full of hope.",
      stops: [
        { at: [1, 17], label: "Don’t be afraid", note: "The first words Jesus speaks to John in the vision.", verse: v("Don’t be afraid. I am the first and the last, and the Living one.", "Revelation 1:17–18") },
        { at: [2, 7], label: "The tree of life", note: "A promise to the church in Ephesus.", verse: v("To him who overcomes I will give to eat from the tree of life, which is in the Paradise of my God.", "Revelation 2:7") },
        { at: [12, 11], label: "They overcame", note: "God’s people win by the Lamb and their testimony, not by force.", verse: v("They overcame him because of the Lamb’s blood, and because of the word of their testimony.", "Revelation 12:11") },
        { at: [21, 3], label: "God with us", note: "The goal of it all: God living with his people.", verse: v("Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God.", "Revelation 21:3") },
        { at: [21, 4], label: "Every tear", note: "Death, mourning and pain are gone.", verse: v("He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more.", "Revelation 21:4") },
        { at: [21, 5], label: "Everything new", note: "Not new things, but all things made new.", verse: v("Behold, I am making all things new.", "Revelation 21:5") },
      ],
    },
  ],
  summary: {
    overview: "A book of visions, written to seven churches, that shows worship around God’s throne, the victory of the Lamb, and God making all things new.",
    keys: ["Revelation 1:17–18", "3:20", "5:6–12", "7:9–10", "21:1–5", "22:13"],
  },
};

export const revelationOverview = BookOverviewExperience(revelationBook, {
  id: "book-revelation",
  title: "Discover Revelation",
  subtitle: "Visions, not a timeline",
  scripture: "Revelation 1–22",
  minutes: 6,
  cover: {
    before: [
      { say: "The last book of the Bible.", mood: "curious", act: "tilt" },
      { say: "Strange, bright, and full of hope.", mood: "excited", act: "hop" },
      { say: "Let’s see how it fits together.", mood: "happy", act: "nod" },
    ],
    open: "Brave enough? Open it!",
    after: [{ say: "Don’t worry, we’ll take it slowly. Big picture first.", mood: "cheeky", act: "nod" }],
  },
  facts: {
    before: [{ say: "First: what kind of book is this?", mood: "curious", act: "tilt" }],
    facts: [
      { title: "What kind of book?", tag: "text", body: "Three at once: a revelation (in Greek, an “apocalypse”), a prophecy (1:3), and a letter to seven churches (1:4). Most of it is visions.", verse: v("This is the Revelation of Jesus Christ, which God gave him to show to his servants the things which must happen soon", "Revelation 1:1"), say: "A vision, a prophecy and a letter. Wow." },
      { title: "Who wrote it?", tag: "tradition", body: "The writer calls himself John, on the island of Patmos. Early tradition identified him as the apostle John; since ancient times some have thought it was a different John. Scholars still differ.", verse: v("I John, your brother and partner with you in the oppression, Kingdom, and perseverance in Christ Jesus, was on the isle that is called Patmos", "Revelation 1:9"), say: "The name’s in the text. Which John is tradition." },
      { title: "Why all the symbols?", tag: "text", body: "It speaks in pictures: lampstands, stars, beasts, numbers. Sometimes the text explains its own symbols, like the seven lampstands.", verse: v("The seven stars are the angels of the seven assemblies. The seven lamp stands are seven assemblies.", "Revelation 1:20"), say: "Sometimes it even decodes itself!" },
      { title: "How is it read?", tag: "readings", body: "Christians read it in several ways: mostly about the first century (preterist), as a picture of church history (historicist), as events still to come (futurist), or as timeless truths about good and evil (idealist). Many combine them.", say: "Four ways in. We won’t pick one for you." },
    ],
    after: [{ say: "Now let’s open it up.", mood: "excited", act: "hop" }],
  },
  unfold: {
    before: [{ say: "Revelation isn’t a timeline. It’s a series of visions.", mood: "excited", act: "spin" }],
    hint: "Tap a vision.",
    after: [{ say: "Look how much room the sevens take. Six to sixteen!", mood: "surprised", act: "react" }],
  },
  architecture: {
    before: [{ say: "Let’s step inside each vision.", mood: "curious" }],
    hint: "Open each one.",
    after: [{ say: "From a lonely island to a new creation. What a journey.", mood: "moved", act: "nod" }],
  },
  threads: {
    before: [{ say: "Some pictures keep coming back. Let’s follow them.", mood: "thinking" }],
    hint: "Pick a theme and follow it.",
    after: [{ say: "However you read it, the ending is hope.", mood: "happy", act: "nod" }],
  },
  summary: { say: "That’s Revelation, at a glance!", button: "Finish" },
});
