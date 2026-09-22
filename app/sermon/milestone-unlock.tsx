import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { MilestoneDetailView } from "@/components/MilestoneDetailView";
import { getMilestoneByDay, getMilestoneIndex } from "@/lib/milestones";
import * as haptics from "@/lib/haptics";

export default function MilestoneUnlockScreen() {
  const router = useRouter();
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const day = Number(dayParam);
  const milestone = Number.isFinite(day) ? getMilestoneByDay(day) : undefined;
  if (!milestone) return <Redirect href="/today" />;
  return <MilestoneDetailView milestone={milestone} badgeIndex={getMilestoneIndex(milestone)} newlyUnlocked onClose={() => {
    haptics.soft();
    router.replace("/today");
  }} />;
}
