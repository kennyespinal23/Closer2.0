import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { K, PressButton, TONES, nunito } from "@/components/closer/kit";
import { TONE } from "@/lib/closer-page/content/library";
import type { Daily } from "@/lib/closer-page/content/daily";
import { clearTomorrowReminder, dayKey, REMIND_LABEL, setTomorrowReminder, tomorrowReminderDay } from "@/lib/tomorrowReminder";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Tapping Tomorrow on Today: the card is shown, tied shut with Page's yellow ribbon, counting down to midnight, when
 * it becomes Today's. One button sets a 7:00 reminder for that morning; tapping it again takes it back.
 * Matches screens/TomorrowSheet.tsx in the closer-page prototype.
 */

function untilMidnight() {
  const n = new Date(), m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((m.getTime() - n.getTime()) / 1000));
  return { h: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, s: s % 60 };
}
const pad = (x: number) => String(x).padStart(2, "0");
const RIBBON = K.gold;

function Bow() {
  return (
    <Svg width={58} height={40} viewBox="0 0 58 40">
      <Path d="M29 20 C14 2 2 6 6 20 C2 34 14 38 29 20Z" fill={RIBBON} stroke="#E0A800" strokeWidth={2} />
      <Path d="M29 20 C44 2 56 6 52 20 C56 34 44 38 29 20Z" fill={RIBBON} stroke="#E0A800" strokeWidth={2} />
      <Circle cx={29} cy={20} r={6} fill="#F2B400" />
    </Svg>
  );
}

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
  const t = TONE[pick.entry.tone];
  const { lesson, shelf } = pick;

  useEffect(() => {
    if (!open) return;
    setDenied(false);
    setLeft(untilMidnight());
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    void tomorrowReminderDay().then(d => setRemind(d === dayKey(tomorrow)));
    const i = setInterval(() => setLeft(untilMidnight()), 1000);
    return () => clearInterval(i);
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

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(reduce ? 0 : 250)} exiting={FadeOut.duration(200)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(23,37,31,.42)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        entering={reduce ? FadeIn.duration(150) : SlideInDown.springify().damping(30).stiffness(260)}
        exiting={reduce ? FadeOut.duration(150) : SlideOutDown.duration(260)}
        accessibilityViewIsModal
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: K.cream, borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingHorizontal: 22, paddingTop: 14, paddingBottom: Math.max(32, insets.bottom + 12) }}
      >
        <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#E1D5C2", marginBottom: 20 }} />

        {/* tomorrow's card, tied shut */}
        <Animated.View entering={reduce ? undefined : ZoomIn.springify().damping(18).stiffness(300).delay(120)} style={{ marginBottom: 7 }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: 7, bottom: -7, borderRadius: 26, backgroundColor: t.bg }}>
            <View style={{ flex: 1, borderRadius: 26, backgroundColor: "rgba(0,0,0,.2)" }} />
          </View>
          <View style={{ backgroundColor: t.bg, borderRadius: 26, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 }}>
            <Text style={nunito(800, 12, { color: t.fg, opacity: 0.75, letterSpacing: 1.7, textTransform: "uppercase" })}>Tomorrow · {shelf.label}</Text>
            <Text style={nunito(900, 32, { color: t.fg, letterSpacing: -1, lineHeight: 33, marginTop: 10, maxWidth: "78%" })}>{lesson.title}</Text>
            <Text style={nunito(700, 15.5, { color: t.fg, opacity: 0.8, marginTop: 8 })}>{lesson.scripture.split(" · ")[0]} · {lesson.minutes} min</Text>
            <View style={{ height: 44 }} />
          </View>
          <View pointerEvents="none" style={{ position: "absolute", top: -6, bottom: -13, left: "80%", width: 22, backgroundColor: RIBBON }} />
          <View pointerEvents="none" style={{ position: "absolute", left: -6, right: -6, bottom: 20, height: 22, backgroundColor: RIBBON }} />
          <View pointerEvents="none" style={{ position: "absolute", left: "80%", bottom: 11, marginLeft: -17 }}><Bow /></View>
        </Animated.View>

        <Text accessibilityRole="header" style={nunito(900, 30, { color: K.ink, letterSpacing: -0.9, lineHeight: 32, marginTop: 20 })}>Not yet. It opens at midnight.</Text>
        <View accessible accessibilityLabel={`Opens in ${left.h} hours ${left.m} minutes`} style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          {([[left.h, "hours"], [left.m, "min"], [left.s, "sec"]] as const).map(([v, l]) => (
            <View key={l} style={{ flex: 1, backgroundColor: K.creamDeep, borderRadius: 16, paddingTop: 10, paddingBottom: 8, alignItems: "center" }}>
              <Text style={nunito(900, 28, { color: K.ink, letterSpacing: -0.5, fontVariant: ["tabular-nums"] })}>{pad(v)}</Text>
              <Text style={nunito(800, 11, { color: K.inkFaint, letterSpacing: 1.3, textTransform: "uppercase" })}>{l}</Text>
            </View>
          ))}
        </View>

        <PressButton style={{ marginTop: 16 }} tone={remind ? { face: K.forest, lip: K.forestDeep, text: K.cream } : TONES.red} onPress={toggle}
          label={remind ? `Reminder set for ${REMIND_LABEL}. Tap to cancel.` : `Remind me at ${REMIND_LABEL}`}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {remind ? <Tick color={K.cream} /> : <Bell color={K.cream} />}
            <Text style={nunito(800, 18, { color: K.cream, letterSpacing: -0.2 })}>{remind ? `I’ll remind you at ${REMIND_LABEL}` : `Remind me at ${REMIND_LABEL}`}</Text>
          </View>
        </PressButton>
        {denied && (
          <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="link">
            <Text style={nunito(700, 14, { color: K.inkSoft, textAlign: "center", marginTop: 10 })}>Notifications are off for Closer. <Text style={{ color: K.red, fontFamily: "NunitoExtraBold" }}>Turn them on in Settings</Text></Text>
          </Pressable>
        )}
        <Pressable onPress={onClose} accessibilityRole="button" style={{ marginTop: 12 }}>
          <View style={{ height: 56, borderRadius: 18, borderWidth: 2, borderColor: "#E1D5C2", alignItems: "center", justifyContent: "center" }}>
            <Text style={nunito(900, 17, { color: K.ink })}>Okay</Text>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
