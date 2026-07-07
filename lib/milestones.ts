import { milestones as milestoneData } from "@/assets/data/milestones.js";
import type { Milestone, MilestoneCategory } from "@/assets/data/milestones";

export type { Milestone, MilestoneCategory, MilestoneType } from "@/assets/data/milestones";

/** Days that receive landmark (gold ring + glow) treatment on the grid. */
export const LANDMARK_MILESTONE_DAYS: ReadonlyArray<number> = [30, 90, 180, 365];

const MILESTONE_CATEGORY_CYCLE: ReadonlyArray<MilestoneCategory> = [
  "JOURNEY",
  "REFLECTION",
  "PRAYER",
  "MARKER",
];

const MILESTONE_CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  JOURNEY: "#34C759",
  REFLECTION: "#BF5AF2",
  PRAYER: "#64D2FF",
  BLESSING: "#FF9F0A",
  MARKER: "#8E8E93",
};

export function isLandmarkMilestone(day: number): boolean {
  return LANDMARK_MILESTONE_DAYS.includes(day);
}

/** Color-coded category label for the streaks milestone grid. */
export function getMilestoneCategory(milestone: Milestone): MilestoneCategory {
  if (milestone.type === "BLESSING") return "BLESSING";
  return MILESTONE_CATEGORY_CYCLE[(milestone.day - 1) % 4]!;
}

export function milestoneCategoryColor(category: MilestoneCategory): string {
  return MILESTONE_CATEGORY_COLORS[category];
}

export function milestoneCategoryLabel(category: MilestoneCategory): string {
  return category;
}

/** Category color + label bundle for milestone UI surfaces. */
export function getMilestoneAccent(milestone: Milestone): {
  category: MilestoneCategory;
  color: string;
  label: string;
  isLandmark: boolean;
} {
  const category = getMilestoneCategory(milestone);
  return {
    category,
    color: milestoneCategoryColor(category),
    label: milestoneCategoryLabel(category),
    isLandmark: isLandmarkMilestone(milestone.day),
  };
}

/** All 90 milestone definitions, Day 1 through Day 365. */
export const MILESTONES: ReadonlyArray<Milestone> = milestoneData;

/** Highest milestone threshold — used by dev "unlock all" QA. */
export const MAX_MILESTONE_DAY = MILESTONES[MILESTONES.length - 1]!.day;

/** Streak day thresholds that earn a milestone — used by progress + journey. */
export const MILESTONE_DAYS: ReadonlyArray<number> = MILESTONES.map(
  (m) => m.day,
);

/**
 * Longest streak used when deciding milestone unlock state. Dev QA
 * can pass `unlockAll: true` to surface every badge without faking
 * engaged dates.
 */
export function effectiveMilestoneStreak(
  longestStreak: number,
  unlockAll = false,
): number {
  return unlockAll ? MAX_MILESTONE_DAY : longestStreak;
}

export function isMilestoneUnlocked(
  milestone: Milestone,
  longestStreak: number,
): boolean {
  return longestStreak >= milestone.day;
}

export function getMilestoneByDay(day: number): Milestone | undefined {
  return MILESTONES.find((m) => m.day === day);
}

export function getMilestoneIndex(milestone: Milestone): number {
  return MILESTONES.indexOf(milestone) + 1;
}

export function milestoneLabel(days: number): string {
  const hit = getMilestoneByDay(days);
  return hit?.title ?? `${days}-day streak`;
}

export function milestoneCopy(days: number): string {
  const hit = getMilestoneByDay(days);
  return hit?.message ?? "Day after day. Small faithfulness is real faithfulness.";
}
