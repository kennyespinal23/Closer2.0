import { useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";
import { type Achievement } from "@/lib/useAchievements";
import { AchievementMedal, AchievementReveal } from "./AchievementReveal";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import * as haptics from "@/lib/haptics";
export function AchievementShelf({ achievements, compact = false }: { achievements: Achievement[]; compact?: boolean }) {
  const colors = useColors(), reduced = useReducedMotion(), { width, fontScale } = useWindowDimensions();
  const [selected, setSelected] = useState<Achievement | null>(null);
  const columns = fontScale > 1.3 || width < 360 ? 3 : 4;
  const categories = compact ? [""] : [...new Set(achievements.map(a => a.category))];
  return <View style={{ gap: compact ? 0 : 28 }}>{categories.map(category => {
    const list = compact ? [...achievements].sort((a,b) => Number(b.value >= b.target) - Number(a.value >= a.target)).slice(0, columns) : achievements.filter(a => a.category === category);
    const rows = Array.from({ length: Math.ceil(list.length / columns) }, (_, i) => list.slice(i * columns, (i+1) * columns));
    return <View key={category} style={{ gap: 16 }}>{!compact && <View style={{ alignSelf: "flex-start", backgroundColor: "#DBB56D", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 5 }}><Text style={{ color: "#3A2410", fontSize: 14, fontWeight: "600" }}>{category} · {list.filter(a => a.value >= a.target).length}/{list.length}</Text></View>}{rows.map((row,r) => <View key={r}><View style={{ flexDirection: "row", alignItems: "flex-end", paddingTop: 8 }}>{row.map((a,i) => <Animated.View key={a.id} entering={reduced ? undefined : FadeInDown.delay(i * 45 + r * 60).springify().damping(16).stiffness(180)} style={{ flex: 1, alignItems: "center" }}><Pressable accessibilityRole="button" accessibilityLabel={`${a.title}, ${a.value >= a.target ? "earned" : `${Math.min(a.value,a.target)} of ${a.target}`}`} onPress={() => { haptics.soft(); setSelected(a); }} style={{ minHeight: 80, minWidth: 60, alignItems: "center", justifyContent: "flex-end", paddingBottom: 0 }}><AchievementMedal achievementId={a.id} icon={a.icon} size={76} earned={a.value >= a.target} /></Pressable></Animated.View>)}{Array.from({length: columns-row.length},(_,i)=><View key={i} style={{flex:1}} />)}</View><ReaderMaterialGradient colors={["#D29A62","#A36A3A","#7A4C26"]} style={{ height: 16, borderRadius: 3, boxShadow: "0 8px 12px #3C1E0A38" }} /><View style={{ flexDirection: "row", paddingTop: 12 }}>{row.map(a => <View key={a.id} style={{ flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 3 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: "600", textAlign: "center" }}>{a.title}</Text>{a.value < a.target && !compact && <><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ width: `${Math.min(100, a.value / a.target * 100)}%`, height: 4, backgroundColor: "#83B8C8" }} /></View><Text style={{ fontSize: 11, color: colors.inkMuted }}>{Math.min(a.value,a.target)}/{a.target}</Text></>}</View>)}{Array.from({length: columns-row.length},(_,i)=><View key={i} style={{flex:1}} />)}</View></View>)}</View>;
  })}{selected && <AchievementDetail achievement={selected} onClose={() => setSelected(null)} />}</View>;
}
function AchievementDetail({ achievement: a, onClose }: { achievement: Achievement; onClose: () => void }) {
  const earned = a.value >= a.target;
  const firstLetter = a.id === "letters-1" && earned;
  return <Modal animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <AchievementReveal achievementId={a.id} title={firstLetter ? "Your first letter." : a.title} detail={firstLetter ? "You made a little room for God.\nA small beginning worth keeping." : a.detail} icon={a.icon} earned={earned} onContinue={onClose}/>
  </Modal>;
}
