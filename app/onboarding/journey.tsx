import { SCREEN_H_PAD } from "@/lib/layout";
import { uiText } from '@/lib/typography';
import { OnboardingContent, OnboardingChoicesLayout } from '@/components/OnboardingContent';
import { buttonStyles } from '@/lib/buttonStyles';
import { useEffect, useRef, useState } from "react";
import { BackHandler, Linking, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/components/CloserText";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { OnboardingFocusText, OnboardingMotionGroup } from "@/components/OnboardingMotion";
import { OnboardingCommunityScene } from "@/components/OnboardingStoryScene";
import { BibleGiftReveal, BibleRevealTitle, HoldToUnwrap } from "@/components/OnboardingBibleReveal";
import { OnboardingGlobeOpening } from "@/components/OnboardingGlobeOpening";
import { OnboardingChoice } from "@/components/OnboardingChoice";
import { SFSymbol } from "@/components/Symbol";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { OnboardingMomentFan, OnboardingReadingPreview, OnboardingBadgeCarousel } from "@/components/OnboardingProductPreview";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { useOnboarding, type OnboardingAnswers } from "@/state/onboarding";
import { useSubscription } from "@/state/subscription";
import { useReadingGoal } from "@/state/readingGoal";
import { unlockBibleMoment, useBibleMomentCollection } from "@/state/bibleMoments";
import { ThemeSurface, useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { requestNotificationPermission, scheduleDailyReminder } from "@/lib/notifications";
import { skipLaunchSplashForSession } from "@/lib/launchSplashSession";
import { paperActionColors } from "@/lib/paperControls";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/theme";
import * as haptics from "@/lib/haptics";

const REASONS = ["I want to read, but don’t know where to start.", "I’m finding my way back to God.", "I want a little quiet in my day.", "Honestly, I’m just curious."];
const REASON_ICONS = ["book", "arrow.uturn.backward", "leaf", "questionmark.circle"] as const;
const INTENTIONS = ["Peace", "Hope", "Courage", "Rest", "Forgiveness", "Joy"];
const PAPER = ["#EDD8B7", "#DDDFC3", "#EAC8BC", "#D4DDE0", "#E1D3E2", "#E8DCA8"];
const MOMENT = BIBLE_MOMENTS.find(m => m.id === "creation")!;
const TIMES = [{ label: "Morning", time: "7:30 AM", hour: 7, minute: 30 }, { label: "Midday", time: "12:00 PM", hour: 12, minute: 0 }, { label: "Evening", time: "6:00 PM", hour: 18, minute: 0 }, { label: "Night", time: "9:00 PM", hour: 21, minute: 0 }];
const ORDER = [0, 1, 2, 8, 9, 10, 11, 17, 6, 12, 13, 18, 19, 20, 21, 3, 4, 5, 16, 7, 14, 15];
const QUESTIONS = [
  { step: 18, key: "faithCommunity", options: ["Yes, and I’m grateful", "A few, but I’d like more connection", "Not right now", "I’m still figuring that out"] },
  { step: 8, key: "faithNow", options: ["Close to him", "Drifting", "Coming back", "Not sure", "Just curious"] },
  { step: 9, key: "faithDuration", options: ["A few weeks", "A few months", "About a year", "Longer than that", "It’s always felt this way"] },
  { step: 10, key: "churchBackground", options: ["Every Sunday", "Now and then", "Not really", "Never"] },
  { step: 11, key: "bibleFrequency", options: ["Most days", "Once in a while", "Rarely", "I’ve never really read it"] },
] as const;

const OBSTACLES = ["Too busy", "Don’t know where to start", "The Bible feels confusing", "Guilt about coming back", "Church felt judgmental", "I have doubts", "Nothing in particular"];
const HEADINGS = ["Something was left for you.", "What brings you here?", "What should we call you?", "What do you need a little more of?", "How long would you like to read?", "Keep the moments that move you.", "A place to begin.", "When should we remind you?", "Where are you with God right now?", "How long has it felt this way?", "Did you grow up going to church?", "How often do you read the Bible?", "There’s a place for you here.", "What’s made it hard to stay close?", "A reminder at your time.", "Make room for more with Closer Plus.", "Small steps worth keeping.", "The whole Bible. Yours to explore.", "Who do you share your faith with?", "Grow together.", "Carry a little hope.", "Find your people."];
const DETAILS = ["A small invitation to begin again.", "Choose all that feel right.", "A first name is enough. You can skip this.", "Choose what you need today.", "Choose your daily reading goal.", "Discover the story behind a verse. Collect your first Moment from Genesis.", "Open Genesis and try a little of the reading experience.", "Choose a time for your daily reading.", "An honest answer is a good place to begin.", "However long it’s been, you’re welcome here.", "No background needed. We’ll meet you where you are.", "We’ll use this to suggest where to start.", "A little encouragement for the season you’re in.", "Choose what fits, or “Nothing in particular.”", "We’ll send one reminder when it’s time to read.", "Optional support for your daily practice. The whole Bible stays free.", "Earn little reminders of the time you make for God. Swipe to explore.", "", "Whatever your answer, there’s room for you here.", "A prayer, a verse, a little encouragement. There’s room for you here.", "A place to share what’s on your heart, and make room for someone else’s prayer.", "Read a little Scripture. Ask a question. Study groups are coming to Closer."];

/** New onboarding lives after the original video welcome, which owns its own route. */
export default function Journey() {
  const { previewTheme, preview } = useLocalSearchParams<{ previewTheme?: string; preview?: string }>();
  const { answers: savedAnswers, hydrated } = useOnboarding();
  if (!hydrated) return null;
  if (savedAnswers.completed && !(__DEV__ && preview)) return <Redirect href="/today" />;
  if (__DEV__ && (previewTheme === "light" || previewTheme === "dark")) {
    return <ThemeSurface scheme={previewTheme} colors={previewTheme === "light" ? LIGHT_COLORS : DARK_COLORS}><JourneyFlow /></ThemeSurface>;
  }
  return <ThemeSurface scheme="dark" colors={DARK_COLORS}><JourneyFlow /></ThemeSurface>;
}

function JourneyFlow() {
  const router = useRouter(), reduced = useReducedMotion(), dark = useResolvedScheme() === "dark";
  const { setAnswer: saveAnswer } = useOnboarding();
  // A new journey starts unanswered. Going back within this run keeps choices;
  // persisted profile answers must not preselect a new onboarding session.
  const [answers, setSessionAnswers] = useState<OnboardingAnswers>({ name: "" });
  const setAnswer = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setSessionAnswers(previous => ({ ...previous, [key]: value }));
    saveAnswer(key, value);
  };
  const { goalMinutes, setGoalMinutes } = useReadingGoal();
  const collection = useBibleMomentCollection();
  const subscription = useSubscription();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const [page, setPage] = useState(() => __DEV__ && preview === "bible-gift" ? ORDER.indexOf(17) : __DEV__ && preview === "community" ? ORDER.indexOf(19) : 0);
  const step = ORDER[page];
  const [openingLeaving, setOpeningLeaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const transitionLock = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  const goToPage = (target: number) => {
    if (transitionLock.current) return;
    Keyboard.dismiss(); setError("");
    if (reduced) { setPage(target); return; }
    transitionLock.current = true; setExiting(true);
    transitionTimer.current = setTimeout(() => {
      setPage(target); setExiting(false); transitionLock.current = false;
    }, step === 17 || (step >= 19 && step <= 21) ? 240 : 140);
  };
  const [readingExpanded, setReadingExpanded] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  useEffect(() => {
    if (!__DEV__) return;
    if (preview === "bible-gift" || preview === "bible-open") { setPage(ORDER.indexOf(17)); setGiftOpened(preview === "bible-open"); }
    if (preview === "community") setPage(ORDER.indexOf(19));
    if (preview === "community-prayer") setPage(ORDER.indexOf(20));
    if (preview === "community-groups") setPage(ORDER.indexOf(21));
    if (preview === "community-question") setPage(ORDER.indexOf(18));
    if (preview === "faith-question") setPage(ORDER.indexOf(8));
    if (preview === "reminders") setPage(ORDER.indexOf(14));
    if (preview === "subscription") setPage(ORDER.indexOf(15));
    if (preview?.startsWith("step-")) { const target = Number(preview.slice(5)); if (ORDER.includes(target)) setPage(ORDER.indexOf(target)); }
  }, [preview]);
  const question = QUESTIONS.find(q => q.step === step);
  const isQuestion = Boolean(question) || [1, 3, 4, 7, 13].includes(step);
  const communityIntro = answers.faithCommunity === "Yes, and I’m grateful"
    ? "Bring that encouragement with you. A prayer or a verse can brighten someone’s day."
    : answers.faithCommunity === "Not right now"
      ? "You don’t have to find your way alone. Begin with a prayer or a little encouragement."
      : answers.faithCommunity === "I’m still figuring that out"
        ? "There’s room to listen, ask questions, and find your own way to connect."
        : "A little more connection can start with a prayer, a verse, or a kind word.";
  const title = step === 9 && answers.faithNow === "Close to him" ? "How long have you felt close to God?" : HEADINGS[step];
  const detail = step === 17 ? "" : step === 19 ? communityIntro : step === 6 && readingExpanded ? "One verse at a time. Read, reflect, and keep what speaks to you." : DETAILS[step];
  const season = answers.faithNow === "Close to him" ? { title: "A growing season", body: "Paul kept reaching toward God even after years of faith. There is always more to discover.", reference: "Philippians 3:14" } : answers.faithNow === "Coming back" ? { title: "A coming-home season", body: "In Jesus’ story of the lost son, the father sees him from far away and runs to welcome him. You can begin again, too.", reference: "Luke 15:20" } : ["Not sure", "Just curious"].includes(answers.faithNow ?? "") ? { title: "A searching season", body: "Nicodemus came to Jesus with questions. Jesus made time for him. Your questions belong here, too.", reference: "John 3:1–16" } : { title: "A quiet season", body: "When Elijah felt worn out, God met him in a still, small voice. A quiet beginning can be enough.", reference: "1 Kings 19:12" };
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false);
  const [time, setTime] = useState(() => Math.max(0, TIMES.findIndex(t => t.hour === answers.dailyReminderTime?.hour)));
  const ink = dark ? "#F6F0E6" : "#30251E", muted = dark ? "#C2B5A7" : "#75675B";
  const actionColors = paperActionColors(dark);
  const surface = dark ? "#362B24" : "#FFF9EE";
  const collected = collection.ids.includes(MOMENT.id);
  const [goalChosen, setGoalChosen] = useState(false), [timeChosen, setTimeChosen] = useState(false);
  const reasons = answers.welcomeReasons ?? [], intentions = answers.growthAreas ?? [];
  const answerMissing = Boolean(question && !question.options.includes(answers[question.key] as never)) || (step === 1 && reasons.length === 0) || (step === 3 && intentions.length === 0) || (step === 13 && !(answers.faithObstacles?.length)) || (step === 4 && !goalChosen) || (step === 7 && !timeChosen);
  const back = () => { if (busy || transitionLock.current) return; Keyboard.dismiss(); setError(""); if (page > 1) goToPage(page - 1); else router.back(); };
  useEffect(() => { const sub = BackHandler.addEventListener("hardwareBackPress", () => { back(); return true; }); return () => sub.remove(); }, [page, busy]);
  const next = () => { Keyboard.dismiss(); haptics.soft(); setError(""); goToPage(Math.min(ORDER.length - 1, page + 1)); };
  const finish = () => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    skipLaunchSplashForSession();
    setAnswer("completed", true);
    router.dismissAll();
    router.replace("/today");
  };
  const submit = async () => {
    if (lock.current || transitionLock.current || answerMissing) return;
    if (step === 5 && !collected) {
      lock.current = true; setBusy(true); setError("");
      try { await unlockBibleMoment(MOMENT.id); haptics.success(); }
      catch { setError("Your card couldn’t be saved. Please try again."); }
      finally { lock.current = false; setBusy(false); }
      return;
    }
    if (step === 17 && !giftOpened) { setGiftOpened(true); haptics.soft(); return; }
    if (step === 6 && !readingExpanded) { setReadingExpanded(true); haptics.soft(); return; }
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
  const toggle = (key: "welcomeReasons" | "growthAreas" | "faithObstacles", value: string, list: string[]) => {
    haptics.tick();
    const nextValues = list.includes(value) ? list.filter(v => v !== value) : key === "faithObstacles" && value === "Nothing in particular" ? [value] : [...list.filter(v => key !== "faithObstacles" || v !== "Nothing in particular"), value];
    setAnswer(key, nextValues);
  };
  const purchaseUnavailable = step === 15 && !subscription.isPro && (!subscription.configured || !subscription.monthlyPackage);
  const continueDisabled = busy || exiting || openingLeaving || purchaseUnavailable || answerMissing;
  const label = busy ? "Saving…" : step === 5 ? collected ? "Continue" : "Collect this Moment" : step === 6 && !readingExpanded ? "Open reading preview" : step === 17 && !giftOpened ? "Hold to unwrap your Bible" : step === 14 ? "Enable reminders" : step === 15 ? subscription.isPro ? "Continue" : purchaseUnavailable ? "Subscriptions coming soon" : "Subscribe" : "Continue";
  return <View style={{flex:1}} pointerEvents={openingLeaving ? "none" : "auto"}>
    {step !== 0 && <ReaderMaterialGradient colors={dark ? ["#372820", "#1D1916", "#171513"] : ["#F2DECB", "#F8EFE2", "#F9F4EA"]} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style={dark ? "light" : "dark"} />
      <View style={s.top}>
        {page > 1 ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={busy || exiting} onPress={back} style={s.icon}><SFSymbol name="chevron.left" size={20} color={ink} /></Pressable> : <View style={s.icon} />}
        <OnboardingProgress page={page} total={ORDER.length} color={ink} dark={dark}/>
        <View style={s.icon} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {question || step === 1 || step === 13 ? <OnboardingChoicesLayout key={step} header={<View style={{gap:16}}><Text accessibilityRole="header" style={[s.title,s.questionTitle,{color:ink}]}>{title}</Text>{!!detail&&<Text style={[s.body,{color:muted,textAlign:"left"}]}>{detail}</Text>}</View>}>
          <OnboardingMotionGroup exiting={exiting}><View accessibilityRole={question ? "radiogroup" : undefined} style={{gap:12}}>
            {question ? question.options.map(option=><OnboardingChoice key={option} label={option} selected={answers[question.key]===option} onPress={()=>{setAnswer(question.key,option);haptics.tick();}}/>) : step===1 ? REASONS.map((reason, index)=><OnboardingChoice key={reason} label={reason} icon={REASON_ICONS[index]} multiple selected={reasons.includes(reason)} onPress={()=>toggle("welcomeReasons",reason,reasons)}/>) : OBSTACLES.map(item=><OnboardingChoice key={item} label={item} multiple selected={(answers.faithObstacles??[]).includes(item)} onPress={()=>toggle("faithObstacles",item,answers.faithObstacles??[])}/>)}
          </View></OnboardingMotionGroup>
        </OnboardingChoicesLayout> : <OnboardingContent key={step} contentContainerStyle={[s.content, step === 17 && {paddingTop:24}]} >
          <OnboardingMotionGroup stationary={step === 17 || (step >= 19 && step <= 21)} exiting={exiting && step !== 17 && !(step >= 19 && step <= 21)}><View style={{ gap: 28 }}>

            {step >= 19 && step <= 21 && <OnboardingCommunityScene scene={step - 19} exiting={exiting}/>}
            {step === 5 && <OnboardingMomentFan collected={collected} />}
            {step === 16 && <OnboardingBadgeCarousel />}
            {step === 6 && <OnboardingReadingPreview expanded={readingExpanded} onOpen={() => { setReadingExpanded(true); haptics.soft(); }} />}
            <View style={{ gap: 16 }}>{step === 17 ? <BibleRevealTitle opened={giftOpened}/> : isQuestion ? <Text accessibilityRole="header" style={[s.title, s.questionTitle, { color: ink }]}>{title}</Text> : <OnboardingFocusText blurEnabled={!(step >= 19 && step <= 21)} exiting={exiting} delay={80} accessibilityRole="header" style={[s.title, { color: ink }]}>{title}</OnboardingFocusText>}{!!detail && (isQuestion ? <Text style={[s.body, { color: muted, textAlign: "left" }]}>{detail}</Text> : <OnboardingFocusText blurEnabled={step !== 17 && !(step >= 19 && step <= 21)} exiting={exiting} delay={170} style={[s.body, { color: muted }]}>{detail}</OnboardingFocusText>)}</View>
            {step === 17 && <BibleGiftReveal opened={giftOpened}/>}
            {step === 12 && <View style={[s.plan, { backgroundColor: surface, alignItems: "center", paddingVertical: 36 }]}><SFSymbol name="leaf" size={48} color={ink} /><Text style={[s.planTitle, { color: ink }]}>{season.title}</Text><Text style={[s.body, { color: muted }]}>{season.body}</Text><Text style={{ color: muted, fontSize: 15 }}>{season.reference}</Text></View>}
            {step === 14 && <View style={{ gap: 24 }}><Text style={[s.title, { color: ink, fontSize: 48, lineHeight: 60 }]}>{TIMES[time].time}</Text><View style={[s.plan, { backgroundColor: surface }]}><View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><SFSymbol name="bell.badge.fill" color={ink} size={24} /><Text style={{ color: ink, fontSize: 17, fontWeight: "600" }}>Closer</Text></View><Text style={{ color: ink, fontSize: 20, fontWeight: "600" }}>Your word for today is ready.</Text><Text style={{ color: muted, fontSize: 17, lineHeight: 24 }}>A few quiet minutes with God, at your own pace.</Text></View></View>}
            {step === 15 && <View style={{ gap: 24 }}><View style={{ alignItems: "center", padding: 24 }}><SFSymbol name="heart.fill" color={ink} size={64} /></View><View style={[s.plan, { backgroundColor: surface }]}><Text style={[s.planTitle, { color: ink }]}>Closer Plus</Text><Text style={[s.body, { color: muted, textAlign: "left" }]}>Your Bible, saved Moments, and reading progress remain yours when you continue for free.</Text><Text style={{ color: ink, fontSize: 24, fontWeight: "600" }}>{subscription.monthlyPackage ? `${subscription.monthlyPackage.product.priceString} / month` : "Subscription options coming soon"}</Text>{subscription.monthlyPackage && <Text style={{ color: muted, fontSize: 15, lineHeight: 22 }}>Renews monthly until canceled. Manage or cancel in App Store settings.</Text>}</View><Pressable disabled={busy || exiting} accessibilityRole="button" onPress={async () => { if (lock.current) return; lock.current = true; setBusy(true); setError(""); try { if (!subscription.configured) setError("Purchases aren’t available right now."); else if (await subscription.restore()) finish(); else setError("No active subscription was found."); } catch { setError("Couldn’t restore purchases. Please try again."); } finally { lock.current = false; setBusy(false); } }} style={s.secondary}><Text style={{ color: ink, fontSize: 16 }}>Restore purchases</Text></Pressable><View style={{ flexDirection: "row", justifyContent: "center", gap: 24 }}>{["Terms", "Privacy"].map(item => <Pressable key={item} accessibilityRole="link" onPress={() => Linking.openURL(`https://closer.app/${item.toLowerCase()}`)} style={s.secondary}><Text style={{ color: muted, fontSize: 15 }}>{item}</Text></Pressable>)}</View></View>}
            {step === 2 && <View style={[s.nameTag, { backgroundColor: surface }]}><View style={s.tagHeader}><Text style={{ color: "#FFF", fontSize: 20, fontWeight: "700" }}>Hello, my name is</Text></View><TextInput accessibilityLabel="First name" defaultValue={answers.name} onChangeText={name => setAnswer("name", name)} placeholder="Your name" placeholderTextColor={muted} maxLength={40} autoCapitalize="words" autoComplete="given-name" returnKeyType="done" onSubmitEditing={next} style={[s.input, { color: ink }]} /></View>}
            {step === 3 && <><View style={[s.jar, { borderColor: dark ? "#CDBAA177" : "#98877688", backgroundColor: dark ? "#FFFFFF08" : "#FFFFFF40" }]}><View style={[s.jarLid, { backgroundColor: dark ? "#8B7864" : "#C5B197" }]} />{intentions.length === 0 && <Text style={[s.body, { color: muted }]}>A little room for hope.</Text>}<View style={s.slips}>{intentions.map((item, i) => <Animated.View entering={reduced ? FadeIn.duration(0) : FadeInDown.springify().damping(20).stiffness(180)} key={item} style={[s.slip, { backgroundColor: PAPER[i % PAPER.length], transform: [{ rotate: `${i % 2 ? 7 : -6}deg` }] }]}><Text style={s.noteText}>{item}</Text></Animated.View>)}</View></View><View style={s.chips}>{INTENTIONS.map(item => <OnboardingChoice key={item} label={item} multiple compact selected={intentions.includes(item)} onPress={() => toggle("growthAreas", item, intentions)} />)}</View></>}
            {step === 4 && <View style={s.candles}>{[3, 5, 10].map((minutes, i) => <Candle key={minutes} minutes={minutes} height={88 + i * 40} selected={goalChosen && goalMinutes === minutes} color={ink} onPress={() => { setGoalMinutes(minutes); setGoalChosen(true); haptics.tick(); }} />)}</View>}
            {step === 5 && <>{collected && <Text style={[s.body, { color: muted }]}>{MOMENT.importance}</Text>}{collected && <Text accessibilityLiveRegion="polite" style={[s.body, { color: "#248A3D", fontWeight: "600" }]}>✓ Saved in your Bible Moments</Text>}</>}
            {step === 6 && <Text style={[s.body, { color: muted }]}>{goalMinutes} minutes a day{intentions[0] ? ` · A little more ${intentions[0].toLowerCase()}` : ""}</Text>}
            {step === 7 && <><Sky time={time} /><View style={s.chips}>{TIMES.map((t, i) => <OnboardingChoice key={t.label} label={t.label} detail={t.time} selected={timeChosen && time === i} onPress={() => { setTime(i); setTimeChosen(true); haptics.tick(); }} style={{ width: "46%" }} />)}</View></>}
          </View></OnboardingMotionGroup>
        </OnboardingContent>}
        <View style={s.footer}>{!!error && <Text accessibilityLiveRegion="polite" style={[s.body, { color: ink, fontSize: 15 }]}>{error}</Text>}{step === 17 && !giftOpened ? <HoldToUnwrap onUnwrap={() => setGiftOpened(true)}/> : <Pressable accessibilityRole="button" disabled={continueDisabled} accessibilityState={{ disabled: continueDisabled, busy }} onPress={submit} style={[s.cta, { backgroundColor: continueDisabled ? (dark ? "#443B34" : "#E4DBD0") : actionColors.backgroundColor, borderColor: continueDisabled ? "transparent" : actionColors.borderColor, borderWidth: 1, boxShadow: continueDisabled ? "none" : s.cta.boxShadow }]}><Text style={[s.ctaText, { color: continueDisabled ? (dark ? "#B9ADA1" : "#786B60") : actionColors.color }]}>{label}</Text></Pressable>}{(step === 2 || step === 14 || step === 15) && <Pressable disabled={busy || exiting} accessibilityRole="button" onPress={step === 15 ? finish : next} style={s.secondary}><Text style={{ color: muted, fontSize: 16 }}>{step === 15 ? "Continue for free" : step === 14 ? "Not now" : "Skip for now"}</Text></Pressable>}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </ReaderMaterialGradient>}
    {(step === 0 || openingLeaving) && <View style={StyleSheet.absoluteFill} pointerEvents={openingLeaving ? "none" : "auto"}>
      <OnboardingGlobeOpening onRevealNext={() => { setOpeningLeaving(true); setPage(1); }} onContinue={() => setOpeningLeaving(false)}/>
    </View>}
  </View>;
}

function OnboardingProgress({page,total,color,dark}: {page:number;total:number;color:string;dark:boolean}) {
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(240);
  const progress = useSharedValue((page + 1) / total);
  useEffect(() => { progress.value = withTiming((page + 1) / total, {duration: reduced ? 0 : 320}); }, [page,total,reduced,progress]);
  const fill = useAnimatedStyle(() => ({transform:[{translateX:(progress.value - 1) * trackWidth}]}));
  return <View onLayout={event => setTrackWidth(event.nativeEvent.layout.width)} style={[s.progress,{backgroundColor:dark ? "#FFFFFF20" : "#30251E20"}]} accessibilityLabel={`Step ${page + 1} of ${total}`} accessibilityRole="progressbar" accessibilityValue={{min:1,max:total,now:page+1}}>
    <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:color,borderRadius:4},fill]}/>
  </View>;
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
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56 }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, progress: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", maxWidth: 240, marginHorizontal: "auto" },
  questionTitle: { textAlign: "left", fontSize: 36, lineHeight: 42 },
  content: { flexGrow: 1, padding: SCREEN_H_PAD, paddingTop: 32, justifyContent: "flex-start" }, title: { ...uiText.screenTitle, textAlign: "center" }, body: { fontSize: 16, lineHeight: 24, textAlign: "center" }, footer: { paddingHorizontal: SCREEN_H_PAD, paddingTop: 12, paddingBottom: 12, gap: 12 }, cta: { ...buttonStyles.primary, backgroundColor: "#FFFAF1", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px #00000010" }, ctaText: { ...buttonStyles.label, color: "#30251E" }, secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  note: { padding: 20, borderRadius: 12, borderCurve: "continuous", gap: 12, boxShadow: "0 6px 10px #00000018" }, noteText: { color: "#362A22", fontSize: 17, lineHeight: 24, fontWeight: "500" }, stamp: { color: "#655044", fontSize: 13, fontWeight: "600" }, nameTag: { borderRadius: 24, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 16px 28px #00000018" }, tagHeader: { backgroundColor: "#AC5A41", padding: 20, alignItems: "center" }, input: { minHeight: 120, padding: 24, fontSize: 30, textAlign: "center" },
  jar: { alignSelf: "center", width: 240, minHeight: 220, borderWidth: 2, borderRadius: 36, borderCurve: "continuous", padding: 20, paddingTop: 30, justifyContent: "flex-end" }, jarLid: { position: "absolute", top: -8, left: 12, right: 12, height: 18, borderRadius: 8 }, slips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }, slip: { padding: 8, paddingHorizontal: 12, borderRadius: 4 }, chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }, chip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderCurve: "continuous", minHeight: 48 }, candles: { flexDirection: "row", justifyContent: "space-evenly", paddingBottom: 16 }, candleChoice: { alignItems: "center", width: 88, minHeight: 330 },
  plan: { padding: 24, gap: 20, borderRadius: 24, borderCurve: "continuous" }, planTitle: { fontSize: 24, fontWeight: "600" }, planRow: { flexDirection: "row", gap: 16, alignItems: "center", minHeight: 60 }, number: { fontSize: 22, fontWeight: "600", width: 24 }, time: { width: "46%", padding: 16, minHeight: 80, borderRadius: 20, borderCurve: "continuous", gap: 8 }, sky: { height: 190, borderRadius: 28, borderCurve: "continuous", alignItems: "center", justifyContent: "center" }, sun: { width: 46, height: 46, borderRadius: 23, marginTop: 60 }, hill: { position: "absolute", bottom: -75, width: "130%", height: 130, borderRadius: 150, backgroundColor: "#756B56" },
});
