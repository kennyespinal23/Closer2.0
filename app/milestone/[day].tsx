import { useLocalSearchParams, useRouter } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import { useEffect } from "react";
import { MilestoneDetailView } from "@/components/MilestoneDetailView";
import {
  getMilestoneByDay,
  getMilestoneIndex,
  isMilestoneUnlocked,
} from "@/lib/milestones";
import { useMilestoneUnlockStreak } from "@/lib/useMilestoneUnlockStreak";

/**
 * Milestone detail — pushed from the Streaks milestones grid.
 * Uses stack navigation instead of an in-tree Modal so taps
 * inside the Streaks ScrollView reliably open the page.
 */
export default function MilestoneDetailScreen() {
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const router = useRouter();
  const milestoneUnlockStreak = useMilestoneUnlockStreak();

  const day = Number(dayParam);
  const milestone = Number.isFinite(day) ? getMilestoneByDay(day) : undefined;
  const unlocked =
    milestone !== undefined &&
    isMilestoneUnlocked(milestone, milestoneUnlockStreak);

  useEffect(() => {
    if (!unlocked) {
      goBackOr(router, "/(tabs)/today");
    }
  }, [unlocked, router]);

  if (!milestone || !unlocked) {
    return null;
  }

  return (
    <MilestoneDetailView
      milestone={milestone}
      badgeIndex={getMilestoneIndex(milestone)}
      onClose={() => goBackOr(router, "/(tabs)/today")}
    />
  );
}
