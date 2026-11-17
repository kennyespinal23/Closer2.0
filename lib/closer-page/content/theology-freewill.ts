import type { Lesson } from "../lesson/types";
import type { FreeWillStory } from "../lesson/ext/freewill.types";

/* Christian Theology: If God knows the future, do we have free will?
   You choose your way through a weekend, scrub back through it as a replay (where knowing and causing come apart),
   weigh two threads of Scripture on a balance, look at one timeline through five Christian views, and turn over why
   it matters.

   Kept honest, line by line:
   - The weekend and the replay illustrate one distinction (knowing is not causing). They prove no position, and Page
     says so; the hard part (God knows before, not after) is named, not dodged.
   - The five views are described as their own holders would put them, each with its hardest question. Open theism is
     marked as a minority view many churches reject. Nobody is quoted.
   - Scripture is the World English Bible, word for word; poetic line breaks are joined with spaces.
   - The reflection is optional, and nothing chosen in it is saved. */

const WEB = "World English Bible";

const SUNDAY = { scene: "Sunday. Someone asks how your weekend went.", options: ["Tell it straight", "Polish it a little"] as [string, string], replies: ["Honest. Nice.", "A little shine. Noted."] as [string, string] };

const weekend: FreeWillStory = {
  title: "Your weekend",
  nodes: {
    "": { scene: "Saturday, 9 a.m. A friend texts: “Any chance you could help me move today?”", options: ["Say yes", "Say you’re busy"], replies: ["Off to carry boxes!", "A free day, then."] },
    "0": { scene: "By noon you’re sore. Their dad says: “Take the old guitar. It won’t fit.”", options: ["Keep the guitar", "Say sell it; they need the money"], replies: ["Free guitar!", "Kind. They’re short on cash."] },
    "1": { scene: "That evening they post a photo: boxes everywhere, moving alone.", options: ["Call and offer tomorrow", "Leave it"], replies: ["They sound relieved.", "Fair enough. It was your day."] },
    "00": SUNDAY,
    "01": SUNDAY,
    "10": { scene: "Sunday, 8 a.m. The alarm goes off. You promised to help.", options: ["Get up and go", "Text that you can’t"], replies: ["Promise kept.", "Hmm. They’ll manage."] },
    "11": SUNDAY,
  },
};

export const theologyFreewill = {
  id: "theology-freewill",
  title: "If God Knows the Future, Do We Have Free Will?",
  subtitle: "Knowing, choosing, and an old puzzle",
  kind: "Christian theology",
  scripture: "Psalm 139 · Isaiah 46 · Acts 2",
  minutes: 5,
  theme: "indigo",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "If God Knows the Future, Do We Have Free Will?", sub: "Christian Theology · 5 min" },
      lines: [
        { say: "Here’s a puzzle people have argued over for centuries.", mood: "curious", act: "hop" },
        { say: "If God already knows what you’ll choose tomorrow…", mood: "thinking", act: "tilt" },
        { say: "…are you really free to choose?", mood: "cheeky", act: "stare" },
      ],
      reply: "Let’s test it",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "What’s your first thought?",
      options: [
        { text: "Then my choices aren’t really free", reply: "That’s the worry. Let’s test it.", mood: "thinking", act: "nod" },
        { text: "Knowing isn’t the same as forcing", reply: "Interesting. Hold that thought.", mood: "curious", act: "tilt" },
        { text: "I’ve never thought about it", reply: "Perfect. Let’s find out together.", mood: "happy", act: "hop" },
      ],
      after: [
        { say: "Let’s try it. You’re going to make some choices.", mood: "excited", act: "hop" },
      ],
    },

    // the Choice Explorer
    {
      kind: "freewillPath",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Here’s a weekend. Every fork is yours.", mood: "happy", act: "nod" },
      ],
      story: weekend,
      save: "weekend",
      after: [
        { say: "Three choices. All yours.", mood: "happy", act: "nod" },
        { say: "Now let’s watch them back.", mood: "curious", act: "tilt" },
      ],
    },

    // the replay: knowing is not causing
    {
      kind: "freewillReplay",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Here’s your weekend again, as a replay.", mood: "curious" },
        { say: "You know exactly how it goes now.", mood: "cheeky", act: "stare" },
      ],
      story: weekend,
      save: "weekend",
      scrub: "Drag through your replay.",
      know: { label: "My choices → knowing them", say: "Yes! You know because you chose." },
      cause: { label: "Knowing them → my choices", say: "No. Watching can’t reach back and make you choose." },
      after: [
        { say: "Knowing what happened didn’t make it happen.", mood: "excited", act: "hop" },
        { say: "Knowing and causing are different things.", mood: "happy", act: "nod" },
        { say: "But here’s the hard part: God knows before you choose.", mood: "thinking", act: "stare" },
        { say: "This little test can’t settle that. It shows one distinction, that’s all.", mood: "thinking", act: "tilt" },
      ],
    },

    // two threads in Scripture
    {
      kind: "freewillBoth",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what does Scripture say?", mood: "curious", act: "tilt" },
        { say: "It holds two threads at once.", mood: "thinking" },
      ],
      hint: "Which side does each passage weigh on?",
      sides: { god: "God knows and plans", human: "People choose" },
      cards: [
        { verse: { text: "For there is not a word on my tongue, but, behold, Yahweh, you know it altogether.", ref: "Psalm 139:4", translation: WEB }, side: "god", say: "God knows our words before we say them." },
        { verse: { text: "I have set before you life and death, the blessing and the curse. Therefore choose life, that you may live, you and your descendants;", ref: "Deuteronomy 30:19", translation: WEB }, side: "human", say: "Choose life: a real choice, set before people." },
        { verse: { text: "I declare the end from the beginning, and from ancient times things that are not yet done. I say: My counsel will stand, and I will do all that I please.", ref: "Isaiah 46:10", translation: WEB }, side: "god", say: "God declares the end from the beginning." },
        { verse: { text: "If it seems evil to you to serve Yahweh, choose today whom you will serve;", ref: "Joshua 24:15", translation: WEB }, side: "human", say: "Choose today. Joshua puts it to the people." },
      ],
      key: {
        verse: { text: "him, being delivered up by the determined counsel and foreknowledge of God, you have taken by the hand of lawless men, crucified and killed;", ref: "Acts 2:23", translation: WEB },
        god: "the determined counsel and foreknowledge of God",
        human: "you have taken by the hand of lawless men, crucified and killed",
        hint: "One verse holds both. Tap each thread.",
        say: "Both, in one sentence! God’s plan, and people fully responsible.",
      },
      after: [
        { say: "Peter didn’t pick a thread. He held both.", mood: "moved", act: "nod" },
        { say: "Christians have spent centuries asking how they fit.", mood: "thinking" },
      ],
    },

    // five lenses
    {
      kind: "freewillViews",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Here are the main ways Christians fit them together.", mood: "curious", act: "nod" },
      ],
      hint: "Tap a lens. Watch the timeline change.",
      views: [
        {
          id: "ordain", name: "God ordains all",
          claim: "God ordains everything that happens, and you still choose freely: freedom means acting from your own desires, not being forced.",
          who: "the tradition of Augustine; John Calvin and Reformed churches",
          pushback: "If God ordains my choice, how is it really mine?",
          say: "God’s plan covers everything, your desires included.",
        },
        {
          id: "foresee", name: "God foresees",
          claim: "God sees ahead what you will freely do. His knowledge follows your choice; it doesn’t cause it.",
          who: "Jacob Arminius, John Wesley, and many Methodist, Wesleyan and Pentecostal churches",
          pushback: "If it’s already known, could you really do otherwise?",
          say: "Like your replay, but seen beforehand.",
        },
        {
          id: "middle", name: "Middle knowledge",
          claim: "God knows what anyone would freely do in any situation, then chooses which world to create. He guides history without forcing choices.",
          who: "Luis de Molina, a 16th-century Jesuit, and some philosophers today",
          pushback: "What makes those “would” facts true before anyone exists?",
          say: "God knows every “what if”, then chooses the world.",
        },
        {
          id: "timeless", name: "Outside time",
          claim: "God isn’t inside time looking ahead. He sees all of time in one eternal present, the way you see a whole road from a hilltop.",
          who: "Boethius, Thomas Aquinas, and much of classical Christian theology",
          pushback: "How does a timeless God answer prayers in time?",
          say: "No “before” for God. He sees it all at once.",
        },
        {
          id: "open", name: "Open future", minority: true,
          claim: "Future free choices aren’t there yet to be known. God knows every possibility and is never outwitted, but the future is partly open.",
          who: "a modern minority view (Clark Pinnock, Gregory Boyd). Many churches reject it as a break from historic teaching.",
          pushback: "How does it fit passages like Isaiah 46:10?",
          say: "A minority view. Many Christians reject it.",
        },
      ],
      caveat: "Views can combine: Aquinas held both timeless eternity and strong providence. None of this is settled by a diagram. Christians still debate it, faithfully.",
      after: [
        { say: "Every view is trying to keep both threads.", mood: "thinking", act: "nod" },
        { say: "Each pays a price somewhere. That’s why it’s hard.", mood: "tender" },
      ],
    },

    // why it matters
    {
      kind: "freewillStakes",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "So why does any of this matter?", mood: "curious", act: "tilt" },
      ],
      hint: "Turn each worry over.",
      cards: [
        { title: "Prayer", worry: "If God already knows, why pray?", answer: "Jesus said “your Father knows what things you need, before you ask him”, then taught his friends to pray. Prayer is relationship, not information.", ref: "Matthew 6:8–9", say: "He knows, and he still wants to hear from you." },
        { title: "Responsibility", worry: "If it’s known, is it still my fault?", answer: "Scripture never lets foreknowledge cancel responsibility. Jesus foretold Peter’s denial, and Peter still wept bitterly over what he’d done.", ref: "Matthew 26:34, 75", say: "Known ahead, and still Peter’s own." },
        { title: "Trust", worry: "Does it help that God knows?", answer: "Many Christians find comfort here: God declares “the end from the beginning.” Your future doesn’t take him by surprise.", ref: "Isaiah 46:10", say: "Not a cage. A hand to hold." },
      ],
      after: [
        { say: "It’s hard because Scripture says both, and our minds strain to hold them.", mood: "thinking" },
        { say: "But both threads lead to trust, and to choices that really matter.", mood: "moved", act: "nod" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "God knows your path. How does that sit with you?",
      options: [
        { text: "It’s comforting", reply: "Isaiah would agree: he sees the end from the beginning." },
        { text: "It’s a little unsettling", reply: "That’s honest. Faithful Christians have felt it too." },
        { text: "It makes my choices feel bigger", reply: "They’re real. “Choose life,” Moses said." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "Knowing isn’t causing",
      body: "",
      summary: [
        "You chose a path, and knowing it afterwards didn’t make it happen.",
        "Scripture holds both: God knows and plans, and people truly choose.",
        "Christians fit them together in several ways. It’s an honest, ongoing debate.",
      ],
      refs: ["Psalm 139:4", "Isaiah 46:10", "Deuteronomy 30:19", "Joshua 24:15", "Acts 2:23", "Matthew 6:8–9", "Matthew 26:34, 75"],
      related: [
        { title: "Why doesn’t God answer every prayer?", sub: "Big question · 6 min", lessonId: "unanswered-prayer" },
        { title: "If Jesus Is God, Who Was He Praying To?", sub: "Christian Theology · 5 min", lessonId: "theology-praying" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
