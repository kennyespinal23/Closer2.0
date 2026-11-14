import type { Lesson, Source } from "../lesson/types";
const corrie: string = require("../assets/tenboom/corrie-c1921.jpg");
const shop: string = require("../assets/tenboom/watch-shop-1957.jpg");

/* Testimony: Corrie ten Boom (1892–1983), "The woman who forgave her captor".
   Told as a frame: it opens on the meeting in Munich in 1947, cuts away before her answer, goes back to the
   war, and returns to the moment she forgave him.
   - War facts follow the United States Holocaust Memorial Museum: born 15 April 1892 in Amsterdam; grew up in
     Haarlem above the watch shop; hid Jews full time from 1943; raid 28 Feb 1944 (about 30 arrested; six people
     in the hiding place not found); father died about ten days later; Scheveningen, Vught, Ravensbrück
     (Sept 1944); Betsie died Dec 1944; Corrie released late Dec 1944; Yad Vashem 1967.
   - The meeting with the guard is known only from her own telling (her 1972 Guideposts article, "I'm Still
     Learning to Forgive", and her later books), so every beat of it is tagged "From her own telling". The
     "captor" was a guard at Ravensbrück, as she told it, not the people who arrested her.
   - Her books are under copyright and we have no permission to quote them: nothing of hers is quoted. */

const WEB = "World English Bible";

const sources: Source[] = [
  { title: "Corrie ten Boom", publisher: "United States Holocaust Memorial Museum", url: "https://encyclopedia.ushmm.org/content/en/article/corrie-ten-boom" },
  { title: "Righteous Among the Nations: the ten Boom family", publisher: "Yad Vashem", url: "https://collections.yadvashem.org/en/righteous/4014036" },
  { title: "“I’m Still Learning to Forgive” (Corrie ten Boom, 1972)", publisher: "Guideposts", url: "https://guideposts.org/?p=21828" },
  { title: "The Travels of Corrie ten Boom", publisher: "Wheaton College Archives", url: "https://fromthevault.wheaton.edu/2019/02/01/the-travels-of-corrie-ten-boom/" },
  { title: "Corrie ten Boom, about 1921 (photographer unknown)", publisher: "Wikimedia Commons (public domain)", url: "https://commons.wikimedia.org/wiki/File:CorrieTenBoom.jpg" },
  { title: "Horlogerie ten Boom, Barteljorisstraat 19, 1957 (photo: Cees de Boer)", publisher: "Noord-Hollands Archief, via Wikimedia Commons (CC0)", url: "https://commons.wikimedia.org/wiki/File:Horlogerie_ten_Boom_in_de_Barteljorisstraat_19._NL-HlmNHA_54015581.JPG" },
  { title: "Her books are under copyright, so this lesson describes her account instead of quoting it", publisher: "Closer" },
];

export const corrieTenBoom = {
  id: "corrie-ten-boom",
  title: "The woman who forgave her captor",
  subtitle: "Corrie ten Boom, 1892–1983",
  kind: "Testimony",
  scripture: "Haarlem · Ravensbrück · Munich",
  minutes: 6,
  theme: "walnut",
  pronoun: "she",
  sources,
  blocks: [
    // The hook: the meeting, before we know what she'll do
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "thinking" },
      lines: [
        { say: "Germany, 1947. A church in Munich.", mood: "thinking" },
        { say: "A woman has just finished speaking about forgiveness. A man walks towards her.", mood: "tender", act: "settle" },
        { say: "Her name is Corrie ten Boom. And she knows his face.", show: "portrait", at: "left", mood: "surprised" },
      ],
      portrait: {
        src: corrie,
        alt: "Black-and-white photograph of a smiling young woman in a dark hat and scout uniform",
        credit: "Corrie ten Boom, about 1921. Photographer unknown. Public domain, via Wikimedia Commons.",
        name: "Corrie ten Boom",
        dates: "1892–1983",
      },
      reply: "Who was he?",
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { when: "1947", tag: "account", intensity: 0, text: "After speaking at a church in Munich, Corrie said, she recognised a man coming towards her through the crowd.", say: "She recognised him at once.", mood: "surprised", act: "settle" },
        { tag: "account", intensity: 0, text: "He had been a guard at Ravensbrück, the concentration camp where she had been held, and where her sister Betsie died.", say: "He had been a guard at the camp.", mood: "tender" },
        { tag: "account", intensity: 0, text: "He told her he had become a Christian since the war. Then he held out his hand, and asked her to forgive him.", say: "To see why that was so hard, we need to go back a few years.", mood: "thinking", act: "nod" },
      ],
      after: [],
    },
    // Back to the beginning
    {
      kind: "timeline",
      page: { at: "top", mood: "tender" },
      note: {
        title: "First, the context",
        text: "In May 1940 Germany invaded the Netherlands. Under the occupation, Jewish people were stripped of their rights and deported to camps. About three in four Jews in the Netherlands were murdered in the Holocaust.",
      },
      before: [
        { say: "Before Munich, there was a watch shop in Haarlem.", mood: "thinking" },
        { say: "And a war that hunted Jewish people across Europe.", mood: "tender", act: "settle" },
        { say: "Here’s how her family came to be part of it.", show: "events", mood: "thinking" },
      ],
      hint: "Tap each year",
      events: [
        { year: "1892", title: "Born in Amsterdam", tag: "fact", body: "Cornelia “Corrie” ten Boom grew up in Haarlem, where her family ran a watch shop with their home above it.", say: "A watchmaker’s family." },
        { year: "1920s", title: "A watchmaker herself", tag: "fact", body: "She became one of very few licensed women watchmakers in the Netherlands.", say: "And she became one too." },
        { year: "1930s", title: "Already helping", tag: "fact", body: "Her brother Willem’s nursing home in Hilversum sheltered Jews fleeing Nazi Germany.", say: "The family was helping before the war reached them." },
        { year: "1943", title: "Hiding people at home", tag: "fact", body: "Corrie, her sister Betsie and their father Casper began hiding Jewish people full time, with a small hiding place built behind a false wall in Corrie’s bedroom. With a wider resistance network, the family is credited with helping hundreds of people.", say: "Then they opened their home." },
      ],
      after: [
        { say: "Why risk everything?", at: "top", mood: "thinking", act: "tilt" },
        { say: "In her later books and talks, Corrie said their faith was the reason.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { when: "28 February 1944", tag: "fact", intensity: 0, text: "After the family was betrayed, police raided the house and arrested about thirty people, including Corrie, Betsie and their father.", say: "Then came the raid.", mood: "surprised", act: "settle" },
        { tag: "fact", intensity: 0, text: "Six people were inside the hiding place. They weren’t found, and were moved to safety days later.", say: "The hiding place held.", mood: "moved" },
        { when: "March 1944", tag: "fact", intensity: 0, text: "Casper ten Boom, 84, died about ten days after his arrest.", say: "Her father didn’t survive prison.", mood: "tender" },
        { when: "1944", tag: "fact", intensity: 0, text: "Corrie and Betsie were held at Scheveningen prison, then at the Vught camp, and in September were deported to Ravensbrück, a concentration camp for women in Germany.", say: "Then Ravensbrück.", mood: "tender" },
        { tag: "account", intensity: 0, text: "In Ravensbrück, by Corrie’s telling, the sisters secretly read the Bible and prayed with other prisoners.", say: "Even there, they prayed.", mood: "moved" },
        { when: "December 1944", tag: "fact", intensity: 0, text: "Betsie died in Ravensbrück. At the end of that month, Corrie was released. She later said it was because of a clerical error.", say: "Betsie didn’t come home.", mood: "tender", act: "settle" },
      ],
      after: [],
    },
    {
      kind: "artifact",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "The house is still standing, in Haarlem.", mood: "thinking" },
        { say: "Here it is in 1957, twelve years after the war.", mood: "curious", open: true },
      ],
      title: "Barteljorisstraat 19",
      date: "Haarlem",
      image: {
        src: shop,
        alt: "Black-and-white photograph of a narrow Dutch shopfront with a sign reading ten Boom, on a city street",
        credit: "Horlogerie ten Boom, Barteljorisstraat 19, Haarlem, 1 May 1957. Photo: Cees de Boer, Noord-Hollands Archief. CC0.",
      },
      focus: { x: 0.58, y: 0.42, scale: 2 },
      notes: [
        { tag: "fact", text: "The family lived above the shop. The hiding place was upstairs, in Corrie’s bedroom." },
        { tag: "fact", text: "In 1967 Yad Vashem, Israel’s Holocaust memorial, honoured Corrie as Righteous Among the Nations. Her father and sister were honoured in 2007." },
        { tag: "legend", text: "Often said: Corrie saved hundreds on her own. The rescue was the work of a family and a wider resistance network, and the numbers are estimates." },
      ],
      after: [
        { say: "An ordinary shop. An ordinary family.", mood: "moved", open: false },
        { say: "Here’s what the record says.", show: "notes", mood: "thinking" },
        { say: "Now, back to Munich. And that outstretched hand.", mood: "tender", act: "settle" },
      ],
    },
    // Back to the moment
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "tender" },
      beats: [
        { when: "Munich, 1947", tag: "account", intensity: 0, text: "Standing in front of him, she later wrote, she couldn’t lift her hand. She remembered Betsie, and the camp.", say: "She couldn’t do it.", mood: "tender", act: "settle" },
        { tag: "account", intensity: 0, text: "She wrote that she prayed for help, because she couldn’t forgive him on her own.", say: "So she prayed.", mood: "thinking" },
        { tag: "account", intensity: 0, text: "She took his hand, and found that she could forgive him.", say: "And she took his hand.", mood: "moved", act: "nod" },
        { tag: "interpretation", intensity: 0, text: "Corrie understood that moment as God doing in her what she couldn’t do herself.", say: "We only have her telling. Here’s how she understood it.", mood: "thinking" },
        { when: "1972", tag: "fact", intensity: 0, text: "Decades later she wrote about it in an article titled “I’m Still Learning to Forgive”.", say: "Still learning, she said. Even then.", mood: "moved" },
      ],
      after: [],
    },
    {
      kind: "legacy",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "What did she do with the rest of her life?", mood: "thinking" },
        { say: "Look at two seasons.", show: "compare", mood: "curious" },
      ],
      then: {
        label: "1943–1944",
        items: ["Hiding Jewish people above the watch shop", "Arrested, imprisoned, and sent to Ravensbrück", "Losing her father and her sister"],
      },
      later: {
        label: "1945–1983",
        items: [
          "Opened a home in the Netherlands for people recovering from the war",
          "Travelled to dozens of countries, speaking about forgiveness",
          "Published The Hiding Place in 1971, made into a film in 1975",
          "Died on her 91st birthday, 15 April 1983, in California",
        ],
      },
      note: "Forgiving one guard didn’t make the Holocaust any less evil, and she never said it did. The people the family hid are the reason this story matters.",
      after: [
        { say: "She didn’t call herself a hero. She talked about God, and about forgiveness.", mood: "moved" },
        { say: "And she admitted it never got easy.", mood: "tender", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Corrie ten Boom",
      lines: [{ say: "That’s Corrie ten Boom’s story.", mood: "thinking" }],
      check: {
        prompt: "What stands out to you most about her story?",
        options: [
          { text: "Forgiving the unforgivable.", reply: "It’s staggering. And she was honest that she couldn’t do it alone.", mood: "thinking", act: "tilt" },
          { text: "Faith that opens the door.", reply: "Yes. Their faith wasn’t just believed. It was lived, at enormous cost.", mood: "moved", act: "nod" },
          { text: "“Still learning to forgive.”", reply: "Me too. It’s comforting that even she was still learning.", mood: "moved", act: "nod" },
          { text: "I want to think about it.", reply: "Take your time. It’s a heavy story.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Is there someone you’re still learning to forgive?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "Corrie ten Boom, 1892–1983",
      body: "The Lord is always closer than you think.",
      summary: [
        "Her family hid Jewish people during the Nazi occupation, and paid a terrible price.",
        "After the war, by her own telling, she met a former Ravensbrück guard, and forgave him.",
        "She said she couldn’t do it alone, and that she was still learning to forgive.",
      ],
      scripture: {
        label: "A related passage from Scripture",
        text: "Forgive us our debts, as we also forgive our debtors.",
        ref: "Matthew 6:12",
        translation: WEB,
      },
      sources,
      related: [
        { title: "Can God forgive anyone?", sub: "Big question · 6 min", lessonId: "forgive-anyone" },
        { title: "Why does God allow suffering?", sub: "Big question · 6 min", lessonId: "why-suffering" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
