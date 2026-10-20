import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { mix } from "@/components/HomeDeck";
import { avatarForName, findAvatar } from "@/constants/avatars";
import { useOnboarding } from "@/state/onboarding";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";

/* Together: a near-black room where every card wears the colour of what's on it.
   People wear their avatar's colour, groups wear their book's. Text inside a card is
   that colour mixed with white, never grey. */

export const FLOOR = "#0B0909";
export const INK_SOFT = "#A8A09C";
export const INK_FAINT = "#8E8784";

/** Everything a card needs from one colour. */
export function tone(c: string) {
  return {
    c, deep: mix(c, "#000000", .5), mid: mix(c, "#000000", .3),
    t1: mix("#FFFFFF", c, .12), t2: mix("#FFFFFF", c, .36), t3: mix("#FFFFFF", c, .56),
  };
}
export type Tone = ReturnType<typeof tone>;

/** A person, as Together shows them: a name, a face and a colour. */
export type Person = { name: string; source?: ImageSource; color: string; anonymous: boolean };
export function personFor(author: string): Person {
  const clean = author.replace(/\s*\(you\)\s*$/i, "").trim();
  if (/^anonymous/i.test(clean)) return { name: "A friend", color: "#5A4E48", anonymous: true };
  const a = avatarForName(clean);
  return { name: clean, source: a.source, color: a.color, anonymous: false };
}
/** You, with the avatar you chose (or a stable one until you do). */
export function useMe(): Person {
  const { answers } = useOnboarding();
  const name = (answers.name || "").trim().split(/\s+/)[0] || "You";
  const chosen = findAvatar(answers.avatarId), fallback = avatarForName(name);
  return { name, source: answers.avatarPhotoUri ? { uri: answers.avatarPhotoUri } : (chosen ?? fallback).source, color: (chosen ?? fallback).color, anonymous: false };
}

/** A group member: you (stored as "Y", "You" or your name), or a stable sample person. */
export function memberFor(m: string, me: Person): Person { return m === "Y" || m === "You" || m === me.name ? me : personFor(m); }

export function Face({ person, size, ring }: { person: Person; size: number; ring?: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: person.color, alignItems: "center", justifyContent: "center", boxShadow: ring ? `0 0 0 ${size > 50 ? 4 : 2}px ${ring}` : undefined }}>
    {person.source ? <Image source={person.source} contentFit="cover" style={StyleSheet.absoluteFill}/> : <SFSymbol name="person.fill" size={size * .45} color="#FFFFFFB8"/>}
  </View>;
}
export function Faces({ people, size = 26, ring }: { people: Person[]; size?: number; ring: string }) {
  return <View accessible={false} style={{ flexDirection: "row" }}>{people.map((p, i) => <View key={i} style={{ marginLeft: i ? -size * .3 : 0 }}><Face person={p} size={size} ring={ring}/></View>)}</View>;
}

/** A darker see-through pill for chrome sitting on colour. */
export function Glass({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: ViewStyle; onPress?: () => void; accessibilityLabel?: string }) {
  const base: ViewStyle = { backgroundColor: "#0000004A", borderRadius: 22, boxShadow: "inset 0 1px 0 #FFFFFF22", flexDirection: "row", alignItems: "center", justifyContent: "center" };
  return onPress ? <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={6} style={[base, style]}>{children}</Pressable> : <View style={[base, style]}>{children}</View>;
}
export function RoundButton({ icon, label, onPress, size = 44 }: { icon: SFSymbolName; label: string; onPress: () => void; size?: number }) {
  return <Glass onPress={() => { haptics.soft(); onPress(); }} accessibilityLabel={label} style={{ width: size, height: size, borderRadius: size / 2 }}><SFSymbol name={icon} size={17} color="#FFFFFFD9"/></Glass>;
}
/** Section header: bold white on the left, one quiet glass pill on the right. */
export function Section({ title, action }: { title: string; action?: { label: string; icon?: SFSymbolName; onPress: () => void } }) {
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, marginTop: 26, marginBottom: 12 }}>
    <Text accessibilityRole="header" style={{ fontSize: 20, lineHeight: 25, fontWeight: "900", letterSpacing: -.3, color: "#FCFCFC" }}>{title}</Text>
    {action && <Pressable feedback="action" accessibilityRole="button" onPress={() => { haptics.soft(); action.onPress(); }} hitSlop={6}
      style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF1A" }}>
      {action.icon && <SFSymbol name={action.icon} size={13} color="#E8E3E0"/>}<Text style={{ fontSize: 14, fontWeight: "800", color: "#E8E3E0" }}>{action.label}</Text>
    </Pressable>}
  </View>;
}
/** A full-height ground in one colour: lit near the top, deepening towards the bottom. */
export function ToneGround({ t }: { t: Tone }) {
  return <ReaderMaterialGradient pointerEvents="none" colors={[mix(t.c, t.mid, .35), t.mid, t.deep, mix(t.c, "#000000", .82)]} locations={[0, .22, .55, 1]} style={StyleSheet.absoluteFill}/>;
}

/** Press and hold to pray. The bar fills; letting go early resets. */
export function HoldToPray({ t, done, onDone, label = "Hold to pray", doneLabel = "You prayed" }: { t: Tone; done: boolean; onDone: () => void; label?: string; doneLabel?: string }) {
  const reduced = useReducedMotion(), progress = useSharedValue(done ? 1 : 0), locked = useRef(done);
  const [holding, setHolding] = useState(false);
  useEffect(() => { if (done) { locked.current = true; progress.value = withTiming(1, { duration: 200 }); } }, [done, progress]);
  const finish = () => { if (locked.current) return; locked.current = true; setHolding(false); haptics.success(); onDone(); };
  const start = () => { if (locked.current) return; haptics.soft(); setHolding(true); progress.value = withTiming(1, { duration: reduced ? 400 : 1200, easing: Easing.linear }, f => { if (f) runOnJS(finish)(); }); };
  const release = () => { if (locked.current) return; cancelAnimation(progress); progress.value = withTiming(0, { duration: 160 }); setHolding(false); };
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={done ? doneLabel : label} accessibilityHint={done ? undefined : "Press and hold"} accessibilityState={{ disabled: done }}
    onPressIn={start} onPressOut={release} onAccessibilityTap={finish}
    style={{ flex: 1, height: 56, borderRadius: 28, overflow: "hidden", backgroundColor: done ? mix(t.c, "#FFF8F2", .7) : "#FFF8F2", alignItems: "center", justifyContent: "center", boxShadow: `0 14px 30px -12px ${t.c}CC` }}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: mix(t.c, "#FFF8F2", .68), transformOrigin: "left center" }, fill]}/>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {done ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFF8F2", alignItems: "center", justifyContent: "center" }}><SFSymbol name="checkmark" size={12} color={t.deep}/></View> : <SFSymbol name="heart.fill" size={16} color={t.deep}/>}
      <Text style={{ fontSize: 17, fontWeight: "800", color: t.deep }}>{done ? doneLabel : holding ? "Keep holding" : label}</Text>
    </View>
  </Pressable>;
}
