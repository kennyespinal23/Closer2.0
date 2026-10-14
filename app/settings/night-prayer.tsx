import { useEffect, useLayoutEffect, useState } from "react";
import { Linking } from "react-native";
import { getNotificationPermission } from "@/lib/notifications";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { useNavigation } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { Text } from "@/components/CloserText";
import { SFSymbol } from "@/components/Symbol";
import { NIGHT, NightPrayerFlow, NightSky } from "@/components/NightPrayer";
import { NIGHT_TOPICS, formatNightTime, updateNightPrayer, useNightPrayer } from "@/lib/nightPrayer";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";
import { useTheme } from "@/state/theme";

/** Night prayer: whether the card shows, when, and what you usually pray for. */
export default function NightPrayerSettings() {
  const navigation = useNavigation(), headerHeight = useHeaderHeight(), inset = useSafeAreaInsets();
  const { scheme } = useTheme(), dark = scheme === "dark", n = useNightPrayer();
  useLayoutEffect(() => { navigation.setOptions({ title: "" }); }, [navigation]);
  const [blocked, setBlocked] = useState(false), [preview, setPreview] = useState(false);
  useEffect(() => { void getNotificationPermission().then(p => setBlocked(p === "denied")); }, [n.enabled]);
  const t = { ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", card: dark ? "#2A241F" : "#FFFFFF", line: dark ? "#FFFFFF14" : "#17120F14", soft: dark ? "#FFFFFF12" : "#F3EEE8" };
  const nudge = (min: number) => {
    haptics.tick();
    const total = ((n.hour * 60 + n.minute + min) % 1440 + 1440) % 1440;
    updateNightPrayer({ hour: Math.floor(total / 60), minute: total % 60 });
  };
  const toggleTopic = (topic: string) => {
    haptics.tick();
    const on = n.topics.includes(topic);
    updateNightPrayer({ topics: on ? n.topics.filter(x => x !== topic) : n.topics.length < 3 ? [...n.topics, topic] : [...n.topics.slice(1), topic] });
  };

  return <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 20, paddingBottom: inset.bottom + 40 }}>
    <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: t.ink, marginTop: 4 }}>Night prayer</Text>

    <View style={s.hero}>
      <NightSky width="100%" height="100%" stars={7}/>
      <Text style={{ fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -.5, color: NIGHT.moon }}>Lay today down.</Text>
      <Text style={{ fontSize: 14, lineHeight: 19, fontWeight: "600", color: NIGHT.lav, marginTop: 6 }}>A card on Home each night. Say how today felt, then pray before you sleep.</Text>
      <Pressable onPress={() => { haptics.soft(); setPreview(true); }} accessibilityRole="button" style={s.preview}>
        <SFSymbol name="play.fill" size={13} color={NIGHT.ink}/>
        <Text style={{ fontSize: 15, fontWeight: "900", color: NIGHT.ink }}>Preview night prayer</Text>
      </Pressable>
    </View>

    <View style={[s.card, { backgroundColor: t.card }]}>
      <View style={s.row}>
        <Text style={{ ...uiText.body, fontWeight: "700", color: t.ink, flex: 1 }}>Show the night card</Text>
        <Switch value={n.enabled} onValueChange={v => { haptics.soft(); updateNightPrayer({ enabled: v }); }} trackColor={{ true: "#6E3878" }} accessibilityLabel="Show the night card"/>
      </View>
      <View style={[s.row, { opacity: n.enabled ? 1 : .4 }]}>
        <View style={[s.divider, { backgroundColor: t.line }]}/>
        <View style={{ flex: 1 }}>
          <Text style={{ ...uiText.body, fontWeight: "700", color: t.ink }}>Appears at</Text>
          <Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "600", color: t.muted }}>Stays until you pray, or 4 am</Text>
        </View>
        <Pressable disabled={!n.enabled} onPress={() => nudge(-15)} accessibilityRole="button" accessibilityLabel="15 minutes earlier" style={[s.step, { backgroundColor: t.soft }]}><SFSymbol name="minus" size={15} color={t.ink} weight="bold"/></Pressable>
        <Text style={{ fontSize: 17, fontWeight: "900", color: t.ink, minWidth: 74, textAlign: "center", fontVariant: ["tabular-nums"] }}>{formatNightTime(n.hour, n.minute)}</Text>
        <Pressable disabled={!n.enabled} onPress={() => nudge(15)} accessibilityRole="button" accessibilityLabel="15 minutes later" style={[s.step, { backgroundColor: t.soft }]}><SFSymbol name="plus" size={15} color={t.ink} weight="bold"/></Pressable>
      </View>
    </View>

    {!blocked && n.enabled && <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: "600", color: t.muted, marginTop: 10, marginHorizontal: 4 }}>We’ll send a quiet notification at this time.</Text>}
    {blocked && n.enabled && <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="button" style={{ marginTop: 6, marginHorizontal: 4 }}><Text style={{ fontSize: 13, lineHeight: 18, fontWeight: "700", color: t.muted }}>Notifications are off for Closer, so only the Home card will show. <Text style={{ fontWeight: "900", color: t.ink }}>Turn them on</Text></Text></Pressable>}
    <Text style={[s.gh, { color: t.muted }]}>What you pray for</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {NIGHT_TOPICS.map(topic => {
        const on = n.topics.includes(topic);
        return <Pressable key={topic} onPress={() => toggleTopic(topic)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={topic}
          style={[s.chip, on ? { backgroundColor: dark ? "#6E3878" : "#42204F" } : { backgroundColor: t.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.line }]}>
          {on && <SFSymbol name="checkmark" size={13} color="#FBF2F6" weight="bold"/>}
          <Text style={{ fontSize: 16, fontWeight: "800", color: on ? "#FBF2F6" : t.ink }}>{topic}</Text>
        </Pressable>;
      })}
    </View>
    <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: "600", color: t.muted, marginTop: 12, marginHorizontal: 4 }}>Up to three. They’re picked for you each night, and you can change them in the moment.</Text>
    <NightPrayerFlow visible={preview} onClose={() => setPreview(false)}/>
  </ScrollView>;
}

const s = StyleSheet.create({
  preview: { alignSelf: "flex-start", marginTop: 14, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: NIGHT.moon, flexDirection: "row", alignItems: "center", gap: 7 },
  hero: { marginTop: 20, borderRadius: 26, borderCurve: "continuous", overflow: "hidden", padding: 18, justifyContent: "flex-end" },
  card: { marginTop: 16, borderRadius: 22, borderCurve: "continuous", boxShadow: "0 1px 2px #502D0A0F, 0 10px 24px -18px #502D0A59" },
  row: { minHeight: 62, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { position: "absolute", top: 0, left: 16, right: 0, height: StyleSheet.hairlineWidth },
  step: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  gh: { marginTop: 28, marginBottom: 12, marginLeft: 4, fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 6 },
});
