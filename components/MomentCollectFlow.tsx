import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import { Image } from "expo-image";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type BibleMoment } from "@/constants/bibleMoments";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { SCENE_COLORS } from "@/constants/sceneColors";
import { useBibleMomentCollection, unlockBibleMomentWithRewards } from "@/state/bibleMoments";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { mix } from "@/components/HomeDeck";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";

/**
 * Finding a Bible Moment. The painting is the reward: it rises out of the verse, folds into a card
 * with a pass of light, and lands in the book's row of your collection. The painting's colour owns
 * every step; the category shows only as its own small chip. One white button at a time.
 */
type Stage = "open" | "collecting" | "landed" | "error";

export function MomentCollectFlow({ moment, onClose }: { moment: BibleMoment; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const { ids } = useBibleMomentCollection();
  const already = useMemo(() => ids.includes(moment.id), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [stage, setStage] = useState<Stage>("open");
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; if (completionTimer.current) clearTimeout(completionTimer.current); }, []);

  const c = SCENE_COLORS[moment.id] ?? "#A47D28";
  const t = { c, page: mix(c, "#0A0A0D", .87), deep: mix(c, "#06070A", .66), ink: mix("#FFFFFF", c, .12), soft: mix("#FFFFFF", c, .36), faint: mix("#FFFFFF", c, .58) };
  const cat = MOMENT_CATEGORIES[moment.category];
  const art = getBibleMomentArt(moment.id);

  const collect = () => {
    if (stage !== "open" && stage !== "error") return;
    haptics.soft();
    setStage("collecting");
    const started = Date.now();
    unlockBibleMomentWithRewards(moment.id).then(() => {
      if (!mounted.current) return;
      haptics.success();
      AccessibilityInfo.announceForAccessibility("Bible Moment saved to your collection");
      // Let the fold and the light finish before moving on.
      completionTimer.current = setTimeout(() => setStage("landed"), reduced ? 0 : Math.max(0, 1500 - (Date.now() - started)));
    }).catch(() => { if (mounted.current) setStage("error"); });
  };
  const seeAll = () => { onClose(); router.push("/rhythm?section=moments" as Href); };

  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    {stage === "open" || stage === "error" ? (
      <View style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Keep reading" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: "#000000A6" }]}/>
        <Animated.View entering={reduced ? undefined : FadeInDown.springify().damping(20).stiffness(220)}
          style={{ position: "absolute", left: 12, right: 12, top: insets.top + 56, bottom: insets.bottom + 10, borderRadius: 36, borderCurve: "continuous", overflow: "hidden", backgroundColor: t.deep, borderWidth: StyleSheet.hairlineWidth, borderColor: `${c}88`, boxShadow: "0 30px 60px -24px #000000" }}>
          <View style={{ flex: 1, minHeight: 150 }}>
            {art && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill}/>}
            <ReaderMaterialGradient colors={[`${t.deep}00`, `${t.deep}00`, t.deep]} locations={[0, .45, 1]} style={StyleSheet.absoluteFill}/>
            <View style={{ position: "absolute", left: 18, top: 18, flexDirection: "row", alignItems: "center", gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: `${t.deep}B3`, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFFFF40" }}>
              <SFSymbol name={already ? "checkmark" : "sparkles"} size={12} color="#F3CA79"/>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3CA79" }}>{already ? "In your moments" : "You found a Bible Moment"}</Text>
            </View>
          </View>
          <ScrollView bounces={false} style={{ flexGrow: 0, maxHeight: height * .55 }} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 2, paddingBottom: 18 }}>
            <Text style={s.kick(t.faint)}>{moment.reference} · {moment.event}</Text>
            <Text accessibilityRole="header" style={{ marginTop: 6, fontSize: 40, lineHeight: 42, fontWeight: "900", letterSpacing: -1.4, color: t.ink }}>{moment.title}</Text>
            <View style={{ marginTop: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 14, backgroundColor: mix(cat.tint, "#000000", .3), borderWidth: StyleSheet.hairlineWidth, borderColor: `${cat.dark}59` }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cat.dark }}/>
              <Text style={{ fontSize: 13, fontWeight: "800", color: mix("#FFFFFF", cat.dark, .2) }}>{cat.name}</Text>
            </View>
            <Text style={{ marginTop: 14, fontSize: 16, lineHeight: 23, fontWeight: "700", color: t.soft }}>{moment.importance}</Text>
            {stage === "error" && <Text accessibilityRole="alert" style={{ marginTop: 12, fontSize: 14, fontWeight: "700", color: "#FFD9CC" }}>Couldn’t save it just now. Try again.</Text>}
            {already
              ? <Pressable onPress={seeAll} accessibilityRole="button" style={[s.btn, { marginTop: 20 }]}><Text style={s.btnText(t.deep)}>See your moments</Text></Pressable>
              : <Pressable onPress={collect} accessibilityRole="button" style={[s.btn, { marginTop: 20 }]}><Text style={s.btnText(t.deep)}>{stage === "error" ? "Try again" : "Collect it"}</Text></Pressable>}
            <Pressable onPress={onClose} accessibilityRole="button" style={s.ghost}><Text style={{ fontSize: 15, fontWeight: "800", color: t.soft }}>{already ? "Keep reading" : "Not now"}</Text></Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    ) : (
      <Collecting moment={moment} t={t} reduced={reduced} total={BIBLE_MOMENTS.length} count={ids.includes(moment.id) ? ids.length : ids.length + 1} ready={stage === "landed"} onContinue={onClose} onSeeAll={seeAll}/>
    )}
  </Modal>;
}

type T = { c: string; page: string; deep: string; ink: string; soft: string; faint: string };

/** The card folds into a collectible, a light passes over it, and it's yours. */
function Collecting({ moment, t, reduced, total, count, ready, onContinue, onSeeAll }: { ready: boolean; onContinue: () => void; onSeeAll: () => void; moment: BibleMoment; t: T; reduced: boolean; total: number; count: number }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 750;
  const cardWidth = Math.min(compact ? 223 : 260, width - 96);
  const detailOffset = compact ? 10 : 16;
  const art = getBibleMomentArt(moment.id);
  const cat = MOMENT_CATEGORIES[moment.category];
  const fold = useSharedValue(reduced ? 1 : 0), shine = useSharedValue(0), pill = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    fold.value = withSpring(1, { damping: 14, stiffness: 160 });
    shine.value = withDelay(380, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }));
    pill.value = withDelay(820, withSpring(1, { damping: 11, stiffness: 260 }));
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = useAnimatedStyle(() => ({ transform: [{ scale: 1.25 - .25 * fold.value }, { rotate: `${-4 * fold.value}deg` }], opacity: .3 + .7 * fold.value }));
  const light = useAnimatedStyle(() => ({ transform: [{ translateX: -260 + 520 * shine.value }, { rotate: "18deg" }], opacity: shine.value > 0 && shine.value < 1 ? 1 : 0 }));
  const pillStyle = useAnimatedStyle(() => ({ opacity: pill.value, transform: [{ scale: .6 + .4 * pill.value }] }));
  return <View style={{ flex: 1, backgroundColor: t.page, alignItems: "center", paddingTop: insets.top, paddingBottom: insets.bottom + 18 }}>
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: compact ? 15 : 26 }}>
    <View style={{ alignItems: "center" }}>
    <Animated.View style={[{ width: cardWidth, height: cardWidth * 4 / 3, borderRadius: 34, borderCurve: "continuous", overflow: "hidden", borderWidth: 4, borderColor: "#FFFFFF", boxShadow: "0 40px 70px -30px #000000" }, card]}>
      {art && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill}/>}
      <ReaderMaterialGradient colors={[`${t.deep}00`, `${t.deep}00`, `${t.deep}EB`]} locations={[0, .55, 1]} style={StyleSheet.absoluteFill}/>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -60, bottom: -60, width: 70, backgroundColor: "#FFFFFF59" }, light]}/>
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .8, color: cat.dark, textTransform: "uppercase" }}>{cat.name}</Text>
        <Text style={{ fontSize: compact ? 23 : 26, lineHeight: compact ? 25 : 28, fontWeight: "900", letterSpacing: -.5, color: "#FFFFFF", marginTop: 2 }}>{moment.title}</Text>
      </View>
    </Animated.View>
    <View style={{ alignItems: "center", transform: [{ translateY: detailOffset }] }}>
    <Animated.View style={[{ marginTop: compact ? 24 : 34, flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: "#FFFFFF" }, pillStyle]}>
      <SFSymbol name="checkmark" size={14} weight="black" color={t.deep}/>
      <Text style={{ fontSize: 16, fontWeight: "900", color: t.deep }}>Collected</Text>
    </Animated.View>
    <Animated.View style={pillStyle}><Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: t.soft }}>Moment {Math.min(total, count)} of {total}</Text></Animated.View>
    </View>
    </View>
    </View>
    <View style={{ width: "100%", paddingHorizontal: 22, opacity: ready ? 1 : 0 }} pointerEvents={ready ? "auto" : "none"} accessibilityElementsHidden={!ready} importantForAccessibility={ready ? "auto" : "no-hide-descendants"}>
      <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Continue reading" style={s.btn}><Text style={s.btnText(t.deep)}>Continue reading</Text></Pressable>
      <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See unlocked moments" style={s.ghost}><Text style={{ fontSize: 15, fontWeight: "800", color: t.soft }}>See unlocked moments</Text></Pressable>
    </View>
  </View>;
}

const s = {
  kick: (color: string) => ({ fontSize: 12, lineHeight: 15, fontWeight: "800" as const, letterSpacing: 1, color, textTransform: "uppercase" as const }),
  btn: { height: 54, borderRadius: 27, backgroundColor: "#FFFFFF", alignItems: "center" as const, justifyContent: "center" as const },
  btnText: (color: string) => ({ fontSize: 17, fontWeight: "800" as const, color }),
  ghost: { minHeight: 44, marginTop: 4, alignItems: "center" as const, justifyContent: "center" as const },
};
