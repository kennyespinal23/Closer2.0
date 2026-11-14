import type { Lesson, Source } from "../lesson/types";
const portrait: string = require("../assets/newton/newton-portrait.jpg");
const olney: string = require("../assets/newton/olney-hymns-1779-p53.jpg");

/* Testimony: John Newton (1725–1807), "The man behind Amazing Grace".
   Sources are listed below and shown on the last screen. Rules this lesson keeps:
   - Dates follow the Cowper & Newton Museum's chronology (storm 10 March 1748 O.S. / 21 March N.S.;
     first mate of the Brownlow 1748–49; captain of the Duke of Argyle 1750–51 and the African 1752–54;
     a fit ends his sea career Nov 1754; Olney from 1764; Thoughts upon the African Slave Trade Jan 1788;
     evidence to the Privy Council 1788 and a Commons committee 1790; Slave Trade Act 25 March 1807;
     died 21 December 1807).
   - Every quotation is one the sources print: two from An Authentic Narrative, one from a letter in
     Letters to a Wife, one from Thoughts upon the African Slave Trade, and the hymn's first stanza as
     printed in Olney Hymns (1779), transcribed from the Library of Congress scan (long s as s).
   - On screen, each claim says what it is: documented, his own words, how he understood it, or legend.
     The storm's spiritual meaning is reported as Newton's understanding, not as verified fact.
   - The slave trade is named plainly, and his later work is never presented as undoing its harm. */

const WEB = "World English Bible";

const sources: Source[] = [
  { title: "John Newton (1725–1807)", publisher: "Cowper & Newton Museum", url: "https://cowperandnewtonmuseum.org.uk/john-newton-1725-1807/" },
  { title: "John Newton: early life and the slave trade", publisher: "Cowper & Newton Museum", url: "https://cowperandnewtonmuseum.org.uk/?p=6094" },
  { title: "Slavery and Abolition", publisher: "Cowper & Newton Museum", url: "https://cowperandnewtonmuseum.org.uk/slavery-and-abolition/" },
  { title: "“Amazing Grace” didn’t stand out as amazing when first published", publisher: "Library of Congress", url: "https://blogs.loc.gov/loc/2025/07/amazing-grace-didnt-stand-out-as-amazing-when-first-published/" },
  { title: "Olney Hymns (1779), page 53", publisher: "Library of Congress scan, via Wikimedia Commons", url: "https://commons.wikimedia.org/wiki/File:Olney_Hymns_page_53_Amazing_Grace.jpg" },
  { title: "Amazing grace! (how sweet the sound)", publisher: "Hymnology Archive", url: "https://hymnologyarchive.com/amazing-grace" },
  { title: "John Newton and the abolition of the slave trade", publisher: "Brycchan Carey", url: "https://brycchancarey.com/abolition/newton.htm" },
  { title: "Portrait of John Newton, after John Russell", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:John_Newton.jpg" },
];

const narrative = "Newton, An Authentic Narrative (1764)";

export const johnNewton = {
  id: "john-newton",
  title: "The man behind Amazing Grace",
  subtitle: "John Newton, 1725–1807",
  kind: "Testimony",
  scripture: "Olney Hymns · 1779",
  minutes: 6,
  theme: "walnut",
  pronoun: "he",
  sources,
  blocks: [
    // 1. The hook (TestimonyIntro + HistoricalPortrait)
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "Have you ever heard of “Amazing Grace”?", mood: "curious", act: "tilt" },
        { say: "The man who wrote it once helped transport enslaved people across the ocean.", mood: "tender", act: "settle" },
        { say: "His name was John Newton.", show: "portrait", at: "left", mood: "thinking" },
      ],
      portrait: {
        src: portrait,
        alt: "Painted portrait of John Newton in later life, in a white wig and clerical dress",
        credit: "Portrait after John Russell. Public domain, via Wikimedia Commons.",
        name: "John Newton",
        dates: "1725–1807",
      },
      reply: "Tell me his story",
    },
    // 2. Before the storm (LifeTimeline)
    {
      kind: "timeline",
      page: { at: "top", mood: "tender" },
      note: {
        title: "First, the context",
        text: "In the transatlantic slave trade, European traders forcibly carried millions of African people across the Atlantic. They were bought, chained below deck in brutal conditions, and sold into slavery. Many died on the way.",
      },
      before: [
        { say: "Before his story, some honest context.", mood: "tender" },
        { say: "Newton’s life runs straight through one of history’s great crimes.", mood: "tender", act: "settle" },
        { say: "Here’s how his early years went.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      events: [
        { year: "1725", title: "Born in London", tag: "fact", body: "His father was a ship’s captain. His mother died when he was a young child.", say: "Born in London, to a sea captain’s family." },
        { year: "1744", title: "Forced into the Royal Navy", tag: "fact", body: "He was pressed into service aboard HMS Harwich. In 1745 he left the ship without permission, and was caught and flogged.", say: "Then forced into the navy. It went badly." },
        { year: "1745", title: "Working for a slave trader", tag: "fact", body: "He sailed to West Africa on the Pegasus and stayed on the Plantain Islands, off Sierra Leone, working for a slave trader. By his own account he was badly treated there.", say: "And then into the business of buying and selling people." },
        { year: "1747", title: "A ship finds him", tag: "fact", body: "The captain of the Greyhound found him and took him aboard, to begin the long voyage back to England.", say: "Until a ship came and found him." },
      ],
      after: [
        { say: "Up to here, he wasn’t looking for God at all.", at: "top", mood: "thinking" },
        { say: "By his own account, he openly mocked faith.", mood: "tender" },
      ],
    },
    // 3. The storm of 1748 (TurningPoint)
    {
      kind: "turning",
      scene: "storm",
      page: { at: "top", mood: "surprised" },
      beats: [
        { when: "March 1748", tag: "fact", intensity: 3, text: "Sailing home across the North Atlantic, the Greyhound was hit by a violent storm and badly damaged.", say: "Then came the storm.", mood: "surprised", act: "shake" },
        { when: "March 1748", tag: "fact", intensity: 3, text: "The crew worked the pumps for hours to keep her afloat. It wasn’t clear they would survive.", say: "It was close.", mood: "tender" },
        {
          tag: "own", intensity: 2, text: "Newton later wrote that this was the day his life began to turn.",
          quote: { text: "The 10th (that is in the present style the 21st) of March, is the day much to be remembered by me", source: narrative },
          say: "He never forgot the date.", mood: "thinking",
        },
        { when: "Weeks later", tag: "fact", intensity: 0, text: "The battered ship finally reached Lough Swilly, in the north of Ireland.", say: "They made it.", mood: "happy", act: "nod" },
        {
          tag: "interpretation", intensity: 0, text: "Newton understood his survival as God’s rescue. He began to pray and to read the Bible.",
          quote: { text: "On that day the Lord sent from on high and delivered me out of deep waters.", source: narrative },
          say: "We can’t check what happened spiritually. We can tell you how he saw it.", mood: "moved",
        },
      ],
      after: [],
    },
    // 4. Change takes time (TransformationReveal, on the LifeTimeline)
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Here’s the part people often skip.", mood: "curious", act: "tilt" },
        { say: "After the storm, Newton didn’t leave the slave trade.", mood: "tender", act: "settle" },
        { say: "Tap through the years and see how long change took.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      phases: [
        { id: "faith", label: "Faith begins", color: "#A8DCD2" },
        { id: "trade", label: "Still in the slave trade", color: "#FF9A8B" },
        { id: "ministry", label: "Ministry", color: "#F3E6D2" },
        { id: "against", label: "Speaking out", color: "#FFC72C" },
      ],
      events: [
        { year: "1748", title: "The storm", phase: "faith", tag: "interpretation", body: "Where his faith began, as Newton later told it.", say: "His faith begins here." },
        { year: "1748", title: "First mate on a slave ship", phase: "trade", tag: "fact", body: "Months after the storm, he sailed as first mate of the Brownlow, a slave ship.", say: "Months later, he was back at sea. On a slave ship." },
        { year: "1750", title: "Captain of the Duke of Argyle", phase: "trade", tag: "fact", body: "Now in command of a ship carrying enslaved Africans across the Atlantic.", say: "Then he became a captain." },
        {
          year: "1752", title: "Captain of the African", phase: "trade", tag: "fact",
          body: "Two more voyages as captain, until 1754. He wrote about his faith in letters home, while enslaved people were held below deck.",
          quote: { text: "I felt the disagreeableness of the business very strongly.", source: "Newton, letter to his wife, in Letters to a Wife (1793)" },
          say: "He felt uneasy. He kept going anyway.",
        },
        { year: "1754", title: "A seizure ends his life at sea", tag: "fact", body: "In November 1754 a sudden fit ended his career at sea, as a ship was being readied for another slave voyage.", say: "Then his health ended it, not his conscience." },
        { year: "1764", title: "Ordained, and sent to Olney", phase: "ministry", tag: "fact", body: "Ten years after leaving the sea, he became a Church of England minister in Olney, Buckinghamshire.", say: "Then he became a minister." },
        { year: "1788", title: "Speaking out against the trade", phase: "against", tag: "fact", body: "He published Thoughts upon the African Slave Trade, describing what he had seen and done, and gave evidence to the Privy Council.", say: "And finally, he spoke out." },
      ],
      span: { from: 1748, to: 1788, label: "From the storm to his public stand against the slave trade." },
      after: [
        { say: "Forty years.", at: "top", mood: "surprised", act: "react" },
        { say: "Faith started something in him. It took a long time to reach how he saw other people.", mood: "thinking" },
        { say: "That’s uncomfortable. It’s also honest.", mood: "tender", act: "nod" },
      ],
    },
    // 5. Amazing Grace (HistoricalArtifact)
    {
      kind: "artifact",
      page: { at: "top", mood: "happy" },
      before: [
        { say: "During his years in Olney, he wrote a hymn.", mood: "happy" },
        { say: "It went with his New Year’s Day sermon in 1773, on 1 Chronicles 17:16–17.", mood: "thinking" },
        { say: "Here’s where it was first printed.", mood: "excited", act: "hop", open: true },
      ],
      title: "Olney Hymns",
      date: "1779",
      image: {
        src: olney,
        alt: "Page 53 of Olney Hymns (1779), ending with Hymn 41, “Faith’s review and expectation”, which begins “Amazing grace!”",
        credit: "Olney Hymns (1779), page 53. Scan: Library of Congress. Public domain.",
      },
      focus: { x: 0.08, y: 0.87, scale: 1.9 },
      transcription: {
        text: "Amazing grace! (how sweet the sound)\nThat sav’d a wretch like me!\nI once was lost, but now am found,\nWas blind, but now I see.",
        source: "Hymn 41, “Faith’s review and expectation”, Olney Hymns (1779)",
      },
      notes: [
        { tag: "legend", text: "Often said: he wrote it in the storm. In fact it came about 25 years later, for a sermon in Olney." },
        { tag: "legend", text: "Often said: the tune is his. The melody most people sing, “New Britain”, was paired with his words in America in 1835, after he died." },
        { tag: "legend", text: "Often said: every verse is his. The “ten thousand years” verse was added later by others. It isn’t one of his six." },
        { tag: "fact", text: "It was printed in 1779 as Hymn 41, alongside hymns by his friend, the poet William Cowper." },
      ],
      after: [
        { say: "No “Amazing Grace” title yet. Just Hymn 41.", mood: "cheeky", act: "stare", open: false },
        { say: "“A wretch like me.” He meant it. He knew what he had done.", mood: "moved" },
        { say: "A few things people often get wrong about it.", show: "notes", mood: "curious", act: "tilt" },
        { say: "To Newton, grace was mercy he knew he hadn’t earned.", mood: "moved", act: "nod" },
      ],
    },
    // 6. His later legacy (Legacy)
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what did his life add up to?", mood: "thinking" },
        { say: "Look at him in two seasons.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "1748–1754",
        items: [
          "First mate, then captain, on slave ships",
          "Writing about his faith while enslaved people were held below deck",
          "He later said custom and self-interest had blinded him",
        ],
      },
      later: {
        label: "1785–1807",
        items: [
          "Counselled the young MP William Wilberforce, who led the campaign in Parliament",
          "Published Thoughts upon the African Slave Trade (1788)",
          "Gave evidence to the Privy Council (1788) and a House of Commons committee (1790)",
          "Lived to see Britain abolish its slave trade in March 1807, and died that December",
        ],
      },
      quote: { text: "I hope it will always be a subject of humiliating reflection to me, that I was, once, an active instrument, in a business at which my heart now shudders.", source: "Newton, Thoughts upon the African Slave Trade (1788)" },
      note: "His later work didn’t undo the harm. The people carried on his ships never got their lives back. And slavery itself went on in British colonies into the 1830s.",
      after: [
        { say: "Grace changed him. It didn’t erase what he had done, and he never said it did.", mood: "tender" },
        { say: "It sent him to tell the truth about it, and to help stop it.", mood: "moved", act: "nod" },
      ],
    },
    // 7. Reflection (PersonalReflection)
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "John Newton",
      lines: [{ say: "That’s John Newton’s story.", mood: "thinking" }],
      check: {
        prompt: "What stands out to you most about his story?",
        options: [
          { text: "Change can take time.", reply: "It took him decades. Be patient with your own change, and honest about it.", mood: "moved", act: "nod" },
          { text: "Faith should change how we treat people.", reply: "Yes. Real faith shows in how we treat people, especially those with no power.", mood: "thinking", act: "nod" },
          { text: "Grace doesn’t erase responsibility.", reply: "Right. He was forgiven, and he still spent his later years facing what he had done.", mood: "thinking", act: "tilt" },
          { text: "I want to think about it.", reply: "Take your time. It’s a lot to sit with.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What do you want to remember from his story?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    // 8. Completion (TestimonyComplete)
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "John Newton, 1725–1807",
      body: "The Lord is always closer than you think.",
      summary: [
        "A sailor in the slave trade, whose faith began in a storm in 1748.",
        "He stayed in the trade six more years, and took decades to speak against it.",
        "He wrote “Amazing Grace”, and later helped the campaign to end the British slave trade.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?",
        ref: "Micah 6:8",
        translation: WEB,
      },
      sources,
      related: [
        { title: "Can God forgive anyone?", sub: "Big question · 6 min", lessonId: "forgive-anyone" },
        { title: "Zacchaeus", sub: "Character study · Luke 19", lessonId: "zacchaeus" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
