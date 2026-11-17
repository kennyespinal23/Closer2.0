import type { Lesson } from "../lesson/types";

/* Church History: Why Did Christianity Split?
   Scrub a river through two thousand years and watch one stream divide (451, 1054, 1517). Then pull at the
   threads between East and West and live through 1054, 1204 and 1965. Post Luther's theses and hear three
   families of churches answer the two deeper questions in their own words. Last, lay their beliefs on a light
   table and see how much still lines up.

   Kept honest, line by line:
   - Orthodox, Catholic and Protestant views are each put the way their own members would put them, with the
     passages they lean on. No family is declared right; Page says so.
   - Chalcedon and the Oriental Orthodox churches are described fairly: they confess Jesus fully God and fully man,
     and disagreed over the wording.
   - What's uncertain is marked: 1054 wasn't felt as final at the time, and whether Luther actually nailed the
     theses to the door is debated (that he sent them to Archbishop Albert on 31 October 1517 is not).
   - Membership shares are a Pew Research Center estimate, cited as such.
   - Scripture is the World English Bible, word for word.
   - The reflection is optional, and nothing chosen in it is saved. */

const WEB = "World English Bible";

export const historySplit = {
  id: "history-split",
  title: "Why Did Christianity Split?",
  subtitle: "One church, then many: how it happened",
  kind: "Church history",
  scripture: "John 17 · Ephesians 4",
  minutes: 5,
  theme: "lapis",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "Why Did Christianity Split?", sub: "Church History · 5 min" },
      lines: [
        { say: "Catholic. Orthodox. Baptist. Lutheran. Coptic.", mood: "curious", act: "hop" },
        { say: "So many churches, all following Jesus. How?", mood: "thinking", act: "tilt" },
        { say: "Let’s go back to when there was one.", mood: "happy", act: "nod" },
      ],
      reply: "Take me back",
    },

    // 1. the river
    {
      kind: "hsplitRiver",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "This river is the church. It starts in Jerusalem.", mood: "curious", act: "nod" },
        { say: "Drag through time and watch where it divides.", mood: "happy", act: "tilt" },
      ],
      hint: "Drag through the years",
      stops: [
        { year: 33, label: "c. 33", title: "Pentecost", body: "The Spirit comes and the church is born in Jerusalem: one community, “of one heart and soul” (Acts 4:32).", say: "One church. Look how it begins." },
        { year: 381, label: "381", title: "The Nicene Creed", body: "Bishops from across the empire finish the Creed at Constantinople: one God, Father, Son and Holy Spirit.", say: "This Creed will matter later. Remember it." },
        { year: 451, label: "451", title: "Chalcedon", body: "A council says Jesus is one person in two natures, fully God and fully man. The Coptic, Ethiopian, Armenian and Syriac churches reject its wording. They also confess Jesus fully God and fully man; the quarrel was over how to say it.", say: "The first big branch: the Oriental Orthodox." },
        { year: 1054, label: "1054", title: "East and West", body: "The Greek-speaking East and the Latin-speaking West exchange excommunications. The two halves drift into the Orthodox and Catholic churches.", say: "The main stream divides in two." },
        { year: 1517, label: "1517", title: "The Reformation", body: "Martin Luther challenges the sale of indulgences. Protestant churches form: Lutheran, Reformed, Anglican, Anabaptist and more.", say: "And the West divides again." },
      ],
      today: { text: "About 2.2 billion Christians in 2010: roughly half Catholic, nearly four in ten Protestant, about one in eight Orthodox.", source: "Pew Research Center, Global Christianity (2011)" },
      after: [
        { say: "Three big splits. Let’s look closer at the biggest.", mood: "thinking", act: "nod" },
      ],
    },

    // 2. 1054
    {
      kind: "hsplitThreads",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "1054 didn’t come from nowhere.", mood: "thinking", act: "tilt" },
        { say: "Threads had been fraying for centuries. Tap each one.", mood: "curious", act: "nod" },
      ],
      hint: "Tap each thread",
      threads: [
        { id: "language", name: "Language", east: "Greek: the language of the New Testament and the great councils.", west: "Latin: by the 600s, few in the West could read Greek, and few in the East read Latin.", say: "They were reading each other in translation." },
        { id: "rome", name: "Rome", east: "The bishop of Rome is honoured first among equals. Big questions are settled by bishops together in council.", west: "The bishop of Rome is Peter’s successor, with authority over the whole church (Matthew 16:18).", say: "Who has the last word? The deepest thread." },
        { id: "filioque", name: "The Creed", east: "The Creed of 381 says the Spirit proceeds “from the Father.” No one should add to it without a council of the whole church.", west: "Churches in the West added “and the Son” (Latin: filioque), to say the Spirit comes from both.", say: "One word in the Creed, argued over for centuries." },
        { id: "practice", name: "Practice", east: "Leavened bread at the Lord’s Supper. Parish priests may marry.", west: "Unleavened bread. Over time, priests in the West were required to be unmarried.", say: "Small on their own. Together they felt big." },
      ],
      events: [
        { year: "1054", title: "Excommunications", body: "In Constantinople, Cardinal Humbert lays a papal excommunication on the altar of Hagia Sophia. Patriarch Michael Cerularius excommunicates the legates in return. At the time, many didn’t see it as final.", say: "The threads snap. Few knew it would last." },
        { year: "1204", title: "The sack of Constantinople", body: "Western crusaders of the Fourth Crusade plunder Constantinople, the great Christian city of the East. For many Orthodox, this, more than 1054, made the split real.", say: "This wound went deeper than any decree." },
        { year: "1965", title: "A first stitch", body: "Pope Paul VI and Patriarch Athenagoras lift the excommunications of 1054. The churches are still separate, but they now talk as brothers.", say: "Not one church again. But a thread, re-tied." },
      ],
      after: [
        { say: "So the East–West split was centuries in the making.", mood: "thinking", act: "nod" },
        { say: "Now to the West, five hundred years later.", mood: "curious", act: "tilt" },
      ],
    },

    // 3. 1517
    {
      kind: "hsplitDoor",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Wittenberg, Germany, 1517. A monk has had enough.", mood: "curious", act: "hop" },
        { say: "Tap the church door to post his 95 Theses.", mood: "cheeky", act: "tilt" },
      ],
      hint: "Tap the door",
      door: {
        title: "The 95 Theses",
        body: "Martin Luther, a monk and professor, objects to the selling of indulgences, which were said to lessen the punishment still due for sins already forgiven. He asks for a public debate.",
        note: "The famous story says he nailed them to the castle church door. Historians debate that; he certainly sent them to Archbishop Albert on 31 October 1517.",
        say: "It began with indulgences. It went much deeper.",
      },
      questions: [
        {
          q: "How is a person made right with God?",
          voices: [
            { family: "protestant", view: "By God’s grace alone, received through faith alone, because of Christ alone. Good works are the fruit of being saved, not the root.", leans: "Ephesians 2:8–9 · Romans 3:28", say: "Luther’s heart: faith alone." },
            { family: "catholic", view: "By God’s grace, received in faith and baptism. Grace truly makes us righteous within, and faith works through love. The Council of Trent (1545–63) set this out.", leans: "Galatians 5:6 · James 2:24", say: "Grace that changes you from the inside." },
            { family: "orthodox", view: "Salvation is union with God: by his grace we come to share in his life (theosis). We cooperate with that grace over a lifetime.", leans: "2 Peter 1:4", say: "Less a verdict, more a healing." },
          ],
        },
        {
          q: "Where does final authority lie?",
          voices: [
            { family: "protestant", view: "Scripture alone is the final authority. Creeds, councils and traditions are valued, but they are tested by Scripture.", leans: "2 Timothy 3:16–17", say: "Scripture judges everything else." },
            { family: "catholic", view: "Scripture and Sacred Tradition together, both from God, faithfully interpreted by the Church’s teaching office, the bishops with the pope.", leans: "2 Thessalonians 2:15", say: "Word and Tradition, held together." },
            { family: "orthodox", view: "Scripture lives inside Holy Tradition, the faith of the whole church, guarded by the councils and the bishops together.", leans: "2 Thessalonians 2:15", say: "Scripture, read within the church’s life." },
          ],
        },
      ],
      agreement: {
        title: "1999: an agreement",
        body: "Lutheran and Catholic leaders signed a Joint Declaration on Justification, saying they share “a consensus in basic truths” about it. Real differences remain.",
        say: "Five hundred years on, they found common ground.",
      },
      after: [
        { say: "Real differences, held by sincere Christians.", mood: "thinking", act: "nod" },
        { say: "I won’t pick a winner. But look what they share.", mood: "tender" },
      ],
    },

    // 4. what they share
    {
      kind: "hsplitShared",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Here’s what each family believes, on a sheet.", mood: "curious", act: "nod" },
        { say: "Lay all three on the light table.", mood: "happy", act: "tilt" },
      ],
      hint: "Tap each sheet to lay it down",
      beliefs: [
        { text: "One God: Father, Son and Holy Spirit", families: ["orthodox", "catholic", "protestant"] },
        { text: "Jesus is fully God and fully man", families: ["orthodox", "catholic", "protestant"] },
        { text: "He died for us and rose again", families: ["orthodox", "catholic", "protestant"] },
        { text: "The Nicene Creed of 381", families: ["orthodox", "catholic", "protestant"] },
        { text: "Baptism in the name of the Father, Son and Spirit", families: ["orthodox", "catholic", "protestant"] },
        { text: "Scripture is God’s word", families: ["orthodox", "catholic", "protestant"] },
        { text: "Seven sacraments", families: ["orthodox", "catholic"] },
        { text: "Asking the saints to pray for us", families: ["orthodox", "catholic"] },
        { text: "The pope leads the whole church", families: ["catholic"] },
        { text: "Icons honoured in worship", families: ["orthodox"] },
        { text: "Scripture alone as final authority", families: ["protestant"] },
      ],
      verses: [
        { text: "Not for these only do I pray, but for those also who will believe in me through their word, that they may all be one; even as you, Father, are in me, and I in you, that they also may be one in us; that the world may believe that you sent me.", ref: "John 17:20–21", translation: WEB },
        { text: "There is one body, and one Spirit, even as you also were called in one hope of your calling; one Lord, one faith, one baptism, one God and Father of all, who is over all, and through all, and in us all.", ref: "Ephesians 4:4–6", translation: WEB },
      ],
      after: [
        { say: "The night before the cross, Jesus prayed for you.", mood: "moved", act: "nod" },
        { say: "That all who believe would be one.", mood: "tender" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "Christians from other churches: how do you see them?",
      options: [
        { text: "As family I don’t know well yet", reply: "Family is a good word. Ephesians says one body." },
        { text: "I’m honestly not sure", reply: "That’s fair. Learning their story is a good start." },
        { text: "I’d like to understand them better", reply: "Try visiting a different service sometime." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "One river, many streams",
      body: "",
      summary: [
        "The church began as one. It divided most at 451, 1054 and 1517.",
        "East and West split over authority, the Creed and centuries of distance.",
        "The Reformation asked how we’re made right with God, and who has the final word.",
        "They still share the Creed, the Trinity, and Jesus fully God and fully man.",
      ],
      refs: ["John 17:20–21", "Ephesians 4:4–6", "Acts 4:32", "Ephesians 2:8–9", "Galatians 5:6", "2 Timothy 3:16–17"],
      sources: [
        { title: "Global Christianity: A Report on the Size and Distribution of the World’s Christian Population", publisher: "Pew Research Center, 2011" },
        { title: "Joint Catholic–Orthodox Declaration of Pope Paul VI and Patriarch Athenagoras I", publisher: "7 December 1965" },
        { title: "Joint Declaration on the Doctrine of Justification", publisher: "Lutheran World Federation and the Catholic Church, 1999" },
      ],
      related: [
        { title: "If Jesus Is God, Who Was He Praying To?", sub: "Christian Theology · 5 min", lessonId: "theology-praying" },
        { title: "How Did We Get the Bible?", sub: "Church History · 5 min", lessonId: "history-bible" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
