import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 006: "Where Was the Garden of Eden?" Status: unresolved.
   - The text: Genesis 2:8–14 places the garden "eastward, in Eden", with one river splitting into four: Pishon
     (Havilah), Gihon (Cush), Hiddekel (the Tigris, as in Daniel 10:4) "in front of Assyria", and the Euphrates.
     Two are known today; Pishon and Gihon aren't identified. Genesis 3:24: the way to the tree of life is guarded.
   - Proposals, labelled: southern Mesopotamia; the highlands where the Tigris and Euphrates rise; Josephus's
     ancient identification of Gihon with the Nile (and Pishon with the Ganges); a theological, temple-like picture;
     a modern claim that the flood rearranged the rivers. No archaeological evidence of the garden exists.
   - Later uses (Ezekiel 28:13, Isaiah 51:3, Revelation 22:2) are shown as later Scripture drawing on Eden, not
     as location clues.
   - Blocks follow the plan, plus a reconstruction of what the text gives, with gaps for the two unknown rivers.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

const east = v("Yahweh God planted a garden eastward, in Eden, and there he put the man whom he had formed.", "Genesis 2:8");
const river = v("A river went out of Eden to water the garden; and from there it was parted, and became the source of four rivers.", "Genesis 2:10");
const pishon = v("The name of the first is Pishon: it flows through the whole land of Havilah, where there is gold;", "Genesis 2:11");
const gihon = v("The name of the second river is Gihon. It is the same river that flows through the whole land of Cush.", "Genesis 2:13");
const hiddekel = v("The name of the third river is Hiddekel. This is the one which flows in front of Assyria. The fourth river is the Euphrates.", "Genesis 2:14");
const guard = v("So he drove out the man; and he placed cherubim at the east of the garden of Eden, and a flaming sword which turned every way, to guard the way to the tree of life.", "Genesis 3:24");
const ezekiel = v("You were in Eden,\nthe garden of God.", "Ezekiel 28:13");
const tree = v("On this side of the river and on that was the tree of life, bearing twelve kinds of fruits, yielding its fruit every month.", "Revelation 22:2");

export const mysteryEden = {
  id: "mystery-eden",
  title: "Where Was the Garden of Eden?",
  subtitle: "Four rivers, and only two on the map",
  kind: "Bible mystery",
  scripture: "Genesis 2:8–14 · Genesis 3:24",
  minutes: 5,
  theme: "copper",
  case: { id: "006", status: "Unresolved" },
  sources: [
    { title: "Genesis 2:8–15; 3:24", publisher: "World English Bible" },
    { title: "Josephus, Antiquities of the Jews 1.1.3", publisher: "1st century AD" },
    { title: "Ezekiel 28:13; Isaiah 51:3; Revelation 22:2", publisher: "World English Bible" },
  ],
  blocks: [
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Genesis gives the garden a location. Even rivers!", mood: "curious", act: "tilt" },
        { say: "Two of those rivers you can still visit today.", mood: "surprised", act: "react" },
        { say: "So why can’t anyone find it?", mood: "cheeky", act: "stare" },
      ],
      open: "Open the file. Let’s read the directions.",
      title: "Where Was the Garden of Eden?",
      refs: ["Genesis 2:8–14", "Genesis 3:24", "Ezekiel 28", "Revelation 22"],
      after: [{ say: "Map out, pencil ready. Let’s look at every clue.", mood: "excited", act: "hop" }],
    },
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Six clues, all from Genesis. Pin them up!", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another, and see what connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "east", title: "“Eastward, in Eden”", ref: "Genesis 2:8", exhibit: { label: "Genesis 2:8", verses: [east] } },
        { id: "four", title: "One river, four heads", ref: "Genesis 2:10", exhibit: { label: "Genesis 2:10", verses: [river] } },
        { id: "pishon", title: "Pishon, land of gold", ref: "Genesis 2:11", exhibit: { label: "Genesis 2:11", verses: [pishon] } },
        { id: "gihon", title: "Gihon, land of Cush", ref: "Genesis 2:13", exhibit: { label: "Genesis 2:13", verses: [gihon] } },
        { id: "known", title: "Hiddekel and Euphrates", ref: "Genesis 2:14", exhibit: { label: "Genesis 2:14", verses: [hiddekel], note: "Hiddekel is the Hebrew name of the Tigris; Daniel 10:4 uses it for the same river." } },
        { id: "guard", title: "The way is guarded", ref: "Genesis 3:24", exhibit: { label: "Genesis 3:24 · later echoes", verses: [guard, ezekiel, tree], note: "Ezekiel and Revelation recall Eden and its tree of life much later. They draw on Eden as a picture; they don’t give its location." } },
      ],
      links: [
        {
          a: "four", b: "known", label: "Two we can find", strength: "stated",
          say: "The Tigris and the Euphrates!",
          body: "Two of the four rivers are named in a way we can still recognise: Hiddekel, the Tigris, and the Euphrates. Both run through Mesopotamia, in modern Iraq. That’s why most proposals start there.",
        },
        {
          a: "four", b: "pishon", label: "Two we can’t", strength: "inference",
          say: "Where’s the Pishon? Nobody agrees.",
          body: "No known river is agreed to be the Pishon. Havilah appears elsewhere in Genesis (10:29; 25:18), possibly somewhere in Arabia, but that doesn’t pin down a river.",
        },
        {
          a: "gihon", b: "known", label: "Which Cush?", strength: "inference",
          say: "Cush usually means south of Egypt…",
          body: "Elsewhere “Cush” usually means the land south of Egypt, which led some ancient readers to call the Gihon the Nile. But the Nile doesn’t share a source with the Tigris and Euphrates, so others look for a different Cush nearer Mesopotamia.",
        },
        {
          a: "east", b: "known", label: "East of where?", strength: "inference",
          say: "East, from the storyteller’s point of view!",
          body: "“Eastward” is most naturally east from where the writer and first hearers lived, in or near Israel. Mesopotamia lies east of there, which fits, though the verse doesn’t give a starting point.",
        },
        {
          a: "east", b: "guard", label: "Closed, not lost", strength: "stated",
          say: "The east side is where it’s guarded.",
          body: "Genesis says the man was driven out and cherubim guarded the way “at the east of the garden.” The story never says the garden was destroyed or moved; it simply leaves it behind.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Real rivers, and missing ones. Let’s sort what’s solid.", mood: "thinking", act: "nod" }],
    },
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "People have tried to map Eden for over two thousand years.", mood: "thinking" }],
      theories: [
        {
          title: "Southern Mesopotamia", kind: "scholarship", strength: "inference",
          origin: "Inferred from the Tigris and Euphrates in Genesis 2:14.",
          body: "Some place it in the lowlands of modern Iraq, where the two rivers flow toward the Persian Gulf; some suggest near the head of the Gulf.",
          against: "Rivers and coastlines have shifted over thousands of years, and the Pishon and Gihon still aren’t identified.",
          say: "The most common starting point.",
        },
        {
          title: "The highlands where the rivers rise", kind: "scholarship", strength: "inference",
          origin: "Inferred from “a river went out of Eden… the source of four rivers” (2:10).",
          body: "If the rivers start from Eden, look upstream: the Tigris and Euphrates both rise in the mountains of eastern Turkey and the Armenian highlands.",
          against: "No single source there feeds four rivers, and the other two aren’t found nearby.",
          say: "Follow the rivers upstream!",
        },
        {
          title: "Gihon was the Nile", kind: "tradition", strength: "tradition",
          origin: "Ancient readers, including the Jewish historian Josephus (1st century AD).",
          body: "Josephus identified the Gihon with the Nile, because of Cush, and the Pishon with the Ganges, picturing rivers that reach the whole known world.",
          against: "These rivers don’t share a source; it reads more like ancient world geography than a map.",
          say: "A very old guess, and a big map!",
        },
        {
          title: "A picture of God’s presence", kind: "scholarship", strength: "inference",
          origin: "A theological reading held by many scholars.",
          body: "Eden is described with gold and precious stones, rivers flowing out, and cherubim guarding it, much like later temple imagery. On this reading the geography is meant to say “God’s dwelling, the source of life”, not to give directions.",
          against: "Genesis does name real rivers, so many readers think it points to a real place too. The two readings can overlap.",
          say: "Maybe it’s more a picture than a map.",
        },
        {
          title: "The flood rearranged the rivers", kind: "modern", strength: "unverified",
          origin: "A modern view among some Christians who read Genesis 1–11 as straightforward history.",
          body: "The original rivers were changed by the flood, and today’s Tigris and Euphrates were named after them.",
          against: "Genesis doesn’t say this, and it can’t be tested from the evidence we have.",
          say: "A modern idea. Can’t be checked.",
        },
      ],
      caveat: "No archaeological evidence of the garden has ever been found. These range from careful inference to ancient tradition to modern speculation.",
      after: [{ say: "Let’s sort a few claims before we rebuild the case.", mood: "excited", act: "nod" }],
    },
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims about Eden. Where does each one stand?", mood: "curious", act: "tilt" }],
      claims: [
        { text: "Genesis names four rivers coming from Eden’s river.", fits: ["scripture"], why: "Genesis 2:10–14 names them: Pishon, Gihon, Hiddekel and Euphrates.", exhibit: { label: "Genesis 2:10–14", verses: [river, hiddekel] } },
        { text: "The Tigris and Euphrates are real rivers today.", fits: ["historical", "scripture"], why: "Both are still on the map in Iraq, Syria and Turkey, and Genesis names them.", exhibit: { label: "Genesis 2:14", verses: [hiddekel], note: "Hiddekel is the Hebrew name for the Tigris." } },
        { text: "The Gihon is the Nile.", fits: ["hypothesis"], why: "An ancient identification, based on Cush. Genesis doesn’t say it, and the geography doesn’t fit easily.", exhibit: { label: "Genesis 2:13", verses: [gihon] } },
        { text: "Eden was near where the Tigris and Euphrates are today.", fits: ["hypothesis"], why: "A reasonable inference from the two known rivers, but it can’t be confirmed.", exhibit: { label: "Genesis 2:14", verses: [hiddekel] } },
        { text: "Archaeologists have found the garden’s site.", fits: ["unknown"], why: "No such discovery exists. Claims to have found Eden haven’t been verified.", exhibit: { label: "The record", note: "There is no archaeological evidence of the garden." } },
      ],
      after: [{ say: "Now let’s rebuild only what Genesis actually gives us.", mood: "excited", act: "hop" }],
    },
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Rebuild the directions Genesis gives.", mood: "thinking" },
        { say: "Where the clues run out, we leave the gap open.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of evidence.",
      slots: [
        { id: "planted", when: "Gen 2:8", text: "A garden planted eastward, in Eden", ref: "Genesis 2:8" },
        { id: "split", when: "Gen 2:10", text: "One river, parted into four", ref: "Genesis 2:10" },
        { id: "known", when: "Gen 2:14", text: "Two still known: Tigris and Euphrates", ref: "Genesis 2:14" },
        { gap: "Where the Pishon and Gihon ran", say: "Nobody has identified these two. The gap stays open." },
        { id: "guarded", when: "Gen 3:24", text: "The way guarded, east of the garden", ref: "Genesis 3:24" },
        { gap: "Where it is now", say: "No one knows. Some say that’s not the question Genesis is answering." },
      ],
      theory: { text: "Southern Mesopotamia?", say: "That can sit beside the gap as a possibility. It doesn’t fill it." },
      after: [
        { say: "Later Scripture keeps Eden in view, as a picture, not a pin on a map.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "Where Was the Garden of Eden?",
      scripture: [
        "God planted a garden “eastward, in Eden” (Genesis 2:8).",
        "A river from Eden parted into four: Pishon, Gihon, Hiddekel (the Tigris) and Euphrates (2:10–14).",
        "After the man was driven out, cherubim guarded the way to the tree of life (3:24).",
        "Later Scripture recalls Eden as the garden of God (Ezekiel 28:13) and shows the tree of life again (Revelation 22:2).",
      ],
      uncertain: [
        "Which rivers the Pishon and Gihon were.",
        "Where “eastward” was measured from, exactly.",
        "Where the garden was, and whether a site could ever be found.",
      ],
      proposed: [
        "Southern Mesopotamia (scholarly inference).",
        "The highlands where the Tigris and Euphrates rise (scholarly inference).",
        "Gihon as the Nile (ancient tradition, Josephus).",
        "A theological picture of God’s presence (a scholarly reading).",
        "Rivers rearranged by the flood (modern, unverified).",
      ],
      note: "Genesis gives real rivers and missing ones. Holding both, without forcing a map, is the honest finding.",
      refs: ["Genesis 2:8–15", "Genesis 3:24", "Daniel 10:4", "Ezekiel 28:13", "Isaiah 51:3", "Revelation 22:1–2"],
      sources: [
        { title: "Genesis 2–3; Ezekiel 28; Isaiah 51; Revelation 22", publisher: "World English Bible" },
        { title: "Josephus, Antiquities of the Jews 1.1.3", publisher: "1st century AD" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
