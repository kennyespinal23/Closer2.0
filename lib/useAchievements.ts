import { useDevTools } from "@/state/devTools";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProgress } from "@/state/progress";
import { useAnnotations } from "@/state/annotations";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { BOOKS } from "@/constants/books";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import type { SFSymbolName } from "@/components/Symbol";
export type Achievement = { id: string; category: string; title: string; detail: string; icon: SFSymbolName; value: number; target: number };
export function useAchievements() {
  const { unlockAllMilestones } = useDevTools();
  const { totalCompletions, streak, chaptersRead } = useProgress();
  const { counts } = useAnnotations();
  const { ids } = useBibleMomentCollection();
  const [extras, setExtras] = useState({ express: 0, prayer: 0, right: 0, verse: 0 });
  useFocusEffect(useCallback(() => {
    let alive = true;
    void (async () => {
      const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith("closer.express.") || k.startsWith("closer.daily-practice.") || k === "closer.profile-verse.v1");
      const rows = await AsyncStorage.multiGet(keys); const next = { express: 0, prayer: 0, right: 0, verse: 0 };
      for (const [key, raw] of rows) { try { const v = JSON.parse(raw || "null"); if (!v) continue; if (key.startsWith("closer.express.")) next.express += v.completed ? 1 : 0; else if (key === "closer.profile-verse.v1") next.verse = v.text && v.reference ? 1 : 0; else { next.prayer += v.prayer ? 1 : 0; next.right += v.quiz && Number.isFinite(v.quizScore) ? Math.max(0, v.quizScore) : 0; } } catch { /* A malformed record never earns a badge. */ } }
      if (alive) setExtras(next);
    })().catch(() => {});
    return () => { alive = false; };
  }, []));
  const finished = BOOKS.filter(b => new Set(chaptersRead.filter(c => c.bookId === b.id).map(c => c.chapter)).size >= b.chapters);
  const genesis = BIBLE_MOMENTS.filter(m => m.bookId === "genesis");
  const result: Achievement[] = [];
  const add = (id: string, category: string, title: string, detail: string, icon: SFSymbolName, value: number, target = 1) => result.push({ id, category, title, detail, icon, value, target });
  [1,7,30,100].forEach((n,i) => add(`letters-${n}`, "Daily letters", ["First Letter","Seven Letters","Thirty Letters","A Hundred Letters"][i], `Finish ${n === 1 ? "your first daily letter" : `${n} daily letters`}.`, "envelope", totalCompletions, n));
  [1,7,30,100].forEach((n,i) => add(`streak-${n}`, "Streaks", ["Lit the Match","Seven Days","Thirty Days","A Hundred Days"][i], `Keep your light going for ${n} ${n === 1 ? "day" : "days"}.`, ["flame","sun.max","moon","star"][i] as SFSymbolName, streak.longest, n));
  add("chapter", "Reading", "Turned the Page", "Finish your first chapter in the Bible reader.", "book", chaptersRead.length);
  add("highlight", "Reading", "First Highlight", "Highlight a verse that stood out to you.", "pencil", counts.highlights);
  add("note", "Reading", "First Note", "Leave a note on a verse.", "note.text", counts.notes);
  add("listener", "Reading", "Listener", "Listen to a chapter read aloud. Unlocks when Bible recordings are available.", "headphones", 0);
  add("genesis", "Reading", "In the Beginning", "Finish the book of Genesis.", "leaf", Number(finished.some(b => b.id === "genesis")));
  add("express", "Reading", "Express Lane", "Finish an Express version of a book.", "bolt", extras.express);
  add("law", "Reading", "The Law", "Finish Genesis, Exodus, Leviticus, Numbers, and Deuteronomy.", "book.closed", finished.filter(b => ["genesis","exodus","leviticus","numbers","deuteronomy"].includes(b.id)).length, 5);
  add("bible", "Reading", "Every Word", "Read every book, from Genesis to Revelation.", "crown", finished.length, 66);
  add("moment", "Bible Moments", "First Moment", "Collect your first Bible Moment while reading.", "rectangle.on.rectangle", ids.length);
  add("garden", "Bible Moments", "Garden Set", "Find every Moment in Genesis and unlock its silver foil card.", "leaf", genesis.filter(m => ids.includes(m.id)).length, genesis.length);
  add("ten", "Bible Moments", "Ten Moments", "Collect ten Bible Moments.", "sparkles", ids.length, 10);
  add("all", "Bible Moments", "Every Moment", "Collect every Bible Moment.", "crown", ids.length, BIBLE_MOMENTS.length);
  add("amen", "Prayer and questions", "First Amen", "Finish a daily prayer.", "hands.sparkles", extras.prayer);
  add("honest", "Prayer and questions", "Honest Answer", "Write your first reflection as a note on Scripture.", "heart", counts.notes);
  add("quiz", "Prayer and questions", "Sharp Eye", "Get five daily quick-check questions right.", "eye", extras.right, 5);
  add("verse", "Prayer and questions", "Your Verse", "Choose a verse of your own for your profile.", "sun.max", extras.verse);
  return { achievements: unlockAllMilestones ? result.map(a => ({ ...a, value: Math.max(a.value, a.target) })) : result, finishedBooks: finished.length };
}
