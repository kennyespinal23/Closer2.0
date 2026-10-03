import { useEffect, useId, useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** A layered paper object. Only transform and opacity animate; its lighting stays still. */
export function PaperEnvelope({ opened, onRevealed }: { opened: boolean; onRevealed?: () => void }) {
  const reduced = useReducedMotion(), { width } = useWindowDimensions();
  const scale = Math.min(1, (width - 64) / 300);
  const id = useId().replace(/:/g, "");
  const flap = useSharedValue(0), letter = useSharedValue(0), seal = useSharedValue(0);
  const callback = useRef(onRevealed);
  callback.current = onRevealed;
  useEffect(() => {
    if (!opened) { flap.value = 0; letter.value = 0; seal.value = 0; return; }
    seal.value = withTiming(1, { duration: reduced ? 0 : 160 });
    flap.value = reduced ? 1 : withDelay(110, withTiming(1, { duration: 480 }));
    letter.value = reduced ? 1 : withDelay(430, withSpring(1, { damping: 23, stiffness: 155, mass: .85 }));
    const timer = setTimeout(() => callback.current?.(), reduced ? 150 : 1150);
    return () => { clearTimeout(timer); cancelAnimation(flap); cancelAnimation(letter); cancelAnimation(seal); };
  }, [opened, reduced]);
  const lid = useAnimatedStyle(() => ({
    opacity: flap.value < .5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateX: `${-180 * flap.value}deg` }],
  }));
  const openLid = useAnimatedStyle(() => ({
    opacity: flap.value >= .5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateX: `${180 * (1 - flap.value)}deg` }],
  }));
  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: -116 * letter.value }, { rotate: `${-1.2 * letter.value}deg` }],
  }));
  const stamp = useAnimatedStyle(() => ({
    opacity: 1 - seal.value, transform: [{ scale: 1 + .12 * seal.value }, { translateY: -10 * seal.value }],
  }));
  return <View accessible accessibilityLabel={opened ? "An open envelope with a letter: The Lord is closer than you think." : "A folded paper envelope closed with a wax seal."} style={{ width: 300 * scale, height: 340 * scale, alignSelf: "center" }}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 300, height: 340, transform: [{ scale }], transformOrigin: "top left" }}>
      <Svg width={300} height={340} style={StyleSheet.absoluteFill}>
        <Defs><RadialGradient id={id+"shadow"}><Stop offset="0" stopColor="#332013" stopOpacity=".3"/><Stop offset="1" stopColor="#332013" stopOpacity="0"/></RadialGradient></Defs>
        <Ellipse cx={150} cy={309} rx={149} ry={26} fill={`url(#${id}shadow)`}/>
      </Svg>
      <View style={s.body}>
        <Svg width={300} height={190} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={id+"inside"} x2="0" y2="1"><Stop stopColor="#987454"/><Stop offset=".25" stopColor="#BB9770"/><Stop offset="1" stopColor="#DEC09A"/></LinearGradient>
          </Defs>
          <Rect x={1} y={3} width={298} height={186} rx={8} fill="#8F694D"/>
          <Rect x={1} y={0} width={298} height={184} rx={7} fill={`url(#${id}inside)`}/>
          <Path d="M8 1H292" stroke="#F5DFC1" strokeWidth={2}/>
        </Svg>
        <Animated.View style={[{ position: "absolute", top: -115, left: 0, width: 300, height: 115, zIndex: 0, transformOrigin: "50% 100%" }, openLid]}>
          <Svg width={300} height={115}><Path d="M1 115H299L162 14Q150 4 138 14Z" fill="#C6A27A" stroke="#B49069"/><Path d="M7 113H293L160 19Q150 9 140 19Z" fill="#D7B891"/></Svg>
        </Animated.View>
        <Animated.View style={[s.letter, sheet]}>
          <View style={s.paperEdge}/>
          <Text allowFontScaling={false} style={s.note}>CLOSER</Text>
          <View style={s.rule}/>
          <Text allowFontScaling={false} style={s.message}>The Lord is closer{String.fromCharCode(10)}than you think.</Text>
          <View style={[s.rule, { width: 38, marginTop: 16 }]}/>
        </Animated.View>
        <Svg width={300} height={190} style={{ position:"absolute",zIndex:2 }}>
          <Defs>
            <LinearGradient id={id+"left"} x1="0" y1="0" x2="1" y2="1"><Stop stopColor="#EBD1AC"/><Stop offset="1" stopColor="#C6A17B"/></LinearGradient>
            <LinearGradient id={id+"right"} x1="1" y1="0" x2="0" y2="1"><Stop stopColor="#DABD97"/><Stop offset="1" stopColor="#B68C65"/></LinearGradient>
            <LinearGradient id={id+"front"} x1="0" y1="0" x2=".2" y2="1"><Stop stopColor="#F2DCB9"/><Stop offset=".55" stopColor="#DFC19A"/><Stop offset="1" stopColor="#CDA77C"/></LinearGradient>
            <Pattern id={id+"grain"} width={19} height={23} patternUnits="userSpaceOnUse"><Path d="M2 4h2m8 8h1M5 19h2" stroke="#674B33" strokeOpacity=".09" strokeWidth=".6"/></Pattern>
          </Defs>
          <Path d="M1 5L155 111L1 184Z" fill={`url(#${id}left)`}/>
          <Path d="M299 5L145 111L299 184Z" fill={`url(#${id}right)`}/>
          <Path d="M3 185L130 83Q150 68 170 83L297 185" fill="#6E4B2B" opacity=".16"/>
          <Path d="M1 183L130 88Q150 73 170 88L299 183Q299 188 292 188H8Q1 188 1 183Z" fill={`url(#${id}front)`}/>
          <Path d="M3 181L131 89Q150 75 169 89L297 181" fill="none" stroke="#FFF1D7" strokeOpacity=".65"/>
          <Path d="M7 187H293" stroke="#A17A54" strokeOpacity=".6"/>
          <Rect x={2} y={3} width={296} height={183} rx={6} fill={`url(#${id}grain)`}/>
        </Svg>
        <Animated.View style={[s.flap, lid]}>
          <Svg width={300} height={115} style={{ backfaceVisibility: "hidden" }}>
            <Defs><LinearGradient id={id+"flap"} x1="0" y1="0" x2=".1" y2="1"><Stop stopColor="#F4DFC0"/><Stop offset="1" stopColor="#D3B18A"/></LinearGradient></Defs>
            <Path d="M2 4L137 107Q150 118 163 107L298 4Z" fill="#68492E" opacity=".2"/>
            <Path d="M1 0H299L162 101Q150 111 138 101Z" fill={`url(#${id}flap)`}/>
            <Path d="M4 1H296M5 4L138 102Q150 112 162 102" fill="none" stroke="#FFF2D8" strokeOpacity=".7"/>
          </Svg>
        </Animated.View>
        <Animated.View style={[s.seal, stamp]}>
          <Svg width={60} height={60} viewBox="0 0 60 60">
            <Defs><RadialGradient id={id+"wax"} cx=".32" cy=".22" r=".85"><Stop stopColor="#D69470"/><Stop offset=".45" stopColor="#B96646"/><Stop offset="1" stopColor="#803E2B"/></RadialGradient></Defs>
            <Circle cx={31} cy={33} r={25} fill="#56311E" opacity=".28"/>
            <Path d="M30 3Q38 1 43 9Q53 10 53 20Q61 29 54 37Q54 48 44 51Q36 59 27 55Q15 57 10 47Q0 43 5 31Q1 20 10 15Q14 3 24 6Z" fill={`url(#${id}wax)`}/>
            <Circle cx={30} cy={30} r={19} fill="none" stroke="#E3A384" strokeOpacity=".6"/>
            <Circle cx={30} cy={31} r={17} fill="none" stroke="#743923" strokeOpacity=".45"/>
            <Path d="M30 39L20 29C13 20 25 16 30 24C35 16 47 20 40 29Z" fill="#733A28" opacity=".7"/>
            <Path d="M30 37L20 27C15 20 25 17 30 24C35 17 45 20 40 27Z" fill="#F0C8A4"/>
          </Svg>
        </Animated.View>
      </View>
    </View>
  </View>;
}
const s=StyleSheet.create({
  body:{position:"absolute",top:126,left:0,width:300,height:190},
  letter:{position:"absolute",zIndex:1,top:9,left:16,width:268,height:166,borderRadius:3,backgroundColor:"#FFFAED",borderWidth:1,borderColor:"#E0CFB4",padding:20,alignItems:"center",boxShadow:"0 5px 12px #4A2D1930"},
  paperEdge:{position:"absolute",left:2,right:2,bottom:-3,height:2,backgroundColor:"#DBC9AC",borderBottomWidth:1,borderBottomColor:"#FFF7E7"},
  note:{fontSize:10,fontWeight:"600",letterSpacing:1,color:"#8B7058"},
  rule:{width:180,height:1,backgroundColor:"#DDCBB0",marginTop:12,marginBottom:8},
  message:{fontSize:21,lineHeight:27,fontWeight:"600",color:"#463226",textAlign:"center"},
  flap:{position:"absolute",zIndex:4,top:0,left:0,width:300,height:115,transformOrigin:"50% 0%"},
  seal:{position:"absolute",zIndex:5,top:70,left:120,width:60,height:60},
});
