import type { Lesson, Source } from "../lesson/types";
const young: string = require("../assets/tubman/tubman-1868.jpg");
const later: string = require("../assets/tubman/tubman-c1885.jpg");

/* Testimony: Harriet Tubman (c. 1822–1913), "The woman who followed her faith to freedom".
   A journey shape: born enslaved, an injury and visions, escape, then going back, again and again.
   - Facts follow the National Park Service (Harriet Tubman Underground Railroad NHP and NHP Auburn) and the
     National Archives: born Araminta Ross c. 1822, Dorchester County, Maryland; head injury from a two-pound
     weight thrown by an overseer, "sleeping spells" afterwards; married John Tubman; escaped alone to
     Philadelphia, fall 1849; returned about 13 times 1850–1860 and led more than 70 people to freedom; house in
     Auburn bought from William H. Seward, 1859; Union nurse, scout and spy; Combahee River Raid, June 1863,
     more than 750 freed; died 10 March 1913.
   - Her faith and visions are reported by historians (Kate Clifford Larson; Robert Gudmestad) from accounts
     she gave others: tagged "How she understood it" or "From her own telling".
   - She couldn't read or write. Her only words quoted here are from Benjamin Drew's 1856 interview, printed in
     standard English (public domain). Later accounts rendered her speech in caricatured dialect; we don't quote
     those.
   - The inflated "19 trips, 300 people" figures and the quilt-code story are shown as legend. */

const WEB = "World English Bible";
const drew = "Harriet Tubman, interviewed in Benjamin Drew, A North-Side View of Slavery (1856)";

const sources: Source[] = [
  { title: "Harriet Tubman", publisher: "National Park Service, Harriet Tubman Underground Railroad NHP", url: "https://www.nps.gov/hatu/learn/historyculture/htubman.htm" },
  { title: "Harriet Tubman National Historical Park, Auburn", publisher: "National Park Service", url: "https://www.nps.gov/hart/" },
  { title: "Harriet Tubman (c. March 1822 – March 10, 1913)", publisher: "National Archives", url: "https://www.archives.gov/research/african-americans/individuals/harriet-tubman" },
  { title: "Faith made Harriet Tubman fearless as she rescued slaves (Robert Gudmestad)", publisher: "The Conversation / History News Network", url: "https://www.historynewsnetwork.org/article/faith-made-harriet-tubman-fearless-as-she-rescued-" },
  { title: "A North-Side View of Slavery (Benjamin Drew, 1856), p. 30", publisher: "Documenting the American South, UNC", url: "https://docsouth.unc.edu/neh/drew/drew.html" },
  { title: "Harriet Tubman, about 1868–69 (photo: Benjamin F. Powelson)", publisher: "NMAAHC and Library of Congress, via Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:Carte-de-visite_portrait_of_Harriet_Tubman.jpg" },
  { title: "Harriet Tubman, about 1885 (photo: H. Seymour Squyer)", publisher: "National Portrait Gallery, via Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:Harriet_Tubman_by_Squyer_c1885.jpg" },
];

export const harrietTubman = {
  id: "harriet-tubman",
  title: "The woman who followed her faith to freedom",
  subtitle: "Harriet Tubman, c. 1822–1913",
  kind: "Testimony",
  scripture: "Maryland · 1849–1860",
  minutes: 6,
  theme: "walnut",
  pronoun: "she",
  sources,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "This is a story about slavery, and about a woman who refused it.", mood: "tender", act: "settle" },
        { say: "She escaped. Then she kept going back, for other people.", mood: "thinking", act: "nod" },
        { say: "Her name was Harriet Tubman.", show: "portrait", at: "left", mood: "moved" },
      ],
      portrait: {
        src: young,
        alt: "Photograph of a young Black woman seated beside a chair, in a dark bodice and a full checked skirt",
        credit: "Harriet Tubman, about 1868–69. Photo: Benjamin F. Powelson, Auburn, New York. NMAAHC and Library of Congress. Public domain.",
        name: "Harriet Tubman",
        dates: "c. 1822–1913",
      },
      reply: "Tell me her story",
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "tender" },
      note: {
        title: "First, the context",
        text: "In the United States, millions of Black people were held in slavery: bought, sold, and forced to work without pay or freedom. Families were torn apart by sale.",
      },
      before: [
        { say: "Before her story, the world she was born into.", mood: "tender" },
        { say: "She grew up enslaved on Maryland’s Eastern Shore.", mood: "tender", act: "settle" },
        { say: "Here’s how her early life went.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      events: [
        { year: "c. 1822", title: "Born Araminta Ross", tag: "fact", body: "Born into slavery in Dorchester County, Maryland, one of nine children. Her family called her Minty. No one recorded her exact birth date.", say: "Born into slavery." },
        { year: "Teens", title: "A blow to the head", tag: "fact", body: "An overseer threw a two-pound weight at another enslaved person, and it struck her. She had seizures and “sleeping spells” for the rest of her life.", say: "She was badly hurt." },
        { year: "Teens", title: "Dreams and visions", tag: "interpretation", body: "She had vivid dreams and visions, which she believed came from God. Historians say her confidence in God’s guidance made her fearless.", say: "She believed God spoke to her." },
        { year: "1840s", title: "Harriet Tubman", tag: "fact", body: "She married John Tubman, a free Black man, and took the name Harriet, perhaps after her mother.", say: "She married, and took a new name." },
        {
          year: "1849", title: "Escape", tag: "fact",
          body: "In the fall of 1849 she escaped alone, and made her way to Philadelphia and freedom.",
          quote: { text: "I grew up like a neglected weed,—ignorant of liberty, having no experience of it.", source: drew },
          say: "Then she ran.",
        },
      ],
      after: [
        { say: "She was free.", at: "top", mood: "moved" },
        { say: "But her family wasn’t.", mood: "tender", act: "settle" },
      ],
    },
    {
      kind: "timeline",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So she went back.", mood: "surprised", act: "hop" },
        { say: "Into the place she had escaped, again and again.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each step",
      phases: [
        { id: "back", label: "Going back", color: "#FFC72C" },
        { id: "free", label: "Free", color: "#A8DCD2" },
      ],
      events: [
        { year: "1850", title: "A harsher law", tag: "fact", body: "The Fugitive Slave Act made the North dangerous too: people who had escaped could be seized and returned.", say: "Then the law got worse." },
        { year: "1850–60", title: "Thirteen trips back", phase: "back", tag: "fact", body: "She returned to the Eastern Shore about 13 times, and led more than 70 people to freedom, many of them family and friends.", say: "She went back thirteen times." },
        { year: "1850s", title: "Guided by prayer", phase: "back", tag: "account", body: "She said God guided her, and that she would stop or change course when she felt God told her to.", say: "She trusted God to lead the way." },
        { year: "1850s", title: "On to Canada", phase: "free", tag: "fact", body: "Because of the new law, she guided people all the way to St. Catharines, Ontario, where she lived for a time.", say: "Some went all the way to Canada." },
        { year: "1859", title: "A home in Auburn", phase: "free", tag: "fact", body: "She bought a house in Auburn, New York, from Senator William H. Seward, and brought family there.", say: "And she made a home." },
      ],
      after: [
        { say: "Every trip, she risked being enslaved again.", at: "top", mood: "tender" },
        { say: "She went anyway.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        { when: "1862", tag: "fact", intensity: 0, text: "During the Civil War she went to South Carolina to work for the Union Army as a nurse, scout and spy.", say: "Then war came.", mood: "surprised", act: "settle" },
        { when: "June 1863", tag: "fact", intensity: 0, text: "She helped plan and lead a raid up the Combahee River, with Colonel James Montgomery and a regiment of Black Union soldiers.", say: "She helped lead a raid.", mood: "excited" },
        { tag: "fact", intensity: 0, text: "More than 750 enslaved people were freed.", say: "Over seven hundred people, free.", mood: "moved", act: "hop" },
        { tag: "fact", intensity: 0, text: "She is recognised as the first woman to lead an armed raid in U.S. military history.", say: "The first woman to do that.", mood: "excited", act: "nod" },
      ],
      after: [],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "She lived another fifty years after the war.", mood: "thinking" },
        { say: "Here she is around 1885, in Auburn.", mood: "moved", open: true },
      ],
      title: "Cabinet card",
      date: "Auburn, c. 1885",
      image: {
        src: later,
        alt: "Photograph of an older Black woman standing, in a long dark dress and shawl with a headscarf, hands clasped",
        credit: "Harriet Tubman, about 1885. Photo: H. Seymour Squyer, Auburn, New York. National Portrait Gallery. Public domain.",
      },
      focus: { x: 0.5, y: 0.25, scale: 2 },
      notes: [
        { tag: "legend", text: "Often said: 19 trips and 300 people. Those numbers come from an 1869 biography. Historians now say about 13 trips and more than 70 people." },
        { tag: "legend", text: "Often said: escape routes were hidden in quilt patterns. Historians have found no evidence for quilt codes." },
        { tag: "fact", text: "She couldn’t read or write. What we have of her words comes from people who interviewed her and wrote them down." },
      ],
      after: [
        { say: "The real numbers are smaller. The courage isn’t.", mood: "moved", open: false },
        { say: "Here’s what’s documented, and what’s legend.", show: "notes", mood: "curious", act: "tilt" },
        { say: "Seventy people, one at a time, through the dark. That’s plenty.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Two halves of one life.", mood: "thinking" },
        { say: "Look at them side by side.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "c. 1822–1849",
        items: ["Enslaved in Maryland", "Injured, and in pain for life", "Saw two sisters sold away in a chain gang"],
      },
      later: {
        label: "1849–1913",
        items: [
          "Led more than 70 people out of slavery",
          "Union nurse, scout and spy",
          "Opened a home for elderly Black people in Auburn",
          "Worked for women’s right to vote",
          "Died on 10 March 1913",
        ],
      },
      quote: { text: "I think slavery is the next thing to hell.", source: drew },
      note: "To her, faith and freedom weren’t separate stories. She trusted God, and she also planned carefully and took enormous risks.",
      after: [
        { say: "She didn’t just pray for freedom. She walked people into it.", mood: "moved" },
        { say: "Faith, for her, had feet.", mood: "happy", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Harriet Tubman",
      lines: [{ say: "That’s Harriet Tubman’s story.", mood: "thinking" }],
      check: {
        prompt: "What stands out to you most about her story?",
        options: [
          { text: "Faith that takes action.", reply: "Yes. She prayed, and then she walked.", mood: "happy", act: "nod" },
          { text: "Going back for others.", reply: "She was free, and she went back. Again and again.", mood: "moved", act: "nod" },
          { text: "Courage despite pain.", reply: "In pain her whole life, and still she went.", mood: "moved", act: "nod" },
          { text: "I want to think about it.", reply: "Take your time. It deserves it.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Who could you go back for?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "Harriet Tubman, c. 1822–1913",
      body: "The Lord is always closer than you think.",
      summary: [
        "Born into slavery in Maryland, she escaped to freedom in 1849.",
        "Trusting God to guide her, she went back about 13 times and led more than 70 people out.",
        "In the Civil War she helped free more than 750 people in a single raid.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "Yahweh said, “I have surely seen the affliction of my people who are in Egypt, and have heard their cry because of their taskmasters, for I know their sorrows.",
        ref: "Exodus 3:7",
        translation: WEB,
      },
      sources,
      related: [
        { title: "The man behind Amazing Grace", sub: "Testimony · John Newton", lessonId: "john-newton" },
        { title: "Why does God allow suffering?", sub: "Big question · 6 min", lessonId: "why-suffering" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
