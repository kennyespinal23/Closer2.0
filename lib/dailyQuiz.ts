import type { FloatingScriptureCard } from "@/constants/homePrototype";
export type DailyQuestion = { prompt: string; quote?: string; options: string[]; answer: number; explanation: string };
/** Deterministic, source-grounded recall questions; no invented theological claims. */
export function buildDailyQuiz(card: FloatingScriptureCard): DailyQuestion[] {
  const words = [...card.scriptureText.matchAll(/\b[A-Za-z][A-Za-z’'-]{4,}\b/g)];
  const candidates = words.filter(m => !["shall", "there", "their", "which", "would", "could", "these", "those", "because", "about", "before", "after"].includes(m[0].toLowerCase()));
  const chosen = candidates[(card.day - 1) % Math.max(1, candidates.length)] ?? words[0] ?? [...card.scriptureText.matchAll(/\b[A-Za-z][A-Za-z’'-]+\b/g)][0];
  const place = (correct: string, others: string[], seed: number) => {
    const seen = new Set([correct.toLowerCase()]);
    const distractors = others.filter(v => { const key = v.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 3);
    const options = [...distractors]; const answer = seed % (options.length + 1); options.splice(answer, 0, correct); return { options, answer };
  };
  const reference = place(card.scriptureReference, ["Psalm 23:1", "John 3:16", "Romans 8:28", "Genesis 1:1"], card.day);
  const questions: DailyQuestion[] = [{ prompt: "Where is today’s verse found?", ...reference, explanation: `Today’s reading is ${card.scriptureReference}: “${card.scriptureText}”` }];
  if (chosen && chosen.index !== undefined) {
    const correct = chosen[0];
    const alternatives = words.map(w => w[0]).filter(w => w.toLowerCase() !== correct.toLowerCase());
    const options = place(correct, [...alternatives, "wisdom", "strength", "peace", "promise"], card.day + 1);
    questions.push({ prompt: "Which word completes today’s verse?", quote: card.scriptureText.slice(0, chosen.index) + "_____" + card.scriptureText.slice(chosen.index + correct.length), ...options, explanation: `The verse says “${correct}.” Read it once more: ${card.scriptureText}` });
  }
  return questions;
}
