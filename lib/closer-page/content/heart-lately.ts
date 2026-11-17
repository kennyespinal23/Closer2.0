import type { Lesson } from "../lesson/types";

/* Heart to Heart: What’s Been on Your Heart Lately?
   A conversation by lamplight. You set down what you're carrying, one stone at a time, into a basket, and Page answers
   each one. Heavy things are handed over (1 Peter 5:7, then Jesus' "Come to me"); good things are thanked for
   (Psalm 118:24); everyone ends at Paul's asking-with-thanking (Philippians 4:6–7). Then a prayer made from what you
   set down, or writing, or quiet; and, asked plainly, whether to keep any of it.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - Page is a companion, not God or a pastor: he never says what God feels about your particular things, only what
     the verses say, and the prayer is offered as words you can pray, or not.
   - No scores, no "how are you really", no guilt. "Nothing much" is a whole answer.
   - Nothing is kept unless you say yes on the keep card. If you do, it stays in this browser on this device, and
     another day Page may gently ask how it has been. You can delete it in You → Saved. */

const WEB = "World English Bible";

export const heartLately = {
  id: "heart-lately",
  title: "What’s Been on Your Heart Lately?",
  subtitle: "Set it down by the lamp",
  kind: "Heart to Heart",
  scripture: "1 Peter 5:7 · Matthew 11:28–30 · Philippians 4:6–7",
  minutes: 5,
  theme: "ember",
  quiet: true,
  blocks: [
    {
      kind: "hlatelyOpen",
      page: { at: "hero", act: "enter", mood: "tender" },
      display: { text: "What’s Been on Your Heart Lately?", sub: "Heart to Heart · 5 min" },
      fresh: [
        { say: "No lesson today. Just you and me, and a lamp on.", mood: "tender", act: "enter", at: "center" },
        { say: "I’d love to hear what’s been on your heart.", mood: "curious", act: "tilt", at: "center" },
      ],
      back: {
        "on-my-heart": "{When}, you set down {items}.",
        closeness: "{When}, we talked about how close you feel to God.",
        afraid: "{When}, you brought something hard to God.",
        quiet: "{When}, you said it was a quiet day.",
        default: "{When}, you shared something with me.",
      },
      ask: "How have things been since?",
      since: [
        { text: "Lighter than it was", reply: "I’m really glad. Let’s notice that together.", mood: "happy" },
        { text: "Still heavy", reply: "Thank you for telling me. You don’t have to fix it today.", mood: "tender" },
        { text: "It’s changed into something else", reply: "Things do that. Let’s see what it looks like now.", mood: "curious" },
        { text: "I’d rather not say", reply: "That’s completely fine. Let’s just start from today.", mood: "tender" },
      ],
      today: [{ say: "So, today. What are you carrying?", mood: "curious", act: "tilt", at: "center" }],
      reply: "Let’s look",
    },
    {
      kind: "hlatelyCarry",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "Here are a few things people carry. Good ones too.", mood: "tender", act: "nod" },
        { say: "Pick up whatever’s yours and set it in the basket.", mood: "curious", act: "tilt" },
      ],
      hint: "Tap a stone to set it down. Tap it again to take it back.",
      stones: [
        { id: "work", label: "Work or school", weight: "heavy", reply: "That can take up a whole week, can’t it?", pray: "the work in front of me", said: "work or school" },
        { id: "someone", label: "Someone I love", weight: "heavy", reply: "Loving someone means carrying them a little too.", pray: "the people I love", said: "someone you love" },
        { id: "health", label: "My health", weight: "heavy", reply: "Bodies are hard sometimes. I’m sorry it’s on your mind.", pray: "my health", said: "your health" },
        { id: "money", label: "Money", weight: "heavy", reply: "Money worries follow you to bed. You’re not the only one.", pray: "money, and what we need", said: "money" },
        { id: "decision", label: "A decision", weight: "open", reply: "Not knowing which way to go is its own kind of tired.", pray: "the decision I have to make", said: "a decision" },
        { id: "miss", label: "Someone I miss", weight: "heavy", reply: "I’m so sorry. Missing someone is heavy to carry.", mood: "moved", pray: "the one I miss", said: "someone you miss" },
        { id: "lonely", label: "Feeling lonely", weight: "heavy", reply: "Lonely can happen even in a full room. Thank you for saying it.", mood: "moved", pray: "the lonely parts of me", said: "feeling lonely" },
        { id: "regret", label: "Something I did", weight: "heavy", reply: "Thank you for being honest. That can come too.", pray: "what I wish I’d done differently", said: "something you did" },
        { id: "news", label: "Good news", weight: "joy", reply: "Good news! That belongs in here too.", pray: "the good news", said: "some good news" },
        { id: "thanks", label: "Thankfulness", weight: "joy", reply: "Thankful is a lovely thing to carry around.", pray: "everything I’m thankful for", said: "thankfulness" },
        { id: "hope", label: "Something I hope for", weight: "joy", reply: "Hope fits in here beautifully.", pray: "what I’m hoping for", said: "a hope" },
      ],
      other: { label: "Something else", ask: "What would you call it?", placeholder: "Name it in a few words", reply: "Thank you for naming it. That takes courage.", pray: "" },
      none: { label: "Honestly, nothing much", reply: "That’s alright. Some days are just days." },
      max: 5,
      full: "That’s a full basket. You can take one back if you’d like.",
      basket: "Set them down here",
      after: {
        heavy: "That’s a lot to carry. I’m glad you set it down.",
        joy: "What a lovely basket. Let’s not rush past that.",
        both: "Heavy things and good things, side by side. That’s real life.",
        open: "Open questions. Let’s bring them somewhere good.",
      },
      done: "That’s what I’m carrying",
    },
    {
      kind: "hlatelyWord",
      page: { at: "top", mood: "tender" },
      cast: {
        verse: { text: "casting all your worries on him, because he cares for you.", ref: "1 Peter 5:7", translation: WEB },
        before: [
          { say: "Peter wrote this to Christians going through real trouble.", mood: "tender", act: "nod" },
          { say: "Not “carry it better.” Hand it over.", mood: "moved", act: "settle" },
        ],
        hold: "When you’re ready, hold the button. Take your time.",
        after: [
          { say: "Look at the reason he gives: “because he cares for you.”", mood: "moved", act: "nod" },
          { say: "Not because they’re small. Because you matter to him.", mood: "tender", act: "settle" },
        ],
      },
      rest: {
        verse: { text: "Come to me, all you who labor and are heavily burdened, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and humble in heart; and you will find rest for your souls. For my yoke is easy, and my burden is light.", ref: "Matthew 11:28–30", translation: WEB },
        lines: [
          { say: "And Jesus said this, to anyone tired.", mood: "tender", act: "nod" },
          { say: "He calls himself “gentle and humble in heart.” I love that.", mood: "moved", act: "settle" },
        ],
      },
      joy: {
        verse: { text: "This is the day that Yahweh has made. We will rejoice and be glad in it!", ref: "Psalm 118:24", translation: WEB },
        lines: [
          { say: "Good things are worth bringing to God as well.", mood: "happy", act: "nod" },
          { say: "Today is one of his days. Gladness belongs in it.", mood: "happy", act: "hop" },
        ],
      },
      peace: {
        verse: { text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.", ref: "Philippians 4:6–7", translation: WEB },
        lines: [
          { say: "Paul puts asking and thanking in the same prayer.", mood: "curious", act: "tilt" },
          { say: "Everything you set down can go to God, just like that.", mood: "tender", act: "nod" },
        ],
      },
    },
    {
      kind: "hlatelyPray",
      page: { at: "center", mood: "tender" },
      lines: [{ say: "Would you like to bring it to God now?", mood: "tender", act: "tilt" }],
      pray: {
        label: "Pray it with me",
        open: "Father, here is what’s on my heart today.",
        heavy: "I give you {items}. Thank you that you care for me.",
        joy: "Thank you for {items}.",
        named: "And I bring you {items}. You know all about it.",
        nothing: "There’s nothing big today. I just want to be with you.",
        close: "Give me your peace, the kind that guards my heart. In Jesus’ name, amen.",
      },
      write: { label: "Write a little more", ask: "Anything else you want to say about it?", placeholder: "Write it however it comes…" },
      quiet: { label: "Just sit quietly a moment", say: "Take a breath. God is here, and there’s no hurry." },
      keep: {
        ask: "Want me to remember this, so I can ask about it another day?",
        small: "It stays private, only in this browser on this device. It isn’t synced or backed up. Delete it any time in You → Saved.",
        yes: "Yes, keep it privately",
        no: "No, don’t keep it",
        kept: "Kept, just for you. I’ll ask how it’s going another day.",
        notKept: "Not kept. It stays between you and God.",
        question: "What’s been on your heart lately?",
        since: "How has it been since last time?",
      },
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "settle" },
      calm: true,
      title: "What’s been on your heart",
      body: "",
      summary: [
        "You set down what you were carrying, heavy things and good ones.",
        "Peter says to hand worries over, “because he cares for you.”",
        "Paul puts asking and thanking in the same prayer.",
      ],
      refs: ["1 Peter 5:7", "Matthew 11:28–30", "Psalm 118:24", "Philippians 4:6–7"],
      related: [
        { title: "When You’re Worried", sub: "Learning to Pray · 1 Peter 5", lessonId: "pray-worried" },
        { title: "When God Feels Far Away", sub: "Psalms & Emotions · Psalm 13", lessonId: "psalm-13" },
        { title: "How Close Do You Feel to God?", sub: "Heart to Heart · 5 min", lessonId: "heart-close" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
