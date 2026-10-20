import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { EnamelAchievement } from "./EnamelAchievement";
import { deckPalette, mix } from "./HomeDeck";
import { uiText } from "@/lib/typography";
import { useSubscription } from "@/state/subscription";
import { useProgress } from "@/state/progress";
import { useAnnotations } from "@/state/annotations";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useCheckIns } from "@/state/checkIns";
import { useMoments } from "@/state/moments";
import { useAchievements } from "@/lib/useAchievements";
import { useNightPrayer } from "@/lib/nightPrayer";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { MILESTONES } from "@/lib/milestones";
import { momentForReference } from "@/lib/momentArt";
import { resolveSermonTypeForMoment } from "@/lib/moments";
import { formatRef } from "@/lib/annotationsFormat";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { MOMENTS_IN_ORDER } from "@/lib/momentOrder";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import * as haptics from "@/lib/haptics";

const MARKER: Record<string, string> = { amber: "#FFE38A", rose: "#FFD3BF", sage: "#CFE6C8", ocean: "#CFE0F5", lilac: "#E6DAF2" };
export const PROFILE_FLOOR = "#1A1215";

/**
 * Profile as your story so far. The scene of the walk you're on fills the top and
 * dissolves into a fog made from today's category colour with most of its colour drained;
 * your photo sits on the seam; text is white mixed with the fog. Below it, the things you've
 * kept, each with its count and a way to see all. The streak is a pill, top right.
 */
export function ProfileStory({ name, joinedAt, avatar, onAvatar, onSettings, saved }: {
  name: string; joinedAt?: number; avatar?: ImageSource; onAvatar: () => void; onSettings: () => void;
  saved: { day: number; title: string; typeName: string }[];
}) {
  const { isPro } = useSubscription();
  const router = useRouter(), insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  const { streak, engagedDates } = useProgress(), { counts, allHighlights } = useAnnotations(), { ids } = useBibleMomentCollection();
  const { log: checkIns } = useCheckIns(), { todaysMoment } = useMoments(), { achievements } = useAchievements(), nights = useNightPrayer().log.length;
  const pal = deckPalette(resolveSermonTypeForMoment({ day: todaysMoment.day }).id);
  const fog = mix(pal.mid, "#2E2A2C", .58), floor = PROFILE_FLOOR;
  const t1 = "#FFFFFF", t2 = mix("#FFFFFF", fog, .26), t3 = mix("#FFFFFF", fog, .5), chrome = mix(fog, "#000000", .1) + "C7";
  const scene = getBibleMomentArt(momentForReference(todaysMoment.reference).id);
  const go = (route: Href) => { haptics.soft(); router.push(route); };
  const heroH = Math.round(width * 1.12);
  const since = typeof joinedAt === "number" ? `With Closer since ${new Date(joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : "Walking with Closer";
  const collected = useMemo(() => BIBLE_MOMENTS.filter(m => ids.includes(m.id)).reverse(), [ids]);
  const highlights = allHighlights().slice(0, 2);
  const earned = achievements.filter(a => a.value >= a.target);
  const badge = getMilestoneBadge(Math.max(0, MILESTONES.filter(m => m.day <= streak.current).length - 1));

  useFocusEffect(useCallback(() => { setStatusBarStyle("light", true); }, []));
  const Header = ({ label, count, onSeeAll }: { label: string; count?: number; onSeeAll?: () => void }) =>
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 22, marginTop: 32, marginBottom: 12 }}>
      <Text accessibilityRole="header" style={{ ...uiText.supporting, fontSize: 12, fontWeight: "800", letterSpacing: 1, color: t3 }}>{label.toUpperCase()}{count != null && <Text style={{ fontWeight: "800", color: t2 }}> · {count}</Text>}</Text>
      {onSeeAll && <Pressable accessibilityRole="button" accessibilityLabel={`See all ${label}`} onPress={onSeeAll} hitSlop={10}><Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "700", color: t2 }}>See all</Text></Pressable>}
    </View>;
  const Row = ({ icon, label, value, onPress, first }: { icon: SFSymbolName; label: string; value?: string; onPress: () => void; first?: boolean }) =>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress} style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: "#FFFFFF14" }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, borderCurve: "continuous", backgroundColor: mix(fog, "#FFFFFF", .08), alignItems: "center", justifyContent: "center" }}><SFSymbol name={icon} size={17} color={t2}/></View>
      <Text style={{ ...uiText.body, fontSize: 16, fontWeight: "700", color: t1, flex: 1 }}>{label}</Text>
      {!!value && <Text style={{ ...uiText.body, fontSize: 15, fontWeight: "700", color: t3, fontVariant: ["tabular-nums"] }}>{value}</Text>}
      <SFSymbol name="chevron.right" size={12} color={t3}/>
    </Pressable>;

  return <View style={{ backgroundColor: floor }}>
    {/* the scene, dissolving into fog */}
    <View style={{ height: heroH }}>
      {scene ? <Image source={scene} contentFit="cover" style={StyleSheet.absoluteFill} transition={0}/> : null}
      <ReaderMaterialGradient pointerEvents="none" colors={["#00000080", "#00000000", "#00000000", `${fog}99`, fog, floor]} locations={[0, .22, .36, .62, .82, 1]} style={StyleSheet.absoluteFill}/>
      <View style={{ position: "absolute", left: 16, right: 16, top: insets.top + 4, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
        {badge && <Pressable accessibilityRole="button" accessibilityLabel={`${streak.current} ${streak.current === 1 ? "day" : "days"} in a row. Your history`} onPress={() => go("/rhythm")}
          style={{ height: 40, borderRadius: 20, paddingLeft: 4, paddingRight: 13, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: chrome, boxShadow: "inset 0 1px 0 #FFFFFF22" }}>
          <Image source={badge} style={{ width: 32, height: 32, borderRadius: 16, opacity: streak.current > 0 ? 1 : .45 }}/><Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "800", color: t1 }}>{streak.current} {streak.current === 1 ? "day" : "days"}</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: chrome, alignItems: "center", justifyContent: "center", boxShadow: "inset 0 1px 0 #FFFFFF22" }}><SFSymbol name="gearshape" size={19} color={t2}/></Pressable>
      </View>
    </View>
    {/* you, on the seam */}
    <View style={{ marginTop: -150, alignItems: "center", paddingHorizontal: 22 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={onAvatar} style={{ width: 120, height: 120, borderRadius: 60, overflow: "hidden", borderWidth: isPro ? 3 : 0, borderColor: "#C4A368", boxShadow: `0 0 0 5px ${fog}B3, 0 18px 30px -12px #000` }}>
        {avatar ? <Image source={avatar} contentFit="cover" style={StyleSheet.absoluteFill}/> : <ReaderMaterialGradient colors={["#FF7A4F", "#E2391F"]} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}><Text style={{ fontSize: 44, fontWeight: "900", color: "#FFF" }}>{name.charAt(0).toUpperCase()}</Text></ReaderMaterialGradient>}
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}><Text accessibilityRole="header" numberOfLines={1} style={{ ...uiText.screenTitle, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -.5, color: t1, flexShrink: 1 }}>{name}</Text>{isPro && <View accessible accessibilityLabel="Pro member"><SFSymbol name="crown" size={19} color="#D7B77B"/></View>}</View>
      <Text style={{ ...uiText.supporting, fontSize: 15, fontWeight: "600", color: t2, marginTop: 4 }}>
        <Text style={{ fontWeight: "800", color: t1 }}>{engagedDates.length}</Text> {engagedDates.length === 1 ? "day" : "days"}<Text style={{ color: t3 }}>  ·  </Text>
        <Text style={{ fontWeight: "800", color: t1 }}>{ids.length}</Text> moments<Text style={{ color: t3 }}>  ·  </Text>
        <Text style={{ fontWeight: "800", color: t1 }}>{nights}</Text> {nights === 1 ? "prayer" : "prayers"}
      </Text>
      <Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "600", color: t3, marginTop: 4 }}>{since}</Text>
    </View>

    {!isPro && <View style={{ alignSelf: "center", marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: "#FFFFFF25", backgroundColor: "#FFFFFF09" }}><Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .8, color: t2 }}>FREE MEMBER</Text></View>}
    <Pressable accessibilityRole="button" accessibilityLabel={isPro ? "Manage Pro membership" : "Explore Closer Pro"} onPress={() => isPro ? void Linking.openURL("https://apps.apple.com/account/subscriptions") : go("/onboarding/paywall")} style={{ marginHorizontal: 22, marginTop: 24, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: isPro ? "#FFFFFF15" : "#F1CF9C32", backgroundColor: isPro ? "#FFFFFF07" : "#644A3233", flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 17, fontWeight: "800", color: t1 }}>{isPro ? "Your Pro membership" : "Explore Closer Pro"}</Text><Text style={{ fontSize: 13, color: t3, marginTop: 4 }}>{isPro ? "Manage your plan" : "See what membership includes"}</Text></View>
      <SFSymbol name="chevron.right" size={13} color="#DDC7A8"/>
    </Pressable>

    {/* Bible Moments */}
    <Header label="Bible moments" count={ids.length} onSeeAll={() => go("/rhythm?section=moments" as Href)}/>
    {collected.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 14 }}>
      {collected.slice(0, 10).map(m => { const art = getBibleMomentArt(m.id); return <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`${m.title}, ${m.reference}`} onPress={() => go("/rhythm?section=moments" as Href)} style={{ width: 78, alignItems: "center" }}>
        <View style={{ width: 78, height: 78, borderRadius: 21, borderCurve: "continuous", overflow: "hidden", backgroundColor: fog, boxShadow: "inset 0 1px 0 #FFFFFF33, 0 10px 18px -10px #000" }}>{art && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill}/>}<ReaderMaterialGradient pointerEvents="none" colors={["#FFFFFF33", "#FFFFFF00"]} locations={[0, .4]} style={StyleSheet.absoluteFill}/></View>
        <Text numberOfLines={2} style={{ ...uiText.supporting, fontSize: 12, lineHeight: 15, fontWeight: "700", color: t2, marginTop: 8, textAlign: "center" }}>{m.title}</Text>
      </Pressable>; })}
    </ScrollView> : <Text style={{ ...uiText.supporting, color: t3, paddingHorizontal: 22 }}>Collect them as you read. {MOMENTS_IN_ORDER.length} are waiting in the story.</Text>}

    {/* Highlights */}
    <Header label="Highlights" count={counts.highlights} onSeeAll={() => go("/highlights")}/>
    {highlights.length ? highlights.map((h, i) => <Pressable key={h.key} accessibilityRole="button" accessibilityLabel={`${h.verseText}. ${formatRef(h)}`} onPress={() => go("/highlights")}
      style={{ flexDirection: "row", gap: 14, paddingVertical: 14, paddingHorizontal: 22, backgroundColor: mix(floor, "#FFFFFF", i === 0 ? .045 : .025) }}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: MARKER[h.color.id] ?? h.color.swatch }}/>
      <View style={{ flex: 1 }}><Text numberOfLines={3} style={{ ...uiText.body, fontSize: 16, lineHeight: 23, fontWeight: "700", color: t1 }}>“{h.verseText}”</Text><Text style={{ ...uiText.supporting, fontSize: 12, fontWeight: "600", color: t3, marginTop: 4 }}>{formatRef(h)}</Text></View>
    </Pressable>) : <Text style={{ ...uiText.supporting, color: t3, paddingHorizontal: 22 }}>Tap a verse in the Bible to mark it. Your highlights collect here.</Text>}

    {/* Keepsakes */}
    <Header label="Keepsakes" count={earned.length} onSeeAll={() => go("/achievements")}/>
    {earned.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 10 }}>
      {earned.slice(0, 8).map(a => <Pressable key={a.id} accessibilityRole="button" accessibilityLabel={a.title} onPress={() => go("/achievements")} style={{ width: 78, alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFFFFF", padding: 3, boxShadow: "0 8px 14px -6px #000A", alignItems: "center", justifyContent: "center" }}><EnamelAchievement size={64} achievementId={a.id}/></View>
        <Text numberOfLines={2} style={{ ...uiText.supporting, fontSize: 11, lineHeight: 13, fontWeight: "700", color: t2, marginTop: 6, textAlign: "center" }}>{a.title}</Text>
      </Pressable>)}
    </ScrollView> : <Text style={{ ...uiText.supporting, color: t3, paddingHorizontal: 22 }}>Earned by showing up. Your first is a few mornings away.</Text>}

    {/* the rest */}
    <View style={{ marginTop: 28 }}>
      <Row first icon="moon.fill" label="Night prayers" value={String(nights)} onPress={() => go("/prayers" as Href)}/>
      <Row icon="note.text" label="Notes" value={String(counts.notes)} onPress={() => go("/notes")}/>
      <Row icon="heart" label="Check-ins" value={String(checkIns.length)} onPress={() => go("/check-in")}/>
      {saved.length > 0 && <Row icon="bookmark" label="Saved devotionals" value={String(saved.length)} onPress={() => go(`/saved-sermon/${saved[0]!.day}` as Href)}/>}
      <Row icon="gearshape" label="Settings & preferences" onPress={onSettings}/>
    </View>
    <Text style={{ ...uiText.supporting, fontSize: 13, textAlign: "center", color: t3, marginVertical: 28 }}>Small beginnings. A meaningful journey.</Text>
  </View>;
}
