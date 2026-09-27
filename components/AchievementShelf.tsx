import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";
import { type Achievement } from "@/lib/useAchievements";
import { WaxMedal } from "./WaxMedal";
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
    return <View key={category} style={{ gap: 16 }}>{!compact && <View style={{ alignSelf: "flex-start", backgroundColor: "#DBB56D", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 5 }}><Text style={{ color: "#3A2410", fontSize: 14, fontWeight: "600" }}>{category} · {list.filter(a => a.value >= a.target).length}/{list.length}</Text></View>}{rows.map((row,r) => <View key={r}><View style={{ flexDirection: "row", alignItems: "flex-end", paddingTop: 8 }}>{row.map((a,i) => <Animated.View key={a.id} entering={reduced ? undefined : FadeInDown.delay(i * 45 + r * 60).springify().damping(16).stiffness(180)} style={{ flex: 1, alignItems: "center" }}><Pressable accessibilityRole="button" accessibilityLabel={`${a.title}, ${a.value >= a.target ? "earned" : `${Math.min(a.value,a.target)} of ${a.target}`}`} onPress={() => { haptics.soft(); setSelected(a); }} style={{ minHeight: 80, minWidth: 60, alignItems: "center", justifyContent: "flex-end", paddingBottom: 0 }}><WaxMedal icon={a.icon} size={62} earned={a.value >= a.target} /></Pressable></Animated.View>)}{Array.from({length: columns-row.length},(_,i)=><View key={i} style={{flex:1}} />)}</View><ReaderMaterialGradient colors={["#D29A62","#A36A3A","#7A4C26"]} style={{ height: 16, borderRadius: 3, boxShadow: "0 8px 12px #3C1E0A38" }} /><View style={{ flexDirection: "row", paddingTop: 12 }}>{row.map(a => <View key={a.id} style={{ flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 3 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: "600", textAlign: "center" }}>{a.title}</Text>{a.value < a.target && !compact && <><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ width: `${Math.min(100, a.value / a.target * 100)}%`, height: 4, backgroundColor: "#83B8C8" }} /></View><Text style={{ fontSize: 11, color: colors.inkMuted }}>{Math.min(a.value,a.target)}/{a.target}</Text></>}</View>)}{Array.from({length: columns-row.length},(_,i)=><View key={i} style={{flex:1}} />)}</View></View>)}</View>;
  })}{selected && <AchievementDetail achievement={selected} onClose={() => setSelected(null)} />}</View>;
}
function AchievementDetail({ achievement: a, onClose }: { achievement: Achievement; onClose: () => void }) {
  const colors = useColors(), reduced = useReducedMotion(), inset = useSafeAreaInsets();
  const p = useSharedValue(0), seal = useSharedValue(0);
  useEffect(() => { p.value = reduced ? 1 : withSpring(1, { damping: 24, stiffness: 220 }); seal.value = reduced ? 1 : withDelay(180, withSpring(1, { damping: 13, stiffness: 180 })); }, []);
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1-p.value)*600 }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: p.value }));
  const medal = useAnimatedStyle(() => ({ opacity: seal.value, transform: [{ scale: .5 + seal.value*.5 }, { rotate: `${-20*(1-seal.value)}deg` }] }));
  const close = () => { p.value = withTiming(0, { duration: reduced ? 0 : 260 }, done => { if(done) runOnJS(onClose)(); }); };
  return <Modal transparent animationType="none" onRequestClose={close}><View style={{ flex: 1, justifyContent: "flex-end" }}><Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "#160D0788" }, backdrop]}><Pressable accessibilityLabel="Close achievement" accessibilityRole="button" onPress={close} style={{ flex: 1 }} /></Animated.View><Animated.View accessibilityViewIsModal style={[{ maxHeight: "85%", padding: 24, paddingBottom: inset.bottom + 22, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderCurve: "continuous", gap: 18 }, sheet]}><ScrollView contentContainerStyle={{ alignItems: "center", gap: 16 }}><Animated.View style={medal}><WaxMedal size={110} icon={a.icon} earned={a.value >= a.target} /></Animated.View><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 28, fontWeight: "700", textAlign: "center" }}>{a.title}</Text><Text style={{ color: colors.inkMuted, fontSize: 17, lineHeight: 25, textAlign: "center" }}>{a.detail}</Text><Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>{a.value >= a.target ? "Achievement earned" : `${a.value} of ${a.target}`}</Text></ScrollView><Pressable accessibilityRole="button" onPress={close} style={{ minHeight: 52, padding: 16, borderRadius: 26, backgroundColor: colors.ink, alignItems: "center" }}><Text style={{ color: colors.bg, fontSize: 17, fontWeight: "600" }}>Close</Text></Pressable></Animated.View></View></Modal>;
}
