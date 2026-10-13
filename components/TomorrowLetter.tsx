import { useEffect } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/CloserText";
import { CloseButton } from "@/components/CloseButton";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol } from "./Symbol";
import { dailyText, uiText } from "@/lib/typography";
import { devotionalDurationMin, findDevotionalByDay } from "@/lib/devotionals";
import { formatReminderTime } from "@/lib/notifications";
import { useOnboarding } from "@/state/onboarding";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";

const CREAM = "#FFF1E4", CREAM_2 = "#FFF1E4B3", SUN = "#FFC93C", SEAL = "#E2391F";

/** Tomorrow's letter: cream envelope, flap closed, red cross seal. */
export function SealedEnvelope({ width, tilt = 7 }: { width: number; tilt?: number }) {
  return <View accessible={false} style={{ transform: [{ rotate: `${tilt}deg` }], boxShadow: "0 10px 18px -8px #00000073", borderRadius: 10 }}>
    <Svg width={width} height={width * 104 / 150} viewBox="0 0 150 104">
      <Rect x={0} y={0} width={150} height={104} rx={10} fill="#F4E6D3"/>
      <Path d="M2 100 62 54M148 100 88 54" stroke="#E2CDB2" strokeWidth={2} fill="none"/>
      <Path d="M5 4Q75 72 145 4Z" fill="#EAD7BD"/>
      <Path d="M3 4 75 58 147 4" stroke="#D3BC9D" strokeWidth={2.5} strokeLinejoin="round" fill="none"/>
      <Circle cx={75} cy={58} r={15} fill={SEAL}/>
      <Path d="M75 50v16M69 55.5h12" stroke={CREAM} strokeWidth={2.8} strokeLinecap="round"/>
    </Svg>
  </View>;
}

/**
 * What tomorrow's card shows before it unlocks: the sealed letter,
 * a hint of where it comes from, when it opens, and today's progress.
 * The seal answers a tap with a small "not yet" wiggle.
 */
export function TomorrowLetter({ visible, day, todayCount, onClose, onOpenToday, onDismiss }: {
  visible: boolean;
  /** Catalog day of the locked letter. */
  day: number;
  /** Today's steps done, 0–4. */
  todayCount: number;
  onClose: () => void;
  /** Close this sheet and open today's walk. */
  onOpenToday: () => void;
  onDismiss?: () => void;
}) {
  const insets = useSafeAreaInsets(), router = useRouter(), reduced = useReducedMotion();
  const { answers } = useOnboarding();
  const letter = findDevotionalByDay(day);
  const from = letter ? `From ${letter.reference.replace(/:.*$/, "")} · ${devotionalDurationMin(letter)} min` : null;
  const reminder = answers.notificationsEnabled && answers.dailyReminderTime ? formatReminderTime(answers.dailyReminderTime) : null;
  const kept = todayCount >= 4;

  const tilt = useSharedValue(-5);
  const wiggle = (delay = 0) => {
    if (reduced) return;
    tilt.value = withDelay(delay, withSequence(
      withTiming(-10, { duration: 90 }), withTiming(0, { duration: 120 }),
      withTiming(-8, { duration: 110 }), withTiming(-3, { duration: 110 }), withTiming(-5, { duration: 140 }),
    ));
  };
  useEffect(() => { if (visible) { tilt.value = -5; wiggle(450); } }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const envelope = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  const openSettings = () => { onClose(); setTimeout(() => router.push("/settings/notifications"), Platform.OS === "ios" ? 450 : 0); };

  return <Modal visible={visible} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={onClose} onDismiss={onDismiss}>
    {/* The sheet's own ground is ember too, so nothing light shows under the gradient at the bottom edge. */}
    <View style={{ flex: 1, backgroundColor: "#2A1710" }}>
    <ReaderMaterialGradient colors={["#4A2C20", "#351E15", "#2A1710"]} locations={[0, .55, 1]} style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 18) + 16 }}>
      <View style={s.top}>
        <CloseButton onPress={onClose} color={CREAM} style={s.close}/>
        <Text style={{ ...uiText.supporting, fontWeight: "800", color: CREAM_2 }}>{String(day).padStart(2, "0")} · Tomorrow</Text>
        <View style={s.close}/>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 36 }}>
        <Pressable onPress={() => { haptics.tap(); wiggle(); }} accessibilityRole="image" accessibilityLabel="Sealed letter. Opens tomorrow." accessibilityHint="Not yet">
          <Animated.View style={envelope}><SealedEnvelope width={236} tilt={0}/></Animated.View>
        </Pressable>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text accessibilityRole="header" style={{ ...dailyText.overviewTitle, color: CREAM, textAlign: "center", maxWidth: 300 }}>A letter waiting for you</Text>
          {from && <Text style={{ ...uiText.supporting, color: CREAM_2, textAlign: "center" }}>{from}</Text>}
        </View>
      </View>

      <View style={s.facts}>
        <Pressable disabled={!!reminder} onPress={openSettings} accessibilityRole={reminder ? "text" : "button"} style={s.fact}>
          <SFSymbol name="bell" size={20} color={SUN}/>
          <View style={{ flex: 1 }}>
            <Text style={{ ...uiText.body, fontWeight: "800", color: CREAM }}>Opens tomorrow</Text>
            <Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 18, color: CREAM_2 }}>{reminder ? `We'll remind you at ${reminder}` : "Turn on a morning reminder"}</Text>
          </View>
          {!reminder && <SFSymbol name="chevron.right" size={13} color={CREAM_2}/>}
        </Pressable>
        <View style={[s.fact, s.rule]}>
          <SFSymbol name="sun.max" size={20} color={SUN}/>
          <View style={{ flex: 1 }}>
            <Text style={{ ...uiText.body, fontWeight: "800", color: CREAM }}>{kept ? "Today is kept" : "Today's walk"}</Text>
            <Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 18, color: CREAM_2 }}>{kept ? "All four done" : `${todayCount} of 4 done`}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }} accessible={false}>
            {[0, 1, 2, 3].map(i => <View key={i} style={[s.dot, i < todayCount && { backgroundColor: SEAL }]}>{i < todayCount && <SFSymbol name="checkmark" size={10} color="#FFF"/>}</View>)}
          </View>
        </View>
      </View>

      <Pressable feedback="action" onPress={kept ? onClose : onOpenToday} accessibilityRole="button" style={s.cta}>
        {kept && <SFSymbol name="moon" size={18} color="#17120F"/>}
        <Text style={{ ...uiText.body, fontWeight: "800", color: "#17120F" }}>{kept ? "See you tomorrow" : "Back to today's walk"}</Text>
      </Pressable>
    </ReaderMaterialGradient>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  facts: { marginHorizontal: 20, marginBottom: 16, borderRadius: 24, borderCurve: "continuous", backgroundColor: "#FFF1E414", paddingHorizontal: 18 },
  fact: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#FFF1E42E" },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1E429" },
  cta: { marginHorizontal: 20, height: 56, borderRadius: 28, backgroundColor: CREAM, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
});
