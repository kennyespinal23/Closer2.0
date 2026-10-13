import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { CloseButton } from "@/components/CloseButton";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { achievementArtwork, type AchievementArtId } from "@/lib/achievementArtwork";
import { useAchievements, type Achievement } from "@/lib/useAchievements";
import { MILESTONES, isMilestoneUnlocked } from "@/lib/milestones";
import { useMilestoneUnlockStreak } from "@/lib/useMilestoneUnlockStreak";
import { goBackOr } from "@/lib/navigation";
import { uiText } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { useProgress } from "@/state/progress";
import { useResolvedScheme } from "@/state/theme";

/**
 * Keepsakes: the badge you're closest to sits on a dark cover inside a gold
 * ring, your milestone mornings run along a road, and every badge family
 * sits on its own shelf. Earned badges open large; milestone days open
 * their letter.
 */
const GOLD = "#E9B949", AMBER = "#C98A1E", CREAM = "#FFF1E4", CREAM_2 = "#D8BDA5";
const FAMILY: Record<string, string> = { "Prayer and questions": "Prayer" };
const earnedLabel = (at?: number) => at ? `Earned ${new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Earned";
const isEarned = (a: Achievement) => a.value >= a.target;

function useTheme() {
  const dark = useResolvedScheme() === "dark";
  return { dark, page: dark ? "#1B1815" : "#FBF9F6", ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", track: dark ? "#FFFFFF1F" : "#E6DED5", dot: dark ? "#2C2620" : "#F1ECE6" };
}

function Badge({ id, size, locked = false }: { id: string; size: number; locked?: boolean }) {
  const art = achievementArtwork[id as AchievementArtId];
  if (!art) return <View style={{ width: size, height: size }}/>;
  return <Image source={art.source} contentFit="contain" style={{ width: size, height: size, opacity: locked ? .38 : 1 }} accessible={false}/>;
}

export default function AchievementsScreen() {
  const router = useRouter(), t = useTheme(), inset = useSafeAreaInsets();
  const { achievements } = useAchievements(), { streak } = useProgress();
  const unlockStreak = useMilestoneUnlockStreak();
  const [open, setOpen] = useState<Achievement | null>(null);
  const earned = achievements.filter(isEarned);
  // The keepsake you're closest to, by share of the way there.
  const next = useMemo(() => achievements.filter(a => !isEarned(a) && a.id !== "listener").sort((a, b) => b.value / b.target - a.value / a.target)[0] ?? null, [achievements]);
  const families = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of achievements) map.set(a.category, [...(map.get(a.category) ?? []), a]);
    return [...map.entries()];
  }, [achievements]);
  const milestonesDone = MILESTONES.filter(m => isMilestoneUnlocked(m, unlockStreak)).length;
  const today = streak.current;
  // The road starts a little before today so the last kept day is in view.
  const roadStart = Math.max(0, MILESTONES.findIndex(m => m.day >= today) - 2);
  const road = MILESTONES.slice(roadStart, roadStart + 10);
  const close = () => goBackOr(router, "/profile");

  return <View style={{ flex: 1, backgroundColor: t.page }}>
    <StatusBar style="light"/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: inset.bottom + 48 }}>
      {/* the cover: your next keepsake, filling up */}
      <View style={[s.cover, { paddingTop: inset.top + 58 }]}>
        <ReaderMaterialGradient colors={["#5A3526", "#3A2219", "#24140E"]} locations={[0, .5, 1]} style={StyleSheet.absoluteFill}/>
        <Text style={s.eyebrow}>{next ? "Your next keepsake" : "Every keepsake is yours"}</Text>
        {next && <>
          <View style={s.ringWrap} accessible accessibilityLabel={`${next.title}. ${Math.min(next.value, next.target)} of ${next.target}`}>
            <ProgressRing value={Math.min(1, next.value / next.target)}/>
            <View style={s.ringBadge}><Badge id={next.id} size={132}/></View>
            <View style={s.ringCount}><Text style={s.ringCountText}>{Math.min(next.value, next.target)} of {next.target}</Text></View>
          </View>
          <Text accessibilityRole="header" style={s.coverTitle}>{next.title}</Text>
          <Text style={s.coverSub}>{next.detail}</Text>
        </>}
        <View style={s.tally}>
          <Tally n={earned.length} label={`of ${achievements.length} keepsakes`}/>
          <Tally n={streak.current} label={streak.current === 1 ? "day in a row" : "days in a row"}/>
          <Tally n={milestonesDone} label={milestonesDone === 1 ? "milestone" : "milestones"}/>
        </View>
      </View>

      {/* the road of mornings */}
      <View style={{ marginTop: 26 }}>
        <View style={s.rowHead}>
          <Text accessibilityRole="header" style={{ ...s.h2, color: t.ink }}>Your mornings</Text>
          <Text style={{ ...s.count, color: t.muted }}>Day {Math.max(1, today)} of 365</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18 }}>
          {road.map((m, i) => {
            const kept = isMilestoneUnlocked(m, unlockStreak), isToday = kept && (road[i + 1] ? !isMilestoneUnlocked(road[i + 1], unlockStreak) : true);
            const upNext = !kept && (i === 0 || isMilestoneUnlocked(road[i - 1], unlockStreak));
            const blessing = m.type === "BLESSING";
            const nextKept = road[i + 1] && isMilestoneUnlocked(road[i + 1], unlockStreak);
            return <Pressable key={m.day} disabled={!kept} onPress={() => { haptics.soft(); router.push(`/milestone/${m.day}` as Href); }}
              accessibilityRole={kept ? "button" : "text"} accessibilityLabel={`Day ${m.day}, ${m.title}${kept ? ", kept. Open" : ""}`} style={{ width: 100 }}>
              {i < road.length - 1 && <View style={[s.line, nextKept ? { backgroundColor: AMBER } : { backgroundColor: t.track }]}/>}
              <View style={[s.dot, { backgroundColor: t.dot, boxShadow: `0 0 0 4px ${t.page}` },
                kept && { backgroundColor: AMBER },
                isToday && { backgroundColor: GOLD, boxShadow: `0 0 0 4px ${t.page}, 0 0 0 6px ${GOLD}` },
                upNext && { backgroundColor: t.page, borderWidth: 2, borderColor: t.ink },
                !kept && blessing && { backgroundColor: "#3A2219" }]}>
                {kept ? <SFSymbol name="checkmark" size={18} color={isToday ? "#4A2C20" : "#FFF"} weight="bold"/> :
                  blessing ? <SFSymbol name="star.fill" size={17} color={GOLD}/> :
                  <Text style={{ fontSize: 16, fontWeight: "900", color: upNext ? t.ink : t.muted }}>{m.day}</Text>}
              </View>
              <Text style={{ ...s.mDay, color: isToday ? "#C4321A" : t.ink }}>Day {m.day}</Text>
              <Text numberOfLines={2} style={{ ...s.mTitle, color: t.muted }}>{m.title}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </View>

      {/* shelves */}
      {families.map(([family, items]) => <View key={family} style={{ marginTop: 30, paddingHorizontal: 20 }}>
        <View style={[s.rowHead, { paddingHorizontal: 0, paddingBottom: 14 }]}>
          <Text accessibilityRole="header" style={{ ...s.h2, color: t.ink }}>{FAMILY[family] ?? family}</Text>
          <Text style={{ ...s.count, color: t.muted }}>{items.filter(isEarned).length} of {items.length}</Text>
        </View>
        <View style={s.grid}>
          {items.map(a => {
            const got = isEarned(a), soon = a.id === "listener" && !got;
            return <Pressable key={a.id} disabled={!got} onPress={() => { haptics.soft(); setOpen(a); }} accessibilityRole={got ? "button" : "text"}
              accessibilityLabel={`${a.title}. ${got ? "Earned. Open" : soon ? "Coming soon" : `${Math.min(a.value, a.target)} of ${a.target}. ${a.detail}`}`} style={s.cell}>
              <View style={{ width: 74, height: 74 }}>
                <Badge id={a.id} size={74} locked={!got}/>
                {!got && <View style={[s.lock, { boxShadow: `0 0 0 2px ${t.page}` }]}><SFSymbol name="lock.fill" size={11} color={CREAM}/></View>}
              </View>
              <Text numberOfLines={2} style={{ ...s.cellTitle, color: got ? t.ink : t.muted }}>{a.title}</Text>
              {got ? <Text style={{ ...s.cellSub, color: "#8E4A22" }}>Earned</Text> : soon ? <Text style={{ ...s.cellSub, color: t.muted }}>Soon</Text> : <>
                <View style={[s.pg, { backgroundColor: t.track }]}><View style={{ width: `${Math.min(100, a.value / a.target * 100)}%`, height: "100%", backgroundColor: AMBER }}/></View>
                <Text style={{ ...s.cellSub, color: t.muted }}>{Math.min(a.value, a.target)}/{a.target}</Text>
              </>}
            </Pressable>;
          })}
        </View>
      </View>)}
    </ScrollView>
    <CloseButton onPress={close} color={CREAM} style={[s.close, { top: inset.top + 4 }]}/>
    <KeepsakeSheet achievement={open} siblings={open ? achievements.filter(a => a.category === open.category) : []} onClose={() => setOpen(null)}/>
  </View>;
}

function Tally({ n, label }: { n: number; label: string }) {
  return <View style={{ alignItems: "center" }}><Text style={s.tallyN}>{n}</Text><Text style={s.tallyL}>{label}</Text></View>;
}

/** A gold ring that fills to `value` when the page opens. */
function ProgressRing({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setShown(value); return; }
    let frame = 0; const start = Date.now() + 250;
    const tick = () => { const k = Math.min(1, Math.max(0, (Date.now() - start) / 900)); setShown(value * (1 - Math.pow(1 - k, 3))); if (k < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  const r = 82, c = 2 * Math.PI * r;
  return <Svg width={176} height={176} viewBox="0 0 176 176" style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
    <Circle cx={88} cy={88} r={r} fill="none" stroke="#FFF1E424" strokeWidth={6}/>
    <Circle cx={88} cy={88} r={r} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={c * (1 - Math.max(.02, shown))}/>
  </Svg>;
}

/** An earned keepsake, large, on warm rays. Rises on one smooth curve. */
function KeepsakeSheet({ achievement, siblings, onClose }: { achievement: Achievement | null; siblings: Achievement[]; onClose: () => void }) {
  const inset = useSafeAreaInsets(), reduced = useReducedMotion();
  const last = useRef<Achievement | null>(null);
  if (achievement) last.current = achievement;
  const a = achievement ?? last.current;
  const pop = useSharedValue(0);
  useEffect(() => { if (achievement) { pop.value = 0; pop.value = withTiming(1, { duration: reduced ? 150 : 520, easing: Easing.bezier(.2, .9, .25, 1.15) }); } }, [achievement, reduced, pop]);
  const badge = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: reduced ? 1 : .82 + .18 * pop.value }, { translateY: reduced ? 0 : 20 * (1 - pop.value) }] }));
  if (!a) return null;
  const index = siblings.findIndex(x => x.id === a.id) + 1;
  return <Modal visible={!!achievement} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "#1E110B" }}>
      <ReaderMaterialGradient colors={["#6A3E2A", "#3A2219", "#1E110B"]} locations={[0, .45, 1]} style={StyleSheet.absoluteFill}/>
      <CloseButton onPress={onClose} color={CREAM} style={[s.close, { top: inset.top + 4 }]}/>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Animated.View style={badge}><Badge id={a.id} size={220}/></Animated.View>
        <Text style={[s.eyebrow, { marginTop: 28 }]}>{FAMILY[a.category] ?? a.category} · Keepsake {index} of {siblings.length}</Text>
        <Text accessibilityRole="header" style={[s.coverTitle, { fontSize: 36, lineHeight: 38 }]}>{a.title}</Text>
        <Text style={[s.coverSub, { fontSize: 17 }]}>{a.detail}</Text>
        <View style={s.when}><View style={s.whenTick}><SFSymbol name="checkmark" size={11} color="#4A2C20" weight="bold"/></View><Text style={{ ...uiText.supporting, fontWeight: "700", color: CREAM }}>{earnedLabel(a.earnedAt)}</Text></View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: inset.bottom + 16 }}>
        <Pressable onPress={onClose} accessibilityRole="button" style={s.keep}><Text style={{ ...uiText.body, fontWeight: "800", color: "#17120F" }}>Keep it</Text></Pressable>
        <Pressable onPress={() => void Share.share({ message: `I earned “${a.title}” on Closer.` })} accessibilityRole="button" accessibilityLabel="Share" style={s.shareBtn}><SFSymbol name="square.and.arrow.up" size={20} color={CREAM}/></Pressable>
      </View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  cover: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, borderCurve: "continuous", overflow: "hidden", alignItems: "center" },
  close: { position: "absolute", left: 16, width: 44, height: 44, backgroundColor: "#FFF1E41F", zIndex: 5 },
  eyebrow: { fontSize: 12, lineHeight: 15, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", color: GOLD, textAlign: "center" },
  ringWrap: { width: 176, height: 176, marginTop: 18, alignItems: "center", justifyContent: "center" },
  ringBadge: { width: 132, height: 132 },
  ringCount: { position: "absolute", right: 2, bottom: 6, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: GOLD, justifyContent: "center" },
  ringCountText: { fontSize: 14, fontWeight: "900", color: "#4A2C20" },
  coverTitle: { ...uiText.screenTitle, fontSize: 32, lineHeight: 34, letterSpacing: -.8, color: CREAM, textAlign: "center", marginTop: 14 },
  coverSub: { ...uiText.supporting, fontSize: 16, lineHeight: 22, color: CREAM_2, textAlign: "center", marginTop: 8, maxWidth: 320 },
  tally: { flexDirection: "row", justifyContent: "center", gap: 26, marginTop: 20, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#FFC93C55", alignSelf: "stretch" },
  tallyN: { ...uiText.screenTitle, fontSize: 28, lineHeight: 32, color: GOLD },
  tallyL: { fontSize: 13, lineHeight: 16, fontWeight: "700", color: CREAM_2, marginTop: 2 },
  rowHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 20 },
  h2: { ...uiText.sectionTitle, fontSize: 22, lineHeight: 26, fontWeight: "900" },
  count: { fontSize: 13, fontWeight: "800" },
  line: { position: "absolute", left: 46, width: 54, top: 22, height: 3, borderRadius: 2 },
  dot: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  mDay: { fontSize: 15, lineHeight: 18, fontWeight: "900", marginTop: 10 },
  mTitle: { fontSize: 13, lineHeight: 16, fontWeight: "600", marginTop: 2, paddingRight: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 18 },
  cell: { width: "25%", alignItems: "center", paddingHorizontal: 3 },
  lock: { position: "absolute", right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: "#3A2219", alignItems: "center", justifyContent: "center" },
  cellTitle: { fontSize: 13, lineHeight: 15, fontWeight: "800", textAlign: "center", marginTop: 8 },
  cellSub: { fontSize: 12, lineHeight: 14, fontWeight: "700", textAlign: "center", marginTop: 4 },
  pg: { width: 46, height: 4, borderRadius: 2, overflow: "hidden", marginTop: 6 },
  when: { flexDirection: "row", alignItems: "center", gap: 8, height: 34, paddingLeft: 6, paddingRight: 14, borderRadius: 17, backgroundColor: "#FFF1E41A", marginTop: 18 },
  whenTick: { width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  keep: { flex: 1, height: 56, borderRadius: 28, backgroundColor: CREAM, alignItems: "center", justifyContent: "center" },
  shareBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFF1E41F", alignItems: "center", justifyContent: "center" },
});
