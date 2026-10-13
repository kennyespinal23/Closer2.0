import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable as PlainPressable, Share, StyleSheet, View } from "react-native";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { Text } from "@/components/CloserText";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { buildCurrentWeek } from "@/lib/rhythm";
import { useReminder } from "@/lib/useReminder";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";
import { useOnboarding } from "@/state/onboarding";
import { useProgress } from "@/state/progress";
import { useSubscription } from "@/state/subscription";
import { useTheme, type ThemePref } from "@/state/theme";

const CREAM = "#FFF1E4", GOLD = "#E9B949", AMBER = "#C98A1E";

/**
 * "You": what opens from the avatar on Home. Who you are and your week at a
 * glance, Closer Plus, the two settings people actually change (reminder
 * time, appearance), and the way into everything else. Home stays dimmed
 * behind it, so you never really leave today.
 */
export function YouSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter(), inset = useSafeAreaInsets(), reduced = useReducedMotion();
  const { answers } = useOnboarding(), { streak, engagedDates } = useProgress(), { isPro } = useSubscription();
  const { pref, setPref, scheme } = useTheme();
  const reminder = useReminder();
  const dark = scheme === "dark";
  const t = { paper: dark ? "#1E1A16" : "#FBF9F6", card: dark ? "#2A241F" : "#FFFFFF", ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", soft: dark ? "#FFFFFF14" : "#F3EEE8", line: dark ? "#FFFFFF14" : "#17120F14" };
  const name = answers.name.trim().split(" ")[0];
  const week = buildCurrentWeek(engagedDates).cells;

  // One smooth curve up; the same curve back down before the modal goes away.
  const [mounted, setMounted] = useState(visible);
  const shown = useSharedValue(0), h = useSharedValue(800);
  useEffect(() => {
    if (visible) { setMounted(true); shown.value = withTiming(1, { duration: reduced ? 150 : 400, easing: Easing.bezier(.2, .9, .25, 1) }); }
    else if (mounted) shown.value = withTiming(0, { duration: reduced ? 120 : 260, easing: Easing.in(Easing.cubic) }, done => { if (done) runOnJS(setMounted)(false); });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));
  const rise = useAnimatedStyle(() => reduced ? { opacity: shown.value } : { transform: [{ translateY: (1 - shown.value) * h.value }] });

  // Navigate once the sheet has gone, so the next screen doesn't fight the animation.
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => { if (!mounted && pending.current) { const go = pending.current; pending.current = null; go(); } }, [mounted]);
  const go = (path: Href) => { haptics.soft(); pending.current = () => router.push(path); onClose(); };
  const setMode = (next: ThemePref) => { haptics.tick(); setPref(next); };

  return <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#17120F61" }, scrim]}><PlainPressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }}/></Animated.View>
    <Animated.View onLayout={e => { h.value = e.nativeEvent.layout.height + 16; }} style={[s.sheet, { backgroundColor: t.paper, paddingBottom: inset.bottom + 6 }, rise]}>
      <View style={[s.grab, { backgroundColor: t.line }]}/>

      {/* you */}
      <View style={s.me}>
        <ReaderMaterialGradient colors={["#5A3526", "#3A2219", "#24140E"]} locations={[0, .55, 1]} style={StyleSheet.absoluteFill}/>
        <View style={s.av}>{name ? <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFF" }}>{name[0].toUpperCase()}</Text> : <SFSymbol name="person.fill" size={24} color="#FFF"/>}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...uiText.sectionTitle, fontSize: 21, lineHeight: 24, fontWeight: "900", color: CREAM }}>{name || "You"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }}/><Text style={{ fontSize: 14, fontWeight: "700", color: "#D8BDA5" }}>{streak.current} {streak.current === 1 ? "day" : "days"} in a row</Text></View>
        </View>
        <Pressable onPress={() => go("/profile")} accessibilityRole="button" style={s.pr}><Text style={{ fontSize: 14, fontWeight: "800", color: CREAM }}>Profile</Text><SFSymbol name="chevron.right" size={11} color={CREAM}/></Pressable>
      </View>

      {/* this week */}
      <View style={[s.week, { backgroundColor: t.card }]} accessible accessibilityLabel={`This week: ${week.filter(c => c.state === "engaged").length} days kept`}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: t.muted, marginRight: "auto" }}>This week</Text>
        {week.map(c => <View key={c.dateISO} style={[s.day, { backgroundColor: t.soft }, c.state === "engaged" && { backgroundColor: AMBER }, c.isToday && c.state !== "engaged" && { backgroundColor: t.card, borderWidth: 2, borderColor: t.ink }]}>
          {c.state === "engaged" ? <SFSymbol name="checkmark" size={11} color="#FFF" weight="bold"/> : <Text style={{ fontSize: 11, fontWeight: "800", color: c.isToday ? t.ink : t.muted }}>{Number(c.dateISO.slice(-2))}</Text>}
        </View>)}
      </View>

      {/* Closer Plus */}
      <Pressable onPress={() => isPro ? void Linking.openURL("https://apps.apple.com/account/subscriptions") : go("/onboarding/paywall")} accessibilityRole="button" style={s.plus}>
        <ReaderMaterialGradient colors={["#FFD455", "#FFC12E"]} style={StyleSheet.absoluteFill}/>
        <View style={s.plusIcon}><SFSymbol name="star" size={17} color="#6A2B10"/></View>
        <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "900", color: "#6A2B10" }}>Closer Plus</Text><Text style={{ fontSize: 13, fontWeight: "600", color: "#8E4A22" }}>{isPro ? "You’re a member. Thank you." : "Keep walking after week one"}</Text></View>
        <View style={s.manage}><Text style={{ fontSize: 13, fontWeight: "800", color: "#FFF4CC" }}>{isPro ? "Manage" : "See plans"}</Text></View>
      </Pressable>

      {/* quick settings */}
      <Text style={[s.qh, { color: t.muted }]}>Quick settings</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={[s.q, { backgroundColor: t.card }]}>
          <View style={s.qk}><SFSymbol name="bell" size={14} color={t.muted}/><Text style={{ fontSize: 13, fontWeight: "800", color: t.muted }}>Morning reminder</Text></View>
          <Pressable onPress={() => go("/settings/notifications")} accessibilityRole="button" accessibilityLabel={`Reminder ${reminder.enabled ? reminder.label : "off"}. Change time`}>
            <Text style={{ ...uiText.screenTitle, fontSize: 26, lineHeight: 30, letterSpacing: -.6, color: reminder.enabled ? t.ink : t.muted, marginTop: 8, fontVariant: ["tabular-nums"] }}>{reminder.enabled ? reminder.label : "Off"}</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            {[-15, 15].map(n => <Pressable key={n} disabled={reminder.busy} onPress={() => { haptics.tick(); reminder.nudge(n); }} accessibilityRole="button" accessibilityLabel={n < 0 ? "15 minutes earlier" : "15 minutes later"} style={[s.step, { backgroundColor: t.soft }]}>
              <SFSymbol name={n < 0 ? "minus" : "plus"} size={14} color={t.ink} weight="bold"/>
            </Pressable>)}
          </View>
        </View>
        <View style={[s.q, { backgroundColor: t.card }]}>
          <View style={s.qk}><SFSymbol name="sun.max" size={14} color={t.muted}/><Text style={{ fontSize: 13, fontWeight: "800", color: t.muted }}>Appearance</Text></View>
          <Text style={{ ...uiText.screenTitle, fontSize: 22, lineHeight: 30, color: t.ink, marginTop: 8 }}>{pref === "system" ? "Automatic" : pref === "dark" ? "Dark" : "Light"}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            {([["light", "sun.max"], ["dark", "moon"], ["system", "circle.lefthalf.filled"]] as [ThemePref, SFSymbolName][]).map(([mode, icon]) => <Pressable key={mode} onPress={() => setMode(mode)} accessibilityRole="button" accessibilityState={{ selected: pref === mode }} accessibilityLabel={mode === "system" ? "Automatic" : mode}
              style={[s.mode, { borderColor: pref === mode ? t.ink : t.line, borderWidth: pref === mode ? 2 : 1 }]}>
              <SFSymbol name={icon} size={17} color={t.ink}/>
            </Pressable>)}
          </View>
        </View>
      </View>

      {/* everything else */}
      <View style={[s.links, { backgroundColor: t.card }]}>
        {([["gearshape", "All settings", () => go("/settings")], ["gift", "Tell a friend", () => { haptics.soft(); void Share.share({ message: "I’ve been using Closer: a short letter from Scripture every morning. https://apps.apple.com/app/closer" }); }], ["questionmark.circle", "Help and support", () => go("/settings/help")]] as [SFSymbolName, string, () => void][]).map(([icon, label, onPress], i) =>
          <Pressable key={label} onPress={onPress} accessibilityRole="button" style={[s.link, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
            <SFSymbol name={icon} size={20} color={t.muted}/>
            <Text style={{ ...uiText.body, fontWeight: "700", color: t.ink, flex: 1 }}>{label}</Text>
            <SFSymbol name="chevron.right" size={13} color={t.muted}/>
          </Pressable>)}
      </View>
    </Animated.View>
  </Modal>;
}

const s = StyleSheet.create({
  sheet: { position: "absolute", left: 8, right: 8, bottom: 8, borderRadius: 38, borderCurve: "continuous", paddingTop: 10, paddingHorizontal: 18, boxShadow: "0 -20px 50px -20px #28140A73" },
  grab: { width: 36, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 14 },
  me: { borderRadius: 26, borderCurve: "continuous", overflow: "hidden", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  av: { width: 56, height: 56, borderRadius: 18, borderCurve: "continuous", backgroundColor: "#E2391F", alignItems: "center", justifyContent: "center" },
  pr: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#FFF1E424", flexDirection: "row", alignItems: "center", gap: 4 },
  week: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18 },
  day: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  plus: { marginTop: 10, borderRadius: 18, borderCurve: "continuous", overflow: "hidden", paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  plusIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#FFF4CC", alignItems: "center", justifyContent: "center" },
  manage: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "#2A1206", justifyContent: "center" },
  qh: { fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 18, marginBottom: 8, marginLeft: 4 },
  q: { flex: 1, borderRadius: 20, borderCurve: "continuous", padding: 14 },
  qk: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: { flex: 1, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mode: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  links: { marginTop: 12, borderRadius: 20, borderCurve: "continuous" },
  link: { minHeight: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
});
