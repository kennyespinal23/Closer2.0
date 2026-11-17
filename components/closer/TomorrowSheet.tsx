import { useEffect, useState } from "react";
import { feel } from "@/lib/feedback";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { nunito } from "@/components/closer/kit";
import { SealedEnvelope } from "@/components/TomorrowLetter";
import type { Daily } from "@/lib/closer-page/content/daily";
import { clearTomorrowReminder, dayKey, REMIND_LABEL, setTomorrowReminder, tomorrowReminderDay } from "@/lib/tomorrowReminder";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { fill, useStrings } from "@/lib/i18n";

/**
 * Tapping Tomorrow on Today: a letter waiting for you. The brown ember sheet from the first Home, with tomorrow's
 * story sealed in its envelope and a quiet countdown to midnight, when it becomes Today's. One button sets a 7:00
 * reminder for that morning; tapping it again takes it back. It slides up and stops, nothing bounces.
 */

function untilMidnight() {
  const n = new Date(), m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((m.getTime() - n.getTime()) / 1000));
  return { h: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, s: s % 60 };
}
const pad = (x: number) => String(x).padStart(2, "0");
const CREAM = "#FFF1E4", CREAM_2 = "#FFF1E4B3", SUN = "#FFC93C", COAL = "#17120F";
const EASE = Easing.out(Easing.cubic);

function Bell({ color }: { color: string }) {
  return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM9.5 19a2.5 2.5 0 0 0 5 0" fill={color} /></Svg>;
}

function Tick({ color }: { color: string }) {
  return <Svg width={18} height={18} viewBox="0 0 16 16"><Path d="M3 8.5l3 3 7-7" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

export function TomorrowSheet({ open, pick, onClose }: { open: boolean; pick: Daily; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const [left, setLeft] = useState(untilMidnight);
  const [remind, setRemind] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const { lesson, shelf } = pick;
  const s = useStrings().native.tomorrow;

  useEffect(() => {
    if (!open) return;
    const letter = setTimeout(() => feel("letter"), 260); // as the letter slides up
    setDenied(false);
    setLeft(untilMidnight());
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    void tomorrowReminderDay().then(d => setRemind(d === dayKey(tomorrow)));
    const i = setInterval(() => setLeft(untilMidnight()), 1000);
    return () => { clearInterval(i); clearTimeout(letter); };
  }, [open]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (remind) { await clearTomorrowReminder(); setRemind(false); return; }
      const r = await setTomorrowReminder(lesson.title);
      if (r === "denied") { setDenied(true); return; }
      setRemind(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally { setBusy(false); }
  };

  // the seal answers a tap with a small "not yet" wiggle
  const tilt = useSharedValue(-4);
  const wiggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reduce) return;
    tilt.value = withSequence(withTiming(-9, { duration: 90 }), withTiming(1, { duration: 120 }), withTiming(-6, { duration: 110 }), withTiming(-4, { duration: 140 }));
  };
  const envelope = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(reduce ? 0 : 220)} exiting={FadeOut.duration(180)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,12,8,.45)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel={s.close} />
      </Animated.View>
      <Animated.View
        entering={reduce ? FadeIn.duration(150) : SlideInDown.duration(320).easing(EASE)}
        exiting={reduce ? FadeOut.duration(150) : SlideOutDown.duration(240)}
        accessibilityViewIsModal
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: "hidden", backgroundColor: "#2A1710" }}
      >
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Defs><LinearGradient id="ember" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#4A2C20" /><Stop offset=".55" stopColor="#351E15" /><Stop offset="1" stopColor="#2A1710" /></LinearGradient></Defs>
          <Rect width="100%" height="100%" fill="url(#ember)" />
        </Svg>
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(28, insets.bottom + 10) }}>
          <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#FFF1E433", marginBottom: 22 }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <Pressable onPress={wiggle} accessibilityRole="image" accessibilityLabel={s.letterA11y} accessibilityHint={s.letterHint}>
              <Animated.View style={envelope}><SealedEnvelope width={112} tilt={0} /></Animated.View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={nunito(800, 12, { color: CREAM_2, letterSpacing: 1.6, textTransform: "uppercase" })}>{fill(s.from, { shelf: shelf.label })}</Text>
              <Text accessibilityRole="header" style={nunito(900, 26, { color: CREAM, letterSpacing: -0.7, lineHeight: 28, marginTop: 6 })}>{lesson.title}</Text>
              <Text style={nunito(700, 14.5, { color: CREAM_2, marginTop: 6 })}>{fill(s.meta, { passage: lesson.scripture.split(" · ")[0], n: lesson.minutes })}</Text>
            </View>
          </View>

          <Text style={nunito(800, 17, { color: CREAM, marginTop: 24 })}>{s.waiting}</Text>
          <View accessible accessibilityLabel={fill(s.opensIn, { h: left.h, m: left.m })} style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {([[left.h, s.hours], [left.m, s.min], [left.s, s.sec]] as const).map(([v, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: "#FFF1E414", borderRadius: 16, paddingTop: 9, paddingBottom: 7, alignItems: "center" }}>
                <Text style={nunito(900, 24, { color: CREAM, letterSpacing: -0.4, fontVariant: ["tabular-nums"] })}>{pad(v)}</Text>
                <Text style={nunito(800, 10.5, { color: CREAM_2, letterSpacing: 1.3, textTransform: "uppercase" })}>{l}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ selected: remind, busy }} style={{ marginTop: 18 }}
            accessibilityLabel={remind ? fill(s.reminderSetA11y, { time: REMIND_LABEL }) : fill(s.remindMe, { time: REMIND_LABEL })}>
            <View style={{ height: 56, borderRadius: 28, backgroundColor: remind ? "#FFF1E41F" : CREAM, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {remind ? <Tick color={SUN} /> : <Bell color={COAL} />}
              <Text style={nunito(800, 17, { color: remind ? CREAM : COAL })}>{remind ? fill(s.reminderSet, { time: REMIND_LABEL }) : fill(s.remindMe, { time: REMIND_LABEL })}</Text>
            </View>
          </Pressable>
          {denied && (
            <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="link">
              <Text style={nunito(700, 14, { color: CREAM_2, textAlign: "center", marginTop: 10 })}>{s.notificationsOff} <Text style={{ color: SUN, fontFamily: "NunitoExtraBold" }}>{s.turnOn}</Text></Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} accessibilityRole="button" style={{ height: 50, alignItems: "center", justifyContent: "center", marginTop: 6 }}>
            <Text style={nunito(800, 16, { color: CREAM_2 })}>{s.okay}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
