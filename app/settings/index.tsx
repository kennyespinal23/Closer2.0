import { useLayoutEffect } from "react";
import { Linking, ScrollView, Share, StyleSheet, View } from "react-native";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { useNavigation, useRouter, type Href } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { isInternalBuild } from "@/lib/isInternalBuild";
import { useReminder } from "@/lib/useReminder";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useReadingGoal } from "@/state/readingGoal";
import { useSubscription } from "@/state/subscription";
import { useTheme } from "@/state/theme";

const CREAM = "#FFF1E4";

type Row = { icon: SFSymbolName; color: string; label: string; value?: string; sub?: string; onPress: () => void };

/**
 * Settings, grouped by what you're doing rather than by system: your day,
 * reading, your account, Closer. Your own card at the top, Closer Plus
 * right under it.
 */
export default function SettingsIndex() {
  const router = useRouter(), navigation = useNavigation(), headerHeight = useHeaderHeight(), inset = useSafeAreaInsets();
  const { answers } = useOnboarding(), { pref, scheme } = useTheme(), { isPro } = useSubscription();
  const { translation } = usePreferences(), { goalMinutes } = useReadingGoal();
  const reminder = useReminder();
  useLayoutEffect(() => { navigation.setOptions({ title: "" }); }, [navigation]);
  const dark = scheme === "dark";
  const t = { ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", card: dark ? "#2A241F" : "#FFFFFF", line: dark ? "#FFFFFF14" : "#17120F14", chev: dark ? "#8F857C" : "#B5ABA2" };
  const open = (path: Href) => { haptics.soft(); router.push(path); };
  const name = answers.name.trim();
  const since = typeof answers.joinedAt === "number" ? `With Closer since ${new Date(answers.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Your name and account";

  const groups: [string, Row[]][] = [
    ["Your day", [
      { icon: "bell", color: "#E2391F", label: "Morning reminder", value: reminder.enabled ? reminder.label : "Off", onPress: () => open("/settings/notifications") },
      { icon: "target", color: "#C98A1E", label: "Reading goal", value: goalMinutes ? `${goalMinutes} min` : undefined, onPress: () => open("/settings/reading-goal") },
      { icon: "hand.raised", color: "#8E4A22", label: "My Blocks", sub: "Quiet the apps that pull you away", onPress: () => open("/settings/study-sessions") },
    ]],
    ["Reading", [
      { icon: "book", color: "#2D5238", label: "Bible translation", value: translation?.name, onPress: () => open("/settings/translation") },
      { icon: "textformat.size", color: "#3A2219", label: "Text and appearance", value: pref === "system" ? "Automatic" : pref === "dark" ? "Dark" : "Light", onPress: () => open("/settings/appearance") },
    ]],
    ["Account", [
      { icon: "envelope", color: "#6E645C", label: "Account and email", onPress: () => open("/settings/account") },
      { icon: "lock", color: "#6E645C", label: "Privacy", onPress: () => open("/settings/privacy") },
    ]],
    ["Closer", [
      { icon: "questionmark.circle", color: "#6E645C", label: "Help and support", onPress: () => open("/settings/help") },
      { icon: "heart", color: "#C24F6E", label: "Tell a friend about Closer", onPress: () => { haptics.soft(); void Share.share({ message: "I’ve been using Closer: a short letter from Scripture every morning. https://apps.apple.com/app/closer" }); } },
    ]],
    ...(isInternalBuild() ? [["For testing", [
      { icon: "flame", color: "#6E645C", label: "Streak animation", sub: "Replay a sample 7-day streak", onPress: () => open("/rhythm?preview=streak") },
      { icon: "hammer", color: "#6E645C", label: "Developer tools", onPress: () => open("/settings/developer") },
    ]] as [string, Row[]]] : []),
  ];

  return <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 20, paddingBottom: inset.bottom + 40 }}>
    <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: t.ink, marginTop: 4 }}>Settings</Text>

    <Pressable onPress={() => open("/settings/name")} accessibilityRole="button" accessibilityLabel={`${name || "Your name"}. Edit`} style={s.me}>
      <ReaderMaterialGradient colors={["#5A3526", "#3A2219", "#24140E"]} locations={[0, .55, 1]} style={StyleSheet.absoluteFill}/>
      <View style={s.av}>{name ? <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFF" }}>{name[0].toUpperCase()}</Text> : <SFSymbol name="person.fill" size={24} color="#FFF"/>}</View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ ...uiText.sectionTitle, fontSize: 20, lineHeight: 24, fontWeight: "900", color: CREAM }}>{name || "Add your name"}</Text>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#D8BDA5", marginTop: 3 }}>{since}</Text>
      </View>
      <View style={s.edit}><Text style={{ fontSize: 14, fontWeight: "800", color: CREAM }}>Edit</Text></View>
    </Pressable>

    <Pressable onPress={() => isPro ? void Linking.openURL("https://apps.apple.com/account/subscriptions") : open("/onboarding/paywall")} accessibilityRole="button" style={s.plus}>
      <ReaderMaterialGradient colors={["#FFD455", "#FFC12E"]} style={StyleSheet.absoluteFill}/>
      <View style={s.plusIcon}><SFSymbol name="star" size={20} color="#6A2B10"/></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: "900", color: "#6A2B10" }}>Closer Plus</Text><Text style={{ fontSize: 13, fontWeight: "600", color: "#8E4A22", marginTop: 1 }}>{isPro ? "You’re a member · Manage subscription" : "Keep walking after week one"}</Text></View>
      <SFSymbol name="chevron.right" size={14} color="#6A2B10"/>
    </Pressable>

    {groups.map(([title, rows]) => <View key={title} style={{ marginTop: 26 }}>
      <Text style={[s.gh, { color: t.muted }]}>{title}</Text>
      <View style={[s.list, { backgroundColor: t.card }]}>
        {rows.map((r, i) => <Pressable key={r.label} onPress={r.onPress} accessibilityRole="button" accessibilityLabel={[r.label, r.value, r.sub].filter(Boolean).join(". ")}
          style={s.row}>
          {i > 0 && <View style={[s.divider, { backgroundColor: t.line }]}/>}
          <View style={[s.icon, { backgroundColor: r.color }]}><SFSymbol name={r.icon} size={17} color="#FFF"/></View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...uiText.body, fontWeight: "700", color: t.ink }}>{r.label}</Text>
            {!!r.sub && <Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "600", color: t.muted }}>{r.sub}</Text>}
          </View>
          {!!r.value && <Text style={{ fontSize: 15, fontWeight: "700", color: t.muted }}>{r.value}</Text>}
          <SFSymbol name="chevron.right" size={13} color={t.chev}/>
        </Pressable>)}
      </View>
    </View>)}

    <Text style={{ fontSize: 13, fontWeight: "600", color: t.muted, textAlign: "center", marginTop: 24 }}>Closer 0.1.0</Text>
  </ScrollView>;
}

const s = StyleSheet.create({
  me: { marginTop: 20, borderRadius: 26, borderCurve: "continuous", overflow: "hidden", padding: 18, flexDirection: "row", alignItems: "center", gap: 14, boxShadow: "0 18px 32px -18px #502D0A99" },
  av: { width: 58, height: 58, borderRadius: 19, borderCurve: "continuous", backgroundColor: "#E2391F", alignItems: "center", justifyContent: "center" },
  edit: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: "#FFF1E424", justifyContent: "center" },
  plus: { marginTop: 12, borderRadius: 22, borderCurve: "continuous", overflow: "hidden", paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12, boxShadow: "0 14px 26px -16px #8C500099" },
  plusIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF4CC", alignItems: "center", justifyContent: "center" },
  gh: { fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginLeft: 4, marginBottom: 10 },
  list: { borderRadius: 22, borderCurve: "continuous", boxShadow: "0 1px 2px #502D0A0F, 0 10px 24px -18px #502D0A59" },
  row: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 14 },
  divider: { position: "absolute", top: 0, left: 64, right: 0, height: StyleSheet.hairlineWidth },
  icon: { width: 34, height: 34, borderRadius: 10, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
});
