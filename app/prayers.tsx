import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SFSymbol } from "@/components/Symbol";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { NIGHT, NightSky } from "@/components/NightPrayer";
import { composeNightPrayer, nightKey, setNightPrayerAnswered, useNightPrayer, type NightPrayerEntry } from "@/lib/nightPrayer";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { goBackOr } from "@/lib/navigation";
import * as haptics from "@/lib/haptics";

const dateOf = (night: string) => new Date(`${night}T12:00:00`);
const andList = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
const timeOf = (at: number) => new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
const longDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/**
 * Your prayers: every night you prayed, as moons on a month, what you pray
 * for most, and each night's prayer. Private to you. Mark one answered.
 */
export default function PrayersScreen() {
  const router = useRouter(), inset = useSafeAreaInsets(), reduced = useReducedMotion(), { log } = useNightPrayer();
  const today = new Date(), tonight = nightKey();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [open, setOpen] = useState<NightPrayerEntry | null>(null);
  const byNight = useMemo(() => new Map(log.map(e => [e.night, e])), [log]);
  const inMonth = log.filter(e => { const d = dateOf(e.night); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); });
  const answered = inMonth.filter(e => e.answeredAt).length;
  const top = useMemo(() => {
    const counts = new Map<string, number>();
    log.forEach(e => e.topics.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [log]);
  const isThisMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const shift = (n: number) => { haptics.tick(); setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1)); };

  // Monday-first grid for the month.
  const lead = (month.getDay() + 6) % 7, days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const keyFor = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const openCurrent = open ? byNight.get(open.night) ?? open : null;

  return <View style={{ flex: 1, backgroundColor: NIGHT.deep }}>
    <StatusBar style="light"/>
    <NightSky fade/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: inset.top + 6, paddingHorizontal: 20, paddingBottom: inset.bottom + 48 }}>
      <View style={{ flexDirection: "row", alignItems: "center", height: 48 }}>
        <Pressable onPress={() => { haptics.soft(); goBackOr(router, "/(tabs)/profile"); }} accessibilityRole="button" accessibilityLabel="Back" style={s.round}><SFSymbol name="chevron.left" size={17} color={NIGHT.moon} weight="bold"/></Pressable>
        <View style={{ flex: 1 }}/>
        <Text style={s.kicker}>Your prayers</Text>
      </View>

      {log.length === 0 ? <View style={{ alignItems: "center", marginTop: 40 }}>
        <MoonFace size={80}/>
        <Text accessibilityRole="header" style={[s.h1, { textAlign: "center", marginTop: 34 }]}>Your first night is ahead.</Text>
        <Text style={[s.sub, { textAlign: "center", maxWidth: 300 }]}>Each night you pray lights up a day here, with what you prayed for.</Text>
      </View> : <>
        <View accessible accessibilityLabel={`${inMonth.length} nights prayed ${isThisMonth ? "this month" : `in ${month.toLocaleDateString("en-GB", { month: "long" })}`}`} style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: 14 }}>
          <Text style={{ fontSize: 92, lineHeight: 100, paddingTop: 6, fontWeight: "900", letterSpacing: -4, color: NIGHT.candle, fontVariant: ["tabular-nums"], marginBottom: -12 }}>{inMonth.length}</Text>
          <View style={{ flex: 1, paddingBottom: 4 }}>
            <Text style={{ fontSize: 24, lineHeight: 26, fontWeight: "900", letterSpacing: -.5, color: NIGHT.moon }}>{inMonth.length === 1 ? "night prayed" : "nights prayed"}{"\n"}{isThisMonth ? "this month" : `in ${month.toLocaleDateString("en-GB", { month: "long" })}`}</Text>
            <Text style={[s.sub, { fontSize: 14, marginTop: 6, fontWeight: "700" }]}>{answered ? `${answered} marked answered` : "Mark a prayer answered when it is"}</Text>
          </View>
        </View>
      </>}

      {/* the month, a moon on every night you prayed */}
      <View style={{ marginTop: 24, opacity: log.length ? 1 : .5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "900", color: NIGHT.moon, flex: 1 }}>{month.toLocaleDateString("en-GB", { month: "long", year: month.getFullYear() === today.getFullYear() ? undefined : "numeric" })}</Text>
          <Pressable onPress={() => shift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={[s.round, { width: 36, height: 36, marginRight: 6 }]}><SFSymbol name="chevron.left" size={13} color={NIGHT.moon} weight="bold"/></Pressable>
          <Pressable disabled={isThisMonth} onPress={() => shift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={[s.round, { width: 36, height: 36, opacity: isThisMonth ? .35 : 1 }]}><SFSymbol name="chevron.right" size={13} color={NIGHT.moon} weight="bold"/></Pressable>
        </View>
        <View style={s.week}>{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <Text key={i} style={s.wd}>{d}</Text>)}</View>
        <View style={s.grid}>{cells.map((d, i) => {
          if (d === null) return <View key={`e${i}`} style={s.cell}/>;
          const k = keyFor(d), entry = byNight.get(k), isTonight = k === tonight;
          return <View key={k} style={s.cell}>
            <Pressable disabled={!entry} onPress={() => { haptics.soft(); entry && setOpen(entry); }} accessibilityRole={entry ? "button" : undefined}
              accessibilityLabel={`${longDate(dateOf(k))}${entry ? `, prayed for ${andList(entry.topics)}${entry.answeredAt ? ", answered" : ""}` : ""}`}
              style={[s.day, !entry && isTonight && { borderWidth: 2, borderColor: NIGHT.candle }]}>
              {entry && <ReaderMaterialGradient colors={["#FFFBEA", "#F2E6C4", "#D9C79A"]} style={[StyleSheet.absoluteFill, { borderRadius: 19 }]}/>}
              <Text style={{ fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"], color: entry ? NIGHT.ink : isTonight ? NIGHT.candle : "#FBF2F680" }}>{d}</Text>
              {!!entry?.answeredAt && <View style={s.ansDot}/>}
            </Pressable>
          </View>;
        })}</View>
        {log.length > 0 && <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
          <View style={s.leg}><View style={[s.legDot, { backgroundColor: "#F2E6C4" }]}/><Text style={s.legText}>Prayed</Text></View>
          <View style={s.leg}><View style={[s.legDot, { backgroundColor: NIGHT.candle }]}/><Text style={s.legText}>Answered</Text></View>
        </View>}
      </View>

      {top.length > 0 && <>
        <Text accessibilityRole="header" style={s.h2}>Most prayed for</Text>
        <View style={{ gap: 10 }}>{top.map(([topic, n]) => <View key={topic} accessible accessibilityLabel={`${topic}, ${n} nights`} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ width: 92, fontSize: 15, fontWeight: "800", color: NIGHT.moon }}>{topic}</Text>
          <View style={s.track}><ReaderMaterialGradient horizontal colors={["#C79BD2", "#FBF2F6"]} style={{ height: 12, borderRadius: 6, width: `${Math.max(8, n / top[0][1] * 100)}%` }}/></View>
          <Text style={{ width: 26, textAlign: "right", fontSize: 15, fontWeight: "800", color: NIGHT.lav, fontVariant: ["tabular-nums"] }}>{n}</Text>
        </View>)}</View>
      </>}

      {inMonth.length > 0 && <>
        <Text accessibilityRole="header" style={s.h2}>Night by night</Text>
        {inMonth.map((e, i) => {
          const d = dateOf(e.night), isTonight = e.night === tonight;
          return <Pressable key={e.night} onPress={() => { haptics.soft(); setOpen(e); }} accessibilityRole="button" accessibilityLabel={`${longDate(d)}. Prayed for ${andList(e.topics) || "today"}`} style={[s.night, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#FBF2F624" }]}>
            <View style={{ width: 64, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: NIGHT.moon, fontVariant: ["tabular-nums"] }}>{d.getDate()}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 11, fontWeight: "800", letterSpacing: .4, textTransform: "uppercase", color: NIGHT.lav2, marginTop: 4 }}>{isTonight ? "Tonight" : d.toLocaleDateString("en-GB", { weekday: "short" })}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {e.topics.length ? e.topics.map((t, j) => <View key={t} style={[s.tag, !!e.answeredAt && j === 0 && { backgroundColor: NIGHT.candle }]}>
                  {!!e.answeredAt && j === 0 && <SFSymbol name="checkmark" size={11} color="#3A1A08" weight="bold"/>}
                  <Text style={{ fontSize: 14, fontWeight: "800", color: !!e.answeredAt && j === 0 ? "#3A1A08" : NIGHT.moon }}>{t}</Text>
                </View>) : <View style={s.tag}><Text style={{ fontSize: 14, fontWeight: "800", color: NIGHT.moon }}>Today, given back</Text></View>}
              </View>
              <Text style={{ fontSize: 14, lineHeight: 18, fontWeight: "600", color: NIGHT.lav, marginTop: 7 }}>{e.answeredAt ? `Answered on ${new Date(e.answeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : [andList(e.feelings.map(f => f.toLowerCase())).replace(/^./, c => c.toUpperCase()), timeOf(e.at)].filter(Boolean).join(" · ")}</Text>
            </View>
            <SFSymbol name="chevron.right" size={13} color={NIGHT.lav2}/>
          </Pressable>;
        })}
      </>}
    </ScrollView>

    <Modal visible={!!open} presentationStyle="pageSheet" animationType={reduced ? "fade" : "slide"} onRequestClose={() => setOpen(null)}>
      {openCurrent && <NightSheet entry={openCurrent} onClose={() => setOpen(null)}/>}
    </Modal>
  </View>;
}

function NightSheet({ entry, onClose }: { entry: NightPrayerEntry; onClose: () => void }) {
  const inset = useSafeAreaInsets();
  const lines = composeNightPrayer(entry.feelings, entry.topics);
  const what = entry.topics.length ? `You prayed for ${andList(entry.topics.map(t => t.toLowerCase()))}.` : "You gave the day back.";
  return <View style={{ flex: 1, backgroundColor: "#2A1835", paddingHorizontal: 22, paddingTop: 22, paddingBottom: Math.max(inset.bottom, 16) + 6 }}>
    <Text style={s.kicker}>{longDate(dateOf(entry.night))} · {timeOf(entry.at)}</Text>
    <Text accessibilityRole="header" style={{ fontSize: 30, lineHeight: 33, fontWeight: "900", letterSpacing: -.8, color: NIGHT.moon, marginTop: 8 }}>{what}</Text>
    {entry.feelings.length > 0 && <Text style={[s.sub, { fontSize: 14, fontWeight: "700", marginTop: 6 }]}>You felt {andList(entry.feelings.map(f => f.toLowerCase()))}</Text>}
    <ScrollView style={{ flex: 1, marginTop: 20 }} contentContainerStyle={{ gap: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {lines.map((l, i) => <Text key={i} style={{ fontSize: 18, lineHeight: 25, fontWeight: "800", color: l.yours ? "#FFE2A0" : NIGHT.moon }}>{l.text}</Text>)}
    </ScrollView>
    <View style={s.ansRow}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: NIGHT.moon }}>Answered</Text>
        <Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "600", color: NIGHT.lav, marginTop: 2 }}>{entry.answeredAt ? `Marked on ${longDate(new Date(entry.answeredAt))}` : "Turn on when you see it answered"}</Text>
      </View>
      <Switch value={!!entry.answeredAt} onValueChange={v => { haptics.soft(); setNightPrayerAnswered(entry.night, v); }} trackColor={{ true: NIGHT.candle }} accessibilityLabel="Answered"/>
    </View>
    <Pressable feedback="action" onPress={() => { haptics.soft(); onClose(); }} accessibilityRole="button" style={s.done}><Text style={{ fontSize: 17, fontWeight: "900", color: NIGHT.ink }}>Done</Text></Pressable>
  </View>;
}

function MoonFace({ size }: { size: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: `0 0 0 ${size * .15}px #FBF2F60D, 0 0 0 ${size * .35}px #FBF2F608` }}>
    <ReaderMaterialGradient colors={["#FFFBEA", "#F2E6C4", "#D9C79A"]} style={{ width: size, height: size, borderRadius: size / 2 }}/>
  </View>;
}

const s = StyleSheet.create({
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FBF2F61A", alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: NIGHT.lav },
  h1: { fontSize: 36, lineHeight: 38, fontWeight: "900", letterSpacing: -1, color: NIGHT.moon },
  sub: { marginTop: 10, fontSize: 16, lineHeight: 22, fontWeight: "600", color: NIGHT.lav },
  h2: { marginTop: 28, marginBottom: 12, marginLeft: 2, fontSize: 21, fontWeight: "900", letterSpacing: -.4, color: NIGHT.moon },
  week: { flexDirection: "row", marginBottom: 8 },
  wd: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "800", color: NIGHT.lav2 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  cell: { width: `${100 / 7}%`, alignItems: "center" },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  ansDot: { position: "absolute", right: -1, top: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: NIGHT.candle, borderWidth: 2, borderColor: NIGHT.deep },
  leg: { flexDirection: "row", alignItems: "center", gap: 6 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legText: { fontSize: 13, fontWeight: "700", color: NIGHT.lav },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: "#FBF2F614", overflow: "hidden" },
  night: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  tag: { height: 28, paddingHorizontal: 11, borderRadius: 14, backgroundColor: "#FBF2F61A", flexDirection: "row", alignItems: "center", gap: 5 },
  ansRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 22, borderCurve: "continuous", backgroundColor: "#FBF2F612", borderWidth: 1, borderColor: "#FBF2F61A" },
  done: { marginTop: 12, height: 56, borderRadius: 28, backgroundColor: NIGHT.moon, alignItems: "center", justifyContent: "center" },
});
