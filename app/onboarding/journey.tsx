import { useEffect, useRef, useState } from "react";
import { BackHandler, Linking, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { OnboardingChoice } from "@/components/OnboardingChoice";
import { SFSymbol } from "@/components/Symbol";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { MomentCollectibleFront } from "@/components/MomentCollectible";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { useOnboarding } from "@/state/onboarding";
import { useSubscription } from "@/state/subscription";
import { useReadingGoal } from "@/state/readingGoal";
import { unlockBibleMoment, useBibleMomentCollection } from "@/state/bibleMoments";
import { useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { requestNotificationPermission, scheduleDailyReminder } from "@/lib/notifications";
import { skipLaunchSplashForSession } from "@/lib/launchSplashSession";
import { paperActionColors } from "@/lib/paperControls";
import * as haptics from "@/lib/haptics";

const REASONS = ["I want to read, but don’t know where to start.", "I’m finding my way back to God.", "I want a little quiet in my day.", "Honestly, I’m just curious."];
const INTENTIONS = ["Peace", "Hope", "Courage", "Rest", "Forgiveness", "Joy"];
const PAPER = ["#EDD8B7", "#DDDFC3", "#EAC8BC", "#D4DDE0", "#E1D3E2", "#E8DCA8"];
const MOMENT = BIBLE_MOMENTS.find(m => m.id === "creation")!;
const TIMES = [{ label: "Morning", time: "7:30 AM", hour: 7, minute: 30 }, { label: "Midday", time: "12:00 PM", hour: 12, minute: 0 }, { label: "Evening", time: "6:00 PM", hour: 18, minute: 0 }, { label: "Night", time: "9:00 PM", hour: 21, minute: 0 }];
const ORDER = [0, 1, 2, 8, 9, 10, 11, 12, 13, 3, 4, 5, 6, 7, 14, 15];
const QUESTIONS = [
  { step: 8, key: "faithNow", options: ["Close to him", "Drifting", "Coming back", "Not sure", "Just curious"] },
  { step: 9, key: "faithDuration", options: ["A few weeks", "A few months", "About a year", "Longer than that", "It’s always felt this way"] },
  { step: 10, key: "churchBackground", options: ["Every Sunday", "Now and then", "Not really", "Never"] },
  { step: 11, key: "bibleFrequency", options: ["Most days", "Once in a while", "Rarely", "I’ve never really read it"] },
] as const;
const REPLIES: Record<string, string> = { "Close to him": "Good. Let’s keep making room for that.", Drifting: "That’s okay. Drifting is how many coming-back stories start.", "Coming back": "Welcome home. Nobody here is keeping score.", "Not sure": "Not sure is an honest answer. There’s room for your questions.", "Just curious": "Curious is a good place to start. Look around." };
const OBSTACLES = ["Too busy", "Don’t know where to start", "The Bible feels confusing", "Guilt about coming back", "Church felt judgmental", "I have doubts"];
const HEADINGS = ["Something was left for you.", "What brings you here?", "What should we call you?", "What do you need a little more of?", "A little time. A little closer.", "Every story starts somewhere.", "Your first steps, made simple.", "A quiet moment, just for you.", "Where are you with God right now?", "How long has it felt this way?", "Did you grow up going to church?", "How often do you read the Bible right now?", "There’s a place for you here.", "What’s made it hard to stay close?", "Want a quiet nudge?", "Make room for more with Closer Plus."];
const DETAILS = ["A small invitation to begin again.", "Choose anything that sounds like you.", "A first name is enough. You can skip this.", "Choose a few intentions to carry with you.", "Choose a daily reading goal. You can change it any time.", "Read your first Bible Moment, then keep its card.", "No catching up. No perfect record. Just a place to begin.", "Choose when you’d like a daily reminder.", "An honest answer is a good place to begin.", "However long it’s been, you’re welcome here.", "No background needed. We’ll meet you where you are.", "There’s no right answer, just your starting point.", "A little encouragement for the season you’re in.", "Choose anything that applies. You can skip this.", "One gentle reminder when it’s time for your reading.", "An optional subscription to support your daily practice."];

/** New onboarding lives after the original video welcome, which owns its own route. */
export default function Journey() {
  const router = useRouter(), reduced = useReducedMotion(), dark = useResolvedScheme() === "dark";
  const { answers, setAnswer } = useOnboarding();
  const { goalMinutes, setGoalMinutes } = useReadingGoal();
  const collection = useBibleMomentCollection();
  const subscription = useSubscription();
  const [page, setPage] = useState(0), [opened, setOpened] = useState(false);
  const step = ORDER[page];
  const question = QUESTIONS.find(q => q.step === step);
  const season = answers.faithNow === "Close to him" ? { title: "A growing season", body: "Paul kept reaching toward God even after years of faith. There is always more to discover.", reference: "Philippians 3:14" } : answers.faithNow === "Coming back" ? { title: "A coming-home season", body: "In Jesus’ story of the lost son, the father sees him from far away and runs to welcome him. You can begin again, too.", reference: "Luke 15:20" } : ["Not sure", "Just curious"].includes(answers.faithNow ?? "") ? { title: "A searching season", body: "Nicodemus came to Jesus with questions. Jesus made time for him. Your questions belong here, too.", reference: "John 3:1–16" } : { title: "A quiet season", body: "When Elijah felt worn out, God met him in a still, small voice. A quiet beginning can be enough.", reference: "1 Kings 19:12" };
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false);
  const [time, setTime] = useState(() => Math.max(0, TIMES.findIndex(t => t.hour === answers.dailyReminderTime?.hour)));
  const ink = dark ? "#F6F0E6" : "#30251E", muted = dark ? "#C2B5A7" : "#75675B";
  const actionColors = paperActionColors(dark);
  const surface = dark ? "#362B24" : "#FFF9EE";
  const collected = collection.ids.includes(MOMENT.id);
  const reasons = answers.welcomeReasons ?? [], intentions = answers.growthAreas ?? [];
  const back = () => { if (busy) return; Keyboard.dismiss(); setError(""); if (page > 0) setPage(s => s - 1); else router.back(); };
  useEffect(() => { const sub = BackHandler.addEventListener("hardwareBackPress", () => { back(); return true; }); return () => sub.remove(); }, [page, busy]);
  const next = () => { Keyboard.dismiss(); haptics.soft(); setError(""); setPage(s => Math.min(ORDER.length - 1, s + 1)); };
  const finish = () => {
    skipLaunchSplashForSession();
    setAnswer("completed", true);
    router.dismissAll();
    router.replace("/today");
  };
  const submit = async () => {
    if (lock.current) return;
    if (step === 0 && !opened) { setOpened(true); haptics.soft(); return; }
    if (step === 5 && !collected) {
      lock.current = true; setBusy(true); setError("");
      try { await unlockBibleMoment(MOMENT.id); haptics.success(); }
      catch { setError("Your card couldn’t be saved. Please try again."); }
      finally { lock.current = false; setBusy(false); }
      return;
    }
    if (step === 15) {
      if (subscription.isPro) { finish(); return; }
      if (!subscription.configured || !subscription.monthlyPackage) { setError("Subscriptions aren’t available right now. You can continue for free below."); return; }
      lock.current = true; setBusy(true); setError("");
      try { if (await subscription.purchaseMonthly()) finish(); }
      catch { setError("Your purchase couldn’t be completed. Please try again."); }
      finally { lock.current = false; setBusy(false); }
      return;
    }
    if (step === 7) {
      const chosen = TIMES[time];
      setAnswer("dailyReminderTime", { hour: chosen.hour, minute: chosen.minute });
      next(); return;
    }
    if (step === 14) {
      lock.current = true; setBusy(true); setError("");
      try {
        const permission = await requestNotificationPermission();
        if (permission !== "granted") { setError("Reminders aren’t enabled. You can continue below and turn them on in Settings later."); return; }
        const chosen = TIMES[time];
        await scheduleDailyReminder({ hour: chosen.hour, minute: chosen.minute });
        setAnswer("dailyReminderTime", { hour: chosen.hour, minute: chosen.minute });
        setAnswer("notificationsEnabled", true); next();
      } catch { setError("We couldn’t set your reminder. Try again, or continue without one."); }
      finally { lock.current = false; setBusy(false); }
      return;
    }
    next();
  };
  const toggle = (key: "welcomeReasons" | "growthAreas" | "faithObstacles", value: string, list: string[]) => { haptics.tick(); setAnswer(key, list.includes(value) ? list.filter(v => v !== value) : [...list, value]); };
  const purchaseUnavailable = step === 15 && !subscription.isPro && (!subscription.configured || !subscription.monthlyPackage);
  const label = busy ? "Saving…" : step === 0 ? opened ? "Let’s begin" : "Open my letter" : step === 5 ? collected ? "Continue" : "Collect this Moment" : step === 14 ? "Enable reminders" : step === 15 ? subscription.isPro ? "Continue" : purchaseUnavailable ? "Subscriptions coming soon" : "Subscribe" : "Continue";
  return <ReaderMaterialGradient colors={dark ? ["#372820", "#1D1916", "#171513"] : ["#F2DECB", "#F8EFE2", "#F9F4EA"]} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={busy} onPress={back} style={s.icon}><SFSymbol name="chevron.left" size={20} color={ink} /></Pressable>
        <View style={s.progress} accessibilityLabel={`Step ${page + 1} of ${ORDER.length}`} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: ORDER.length, now: page + 1 }}>{ORDER.map((_, i) => <View key={i} style={[s.segment, { backgroundColor: i <= page ? ink : dark ? "#FFFFFF20" : "#30251E20" }]} />)}</View>
        <View style={s.icon} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView key={step} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(reduced ? 0 : 220)} style={{ gap: 28 }}>
            {step === 0 && <Envelope opened={opened} />}
            <View style={{ gap: 12 }}><Text accessibilityRole="header" style={[s.title, { color: ink }]}>{step === 9 && answers.faithNow === "Close to him" ? "How long have you felt close to God?" : HEADINGS[step]}</Text><Text style={[s.body, { color: muted }]}>{DETAILS[step]}</Text></View>
            {question && <View style={{ gap: 12 }}>{question.options.map(option => <OnboardingChoice key={option} label={option} selected={answers[question.key] === option} onPress={() => { setAnswer(question.key, option); haptics.tick(); }} />)}{step === 8 && <View style={{ minHeight: 80, paddingTop: 8 }}>{answers.faithNow && <Animated.Text key={answers.faithNow} entering={FadeIn.duration(reduced ? 0 : 180)} accessibilityLiveRegion="polite" style={[s.body, { color: muted }]}>{REPLIES[answers.faithNow]}</Animated.Text>}</View>}</View>}
            {step === 12 && <View style={[s.plan, { backgroundColor: surface, alignItems: "center", paddingVertical: 36 }]}><SFSymbol name="leaf" size={48} color={ink} /><Text style={[s.planTitle, { color: ink }]}>{season.title}</Text><Text style={[s.body, { color: muted }]}>{season.body}</Text><Text style={{ color: muted, fontSize: 15 }}>{season.reference}</Text></View>}
            {step === 13 && <View style={{ gap: 12 }}>{OBSTACLES.map(item => { const selected = (answers.faithObstacles ?? []).includes(item); return <OnboardingChoice key={item} label={item} multiple selected={selected} onPress={() => toggle("faithObstacles", item, answers.faithObstacles ?? [])} />; })}</View>}
            {step === 14 && <View style={{ gap: 24 }}><Text style={[s.title, { color: ink, fontSize: 48, lineHeight: 60 }]}>{TIMES[time].time}</Text><View style={[s.plan, { backgroundColor: surface }]}><View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><SFSymbol name="bell.badge.fill" color={ink} size={24} /><Text style={{ color: ink, fontSize: 17, fontWeight: "600" }}>Closer</Text></View><Text style={{ color: ink, fontSize: 20, fontWeight: "600" }}>Your word for today is ready.</Text><Text style={{ color: muted, fontSize: 17, lineHeight: 24 }}>A few quiet minutes with God, at your own pace.</Text></View><Text style={[s.body, { color: muted }]}>Notification preview · You can change this in Settings.</Text></View>}
            {step === 15 && <View style={{ gap: 24 }}><View style={{ alignItems: "center", padding: 24 }}><SFSymbol name="heart.fill" color={ink} size={64} /></View><View style={[s.plan, { backgroundColor: surface }]}><Text style={[s.planTitle, { color: ink }]}>Closer Plus</Text><Text style={[s.body, { color: muted, textAlign: "left" }]}>Make Closer part of your daily rhythm. Your saved Moments and reading progress stay with you.</Text><Text style={{ color: ink, fontSize: 24, fontWeight: "600" }}>{subscription.monthlyPackage ? `${subscription.monthlyPackage.product.priceString} / month` : "Subscription options coming soon"}</Text>{subscription.monthlyPackage && <Text style={{ color: muted, fontSize: 15, lineHeight: 22 }}>Renews monthly until canceled. Manage or cancel in App Store settings.</Text>}</View><Pressable disabled={busy} accessibilityRole="button" onPress={async () => { if (lock.current) return; lock.current = true; setBusy(true); setError(""); try { if (!subscription.configured) setError("Purchases aren’t available right now."); else if (await subscription.restore()) finish(); else setError("No active subscription was found."); } catch { setError("Couldn’t restore purchases. Please try again."); } finally { lock.current = false; setBusy(false); } }} style={s.secondary}><Text style={{ color: ink, fontSize: 16 }}>Restore purchases</Text></Pressable><View style={{ flexDirection: "row", justifyContent: "center", gap: 24 }}>{["Terms", "Privacy"].map(item => <Pressable key={item} accessibilityRole="link" onPress={() => Linking.openURL(`https://closer.app/${item.toLowerCase()}`)} style={s.secondary}><Text style={{ color: muted, fontSize: 15 }}>{item}</Text></Pressable>)}</View></View>}
            {step === 1 && <View style={{ gap: 16 }}>{REASONS.map((reason, i) => <OnboardingChoice key={reason} label={reason} detail={reasons.includes(reason) ? "That’s me" : "Tap to choose"} multiple selected={reasons.includes(reason)} paper={PAPER[i]} rotation={i % 2 ? 1 : -1} onPress={() => toggle("welcomeReasons", reason, reasons)} />)}</View>}
            {step === 2 && <View style={[s.nameTag, { backgroundColor: surface }]}><View style={s.tagHeader}><Text style={{ color: "#FFF", fontSize: 20, fontWeight: "700" }}>Hello, my name is</Text></View><TextInput accessibilityLabel="First name" defaultValue={answers.name} onChangeText={name => setAnswer("name", name)} placeholder="Your name" placeholderTextColor={muted} maxLength={40} autoCapitalize="words" autoComplete="given-name" returnKeyType="done" onSubmitEditing={next} style={[s.input, { color: ink }]} /></View>}
            {step === 3 && <><View style={[s.jar, { borderColor: dark ? "#CDBAA177" : "#98877688", backgroundColor: dark ? "#FFFFFF08" : "#FFFFFF40" }]}><View style={[s.jarLid, { backgroundColor: dark ? "#8B7864" : "#C5B197" }]} />{intentions.length === 0 && <Text style={[s.body, { color: muted }]}>A little room for hope.</Text>}<View style={s.slips}>{intentions.map((item, i) => <Animated.View entering={reduced ? FadeIn.duration(0) : FadeInDown.springify().damping(20).stiffness(180)} key={item} style={[s.slip, { backgroundColor: PAPER[i % PAPER.length], transform: [{ rotate: `${i % 2 ? 7 : -6}deg` }] }]}><Text style={s.noteText}>{item}</Text></Animated.View>)}</View></View><View style={s.chips}>{INTENTIONS.map(item => <OnboardingChoice key={item} label={item} multiple compact selected={intentions.includes(item)} onPress={() => toggle("growthAreas", item, intentions)} />)}</View></>}
            {step === 4 && <View style={s.candles}>{[3, 5, 10].map((minutes, i) => <Candle key={minutes} minutes={minutes} height={88 + i * 40} selected={goalMinutes === minutes} color={ink} onPress={() => { setGoalMinutes(minutes); haptics.tick(); }} />)}</View>}
            {step === 5 && <><FirstMoment collected={collected} /><Text style={[s.body, { color: ink }]}>“{MOMENT.happened}”</Text><Text style={[s.body, { color: muted }]}>{MOMENT.importance}</Text>{collected && <Text accessibilityLiveRegion="polite" style={[s.body, { color: "#248A3D", fontWeight: "600" }]}>✓ Saved in your Bible Moments</Text>}</>}
            {step === 6 && <View style={[s.plan, { backgroundColor: surface }]}><Text style={[s.planTitle, { color: ink }]}>{answers.name.trim() ? `${answers.name.trim().split(" ")[0]}’s` : "Your"} quiet beginning</Text><Text style={{ color: muted, fontSize: 17 }}>{goalMinutes} minutes a day{intentions[0] ? ` · A little more ${intentions[0].toLowerCase()}` : ""}</Text>{["Today: open your first devotional", reasons.includes(REASONS[0]) ? "Next: begin with Genesis 1" : "Next: explore a book at your own pace", "Keep a verse that speaks to you"].map((line, i) => <View key={line} style={s.planRow}><Text style={[s.number, { color: ink }]}>{i + 1}</Text><Text style={{ color: ink, fontSize: 17, flex: 1, lineHeight: 24 }}>{line}</Text></View>)}</View>}
            {step === 7 && <><Sky time={time} /><View style={s.chips}>{TIMES.map((t, i) => <OnboardingChoice key={t.label} label={t.label} detail={t.time} selected={time === i} onPress={() => { setTime(i); haptics.tick(); }} style={{ width: "46%" }} />)}</View></>}
          </Animated.View>
        </ScrollView>
        <View style={s.footer}>{!!error && <Text accessibilityLiveRegion="polite" style={[s.body, { color: ink, fontSize: 15 }]}>{error}</Text>}<Pressable accessibilityRole="button" disabled={busy || purchaseUnavailable} onPress={submit} style={[s.cta, { backgroundColor: actionColors.backgroundColor, borderColor: actionColors.borderColor, borderWidth: 1, opacity: busy || purchaseUnavailable ? .55 : 1 }]}><Text style={[s.ctaText, { color: actionColors.color }]}>{label}</Text></Pressable>{(step === 2 || (step >= 8 && step <= 11) || step === 13 || step === 14 || step === 15) && <Pressable disabled={busy} accessibilityRole="button" onPress={step === 15 ? finish : next} style={s.secondary}><Text style={{ color: muted, fontSize: 16 }}>{step === 15 ? "Continue for free" : step === 14 ? "Not now" : "Skip for now"}</Text></Pressable>}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </ReaderMaterialGradient>;
}

function FirstMoment({ collected }: { collected: boolean }) {
  const reduced = useReducedMotion(), turn = useSharedValue(collected ? 180 : 0);
  useEffect(() => { turn.value = reduced ? (collected ? 180 : 0) : withSpring(collected ? 180 : 0, { damping: 25, stiffness: 150, overshootClamping: true }); }, [collected, reduced]);
  const back = useAnimatedStyle(() => ({ opacity: turn.value < 90 ? 1 : 0, transform: [{ perspective: 900 }, { rotateY: `${turn.value}deg` }] }));
  const front = useAnimatedStyle(() => ({ opacity: turn.value >= 90 ? 1 : 0, transform: [{ perspective: 900 }, { rotateY: `${turn.value - 180}deg` }] }));
  return <View style={{ width: 230, height: 310, alignSelf: "center" }}>
    <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: "hidden", backgroundColor: "#3B4434", borderWidth: 1, borderColor: "#B8B48B", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }, back]}>
      <SFSymbol name="book.closed.fill" color="#E4D8B4" size={48} />
      <Text style={{ color: "#F4EBD5", fontSize: 24, fontWeight: "600", textAlign: "center" }}>Your first Moment</Text>
      <Text style={{ color: "#D3C9AF", fontSize: 16, textAlign: "center" }}>Genesis 1:1</Text>
    </Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 22, boxShadow: "0 16px 28px #00000030" }, front]}><MomentCollectibleFront moment={MOMENT} /></Animated.View>
  </View>;
}

function Envelope({ opened }: { opened: boolean }) {
  const reduced = useReducedMotion(), progress = useSharedValue(opened ? 1 : 0);
  useEffect(() => { progress.value = withTiming(opened ? 1 : 0, { duration: reduced ? 0 : 650 }); }, [opened, reduced]);
  const letter = useAnimatedStyle(() => ({ transform: [{ translateY: -progress.value * 94 }] }));
  const flap = useAnimatedStyle(() => ({ opacity: 1 - progress.value, transform: [{ perspective: 700 }, { rotateX: `${-progress.value * 150}deg` }] }));
  return <View style={s.envelopeStage}><View style={s.envelope}><Animated.View style={[s.letter, letter]}><Text style={{ color: "#514033", fontSize: 14, marginBottom: 12 }}>A note for you</Text><Text style={{ color: "#30251E", fontSize: 23, lineHeight: 30, fontWeight: "600", textAlign: "center" }}>The Lord is closer than you think.</Text></Animated.View><View style={s.envelopeFront}><Svg width="100%" height="100%" viewBox="0 0 280 170"><Path d="M0 0 L140 95 L280 0 L280 170 L0 170Z" fill="#D7B897" stroke="#B99472" strokeWidth="1" /></Svg></View><Animated.View style={[StyleSheet.absoluteFill, flap]}><Svg width="100%" height="100%" viewBox="0 0 280 170"><Path d="M0 0 L140 100 L280 0Z" fill="#E8CFAB" /></Svg><View style={s.seal}><SFSymbol name="heart.fill" size={22} color="#F7EAD7" /></View></Animated.View></View></View>;
}
function Candle({ minutes, height, selected, color, onPress }: { minutes: number; height: number; selected: boolean; color: string; onPress: () => void }) {
  const dark = useResolvedScheme() === "dark";
  const selectionColor = dark ? "#82C991" : "#24663A";
  const reduced = useReducedMotion(), lift = useSharedValue(selected ? -6 : 0);
  useEffect(() => { lift.value = reduced ? 0 : withSpring(selected ? -6 : 0, { stiffness: 360, damping: 22 }); }, [selected, reduced]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  return <Animated.View style={motion}><Pressable onPress={onPress} accessibilityRole="radio" accessibilityLabel={`${minutes} minutes daily`} accessibilityState={{ selected }} style={s.candleChoice}><View style={{ height: 240, justifyContent: "flex-end", alignItems: "center" }}><View style={{ width: 16, height: 30, borderRadius: 16, backgroundColor: selected ? "#FFD897" : "transparent", marginBottom: 8, boxShadow: selected ? "0 0 28px 8px #E9AD5460" : undefined, transform: [{ rotate: "8deg" }] }} /><View style={{ width: 3, height: 8, backgroundColor: "#705340" }} /><ReaderMaterialGradient colors={selected ? ["#F5DCB7", "#CDA575"] : ["#A39480", "#7D6C56"]} style={{ width: 64, height, borderRadius: 10, borderCurve: "continuous" }} /></View><Text style={{ color: selected ? selectionColor : color, fontSize: 25, fontWeight: "600", marginTop: 20 }}>{minutes}</Text><Text style={{ color, fontSize: 15 }}>minutes</Text><View style={{ height: 28, paddingTop: 8 }}>{selected && <SFSymbol name="checkmark.circle.fill" color={selectionColor} size={20} />}</View></Pressable></Animated.View>;
}
function Sky({ time }: { time: number }) {
  const reduced = useReducedMotion(), pos = useSharedValue(time);
  useEffect(() => { pos.value = reduced ? time : withSpring(time, { damping: 22, stiffness: 150 }); }, [time, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -90 + pos.value * 60 }, { translateY: -Math.sin(pos.value / 3 * Math.PI) * 55 }] }));
  return <ReaderMaterialGradient colors={time === 3 ? ["#242A44", "#5A556B"] : time === 2 ? ["#C88465", "#E5B788"] : ["#B4CCD3", "#F0DBC0"]} style={s.sky}><Animated.View style={[s.sun, { backgroundColor: time === 3 ? "#F1E7CD" : "#FFE8AD" }, style]} /><View style={s.hill} /></ReaderMaterialGradient>;
}
const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, progress: { flex: 1, flexDirection: "row", gap: 5, maxWidth: 240, marginHorizontal: "auto" }, segment: { height: 3, flex: 1, borderRadius: 3 },
  content: { flexGrow: 1, padding: 28, paddingTop: 24, justifyContent: "center" }, title: { fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -.7, textAlign: "center" }, body: { fontSize: 17, lineHeight: 25, textAlign: "center" }, footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, gap: 12 }, cta: { minHeight: 56, padding: 16, borderRadius: 28, borderCurve: "continuous", backgroundColor: "#FFFAF1", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px #00000010" }, ctaText: { color: "#30251E", fontSize: 17, fontWeight: "600" }, secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  note: { padding: 20, borderRadius: 12, borderCurve: "continuous", gap: 12, boxShadow: "0 6px 10px #00000018" }, noteText: { color: "#362A22", fontSize: 17, lineHeight: 24, fontWeight: "500" }, stamp: { color: "#655044", fontSize: 13, fontWeight: "600" }, nameTag: { borderRadius: 24, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 16px 28px #00000018" }, tagHeader: { backgroundColor: "#AC5A41", padding: 20, alignItems: "center" }, input: { minHeight: 120, padding: 24, fontSize: 30, textAlign: "center" },
  jar: { alignSelf: "center", width: 240, minHeight: 220, borderWidth: 2, borderRadius: 36, borderCurve: "continuous", padding: 20, paddingTop: 30, justifyContent: "flex-end" }, jarLid: { position: "absolute", top: -8, left: 12, right: 12, height: 18, borderRadius: 8 }, slips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }, slip: { padding: 8, paddingHorizontal: 12, borderRadius: 4 }, chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }, chip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderCurve: "continuous", minHeight: 48 }, candles: { flexDirection: "row", justifyContent: "space-evenly", paddingBottom: 16 }, candleChoice: { alignItems: "center", width: 88, minHeight: 330 },
  plan: { padding: 24, gap: 20, borderRadius: 24, borderCurve: "continuous" }, planTitle: { fontSize: 24, fontWeight: "600" }, planRow: { flexDirection: "row", gap: 16, alignItems: "center", minHeight: 60 }, number: { fontSize: 22, fontWeight: "600", width: 24 }, time: { width: "46%", padding: 16, minHeight: 80, borderRadius: 20, borderCurve: "continuous", gap: 8 }, sky: { height: 190, borderRadius: 28, borderCurve: "continuous", alignItems: "center", justifyContent: "center" }, sun: { width: 46, height: 46, borderRadius: 23, marginTop: 60 }, hill: { position: "absolute", bottom: -75, width: "130%", height: 130, borderRadius: 150, backgroundColor: "#756B56" },
  envelopeStage: { height: 290, justifyContent: "flex-end", alignItems: "center", paddingBottom: 12 }, envelope: { width: 280, height: 170, backgroundColor: "#BE9D78", borderRadius: 12, boxShadow: "0 18px 32px #00000025" }, letter: { position: "absolute", left: 12, right: 12, top: 8, height: 152, padding: 20, borderRadius: 8, backgroundColor: "#FFF8E9", alignItems: "center" }, envelopeFront: { ...StyleSheet.absoluteFillObject, borderRadius: 12, overflow: "hidden" }, seal: { position: "absolute", top: 65, left: 114, width: 52, height: 52, borderRadius: 26, backgroundColor: "#A8593E", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#BD7658" },
});
