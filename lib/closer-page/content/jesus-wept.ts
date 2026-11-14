import type { Lesson } from "../lesson/types";

/* Jesus Only: "The Day Jesus Cried", John 11:17–44.
   Central question: what does Jesus do with our grief? Two sisters meet him with the same words: Martha gets a
   conversation about who he is; Mary gets his tears. The takeaway holds both: he is the resurrection and the
   life, and he weeps with the grieving. Every spoken line is Scripture (World English Bible, word for word). */

const WEB = "World English Bible";

export const jesusWept = {
  id: "jesus-wept",
  title: "The Day Jesus Cried",
  subtitle: "Two sisters, two ways he met them",
  kind: "Jesus only",
  scripture: "John 11:17–44",
  minutes: 6,
  theme: "wine",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      lines: [
        { say: "Jesus arrives in Bethany four days too late. His friend Lazarus is dead.", mood: "tender", act: "settle" },
        { say: "Two grieving sisters meet him, and say the very same words.", mood: "thinking" },
        { say: "Watch how differently he meets each of them.", mood: "curious", act: "tilt" },
      ],
      display: { text: "The Day Jesus Cried", sub: "John 11:17–44 · World English Bible" },
      reply: "Go to Bethany",
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { tag: "text", intensity: 0, text: "Lazarus had been dead for four days when Jesus came.", verse: { text: "So when Jesus came, he found that he had been in the tomb four days already.", ref: "John 11:17", translation: WEB }, say: "Four days.", mood: "tender" },
        { tag: "text", intensity: 0, text: "The house was full of mourners.", verse: { text: "Many of the Jews had joined the women around Martha and Mary, to console them concerning their brother.", ref: "John 11:19", translation: WEB }, say: "A house full of grief.", mood: "tender" },
        { tag: "context", intensity: 0, text: "Mourning was public and shared. Friends and neighbours came to sit with the family for days.", say: "Nobody grieved alone.", mood: "thinking" },
      ],
      after: [],
    },
    {
      kind: "exchange",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Martha runs out to meet him.", mood: "curious" }],
      lines: [
        { who: "Martha", text: "“Lord, if you would have been here, my brother wouldn’t have died.", ref: "John 11:21", translation: WEB, say: "Honest. Hurt.", mood: "tender" },
        { who: "Jesus", side: "right", text: "“Your brother will rise again.”", ref: "John 11:23", translation: WEB, say: "He answers with hope.", mood: "thinking" },
        { who: "Martha", text: "“I know that he will rise again in the resurrection at the last day.”", ref: "John 11:24", translation: WEB, say: "Someday, she says.", mood: "thinking" },
        { who: "Jesus", side: "right", text: "“I am the resurrection and the life. He who believes in me will still live, even if he dies.", ref: "John 11:25", translation: WEB, say: "Not just someday. Him.", mood: "surprised", act: "react" },
        { who: "Martha", text: "“Yes, Lord. I have come to believe that you are the Christ, God’s Son, he who comes into the world.”", ref: "John 11:27", translation: WEB, say: "Right in her grief, she says who he is.", mood: "moved", act: "nod" },
      ],
      after: [{ say: "Then Mary comes. With the same words.", at: "top", mood: "tender" }],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { tag: "text", intensity: 0, text: "Mary falls at his feet and says what Martha said.", verse: { text: "Therefore when Mary came to where Jesus was, and saw him, she fell down at his feet, saying to him, “Lord, if you would have been here, my brother wouldn’t have died.”", ref: "John 11:32", translation: WEB }, say: "The same words.", mood: "tender" },
        { tag: "text", intensity: 0, text: "This time, Jesus doesn’t explain anything.", verse: { text: "When Jesus therefore saw her weeping, and the Jews weeping who came with her, he groaned in the spirit, and was troubled,", ref: "John 11:33", translation: WEB }, say: "He was troubled.", mood: "moved" },
      ],
      after: [],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "tender" },
      verse: { text: "Jesus wept.", ref: "John 11:35", translation: WEB },
      before: [
        { say: "He asks where Lazarus is buried. They say, come and see.", mood: "tender" },
        { say: "And then.", show: "verse", mood: "moved" },
      ],
      prompt: "Swipe across the words, slowly",
      after: [
        { say: "He knew he was about to raise Lazarus. He wept anyway.", mood: "moved" },
        { say: "To Martha, he gave words. To Mary, he gave tears.", show: "context", mood: "moved", act: "nod" },
      ],
      context: { text: "“See how much affection he had for him!”", ref: "John 11:36", translation: WEB },
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "curious" },
      beats: [
        { tag: "text", intensity: 0, text: "At the tomb, Jesus told them to move the stone, and Martha hesitated.", verse: { text: "Jesus said, “Take away the stone.” Martha, the sister of him who was dead, said to him, “Lord, by this time there is a stench, for he has been dead four days.”", ref: "John 11:39", translation: WEB }, say: "Martha is practical to the end.", mood: "cheeky" },
        { tag: "text", intensity: 0, text: "Then he called out.", verse: { text: "When he had said this, he cried with a loud voice, “Lazarus, come out!”", ref: "John 11:43", translation: WEB }, say: "He called him by name.", mood: "surprised", act: "lean" },
        { tag: "text", intensity: 0, text: "And Lazarus came out.", verse: { text: "He who was dead came out, bound hand and foot with wrappings, and his face was wrapped around with a cloth.", ref: "John 11:44", translation: WEB }, say: "Alive.", mood: "excited", act: "hop" },
      ],
      after: [],
    },
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "So what does this moment show us about Jesus?", show: "not", mood: "thinking" }],
      not: "Jesus has power, so he doesn’t need to feel our pain.",
      but: "Jesus has power over death, and he still weeps with us.",
      prompt: "Drag the true one into place, or tap it",
      after: [
        { say: "Both are true at once. That’s what makes him different.", mood: "moved", act: "nod" },
        { say: "Here’s the heart of it.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "Jesus is the resurrection and the life, and he meets grieving people with tears, not just answers.",
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Day Jesus Cried",
      lines: [{ say: "Thanks for sitting with this one.", mood: "tender" }],
      check: {
        prompt: "When you’re grieving, what do you need from Jesus most?",
        options: [
          { text: "Answers, like Martha.", reply: "He gave Martha a conversation, and the truth about who he is.", mood: "thinking", act: "nod" },
          { text: "Someone to cry with, like Mary.", reply: "He gave Mary his tears. He hasn’t changed.", mood: "moved", act: "nod" },
          { text: "Both.", reply: "Me too. And he can give both.", mood: "moved", act: "nod" },
          { text: "I’m not grieving right now.", reply: "Then hold onto this for when you are, or for someone who is.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What would you say to him, honestly?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we discovered about Jesus",
      body: "The Lord is always closer than you think.",
      summary: [
        "He told grieving Martha that he is the resurrection and the life.",
        "He wept with grieving Mary, even knowing what he was about to do.",
        "He called Lazarus out of the tomb by name.",
      ],
      verse: { text: "Jesus wept.", ref: "John 11:35", translation: WEB },
      refs: ["John 11:17–44"],
      related: [
        { title: "Why does God allow suffering?", sub: "Big question · 6 min", lessonId: "why-suffering" },
        { title: "Lazarus", sub: "Character study · John 11", lessonId: "lazarus" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
