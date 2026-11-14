import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 004: "What Happened to the Ten Lost Tribes?" Status: partly resolved.
   What the case rests on, and how it's kept honest:
   - Scripture (World English Bible, word for word): 1 Kings 12:20; 2 Kings 15:29; 17:6, 18, 24; 2 Chronicles
     30:1, 10–11; 34:9; Luke 2:36 (James 1:1 is cited, not quoted).
   - History outside the Bible: Assyrian royal inscriptions of Sargon II claim the deportation of about 27,000 people
     (27,290 is the figure usually cited) from Samaria. Tiglath-pileser III's campaigns are also recorded.
   - "Partly resolved": the deportations and the resettlement are documented; that many northerners stayed, moved
     south or were absorbed is the common scholarly view; where exiled groups ended up after that is unknown.
   - Later claims of descent are labelled tradition and unverified. The idea that Jerusalem's late-8th-century growth
     came partly from northern refugees is shown as an archaeological inference, debated. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

const k1220 = v("When all Israel heard that Jeroboam had returned, they sent and called him to the congregation, and made him king over all Israel. There was no one who followed David’s house, except for the tribe of Judah only.", "1 Kings 12:20");
const k1529 = v("In the days of Pekah king of Israel, Tiglath Pileser king of Assyria came and took Ijon, Abel Beth Maacah, Janoah, Kedesh, Hazor, Gilead, and Galilee, all the land of Naphtali; and he carried them captive to Assyria.", "2 Kings 15:29");
const k176 = v("In the ninth year of Hoshea the king of Assyria took Samaria, and carried Israel away to Assyria, and placed them in Halah, and on the Habor, the river of Gozan, and in the cities of the Medes.", "2 Kings 17:6");
const k1724 = v("The king of Assyria brought men from Babylon, from Cuthah, from Avva, and from Hamath and Sepharvaim, and placed them in the cities of Samaria instead of the children of Israel; and they possessed Samaria, and lived in its cities.", "2 Kings 17:24");
const c3011 = v("Nevertheless some men of Asher and Manasseh and of Zebulun humbled themselves, and came to Jerusalem.", "2 Chronicles 30:11");
const c349 = v("They came to Hilkiah the high priest, and delivered the money that was brought into God’s house, which the Levites, the keepers of the threshold, had gathered from the hands of Manasseh, Ephraim, of all the remnant of Israel, of all Judah and Benjamin, and of the inhabitants of Jerusalem.", "2 Chronicles 34:9");
const lk236 = v("There was one Anna, a prophetess, the daughter of Phanuel, of the tribe of Asher", "Luke 2:36");

export const mysteryTribes = {
  id: "mystery-tribes",
  title: "What Happened to the Ten Lost Tribes?",
  subtitle: "A kingdom carried away, and the people who weren’t",
  kind: "Bible mystery",
  scripture: "2 Kings 17 · 2 Chronicles 30 · Luke 2:36",
  minutes: 6,
  theme: "copper",
  case: { id: "004", status: "Partly resolved" },
  sources: [
    { title: "Inscriptions of Sargon II (e.g. his annals from Khorsabad)", publisher: "Assyrian royal records, late 8th century BC" },
    { title: "Inscriptions of Tiglath-pileser III", publisher: "Assyrian royal records" },
    { title: "World English Bible", publisher: "Public domain" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Israel had twelve tribes. Ten of them formed a northern kingdom.", mood: "thinking" },
        { say: "Then Assyria came. And the ten seem to vanish.", mood: "surprised", act: "react" },
        { say: "Did they really?", mood: "cheeky", act: "stare" },
      ],
      open: "This one’s partly cracked. Open it!",
      title: "What Happened to the Ten Lost Tribes?",
      refs: ["1 Kings 12", "2 Kings 17", "2 Chronicles 30", "Luke 2:36"],
      after: [{ say: "Some of this case is solved. Some isn’t. Let’s find the line between.", mood: "excited", act: "hop" }],
    },
    // 2. The timeline
    {
      kind: "caseTimeline",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Four moments. Put them in the order you think they happened.", mood: "curious", act: "tilt" }],
      hint: "Earliest first. Tap Read to check any card.",
      cards: [
        {
          id: "split", when: "c. 930 BC", title: "The kingdom splits in two", basis: "stated",
          body: "After Solomon, the northern tribes make Jeroboam king. Only Judah (with Benjamin) stays with David’s line.",
          exhibit: { label: "1 Kings 12:20", verses: [k1220] },
        },
        {
          id: "first", when: "c. 732 BC", title: "Assyria takes Galilee and Naphtali", basis: "stated",
          body: "Tiglath-pileser III carries off people from the north and east, ten years before the end.",
          exhibit: { label: "2 Kings 15:29", verses: [k1529] },
        },
        {
          id: "fall", when: "722/721 BC", title: "Samaria falls; Israel carried away", basis: "stated",
          body: "Assyria takes the capital and deports people to distant regions, then settles other peoples in their towns.",
          exhibit: { label: "2 Kings 17:6, 24", verses: [k176, k1724], note: "Sargon II’s own inscriptions claim he deported about 27,000 people from Samaria (27,290 is the figure usually cited)." },
        },
        {
          id: "invite", when: "Soon after", title: "Hezekiah invites the north to Passover", basis: "stated",
          body: "Messengers go through Ephraim, Manasseh and Zebulun. Many mock them; some come to Jerusalem.",
          exhibit: { label: "2 Chronicles 30:1, 11", verses: [v("Hezekiah sent to all Israel and Judah, and wrote letters also to Ephraim and Manasseh, that they should come to Yahweh’s house at Jerusalem, to keep the Passover to Yahweh, the God of Israel.", "2 Chronicles 30:1"), c3011], note: "The order of this invitation and the fall of Samaria is debated; Hezekiah’s reign is dated differently by different historians." },
        },
      ],
      inOrder: "Exactly. And look: people from the north are still around after the fall.",
      outOfOrder: "Close! Here’s the order. And look: people from the north are still around after the fall.",
      after: [
        { say: "The northern kingdom ended. But did every northerner leave?", mood: "thinking" },
        { say: "Let’s pin up the clues.", mood: "excited", act: "hop" },
      ],
    },
    // 3. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [{ say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" }],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "deport", title: "Israel carried to Assyria", ref: "2 Kings 17:6", exhibit: { label: "2 Kings 17:6", verses: [k176] } },
        { id: "sargon", title: "Sargon: about 27,000 deported", ref: "Assyrian inscriptions", exhibit: { label: "Sargon II’s inscriptions", note: "Assyrian royal inscriptions credit Sargon II with deporting about 27,000 people (27,290 is the figure usually cited) from Samaria. Royal inscriptions can boast, but the figure is a real record." } },
        { id: "settle", title: "New peoples settle Samaria", ref: "2 Kings 17:24", exhibit: { label: "2 Kings 17:24", verses: [k1724] } },
        { id: "came", title: "Some northerners came south", ref: "2 Chronicles 30:11", exhibit: { label: "2 Chronicles 30:11", verses: [c3011] } },
        { id: "remnant", title: "“The remnant of Israel” gives", ref: "2 Chronicles 34:9", exhibit: { label: "2 Chronicles 34:9", verses: [c349] } },
        { id: "anna", title: "Anna, of the tribe of Asher", ref: "Luke 2:36", exhibit: { label: "Luke 2:36", verses: [lk236] } },
      ],
      links: [
        {
          a: "deport", b: "sargon", label: "Two records, one event", strength: "supported",
          say: "The Bible and Assyria tell the same story!",
          body: "2 Kings says Assyria took Samaria and carried Israel away. Sargon II’s inscriptions independently claim the deportation. That much is well supported.",
        },
        {
          a: "sargon", b: "remnant", label: "Not everyone left", strength: "inference",
          say: "27,000 is a lot. But was it everyone?",
          body: "The northern kingdom likely had far more people than 27,000, so many historians conclude most stayed. A century later, Chronicles still speaks of “the remnant of Israel” in Manasseh and Ephraim.",
        },
        {
          a: "came", b: "anna", label: "A northern tribe, centuries later", strength: "stated",
          say: "Asher! Still remembered in Jesus’ day.",
          body: "Some from Asher came to Hezekiah’s Passover, and centuries later Luke names Anna “of the tribe of Asher.” At least some families kept their northern tribal identity.",
        },
        {
          a: "deport", b: "settle", label: "An exchange of peoples", strength: "stated",
          say: "People taken out, people brought in.",
          body: "Assyria moved conquered peoples around on purpose. Israelites went east; other peoples were settled in Samaria. Over time, those who stayed and those brought in mixed.",
        },
        {
          a: "came", b: "remnant", label: "Moving south", strength: "inference",
          say: "Northerners worshipping in Jerusalem.",
          body: "Chronicles shows northerners joining worship in Jerusalem. Many archaeologists also think Jerusalem grew sharply in the late 8th century BC, partly from refugees from the north. That’s a debated inference, not a certainty.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "So the tribes weren’t simply erased. Let’s see what people have proposed.", mood: "thinking", act: "nod" }],
    },
    // 4. Explore the theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Here’s what people have said happened next.", mood: "thinking" }],
      theories: [
        {
          title: "Absorbed, scattered and partly merged with Judah", kind: "scholarship", strength: "supported",
          origin: "The common view among historians, from the Bible, Assyrian records and archaeology.",
          body: "Some were deported and, over generations, blended into the peoples around them. Many stayed in the land and mixed with newcomers. Some moved south and became part of Judah, which later Jews included.",
          against: "Exactly how many went where can’t be measured, and no record follows the exiled groups for long.",
          say: "The best-supported answer, with fuzzy edges.",
        },
        {
          title: "Their descendants are among the Jewish people", kind: "scripture", strength: "inference",
          origin: "Chronicles’ northerners in Judah; Anna of Asher (Luke 2:36); James writing “to the twelve tribes” (James 1:1).",
          body: "Families from the northern tribes were folded into Judah’s story, so “Israel” never lost all ten.",
          against: "James’s “twelve tribes” may be a way of describing all God’s people, not a census.",
          say: "Some never left the story at all.",
        },
        {
          title: "Communities that trace their descent to a lost tribe", kind: "tradition", strength: "unverified",
          origin: "Traditions held by several communities, in Africa and Asia, among others.",
          body: "Various groups have traditions of descending from one of the northern tribes, such as Dan or Manasseh. These are meaningful to the communities that hold them.",
          against: "For most, there’s no historical record linking them to the 8th-century exile, so they can’t be confirmed.",
          say: "Held sincerely. Hard to verify.",
        },
        {
          title: "A whole nation of the tribes, hidden somewhere", kind: "modern", strength: "unverified",
          origin: "Popular legends and later movements.",
          body: "Stories of the ten tribes living intact somewhere far away, or of a particular modern nation descending from them.",
          against: "Historians find no support for these claims.",
          say: "Great legends, no historical support.",
        },
      ],
      caveat: "Only the first is well supported. Even then, where most exiled families ended up is lost to the record.",
      after: [{ say: "Let’s rebuild what we can, and leave honest gaps.", mood: "excited", act: "nod" }],
    },
    // 5. Reconstruct the case
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "This case is partly resolved, so more of it fills in.", mood: "thinking" },
        { say: "But some gaps stay open. No guessing to fill them.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of evidence.",
      slots: [
        { id: "split", when: "c. 930 BC", text: "The kingdom splits; ten tribes in the north", ref: "1 Kings 12" },
        { id: "fall", when: "732–720 BC", text: "Assyria deports many northerners", ref: "2 Kings 15, 17 · Assyrian records" },
        { id: "settle", when: "After 722 BC", text: "Other peoples settled in Samaria", ref: "2 Kings 17:24" },
        { id: "stay", when: "After 722 BC", text: "Many northerners remain; some join Judah", ref: "2 Chronicles 30, 34" },
        { gap: "Where the exiled families went next", say: "No record follows them. We leave it open." },
        { id: "anna", when: "1st century AD", text: "Anna is still known as “of Asher”", ref: "Luke 2:36" },
      ],
      theory: { text: "A hidden nation of the tribes?", say: "That can sit beside the gap as a legend. It doesn’t fill it." },
      after: [{ say: "Five pieces, one honest gap. Partly resolved.", mood: "moved", act: "nod" }],
    },
    // 6. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "What Happened to the Ten Lost Tribes?",
      scripture: [
        "The northern kingdom of Israel was conquered by Assyria and many were carried away (2 Kings 17).",
        "Assyria settled other peoples in Samaria (2 Kings 17:24).",
        "Some northerners joined Judah’s worship (2 Chronicles 30; 34:9), and Anna was “of the tribe of Asher” (Luke 2:36).",
      ],
      uncertain: [
        "Where the deported families ended up, generations later.",
        "How many people stayed in the land.",
        "Whether any later community’s tradition of descent is historically linked to them.",
      ],
      proposed: [
        "Absorbed, scattered and partly merged with Judah (the common historical view).",
        "Descendants within the Jewish people (supported by biblical hints).",
        "Communities tracing descent to a tribe (traditions, unverified).",
        "A hidden nation of the tribes (legend; no historical support).",
      ],
      note: "“Lost” is partly a myth: many northerners were never lost at all. What’s truly unknown is the fate of those carried far away.",
      refs: ["1 Kings 12:20", "2 Kings 15:29", "2 Kings 17:6–24", "2 Chronicles 30:1–11", "2 Chronicles 34:9", "Luke 2:36"],
      sources: [
        { title: "Inscriptions of Sargon II", publisher: "Assyrian royal records, late 8th century BC" },
        { title: "Inscriptions of Tiglath-pileser III", publisher: "Assyrian royal records" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
