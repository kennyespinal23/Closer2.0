import { milestones as milestoneData } from "@/assets/data/milestones.js";
import type { Milestone } from "@/assets/data/milestones";

export type { Milestone, MilestoneType } from "@/assets/data/milestones";

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
