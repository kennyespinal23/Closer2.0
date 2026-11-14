import type { Block } from "../lesson/types";

/* Bible Mysteries: the case files after 001. Each one is written as a Lesson on the same case schema
   (caseOpen … report), using only the interactions its real evidence supports. Each case's file follows its plan,
   so no case is built around an object, source or finding that doesn't exist. */

export type CasePlan = {
  id: string; title: string; refs: string;
  /** the lesson that plays it */
  lesson: string;
  /** the Explore tile: a short name and the main passage */
  tile: string; ref: string; status: "Unresolved" | "Partly resolved";
  /** the interactions that fit this case's actual evidence */
  uses: Block["kind"][];
  /** what the evidence really is, so the case can't drift into invention */
  evidence: string;
};

export const FUTURE_CASES: CasePlan[] = [
  { id: "002", lesson: "mystery-nephilim", tile: "The Nephilim", ref: "Genesis 6", title: "Who were the Nephilim?", refs: "Genesis 6:1–4", status: "Unresolved",
    uses: ["caseOpen", "sorter", "theories", "report"],
    evidence: "Four verses and Numbers 13:33. Readings: angelic beings, Seth’s line, ancient rulers. No artifact; no inspector." },
  { id: "003", lesson: "mystery-hebrews", tile: "Who wrote Hebrews?", ref: "Hebrews", title: "Who wrote Hebrews?", refs: "Hebrews · early church", status: "Unresolved",
    uses: ["caseOpen", "board", "theories", "sorter", "report"],
    evidence: "The letter names no author. Early writers (Clement, Origen, Tertullian, as quoted by Eusebius) proposed Paul, Barnabas, Luke and others." },
  { id: "004", lesson: "mystery-tribes", tile: "The lost tribes", ref: "2 Kings 17", title: "What happened to the ten lost tribes?", refs: "2 Kings 17 · Assyrian records", status: "Partly resolved",
    uses: ["caseOpen", "caseTimeline", "board", "theories", "reconstruct", "report"],
    evidence: "2 Kings 17; Assyrian royal inscriptions on deportations; later traditions. Scripture also shows northerners still in Judah (2 Chronicles 30)." },
  { id: "005", lesson: "mystery-thorn", tile: "Paul’s thorn", ref: "2 Corinthians 12", title: "What was Paul’s thorn in the flesh?", refs: "2 Corinthians 12:7–10", status: "Unresolved",
    uses: ["caseOpen", "board", "sorter", "theories", "report"],
    evidence: "Paul never says. Clues people weigh: Galatians 4:13–15, 6:11. Readings: illness, eyesight, opposition, temptation." },
  { id: "006", lesson: "mystery-eden", tile: "Where was Eden?", ref: "Genesis 2", title: "Where was the Garden of Eden?", refs: "Genesis 2:8–14", status: "Unresolved",
    uses: ["caseOpen", "board", "theories", "sorter", "report"],
    evidence: "Four rivers named: Pishon, Gihon, Tigris, Euphrates. Two are known today, two aren’t identified. No artifact." },
  { id: "007", lesson: "mystery-star", tile: "The Star of Bethlehem", ref: "Matthew 2", title: "What was the Star of Bethlehem?", refs: "Matthew 2:1–12", status: "Unresolved",
    uses: ["caseOpen", "caseTimeline", "sorter", "theories", "report"],
    evidence: "Matthew’s account alone. Proposals: a planetary conjunction, a comet or nova, a miraculous sign. Dating depends on Herod’s death." },
  { id: "008", lesson: "mystery-hidden-years", tile: "Jesus’ hidden years", ref: "Luke 2", title: "What happened in Jesus’ unrecorded years?", refs: "Luke 2:41–52 · the Gospels", status: "Unresolved",
    uses: ["caseOpen", "caseTimeline", "sorter", "reconstruct", "report"],
    evidence: "Luke 2:41–52 and Mark 6:3 are almost all there is. Later legends (e.g. travel stories) are labelled as legends." },
];
