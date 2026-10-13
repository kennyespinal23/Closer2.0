import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/CloserText";
import { BibleMomentsCollection } from "@/components/BibleMomentsCollection";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useProgress } from "@/state/progress";
import { buildCurrentWeek, toLocalISO } from "@/lib/rhythm";
import { contentLayout, contentText } from "@/lib/contentStyles";
import { uiText } from "@/lib/typography";
import Animated, { FadeIn } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { buttonStyles } from "@/lib/buttonStyles";
import { paperActionColors } from "@/lib/paperControls";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";

/** A single summary, with collection detail revealed only when requested. */
export function JourneyCollection({ focusMoments = false, onContinue, preview = false }: { focusMoments?: boolean; onContinue: () => void; preview?: boolean }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const progress = useProgress();
  const streak = preview ? { current: 7 } : progress.streak;
  const engagedDates = preview ? Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - index); return toLocalISO(day); }) : progress.engagedDates;
  const reduced = useReducedMotion();
  const action = paperActionColors(scheme === "dark");
  const [count, setCount] = useState(streak.current);
  useEffect(() => {
    if (reduced || focusMoments) { setCount(streak.current); return; }
    let frame = 0;
    const start = Date.now();
    setCount(0);
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / 800);
      setCount(Math.round(streak.current * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [streak.current, reduced, focusMoments]);
  const completedTrack = scheme === "dark" ? "#563C2A" : "#F4D8BC";
  const week = buildCurrentWeek(engagedDates);
  const header = <View style={{ flexGrow: 1, gap: 32 }}>
    <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 24, paddingBottom: 24 }}>
      <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
        <View pointerEvents="none" style={{ position: "absolute", width: 152, height: 152, borderRadius: 76, backgroundColor: scheme === "dark" ? "#E9884F12" : "#E9884F16", boxShadow: "0 0 48px 12px #E9884F18" }} />
        <StreakFireAnimation size={160} />
      </View>
      <Text accessibilityLabel={`${streak.current} day streak`} style={{ ...uiText.displayNumber, color: scheme === "dark" ? "#E9884F" : "#AD491D", textAlign: "center", marginTop: 16 }}>{count}</Text>
      <Text style={{ ...uiText.sectionTitle, color: scheme === "dark" ? "#E9884F" : "#AD491D" }}>{streak.current === 1 ? "day streak" : "days streak"}</Text>

    </View>
    <View style={{ ...contentLayout.card, backgroundColor: colors.surfaceSecondary, gap: 16 }}>
      <View style={{ gap: 12 }}>
        {[week.cells].map((row, index) => <View key={index} style={{ flexDirection: "row" }}>{row.map((cell, dayIndex) => <Animated.View entering={reduced ? undefined : FadeIn.delay(350 + dayIndex * 70).duration(220)} key={cell.dateISO} accessible accessibilityLabel={`${cell.dateISO}${cell.state === "engaged" ? ", devotional completed" : ""}${cell.isToday ? ", today" : ""}`} style={{ flex: 1, alignItems: "center", gap: 8 }}>
          {index === 0 && <Text style={{ ...contentText.metadata, color: colors.inkMuted }}>{new Date(`${cell.dateISO}T12:00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}</Text>}
          <View style={{ width: "100%", height: 36, alignItems: "center", justifyContent: "center" }}>
            {cell.state === "engaged" && <View style={{ position: "absolute", height: 36, left: row[row.indexOf(cell) - 1]?.state === "engaged" ? 0 : "50%", right: row[row.indexOf(cell) + 1]?.state === "engaged" ? 0 : "50%", backgroundColor: completedTrack }} />}
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: cell.state === "engaged" ? cell.isToday ? "#E9884F" : completedTrack : cell.state === "future" ? colors.border : "transparent", borderWidth: cell.isToday && cell.state !== "engaged" ? 1.5 : 0, borderColor: colors.inkMuted }}>
              {cell.state === "engaged" ? <SFSymbol name="checkmark" size={16} color={cell.isToday ? "#30241D" : scheme === "dark" ? "#F7CFB4" : "#713615"} weight="bold" /> : cell.state !== "outOfMonth" && <Text style={{ ...contentText.metadata, color: cell.state === "future" ? colors.inkSubtle : colors.ink }}>{Number(cell.dateISO.slice(-2))}</Text>}
            </View>
          </View>
        </Animated.View>)}</View>)}
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}><Text style={{ ...uiText.supporting, color: colors.inkMuted, textAlign: "center" }}>{week.cells.some(cell => cell.isToday && cell.state === "engaged") ? "Today is complete. See you tomorrow." : "Complete today’s four activities to grow your streak."}</Text></View>
    </View>
  </View>;
  if (focusMoments) return <BibleMomentsCollection standalone initialCategory="all" />;
  return <View style={{ flex: 1 }}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: contentLayout.gutter, paddingTop: contentLayout.screenTop, paddingBottom: contentLayout.sectionGap }}>{header}</ScrollView>
    <View style={{ paddingHorizontal: contentLayout.gutter, paddingTop: 12, paddingBottom: 16 }}><Pressable feedback="action" accessibilityRole="button" onPress={onContinue} style={[buttonStyles.primary, { backgroundColor: action.backgroundColor }]}><Text style={[buttonStyles.label, { color: action.color }]}>{preview ? "Replay animation" : "Continue"}</Text></Pressable></View>
  </View>;
}
