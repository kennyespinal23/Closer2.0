import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 001: "Where Did the Ark of the Covenant Go?" Status: unresolved.
   What the case rests on, and how it's kept honest:
   - Scripture (World English Bible, word for word): Exodus 25:10–22; 1 Kings 8:6–9; 2 Chronicles 35:3;
     2 Kings 24:13; 2 Kings 25:9, 13–17; 2 Chronicles 36:18; Jeremiah 52:13, 17–19; Ezra 1:7–11.
   - History outside the Bible: the Babylonian "Jerusalem Chronicle" tablet (British Museum, BM 21946) records
     Nebuchadnezzar capturing "the city of Judah" in 597 BC. Nothing outside the Bible mentions the Ark's fate.
   - Later traditions, labelled as such: 2 Maccabees 2:4–8 (Jeremiah hides it on the mountain); the Mishnah
     (Shekalim 6:1–2) and Babylonian Talmud (Yoma 52b–54a), where rabbis disagree, some saying it went to Babylon,
     some that it was hidden in its place, one naming Josiah; the Kebra Nagast and the Ethiopian Orthodox
     claim at Aksum, never independently examined.
   - No present-day location is presented as verified. The reconstruction drawing is labelled as one, and the
     cherubim's look is a guess, since the text doesn't describe them.
   Dates: Solomon's temple c. 960 BC; Josiah's Passover in his 18th year, c. 622 BC; the temple burned in
   587 or 586 BC (historians differ by a year). */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const mysteryArk = {
  id: "mystery-ark",
  title: "Where Did the Ark of the Covenant Go?",
  subtitle: "An object that vanished from the record",
  kind: "Bible mystery",
  scripture: "Exodus 25 · 1 Kings 8 · 2 Chronicles 35 · 2 Kings 25 · Jeremiah 52",
  minutes: 5,
  theme: "copper",
  case: { id: "001", status: "Unresolved" },
  sources: [
    { title: "Chronicle of the early years of Nebuchadnezzar II (the Jerusalem Chronicle)", publisher: "British Museum, BM 21946" },
    { title: "2 Maccabees 2:4–8", publisher: "In Catholic and Orthodox Bibles; not in Jewish or Protestant ones" },
    { title: "Mishnah Shekalim 6:1–2 · Babylonian Talmud Yoma 52b–54a", publisher: "Rabbinic literature, c. AD 200–500" },
    { title: "Kebra Nagast (The Glory of the Kings)", publisher: "Ethiopian text, compiled around the 14th century" },
    { title: "World English Bible", publisher: "Public domain" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "One of the most important objects in ancient Israel disappeared from the historical record.", mood: "curious", act: "tilt" },
        { say: "The Ark of the Covenant.", mood: "surprised", act: "react" },
        { say: "So where did it go?", mood: "cheeky", act: "stare" },
      ],
      open: "Here’s the file. Open it up!",
      title: "Where Did the Ark of the Covenant Go?",
      refs: ["Exodus 25", "1 Kings 8", "2 Chronicles 35", "2 Kings 25", "Jeremiah 52"],
      after: [{ say: "Let’s look at the evidence. All of it, even the bits that don’t fit neatly.", mood: "excited", act: "hop" }],
    },
    // 2. Examine the object
    {
      kind: "inspect",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "First, what are we even looking for? Exodus 25 gives the instructions.", mood: "thinking" },
        { say: "Drag the lens over the drawing. Or tap a detail below.", mood: "excited", act: "hop" },
      ],
      art: "ark",
      label: "Exhibit A · reconstruction",
      caption: "Drawn from Exodus 25:10–22. Its exact look is unknown.",
      hint: "Move the lens. What do you notice?",
      features: [
        {
          id: "chest", name: "Chest", x: 0.62, y: 0.62, say: "A box of acacia wood, covered in gold.",
          body: "Wood overlaid with pure gold, inside and out. About 1.1 m long, 0.7 m wide and 0.7 m high, if a cubit was about 45 cm.",
          verse: v("Its length shall be two and a half cubits, its width a cubit and a half, and a cubit and a half its height.", "Exodus 25:10"),
          note: "Inside went “the testimony” (Exodus 25:16): the stone tablets, according to 1 Kings 8:9.",
        },
        {
          id: "poles", name: "Poles", x: 0.08, y: 0.79, say: "Look! The poles never come out.",
          body: "Gold-covered poles through four gold rings, so it could be carried without being touched. They were to stay in the rings.",
          verse: v("The poles shall be in the rings of the ark. They shall not be taken from it.", "Exodus 25:15"),
        },
        {
          id: "seat", name: "Mercy seat", x: 0.5, y: 0.42, say: "The lid had a name of its own.",
          body: "A slab of pure gold the size of the chest, set on top. Some translations call it the “atonement cover”.",
          verse: v("You shall make a mercy seat of pure gold. Two and a half cubits shall be its length, and a cubit and a half its width.", "Exodus 25:17"),
        },
        {
          id: "cherubim", name: "Cherubim", x: 0.38, y: 0.22, say: "Two of them, facing each other.",
          body: "Two cherubim of hammered gold, of one piece with the lid, wings spread upward over it.",
          verse: v("The cherubim shall spread out their wings upward, covering the mercy seat with their wings, with their faces toward one another.", "Exodus 25:20"),
          note: "The text doesn’t say what cherubim looked like. Their shape in this drawing is a guess.",
        },
      ],
      after: [
        { say: "Gold, heavy, and made to be carried. Not something you’d easily lose.", mood: "thinking", act: "nod" },
        { say: "And yet, at some point, it drops out of the story.", mood: "surprised", act: "react" },
      ],
    },
    // 3. Investigate the timeline
    {
      kind: "caseTimeline",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Four pieces of evidence. Put them in the order you think they happened.", mood: "curious", act: "tilt" }],
      hint: "Earliest first. Tap Read to check any card.",
      cards: [
        {
          id: "solomon", when: "c. 960 BC", title: "The Ark goes into Solomon’s Temple", basis: "stated",
          body: "Priests carry it into the inner sanctuary, under the cherubim’s wings.",
          exhibit: { label: "1 Kings 8:6", verses: [v("The priests brought in the ark of Yahweh’s covenant to its place, into the inner sanctuary of the house, to the most holy place, even under the cherubim’s wings.", "1 Kings 8:6")] },
        },
        {
          id: "josiah", when: "c. 622 BC", title: "King Josiah tells the Levites to put the Ark in the temple", basis: "stated",
          body: "At Josiah’s great Passover. The last time the Bible’s history books mention the Ark.",
          exhibit: { label: "2 Chronicles 35:3", verses: [v("Put the holy ark in the house which Solomon the son of David king of Israel built. It will no longer be a burden on your shoulders.", "2 Chronicles 35:3")] },
        },
        {
          id: "babylon", when: "587/586 BC", title: "Babylon burns the temple and carries off its treasures", basis: "stated",
          body: "Two accounts list what was taken. Neither list names the Ark.",
          exhibit: {
            label: "2 Kings 25 · Jeremiah 52",
            verses: [
              v("He burned Yahweh’s house, the king’s house, and all the houses of Jerusalem, even every great house, he burned with fire.", "2 Kings 25:9"),
              v("They took away the pots, the shovels, the snuffers, the spoons, and all the vessels of brass with which they ministered.", "2 Kings 25:14"),
            ],
            note: "Jeremiah 52:13–23 tells the same events with a similar list. The Ark isn’t in either one.",
          },
        },
        {
          id: "silence", when: "Ever since", title: "No record says where the Ark went", basis: "inference",
          body: "No later biblical book describes its fate or its return. That silence is a clue, not a conclusion.",
          exhibit: {
            label: "Ezra 1:7–11",
            verses: [v("Also Cyrus the king brought out the vessels of Yahweh’s house, which Nebuchadnezzar had brought out of Jerusalem, and had put in the house of his gods", "Ezra 1:7")],
            note: "Ezra counts what came back from Babylon: 5,400 gold and silver vessels. The Ark isn’t mentioned. This card is an inference from what the texts don’t say.",
          },
        },
      ],
      inOrder: "Spot on. Watch the gap between Josiah and the fire.",
      outOfOrder: "Close! Here’s how the dates line up. Watch the gap between Josiah and the fire.",
      after: [
        { say: "The last mention is around 622 BC. The temple burns about 35 years later.", mood: "thinking" },
        { say: "Somewhere in or after that window, the Ark leaves the story. Let’s pin up the clues.", mood: "excited", act: "hop" },
      ],
    },
    // 4. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "This is the fun part. The evidence board!", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another, to see if a thread connects them. Not every pair does.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "temple", title: "Placed in the inner sanctuary", ref: "1 Kings 8:6", exhibit: { label: "1 Kings 8:6", verses: [v("The priests brought in the ark of Yahweh’s covenant to its place, into the inner sanctuary of the house, to the most holy place, even under the cherubim’s wings.", "1 Kings 8:6")] } },
        { id: "josiah", title: "Josiah: “Put the holy ark in the house”", ref: "2 Chronicles 35:3", exhibit: { label: "2 Chronicles 35:3", verses: [v("Put the holy ark in the house which Solomon the son of David king of Israel built. It will no longer be a burden on your shoulders.", "2 Chronicles 35:3")] } },
        { id: "today", title: "The poles are there “to this day”", ref: "1 Kings 8:8", exhibit: { label: "1 Kings 8:8", verses: [v("The poles were so long that the ends of the poles were seen from the holy place before the inner sanctuary; but they were not seen outside. They are there to this day.", "1 Kings 8:8")] } },
        { id: "gold", title: "Solomon’s gold vessels cut up", ref: "597 BC · 2 Kings 24", exhibit: { label: "2 Kings 24:13", verses: [v("He carried out from there all the treasures of Yahweh’s house, and the treasures of the king’s house, and cut in pieces all the vessels of gold, which Solomon king of Israel had made in Yahweh’s temple, as Yahweh had said.", "2 Kings 24:13")] } },
        { id: "fire", title: "Temple burned, vessels taken", ref: "587/586 BC · 2 Kings 25", exhibit: { label: "2 Kings 25:9 · 2 Chronicles 36:18", verses: [v("He burned Yahweh’s house, the king’s house, and all the houses of Jerusalem, even every great house, he burned with fire.", "2 Kings 25:9"), v("All the vessels of God’s house, great and small, and the treasures of Yahweh’s house, and the treasures of the king, and of his princes, all these he brought to Babylon.", "2 Chronicles 36:18")] } },
        { id: "cyrus", title: "Cyrus sends 5,400 vessels home", ref: "Ezra 1:7–11", exhibit: { label: "Ezra 1:11", verses: [v("All the vessels of gold and of silver were five thousand four hundred. Sheshbazzar brought all these up when the captives were brought up from Babylon to Jerusalem.", "Ezra 1:11")], note: "The list in Ezra 1:9–10 counts platters, knives and bowls. No Ark." } },
      ],
      links: [
        {
          a: "temple", b: "today", label: "Same scene, a later voice", strength: "inference",
          say: "“To this day”! Someone was still writing while it was there.",
          body: "That phrase belongs to the writer’s own time, or to an older source they used. Some scholars think it was carried over from a record written while the temple still stood. It shows the Ark stayed put for a while; it doesn’t say how long.",
        },
        {
          a: "temple", b: "josiah", label: "Back in its place?", strength: "inference",
          say: "Wait. Why would Josiah need to put it back?",
          body: "Centuries after Solomon, Josiah tells the Levites to put the Ark in the temple and stop carrying it. Readers differ on why: maybe an earlier king had moved it out, maybe the words are more about the Levites’ duties than the Ark’s location.",
        },
        {
          a: "gold", b: "fire", label: "More than one attack", strength: "stated",
          say: "Babylon came more than once!",
          body: "In 597 BC treasures were carried off and gold vessels cut up. About ten years later the temple was burned. (Daniel 1:2 mentions vessels taken even earlier.) The Ark could have been lost in any of these, or before them all. The text doesn’t say.",
        },
        {
          a: "fire", b: "cyrus", label: "Taken away, sent back, never named", strength: "inference",
          say: "All those vessels, and no Ark on either list.",
          body: "2 Chronicles 36:18 says all the vessels of God’s house went to Babylon. Ezra counts what Cyrus sent back. The Ark is named in neither. That’s an argument from silence: worth noticing, not proof.",
        },
        {
          a: "josiah", b: "fire", label: "The quiet years", strength: "inference",
          say: "There’s our window.",
          body: "Josiah’s Passover was around 622 BC; the temple burned in 587 or 586 BC. In the roughly 35 years between, the Bible never mentions the Ark. If it was still there in Josiah’s day, whatever happened, happened after that.",
        },
        {
          a: "gold", b: "temple", label: "Whose gold?", strength: "inference",
          say: "Ooh, look closely at who made those vessels.",
          body: "2 Kings 24:13 says the gold vessels “which Solomon … had made” were cut up. The Ark was older than Solomon, made in Moses’ day, so this verse doesn’t obviously include it. It doesn’t rule it out either.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Some threads are strong. Some are just interesting. Let’s sort what’s solid from what isn’t.", mood: "thinking", act: "nod" }],
    },
    // 5. Weigh the evidence
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Here are five claims people make about the Ark. Where does each one really stand?", mood: "curious", act: "tilt" }],
      claims: [
        {
          text: "Solomon’s priests placed the Ark in the temple’s inner sanctuary.", fits: ["scripture"],
          why: "1 Kings 8:6 says it in so many words.",
          exhibit: { label: "1 Kings 8:6", verses: [v("The priests brought in the ark of Yahweh’s covenant to its place, into the inner sanctuary of the house, to the most holy place, even under the cherubim’s wings.", "1 Kings 8:6")] },
        },
        {
          text: "Babylon captured Jerusalem in Nebuchadnezzar’s reign.", fits: ["scripture", "historical"],
          why: "Both, in fact. Scripture states it, and a Babylonian clay tablet independently records Nebuchadnezzar taking “the city of Judah” in 597 BC.",
          exhibit: {
            label: "2 Kings 24 · a Babylonian tablet",
            verses: [v("At that time the servants of Nebuchadnezzar king of Babylon came up to Jerusalem, and the city was besieged.", "2 Kings 24:10")],
            note: "The Babylonian Chronicle tablet known as the Jerusalem Chronicle (British Museum, BM 21946) records Nebuchadnezzar besieging and seizing “the city of Judah” and capturing its king in 597 BC.",
          },
        },
        {
          text: "The Ark was carried off to Babylon.", fits: ["hypothesis"],
          why: "A reasonable reading of “all the vessels” in 2 Chronicles 36:18, and one some ancient rabbis held. But no text names the Ark, so it stays a hypothesis.",
          exhibit: { label: "2 Chronicles 36:18", verses: [v("All the vessels of God’s house, great and small, and the treasures of Yahweh’s house, and the treasures of the king, and of his princes, all these he brought to Babylon.", "2 Chronicles 36:18")], note: "“All the vessels” could include the Ark. It isn’t named." },
        },
        {
          text: "The Ark is kept today in a chapel in Aksum, Ethiopia.", fits: ["unknown", "hypothesis"],
          why: "The Ethiopian Orthodox Church holds that it is there, guarded by one monk. No one else may see it, so the claim can’t be confirmed or ruled out.",
          exhibit: { label: "Ethiopian tradition", note: "The tradition goes back to the Kebra Nagast, an Ethiopian text compiled around the 14th century. Only the chapel’s appointed guardian sees what is kept inside; it has never been independently examined." },
        },
        {
          text: "We know when and how the Ark disappeared.", fits: ["unknown"],
          why: "Scripture and history narrow the window, but nothing describes the moment. That part of the case is open.",
          exhibit: { label: "The record", note: "No biblical text, and no record outside the Bible, describes the Ark being lost, destroyed, hidden or taken." },
        },
      ],
      after: [{ say: "Solid ground at the start, open questions at the end. Now, the theories!", mood: "excited", act: "hop" }],
    },
    // 6. Explore the theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "People have wondered about this for over two thousand years. Here’s what they’ve proposed.", mood: "thinking" }],
      theories: [
        {
          title: "Lost when Babylon took Jerusalem", kind: "scholarship", strength: "inference",
          origin: "Inferred from 2 Kings 24–25 and 2 Chronicles 36.",
          body: "The temple’s treasures were carried off in 597 BC and the temple burned in 587 or 586 BC. Many historians think the Ark was taken, melted down or destroyed then.",
          against: "No text, biblical or Babylonian, names the Ark among the spoils.",
          say: "A view many historians hold. Still not stated anywhere.",
        },
        {
          title: "Hidden by Jeremiah on a mountain", kind: "tradition", strength: "tradition",
          origin: "2 Maccabees 2:4–8, written around the 2nd century BC. It’s in Catholic and Orthodox Bibles, not Jewish or Protestant ones.",
          body: "It cites an older record saying the prophet Jeremiah took the tent, the Ark and the incense altar to the mountain Moses climbed, sealed them in a cave, and said the place would stay unknown.",
          against: "Written centuries after the events. The record it cites hasn’t survived, and nothing has been found.",
          say: "An old tradition, written down long after.",
        },
        {
          title: "Hidden beneath the Temple Mount", kind: "tradition", strength: "tradition",
          origin: "Rabbinic tradition in the Mishnah and Talmud, written down around AD 200–500.",
          body: "Some rabbis taught it was hidden in its place, under the temple, and one tradition names King Josiah as the one who hid it. Others in the same texts said it went to Babylon.",
          against: "Even the rabbis disagreed. The site isn’t open to excavation, and no evidence has been produced.",
          say: "Even the ancient rabbis argued about it!",
        },
        {
          title: "Taken to Ethiopia", kind: "tradition", strength: "tradition",
          origin: "The Kebra Nagast, an Ethiopian text compiled around the 14th century AD.",
          body: "It tells of Menelik, son of Solomon and the Queen of Sheba, bringing the Ark to Ethiopia. The Ethiopian Orthodox Church holds that it rests in a chapel in Aksum.",
          against: "Only its guardian monk may see it, so it has never been independently examined.",
          say: "Held with deep conviction. Never examined.",
        },
        {
          title: "Modern claims of discovery", kind: "modern", strength: "unverified",
          origin: "Explorers and enthusiasts, from the 20th century on.",
          body: "Several people have announced they’ve found the Ark, in caves, tunnels or under Jerusalem.",
          against: "None has produced evidence that independent archaeologists could examine and confirm.",
          say: "Big headlines. No verified evidence.",
        },
      ],
      caveat: "None of these is a verified discovery. They range from careful inference to legend, and the honest answer is still: we don’t know.",
      after: [{ say: "Time to put the case back together, with only what we can actually show.", mood: "excited", act: "nod" }],
    },
    // 7. Reconstruct the case
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Last job: rebuild the case from established evidence.", mood: "thinking" },
        { say: "Where the record goes quiet, we leave a gap. No guessing to fill it.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of evidence.",
      slots: [
        { id: "made", when: "Moses’ day", text: "Made to the pattern in Exodus 25", ref: "Exodus 25:10–22" },
        { id: "temple", when: "c. 960 BC", text: "Placed in Solomon’s Temple", ref: "1 Kings 8:6–9" },
        { id: "josiah", when: "c. 622 BC", text: "Named in Josiah’s day", ref: "2 Chronicles 35:3" },
        { gap: "What happened to it next", say: "Nothing in the record fills this one. We leave it open." },
        { id: "fire", when: "587/586 BC", text: "Temple burned, treasures taken", ref: "2 Kings 25 · Jeremiah 52" },
        { gap: "Where it is now", say: "Open too. Some theories point here, but none is evidence." },
      ],
      theory: { text: "Taken to Babylon?", say: "That can sit beside the gap as a possibility. It doesn’t fill it." },
      after: [{ say: "Four solid pieces. Two honest gaps. That’s a real reconstruction.", mood: "moved", act: "nod" }],
    },
    // 8. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "Where Did the Ark of the Covenant Go?",
      scripture: [
        "The Ark was housed in Solomon’s Temple, and later biblical texts refer to it.",
        "It was made to the pattern in Exodus 25 and placed under the cherubim’s wings (1 Kings 8:6–9).",
        "It’s mentioned again in Josiah’s day (2 Chronicles 35:3).",
        "Babylon later burned the temple and took its treasures (2 Kings 25; Jeremiah 52).",
      ],
      uncertain: [
        "The precise circumstances of its disappearance.",
        "Whether it was taken, destroyed or hidden.",
        "Its present whereabouts, or whether it still exists.",
      ],
      proposed: [
        "Lost to Babylon (a scholarly inference).",
        "Hidden by Jeremiah (2 Maccabees).",
        "Hidden beneath the Temple Mount (rabbinic tradition).",
        "Kept in Aksum, Ethiopia (Ethiopian Orthodox tradition).",
      ],
      note: "An open case isn’t a failed one. Knowing clearly what we know, and what we don’t, is the finding.",
      refs: ["Exodus 25:10–22", "1 Kings 8:6–9", "2 Chronicles 35:3", "2 Kings 24–25", "Jeremiah 52", "Ezra 1:7–11"],
      sources: [
        { title: "Jerusalem Chronicle (Babylonian Chronicle of Nebuchadnezzar’s early years)", publisher: "British Museum, BM 21946" },
        { title: "2 Maccabees 2:4–8", publisher: "In Catholic and Orthodox Bibles" },
        { title: "Mishnah Shekalim 6:1–2 · Babylonian Talmud Yoma 52b–54a", publisher: "Rabbinic literature" },
        { title: "Kebra Nagast", publisher: "Ethiopian text, c. 14th century" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
