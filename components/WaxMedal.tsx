import { AchievementMedal } from "./AchievementReveal";
import type { SFSymbolName } from "./Symbol";
const SYMBOLS: SFSymbolName[] = ["envelope", "sun.max", "moon", "star", "book", "heart", "sparkles", "leaf", "flame", "crown"];

/** Shared medal artwork for legacy milestone shelves and the new reveal. */
export function WaxMedal({ size = 72, icon, index = 0, earned = true }: { size?: number; icon?: SFSymbolName; index?: number; earned?: boolean }) {
  return <AchievementMedal size={size} icon={icon ?? SYMBOLS[index % SYMBOLS.length]} earned={earned}/>;
}
