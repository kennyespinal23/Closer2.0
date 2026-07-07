import { effectiveMilestoneStreak } from "@/lib/milestones";
import { useDevTools } from "@/state/devTools";
import { useProgress } from "@/state/progress";

/** Longest streak for milestone unlock checks — honors dev QA override. */
export function useMilestoneUnlockStreak(): number {
  const { unlockAllMilestones } = useDevTools();
  const { streak } = useProgress();
  return effectiveMilestoneStreak(streak.longest, unlockAllMilestones);
}
