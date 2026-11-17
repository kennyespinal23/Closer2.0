import type { Lesson } from "../lesson/types";

/* Christian Theology: Why did Jesus have to die?
   You walk a path of redemption (Passover, the Day of Atonement, Isaiah's servant, then the Jordan, the Last Supper,
   the cross) and pull threads from each moment in Jesus' life back to what it echoes. Then you try to cross the gap
   sin makes, and watch the bridge come from God's side. Then six lenses Christians use for the cross.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - The echoes are ones the New Testament makes itself (John 1:29, 1 Corinthians 5:7, Hebrews 9:12), or that are
     widely recognised (Matthew 26:28 and Isaiah 53:12), and the cards say which.
   - No one view of the atonement is presented as the only Christian view. Each lens says who has emphasised it.
   - Jesus is God the Son: the bridge is God himself crossing the gap (2 Corinthians 5:19), and he laid his life down
     himself (John 10:18). He is never a third party punished by God.
   - The reflection is optional, and nothing chosen there is saved. */

const WEB = "World English Bible";

export const theologyCross = {
  id: "theology-cross",
  title: "Why Did Jesus Have to Die?",
  subtitle: "A path of redemption, from Passover to the cross",
  kind: "Christian theology",
  scripture: "Exodus 12 · Isaiah 53 · Matthew 26 · 2 Corinthians 5",
  minutes: 5,
  theme: "indigo",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "Why Did Jesus Have to Die?", sub: "Christian Theology · 5 min" },
      lines: [
        { say: "Christians say the cross is the centre of the whole story.", mood: "curious", act: "hop" },
        { say: "But why would God’s Son have to die?", mood: "thinking", act: "tilt" },
        { say: "Couldn’t God just… forgive?", mood: "cheeky", act: "stare" },
      ],
      reply: "Good question",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What’s your first thought?",
      options: [
        { text: "To pay for our sins", reply: "That’s a big part of it. There’s more.", mood: "happy", act: "nod" },
        { text: "To show how much God loves us", reply: "That’s in there too.", mood: "happy", act: "nod" },
        { text: "I’ve never really understood it", reply: "Then let’s start at the beginning.", mood: "tender", act: "nod" },
      ],
      after: [
        { say: "The story starts long before Jesus. Let’s walk it.", mood: "excited", act: "hop" },
      ],
    },

    // the signature: a path of redemption
    {
      kind: "atonePath",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Six stops along one road.", mood: "curious" },
        { say: "Three long before Jesus. Three in his life.", mood: "happy", act: "nod" },
      ],
      walkHint: "Walk the road. Tap each stop in turn.",
      linkHint: "Each coral stop echoes a gold one. Pull a thread back.",
      stations: [
        { id: "passover", era: "before", label: "Passover", book: "Exodus 12", icon: "door", say: "Blood on the doorframe. And death passed over.",
          verse: { text: "The blood shall be to you for a token on the houses where you are: and when I see the blood, I will pass over you, and there shall no plague be on you to destroy you, when I strike the land of Egypt.", ref: "Exodus 12:13", translation: WEB } },
        { id: "atonement", era: "before", label: "Atonement", book: "Leviticus 16", icon: "veil", say: "Once a year, the high priest went behind the veil.",
          verse: { text: "for on this day shall atonement be made for you, to cleanse you; from all your sins you shall be clean before Yahweh.", ref: "Leviticus 16:30", translation: WEB } },
        { id: "servant", era: "before", label: "The Servant", book: "Isaiah 53", icon: "servant", say: "A servant who carries other people’s sins.",
          verse: { text: "because he poured out his soul to death, and was counted with the transgressors; yet he bore the sin of many, and made intercession for the transgressors.", ref: "Isaiah 53:12", translation: WEB } },
        { id: "jordan", era: "jesus", label: "The Jordan", book: "John 1", icon: "river", say: "John the Baptist sees Jesus. Listen to what he calls him.",
          verse: { text: "The next day, he saw Jesus coming to him, and said, “Behold, the Lamb of God, who takes away the sin of the world!", ref: "John 1:29", translation: WEB } },
        { id: "supper", era: "jesus", label: "Last Supper", book: "Matthew 26", icon: "cup", say: "The night before, Jesus takes a cup.",
          verse: { text: "for this is my blood of the new covenant, which is poured out for many for the remission of sins.", ref: "Matthew 26:28", translation: WEB } },
        { id: "cross", era: "jesus", label: "The cross", book: "John 19", icon: "cross", say: "And then three words.",
          verse: { text: "When Jesus therefore had received the vinegar, he said, “It is finished.” He bowed his head, and gave up his spirit.", ref: "John 19:30", translation: WEB } },
      ],
      links: [
        { from: "jordan", to: "passover", mark: ["the Lamb of God", "when I see the blood, I will pass over you"], say: "A lamb whose blood meant rescue.",
          why: "Paul says it outright:",
          extra: { text: "For indeed Christ, our Passover, has been sacrificed in our place.", ref: "1 Corinthians 5:7", translation: WEB } },
        { from: "supper", to: "servant", mark: ["poured out for many for the remission of sins", "he bore the sin of many"], say: "Jesus used the servant’s words about himself.",
          why: "Poured out, for many, for sins: readers have long heard Isaiah’s servant here." },
        { from: "cross", to: "atonement", mark: ["“It is finished.”", "on this day shall atonement be made for you"], say: "Not once a year. Once for all.",
          why: "Atonement came every year. Hebrews says this was once for all:",
          extra: { text: "through his own blood, entered in once for all into the Holy Place, having obtained eternal redemption.", ref: "Hebrews 9:12", translation: WEB } },
      ],
      wrong: "Not that one. Look at the words they share.",
      wow: {
        title: "The lambs and the Lamb, the same week.",
        verse: { text: "“You know that after two days the Passover is coming, and the Son of Man will be delivered up to be crucified.”", ref: "Matthew 26:2", translation: WEB },
        say: "All four Gospels put the cross at Passover.",
      },
      after: [
        { say: "The patterns weren’t random. They were pointing somewhere.", mood: "moved", act: "nod" },
        { say: "But why was a sacrifice needed at all?", mood: "curious", act: "tilt" },
      ],
    },

    // sin, forgiveness, reconciliation
    {
      kind: "atoneBridge",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "The Bible says sin does more than break rules.", mood: "thinking" },
        { say: "Isaiah says our sins have “separated you and your God.”", mood: "tender", act: "settle" },
      ],
      tryHint: "Try to cross from our side.",
      attempts: [
        { label: "Try harder", say: "Not quite far enough." },
        { label: "Be good", say: "Closer… still short." },
        { label: "Make up for it", say: "It falls. Every time." },
      ],
      short: { text: "for all have sinned, and fall short of the glory of God;", ref: "Romans 3:23", translation: WEB },
      turn: "Now look at the other side.",
      planks: [
        { label: "God moves first", say: "While we were still sinners. Not after we fixed ourselves.",
          verse: { text: "But God commends his own love toward us, in that while we were yet sinners, Christ died for us.", ref: "Romans 5:8", translation: WEB } },
        { label: "God himself comes", say: "“God was in Christ.” God crossed the gap himself.",
          verse: { text: "namely, that God was in Christ reconciling the world to himself, not reckoning to them their trespasses, and having committed to us the word of reconciliation.", ref: "2 Corinthians 5:19", translation: WEB } },
        { label: "A gift, not a wage", say: "Grace. Received, not earned.",
          verse: { text: "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.", ref: "Ephesians 2:8–9", translation: WEB } },
      ],
      after: [
        { say: "Forgiveness: our sins aren’t counted against us.", mood: "happy", act: "nod" },
        { say: "Reconciliation: the way back to God is open.", mood: "moved" },
        { say: "And no one forced Jesus. He said, “I lay it down by myself.”", mood: "tender", act: "nod" },
      ],
    },

    // how the cross does it: six lenses
    {
      kind: "atoneLenses",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "So how does the cross actually do it?", mood: "curious", act: "tilt" },
        { say: "Christians have described it in several ways.", mood: "thinking" },
      ],
      hint: "Tap each lens around the cross.",
      lenses: [
        { name: "Penal substitution", image: "He took our place.", body: "Jesus bore the penalty for sin that we deserved, so that we could go free.", say: "In our place.",
          verse: { text: "He himself bore our sins in his body on the tree", ref: "1 Peter 2:24", translation: WEB },
          held: "Emphasised especially in Reformed and many evangelical Protestant churches." },
        { name: "Christus Victor", image: "He defeated the powers.", body: "Through the cross and resurrection, Jesus overcame sin, death and the devil, and set captives free.", say: "A victory.",
          verse: { text: "having stripped the principalities and the powers, he made a show of them openly, triumphing over them in it.", ref: "Colossians 2:15", translation: WEB },
          held: "Strong in the early church and in Eastern Orthodox teaching. The name comes from Gustaf Aulén’s 1931 book." },
        { name: "Ransom", image: "He paid to set us free.", body: "Jesus gave his life to free people who were held captive.", say: "A price paid for freedom.",
          verse: { text: "For the Son of Man also came not to be served, but to serve, and to give his life as a ransom for many.", ref: "Mark 10:45", translation: WEB },
          held: "Common among early church writers, who debated who, if anyone, the ransom was paid to." },
        { name: "Satisfaction", image: "He made it right.", body: "Sin wrongs God’s honour. Only one who is both God and human could make it right, and Jesus did.", say: "Why it had to be someone both God and human.",
          verse: { text: "by which will we have been sanctified through the offering of the body of Jesus Christ once for all.", ref: "Hebrews 10:10", translation: WEB },
          held: "Set out by Anselm of Canterbury around 1098. Deeply influential in Catholic theology." },
        { name: "Moral influence", image: "He showed us love.", body: "The cross shows how far God’s love goes, and that love changes us.", say: "Love that changes people.",
          verse: { text: "Greater love has no one than this, that someone lay down his life for his friends.", ref: "John 15:13", translation: WEB },
          held: "Linked with Peter Abelard in the 12th century. Most traditions say it’s true, but not the whole story." },
        { name: "Recapitulation", image: "He lived our story right.", body: "Jesus, the new Adam, walked humanity’s path faithfully all the way, undoing what went wrong.", say: "A new Adam.",
          verse: { text: "For as through the one man’s disobedience many were made sinners, even so through the obedience of the one, many will be made righteous.", ref: "Romans 5:19", translation: WEB },
          held: "Taught by Irenaeus of Lyon in the 2nd century, and loved in the Eastern churches." },
      ],
      caveat: "Most Christians hold several of these together, like facets of one jewel. Traditions disagree about which is central, and some views are debated. None of them alone says everything.",
      after: [
        { say: "Each lens shows something real.", mood: "happy", act: "nod" },
        { say: "And underneath every one of them is the same thing.", mood: "moved" },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "moved" },
      before: [
        { say: "Love.", mood: "moved", act: "nod" },
      ],
      verse: { text: "By this God’s love was revealed in us, that God has sent his one and only Son into the world that we might live through him. In this is love, not that we loved God, but that he loved us, and sent his Son as the atoning sacrifice for our sins.", ref: "1 John 4:9–10", translation: WEB },
      after: [
        { say: "Not that we loved God. That he loved us first.", mood: "tender", act: "nod" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "The cross says something about you too. What do you hear?",
      options: [
        { text: "That I’m forgiven", reply: "“Not reckoning to them their trespasses.” That includes you." },
        { text: "That I’m loved", reply: "Loved first, before you did anything at all." },
        { text: "That I can come back to God", reply: "The bridge is already built. From his side." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "Why did Jesus have to die?",
      body: "",
      summary: [
        "Passover, the Day of Atonement and Isaiah’s servant all point to the cross.",
        "Sin separates us from God. At the cross, God crossed the gap himself.",
        "Christians describe it through several lenses. Underneath them all is love.",
      ],
      refs: ["Exodus 12:13", "Leviticus 16:30", "Isaiah 53:12", "John 1:29", "Matthew 26:28", "Hebrews 9:12", "2 Corinthians 5:19", "1 John 4:9–10"],
      related: [
        { title: "The Lamb", sub: "Connections · 5 min", lessonId: "connect-lamb" },
        { title: "The King Who Washed Feet", sub: "Jesus Only · John 13", lessonId: "jesus-washed-feet" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
