import { useEffect, useRef, useId, useState, type ReactNode } from "react";
import { AppState, Pressable, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from "react-native";
import Animated, { cancelAnimation, Easing, runOnJS, scrollTo, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Path } from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import * as haptics from "@/lib/haptics";

const BOOK_LIST = [
  { id: "genesis", title: "Genesis", color: "#BC6448", path: "M24 5C10 5 7 16 10 26Q15 36 24 31Q37 31 38 20Q38 5 24 5M24 32V44M17 44H31" },
  { id: "psalms", title: "Psalms", color: "#AE7F36", path: "M13 7L17 39Q24 46 32 38L36 7M17 14H32M20 14V36M25 14V39M30 14V36" },
  { id: "john", title: "John", color: "#9B5650", path: "M24 5V43M10 17H38" },
  { id: "romans", title: "Romans", color: "#547D70", path: "M12 8H36V40H12ZM18 16H30M18 23H30M18 30H27" },
  { id: "proverbs", title: "Proverbs", color: "#7C687F", path: "M10 9Q20 4 24 11Q32 4 39 9V39Q30 35 24 41Q18 35 10 39ZM24 11V41" },
  { id: "revelation", title: "Revelation", color: "#AC884D", path: "M8 15L17 23L24 8L31 23L40 15L36 36H12ZM12 42H36" },
];
/** Matches the sample's lateral spine lighting, rather than a top-to-bottom wash. */
function BookMaterial({ colors, locations, children, style }: { colors: string[]; locations?: number[]; children?: ReactNode; style: ViewStyle }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [size,setSize] = useState({ width: 0, height: 0 });
  return <View onLayout={event => { const {width,height} = event.nativeEvent.layout; setSize(previous => previous.width === width && previous.height === height ? previous : {width,height}); }} style={[style, { overflow: "hidden" }]}><Svg width={size.width} height={size.height} pointerEvents="none" style={StyleSheet.absoluteFill}><Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">{colors.map((color,i)=><Stop key={i} offset={locations?.[i] ?? i/(colors.length-1)} stopColor={color.length === 9 ? color.slice(0,7) : color} stopOpacity={color.length === 9 ? parseInt(color.slice(7),16)/255 : 1}/>)}</LinearGradient></Defs><Rect width={size.width} height={size.height} fill={`url(#${id})`}/></Svg>{children}</View>;
}
export function BibleRevealTitle({ opened }: { opened: boolean }) {
  const dark = useResolvedScheme() === "dark", reduced = useReducedMotion(), p = useSharedValue(opened ? 0 : 1);
  useEffect(()=>{ p.value = reduced ? 1 : withDelay(250,withSpring(1,SPRING)); return ()=>cancelAnimation(p); },[opened,reduced]);
  const motion = useAnimatedStyle(()=>({ transform: [{ rotate: `${-3*p.value}deg` }, { scale: .7+.3*p.value }] }));
  const text = { color: dark ? "#FFF5E6" : "#32271E", fontSize: 33, lineHeight: 38, letterSpacing: -1, fontWeight: "700" as const, textAlign: "center" as const };
  return opened ? <View accessible accessibilityRole="header" accessibilityLabel="The whole Bible. FREE for you." style={{ alignItems: "center", gap: 4 }}><Text style={text}>The whole Bible.</Text><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}><Animated.View style={[{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, backgroundColor: dark ? "#D9EDB7" : "#CCE3AA", boxShadow: "0 3px 0 #76975430" },motion]}><Text style={[text,{ color: "#294A2E" }]}>FREE</Text></Animated.View><Text style={text}>for you.</Text></View></View> : <Text accessibilityRole="header" style={text}>{"A whole world\nwaiting for you."}</Text>;
}
const SPRING = { damping: 18, stiffness: 150 };

export function HoldToUnwrap({ onUnwrap }: { onUnwrap: () => void }) {
  const dark = useResolvedScheme() === "dark", progress = useSharedValue(0), completed = useRef(false), holding = useRef(false), attempt = useRef(0), mounted = useRef(true), width = useSharedValue(0);
  const complete = () => { if (!mounted.current || completed.current) return; completed.current = true; haptics.success(); onUnwrap(); };
  const completeHold = (token: number) => { if (holding.current && token === attempt.current) complete(); };
  const cancel = () => { attempt.current++; holding.current = false; cancelAnimation(progress); progress.value = 0; };
  useEffect(() => { mounted.current = true; const sub = AppState.addEventListener("change", state => { if (state !== "active") cancel(); }); return () => { mounted.current = false; holding.current = false; sub.remove(); cancelAnimation(progress); }; }, []);
  const fill = useAnimatedStyle(() => ({ transform: [{ translateX: -(1-progress.value)*width.value }] }));
  return <Pressable accessibilityRole="button" accessibilityLabel="Hold to unwrap your Bible" accessibilityHint="Hold for one second. Double-tap with VoiceOver to unwrap." accessibilityActions={[{ name: "activate", label: "Unwrap your Bible" }]} onAccessibilityTap={complete} onAccessibilityAction={event => { if (event.nativeEvent.actionName === "activate") complete(); }} onLayout={e => { width.value = e.nativeEvent.layout.width; }} onPressIn={() => { if (completed.current) return; holding.current = true; const token = ++attempt.current; haptics.soft(); progress.value = withTiming(1, { duration: 1100, easing: Easing.linear }, finished => { if (finished) runOnJS(completeHold)(token); }); }} onPressOut={cancel} style={[styles.hold, { backgroundColor: dark ? "#FFF5E6" : "#32271E" }]}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? "#ABC79B" : "#36563A" }, fill]}/>
    <Text style={{ color: dark ? "#32271E" : "#FFF9F0", fontSize: 17, fontWeight: "600", textAlign: "center" }}>Hold to unwrap your Bible</Text>
  </Pressable>;
}

function CarouselBook({ index, opened, reduced, cardWidth }: { index: number; opened: boolean; reduced: boolean; cardWidth: number }) {
  const cardHeight = cardWidth * 205 / 142;
  const p = useSharedValue(reduced && opened ? 1 : 0);
  useEffect(() => { p.value = reduced ? Number(opened) : opened ? withDelay(900 + index*65, withSpring(1, SPRING)) : 0; return () => cancelAnimation(p); }, [opened, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1,p.value), transform: [{ translateY: reduced ? 0 : (1-p.value)*50 }, { rotate: `${(index%2 ? 4 : -4) + (reduced ? 0 : (1-p.value)*12)}deg` }, { scale: reduced ? 1 : .65+.35*p.value }] }));
  return <Animated.View shouldRasterizeIOS style={[{ width: cardWidth, height: cardHeight, marginRight: 23, boxShadow: "8px 16px 22px #30231930", borderRadius: 10 }, style]}><View style={{ position: "absolute", top: 4, right: -5, bottom: -3, left: 5, backgroundColor: "#E9DDC1", borderRadius: 9 }}/><BookMaterial colors={["#00000055", "#FFFFFF00", "#FFFFFF25", "#FFFFFF00"]} locations={[0,.12,.15,.27]} style={{ width: cardWidth, height: cardHeight, borderRadius: 10, backgroundColor: BOOK_LIST[index].color, alignItems: "center", justifyContent: "center", gap: 25, borderRightWidth: 1, borderColor: "#00000044" }}><View style={{ position: "absolute", top: 12, bottom: 12, left: 18, right: 11, borderWidth: 1, borderColor: "#FFFFFF33", borderRadius: 6 }}/><Svg width={cardWidth * .34} height={cardWidth * .34} viewBox="0 0 48 48"><Path d={BOOK_LIST[index].path} fill="none" stroke="#FFF3D7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg><Text style={{ color: "#FFF3D7", fontSize: cardWidth * .14, fontWeight: "600", letterSpacing: -.4 }}>{BOOK_LIST[index].title}</Text></BookMaterial></Animated.View>;
}

export function BibleGiftReveal({ opened }: { opened: boolean }) {
  const reduced = useReducedMotion(), dark = useResolvedScheme() === "dark", { width } = useWindowDimensions();
  const available = Math.min(width - 16, 520), cardWidth = Math.min(190, width * .47), heroScale = Math.min(1.38, (width - 72) / 225), artHeight = Math.min(420, width * .9 + 40), spotlightSize = Math.min(width + 24, 470), arrival = useSharedValue(reduced ? 1 : 0), ribbon = useSharedValue(0), cover = useSharedValue(0), departure = useSharedValue(0), float = useSharedValue(0), offset = useSharedValue(0);
  const tiltX = useSharedValue(0), tiltY = useSharedValue(0);
  const turn = Gesture.Pan().enabled(!opened && !reduced).onUpdate(event => { tiltX.value = Math.max(-18, Math.min(18, -event.translationY / 4)); tiltY.value = Math.max(-28, Math.min(28, event.translationX / 3)); }).onFinalize(() => { tiltX.value = withSpring(0, SPRING); tiltY.value = withSpring(0, SPRING); });
  const scroller = useAnimatedRef<Animated.ScrollView>();
  useDerivedValue(() => { scrollTo(scroller, offset.value, 0, false); });
  useEffect(() => {
    arrival.value = reduced ? 1 : withSpring(1, { damping: 15, stiffness: 110 });
    float.value = !reduced && !opened ? withDelay(1000, withRepeat(withSequence(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })), -1)) : 0;
    ribbon.value = reduced ? Number(opened) : withTiming(Number(opened), { duration: 300 });
    cover.value = reduced ? Number(opened) : withDelay(opened ? 240 : 0, withTiming(Number(opened), { duration: 650, easing: Easing.out(Easing.cubic) }));
    departure.value = reduced ? Number(opened) : withDelay(opened ? 800 : 0, withTiming(Number(opened), { duration: 320 }));
    offset.value = 0;
    if (opened && !reduced) offset.value = withDelay(1800, withTiming((cardWidth + 23) * 4, { duration: 11000, easing: Easing.inOut(Easing.cubic) }));
    const subscription = AppState.addEventListener("change", state => { if (state !== "active") { cancelAnimation(float); cancelAnimation(offset); } });
    return () => { subscription.remove(); [arrival,ribbon,cover,departure,float,offset].forEach(cancelAnimation); };
  }, [opened, reduced, cardWidth]);
  const giftStyle = useAnimatedStyle(() => ({ opacity: Math.min(1,arrival.value)*(1-departure.value), transform: [{ perspective: 900 }, { translateY: reduced ? 0 : (1-arrival.value)*65 - float.value*6 + departure.value*45 }, { rotateX: `${reduced ? 0 : 12+(1-arrival.value)*20+tiltX.value}deg` }, { rotateY: `${reduced ? 0 : -23+float.value*5+tiltY.value}deg` }, { rotateZ: "-5deg" }, { scale: heroScale * (reduced ? 1 : .65+.35*arrival.value-.2*departure.value) }] }));
  const pages = useAnimatedStyle(() => ({ opacity: Math.min(1, cover.value * 4) }));
  const lid = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${-145*cover.value}deg` }], opacity: 1-departure.value }));
  const ribbonStyle = useAnimatedStyle(() => ({ opacity: 1-ribbon.value, transform: [{ translateY: -65*ribbon.value }, { rotate: `${-20*ribbon.value}deg` }] }));
  const shadow = useAnimatedStyle(() => ({ opacity: .22*(1-departure.value), transform: [{ scale: 1-float.value*.08 }] }));
  return <View style={{ height: artHeight, alignItems: "center" }}>
    <Svg pointerEvents="none" width={spotlightSize} height={spotlightSize} style={{ position: "absolute", top: -24 }}><Defs><RadialGradient id="giftHalo" cx="50%" cy="45%" rx="50%" ry="50%"><Stop offset="0" stopColor={dark ? "#E1BF74" : "#E3AF5B"} stopOpacity={dark ? .5 : .4}/><Stop offset=".42" stopColor="#DBB570" stopOpacity={dark ? .22 : .2}/><Stop offset="1" stopColor="#DBB570" stopOpacity={0}/></RadialGradient></Defs><Rect width={spotlightSize} height={spotlightSize} fill="url(#giftHalo)"/></Svg>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 325, width: 205, height: 18, borderRadius: 80, backgroundColor: "transparent", boxShadow: "0 3px 18px 6px #26190E44" }, shadow]}/>
    <View collapsable={false} style={{ position: "absolute", top: 62, width: 170, height: 233, zIndex: 1 }}><GestureDetector gesture={turn}><Animated.View accessibilityElementsHidden={opened} importantForAccessibility={opened ? "no-hide-descendants" : "auto"} accessible accessibilityLabel="A dimensional Bible wrapped in a green gift ribbon" style={[{ position: "absolute", top: 0, width: 170, height: 233 }, giftStyle]}>
      <View style={{ ...StyleSheet.absoluteFillObject, left: 7, right: -12, top: 5, bottom: -7, borderRadius: 12, backgroundColor: "#D4C7A7", borderRightWidth: 4, borderBottomWidth: 5, borderColor: "#274636", boxShadow: "12px 20px 28px #24190D33" }}/>
      <Animated.View style={[StyleSheet.absoluteFill, pages]}><ReaderMaterialGradient colors={["#B3A78B", "#FFF7DF", "#ECE1C2"]} style={{ ...StyleSheet.absoluteFillObject, padding: 24, borderRadius: 10 }}><Text style={{ marginTop: 25, color: "#8A795A", fontSize: 16, fontFamily: "Georgia" }}>In the beginning</Text>{[0,1,2,3].map(i=><View key={i} style={{ marginTop: 13, height: 2, backgroundColor: "#B4A78944" }}/>)}</ReaderMaterialGradient></Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: "left center", backfaceVisibility: "hidden", borderRadius: 12 }, lid]}><BookMaterial locations={[0,.06,.12,.65,1]} colors={["#193F32", "#598068", "#294F3D", "#426C52", "#32503E"]} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#97AE7D" }}><View style={{ position: "absolute", top: 15, bottom: 15, left: 20, right: 13, borderWidth: 1, borderColor: "#C7C29966", borderRadius: 7 }}/><Text style={{ position: "absolute", top: 31, left: 26, color: "#E8D6AD", fontSize: 25, lineHeight: 27, fontWeight: "600" }}>{"Holy\nBible"}</Text><View style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, backgroundColor: "#D4DEAA35" }}/></BookMaterial></Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, ribbonStyle]}><BookMaterial colors={["#B0BD8C", "#E0E2BB", "#99AA7D"]} style={{ position: "absolute", top: -4, bottom: -5, right: 34, width: 25 }}/><ReaderMaterialGradient colors={["#ACBA8A", "#D5DCB0", "#AAB986"]} style={{ position: "absolute", left: -4, right: -4, top: 132, height: 24 }}/><Svg width={91} height={66} viewBox="0 0 100 70" style={{ position: "absolute", top: 104, right: 2 }}><Path d="M50 40C-8 37 10-16 50 40C100-14 112 39 50 40M50 40L32 66M50 40L72 64" fill="none" stroke="#D7DFB6" strokeWidth={10} strokeLinecap="round"/></Svg></Animated.View>
    </Animated.View></GestureDetector></View>
    <Animated.ScrollView ref={scroller} pointerEvents={opened ? "auto" : "none"} accessibilityElementsHidden={!opened} importantForAccessibility={opened ? "auto" : "no-hide-descendants"} horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 23} decelerationRate="fast" onTouchStart={()=>cancelAnimation(offset)} onScrollBeginDrag={()=>cancelAnimation(offset)} accessibilityLabel="Explore Bible books" style={{ width: available, height: artHeight - 34, opacity: opened ? 1 : 0 }} contentContainerStyle={{ paddingHorizontal: (available-cardWidth)/2, paddingTop: 46, paddingBottom: 40 }}>
      {BOOK_LIST.map((book,index)=><CarouselBook key={book.id} index={index} opened={opened} reduced={reduced} cardWidth={cardWidth}/>)}
    </Animated.ScrollView>
    <Text style={{ position: "absolute", bottom: 8, color: dark ? "#C3B59C" : "#796A56", fontSize: 13 }}>{opened ? "Swipe to explore" : "A gift for you. Hold below to unwrap."}</Text>
  </View>;
}
const styles = StyleSheet.create({ hold: { minHeight: 56, padding: 16, borderRadius: 28, borderCurve: "continuous", overflow: "hidden", alignItems: "center", justifyContent: "center" } });
