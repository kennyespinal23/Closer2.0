/**
 * Short editorial blurbs for the book overview screen's "About"
 * section. Every canonical book has an entry — adding a book here
 * is what makes the section render on the detail screen.
 *
 * Style guide for blurbs:
 *   • 2–3 sentences max — the screen has other sections to breathe
 *   • Present tense, plainspoken, not preachy
 *   • Set up *what* the book is, *who* it speaks to, and a hint of
 *     *why it matters* — without spoiling the story or sermonizing
 *   • Avoid theology jargon a new reader would have to look up;
 *     reach for concrete images instead
 */

const BLURBS: Record<string, string> = {
  // ─── The Law ──────────────────────────────────────────────────
  genesis:
    "The first book of the Bible. Beginnings of the world, of humanity, and of the family God chooses to bless every nation through. Reads like a slow, patient origin story for everything that follows.",
  exodus:
    "God rescues Israel from slavery in Egypt and shapes them into a people at Sinai. The book gives us the Passover, the parting of the sea, the Ten Commandments, and the strange beauty of God choosing to dwell among ordinary people.",
  leviticus:
    "Worship instructions for a people learning to live near a holy God. The detail can feel foreign, but the question underneath is universal — what does it take to be at home with God?",
  numbers:
    "Israel in the wilderness — a generation poised between rescue and promise, learning to walk by faith. Plenty of names and counts, and some of the most honest pictures in Scripture of how slowly trust actually grows.",
  deuteronomy:
    "Moses' last sermons before Israel enters the promised land. The whole book is a call to remember — what God has done, who he is, and how love for him reshapes every corner of daily life.",

  // ─── Historical Books ─────────────────────────────────────────
  joshua:
    "Israel enters the land God promised them, one battle and one boundary at a time. Underneath the conquest story sits a quieter question: will the next generation actually hold on to faith?",
  judges:
    "Cycles of forgetting and rescue, with God raising up unlikely leaders to deliver his people. A hard, honest book — the heroes are flawed and the moral landscape grows darker as it goes.",
  ruth:
    "A widow, a foreigner, and the quiet kindness of an ordinary man during a brutal era. A short story about loyalty and providence — and a great-grandmother to a king.",
  "1-samuel":
    "Israel asks for a king, gets Saul, and slowly meets the shepherd boy God has been preparing all along. Friendship, ambition, jealousy, and the long apprenticeship of David.",
  "2-samuel":
    "David's reign in full — its glory and its grief. The book that shows what it costs to be a man after God's own heart who is also, painfully, just a man.",
  "1-kings":
    "Solomon's golden years and the slow fracture that follows him. Two kingdoms, two fading thrones, and Elijah on the mountain reminding everyone who actually holds the power.",
  "2-kings":
    "Israel and Judah unravel under one disappointing king after another, with Elijah and Elisha pressing them to remember God. Ends in exile — a sober warning that gets reframed centuries later as the long road back home.",
  "1-chronicles":
    "A second look at Israel's history, written for the generation rebuilding after exile. The focus is David, the temple, and the deep continuity of God's promises across generations.",
  "2-chronicles":
    "Solomon, the temple, and the long line of kings traced through Judah down to the fall of Jerusalem. Hope is harder to see here — until the very last verses, where it suddenly is.",
  ezra:
    "After decades in exile, a remnant comes home and rebuilds the temple. Less about the architecture than about the slow work of recovering identity and worship.",
  nehemiah:
    "A cupbearer in a foreign court asks for leave to go rebuild Jerusalem's walls. A study in prayer, leadership, and the unglamorous work of restoration.",
  esther:
    "A Jewish girl becomes queen of Persia and risks her life to save her people. God is never mentioned by name — and yet he is the unmistakable hand turning every page.",

  // ─── Wisdom & Poetry ──────────────────────────────────────────
  job: "When a righteous man loses everything, he and his friends try to make sense of his suffering. The book ends with God's own answer — not a why, but a who. One of the oldest stories in Scripture, and still one of the most honest.",
  psalms:
    "Israel's prayer book and hymnal. Songs of praise, lament, anger, gratitude, and quiet trust — the full range of life turned Godward. Meant to be read out loud, often.",
  proverbs:
    "Practical wisdom for ordinary life — how to speak honestly, work faithfully, raise children, and keep your soul soft. Compact, memorable, and meant to be returned to.",
  ecclesiastes:
    "A teacher looks at every pursuit under the sun and asks if any of it lasts. The honesty is bracing; the conclusion is surprisingly hopeful.",
  "song-of-solomon":
    "Hebrew love poetry, frank and tender. Read for centuries as a portrait of human love at its best, and as a picture of the love between God and his people.",

  // ─── Major Prophets ───────────────────────────────────────────
  isaiah:
    "The grand prophet — judgment, comfort, and some of the clearest glimpses of the coming Christ. Long, but worth slowing down for: this book shaped Jesus' own self-understanding.",
  jeremiah:
    "A prophet who weeps as he warns. Decades of pleading with a people who won't listen, and the promise of a new covenant written on the heart instead of on stone.",
  lamentations:
    "Five poems mourning the fall of Jerusalem. Bracing in its sorrow, and quietly anchored in the line at the center: God's mercies are new every morning.",
  ezekiel:
    "Visions, signs, and bone-dry valleys — Ezekiel speaks from exile in language that still feels strange and alive. The God who seemed lost to the temple turns out to be present in Babylon too.",
  daniel:
    "Four young men keep their faith in a foreign court, then four visions sweep across empires that haven't yet come. A book about trust under pressure and the kingdom that outlasts every kingdom.",

  // ─── Minor Prophets ───────────────────────────────────────────
  hosea:
    "God tells a prophet to marry a woman who keeps leaving — a living parable of his own love for Israel. A book about heartbreak that won't give up.",
  joel: "Locusts strip a country bare, and a prophet reads the disaster as a call to return. Famous for the promise Peter quoted at Pentecost: God will pour out his Spirit on all flesh.",
  amos: "A shepherd from Tekoa speaks plain words about wealth, worship, and the kind of justice God actually wants. One of the sharpest social-conscience books in all of Scripture.",
  obadiah:
    "The Bible's shortest book — one chapter, one nation, one verdict. A warning to those who watch their neighbor suffer and do nothing.",
  jonah:
    "A prophet runs from God, gets swallowed by a fish, finally preaches — and is furious when his enemies actually repent. The book asks whether mercy bothers us.",
  micah:
    "Judgment and hope braided together in seven short chapters. Home to one of the cleanest summaries of the religious life ever written: do justice, love mercy, walk humbly with your God.",
  nahum:
    "A pronouncement against Nineveh — the city Jonah once watched repent. A bracing reminder that mercy has limits and tyrants don't last forever.",
  habakkuk:
    "The prophet does what most of us only think — argues with God about why evil prospers. The answer isn't easy, but the song he sings at the end is one of the great prayers of trust in Scripture.",
  zephaniah:
    "A short, fierce book — judgment giving way to a startling picture of God singing over his people. Hope, when it comes, comes from him.",
  haggai:
    "Two months of urgent preaching: rebuild the temple, finish what you started. Small in scale, large in its insistence that priorities reshape everything else.",
  zechariah:
    "Visions, oracles, and unmistakable glimpses of the coming Messiah — entering Jerusalem on a donkey, pierced for our transgressions, reigning forever. The Old Testament's clearest postcards from the future.",
  malachi:
    "The last word of the Old Testament — God reasoning with a tired, cynical people. Ends pointing forward, to a messenger who will prepare the way.",

  // ─── Gospels ──────────────────────────────────────────────────
  matthew:
    "The first Gospel — Jesus as the long-awaited king who fulfills Israel's story. Written for a Jewish audience, with five great teaching blocks that anchor the whole narrative.",
  mark: "The shortest Gospel, urgent and lean. Jesus moves fast through Galilee and on to Jerusalem — the cross is in view from the first chapter.",
  luke: "Jesus told through the eyes of an outsider, written for everyone the world tends to overlook. Some of the most beloved parables sit only here.",
  john: "The most reflective Gospel. Seven signs, seven 'I am' sayings, and a Jesus who speaks slowly enough that you can sit with each word.",

  // ─── Acts ─────────────────────────────────────────────────────
  acts: "Luke's sequel — what the risen Jesus keeps doing through his Spirit and his people. The church is born, the gospel spreads, and Paul's missionary journeys carry it to the ends of the empire.",

  // ─── Pauline Epistles ─────────────────────────────────────────
  romans:
    "Paul's most systematic letter — the gospel laid out in full. Human brokenness, God's righteousness, life in the Spirit, and a future that holds.",
  "1-corinthians":
    "A letter to a young church in a complicated city. Paul addresses divisions, sexuality, worship, spiritual gifts, the resurrection — and gives us the great chapter on love along the way.",
  "2-corinthians":
    "Paul's most personal letter — a defense of his ministry, a window into his suffering, and a working theology of weakness as the place God's power shows up best.",
  galatians:
    "Paul's sharpest letter, written to churches drifting back toward law-keeping. The gospel of grace, defended in a hurry — and the freedom that follows when you stop trying to earn it.",
  ephesians:
    "The cosmic shape of the gospel: God's eternal plan to gather all things in Christ. Half theology, half a deeply practical guide to life together in his church.",
  philippians:
    "A thank-you letter from a prison cell, full of joy. Paul writes about contentment, humility, and the mind of Christ to a church that has loved him well.",
  colossians:
    "A short, dense letter on the supremacy of Christ. He is before all things; in him all things hold together — and the Christian life is rooted in who he is, not what we try to add to him.",
  "1-thessalonians":
    "Paul's tender letter to a young church he had to leave too soon. Encouragement, instructions for daily life, and one of the New Testament's earliest pictures of Christ's return.",
  "2-thessalonians":
    "A quick follow-up — keep working, keep waiting, don't be shaken by rumors that the day of the Lord has already come. Steady hands for a rattled congregation.",
  "1-timothy":
    "Paul writes a young pastor in Ephesus about church order, sound teaching, money, and the long shape of a faithful life. Mentor to apprentice, in plain ink.",
  "2-timothy":
    "Paul's final letter — written from death row, addressed to a son in the faith. Charge after charge to hold the gospel, finish the race, and pass it on.",
  titus:
    "A short pastoral letter to Titus on Crete — how to plant healthy churches in difficult ground. Sound doctrine produces sound lives; the two go together.",
  philemon:
    "A single-chapter letter Paul writes asking a friend to receive back a runaway slave as a brother in Christ. The gospel applied to one real person, in one real relationship, under real pressure.",

  // ─── General Epistles ─────────────────────────────────────────
  hebrews:
    "An anonymous sermon-letter showing Christ as the fulfillment of every Old Testament thread — priest, sacrifice, covenant, rest. Written for believers tempted to drift back to the familiar.",
  james:
    "Practical, direct, almost wisdom-literature in feel. Faith without works is dead — and most of the chapters work out what that actually looks like Monday through Friday.",
  "1-peter":
    "A pastoral letter to scattered, suffering Christians, written by a man who knew something about both. Identity, hope, and grace for the long road of exile.",
  "2-peter":
    "Peter's last letter, alert to false teachers and the slow erosion of confidence in Christ's return. A call to grow, to remember, and to wait well.",
  "1-john":
    "Plain words about light, love, and assurance. Written so we may know we have eternal life — and recognize what real faith looks like in real relationships.",
  "2-john":
    "A one-page note to a church about love and truth — and the line between hospitality and harboring what unmakes the gospel.",
  "3-john":
    "A short personal letter from John to a friend named Gaius — about Christian hospitality, faithful workers, and the quiet weight of doing good.",
  jude: "A single chapter warning against teachers who twist grace into license. Short, urgent, and ending in one of the most beautiful benedictions in the New Testament.",

  // ─── Apocalyptic ──────────────────────────────────────────────
  revelation:
    "A vision given to John on the island of Patmos — apocalyptic poetry about Christ's victory, the church's suffering, and the world made new.",
};

export function getBookBlurb(bookId: string): string | null {
  return BLURBS[bookId] ?? null;
}

export function hasBookBlurb(bookId: string): boolean {
  return getBookBlurb(bookId) !== null;
}
