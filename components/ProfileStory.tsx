import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { EnamelAchievement } from "./EnamelAchievement";
import { systemText, uiText } from "@/lib/typography";
import { contentLayout } from "@/lib/contentStyles";
import { radius } from "@/constants/spacing";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useSubscription } from "@/state/subscription";
import { useProgress } from "@/state/progress";
import { useAnnotations } from "@/state/annotations";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useCheckIns } from "@/state/checkIns";
import { useAchievements } from "@/lib/useAchievements";
import { useNightPrayer } from "@/lib/nightPrayer";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { MILESTONES } from "@/lib/milestones";
import { formatRef } from "@/lib/annotationsFormat";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { MOMENTS_IN_ORDER } from "@/lib/momentOrder";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import * as haptics from "@/lib/haptics";

const MARKER: Record<string, string> = { amber: "#FFE38A", rose: "#FFD3BF", sage: "#CFE6C8", ocean: "#CFE0F5", lilac: "#E6DAF2" };
/** @deprecated The page now follows the app's wine and white; kept for older imports. */
export const PROFILE_FLOOR = "#1A1215";
const GUTTER = 16;

/**
 * Profile as your story so far, on the app's wine or white page (from the Closer You picks).
 * A big "You" title with the streak and settings beside it; your photo on the left with your
 * name and numbers; then the things you've kept, each with its count and a way to see all.
 */
export function ProfileStory({ name, joinedAt, avatar, onAvatar, onSettings, saved }: {
  name: string; joinedAt?: number; avatar?: ImageSource; onAvatar: () => void; onSettings: () => void;
  saved: { day: number; title: string; typeName: string }[];
}) {
  const { isPro } = useSubscription();
  const router = useRouter(), insets = useSafeAreaInsets();
  const colors = useColors(), dark = useResolvedScheme() === "dark";
  const { streak, engagedDates } = useProgress(), { counts, allHighlights } = useAnnotations(), { ids } = useBibleMomentCollection();
  const { log: checkIns } = useCheckIns(), { achievements } = useAchievements(), nights = useNightPrayer().log.length;
  const t1 = colors.ink, t2 = colors.inkSecondary, t3 = colors.inkSubtle;
  const go = (route: Href) => { haptics.soft(); router.push(route); };
  const since = typeof joinedAt === "number" ? `With Closer since ${new Date(joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : "Walking with Closer";
  const collected = useMemo(() => BIBLE_MOMENTS.filter(m => ids.includes(m.id)).reverse(), [ids]);
  const highlights = allHighlights().slice(0, 2);
  const earned = achievements.filter(a => a.value >= a.target);
  const badge = getMilestoneBadge(Math.max(0, MILESTONES.filter(m => m.day <= streak.current).length - 1));

  useFocusEffect(useCallback(() => { setStatusBarStyle(dark ? "light" : "dark", true); }, [dark]));
  const Header = ({ label, count, onSeeAll }: { label: string; count?: number; onSeeAll?: () => void }) =>
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 22, marginTop: 32, marginBottom: 12 }}>
      <Text accessibilityRole="header" style={{ ...uiText.supporting, fontSize: 12, fontWeight: "800", letterSpacing: 1, color: t3 }}>{label.toUpperCase()}{count != null && <Text style={{ fontWeight: "800", color: t2 }}> · {count}</Text>}</Text>
      {onSeeAll && <Pressable accessibilityRole="button" accessibilityLabel={`See all ${label}`} onPress={onSeeAll} hitSlop={10}><Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "700", color: t2 }}>See all</Text></Pressable>}
    </View>;
  const Row = ({ icon, label, value, onPress, first }: { icon: SFSymbolName; label: string; value?: string; onPress: () => void; first?: boolean }) =>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress} style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t1, alignItems: "center", justifyContent: "center" }}><SFSymbol name={icon} size={16} color={colors.bg}/></View>
      <Text style={{ ...uiText.body, fontSize: 16, fontWeight: "700", color: t1, flex: 1 }}>{label}</Text>
      {!!value && <Text style={{ ...uiText.body, fontSize: 15, fontWeight: "700", color: t3, fontVariant: ["tabular-nums"] }}>{value}</Text>}
      <SFSymbol name="chevron.right" size={12} color={t3}/>
    </Pressable>;

  return <View style={{ backgroundColor: colors.bg, paddingTop: insets.top + contentLayout.screenTop }}>
    {/* title, streak and settings */}
    <View style={{ minHeight: 56, paddingHorizontal: GUTTER + 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text accessibilityRole="header" style={{ ...systemText.largeTitle, color: t1, flex: 1 }}>You</Text>
      {badge && <Pressable accessibilityRole="button" accessibilityLabel={`${streak.current} ${streak.current === 1 ? "day" : "days"} in a row. Your history`} onPress={() => go("/rhythm")}
        style={{ height: 40, borderRadius: radius.pill, paddingLeft: 4, paddingRight: 13, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.surface }}>
        <Image source={badge} style={{ width: 32, height: 32, borderRadius: 16, opacity: streak.current > 0 ? 1 : .45 }}/><Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "800", color: t1 }}>{streak.current} {streak.current === 1 ? "day" : "days"}</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><SFSymbol name="gearshape.fill" size={19} color={t1}/></Pressable>
    </View>

    {/* you */}
    <View style={{ marginTop: 14, paddingHorizontal: GUTTER + 4, flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={onAvatar} style={{ width: 76, height: 76, borderRadius: 38, overflow: "hidden", borderWidth: isPro ? 3 : 0, borderColor: "#C4A368" }}>
        {avatar ? <Image source={avatar} contentFit="cover" style={StyleSheet.absoluteFill}/> : <ReaderMaterialGradient colors={["#FF7A4F", "#E2391F"]} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}><Text style={{ fontSize: 30, fontWeight: "900", color: "#FFF" }}>{name.charAt(0).toUpperCase()}</Text></ReaderMaterialGradient>}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Text numberOfLines={1} style={{ ...uiText.screenTitle, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -.5, color: t1, flexShrink: 1 }}>{name}</Text>{isPro && <View accessible accessibilityLabel="Pro member"><SFSymbol name="crown.fill" size={19} color="#C4A368"/></View>}</View>
        <Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "600", color: t2 }}>{since}</Text>
        <Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "600", color: t2, marginTop: 2 }}>
          <Text style={{ fontWeight: "800", color: t1 }}>{engagedDates.length}</Text> {engagedDates.length === 1 ? "day" : "days"}<Text style={{ color: t3 }}>  ·  </Text>
          <Text style={{ fontWeight: "800", color: t1 }}>{ids.length}</Text> moments<Text style={{ color: t3 }}>  ·  </Text>
          <Text style={{ fontWeight: "800", color: t1 }}>{nights}</Text> {nights === 1 ? "prayer" : "prayers"}
        </Text>
      </View>
    </View>

    {!isPro && <View style={{ alignSelf: "center", marginTop: 16, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}><Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: .8, color: t2 }}>FREE MEMBER</Text></View>}
    <Pressable accessibilityRole="button" accessibilityLabel={isPro ? "Manage Pro membership" : "Explore Closer Pro"} onPress={() => isPro ? void Linking.openURL("https://apps.apple.com/account/subscriptions") : go("/onboarding/paywall")} style={{ marginHorizontal: GUTTER, marginTop: 10, padding: 18, borderRadius: radius.card, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 17, fontWeight: "800", color: t1 }}>{isPro ? "Your Pro membership" : "Explore Closer Pro"}</Text><Text style={{ fontSize: 13, color: t2, marginTop: 4 }}>{isPro ? "Manage your plan" : "See what membership includes"}</Text></View>
      <SFSymbol name="chevron.right" size={13} color={t3}/>
    </Pressable>

    {/* Bible Moments */}
    <Header label="Bible moments" count={ids.length} onSeeAll={() => go("/rhythm?section=moments" as Href)}/>
    {collected.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 14 }}>
      {collected.slice(0, 10).map(m => { const art = getBibleMomentArt(m.id); return <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`${m.title}, ${m.reference}`} onPress={() => go("/rhythm?section=moments" as Href)} style={{ width: 140 }}>
        <View style={{ width: 140, height: 180, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surface }}>{art && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill}/>}</View>
        <Text numberOfLines={2} style={{ ...uiText.supporting, fontSize: 14, lineHeight: 18, fontWeight: "700", color: t1, marginTop: 8 }}>{m.title}</Text>
      </Pressable>; })}
    </ScrollView> : <Text style={{ ...uiText.supporting, color: t2, paddingHorizontal: 22 }}>Collect them as you read. {MOMENTS_IN_ORDER.length} are waiting in the story.</Text>}

    {/* Highlights */}
    <Header label="Highlights" count={counts.highlights} onSeeAll={() => go("/highlights")}/>
    {highlights.length ? <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>{highlights.map(h => { const marker = MARKER[h.color.id] ?? h.color.swatch; return <Pressable key={h.key} accessibilityRole="button" accessibilityLabel={`${h.verseText}. ${formatRef(h)}`} onPress={() => go("/highlights")}
      style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.card, backgroundColor: colors.surface }}>
      <Text numberOfLines={4} style={{ fontStyle: "italic", fontSize: 19, lineHeight: 27, color: t1 }}><Text style={dark ? { color: marker } : { backgroundColor: marker, color: "#17120E" }}>{h.verseText.replace(/\s*\n\s*/g, " ")}</Text></Text>
      <Text style={{ ...uiText.supporting, fontSize: 12.5, fontWeight: "700", color: t2, marginTop: 6 }}>{formatRef(h)}</Text>
    </Pressable>; })}</View> : <Text style={{ ...uiText.supporting, color: t2, paddingHorizontal: 22 }}>Tap a verse in the Bible to mark it. Your highlights collect here.</Text>}

    {/* Keepsakes */}
    <Header label="Keepsakes" count={earned.length} onSeeAll={() => go("/achievements")}/>
    {earned.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 14 }}>
      {earned.slice(0, 8).map(a => <Pressable key={a.id} accessibilityRole="button" accessibilityLabel={a.title} onPress={() => go("/achievements")} style={{ width: 110, alignItems: "center" }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: "#FFFFFF", padding: 4, boxShadow: dark ? "0 8px 14px -6px #000A" : "0 6px 14px -6px #0004", alignItems: "center", justifyContent: "center" }}><EnamelAchievement size={94} achievementId={a.id}/></View>
        <Text numberOfLines={2} style={{ ...uiText.supporting, fontSize: 13, lineHeight: 16, fontWeight: "700", color: t1, marginTop: 8, textAlign: "center" }}>{a.title}</Text>
      </Pressable>)}
    </ScrollView> : <Text style={{ ...uiText.supporting, color: t2, paddingHorizontal: 22 }}>Earned by showing up. Your first is a few mornings away.</Text>}

    {/* the rest, in one card */}
    <View style={{ marginTop: 28, marginHorizontal: GUTTER, borderRadius: radius.card, backgroundColor: colors.surface, overflow: "hidden" }}>
      <Row first icon="moon.fill" label="Night prayers" value={String(nights)} onPress={() => go("/prayers" as Href)}/>
      <Row icon="note.text" label="Notes" value={String(counts.notes)} onPress={() => go("/notes")}/>
      <Row icon="heart.fill" label="Check-ins" value={String(checkIns.length)} onPress={() => go("/check-in")}/>
      {saved.length > 0 && <Row icon="bookmark.fill" label="Saved devotionals" value={String(saved.length)} onPress={() => go(`/saved-sermon/${saved[0]!.day}` as Href)}/>}
      <Row icon="gearshape.fill" label="Settings & preferences" onPress={onSettings}/>
    </View>
    <Text style={{ ...uiText.supporting, fontSize: 13, textAlign: "center", color: t3, marginVertical: 28 }}>Small beginnings. A meaningful journey.</Text>
  </View>;
}
