import type { Lesson } from "../lesson/types";

/* Big Question: Why does God sometimes feel far away?
   Lament is in Scripture (Psalm 13:1, which turns to trust in 13:5); Jesus cried out with Psalm 22:1
   (Matthew 27:46). Perspectives: feelings vs presence (Psalm 139:7), God's quietness (1 Kings 19:12),
   dry seasons (Psalm 42:9, and the Christian tradition of the "dark night of the soul", named as tradition).
   The caveat says plainly that distance sometimes has a cause, but often doesn't, and isn't a sign of failure.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const godFarAway = {
  id: "god-far-away",
  title: "Why does God sometimes feel far away?",
  subtitle: "David, Elijah, and the quiet seasons",
  kind: "Big question",
  scripture: "Psalm 13 · Matthew 27",
  minutes: 6,
  theme: "teal",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      lines: [
        { say: "Can I tell you something?", mood: "thinking" },
        { say: "Sometimes people pray and feel… nothing. Like God left the room.", mood: "tender", act: "settle" },
        { say: "If that’s you, you’re in good company.", mood: "moved", act: "nod" },
      ],
      display: { text: "Why does God sometimes feel far away?", sub: "Big question · World English Bible" },
      reply: "Let’s explore",
    },
    {
      kind: "ask",
      page: { at: "left", mood: "thinking", act: "tilt" },
      prompt: "When does God feel far for you?",
      options: [
        { text: "When life gets hard.", reply: "That’s exactly when we want him closest. It makes the distance feel worse.", mood: "tender", act: "nod" },
        { text: "When I pray and feel nothing.", reply: "That’s really common. Feelings come and go, even for people who love God deeply.", mood: "thinking", act: "tilt" },
        { text: "Most of the time, honestly.", reply: "Thank you for being honest. That’s a heavy thing to carry. Let’s look at this together.", mood: "tender", act: "settle" },
      ],
      after: [{ say: "Here’s someone in the Bible who said it out loud.", at: "top", mood: "thinking" }],
    },
    {
      kind: "context",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "David wrote songs to God. Some of them sound like this.", mood: "thinking", open: true },
        { say: "And it’s right there in the Bible.", show: "verse", mood: "tender" },
      ],
      verse: { text: "How long, Yahweh? Will you forget me forever? How long will you hide your face from me?", ref: "Psalm 13:1", translation: WEB },
      hint: "Tap what David feels",
      visual: "pair",
      links: [
        { phrase: "Will you forget me forever", label: "Forgotten", note: "He feels forgotten." },
        { phrase: "hide your face from me", label: "Hidden from", note: "And like God is hiding from him." },
      ],
      after: [
        { say: "God kept this prayer in the Bible. Honest complaint is allowed.", at: "top", mood: "moved", open: false },
        { say: "Then, a few lines later, David writes this.", show: "more", mood: "curious", act: "tilt" },
        { say: "He still felt the distance. He chose to trust anyway.", mood: "moved", act: "nod" },
      ],
      more: { text: "But I trust in your loving kindness. My heart rejoices in your salvation.", ref: "Psalm 13:5", translation: WEB },
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "tender" },
      verse: { text: "“My God, my God, why have you forsaken me?”", ref: "Matthew 27:46", translation: WEB },
      before: [
        { say: "Even Jesus said something like this.", mood: "tender" },
        { say: "On the cross, he cried out the words of a psalm.", show: "verse", open: true, mood: "tender" },
        { say: "Read it slowly.", mood: "tender", open: false },
      ],
      prompt: "Swipe across the words, slowly",
      after: [
        { say: "He was quoting Psalm 22, a prayer that ends in hope.", mood: "thinking" },
        { say: "Whatever you’re feeling, Jesus has felt it too.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So why does it happen? A few ideas help.", mood: "thinking" },
        { say: "Open each one.", mood: "curious" },
      ],
      cards: [
        {
          title: "Feelings aren’t the whole picture",
          say: "How close God feels and how close he is aren’t always the same.",
          body: "Feelings are real, but they change. The psalms say there’s nowhere God isn’t.",
          verse: { text: "Where could I go from your Spirit? Or where could I flee from your presence?", ref: "Psalm 139:7", translation: WEB },
        },
        {
          title: "God often comes quietly",
          say: "Sometimes he’s quieter than we expect.",
          body: "Elijah watched a wind, an earthquake and a fire go by. God wasn’t in any of them. Then came something quiet.",
          verse: { text: "After the earthquake a fire passed; but Yahweh was not in the fire. After the fire, there was a still small voice.", ref: "1 Kings 19:12", translation: WEB },
        },
        {
          title: "Dry seasons are normal",
          say: "And faithful people go through dry seasons.",
          body: "The psalms are full of them. Many Christians through history have written about long ones, sometimes called a “dark night of the soul”.",
          verse: { text: "I will ask God, my rock, “Why have you forgotten me? Why do I go mourning because of the oppression of the enemy?”", ref: "Psalm 42:9", translation: WEB },
        },
      ],
      caveat: "Sometimes distance has a cause we can do something about. Often it doesn’t, and feeling far from God isn’t a sign you’ve failed.",
      after: [{ say: "None of these makes the quiet easy. But it isn’t a sign he’s gone.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what can we hold onto?", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "What Scripture teaches",
        items: [
          { text: "God promises not to leave his people", ref: "Hebrews 13:5" },
          { text: "Honest lament belongs in prayer", ref: "Psalm 13:1" },
          { text: "Jesus knows what forsaken feels like", ref: "Matthew 27:46" },
        ],
      },
      unknown: {
        label: "What Scripture doesn’t explain",
        items: [{ text: "Why a quiet season comes, or how long it lasts", ref: "Psalm 13:2" }],
      },
      after: [
        { say: "Feeling far isn’t the same as being far.", mood: "moved", act: "nod" },
        { say: "And you can tell him exactly how it feels. That counts as prayer.", mood: "tender" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Why does God sometimes feel far away?",
      lines: [{ say: "Thanks for sitting with this one.", mood: "tender" }],
      check: {
        prompt: "Did this help you see the question differently?",
        options: [
          { text: "A little.", reply: "That’s plenty for today. Be gentle with yourself.", mood: "moved", act: "nod" },
          { text: "I still have questions.", reply: "Keep asking them. David did, and his questions are in the Bible.", mood: "thinking", act: "tilt" },
          { text: "I’d like to explore more.", reply: "Let’s keep going. I’ll point you somewhere at the end.", mood: "happy", act: "hop" },
        ],
      },
      ask: "What would you say to God right now, honestly?",
      write: "Write a thought",
      prayer: {
        label: "Pray a short prayer",
        text: "God, sometimes you feel far away. I’m still here. Help me trust that you are too.",
      },
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we explored.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Feeling far from God is in the Bible, from David to Jesus.",
        "How close God feels isn’t the same as how close he is.",
        "You can tell him honestly. That’s a prayer too.",
      ],
      refs: ["Psalm 13:1", "Psalm 13:5", "Matthew 27:46", "Psalm 139:7", "1 Kings 19:12", "Hebrews 13:5"],
      related: [
        { title: "Why doesn’t God answer every prayer?", sub: "Big question · 6 min", lessonId: "unanswered-prayer" },
        { title: "The storm", sub: "Bible story · Mark 4", lessonId: "storm" },
        { title: "Why does God allow suffering?", sub: "Big question · 6 min", lessonId: "why-suffering" },
      ],
      button: "Finish for today",
    },
  ],
} satisfies Lesson;
