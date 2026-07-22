/**
 * Editorial blurbs + one-line themes for the book overview
 * screen. Every canonical book has an entry — adding a book
 * here is what makes the About section (and theme line)
 * render on the detail screen.
 *
 * `about` — 2–4 sentences for the About card.
 * `theme` — one-line italic subtitle under the book title.
 *
 * Source: closer_bible_books.json (editorial refresh).
 */

export type BookBlurb = {
  about: string;
  theme: string;
};

const BLURBS: Record<string, BookBlurb> = {
  // ─── The Law ───────────────────────────────────────────
  "genesis": {
    about: "Genesis covers the creation of the world, the fall of humanity and the beginning of God's plan to fix it. It follows the first families — Adam and Eve, Noah, Abraham, Isaac, Jacob and Joseph — tracing how one man's faith became the foundation for an entire nation. It's a book about beginnings, about broken people, and about a God who keeps showing up anyway.",
    theme: "The story of everything that went wrong and the God who didn't walk away.",
  },
  "exodus": {
    about: "Exodus follows the Israelites from slavery in Egypt to the foot of Mount Sinai. Moses leads them out through a series of plagues, a dramatic crossing of the Red Sea and forty years of desert wandering. It's also where God gives his people the Ten Commandments and the blueprint for how they will worship him. A book about freedom, identity and learning to trust a God you're still getting to know.",
    theme: "The story of a people who were trapped and the God who came down to get them out.",
  },
  "leviticus": {
    about: "Leviticus is a book of laws given to the Israelites at Sinai covering sacrifices, priestly duties, purity laws and the festivals that shaped their calendar. At its center is the Day of Atonement — the one day a year the high priest entered the most sacred space to make things right between God and the entire nation. It's less about rules and more about access.",
    theme: "The rulebook that was actually about something bigger than rules.",
  },
  "numbers": {
    about: "Numbers follows the Israelites through forty years in the desert between Egypt and the promised land. It includes two censuses, a series of rebellions and their consequences, and the slow dying off of one generation while another grows up ready to enter what was promised. A book about consequences, patience and a God who doesn't abandon his people even when they deserve it.",
    theme: "Forty years of wandering and the God who stayed the whole time.",
  },
  "deuteronomy": {
    about: "Deuteronomy is Moses's farewell speech to Israel on the edge of the promised land. He retells the law, reviews the history and sets before the people the choice that every generation has to make — obedience and life, or disobedience and its consequences. He dies on a mountaintop with a view of everything he spent his life working toward but never entered.",
    theme: "A dying man's final plea to the people he spent his life leading.",
  },
  // ─── Historical Books ──────────────────────────────────
  "joshua": {
    about: "Joshua follows Israel's entry into Canaan under their new leader after Moses's death. It covers the miraculous crossing of the Jordan River, the fall of Jericho, a series of military campaigns and the division of the land among the twelve tribes. It ends with Joshua's famous challenge: choose today who you will serve.",
    theme: "What happens when someone finally stops being afraid and does what they were called to do.",
  },
  "judges": {
    about: "Judges covers the period between Joshua's death and the establishment of the monarchy — about three hundred years of Israel cycling through obedience, idolatry, oppression and rescue. The judges include Deborah, Gideon, Samson and others. The book ends in darkness with two stories that show just how far things can fall when everyone does what is right in their own eyes.",
    theme: "The same mistake made seventeen times and the grace that kept showing up anyway.",
  },
  "ruth": {
    about: "Ruth is set during the time of the judges. A Moabite woman named Ruth follows her widowed Israelite mother-in-law Naomi back to Bethlehem after both their husbands die. Ruth ends up working in the fields of a man named Boaz, a relative of Naomi's late husband. Their story of redemption and loyalty eventually places Ruth in the direct family line of King David — and Jesus.",
    theme: "A short story about loyalty, loss and the way ordinary faithfulness changes everything.",
  },
  "1-samuel": {
    about: "First Samuel covers the transition from judges to monarchy in Israel. It follows the prophet Samuel, the rise and fall of King Saul and the early life of David — from his anointing as a teenager through his years as a fugitive running from a king who wanted him dead. A book about leadership, jealousy, loyalty and what it means to be a person after God's own heart.",
    theme: "A boy, a giant and a king who had everything but couldn't hold onto it.",
  },
  "2-samuel": {
    about: "Second Samuel covers David's reign over all of Israel — his military victories, the extraordinary promise God makes to him about an eternal dynasty, his catastrophic sin with Bathsheba and its consequences, and the rebellion of his own son Absalom. It's a book about power, failure, consequence and the stubborn persistence of God's purposes through deeply flawed people.",
    theme: "The king who had everything, lost it all and still found his way back.",
  },
  "1-kings": {
    about: "First Kings covers Solomon's reign — the building of the temple, his legendary wisdom, his eventual drift into idolatry — followed by the split of the kingdom after his death. The northern kingdom of Israel and the southern kingdom of Judah go their separate ways. The book ends with the prophet Elijah confronting King Ahab and his wife Jezebel over their systematic corruption of the nation.",
    theme: "A kingdom at its greatest height and the slow drift that brought it down.",
  },
  "2-kings": {
    about: "Second Kings covers the fall of both the northern kingdom of Israel, conquered by Assyria in 722 BC, and the southern kingdom of Judah, conquered by Babylon in 586 BC. In between there are moments of reform under kings like Hezekiah and Josiah and stories of the prophets Elisha and Isaiah. The book ends with Jerusalem destroyed, the temple burned and the people in exile.",
    theme: "What happens to a nation that keeps choosing the wrong thing, one generation at a time.",
  },
  "1-chronicles": {
    about: "First Chronicles begins with nine chapters of genealogies tracing Israel's history from Adam, then covers the reign of David with a focus on his preparation for the temple, the organization of worship and his final instructions to Solomon. It was written after the Babylonian exile to remind the returning community of their identity and what they were called to build.",
    theme: "The same history told again — because some stories are worth telling twice.",
  },
  "2-chronicles": {
    about: "Second Chronicles covers Solomon's reign and the dedication of the temple, then follows the kings of Judah through centuries of rising and falling faithfulness. It includes the great revivals under Hezekiah and Josiah, the fall of Jerusalem and the exile to Babylon. The book ends with the Persian king Cyrus permitting the Jewish exiles to return home and rebuild.",
    theme: "The temple built, the kingdom at its peak and the long road back from the bottom.",
  },
  "ezra": {
    about: "Ezra covers the return of Jewish exiles from Babylon to Jerusalem and the rebuilding of the temple. It follows two waves of return — one led by Zerubbabel and a later one by Ezra himself, a priest and scholar who devoted himself entirely to teaching God's law. The book deals honestly with the difficulty of starting over and the painful reforms required to do it right.",
    theme: "The people came home. Starting over turned out to be harder than leaving.",
  },
  "nehemiah": {
    about: "Nehemiah follows a Jewish official in the Persian court who returns to Jerusalem to rebuild its broken walls. He faces opposition, intimidation and internal conflict but completes the wall in 52 days. The book continues with the public reading of the law, the renewal of the covenant and Nehemiah's second return to Jerusalem after finding the community had already slipped back into old patterns.",
    theme: "A man who heard bad news, wept, and then got up and fixed it.",
  },
  "esther": {
    about: "Esther is set in the Persian court of King Ahasuerus. A Jewish woman named Esther becomes queen and her cousin Mordecai uncovers a plot by a royal official named Haman to exterminate every Jewish person in the empire. At the risk of her own life Esther intervenes. The plot is reversed, Haman is executed and the Jewish people are saved. The events are still celebrated today as the Jewish festival of Purim.",
    theme: "A woman who was in the right place at the right time and chose not to waste it.",
  },
  // ─── Wisdom & Poetry ───────────────────────────────────
  "job": {
    about: "Job is a man described as blameless and upright who loses everything — his wealth, his children and his health — in a series of catastrophic events. Three friends arrive to comfort him and spend most of the book insisting he must have done something to deserve it. Job refuses to accept their explanation and demands to speak directly to God. God shows up in a whirlwind. The book never fully explains why it happened. That's the point.",
    theme: "The most honest conversation about suffering ever written.",
  },
  "psalms": {
    about: "Psalms is a collection of 150 songs and prayers written over hundreds of years by multiple authors — David wrote many of them, others were written by temple musicians, priests and anonymous poets. They were used in worship at the temple in Jerusalem and cover the full range of human experience — grief, gratitude, rage, wonder, despair and joy. The most quoted book in the New Testament.",
    theme: "Every emotion you've ever felt — someone already brought it to God.",
  },
  "proverbs": {
    about: "Proverbs is a collection of wisdom sayings mostly attributed to Solomon, covering money, relationships, speech, work, humility, integrity and dozens of other areas of practical life. It opens by establishing the foundation: the fear of the Lord is the beginning of wisdom. Everything else in the book builds on that. It closes with a portrait of a woman whose life is the embodiment of wisdom in action.",
    theme: "Wisdom for the people who learn the hard way — which is everyone.",
  },
  "ecclesiastes": {
    about: "Ecclesiastes is written by a teacher — traditionally Solomon — who uses his wealth and wisdom to test everything life has to offer. His conclusion after extensive experimentation: it is all vapor, like chasing the wind. Not because life is worthless but because nothing under the sun ultimately satisfies the deepest human longing. The book ends by pointing to the one thing that does.",
    theme: "A man who tried everything and finally found what actually mattered.",
  },
  "song-of-solomon": {
    about: "Song of Solomon is a collection of love poems exchanged between two lovers celebrating physical attraction, longing, beauty and the power of committed love. It has been read as both a celebration of human love and a picture of God's love for his people. The most famous line: love is as strong as death. Many waters cannot quench it.",
    theme: "A love poem that made it into the Bible and never apologized for it.",
  },
  // ─── Major Prophets ────────────────────────────────────
  "isaiah": {
    about: "Isaiah prophesied in Jerusalem during the 8th century BC, warning both Israel and Judah of coming judgment while also carrying extraordinary promises of restoration. Chapter 53 describes the suffering servant in terms so specific that the early Christians immediately recognized Jesus in it — written seven hundred years before the crucifixion. The book moves from judgment to comfort, ending with visions of a new creation.",
    theme: "Warnings, comfort and the most detailed portrait of Jesus written before he was born.",
  },
  "jeremiah": {
    about: "Jeremiah prophesied in Jerusalem during its final decades before the Babylonian invasion. His message — surrender to Babylon or be destroyed — made him deeply unpopular with kings, priests and false prophets. He lived to see everything he warned about come true. His book contains some of the most personal and raw passages in all the prophets, including his famous promise of a new covenant God would write on human hearts.",
    theme: "The prophet nobody listened to and the God who kept sending him anyway.",
  },
  "lamentations": {
    about: "Lamentations is five poems written in the immediate aftermath of Jerusalem's destruction in 586 BC. Three are written as acrostics — each verse beginning with a successive letter of the Hebrew alphabet, a literary structure that tries to contain overwhelming grief within form. In chapter 3 the writer arrives at a statement that has anchored people through suffering for thousands of years: his mercies are new every morning.",
    theme: "What grief sounds like when it refuses to pretend everything is fine.",
  },
  "ezekiel": {
    about: "Ezekiel is a priest who prophesies to the Jewish exiles in Babylon. His book contains elaborate visions, dramatic symbolic acts and detailed prophecies about judgment on Israel and surrounding nations — and extraordinary promises of restoration. The valley of dry bones is one of the most famous images in all of scripture. The book ends with a vision of a new temple and a city whose name means: the Lord is there.",
    theme: "The strangest book in the Bible and the most radical promise in it.",
  },
  "daniel": {
    about: "Daniel follows a young Jewish man taken to Babylon who rises to prominence in the royal court while maintaining his faith under repeated pressure to abandon it. The book includes the stories of the fiery furnace, the lions' den and a series of prophetic visions about world empires and the coming of one like a son of man. Half narrative, half prophecy — all about faithfulness in a foreign place.",
    theme: "Four people who decided who they were before the pressure arrived.",
  },
  // ─── Minor Prophets ────────────────────────────────────
  "hosea": {
    about: "Hosea prophesied to the northern kingdom of Israel during a period of prosperity and spiritual unfaithfulness. God instructs him to marry Gomer, who leaves him for other men — a living parable of Israel's unfaithfulness to God. Despite everything Hosea is told to take her back, just as God keeps pursuing Israel. The book ends with one of the most tender invitations to return in the entire Old Testament.",
    theme: "God loved a people who kept leaving and kept coming back for them anyway.",
  },
  "joel": {
    about: "Joel is a short prophetic book responding to a devastating locust plague that stripped the land bare. Joel calls the nation to repentance and uses the plague as a picture of the coming day of the Lord. But in chapter 2 the tone shifts — God promises to restore the years the locusts have eaten and to pour out his Spirit on all people. This passage is quoted by Peter on the day of Pentecost.",
    theme: "A disaster that became the setup for the most important promise in the prophets.",
  },
  "amos": {
    about: "Amos is a shepherd from Judah called to prophesy in the northern kingdom of Israel during a period of great prosperity. His message: the economic success is built on the exploitation of the poor, and God cares more about justice than about religious performance. Let justice roll on like a river — righteousness like a never-failing stream. His words are as relevant now as they were then.",
    theme: "A farmer who showed up at the king's church and said what nobody wanted to hear.",
  },
  "obadiah": {
    about: "Obadiah is the shortest book in the Old Testament — 21 verses directed entirely at Edom, the nation descended from Esau. When Babylon destroyed Jerusalem the Edomites stood by, blocked the escape routes and handed over survivors. God's verdict through Obadiah: as you have done it will be done to you. The book ends with a promise that Israel will be restored.",
    theme: "The shortest book and one of the most direct: what you do to others comes back around.",
  },
  "jonah": {
    about: "Jonah is a prophet called to warn the city of Nineveh — Israel's most feared enemy — of coming judgment. He refuses, boards a ship heading the opposite direction, is thrown overboard in a storm and swallowed by a large fish. After three days he is released and goes to Nineveh, where his minimal sermon produces the largest recorded response in the Old Testament. He is furious. The book ends with God's question still hanging in the air.",
    theme: "The prophet who ran the wrong way and found out you can't outrun grace.",
  },
  "micah": {
    about: "Micah prophesied in Judah during the same period as Isaiah, addressing both the northern and southern kingdoms. He condemns corrupt leaders, false prophets and economic injustice with a farmer's directness. He also contains a specific prophecy naming Bethlehem as the birthplace of a coming ruler — quoted by the chief priests when Herod asks where the Messiah was to be born.",
    theme: "What does God actually want from you — it's three things and they're simpler than you think.",
  },
  "nahum": {
    about: "Nahum is a single oracle against Nineveh, the capital of the Assyrian empire, written about a century after Jonah's successful mission there. Assyria had returned to violence and become the dominant world power. Nahum's prophecy describes their destruction in vivid military detail. In 612 BC Nineveh was destroyed by a coalition of Babylonians and Medes, fulfilling the prophecy precisely.",
    theme: "Justice is slow but it's coming — the book that proved it.",
  },
  "habakkuk": {
    about: "Habakkuk is a short prophetic book structured as a dialogue between the prophet and God. Habakkuk complains about injustice, God responds that he is raising up Babylon to deal with it, Habakkuk complains again that this seems worse. God's final answer: the righteous will live by faith. The book ends with a prayer that shakes the earth and a closing declaration of joy in the absence of everything that usually produces it.",
    theme: "The prophet who argued with God and ended up with the most defiant faith in the Bible.",
  },
  "zephaniah": {
    about: "Zephaniah prophesied in Judah during the reign of King Josiah, before the great religious reform. He warns of the coming day of the Lord in some of the most intense language in any prophet. But the book ends with a vision of restoration and the remarkable promise that God himself will rejoice over his people with singing — one of the only times in scripture where God is described as singing.",
    theme: "The warning and the promise — and the God who sings over his people.",
  },
  "haggai": {
    about: "Haggai is one of the shortest prophetic books — two chapters written in 520 BC to encourage the returned exiles to restart the temple construction that had stalled for nearly two decades. Through the governor Zerubbabel and the high priest Joshua, Haggai challenges the people to prioritize what matters most. They respond immediately. The temple is completed four years later.",
    theme: "Stop building your own house while God's lies in ruins — a two-chapter challenge.",
  },
  "zechariah": {
    about: "Zechariah prophesied alongside Haggai to encourage the returned exiles completing the temple. His book contains eight night visions, a series of symbolic acts and two collections of oracles. It includes prophecies about a coming king who is lowly and riding a donkey, a shepherd valued at thirty pieces of silver and the one who is pierced — all fulfilled in specific detail during the last week of Jesus's life.",
    theme: "Visions, promises and the most specific preview of Jesus's final week in the Old Testament.",
  },
  "malachi": {
    about: "Malachi is the last of the Old Testament prophets, writing to a community that has returned from exile, rebuilt the temple and resumed religious practice — but whose hearts aren't in it. God's indictment covers corrupt priests, broken marriages and withheld tithes. The book ends with the promise of a messenger like Elijah who will come before the great day of the Lord. Jesus will later identify John the Baptist as this messenger.",
    theme: "The last word before four hundred years of silence — and what it said.",
  },
  // ─── Gospels ───────────────────────────────────────────
  "matthew": {
    about: "Matthew is the most Jewish of the four Gospels, written to show how Jesus fulfills the promises of the Old Testament. It includes the Sermon on the Mount — the longest continuous teaching of Jesus — as well as extensive parables, healing accounts and confrontations with religious leaders. It ends with the resurrection and the Great Commission: go and make disciples of all nations.",
    theme: "The Jewish Gospel — written to show that everything that was promised finally arrived.",
  },
  "mark": {
    about: "Mark is the shortest and most fast-paced of the four Gospels, likely written first and used as a source by Matthew and Luke. It begins with Jesus as an adult and moves rapidly through his ministry, using the word immediately more than any other Gospel. Mark emphasizes Jesus's actions — healings, exorcisms, miracles — over his teaching. It ends abruptly with women fleeing an empty tomb, afraid.",
    theme: "The fastest Gospel — no backstory, just Jesus moving.",
  },
  "luke": {
    about: "Luke is the most literary of the Gospels, written by a physician and historian who carefully investigated eyewitness accounts. It gives the most detailed birth narrative, the most extensive account of Jesus's journey to Jerusalem and unique parables about grace and lostness — the prodigal son, the good Samaritan, the lost sheep. Luke continues in the book of Acts, making them a two-volume work.",
    theme: "The Gospel that made sure nobody felt like they were too far outside to belong.",
  },
  "john": {
    about: "John is the most theological of the four Gospels, written by one of Jesus's closest friends. It opens by declaring Jesus to be the eternal Word of God who became flesh. It is structured around seven miraculous signs and seven I am statements — I am the bread of life, the light of the world, the resurrection and the life. It includes the most famous verse in the Bible: for God so loved the world.",
    theme: "Written so you would believe — whoever you are, wherever you're starting from.",
  },
  // ─── Acts ──────────────────────────────────────────────
  "acts": {
    about: "Acts is the second volume of Luke's work, picking up where the Gospel leaves off with the ascension of Jesus and continuing through the spread of the early church. It covers Pentecost, the conversion of Paul, the first missionary journeys, the Jerusalem council and Paul's final journey to Rome. It is the only historical account of the earliest decades of Christianity.",
    theme: "What happened after the resurrection — and it's more surprising than you'd expect.",
  },
  // ─── Pauline Epistles ──────────────────────────────────
  "romans": {
    about: "Romans is Paul's most systematic letter, written to the church in Rome before his first visit. It establishes that all people are under the power of sin, that salvation comes through faith in Jesus rather than religious performance, that nothing can separate believers from God's love and that transformed lives are the natural result of the gospel. Chapters 1-11 are theology. Chapters 12-16 are what that theology looks like on a Tuesday.",
    theme: "The most complete explanation of the gospel ever written — in one letter.",
  },
  "1-corinthians": {
    about: "First Corinthians is written to a divided and troubled church in the port city of Corinth. Paul addresses a series of specific problems reported to him — factions, sexual immorality, lawsuits between believers, marriage questions, food offered to idols and disorder in worship. In the middle of it he writes chapter 13 — the famous love passage — and chapter 15, the most extended argument for the resurrection in the New Testament.",
    theme: "A letter to a church that had real problems — and the answers that still apply.",
  },
  "2-corinthians": {
    about: "Second Corinthians is Paul's most personal letter, written in response to continued challenges to his authority in Corinth. He defends his ministry not with impressive qualifications but with a catalogue of his suffering. The letter contains the famous passage about the thorn in the flesh, God's response that grace is sufficient and Paul's paradox: when I am weak then I am strong.",
    theme: "The most personal letter Paul ever wrote — and the most honest about what ministry actually costs.",
  },
  "galatians": {
    about: "Galatians is written to a group of churches in the region of Galatia who have been told by visiting teachers that Gentile Christians must also be circumcised and follow Jewish law to be truly saved. Paul's response is the clearest statement of justification by faith alone in his letters. It is for freedom that Christ has set us free. The letter closes with the fruit of the Spirit — the natural result of a life led by grace.",
    theme: "The letter Paul wrote angry — and why every word of it still matters.",
  },
  "ephesians": {
    about: "Ephesians is written from prison to the church at Ephesus and is one of the most theologically rich letters in the New Testament. The first half establishes the identity of believers — chosen, adopted, sealed with the Spirit, raised with Christ — while the second half turns practical, covering unity, speech, relationships and the famous armor of God passage. It is sometimes described as the Mount Everest of Paul's letters.",
    theme: "What you have, who you are and how to live — in six chapters.",
  },
  "philippians": {
    about: "Philippians is written from prison to a church Paul loves deeply — the first church he planted in Europe. Despite his circumstances the letter radiates joy. Paul declares that to live is Christ and to die is gain, describes the humility of Jesus as the model for Christian community and famously says he has learned to be content in all circumstances. The peace of God which transcends all understanding is promised to those who bring everything to God in prayer.",
    theme: "The happiest letter ever written from a prison cell.",
  },
  "colossians": {
    about: "Colossians is written from prison to a church being influenced by a philosophy combining Jewish legalism, Greek mysticism and angel worship. Paul responds with the most exalted description of Jesus in his letters — the image of the invisible God, the firstborn over all creation, the one in whom all the fullness of God was pleased to dwell. Against this backdrop he tells the Colossians: you are complete. Nothing needs to be added.",
    theme: "Jesus is bigger than you think — and you're more complete than you've been told.",
  },
  "1-thessalonians": {
    about: "First Thessalonians is one of Paul's earliest letters, written to a young church he had to leave abruptly due to persecution. He expresses deep relief at hearing they are standing firm and addresses their anxiety about believers who have died before the return of Christ. He closes with a rapid series of instructions about how to live in the meantime: rejoice always, pray continually, give thanks in all circumstances.",
    theme: "A letter to a church Paul was forced to leave too soon and couldn't stop thinking about.",
  },
  "2-thessalonians": {
    about: "Second Thessalonians is written to address confusion about the return of Christ — some in the church believe it has already happened or is so imminent that normal life should stop. Paul corrects the theological confusion, warns about a coming lawless figure and addresses the practical problem: some people have stopped working. Anyone unwilling to work shall not eat. Keep doing what is good.",
    theme: "Hold on — it hasn't happened yet and here's how to keep going in the meantime.",
  },
  "1-timothy": {
    about: "First Timothy is written to Paul's young protege who is overseeing the church in Ephesus. It covers the handling of false teaching, instructions for prayer, qualifications for church leaders, care for different groups within the congregation and personal advice to Timothy about his faith and health. It includes the famous declaration: Christ Jesus came into the world to save sinners — of whom I am the worst.",
    theme: "What Paul told his closest student about leading when the pressure is on.",
  },
  "2-timothy": {
    about: "Second Timothy is believed to be Paul's final letter, written from prison in Rome facing execution. It is intensely personal — Paul is isolated, cold and asking Timothy to come quickly. He charges Timothy to preach the word regardless of reception, warns of increasingly difficult times ahead and closes with the famous declaration that he has finished the race and kept the faith. The tone is peaceful and without regret.",
    theme: "The last letter — written cold and alone and with no regrets.",
  },
  "titus": {
    about: "Titus is written to Paul's co-worker who is overseeing the young churches on the island of Crete. Paul gives instructions for appointing elders, addresses false teachers, and instructs Titus on how to teach different groups within the congregation. The theological foundation is clear: the grace of God has appeared bringing salvation — and it trains us to live differently. Not obligation. Grace as a teacher.",
    theme: "What healthy looks like — for a person and for a community.",
  },
  "philemon": {
    about: "Philemon is Paul's most personal letter — written to a individual named Philemon whose slave Onesimus ran away, met Paul in prison and became a Christian. Paul sends Onesimus back with this letter asking Philemon to receive him no longer as a slave but as a dear brother. Paul offers to repay any debt personally. It is a masterclass in persuasion, grace and the social implications of the gospel.",
    theme: "The shortest letter and one of the most radical — ask for mercy on behalf of someone else.",
  },
  // ─── General Epistles ──────────────────────────────────
  "hebrews": {
    about: "Hebrews is an anonymous letter written to Jewish Christians tempted to return to Judaism. Its central argument is that Jesus is better — better than the angels, Moses, the Levitical priests and the old covenant. The entire sacrificial system was a shadow pointing to his final sacrifice. Chapter 11 is the hall of faith — a catalogue of Old Testament figures who lived by trusting what they couldn't yet see. Chapter 12 calls readers to fix their eyes on Jesus.",
    theme: "Everything the Old Testament was pointing toward — here's what it meant.",
  },
  "james": {
    about: "James is one of the earliest New Testament letters, written by Jesus's brother who led the Jerusalem church. It is intensely practical — covering trials, wisdom, favoritism, faith and works, the power and danger of words, humility, prayer and caring for the sick. Its central argument: faith without works is dead. Not that works earn salvation, but that real faith inevitably produces action.",
    theme: "Faith that doesn't show up in how you live isn't faith — it's information.",
  },
  "1-peter": {
    about: "First Peter is written to Christians scattered throughout Asia Minor who are experiencing marginalization and suffering for their faith. Peter calls them foreigners and exiles whose true home is elsewhere. He draws on the Old Testament to establish their identity as God's people and addresses how to live faithfully under pressure — in relationships, under authority, in suffering. He closes with a warning about the devil who prowls like a roaring lion.",
    theme: "Written to people suffering for what they believed — and what it means to hold on.",
  },
  "2-peter": {
    about: "Second Peter is written near the end of Peter's life as a final testimony and warning. He establishes the credibility of the apostolic witness — he was an eyewitness of Jesus's transfiguration — and warns extensively about false teachers who will exploit the community. He addresses the question of why Christ hasn't returned yet: God is patient, not wanting anyone to perish. The day will come like a thief.",
    theme: "An eyewitness's final word — and a warning about people who distort what was said.",
  },
  "1-john": {
    about: "First John is written by the apostle John near the end of the first century to address confusion introduced by teachers who denied that Jesus came in physical form. John grounds everything in his eyewitness experience and makes three great declarations: God is light, God is love and Jesus is the atoning sacrifice for sins. The letter emphasizes that love for God and love for people cannot be separated.",
    theme: "The oldest disciple writing to make sure nobody missed the point.",
  },
  "2-john": {
    about: "Second John is thirteen verses written to a local church — addressed as the lady chosen by God. John rejoices that her children are walking in truth and repeats the command to love one another. He warns against welcoming those who come with a different teaching about Jesus, arguing that hospitality has limits when truth is at stake. A brief letter balancing warmth and discernment.",
    theme: "Thirteen verses about love and discernment — both matter.",
  },
  "3-john": {
    about: "Third John is a personal letter to Gaius, a church member known for his generous hospitality to traveling teachers. John commends Gaius, criticizes a power-hungry leader named Diotrephes who is causing division and mentions a third person named Demetrius who is well spoken of by everyone. In thirteen verses John captures three very different kinds of people and makes clear which one he hopes Gaius will emulate.",
    theme: "Three people, three choices — a short study in what character actually looks like.",
  },
  "jude": {
    about: "Jude is a single chapter written by Jesus's brother — who like James did not believe in Jesus during his earthly ministry but became a leader in the early church. He intended to write about salvation but felt compelled to warn about teachers distorting grace to justify ungodly behavior. He draws on Old Testament examples and Jewish tradition to establish that this has always been judged. He closes with one of the most beautiful doxologies in scripture.",
    theme: "I was going to write about something else but this couldn't wait.",
  },
  // ─── Apocalyptic ───────────────────────────────────────
  "revelation": {
    about: "Revelation is written by the apostle John while exiled on the island of Patmos, addressed to seven churches in Asia Minor facing persecution. Using symbolic language drawn from Jewish apocalyptic tradition it depicts the cosmic conflict between good and evil, the judgment of corrupt powers and the ultimate victory of God. It ends with a vision of a new heaven and a new earth where God dwells with his people and every tear is wiped away.",
    theme: "The last book — and it ends with everything made new.",
  },
};

export function getBookBlurb(bookId: string): string | null {
  return BLURBS[bookId]?.about ?? null;
}

export function getBookTheme(bookId: string): string | null {
  return BLURBS[bookId]?.theme ?? null;
}

export function hasBookBlurb(bookId: string): boolean {
  return getBookBlurb(bookId) !== null;
}
