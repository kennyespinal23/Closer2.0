import { useEffect, useRef, useState, type RefObject } from "react";
import { AccessibilityInfo, BackHandler, Modal, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { ReaderMomentCardBox } from "./ReaderMomentCardBox";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";
import { useBibleMomentCollection, unlockBibleMomentWithRewards } from "@/state/bibleMoments";
import { type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { systemText } from "@/lib/typography";
import { SFSymbol } from "@/components/Symbol";
import { MomentCategoryReward } from "@/components/MomentCategoryReward";
import { BibleMomentReveal, type BibleRevealRequest } from "./BibleMomentReveal";

export function ReaderMomentExperience({ moment, onFinish, pocketRef, showcase, onCloseShowcase, bookId, onCollected }: {
  origin: { x: number; y: number; width: number; height: number } | null;
  moment: BibleMoment | null; onFinish: () => void; pocketRef: RefObject<View | null>;
  showcase: boolean; onCloseShowcase: () => void; bookId: string; onCollected: () => void;
}) {
  const colors = useColors(), insets = useSafeAreaInsets();
  const [queue,setQueue] = useState<BibleRevealRequest[]>([]);
  const [rewards,setRewards] = useState<MomentCategory[]>([]);
  const [saveError,setSaveError] = useState(false), [attempt,setAttempt] = useState(0);
  const alive=useRef(0);
  useEffect(()=>{
    if(!moment)return;
    const generation=++alive.current;
    setSaveError(false);
    void unlockBibleMomentWithRewards(moment.id).then(result=>{
      if(generation!==alive.current)return;
      if(result.status==='existing'){setQueue([{kind:'moment',moment}]);return;}
      setRewards(result.categories);
      setQueue([{kind:'moment',moment},...(result.bookCompleted?[{kind:'silver' as const,bookId:moment.bookId}]:[])]);
      onCollected();
      AccessibilityInfo.announceForAccessibility('Bible Moment saved to your collection');
    }).catch(()=>{if(generation===alive.current)setSaveError(true);});
    return()=>{alive.current++;};
  },[moment?.id,attempt]);
  useEffect(()=>{
    if(!showcase)return;
    const handler=BackHandler.addEventListener('hardwareBackPress',()=>{onCloseShowcase();return true;});
    return()=>handler.remove();
  },[showcase,onCloseShowcase]);
  const finishReveal=()=>{if(queue.length<=1)onFinish();setQueue(q=>q.slice(1));};
  const closeCurrent=()=>{if(queue.length)finishReveal();else if(moment)onFinish();else setRewards([]);};
  // One native presenter for saving, the reveal queue, existing cards and rewards.
  // Swapping Modal hosts while a save resolves races UIKit presentation/dismissal.
  if(queue.length || moment || rewards.length)return <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={closeCurrent}>
    {queue.length?<BibleMomentReveal embedded autoPlay={queue[0].kind==='moment'} key={queue[0].kind+(queue[0].moment?.id??'')} request={queue[0]} onClose={finishReveal}/>
    :moment?<View style={{flex:1,backgroundColor:'#211d18',justifyContent:'center',padding:32,gap:20}}><Text style={{...systemText.title2,color:'#fff5e8',textAlign:'center'}}>{saveError?'Couldn’t save this Moment':'Keeping your Moment…'}</Text>{saveError&&<Pressable accessibilityRole="button" onPress={()=>setAttempt(a=>a+1)} style={{padding:16,backgroundColor:'#fff2db',borderRadius:24,alignItems:'center'}}><Text>Try again</Text></Pressable>}<Pressable accessibilityRole="button" onPress={onFinish} style={{minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff5e8'}}>Back to reading</Text></Pressable></View>
    :<View style={{flex:1,backgroundColor:colors.surface,paddingTop:insets.top+24,paddingHorizontal:24,paddingBottom:insets.bottom+24}}><ScrollView>{rewards.map(category=><MomentCategoryReward key={category} category={category} expanded/>)}</ScrollView><Pressable accessibilityRole="button" onPress={()=>setRewards([])} style={{minHeight:48,alignItems:'center',justifyContent:'center'}}><Text style={{...systemText.headline,color:colors.ink}}>Done</Text></Pressable></View>}
  </Modal>;
  return showcase?<View accessibilityViewIsModal style={{position:"absolute",inset:0,zIndex:210,backgroundColor:"#00000077"}}><ReaderMomentCardBox bookId={bookId} pocketRef={pocketRef} onClose={onCloseShowcase}/></View>:null;
}

export function ReaderMomentPocket({ onPress, arrival, collecting }: { onPress: () => void; arrival: number; collecting?: boolean }) {
  const colors = useColors();
  const { ids } = useBibleMomentCollection();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [displayCount, setDisplayCount] = useState(ids.length);
  useEffect(() => { if (!collecting) setDisplayCount(ids.length); }, [ids.length, collecting, arrival]);
  useEffect(() => { if (arrival && !reduced) scale.value = withSequence(withTiming(1.25, { duration: 180 }), withTiming(1, { duration: 320 })); }, [arrival, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${(scale.value - 1) * -24}deg` }] }));
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open your Bible Moments card box, ${displayCount} collected`} onPress={onPress} style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}>
    <Animated.View style={style}><Svg width={26} height={28} viewBox="0 0 26 28"><Rect x="3" y="4" width="17" height="22" rx="3" fill="#FFFBF4" stroke="#2A1F18" strokeWidth="2" transform="rotate(-10 11 15)" /><Rect x="8" y="2" width="17" height="22" rx="3" fill="#FF5A36" stroke="#2A1F18" strokeWidth="2" transform="rotate(8 16 13)" /></Svg>{displayCount > 0 && <View style={{ position: "absolute", top: -7, right: -9, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, backgroundColor: "#52B3F6", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#12304A", fontSize: 10, fontWeight: "700" }}>{displayCount}</Text></View>}</Animated.View>
  </Pressable>;
}

export function ReaderRibbon() {
  const reduced = useReducedMotion();
  const swing = useSharedValue(0);
  useEffect(() => { swing.value = reduced ? 0 : withDelay(1200, withSequence(withTiming(12, { duration: 350 }), withTiming(-6, { duration: 550 }), withTiming(3, { duration: 550 }), withTiming(0, { duration: 750 }))); }, [reduced]);
  const style = useAnimatedStyle(() => ({ transformOrigin: "top", transform: [{ rotate: `${swing.value}deg` }] }));
  return <Animated.View pointerEvents="none" accessible={false} style={[{ position: "absolute", top: -4, right: 34, width: 14, height: 92 }, style]}><Svg width="14" height="92" viewBox="0 0 14 92"><Path d="M0 0H14V92L7 79L0 92Z" fill="#FF5A36" /><Path d="M2 0V87M12 0V87" stroke="#E0431E" strokeWidth="1" /></Svg></Animated.View>;
}
