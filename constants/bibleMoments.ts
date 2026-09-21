export type BibleMoment = {
  id: string; bookId: string; chapter: number; verse: number;
  title: string; reference: string; happened: string; importance: string; tint: string;
};

// Curated discoveries, separate from daily devotionals and AI explanations.
export const BIBLE_MOMENTS: BibleMoment[] = [
  {
    id: "creation", bookId: "genesis", chapter: 1, verse: 1,
    title: "The Beginning", reference: "Genesis 1:1–5", tint: "#62421F",
    happened: "God creates the heavens and the earth. Light breaks into the darkness, beginning the story of a world brought into being by His word.",
    importance: "The Bible opens with God as the source of life. Creation introduces a world with purpose and goodness—and our place within it as people made to care for what He has made.",
  },
  {
    id: "resurrection", bookId: "matthew", chapter: 28, verse: 6,
    title: "The Resurrection", reference: "Matthew 28:1–10", tint: "#493E68",
    happened: "The women arrive at Jesus’ tomb and hear that He has risen. The angel invites them to see the empty tomb and carry the news to His disciples.",
    importance: "Jesus’ resurrection stands at the heart of Christian faith. It proclaims His victory over death and offers hope that suffering and death do not have the final word.",
  },
];

export const findBibleMoment = (bookId: string, chapter: number, verse: number) =>
  BIBLE_MOMENTS.find((moment) => moment.bookId === bookId && moment.chapter === chapter && moment.verse === verse);
