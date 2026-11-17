import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import Animated, { ZoomIn } from "react-native-reanimated";
import { BookCover } from "@/components/closer/BookCover";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { SFSymbol } from "@/components/Symbol";
import { K, nunito } from "@/components/closer/kit";
import { GroupsShelf } from "@/components/community/GroupsShelf";
import { Face, useMe } from "@/components/community/togetherKit";
import { LESSONS } from "@/lib/closer-page/content";
import { constellations } from "@/lib/closer-page/content/discovery";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { dayKey, streakOf, useCloserPage } from "@/state/closerPage";
import * as haptics from "@/lib/haptics";
import { date, fill, plural, useStrings } from "@/lib/i18n";

/**
 * You (CLOSER-PICKS.md, "You tab": B, like Speak): your face and name, three numbers, one card of doors (streak, your
 * days, saved verses, reflections, Bible moments), the stories you finished, your groups. Settings is the gear.
 */
export default function YouScreen() {
  const router = useRouter(), insets = useSafeAreaInsets(), me = useMe();
  const { finished, days, verses, notes } = useCloserPage();
  const { ids: moments } = useBibleMomentCollection();
  const [n, setN] = useState(0);
  const s = useStrings().native.you, you = useStrings().native.community.you; // useMe() falls back to this when no name was given
  const go = (to: string) => { haptics.soft(); router.push(to as Href); };

  const streak = streakOf(days);
  const firstDay = Object.keys(days).sort()[0];
  const since = firstDay ? date(new Date(Number(firstDay.slice(0, 4)), Number(firstDay.slice(5, 7)) - 1, 1), { month: "long", year: new Date().getFullYear() === Number(firstDay.slice(0, 4)) ? undefined : "numeric" }) : null;
  const week = (() => { const d = new Date(), out: boolean[] = []; for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push(!!days[dayKey(x)]?.length); } return out; })();
  const thisWeek = week.filter(Boolean).length;
  // My Discoveries: every experience finished, once, as a book (newest first). It Is Written is the welcome, not a book.
  const books = finished.filter(id => id !== "it-is-written").map(id => LESSONS[id]).filter(Boolean).reverse();
  const c = useStrings().collect;
  // arriving from "See it in My Discoveries" after collecting a book: scroll to the shelf and let that book hop
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const page = useRef<ScrollView>(null), shelfY = useRef(0);
  useEffect(() => { if (focus) { const t = setTimeout(() => page.current?.scrollTo({ y: Math.max(0, shelfY.current - 90), animated: true }), 350); return () => clearTimeout(t); } }, [focus]);
  const stars = constellations(finished).reduce((n, c) => n + c.stars.filter(s => s.finished).length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView ref={page} contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "flex-end" }}>
          <Pressable accessibilityRole="button" accessibilityLabel={s.settings} onPress={() => go("/closer-settings")} hitSlop={8} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <SFSymbol name="gearshape" size={23} weight="semibold" color={K.inkFaint} />
          </Pressable>
        </View>

        {/* who you are */}
        <View style={{ alignItems: "center", marginTop: -6 }}>
          <View style={{ borderRadius: 48, borderWidth: 4, borderColor: "#FFFFFF", shadowColor: "#EADFCC", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }}>
            <Face person={me} size={84} />
          </View>
          <Text accessibilityRole="header" style={nunito(900, 28, { color: K.ink, letterSpacing: -0.6, lineHeight: 36, marginTop: 10 })}>{me.name && me.name !== you ? me.name : s.hiFriend}</Text>
          <Text style={nunito(700, 14, { color: K.inkFaint })}>{since ? fill(s.since, { since }) : s.welcome}</Text>
        </View>

        {/* three numbers */}
        <View style={{ flexDirection: "row", marginTop: 22 }}>
          <Stat bg="#FFE7C2" icon={<Flame />} n={streak} label={plural(streak, s.statStreak)} />
          <Stat bg={K.forest} icon={<SFSymbol name="checkmark" size={19} weight="heavy" color="#FFFFFF" />} n={finished.length} label={plural(finished.length, s.statDone)} />
          <Stat bg="#B85A9C" icon={<SFSymbol name="rectangle.on.rectangle" size={17} weight="bold" color="#FFFFFF" />} n={moments.length} label={plural(moments.length, s.statMoments)} />
        </View>

        {/* one card of doors */}
        <View style={{ marginTop: 24, borderRadius: 22, backgroundColor: "#FFFFFF", shadowColor: "#17251F", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
          <Door first bg="#F07B12" icon={<Flame white />} title={s.streak} sub={streak ? `${plural(streak, s.streakDays)} ${plural(thisWeek, s.streakWeek)}` : s.streakNone} onPress={() => go("/streak")} />
          <Door bg={K.forest} icon={<SFSymbol name="calendar" size={18} weight="bold" color="#FFFFFF" />} title={s.days} sub={s.daysSub} onPress={() => go("/kept/days")} />
          <Door bg="#682C42" icon={<SFSymbol name="quote.opening" size={16} weight="bold" color="#FFFFFF" />} title={s.verses} sub={verses.length ? plural(verses.length, s.versesSub) : s.versesNone} onPress={() => go("/kept/verses")} />
          <Door bg={K.inkSoft} icon={<SFSymbol name="lock.fill" size={16} color="#FFFFFF" />} title={s.reflections} sub={notes.length ? fill(s.reflectionsSub, { n: notes.length }) : s.reflectionsNone} onPress={() => go("/kept/reflections")} />
          <Door bg="#B85A9C" icon={<SFSymbol name="rectangle.on.rectangle" size={16} weight="bold" color="#FFFFFF" />} title={s.moments} sub={fill(s.momentsSub, { n: moments.length, of: 78 })} onPress={() => go("/rhythm?section=moments")} />
          <Door bg="#0E1729" icon={<SFSymbol name="sparkles" size={17} weight="bold" color="#FFFFFF" />} title={s.connections} sub={stars ? plural(stars, s.connectionsSub) : s.connectionsNone} onPress={() => go("/discoveries")} />
        </View>

        {/* My Discoveries: the books on your shelf; tap one to read it again */}
        {books.length > 0 && <View onLayout={e => { shelfY.current = e.nativeEvent.layout.y; }}>
          <Head title={c.shelf.title} action={plural(books.length, c.books)} onPress={() => go("/kept/finished")} />
          <View style={{ marginTop: 12, borderRadius: 24, backgroundColor: K.creamDeep, paddingTop: 18, overflow: "hidden" }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14, alignItems: "flex-end", paddingTop: 4 }}>
              {books.slice(0, 12).map(l => {
                const book = <BookCover lesson={l} w={92} />;
                return (
                  <Pressable key={l.id} accessibilityRole="button" accessibilityLabel={fill(c.shelf.open, { title: l.title })} onPress={() => go(`/lesson/${l.id}`)} style={({ pressed }) => ({ paddingRight: 6, transform: [{ translateY: pressed ? 3 : 0 }] })}>
                    {focus === l.id ? <Animated.View key={focus} entering={ZoomIn.delay(450).springify().damping(9)}>{book}</Animated.View> : book}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ marginHorizontal: 12, height: 12, borderRadius: 6, backgroundColor: "#8A6A4E", shadowColor: "#5E4734", shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 } }} />
            <Text style={nunito(700, 13, { color: K.inkFaint, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 })}>{c.shelf.hint}</Text>
          </View>
        </View>}

        <GroupsShelf />

        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Page size={70} mood={n % 2 ? "happy" : "neutral"} act={n ? "spin" : "idle"} actKey={n} onTap={() => setN(n + 1)} />
          <Text style={nunito(700, 14.5, { color: K.inkSoft, fontStyle: "italic", textAlign: "center", marginTop: 10, maxWidth: 240 })}>{s.footer}</Text>
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
