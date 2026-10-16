import { devotionalLabel, resolveSermonTypeForMoment } from '@/lib/moments';
import { CategoryGesture, CategoryGround, categoryTheme, characterName } from './CategoryArt';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, type SharedValue, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './CloserText';
import { CloseButton } from './CloseButton';
import { FeedbackPressable as Pressable } from './FeedbackPressable';
import { ReaderMaterialGradient } from './ReaderMaterialGradient';
import { SFSymbol, type SFSymbolName } from './Symbol';
import { dailyText, uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useResolvedScheme } from '@/state/theme';
import * as haptics from '@/lib/haptics';
import type { BibleMoment } from '@/constants/bibleMoments';
import type { FloatingScriptureCard } from '@/constants/homePrototype';
import type { DailyStep } from '@/lib/dailyPractice';
import { dailyStepsFor } from '@/lib/dailySteps';

const ALL_STEPS: { id: DailyStep; title: string; subtitle: string; icon: SFSymbolName }[] = [
  { id: 'prayer', title: 'Daily prayer', subtitle: 'A prayer for today', icon: 'hands.sparkles' },
  { id: 'reading', title: 'Scripture and word', subtitle: 'A letter for today', icon: 'envelope' },
  { id: 'quiz', title: 'Quick check', subtitle: 'Reflect on today’s word', icon: 'questionmark.bubble' },
  { id: 'action', title: 'One small step', subtitle: 'Something to do before tonight', icon: 'sun.max' },
];
const LINES: Record<string, string> = { 'daily-church': 'Today’s word, for an ordinary morning.', 'jesus-only': 'No noise. Just Him.', 'letters-struggling': 'A letter found in someone’s journal.', 'letters-grateful': 'The same voice, from the other side.', 'character-studies': 'One life, up close.', 'deep-verse': 'A familiar verse, seen for the first time.', misconceptions: 'The lie. Then the truth.', testimonies: 'God is still moving today.', questions: 'The question, asked out loud.' };

/** Where Today's card sat on screen when it was tapped. */
export type CardOrigin = { x: number; y: number; width: number; height: number };

/* Easing, as worklets. */
const clamp = (v: number) => { 'worklet'; return Math.max(0, Math.min(1, v)); };
const ramp = (v: number, a: number, b: number) => { 'worklet'; return clamp((v - a) / (b - a)); };
const lerp = (a: number, b: number, t: number) => { 'worklet'; return a + (b - a) * t; };
const ease = (x: number) => { 'worklet'; return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out = (x: number) => { 'worklet'; return 1 - Math.pow(1 - x, 3); };
const back = (x: number) => { 'worklet'; const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const bounce = (x: number) => { 'worklet'; const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) { const y = x - 1.5 / d; return n * y * y + .75; } if (x < 2.5 / d) { const y = x - 2.25 / d; return n * y * y + .9375; } const y = x - 2.625 / d; return n * y * y + .984375; };

/**
 * Today's walk. Opened from the card, the card itself becomes the screen:
 * its shape grows to fill it, its words fade, its art travels to the top and
 * the steps rise beneath, and on the way each category does one thing of its
 * own (a sunrise, a full stop opening, a letter unfolding, a card opening, a
 * name written out, a lens, a strike, a rolling ring, a dot that drops into
 * the button). Closing plays it back into the card. Everything moves by
 * transforms and one clipping window, so nothing lays out mid-flight.
 */
export function DailyWalkOverview({ visible, card, completed, ready, onClose, onTask, origin, children }: {
  visible: boolean; card: FloatingScriptureCard; paintings: BibleMoment[]; completed: Partial<Record<DailyStep, boolean>>;
  ready: boolean; onClose: () => void; onTask: (step: DailyStep) => void; origin?: CardOrigin | null; children: ReactNode;
}) {
  const inset = useSafeAreaInsets(), { height: H, width: W, fontScale } = useWindowDimensions(), reduced = useReducedMotion();
  const dark = useResolvedScheme() === 'dark';
  const t = dark
    ? { sheet: '#1E1A16', ink: '#F7F0E6', muted: '#BBAA99', dot: '#2E2823', line: '#FFFFFF14' }
    : { sheet: '#FBF9F6', ink: '#17120F', muted: '#786554', dot: '#EAE5DE', line: '#17120F14' };
  // Today's steps in today's order: the experience first, then what this kind of day holds.
  const steps = dailyStepsFor(card.day).map(id => ALL_STEPS.find(x => x.id === id)!);
  const next = steps.find(step => !completed[step.id])?.id;
  const categoryId = resolveSermonTypeForMoment({ day: card.day }).id, theme = categoryTheme(categoryId);
  const artHeight = Math.min(236, Math.max(150, H * .25));
  const sheetTop = inset.top + 60 + artHeight;
  const artTop = sheetTop - 232;

  // The opening runs 0 → 1; closing runs it back. Without a card to open from, it rises and fades.
  const p = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const opening = useRef(false);
  const from = origin ?? null, o = from ?? { x: 20, y: H * .4, width: W - 40, height: 224 };
  const mode = reduced || !from ? 'fade' : 'card';
  const land = () => { opening.current = false; haptics.soft(); };
  useEffect(() => {
    if (visible) {
      setMounted(true); opening.current = true;
      p.value = 0;
      p.value = withTiming(1, { duration: mode === 'fade' ? 220 : 650, easing: Easing.linear }, done => { if (done) runOnJS(land)(); });
    } else if (mounted) {
      opening.current = false;
      p.value = withTiming(0, { duration: mode === 'fade' ? 180 : 420, easing: Easing.linear }, done => { if (done) runOnJS(setMounted)(false); });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  // A tap while it opens jumps to the end.
  const skip = () => { if (opening.current) { opening.current = false; p.value = withTiming(1, { duration: 140 }); } };

  const geo = { W, H, ox: o.x, oy: o.y, ow: o.width, oh: o.height, artTop, sheetTop, card: mode === 'card', cat: categoryId };
  const cta = next === 'prayer' ? 'Start with prayer' : next === 'reading' ? 'Open today’s letter' : next === 'quiz' ? 'Try the quick check' : next === 'action' ? 'Take one small step' : 'Read again';

  const sheet = <View style={{ position: 'absolute', left: 0, right: 0, top: sheetTop, bottom: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderCurve: 'continuous', backgroundColor: t.sheet, padding: 20, paddingBottom: inset.bottom + 16, gap: 12 }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
      <Text style={{ ...uiText.supporting, color: t.muted }}>{card.scriptureReference}</Text>
      <Text accessibilityRole="header" style={{ ...dailyText.overviewTitle, color: t.ink }}>{card.title}</Text>
      <Text style={{ ...uiText.supporting, fontWeight: '700', color: dark ? theme.accent : theme.light ? theme.label : theme.ground[2], marginTop: -4 }}>{LINES[categoryId]}</Text>
      <View style={{ marginTop: 8 }}>{steps.map(step => <Pressable key={step.id} onPress={() => onTask(step.id)} disabled={!ready} accessibilityRole="button" accessibilityLabel={`${step.title}${completed[step.id] ? ', complete' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 64, borderBottomWidth: .5, borderBottomColor: t.line }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: completed[step.id] ? '#FF4326' : next === step.id ? theme.accent : t.dot, alignItems: 'center', justifyContent: 'center' }}><SFSymbol name={completed[step.id] ? 'checkmark' : step.icon} size={17} color={completed[step.id] ? '#FFF' : next === step.id ? theme.accentInk : t.muted}/></View>
        <View style={{ flex: 1 }}><Text style={{ ...uiText.body, fontSize: 17, lineHeight: 21, fontWeight: '800', color: t.ink }}>{step.title}</Text><Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 18, color: t.muted }}>{step.subtitle}</Text></View>{next === step.id && fontScale < 1.3 && <Text style={{ ...uiText.supporting, color: t.muted }}>Next</Text>}
      </Pressable>)}</View>
    </ScrollView>
    <CtaButton p={p} geo={geo} disabled={!ready} onPress={() => onTask(next ?? 'reading')} color={theme.accent} label={cta} labelColor={theme.accentInk}/>
  </View>;

  return <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
    <Backdrop p={p} card={mode === 'card'}/>
    <Window p={p} geo={geo} onTouchStart={skip}>
      <CategoryGround id={categoryId}/>
      {categoryId === 'daily-church' && <Dusk p={p} geo={geo}/>}
      <Art p={p} geo={geo}>{categoryId === 'character-studies' ? <WrittenName p={p} name={characterName(card.title, card.scriptureText)}/> : <CategoryGesture id={categoryId} title={card.title} text={card.scriptureText}/>}</Art>
      {mode === 'card' && <CardFace p={p} geo={geo} card={card} completed={completed} theme={theme} label={devotionalLabel({ day: card.day })}/>}
      <Fade p={p} geo={geo} from={.6} to={.9} style={{ position: 'absolute', left: 20, right: 20, top: inset.top + 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CloseButton onPress={onClose} color={theme.ink} style={{ backgroundColor: theme.light ? '#2A12061A' : '#FFFFFF2E' }}/>
        <Text style={{ ...uiText.supporting, fontWeight: '800', color: theme.ink }}>{String(card.day).padStart(2, '0')} · {devotionalLabel({ day: card.day })}</Text>
      </Fade>
      <SheetClip p={p} geo={geo}><SheetMotion p={p} geo={geo}>{sheet}</SheetMotion></SheetClip>
      <Extras p={p} geo={geo} card={card} completed={completed} theme={theme} label={devotionalLabel({ day: card.day })}/>
    </Window>
    {children}
  </Modal>;
}

type Geo = { W: number; H: number; ox: number; oy: number; ow: number; oh: number; artTop: number; sheetTop: number; card: boolean; cat: string };
type P = { p: SharedValue<number>; geo: Geo };
/** How far the shared opening has gone (rect growth, art travel): reaches 1 at 70%. Grateful waits for its front to swing open first. */
const grow = (v: number, cat: string) => { 'worklet'; return ease(ramp(cat === 'letters-grateful' ? ramp(v, .32, 1) : v, 0, .7)); };

function Backdrop({ p, card }: { p: SharedValue<number>; card: boolean }) {
  const style = useAnimatedStyle(() => ({ opacity: card ? .35 * ease(ramp(p.value, 0, .7)) : .35 * p.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, style]}/>;
}

/** The clipping window: the card's rounded rectangle growing to the screen (a circle out of the lens for Deep verse). Its content is pinned to the screen. */
function Window({ p, geo, onTouchStart, children }: P & { onTouchStart: () => void; children: ReactNode }) {
  // The card's rectangle grows to the screen by scale alone (no layout per frame): the window is
  // screen-sized and scaled down to the card, and its content is scaled back up by the inverse,
  // so the content stays pinned and undistorted while the edges move.
  const { W, H, ox, oy, ow, oh, card, cat } = geo;
  const rect = (v: number) => {
    'worklet';
    const g = card ? grow(v, cat) : 1;
    return { x: lerp(ox, 0, g), y: lerp(oy, 0, g), sx: lerp(ow, W, g) / W, sy: lerp(oh, H, g) / H, r: lerp(28, 0, g) };
  };
  const win = useAnimatedStyle(() => {
    const { x, y, sx, sy, r } = rect(p.value);
    return { opacity: card ? 1 : p.value, borderRadius: r / Math.max(.01, sx), transform: [{ translateX: x }, { translateY: y }, { scaleX: sx }, { scaleY: sy }] };
  });
  const pin = useAnimatedStyle(() => {
    const { x, y, sx, sy } = rect(p.value);
    return { transform: [{ scaleX: 1 / Math.max(.01, sx) }, { scaleY: 1 / Math.max(.01, sy) }, { translateX: -x }, { translateY: -y }] };
  });
  return <Animated.View onTouchStart={onTouchStart} style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', transformOrigin: 'left top' }, win]}>
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: 'left top' }, pin]}>{children}</Animated.View>
  </Animated.View>;
}

/** Daily Church: the ground warms from dusk to morning as the sun rises. */
function Dusk({ p, geo }: P) {
  const style = useAnimatedStyle(() => ({ opacity: geo.card ? .5 * ramp(p.value, 0, .12) * (1 - out(ramp(p.value, .15, .85))) : 0 }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}><ReaderMaterialGradient colors={['#FF7A1A', '#E2400A']} style={StyleSheet.absoluteFill}/></Animated.View>;
}

/** The category's art, travelling from the card to the top of the walk, with its own small move on the way. */
function Art({ p, geo, children }: P & { children: ReactNode }) {
  const { W, ox, oy, ow, oh, artTop, card, cat } = geo;
  const style = useAnimatedStyle(() => {
    const v = card ? p.value : 1, g = card ? grow(v, cat) : 1;
    let extraY = 0, rotate = 0, scale = 1, opacity = 1;
    if (cat === 'daily-church') extraY = 60 * ramp(v, 0, .15) * (1 - out(ramp(v, .15, .85)));
    if (cat === 'letters-struggling') extraY = -14 * Math.sin(ramp(v, .5, 1) * Math.PI);
    if (cat === 'letters-grateful') scale = 1 + .08 * Math.sin(ramp(v, .7, 1) * Math.PI);
    if (cat === 'questions') rotate = 12 * Math.sin(ramp(v, .1, .7) * Math.PI);
    if (cat === 'testimonies' && card) opacity = ramp(v, .8, 1);
    return {
      opacity, transformOrigin: 'right top',
      transform: [{ translateX: lerp(0, W - (ox + ow), g) }, { translateY: lerp(0, artTop - oy, g) + extraY }, { scale: lerp(1, 1.18, g) * scale }, { rotate: `${rotate}deg` }],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: ox, top: oy, width: ow, height: oh }, style]}>{children}</Animated.View>;
}

/** Character study: the name gathers into its initial as the card lifts, then is written back out letter by letter. */
function WrittenName({ p, name }: { p: SharedValue<number>; name: string }) {
  const upper = name.toUpperCase();
  return <View style={{ position: 'absolute', right: -10, top: 92, flexDirection: 'row' }}>
    <Text style={{ fontSize: 100, lineHeight: 104, fontWeight: '900', letterSpacing: -5, color: '#3A1200' }}>{upper.charAt(0)}</Text>
    {[...upper.slice(1)].map((ch, i) => <Letter key={i} p={p} i={i} ch={ch}/>)}
  </View>;
}
function Letter({ p, i, ch }: { p: SharedValue<number>; i: number; ch: string }) {
  const style = useAnimatedStyle(() => {
    const v = p.value, gone = ramp(v, 0, .2), written = clamp(ramp(v, .55, .95) * 1.6 - i * .3);
    return { opacity: v < .5 ? 1 - gone : written, transform: [{ translateY: v < .5 ? 0 : 14 * (1 - written) }] };
  });
  return <Animated.Text style={[{ fontFamily: 'NunitoBlack', fontSize: 100, lineHeight: 104, letterSpacing: -5, color: '#FFFFFF42' }, style]}>{ch}</Animated.Text>;
}

/** The card's own words, so the first frame is the card exactly; they fade as it lifts. */
function CardFace({ p, geo, card, completed, theme, label, cover }: P & { card: FloatingScriptureCard; completed: Partial<Record<DailyStep, boolean>>; theme: ReturnType<typeof categoryTheme>; label: string; cover?: boolean }) {
  const style = useAnimatedStyle(() => ({ opacity: cover ? 1 : geo.cat === 'letters-grateful' ? 0 : 1 - ramp(p.value, 0, .22) }));
  const steps = dailyStepsFor(card.day).map(id => ALL_STEPS.find(x => x.id === id)!);
  const count = steps.filter(s => completed[s.id]).length;
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: geo.ox, top: geo.oy, width: geo.ow, height: geo.oh }, style]}>
    <View style={{ position: 'absolute', left: 22, top: 22 }}>
      <Text style={{ ...dailyText.dayNumber, color: theme.num, fontVariant: ['tabular-nums'] }}>{String(card.day).padStart(2, '0')}</Text>
      <Text numberOfLines={1} style={{ ...uiText.supporting, fontWeight: '800', color: theme.label, marginTop: 2, maxWidth: 230 }}>{label} · {card.scriptureReference}</Text>
    </View>
    <Text numberOfLines={2} style={{ position: 'absolute', left: 22, top: 96, width: 240, ...dailyText.cardTitle, color: theme.ink }}>{card.title}</Text>
    <View style={{ position: 'absolute', left: 22, top: 166, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {steps.map(s => <View key={s.id} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: completed[s.id] ? theme.accent : theme.chip }}><SFSymbol name={completed[s.id] ? 'checkmark' : s.icon} size={17} color={completed[s.id] ? theme.accentInk : theme.chipIcon}/></View>)}
      <Text style={{ ...uiText.supporting, fontWeight: '800', color: theme.label, marginLeft: 6 }}>{count} of {steps.length}</Text>
    </View>
  </Animated.View>;
}

function Fade({ p, geo, from, to, style, children }: P & { from: number; to: number; style: object; children: ReactNode }) {
  const s = useAnimatedStyle(() => ({ opacity: geo.card ? ramp(p.value, from, to) : 1 }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** Uncovers the sheet: all of it, or behind the strike (Misconception) or the rolling ring (Testimony). Slides a clip by transform, never by width. */
function SheetClip({ p, geo, children }: P & { children: ReactNode }) {
  const { W, H, card, cat } = geo;
  // The clip's left edge moves to `edge`; the content moves back by the same amount, so it stays put.
  const edge = (v: number) => {
    'worklet';
    if (card && cat === 'misconceptions') return -W * (1 - clamp(ease(ramp(v, .3, .72)) * 1.2));
    if (card && cat === 'testimonies') return Math.max(0, ringX(v, geo));
    return 0;
  };
  const clip = useAnimatedStyle(() => ({ transform: [{ translateX: edge(p.value) }] }));
  const pin = useAnimatedStyle(() => ({ transform: [{ translateX: -edge(p.value) }] }));
  return <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden' }, clip]}>
    <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, pin]}>{children}</Animated.View>
  </Animated.View>;
}
const ringX = (v: number, geo: Geo) => { 'worklet'; return lerp(geo.ox + geo.ow + 40 - 110, -130, ease(ramp(v, .04, .78))); };

/** The sheet rises (or, for a struggling letter, unfolds from its top edge like a letter opening). */
function SheetMotion({ p, geo, children }: P & { children: ReactNode }) {
  const { H, sheetTop, card, cat } = geo;
  const style = useAnimatedStyle(() => {
    if (!card) return { opacity: 1, transform: [{ translateY: (1 - out(p.value)) * 60 }] };
    if (cat === 'letters-struggling') {
      const open = back(ramp(p.value, .4, .95));
      return { opacity: ramp(p.value, .38, .46), transformOrigin: ['50%', sheetTop, 0], transform: [{ perspective: 900 }, { rotateX: `${lerp(-92, 0, open)}deg` }] };
    }
    const rise = cat === 'testimonies' ? out(ramp(p.value, 0, .3)) : out(ramp(cat === 'letters-grateful' ? ramp(p.value, .32, 1) : p.value, .42, .9));
    return { opacity: 1, transform: [{ translateY: lerp(H - sheetTop, 0, rise) }] };
  });
  return <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

/** The button. For a hard question it stays hidden until the dropped dot becomes it. */
function CtaButton({ p, geo, disabled, onPress, color, label, labelColor }: P & { disabled: boolean; onPress: () => void; color: string; label: string; labelColor: string }) {
  const style = useAnimatedStyle(() => ({ opacity: geo.card && geo.cat === 'questions' ? ramp(p.value, .84, .95) : 1 }));
  return <Animated.View style={style}><Pressable feedback="action" accessibilityRole="button" disabled={disabled} onPress={onPress} style={[buttonStyles.primary, { backgroundColor: color, opacity: disabled ? .5 : 1 }]}><Text style={[buttonStyles.label, { color: labelColor }]}>{label}</Text></Pressable></Animated.View>;
}

/** Each category's one extra moving thing, drawn over everything. */
function Extras(props: P & { card: FloatingScriptureCard; completed: Partial<Record<DailyStep, boolean>>; theme: ReturnType<typeof categoryTheme>; label: string }) {
  if (!props.geo.card) return null;
  switch (props.geo.cat) {
    case 'jesus-only': return <FullStop {...props}/>;
    case 'letters-grateful': return <CardCover {...props}/>;
    case 'deep-verse': return <LensRim {...props}/>;
    case 'misconceptions': return <StrikeBand {...props}/>;
    case 'testimonies': return <RollingRing {...props}/>;
    case 'questions': return <DroppingDot {...props}/>;
    default: return null;
  }
}

/** Jesus Only: the gold full stop grows over the screen, then melts away to show the page. Transform and opacity only. */
function FullStop({ p, geo }: P) {
  const { W, H, ox, oy, ow } = geo, R = 50, cover = Math.hypot(W, H) / R;
  const style = useAnimatedStyle(() => {
    const g = ease(ramp(p.value, .06, .4)), fade = ease(ramp(p.value, .38, .7));
    const x = lerp(ox + ow - 22, W / 2, g), y = lerp(oy + 104, H / 2, g), s = lerp(.24, cover, g);
    return { opacity: 1 - fade, transform: [{ translateX: x - R }, { translateY: y - R }, { scale: s }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 2 * R, height: 2 * R, borderRadius: R, backgroundColor: '#FFE27A' }, style]}/>;
}

/** A grateful letter: the card's front swings open on a left hinge, like a greeting card. */
function CardCover(props: P & { card: FloatingScriptureCard; completed: Partial<Record<DailyStep, boolean>>; theme: ReturnType<typeof categoryTheme>; label: string }) {
  const { p, geo } = props;
  const style = useAnimatedStyle(() => {
    const swing = ease(ramp(p.value, .02, .46));
    return { opacity: swing < .5 ? 1 : 0, transformOrigin: 'left center', transform: [{ perspective: 1200 }, { rotateY: `${-180 * swing}deg` }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: geo.ox, top: geo.oy, width: geo.ow, height: geo.oh, borderRadius: 28, overflow: 'hidden', backfaceVisibility: 'hidden', boxShadow: '0 20px 40px -20px #00000099' }, style]}>
    <CategoryGround id="letters-grateful"/>
    <CategoryGesture id="letters-grateful" title={props.card.title} text={props.card.scriptureText}/>
    <CardFace {...props} geo={{ ...geo, ox: 0, oy: 0 }} cover/>
  </Animated.View>;
}

/** Deep verse: the lens's rim grows out of the card and fades as it passes the edges. Transform only. */
function LensRim({ p, geo }: P) {
  const { W, H, ox, oy, ow } = geo, R = 60;
  const style = useAnimatedStyle(() => {
    const g = out(ramp(p.value, 0, .8)), cx = ox + ow - 80, cy = oy + 138;
    return { opacity: 1 - ramp(p.value, .35, .7), transform: [{ translateX: cx - R }, { translateY: cy - R }, { scale: lerp(.85, Math.hypot(W, H) / R, g) }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 2 * R, height: 2 * R, borderRadius: R, borderWidth: 4, borderColor: '#F7F0E6' }, style]}/>;
}

/** Misconception: a red band sweeps the screen at −12°; the walk is uncovered in its wake. */
function StrikeBand({ p, geo }: P) {
  const style = useAnimatedStyle(() => {
    const v = p.value, x = lerp(-700, geo.W + 120, ease(ramp(v, .3, .72)));
    return { opacity: v > .28 && v < .8 ? 1 - ramp(v, .7, .8) : 0, transform: [{ translateX: x }, { translateY: geo.H / 2 - 70 }, { rotate: '-12deg' }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 620, height: 140, backgroundColor: '#FF2E1F' }, style]}/>;
}

/** Testimony: the ring rolls off the card and across the screen; the walk unrolls behind it. */
function RollingRing({ p, geo }: P) {
  const style = useAnimatedStyle(() => {
    const v = p.value, cx = ringX(v, geo), g = ease(ramp(v, .04, .78)), cy = lerp(geo.oy - 30 + 110, geo.H * .54, g);
    const turn = (cx - (geo.ox + geo.ow + 40 - 110)) / 80 * 57.3;
    return { opacity: v > 0 && v < .82 ? 1 : 0, transform: [{ translateX: cx - 110 }, { translateY: cy - 110 }, { rotate: `${turn}deg` }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 220, height: 220 }, style]}>
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs><Path id="rollPath" d="M110 30a80 80 0 1 1 0 160a80 80 0 1 1 0-160"/></Defs>
      <SvgText fill="#FFFFFFD9" fontSize={17} fontWeight="900" letterSpacing={4}><TextPath href="#rollPath">STILL MOVING · STILL MOVING · STILL MOVING ·</TextPath></SvgText>
      <Circle cx={110} cy={110} r={22} fill="#FFE14D"/>
    </Svg>
  </Animated.View>;
}

/** Hard question: the dot drops out of the question mark, bounces, and stretches into the button. Transform only. */
function DroppingDot({ p, geo }: P) {
  const inset = useSafeAreaInsets(), BW = geo.W - 40, BH = 56;
  const style = useAnimatedStyle(() => {
    const v = p.value, fall = bounce(ramp(v, .12, .62)), morph = ease(ramp(v, .62, .86));
    const x0 = geo.ox + geo.ow - 80, y0 = geo.oy + 222, x1 = geo.W / 2, y1 = geo.H - inset.bottom - 16 - 28;
    const cx = lerp(lerp(x0, geo.W * .57, fall), x1, morph), cy = lerp(y0, y1, fall);
    return { opacity: v > .1 && v < .95 ? 1 : 0, transform: [{ translateX: cx - BW / 2 }, { translateY: cy - BH / 2 }, { scaleX: lerp(64, BW, morph) / BW }, { scaleY: lerp(64, BH, morph) / BH }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: BW, height: BH, borderRadius: BH / 2, backgroundColor: '#FFC21A' }, style]}/>;
}
