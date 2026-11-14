import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { SFSymbol } from "@/components/Symbol";
import { K, nunito } from "@/components/closer/kit";
import { GroupsShelf } from "@/components/community/GroupsShelf";
import { Face, useMe } from "@/components/community/togetherKit";
import { LESSONS } from "@/lib/closer-page/content";
import { TONE, library } from "@/lib/closer-page/content/library";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { dayKey, streakOf, useCloserPage } from "@/state/closerPage";
import * as haptics from "@/lib/haptics";

/**
 * You (CLOSER-PICKS.md, "You tab": B, like Speak): your face and name, three numbers, one card of doors (streak, your
 * days, saved verses, reflections, Bible moments), the stories you finished, your groups. Settings is the gear.
 */
export default function YouScreen() {
  const router = useRouter(), insets = useSafeAreaInsets(), me = useMe();
  const { finished, days, verses, notes } = useCloserPage();
  const { ids: moments } = useBibleMomentCollection();
  const [n, setN] = useState(0);
  const go = (to: string) => { haptics.soft(); router.push(to as Href); };

  const streak = streakOf(days);
  const firstDay = Object.keys(days).sort()[0];
  const since = firstDay ? new Date(Number(firstDay.slice(0, 4)), Number(firstDay.slice(5, 7)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: new Date().getFullYear() === Number(firstDay.slice(0, 4)) ? undefined : "numeric" }) : null;
  const week = (() => { const d = new Date(), out: boolean[] = []; for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push(!!days[dayKey(x)]?.length); } return out; })();
  const thisWeek = week.filter(Boolean).length;
  const done = finished.map(id => LESSONS[id]).filter(Boolean).reverse();
  const toneOf = (id: string) => { for (const s of library) { const e = s.entries.find(x => x.lessonId === id); if (e) return { ...TONE[e.tone], label: s.label }; } return { ...TONE.forest, label: "" }; };

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "flex-end" }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => go("/closer-settings")} hitSlop={8} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <SFSymbol name="gearshape" size={23} weight="semibold" color={K.inkFaint} />
          </Pressable>
        </View>

        {/* who you are */}
        <View style={{ alignItems: "center", marginTop: -6 }}>
          <View style={{ borderRadius: 48, borderWidth: 4, borderColor: "#FFFFFF", shadowColor: "#EADFCC", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }}>
            <Face person={me} size={84} />
          </View>
          <Text accessibilityRole="header" style={nunito(900, 28, { color: K.ink, letterSpacing: -0.6, lineHeight: 36, marginTop: 10 })}>{me.name && me.name !== "You" ? me.name : "Hi, friend"}</Text>
          <Text style={nunito(700, 14, { color: K.inkFaint })}>{since ? `With Closer since ${since}` : "Welcome to Closer"}</Text>
        </View>

        {/* three numbers */}
        <View style={{ flexDirection: "row", marginTop: 22 }}>
          <Stat bg="#FFE7C2" icon={<Flame />} n={streak} label={streak === 1 ? "DAY STREAK" : "DAY STREAK"} />
          <Stat bg={K.forest} icon={<SFSymbol name="checkmark" size={19} weight="heavy" color="#FFFFFF" />} n={finished.length} label="STORIES DONE" />
          <Stat bg="#B85A9C" icon={<SFSymbol name="rectangle.on.rectangle" size={17} weight="bold" color="#FFFFFF" />} n={moments.length} label="MOMENTS" />
        </View>

        {/* one card of doors */}
        <View style={{ marginTop: 24, borderRadius: 22, backgroundColor: "#FFFFFF", shadowColor: "#17251F", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
          <Door first bg="#F07B12" icon={<Flame white />} title="Streak" sub={streak ? `${streak} ${streak === 1 ? "day" : "days"}. You came ${thisWeek} ${thisWeek === 1 ? "time" : "times"} this week` : "Finish today’s story to start one"} onPress={() => go("/streak")} />
          <Door bg={K.forest} icon={<SFSymbol name="calendar" size={18} weight="bold" color="#FFFFFF" />} title="Your days" sub="Every story you finished" onPress={() => go("/kept/days")} />
          <Door bg="#682C42" icon={<SFSymbol name="quote.opening" size={16} weight="bold" color="#FFFFFF" />} title="Saved verses" sub={verses.length ? `${verses.length} to come back to` : "Save one from any story"} onPress={() => go("/kept/verses")} />
          <Door bg={K.inkSoft} icon={<SFSymbol name="lock.fill" size={16} color="#FFFFFF" />} title="Reflections" sub={notes.length ? `${notes.length} · only on this phone` : "Only on this phone"} onPress={() => go("/kept/reflections")} />
          <Door bg="#B85A9C" icon={<SFSymbol name="rectangle.on.rectangle" size={16} weight="bold" color="#FFFFFF" />} title="Bible moments" sub={`${moments.length} of 78 found`} onPress={() => go("/rhythm?section=moments")} />
        </View>

        {/* finished */}
        {done.length > 0 && <>
          <Head title="Finished" action="View all" onPress={() => go("/kept/finished")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 10 }}>
            {done.slice(0, 8).map(l => {
              const t = toneOf(l.id);
              return (
                <Pressable key={l.id} accessibilityRole="button" accessibilityLabel={l.title} onPress={() => go(`/lesson/${l.id}`)} style={{ width: 104 }}>
                  <View style={{ height: 134, borderRadius: 16, backgroundColor: t.bg, padding: 10, justifyContent: "flex-end" }}>
                    <Text numberOfLines={4} style={nunito(900, 14, { color: t.fg, lineHeight: 17 })}>{l.title}</Text>
                  </View>
                  <Text numberOfLines={1} style={nunito(800, 12, { color: K.inkFaint, marginTop: 6 })}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>}

        <GroupsShelf />

        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Page size={70} mood={n % 2 ? "happy" : "neutral"} act={n ? "spin" : "idle"} actKey={n} onTap={() => setN(n + 1)} />
          <Text style={nunito(700, 14.5, { color: K.inkSoft, fontStyle: "italic", textAlign: "center", marginTop: 10, maxWidth: 240 })}>The Lord is always closer than you think.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Flame({ white = false }: { white?: boolean }) {
  return <Svg width={18} height={21} viewBox="0 0 14 16"><Path d="M7 0C8 4 13 5.5 13 10a6 6 0 0 1-12 0c0-2.5 1.5-4 3-5 .3 1.6 1 2.6 2 3C6 5 5.6 2.5 7 0z" fill={white ? "#FFFFFF" : "#F07B12"} /><Path d="M7 8c.6 2 3 2.6 3 4.6a3 3 0 0 1-6 0c0-1.3.8-2 1.6-2.6.2.9.6 1.3 1.1 1.5C6.5 10 6.4 9 7 8z" fill="#FFC72C" /></Svg>;
}

function Stat({ bg, icon, n, label }: { bg: string; icon: ReactNode; n: number; label: string }) {
  return (
    <View accessible accessibilityLabel={`${n} ${label.toLowerCase()}`} style={{ flex: 1, alignItems: "center" }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>{icon}</View>
      <Text style={nunito(900, 21, { color: K.ink, lineHeight: 27, marginTop: 6 })}>{n}</Text>
      <Text style={nunito(900, 10.5, { color: K.inkFaint, letterSpacing: 0.9 })}>{label}</Text>
    </View>
  );
}

function Door({ bg, icon, title, sub, onPress, first }: { bg: string; icon: ReactNode; title: string; sub: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: first ? 0 : 1, borderTopColor: "#F1E8DA" }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={nunito(900, 16, { color: K.ink })}>{title}</Text>
        <Text numberOfLines={1} style={nunito(700, 13, { color: K.inkFaint })}>{sub}</Text>
      </View>
      <SFSymbol name="chevron.right" size={13} weight="bold" color="#B9B1A4" />
      </View>
    </Pressable>
  );
}

function Head({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 28 }}>
      <Text accessibilityRole="header" style={nunito(900, 21, { color: K.ink, letterSpacing: -0.4 })}>{title}</Text>
      {!!action && <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}><Text style={nunito(900, 14, { color: K.red })}>{action}</Text></Pressable>}
    </View>
  );
}
