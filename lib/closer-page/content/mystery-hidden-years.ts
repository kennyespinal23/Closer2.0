import type { Lesson } from "../lesson/types";

/* Bible Mysteries, Case 008: "What Happened During Jesus’ Unrecorded Years?" Status: unresolved.
   What the case rests on, and how it's kept honest:
   - Stated: the visit to the temple at twelve, the return to Nazareth, growing "in wisdom and stature" (Luke 2:41–52);
     "about thirty" when he began (Luke 3:23); Nazareth "where he had been brought up", synagogue "as was his
     custom" (Luke 4:16).
   - What people said: "the carpenter" (Mark 6:3; Greek tektōn, a builder or craftsman), "the carpenter's son"
     (Matthew 13:55), brothers named and sisters mentioned; "never been educated" (John 7:15).
   - Inferences, labelled: a trade, family life and synagogue in Nazareth through those years. Christians differ on who
     the "brothers" were (children of Mary, of Joseph by an earlier marriage, or cousins); the case doesn't decide.
   - Legends, labelled: infancy gospels (e.g. the Infancy Gospel of Thomas, 2nd century) and modern claims of travel to
     India or Britain, for which there's no historical evidence. The Gospels' silence is read by many as a sign of
     ordinary life, which is itself an inference.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });

export const mysteryHiddenYears = {
  id: "mystery-hidden-years",
  title: "What Happened During Jesus’ Unrecorded Years?",
  subtitle: "Eighteen quiet years",
  kind: "Bible mystery",
  scripture: "Luke 2:41–52 · Luke 3:23 · Mark 6:3",
  minutes: 5,
  theme: "copper",
  case: { id: "008", status: "Unresolved" },
  sources: [
    { title: "Luke 2:41–52; 3:23; 4:16 · Mark 6:3 · Matthew 13:55 · John 7:15", publisher: "World English Bible" },
    { title: "Infancy Gospel of Thomas", publisher: "2nd-century text, not in any Bible" },
  ],
  blocks: [
    // 1. Open the case
    {
      kind: "caseOpen",
      page: { at: "top", act: "enter", mood: "excited" },
      before: [
        { say: "Jesus at twelve, in the temple. Then nothing.", mood: "curious", act: "tilt" },
        { say: "The next time we see him, he’s about thirty.", mood: "surprised", act: "react" },
        { say: "So what happened in between?", mood: "cheeky", act: "stare" },
      ],
      open: "Here’s the file. Open it up!",
      title: "What Happened During Jesus’ Unrecorded Years?",
      refs: ["Luke 2:41–52", "Luke 3:23", "Luke 4:16", "Mark 6:3", "Matthew 13:55"],
      after: [{ say: "The Gospels are quiet here. Let’s see what clues they leave.", mood: "excited", act: "hop" }],
    },
    // 2. The order of events
    {
      kind: "caseTimeline",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Four clues. Put them in the order of his life.", mood: "curious", act: "tilt" }],
      hint: "Earliest first. Tap Read to check any card.",
      cards: [
        {
          id: "twelve", when: "Age 12", title: "Jesus stays behind in the temple", basis: "stated",
          body: "His parents find him among the teachers, listening and asking questions.",
          exhibit: { label: "Luke 2:46", verses: [v("After three days they found him in the temple, sitting in the middle of the teachers, both listening to them, and asking them questions.", "Luke 2:46")] },
        },
        {
          id: "grew", when: "Teenage years", title: "Back to Nazareth, growing up", basis: "stated",
          body: "He lives with his parents and grows “in wisdom and stature.” That’s all Luke says.",
          exhibit: { label: "Luke 2:51–52", verses: [v("And he went down with them, and came to Nazareth. He was subject to them, and his mother kept all these sayings in her heart.", "Luke 2:51"), v("And Jesus increased in wisdom and stature, and in favor with God and men.", "Luke 2:52")] },
        },
        {
          id: "trade", when: "Twenties", title: "Known locally as “the carpenter”", basis: "inference",
          body: "His neighbours later call him the carpenter, so he likely worked a trade in these years. That’s an inference.",
          exhibit: { label: "Mark 6:3", verses: [v("Isn’t this the carpenter, the son of Mary, and brother of James, Joses, Judah, and Simon? Aren’t his sisters here with us?” They were offended at him.", "Mark 6:3")], note: "The Greek word, tektōn, means a builder or craftsman, working in wood, stone or both." },
        },
        {
          id: "thirty", when: "About 30", title: "He begins to teach", basis: "stated",
          body: "Luke gives his age, roughly, at the start of his ministry.",
          exhibit: { label: "Luke 3:23", verses: [v("Jesus himself, when he began to teach, was about thirty years old", "Luke 3:23")] },
        },
      ],
      inOrder: "Spot on. Notice how much fits between card 2 and card 4.",
      outOfOrder: "Close! Here’s the order. Notice the long gap in the middle.",
      after: [
        { say: "Twelve to about thirty. Roughly eighteen years, almost unrecorded.", mood: "thinking" },
        { say: "Let’s pin up what people said about him later.", mood: "excited", act: "hop" },
      ],
    },
    // 3. The evidence board
    {
      kind: "board",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Evidence board!", mood: "excited", act: "spin" },
        { say: "Tap one clue, then another. Not every pair connects.", mood: "curious", act: "tilt" },
      ],
      hint: "Pick a clue, then another.",
      clues: [
        { id: "carpenter", title: "“The carpenter”", ref: "Mark 6:3", exhibit: { label: "Mark 6:3", verses: [v("Isn’t this the carpenter, the son of Mary, and brother of James, Joses, Judah, and Simon? Aren’t his sisters here with us?”", "Mark 6:3")] } },
        { id: "son", title: "“The carpenter’s son”", ref: "Matthew 13:55", exhibit: { label: "Matthew 13:55", verses: [v("Isn’t this the carpenter’s son? Isn’t his mother called Mary, and his brothers, James, Joses, Simon, and Judas?", "Matthew 13:55")] } },
        { id: "custom", title: "Synagogue, “as was his custom”", ref: "Luke 4:16", exhibit: { label: "Luke 4:16", verses: [v("He came to Nazareth, where he had been brought up. He entered, as was his custom, into the synagogue on the Sabbath day, and stood up to read.", "Luke 4:16")] } },
        { id: "grew", title: "Grew in wisdom and stature", ref: "Luke 2:52", exhibit: { label: "Luke 2:52", verses: [v("And Jesus increased in wisdom and stature, and in favor with God and men.", "Luke 2:52")] } },
        { id: "letters", title: "“Never been educated”", ref: "John 7:15", exhibit: { label: "John 7:15", verses: [v("The Jews therefore marveled, saying, “How does this man know letters, having never been educated?”", "John 7:15")], note: "This is what onlookers said, probably meaning he hadn’t studied under a recognised teacher." } },
        { id: "temple", title: "Questions in the temple at 12", ref: "Luke 2:46–47", exhibit: { label: "Luke 2:46–47", verses: [v("All who heard him were amazed at his understanding and his answers.", "Luke 2:47")] } },
      ],
      links: [
        {
          a: "carpenter", b: "son", label: "A family trade", strength: "inference",
          say: "Like father, like son!",
          body: "Mark calls Jesus “the carpenter”; Matthew, “the carpenter’s son.” Sons often learned their father’s trade, so many think Jesus worked alongside Joseph. Likely, but not stated.",
        },
        {
          a: "carpenter", b: "custom", label: "Known in his hometown", strength: "inference",
          say: "Everyone in Nazareth knew him.",
          body: "In Nazareth, people know his job, his mother and his brothers by name, and he goes to the synagogue “as was his custom.” It sounds like years of ordinary local life.",
        },
        {
          a: "grew", b: "temple", label: "Learning, from early on", strength: "stated",
          say: "Listening AND asking questions.",
          body: "At twelve he’s already listening to the teachers and asking questions; afterwards Luke says he grew in wisdom. Luke presents real growth, not a finished adult in a child’s body.",
        },
        {
          a: "letters", b: "custom", label: "Learned, but not formally trained", strength: "inference",
          say: "So where did he learn?",
          body: "People marvel that he knows “letters” without having been educated, probably meaning no famous teacher. He stands up to read Scripture in the synagogue. Many think he learned at home and in the synagogue, but the text doesn’t say how.",
        },
        {
          a: "son", b: "grew", label: "A family in Nazareth", strength: "stated",
          say: "Brothers and sisters, too!",
          body: "Matthew and Mark name four brothers and mention sisters. Christians differ on who they were: children of Mary, of Joseph by an earlier marriage, or cousins. Either way, he grew up in a busy household.",
        },
      ],
      noLink: "No direct thread between those two. Not every clue connects.",
      after: [{ say: "Ordinary clues, all of them. That might be the point.", mood: "thinking", act: "nod" }],
    },
    // 4. Weigh the evidence
    {
      kind: "sorter",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Five claims about those years. Where does each stand?", mood: "curious", act: "tilt" }],
      claims: [
        {
          text: "Jesus was about thirty when he began his ministry.", fits: ["scripture"],
          why: "Luke 3:23 says so, as an approximate age.",
          exhibit: { label: "Luke 3:23", verses: [v("Jesus himself, when he began to teach, was about thirty years old", "Luke 3:23")] },
        },
        {
          text: "Jesus worked as a carpenter or builder.", fits: ["hypothesis", "scripture"],
          why: "His neighbours call him “the carpenter” (Mark 6:3), so it’s close to stated. That he worked at it through those years is a strong inference.",
          exhibit: { label: "Mark 6:3", verses: [v("Isn’t this the carpenter, the son of Mary", "Mark 6:3")], note: "The Greek word tektōn covers builders and craftsmen in wood or stone." },
        },
        {
          text: "Jesus travelled to India to study.", fits: ["unknown"],
          why: "This claim appeared in the 19th century. No ancient source supports it, and the Gospels place him in Nazareth.",
          exhibit: { label: "The record", note: "No first- or second-century source mentions travel to India or Britain. These are modern claims or later legends." },
        },
        {
          text: "As a child, Jesus made clay birds come to life.", fits: ["unknown", "hypothesis"],
          why: "That story comes from the Infancy Gospel of Thomas, a 2nd-century text no church included in the Bible. It’s a later legend.",
          exhibit: { label: "Infancy Gospel of Thomas", note: "Written over a century after Jesus, full of miracle stories about his childhood. Historians treat it as legend." },
        },
        {
          text: "We know what Jesus did between twelve and thirty.", fits: ["unknown"],
          why: "Beyond growing up in Nazareth and a trade, the Gospels don’t say. That part of the case is open.",
          exhibit: { label: "The record", note: "Luke 2:52 is the only summary of those years." },
        },
      ],
      after: [{ say: "A little stated, a lot unknown. And some stories to watch.", mood: "excited", act: "hop" }],
    },
    // 5. The theories
    {
      kind: "theories",
      page: { at: "top", mood: "curious" },
      before: [{ say: "People have tried to fill those years for a long time.", mood: "thinking" }],
      theories: [
        {
          title: "An ordinary life in Nazareth", kind: "scholarship", strength: "inference",
          origin: "Inferred from Luke 2:51–52, Luke 4:16 and Mark 6:3.",
          body: "Family, a trade, the synagogue, the festivals. His neighbours’ surprise later suggests he seemed ordinary to them.",
          against: "It’s a reasonable picture from small clues, not a record.",
          say: "The view most historians share.",
        },
        {
          title: "Miracles in childhood", kind: "tradition", strength: "tradition",
          origin: "The Infancy Gospel of Thomas and similar texts, 2nd century onwards.",
          body: "Stories of the boy Jesus working wonders, some of them strange or harsh.",
          against: "Written long after, not accepted into any Bible; John 2:11 calls Cana his first sign.",
          say: "Old stories, but much later ones.",
        },
        {
          title: "Travels to India or the East", kind: "modern", strength: "unverified",
          origin: "Claims published from the late 19th century.",
          body: "Some suggest he studied with teachers in India or Tibet before returning.",
          against: "No ancient evidence; the documents behind the claim have never been produced for scholars to examine.",
          say: "A modern idea, without ancient support.",
        },
        {
          title: "A visit to Britain", kind: "tradition", strength: "unverified",
          origin: "Later English legends, linked with Joseph of Arimathea.",
          body: "Stories say the young Jesus came to Britain; the hymn “Jerusalem” asks whether he did.",
          against: "No ancient evidence; the legends appear many centuries later.",
          say: "A legend, and a famous hymn.",
        },
      ],
      caveat: "Only the first is built on the Gospels’ own clues, and even it is an inference. The rest are legends or modern claims.",
      after: [{ say: "Time to rebuild what we can actually show.", mood: "excited", act: "nod" }],
    },
    // 6. Reconstruct the case
    {
      kind: "reconstruct",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "Last job: rebuild those years.", mood: "thinking" },
        { say: "Where the Gospels are silent, we leave a gap.", mood: "tender", act: "nod" },
      ],
      hint: "Place each piece of evidence.",
      slots: [
        { id: "twelve", when: "Age 12", text: "In the temple, asking questions", ref: "Luke 2:46" },
        { id: "grew", when: "Growing up", text: "In Nazareth, growing in wisdom", ref: "Luke 2:51–52" },
        { gap: "The day-to-day details", say: "Nothing in the record fills this. We leave it open." },
        { id: "trade", when: "Known as", text: "“The carpenter,” with a family", ref: "Mark 6:3" },
        { id: "thirty", when: "About 30", text: "He begins to teach", ref: "Luke 3:23" },
      ],
      theory: { text: "Travels abroad?", say: "That can sit beside the gap. It has no evidence to fill it." },
      after: [{ say: "Four solid pieces. One honest gap.", mood: "moved", act: "nod" }],
    },
    // 7. Close the case
    {
      kind: "report",
      page: { at: "corner", mood: "happy" },
      title: "What Happened During Jesus’ Unrecorded Years?",
      scripture: [
        "At twelve he stayed in the temple, listening and asking questions (Luke 2:46).",
        "He returned to Nazareth and grew “in wisdom and stature” (Luke 2:51–52).",
        "Later, people knew him as “the carpenter,” with brothers and sisters (Mark 6:3).",
        "He was about thirty when he began (Luke 3:23).",
      ],
      uncertain: [
        "What his days were like between twelve and thirty.",
        "How he learned, and from whom.",
        "Who exactly his brothers and sisters were (Christians differ).",
      ],
      proposed: [
        "An ordinary working life in Nazareth (a historians’ inference).",
        "Childhood miracles (2nd-century legends).",
        "Travels to India or Britain (modern claims and later legends, without evidence).",
      ],
      note: "The Gospels skip these years. Many readers find that striking: most of Jesus’ life was quiet, ordinary and local.",
      refs: ["Luke 2:41–52", "Luke 3:23", "Luke 4:16", "Mark 6:3", "Matthew 13:55", "John 7:15"],
      sources: [
        { title: "Infancy Gospel of Thomas", publisher: "2nd-century text, not in any Bible" },
        { title: "World English Bible", publisher: "Public domain" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
