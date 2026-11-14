import type { Block, Lesson } from "../lesson/types";

/* Learning to Pray: eight more lessons, built from the same interactions in different combinations.
   Scripture is the World English Bible, word for word. Starter phrases and prompts are suggestions, never
   presented as Scripture, and nothing anyone writes is sent anywhere. */

const WEB = "World English Bible";
const v = (text: string, ref: string) => ({ text, ref, translation: WEB });
const intro = (title: string, lines: [string, string]): Block => ({
  kind: "dialogue",
  page: { at: "hero", act: "hop", mood: "happy" },
  lines: [{ say: lines[0], mood: "curious", act: "tilt" }, { say: lines[1], mood: "happy", act: "nod" }],
  display: { text: title, sub: "Learning to pray · take your time" },
  reply: "Let’s start",
});
const done = (title: string, summary: string[], verse: { text: string; ref: string; translation: string }, refs: string[], related: { title: string; sub: string; lessonId: string }[]): Block => ({
  kind: "complete", page: { at: "top", mood: "happy", act: "hop" }, calm: true, title, body: "The Lord is always closer than you think.", summary, verse, refs, related, button: "Finish",
});
const release = (ref: string, fallback: string, from = "prayer"): Block => ({
  kind: "release", page: { at: "top", mood: "moved" }, before: [{ say: "When you’re ready, you can close this prayer.", mood: "tender", act: "settle" }], from, fallback, ref,
});
const starter: Lesson = { id: "pray-no-words", title: "I Don’t Know What to Say", subtitle: "", kind: "Learning to pray", scripture: "", minutes: 5, theme: "rose", blocks: [] };
const back = { title: starter.title, sub: "Learning to pray · Matthew 6", lessonId: starter.id };

// 1. Romans 8:26: even sighs count. No builder at all: stillness, then a release with nothing written.
const rom826 = v("In the same way, the Spirit also helps our weaknesses, for we don’t know how to pray as we ought. But the Spirit himself makes intercession for us with groanings which can’t be uttered.", "Romans 8:26");
export const praySpirit: Lesson = {
  id: "pray-no-words-spirit", title: "When You Don’t Have the Words", subtitle: "Even a sigh can be a prayer", kind: "Learning to pray", scripture: "Romans 8:26", minutes: 4, theme: "rose",
  blocks: [
    intro("When You Don’t Have the Words", ["Some days there just aren’t any words.", "Paul wrote about days like that. Let’s look."]),
    { kind: "highlight", page: { at: "top", mood: "thinking" }, verse: rom826, target: "we don’t know how to pray as we ought",
      before: [{ say: "Look at what Paul admits, about himself and everyone.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark what Paul admits, or tap it",
      after: [
        { say: "Even Paul said we don’t know how to pray as we should.", at: "top", mood: "surprised", act: "hop" },
        { say: "And he says the Spirit helps, with groanings too deep for words.", mood: "moved", act: "nod" },
      ] },
    { kind: "still", page: { at: "top", mood: "thinking" }, before: [{ say: "So let’s not use words for a minute.", mood: "tender", act: "settle" }],
      invite: "Press the circle when you’re ready", text: "If all you have is a sigh, that’s okay. Bring the sigh.", verse: v("the Spirit also helps our weaknesses", "Romans 8:26") },
    release("When You Don’t Have the Words", "No words today. That’s okay. Paul says the Spirit helps when we can’t.", "none"),
    done("Even a sigh can be a prayer.", ["Paul admitted we don’t always know how to pray.", "He wrote that the Spirit helps us in our weakness.", "On wordless days, you can still come."], rom826, ["Romans 8:26"], [back]),
  ],
};

// 2. Matthew 6:9–13: the Lord's Prayer as a pattern, phrase by phrase, then in your own words.
const lords = v("Pray like this: ‘Our Father in heaven, may your name be kept holy. Let your Kingdom come. Let your will be done, as in heaven, so on earth. Give us today our daily bread. Forgive us our debts, as we also forgive our debtors. Bring us not into temptation, but deliver us from the evil one. For yours is the Kingdom, the power, and the glory forever. Amen.’", "Matthew 6:9–13");
export const prayTeachMe: Lesson = {
  id: "pray-teach-me", title: "Teach Me to Pray", subtitle: "The prayer Jesus gave", kind: "Learning to pray", scripture: "Matthew 6:9–13", minutes: 6, theme: "rose",
  blocks: [
    intro("Teach Me to Pray", ["Jesus’ friends once asked him how to pray.", "He gave them a prayer. You can pray it word for word, or use it as a pattern."]),
    { kind: "scripturePrayer", page: { at: "top", mood: "happy" }, before: [{ say: "Tap any line. Each one opens a way to pray it in your own words.", mood: "happy", act: "nod" }],
      verse: lords,
      phrases: [
        { phrase: "Our Father in heaven", prompt: "Father, I come to you as your child, just as I am." },
        { phrase: "Let your will be done", prompt: "God, I want what you want, even when it’s not what I’d choose." },
        { phrase: "Give us today our daily bread", prompt: "God, here’s what I need for today…" },
        { phrase: "Forgive us our debts, as we also forgive our debtors", prompt: "Forgive me for… And help me forgive…" },
        { phrase: "deliver us from the evil one", prompt: "God, protect me from what pulls me away from you." },
      ],
      after: [{ say: "Praise, surrender, needs, forgiveness, protection. A whole life fits in it.", at: "top", mood: "moved", act: "nod" }] },
    { kind: "builder", page: { at: "corner", mood: "happy" }, save: "prayer", label: "Pray it your way", placeholder: "Use the pattern, or don’t. Short is fine.",
      prompts: {}, fallback: ["Father,", "Today I need…", "Forgive me for…", "Help me forgive…", "Keep me close to you."] },
    release("Teach Me to Pray", "You didn’t write anything. You can always pray Jesus’ words as they are."),
    done("A prayer to come back to.", ["Jesus gave his friends a prayer to pray.", "It covers praise, surrender, daily needs, forgiveness and protection.", "You can pray it word for word, or let it shape your own words."], v("Give us today our daily bread.", "Matthew 6:11"), ["Matthew 6:9–13"], [back]),
  ],
};

// 3. Philippians 4:6: gratitude, starting from what kind of thing you're grateful for.
export const prayGratitude: Lesson = {
  id: "pray-gratitude", title: "A Prayer of Gratitude", subtitle: "Starting with thank you", kind: "Learning to pray", scripture: "Philippians 4:6", minutes: 4, theme: "rose",
  blocks: [
    intro("A Prayer of Gratitude", ["Want to try the easiest prayer to start with?", "Thank you. That’s it. Let’s find what you’re thankful for."]),
    { kind: "highlight", page: { at: "top", mood: "thinking" }, verse: v("In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.", "Philippians 4:6"), target: "with thanksgiving",
      before: [{ say: "Look at how Paul says to bring things to God.", show: "verse", mood: "curious", act: "tilt" }], prompt: "Mark it, or tap it",
      after: [{ say: "Even when we’re asking for things, thankfulness comes along.", at: "top", mood: "happy", act: "nod" }] },
    { kind: "topic", page: { at: "top", mood: "curious" }, key: "thanks", prompt: "What could you thank God for?",
      options: [
        { id: "people", text: "A person in my life", reply: "People are some of the best gifts there are." },
        { id: "small", text: "Something small from today", reply: "Small things count. Coffee counts." },
        { id: "hard", text: "Something hard that helped me grow", reply: "That’s a deep kind of thanks." },
        { id: "god", text: "Who God is", reply: "Thanking God for who he is: that’s worship." },
      ] },
    { kind: "builder", page: { at: "corner", mood: "happy" }, topicKey: "thanks", save: "prayer", label: "Say thank you", placeholder: "A line or two is plenty.",
      prompts: {
        people: ["God, thank you for…", "I’m grateful for how they…", "Please bless them with…"],
        small: ["God, thank you for…", "Today I noticed…", "It reminded me that…"],
        hard: ["God, I didn’t like going through…", "But thank you that…", "Help me see…"],
        god: ["God, thank you that you are…", "Thank you that you never…", "I love that you…"],
      },
      fallback: ["God, thank you for…"] },
    release("A Prayer of Gratitude", "Even unwritten, thank you is a prayer."),
    done("Thank you is a prayer.", ["Paul ties thanksgiving into every kind of prayer.", "Gratitude can start small, with today.", "Thanking God for who he is, is worship."], v("In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.", "Philippians 4:6"), ["Philippians 4:6"], [back]),
  ],
};

// 4. 1 Peter 5:7: name the worry, hand it over (the release is the casting gesture), then be still.
export const prayWorried: Lesson = {
  id: "pray-worried", title: "When You’re Worried", subtitle: "Casting it on him", kind: "Learning to pray", scripture: "1 Peter 5:7", minutes: 5, theme: "rose",
  blocks: [
    intro("When You’re Worried", ["Worry has a way of following us around.", "Let’s try bringing it to God instead of carrying it alone."]),
    { kind: "feelings", page: { at: "top", mood: "thinking" }, prompt: "What’s on your mind today?",
      options: [
        { text: "The future.", reply: "Not knowing what’s ahead is hard." },
        { text: "Money.", reply: "That one keeps a lot of people up at night." },
        { text: "Someone I love.", reply: "Worry often comes from love." },
        { text: "Something I can’t name.", reply: "That’s okay. You don’t need a name for it." },
      ],
      many: "A few things at once. That’s a lot to carry." },
    { kind: "highlight", page: { at: "top", mood: "thinking" }, verse: v("casting all your worries on him, because he cares for you.", "1 Peter 5:7"), target: "because he cares for you",
      before: [{ say: "Peter wrote this. Look at the reason he gives.", show: "verse", mood: "curious", act: "tilt" }], prompt: "Mark the reason, or tap it",
      after: [{ say: "Not because you’ve got it together. Because he cares.", at: "top", mood: "moved", act: "nod" }] },
    { kind: "builder", page: { at: "corner", mood: "tender" }, save: "prayer", label: "Name it, and hand it over", placeholder: "You don’t need to write details. Even one word is enough.",
      prompts: {}, fallback: ["God, I’m worried about…", "I can’t fix…", "I’m handing this to you.", "Please give me peace."] },
    release("When You’re Worried", "You didn’t write it down. You can still hand it over."),
    { kind: "still", page: { at: "top", mood: "thinking" }, invite: "Press the circle when you’re ready", text: "You don’t have to pick it back up. Breathe.", verse: v("the peace of God, which surpasses all understanding", "Philippians 4:7") },
    done("You don’t carry it alone.", ["Peter says to cast all your worries on God.", "The reason is simple: he cares for you.", "You can hand worries over, again and again."], v("casting all your worries on him, because he cares for you.", "1 Peter 5:7"), ["1 Peter 5:7", "Philippians 4:7"], [back]),
  ],
};

// 5. 1 Timothy 2:1: praying for someone else, starting with who.
export const praySomeone: Lesson = {
  id: "pray-someone", title: "Praying for Someone Else", subtitle: "Bringing someone with you", kind: "Learning to pray", scripture: "1 Timothy 2:1", minutes: 5, theme: "rose",
  blocks: [
    intro("Praying for Someone Else", ["Prayer isn’t only about us.", "Let’s bring someone else along today."]),
    { kind: "topic", page: { at: "top", mood: "curious" }, key: "who", prompt: "Who comes to mind?",
      options: [
        { id: "family", text: "Someone in my family", reply: "Family. Close to home." },
        { id: "friend", text: "A friend who’s struggling", reply: "They might not know it, but this is a gift." },
        { id: "hard", text: "Someone I find hard to love", reply: "That’s a brave one to choose." },
        { id: "leaders", text: "Leaders, or people in charge", reply: "Paul specifically asked for that." },
      ] },
    { kind: "scripturePrayer", page: { at: "top", mood: "happy" }, verse: v("I exhort therefore, first of all, that petitions, prayers, intercessions, and givings of thanks, be made for all men:", "1 Timothy 2:1"),
      before: [{ say: "Paul lists different ways to pray for people. Tap one.", mood: "happy", act: "nod" }],
      phrases: [
        { phrase: "petitions", prompt: "God, please give them…" },
        { phrase: "intercessions", prompt: "God, I’m standing in for them today. Please be with them in…" },
        { phrase: "givings of thanks", prompt: "God, thank you for them, especially…" },
        { phrase: "for all men", prompt: "God, even the people I don’t understand, or find hard, I bring them to you." },
      ] },
    { kind: "builder", page: { at: "corner", mood: "happy" }, topicKey: "who", save: "prayer", label: "Pray for them", placeholder: "You don’t have to use their name.",
      prompts: {
        family: ["God, I bring you…", "They need…", "Help me love them well."],
        friend: ["God, please be with my friend.", "They’re going through…", "Show me how to help."],
        hard: ["God, this is hard, but I pray for…", "Please bless them.", "And change my heart toward them."],
        leaders: ["God, please give wisdom to…", "Help them lead with…", "Let there be peace."],
      },
      fallback: ["God, please be with…"] },
    release("Praying for Someone Else", "They’re in your prayers, even if you didn’t write it down."),
    done("You brought someone with you.", ["Paul urges prayers and thanks for all people.", "Praying for someone can change how you see them.", "You can do it in a single sentence."], v("I exhort therefore, first of all, that petitions, prayers, intercessions, and givings of thanks, be made for all men:", "1 Timothy 2:1"), ["1 Timothy 2:1"], [back]),
  ],
};

// 6. Psalm 13: lament. Honest anger is in the Bible; the psalm moves from "how long" to "but I trust" without
// pretending that's quick.
const ps13 = v("How long, Yahweh? Will you forget me forever? How long will you hide your face from me?", "Psalm 13:1");
export const prayAngry: Lesson = {
  id: "pray-angry", title: "When You’re Angry With God", subtitle: "The prayers called laments", kind: "Learning to pray", scripture: "Psalm 13 · Psalm 22", minutes: 5, theme: "rose",
  blocks: [
    { kind: "dialogue", page: { at: "hero", act: "settle", mood: "tender" }, lines: [
      { say: "Sometimes the honest prayer is: why?", mood: "tender" },
      { say: "If you’re angry with God, you’re not the first. The Bible has prayers for exactly that.", mood: "thinking", act: "nod" },
    ], display: { text: "When You’re Angry With God", sub: "Learning to pray · take your time" }, reply: "Show me" },
    { kind: "context", page: { at: "top", mood: "thinking" }, before: [{ say: "These are called laments. Here’s one from David.", show: "verse", mood: "tender", open: true }],
      verse: ps13, hint: "Tap the marked words", visual: "pair",
      links: [
        { phrase: "Will you forget me forever", label: "Forgotten", note: "He tells God he feels forgotten." },
        { phrase: "hide your face from me", label: "Hidden", note: "And that God seems to be hiding." },
      ],
      after: [
        { say: "This is in the Bible. God kept it there.", at: "top", mood: "moved", open: false },
        { say: "Even Jesus prayed a lament, from the cross: “My God, my God, why have you forsaken me?”", mood: "tender" },
      ] },
    { kind: "builder", page: { at: "corner", mood: "tender" }, save: "prayer", label: "Tell him honestly", placeholder: "You can say it plainly. This is between you and God.",
      prompts: {}, fallback: ["God, how long…", "I feel…", "I don’t understand why…", "But I still want to trust you."] },
    { kind: "scripturePrayer", page: { at: "top", mood: "thinking" }, verse: v("But I trust in your loving kindness. My heart rejoices in your salvation.", "Psalm 13:5"),
      before: [{ say: "David’s psalm doesn’t end where it began. Look how it turns.", mood: "thinking" }],
      phrases: [
        { phrase: "But I trust", prompt: "God, I’m still upset. But I choose to trust you, even with this." },
        { phrase: "your loving kindness", prompt: "God, remind me of your love, when I can’t feel it." },
      ],
      after: [{ say: "Laments don’t pretend. They bring the anger to God, and stay.", at: "top", mood: "moved", act: "nod" }] },
    release("When You’re Angry With God", "You didn’t write it. You can still bring it to him, as it is."),
    done("Honest prayer is still prayer.", ["The Bible includes angry, grieving prayers called laments.", "Bringing your anger to God is a way of staying with him.", "Psalm 13 turns to trust, without pretending it’s easy."], ps13, ["Psalm 13", "Psalm 22:1", "Psalm 62:8"], [back]),
  ],
};

// 7. Psalm 51: confession. No one is asked to name anything; stillness comes before the release.
export const prayForgive: Lesson = {
  id: "pray-forgive", title: "Asking for Forgiveness", subtitle: "Create in me a clean heart", kind: "Learning to pray", scripture: "Psalm 51", minutes: 5, theme: "rose",
  blocks: [
    { kind: "dialogue", page: { at: "hero", act: "settle", mood: "tender" }, lines: [
      { say: "Saying sorry to God can feel heavy.", mood: "tender" },
      { say: "Psalm 51 shows a way to do it, honestly and with hope.", mood: "thinking", act: "nod" },
    ], display: { text: "Asking for Forgiveness", sub: "Learning to pray · take your time" }, reply: "Let’s start" },
    { kind: "turning", scene: "still", page: { at: "top", mood: "thinking" }, beats: [
      { tag: "context", intensity: 0, text: "The psalm’s heading links it to King David, after his sin with Bathsheba was exposed by the prophet Nathan.", say: "A king, caught out.", mood: "tender" },
      { tag: "text", intensity: 0, text: "He doesn’t make excuses. He asks for mercy.", verse: v("Have mercy on me, God, according to your loving kindness. According to the multitude of your tender mercies, blot out my transgressions.", "Psalm 51:1"), say: "Mercy, because of who God is.", mood: "moved" },
    ], after: [] },
    { kind: "scripturePrayer", page: { at: "top", mood: "thinking" }, verse: v("Create in me a clean heart, O God. Renew a right spirit within me.", "Psalm 51:10"),
      before: [{ say: "Pick a phrase to pray.", mood: "tender" }],
      phrases: [
        { phrase: "Create in me a clean heart", prompt: "God, I can’t make myself new. Please make my heart clean." },
        { phrase: "Renew a right spirit within me", prompt: "God, help me start again, the right way." },
      ] },
    { kind: "builder", page: { at: "corner", mood: "tender" }, save: "prayer", label: "Your own words, if you want", placeholder: "You don’t need to write anything specific down.",
      prompts: {}, fallback: ["God, I’m sorry for…", "Please forgive me.", "Help me make it right.", "Thank you for your mercy."] },
    { kind: "still", page: { at: "top", mood: "thinking" }, invite: "Press the circle when you’re ready", text: "Breathe. You came honestly. That’s what this psalm is about.", verse: v("A broken and contrite heart, O God, you will not despise.", "Psalm 51:17") },
    release("Asking for Forgiveness", "You didn’t write it down. Your honest heart is what Psalm 51 is about."),
    done("Mercy is the starting point.", ["David came to God honestly, without excuses.", "He asked for mercy because of God’s loving kindness.", "And he asked for a clean heart, a new start."], v("Create in me a clean heart, O God. Renew a right spirit within me.", "Psalm 51:10"), ["Psalm 51"], [{ title: "Can God forgive anyone?", sub: "Big question · 6 min", lessonId: "forgive-anyone" }]),
  ],
};

// 8. Psalm 46:10: stillness at the centre. No writing at all.
export const prayStill: Lesson = {
  id: "pray-still", title: "Learning to Be Still", subtitle: "Prayer without words", kind: "Learning to pray", scripture: "Psalm 46:10", minutes: 4, theme: "rose",
  blocks: [
    intro("Learning to Be Still", ["This one is quieter.", "Not much talking. Not even from me."]),
    { kind: "highlight", page: { at: "top", mood: "thinking" }, verse: v("“Be still, and know that I am God.", "Psalm 46:10"),
      before: [{ say: "One line from a psalm. Read it slowly.", show: "verse", mood: "tender" }], prompt: "Swipe across it, slowly",
      after: [{ say: "The psalm was written about a world in uproar. Stillness in the middle of it.", at: "top", mood: "moved", act: "nod" }] },
    { kind: "still", page: { at: "top", mood: "thinking" }, invite: "Press the circle when you’re ready", text: "Be still. You don’t have to do anything right now.", verse: v("Be still, and know that I am God.", "Psalm 46:10"), after: [{ say: "Take as long as you need. There’s no rush here.", mood: "tender" }] },
    { kind: "scripturePrayer", page: { at: "top", mood: "happy" }, verse: v("God is our refuge and strength, a very present help in trouble.", "Psalm 46:1"),
      before: [{ say: "Here’s how the psalm begins. Pick a phrase to carry with you.", mood: "happy" }],
      phrases: [
        { phrase: "God is our refuge", prompt: "God, you’re my safe place today." },
        { phrase: "a very present help", prompt: "God, thank you that you’re here, now." },
      ] },
    done("Stillness is a prayer too.", ["Psalm 46 calls for stillness in a noisy world.", "You can pray without words.", "God is a very present help."], v("God is our refuge and strength, a very present help in trouble.", "Psalm 46:1"), ["Psalm 46:1", "Psalm 46:10"], [back]),
  ],
};

export const prayMore = [praySpirit, prayTeachMe, prayGratitude, prayWorried, praySomeone, prayAngry, prayForgive, prayStill];
