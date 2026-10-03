import { useEffect, useRef } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, useAnimatedStyle, useAnimatedScrollHandler, useSharedValue, withDelay, withSpring, withTiming, useAnimatedProps, type SharedValue } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { BOOKS } from "@/constants/books";
import { MomentCollectibleFront } from "./MomentCollectible";
import { BookCover } from "./BookCover";
import Svg, { Circle } from "react-native-svg";
import { AchievementMedal } from "./AchievementReveal";
import { SFSymbol, type SFSymbolName } from "./Symbol";

const CREATION = BIBLE_MOMENTS.find(m => m.id === "creation")!;
const CARDS = [BIBLE_MOMENTS.find(m => m.bookId === "john")!, BIBLE_MOMENTS.find(m => m.bookId === "matthew")!, CREATION];
const GENESIS = BOOKS.find(b => b.id === "genesis")!;

function FanCard({ index, collected, width }: { index: number; collected: boolean; width: number }) {
  const reduced = useReducedMotion(), arrival = useSharedValue(reduced ? 1 : 0), saved = useSharedValue(collected ? 1 : 0);
  useEffect(() => {
    arrival.value = reduced ? 1 : withDelay(index * 85, withSpring(1, { damping: 19, stiffness: 170 }));
    return () => cancelAnimation(arrival);
  }, [reduced]);
  useEffect(() => {
    saved.value = reduced ? Number(collected) : withSpring(Number(collected), { damping: 17, stiffness: 210 });
    return () => cancelAnimation(saved);
  }, [collected, reduced]);
  const side = index === 0 ? -1 : index === 1 ? 1 : 0;
  const style = useAnimatedStyle(() => ({
    opacity: arrival.value,
    transform: [
      { translateX: side * width * .29 * arrival.value * (1 - saved.value * .22) },
      { translateY: (1 - arrival.value) * 28 + (side ? 12 : -saved.value * 9) },
      { rotate: `${side * 12 * arrival.value * (1 - saved.value * .3)}deg` },
      { scale: (.86 + arrival.value * .14) * (side ? .92 : 1 + saved.value * .025) },
    ],
  }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: "absolute", width, height: width * 1.35, borderRadius: 22, boxShadow: "0 12px 22px #160D0733", zIndex: index }, style]}><MomentCollectibleFront moment={CARDS[index]} /></Animated.View>;
}

/** Real collectible artwork, with one featured card and a brief, finite fan-out. */
export function OnboardingMomentFan({ collected }: { collected: boolean }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(205, (width - 68) / 1.6);
  return <View accessible accessibilityLabel={`Bible Moment cards. In the beginning, Genesis 1:1${collected ? ", collected" : ""}.`} style={{ height: cardWidth * 1.35 + 48, alignItems: "center", justifyContent: "center" }}>
    {CARDS.map((m, index) => <FanCard key={m.id} index={index} width={cardWidth} collected={collected}/>)}
    {collected && <SavedMomentRing/>}
  </View>;
}

/** One continuous object expands from the book cover into a small reader. */
export function OnboardingReadingPreview({ expanded, onOpen }: { expanded: boolean; onOpen: () => void }) {
  const dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const available = Math.min(width - 56, 420), p = useSharedValue(expanded ? 1 : 0);
  const ink = dark ? "#F8EDDD" : "#30251E", muted = dark ? "#C6B7A5" : "#796957";
  const expandedHeight = 340 + Math.max(0, fontScale - 1) * 180;
  useEffect(() => {
    p.value = reduced ? Number(expanded) : withSpring(Number(expanded), { damping: 25, stiffness: 170, overshootClamping: true });
    return () => cancelAnimation(p);
  }, [expanded, reduced]);
  const shell = useAnimatedStyle(() => ({ width: 178 + (available - 178) * p.value, height: 238 + (expandedHeight - 238) * p.value, borderRadius: 12 + 12 * p.value, transform: [{ rotate: `${-5 * (1-p.value)}deg` }] }));
  const cover = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - p.value * 2.5), transform: [{ scale: 1 + p.value * .14 }] }));
  const reader = useAnimatedStyle(() => ({ opacity: Math.max(0, (p.value - .3) / .7), transform: [{ translateY: 14 * (1-p.value) }] }));
  return <View style={{ alignItems: "center", minHeight: 280, paddingVertical: 12 }}>
    <Animated.View style={[{ overflow: "hidden", backgroundColor: dark ? "#302920" : "#FFFAF1", borderWidth: 1, borderColor: dark ? "#6A5844" : "#D9C5AA", boxShadow: "0 16px 28px #160D0726" }, shell]}>
      <Animated.View pointerEvents={expanded ? "none" : "auto"} accessibilityElementsHidden={expanded} importantForAccessibility={expanded ? "no-hide-descendants" : "auto"} style={[{ position: "absolute", inset: 0 }, cover]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Preview reading Genesis" onPress={onOpen} style={{ flex: 1 }}><BookCover book={GENESIS} variant="hero" style={{ width: "100%", height: "100%" }}/></Pressable>
      </Animated.View>
      <Animated.View pointerEvents="none" accessibilityElementsHidden={!expanded} importantForAccessibility={!expanded ? "no-hide-descendants" : "auto"} style={[{ padding: 23, gap: 21 }, reader]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: dark ? "#FFFFFF15" : "#30251E15" }}><Text style={{ color: ink, fontSize: 17, fontWeight: "600" }}>Genesis 1</Text><Text style={{ color: muted, fontSize: 13 }}>KJV · Preview</Text></View>
        <Text style={{ color: muted, fontSize: 13 }}>The beginning</Text>
        <Text style={{ color: ink, fontSize: 23, lineHeight: 35 }}>In the beginning God created the heaven and the earth.</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingTop: 12 }}><SFSymbol name="sparkles" size={20} color={dark ? "#E9BB72" : "#80531B"}/><Text style={{ color: muted, fontSize: 15, flex: 1 }}>Discover Moments as you read.</Text></View>
      </Animated.View>
    </Animated.View>
  </View>;
}

/** A swipeable badge showcase: the centered medal stays prominent, neighbors recede. */
export function OnboardingBadgeCarousel() {
  const { width } = useWindowDimensions(), reduced = useReducedMotion();
  const dark = useResolvedScheme() === "dark", position = useSharedValue(0);
  const carousel = useRef<Animated.ScrollView>(null);
  const viewport = Math.min(width - 56, 420), itemWidth = Math.min(205, viewport * .68);
  const scroll = useAnimatedScrollHandler(event => { position.value = event.contentOffset.x / itemWidth; });
  return <View style={{ height: 285 }}>
    <Animated.ScrollView ref={carousel} horizontal showsHorizontalScrollIndicator={false} snapToInterval={itemWidth} decelerationRate="fast" disableIntervalMomentum onScroll={scroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: (viewport-itemWidth)/2, alignItems: "center" }} style={{ width: viewport, alignSelf: "center" }}>
      {([{ title: "First Letter", icon: "envelope" }, { title: "Seven Days", icon: "sun.max" }, { title: "First Moment", icon: "sparkles" }] as const).map((badge,index) => <ShowcaseBadge key={badge.title} index={index} onPress={() => carousel.current?.scrollTo({ x: index * itemWidth, animated: !reduced })} position={position} width={itemWidth} reduced={reduced} title={badge.title} icon={badge.icon} color={dark ? "#F6F0E6" : "#30251E"}/>)}
    </Animated.ScrollView>
  </View>;
}
function ShowcaseBadge({ index, position, width, reduced, title, icon, color, onPress }: { onPress: () => void; index: number; position: SharedValue<number>; width: number; reduced: boolean; title: string; icon: SFSymbolName; color: string }) {
  const style = useAnimatedStyle(() => {
    const distance = Math.min(1, Math.abs(position.value-index));
    return { opacity: 1-distance*.45, transform: [{ scale: reduced ? 1 : 1-distance*.18 }, { translateY: reduced ? 0 : distance*14 }] };
  });
  return <Animated.View style={[{ width }, style]}><Pressable accessibilityRole="button" accessibilityLabel={`${title}, achievement preview`} onPress={onPress} style={{ alignItems: "center", gap: 18, paddingVertical: 8 }}><AchievementMedal achievementId={index === 0 ? "letters-1" : index === 1 ? "streak-7" : "moment"} size={width*.8} icon={icon}/><Text style={{ color, fontSize: 17, fontWeight: "600", textAlign: "center" }}>{title}</Text></Pressable></Animated.View>;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function SavedMomentRing() {
  const reduced = useReducedMotion(), draw = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { draw.value = reduced ? 1 : withTiming(1, { duration: 500 }); return () => cancelAnimation(draw); }, [reduced]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: 126 * (1-draw.value) }));
  return <View pointerEvents="none" style={{ position: "absolute", bottom: 2, right: "19%", zIndex: 4, width: 48, height: 48, borderRadius: 24, backgroundColor: "#24663A", alignItems: "center", justifyContent: "center" }}>
    <Svg width="48" height="48" style={{ position: "absolute" }}><AnimatedCircle cx="24" cy="24" r="20" fill="none" stroke="#CFF4D4" strokeWidth="2" strokeDasharray="126" animatedProps={ring} rotation="-90" origin="24,24"/></Svg>
    <SFSymbol name="checkmark" color="#FFFFFF" weight="bold" size={21}/>
  </View>;
}
