import { milestoneArtworkId } from '@/lib/achievementArtwork';
import type { Milestone } from "@/lib/milestones";
import { AchievementReveal } from "./AchievementReveal";
import type { SFSymbolName } from "./Symbol";

type Props = { milestone: Milestone; badgeIndex: number; onClose: () => void; showBack?: boolean; newlyUnlocked?: boolean };
const SYMBOLS: SFSymbolName[] = ["envelope", "sun.max", "moon", "star", "book", "heart", "sparkles", "leaf", "flame", "crown"];

export function MilestoneDetailView({ milestone, badgeIndex, onClose, newlyUnlocked = false }: Props) {
  return <AchievementReveal
    achievementId={milestoneArtworkId(milestone.day)}
    title={milestone.day === 1 ? "Your first letter." : milestone.title}
    detail={milestone.day === 1 ? "You made a little room for God.\nA small beginning worth keeping." : `You kept showing up.\n${milestone.day} days of making room for God.\nEvery small step matters.`}
    icon={milestone.day === 1 ? "envelope" : SYMBOLS[badgeIndex % SYMBOLS.length]}
    newlyEarned={newlyUnlocked}
    onContinue={onClose}
  />;
}
