import type { AfraidKind } from "../lesson/ext/hafraid.types";
import type { Lesson } from "../lesson/types";

/* Heart to Heart: Is There Something You’ve Been Afraid to Tell God?
   A slow conversation, never a form. Page makes it safe first (God already knows, and still invites you close),
   asks only what kind of thing it is (with "I'd rather not say" as a full answer), then hands you a slip of
   paper: write it, a word of it, or nothing; fold it; hold to give it to God. Letting it go is the default and
   keeps nothing. Keeping a private note happens only if you ask for it and then say yes to what that means.

   Kept honest, line by line:
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - Page is a companion. He never speaks for God, never says what God thinks of you, and never asks what it is.
   - No scores, no guilt: nothing here judges, counts or ranks anyone's relationship with God.
   - For the heavier kinds, a quiet line points to real people (a friend, a pastor, a counselor) and, plainly,
     to crisis help. Page is not a replacement for any of them.
   - If something was kept before, Page asks how it's being carried now, and never reads it back unless asked. */

const WEB = "World English Bible";

const KINDS: AfraidKind[] = [
  {
    id: "did",
    label: "Something I did",
    reply: [
      { say: "Something you did. Thank you for being honest about it.", mood: "tender", act: "nod" },
      { say: "Here’s what God promises, right in Scripture.", mood: "tender" },
    ],
    verse: { text: "If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.", ref: "1 John 1:9", translation: WEB },
    after: "Faithful. Not reluctant, and not someday.",
    prayer: "God, you know what I did. I’m sorry. Thank you that you forgive, and that you make me clean.",
  },
  {
    id: "feel",
    label: "Something I feel about God",
    reply: [
      { say: "Angry, doubting, let down? You’re in good company.", mood: "tender", act: "nod" },
      { say: "Some psalms say exactly that, out loud, to God.", mood: "thinking" },
    ],
    verse: { text: "How long, Yahweh? Will you forget me forever? How long will you hide your face from me? How long shall I take counsel in my soul, having sorrow in my heart every day?", ref: "Psalm 13:1–2", translation: WEB },
    after: "That’s a prayer in the Bible. Honest words are welcome.",
    prayer: "God, this is how I really feel about you. I’d rather tell you than hide it from you.",
  },
  {
    id: "fear",
    label: "Something I’m afraid will happen",
    reply: [
      { say: "A fear can feel too small to pray about. Or too big.", mood: "tender", act: "nod" },
      { say: "Here’s what God says to people who are afraid.", mood: "tender" },
    ],
    verse: { text: "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.", ref: "Isaiah 41:10", translation: WEB },
    after: "He doesn’t call the fear silly. He promises to be with you in it.",
    prayer: "God, I’m afraid of this. Please be with me in it, and help me trust you with what I can’t control.",
    heavy: true,
  },
  {
    id: "hurt",
    label: "Something that happened to me",
    reply: [
      { say: "Something that happened to you. I’m so sorry it hurts.", mood: "tender", act: "settle" },
      { say: "God is not far from that kind of pain.", mood: "tender" },
    ],
    verse: { text: "Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit.", ref: "Psalm 34:18", translation: WEB },
    after: "Near. Not watching from far away.",
    prayer: "God, you know what happened. It still hurts. Please be near me, and heal what’s broken.",
    heavy: true,
  },
  {
    id: "unsaid",
    label: "I’d rather not say",
    reply: [
      { say: "That’s completely fine.", mood: "tender", act: "nod" },
      { say: "You can bring it to him without naming it here.", mood: "tender" },
    ],
    verse: { text: "casting all your worries on him, because he cares for you.", ref: "1 Peter 5:7", translation: WEB },
    after: "All of it. Even the part that doesn’t have a name yet.",
    prayer: "God, you know what this is. I’m bringing it to you, just as it is.",
    heavy: true,
  },
];

export const heartAfraid = {
  id: "heart-afraid",
  title: "Is There Something You’ve Been Afraid to Tell God?",
  subtitle: "Just between you and God",
  kind: "Heart to Heart",
  scripture: "Psalm 139 · Psalm 62 · Hebrews 4",
  minutes: 5,
  theme: "ember",
  quiet: true,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      display: { text: "Is There Something You’ve Been Afraid to Tell God?", sub: "Heart to Heart · 5 min" },
      lines: [
        { say: "Hi. This one is just between you and God.", mood: "tender", act: "settle" },
        { say: "There’s nothing to get right. We’ll go slowly.", mood: "tender", act: "nod" },
      ],
      reply: "Okay",
    },
    {
      kind: "hafraidSafe",
      page: { at: "top", mood: "tender" },
      back: {
        ask: "How are you carrying it now?",
        options: [
          { text: "A little lighter", reply: "I’m glad. It doesn’t have to be all gone." },
          { text: "About the same", reply: "That’s honest. Some things take more than one telling." },
          { text: "Heavier, honestly", reply: "Thank you for saying so. You can bring it again." },
          { text: "I’d rather not think about it", reply: "That’s okay. We can leave it where it is." },
        ],
        show: "Show me what I kept",
        shown: "What you kept",
        hide: "Put it away",
      },
      lines: [
        { say: "You don’t have to tell me what it is.", mood: "tender", act: "settle" },
        { say: "And you don’t need perfect words for God, either.", mood: "tender", act: "nod" },
      ],
      verses: [
        { say: "He already knows. A psalmist wrote this, amazed.", verse: { text: "Yahweh, you have searched me, and you know me. You know my sitting down and my rising up. You perceive my thoughts from afar. You search out my path and my lying down, and are acquainted with all my ways. For there is not a word on my tongue, but, behold, Yahweh, you know it altogether.", ref: "Psalm 139:1–4", translation: WEB } },
        { say: "So telling him isn’t news to him. It’s an invitation.", verse: { text: "Trust in him at all times, you people. Pour out your heart before him. God is a refuge for us.", ref: "Psalm 62:8", translation: WEB } },
        { say: "Not creeping in, either. Coming close, with boldness.", verse: { text: "Let us therefore draw near with boldness to the throne of grace, that we may receive mercy, and may find grace for help in time of need.", ref: "Hebrews 4:16", translation: WEB } },
      ],
      done: "Whatever it is, you can bring it.",
    },
    {
      kind: "hafraidKind",
      page: { at: "top", mood: "tender" },
      ask: "Only if you’d like: what kind of thing is it?",
      note: "You won’t be asked what it is.",
      kinds: KINDS,
    },
    {
      kind: "hafraidSlip",
      page: { at: "top", mood: "tender" },
      question: "Is there something you’ve been afraid to tell God?",
      kinds: KINDS,
      write: [
        { say: "Here’s a slip of paper. Write on it if you want to.", mood: "tender", act: "nod" },
        { say: "One word is enough. Or leave it blank.", mood: "tender" },
      ],
      placeholder: "A word, a sentence, or nothing at all",
      fold: "Fold it up",
      empty: "Fold it blank",
      hold: "Hold to give it to God",
      given: [
        { say: "It’s with him now.", mood: "moved", act: "settle" },
        { say: "He knew already. Now you’ve told him.", mood: "tender", act: "nod" },
      ],
      choose: {
        ask: "Should I remember any of this?",
        letGo: "No, let it go",
        keep: "Keep a private note of this",
        consent: [
          "I’d keep what kind of thing it was, and anything you wrote.",
          "It stays in this browser on this device. It isn’t synced, backed up or sent anywhere.",
          "You can delete it any time in You → Saved.",
        ],
        confirm: "Yes, keep it privately",
        back: "Actually, let it go",
        letGoSay: "Let go. Nothing was kept.",
        keptSay: "Kept, privately. Only here, only for you.",
      },
      heavy: {
        title: "Some things are too heavy to carry alone",
        text: "A friend you trust, a pastor or a counselor can help you carry it. Telling someone can be a brave next step.",
        crisis: "If you’re thinking about harming yourself, in the US you can call or text 988 (Suicide & Crisis Lifeline). Anywhere else, contact your local emergency services.",
      },
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "settle" },
      calm: true,
      title: "Something you were afraid to say",
      body: "",
      summary: [
        "God already knows, and still invites you close.",
        "You can pour out your heart to him, honest words and all.",
        "You can bring it again, as often as you need to.",
      ],
      refs: ["Psalm 139:1–4", "Psalm 62:8", "Hebrews 4:16", "1 John 1:9", "Psalm 13:1–2", "Isaiah 41:10", "Psalm 34:18", "1 Peter 5:7"],
      related: [
        { title: "When You’re Angry With God", sub: "Learning to Pray · Psalm 13", lessonId: "pray-angry" },
        { title: "Asking for Forgiveness", sub: "Learning to Pray · Psalm 51", lessonId: "pray-forgive" },
        { title: "How Close Do You Feel to God?", sub: "Heart to Heart · 5 min", lessonId: "heart-close" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
