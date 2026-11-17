import type { Lesson } from "../lesson/types";

/* Heart to Heart: How Close Do You Feel to God?
   A conversation with Page, not a survey. The picture is a road at dusk with a house at the end and the porch light
   on (the father in Jesus' story watched the road, Luke 15:20). You put your lantern wherever you are today, and
   Page meets each place with Scripture and one gentle question. If you kept an answer before, he starts by asking
   how things have been since; after a long while, he asks what you'd say to the person you were then.

   Kept honest, line by line:
   - Every place is a feeling drawn as a place. Nothing is a score, a level or a judgement, and no place is "better".
   - Page never speaks for God; Scripture speaks, word for word from the World English Bible.
   - Nothing is kept unless the person says yes to exactly what would be kept, shown to them first. It stays in this
     browser on this device (heart.ts says what that does and doesn't mean), and can be deleted in You.
   - The closing prayer is written for Closer and labelled so; it's optional. */

const WEB = "World English Bible";

export const heartClose = {
  id: "heart-close",
  title: "How Close Do You Feel to God?",
  subtitle: "Just you, me, and an honest question",
  kind: "Heart to Heart",
  scripture: "Luke 15 · Psalm 139 · Acts 17",
  minutes: 5,
  theme: "ember",
  quiet: true,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      display: { text: "How Close Do You Feel to God?", sub: "Heart to Heart · 5 min" },
      lines: [
        { say: "Today isn’t a lesson. It’s a conversation.", mood: "tender", act: "settle" },
        { say: "There are no right answers, and nothing gets scored.", mood: "happy", act: "nod" },
      ],
      reply: "Let’s talk",
    },
    {
      kind: "hcloseTalk",
      page: { at: "top", mood: "tender" },
      intro: [
        "Jesus told a story about a father who kept watching the road.",
        "So here’s a road at dusk, and a house with the porch light on.",
      ],
      back: {
        hello: "Hi{name}. It’s good to see you again.",
        recall: "{When}, you told me: “{said}”.",
        ask: "How have things been since then?",
        key: "change",
        options: [
          { text: "Closer than before", reply: "I’m really glad. Hold on to whatever helped." },
          { text: "About the same", reply: "The same can be steady. Not every season has to change." },
          { text: "Further away", reply: "Thank you for telling me. Honest is a good place to start." },
          { text: "I honestly don’t know", reply: "That’s alright. Sometimes we only see it looking back." },
        ],
      },
      letter: {
        ask: "If you could talk to yourself from {when}, what would you say?",
        placeholder: "A line or two, if you like…",
        write: "Say it",
        skip: "Skip this",
        thanks: "Thank you. That was kind of you, to you.",
      },
      ask: {
        first: "Where are you on the road today? Put your lantern there.",
        again: "Where would you put yourself on the road today?",
      },
      hint: "Tap a place, or drag your lantern",
      places: {
        porch: {
          label: "On the porch, in the light",
          reply: "On the porch, in the light. I’m so glad.",
          lead: "Here’s a promise to keep close.",
          verse: { text: "Draw near to God, and he will draw near to you.", ref: "James 4:8", translation: WEB },
          follow: {
            ask: "What’s been helping you feel close?",
            options: [
              { text: "Praying", reply: "Keep talking to him. He’s listening." },
              { text: "Reading Scripture", reply: "His words have a way of drawing us in." },
              { text: "Other people", reply: "God often comes close through his people." },
              { text: "I’m not sure, it’s just there", reply: "Sometimes nearness is simply a gift. Enjoy it." },
            ],
          },
        },
        road: {
          label: "On the road, the light in view",
          reply: "On the road, with the light in view. That’s honest.",
          lead: "The psalmist says this about how near he is.",
          verse: { text: "Yahweh is near to all those who call on him, to all who call on him in truth.", ref: "Psalm 145:18", translation: WEB },
          follow: {
            ask: "What’s between you and the porch right now?",
            options: [
              { text: "I’ve been busy", reply: "Busy weeks happen. The light is still on." },
              { text: "Doubts and questions", reply: "Questions don’t push God away. Bring them with you." },
              { text: "Something I did", reply: "He knows already. You can bring that to him too." },
              { text: "Nothing I can name", reply: "That’s alright. You don’t need a reason to walk closer." },
            ],
          },
        },
        far: {
          label: "A long way down the road",
          reply: "A long way down the road. Thank you for being honest.",
          lead: "In Jesus’ story, look who runs to whom.",
          verse: { text: "But while he was still far off, his father saw him, and was moved with compassion, and ran, and fell on his neck, and kissed him.", ref: "Luke 15:20", translation: WEB },
          follow: {
            ask: "How long has it felt this way?",
            options: [
              { text: "A long time", reply: "That’s heavy to carry. You don’t have to fix it today." },
              { text: "Just lately", reply: "Seasons like this come. They don’t get the last word." },
              { text: "Since something happened", reply: "Hard things can make God feel far. He’s near the hurting." },
              { text: "I’d rather not get into it", reply: "That’s fine. We can just sit here a moment." },
            ],
          },
        },
        fog: {
          label: "Somewhere in the fog",
          reply: "In the fog, not sure where you are. That’s honest too.",
          lead: "Even there, a psalm says this.",
          verse: { text: "If I take the wings of the dawn, and settle in the uttermost parts of the sea; Even there your hand will lead me, and your right hand will hold me.", ref: "Psalm 139:9–10", translation: WEB },
          follow: {
            ask: "What would help most right now?",
            options: [
              { text: "Knowing he’s there", reply: "The psalm says he is, even when we can’t see." },
              { text: "Some clarity", reply: "Ask him for it. You can pray “help me see”." },
              { text: "Just being honest about it", reply: "You just were. That counts for a lot." },
            ],
          },
        },
        moves: {
          label: "It moves around",
          reply: "Some days close, some days far. That’s very human.",
          lead: "Here’s something that doesn’t move.",
          verse: { text: "because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.", ref: "Lamentations 3:22–23", translation: WEB },
          follow: {
            ask: "When does he feel closest?",
            options: [
              { text: "When I’m quiet", reply: "Then make a little room for quiet. He meets you there." },
              { text: "When things are hard", reply: "Many people find that. Psalm 34 says so too." },
              { text: "With other people", reply: "That’s worth noticing. Keep those people near." },
              { text: "I can’t tell", reply: "That’s alright. Noticing takes time." },
            ],
          },
        },
      },
      decline: {
        label: "I’d rather not say",
        reply: "That’s completely fine. You don’t owe me an answer.",
        lead: "",
        verse: { text: "Yahweh, you have searched me, and you know me.", ref: "Psalm 139:1", translation: WEB },
      },
    },
    {
      kind: "hcloseKeep",
      page: { at: "top", mood: "tender" },
      write: {
        ask: "Anything you’d like to say about it? A line is plenty.",
        placeholder: "Whatever’s true today…",
        yes: "Write a line",
        no: "Not today",
      },
      keep: {
        ask: "Want me to remember this, so we can come back to it another day?",
        detail: "Private, in this browser on this device only. Not synced, not backed up, never sent anywhere. You can delete it any time in You → Saved.",
        yes: "Yes, remember this",
        no: "No, don’t keep it",
        kept: "Kept, just for you.",
        notKept: "Okay, nothing kept.",
      },
      prayer: {
        offer: "Would you like to pray together?",
        yes: "Pray with me",
        no: "Not right now",
        label: "Pray it, out loud or quietly",
        text: "Lord, thank you that you are near, wherever I am on the road today. Help me come close to you, and help me trust that you are never far from me. In Jesus’ name, amen.",
        note: "A prayer written for Closer, not Scripture.",
      },
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "nod" },
      calm: true,
      title: "Wherever you are on the road",
      body: "",
      summary: [
        "Nothing here was a score. Where you put yourself was just honest.",
        "In Jesus’ story, the father runs while his son is still far off.",
        "Scripture says God is not far from each one of us.",
      ],
      verse: { text: "though he is not far from each one of us.", ref: "Acts 17:27", translation: WEB },
      refs: ["Luke 15:11–24", "James 4:8", "Psalm 145:18", "Psalm 139:1–10", "Lamentations 3:22–23", "Acts 17:27"],
      related: [
        { title: "What’s Been on Your Heart Lately?", sub: "Heart to Heart · 5 min", lessonId: "heart-lately" },
        { title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", lessonId: "god-far-away" },
        { title: "I Don’t Know What to Say", sub: "Learning to Pray · Matthew 6", lessonId: "pray-no-words" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
