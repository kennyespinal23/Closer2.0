/* Psalms & Emotions after Psalm 13. These are suggested associations, not claims that a psalm expresses only one
   feeling. Each will get its own movements and interactions; none is forced into three stages or a happy ending. */
export type PsalmPlan = { id: string; feeling: string; psalm: number; title: string; shape: string };

export const PSALM_PLANS: PsalmPlan[] = [
  { id: "56", feeling: "Fear", psalm: 56, title: "When I Am Afraid", shape: "A refrain that returns (vv 3–4, 10–11): fear and trust side by side, more than once." },
  { id: "4", feeling: "Anger", psalm: 4, title: "Before You Lie Down", shape: "Speaking to God, then to others, then lying down in peace: an evening psalm." },
  { id: "100", feeling: "Gratitude", psalm: 100, title: "Enter With Thanks", shape: "One movement, all invitation: a procession toward the gates." },
  { id: "142", feeling: "Loneliness", psalm: 142, title: "No One Cares for My Soul", shape: "A cry from a cave (as its heading says), ending in a hope not yet reached." },
  { id: "126", feeling: "Hope", psalm: 126, title: "Like Streams in the Negev", shape: "Remembered joy, then a prayer for it again: hope looking both ways." },
  { id: "51", feeling: "Repentance", psalm: 51, title: "Create in Me a Clean Heart", shape: "Confession, then a request for renewal; no landscape tricks, just honesty." },
  { id: "42", feeling: "Grief", psalm: 42, title: "Why Are You Downcast?", shape: "A refrain (vv 5, 11) that repeats without resolving; the experience doesn’t resolve it either." },
  { id: "8", feeling: "Wonder", psalm: 8, title: "What Is Man?", shape: "Opens and closes with the same line: the night sky, and our place under it." },
  { id: "150", feeling: "Praise", psalm: 150, title: "Let Everything Praise", shape: "Praise from start to finish, building instrument by instrument." },
];
