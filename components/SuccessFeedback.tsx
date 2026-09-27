import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { SFSymbol } from "./Symbol";
export const SUCCESS_GREEN = "#248A3D";
export const SUCCESS_BRIGHT = "#34C759";
export function SuccessMark({ size = 30, delay = 0 }: { size?: number; delay?: number }) {
  const reduced = useReducedMotion(), p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { p.value = reduced ? 1 : withDelay(delay, withSpring(1, { damping: 13, stiffness: 230 })); }, [reduced,delay]);
  const style = useAnimatedStyle(()=>({opacity:p.value,transform:[{scale:.45+.55*p.value},{rotate:`${-18*(1-p.value)}deg`}]}));
  return <Animated.View style={[{width:size,height:size,borderRadius:size/2,backgroundColor:SUCCESS_GREEN,alignItems:"center",justifyContent:"center"},style]}><SFSymbol name="checkmark" size={size*.5} color="#FFFFFF" weight="bold"/></Animated.View>;
}
export function SuccessBurst() {
  const reduced = useReducedMotion();
  if(reduced) return null;
  return <View pointerEvents="none" style={{position:"absolute",right:30,top:"50%",width:1,height:1,zIndex:10}}>{Array.from({length:16},(_,i)=><Bit key={i} index={i}/>)}</View>;
}
function Bit({index}:{index:number}) {
  const p=useSharedValue(0), angle=index*Math.PI*2/16, distance=50+(index%4)*14;
  useEffect(()=>{p.value=withTiming(1,{duration:900});},[]);
  const style=useAnimatedStyle(()=>({opacity:p.value<.65?1:(1-p.value)/.35,transform:[{translateX:Math.cos(angle)*distance*p.value},{translateY:Math.sin(angle)*distance*p.value+65*p.value*p.value-20*p.value},{rotate:`${index*47*p.value}deg`}]}));
  return <Animated.View style={[{position:"absolute",width:6,height:9,borderRadius:2,backgroundColor:["#34C759","#52B3F6","#E8A93B","#FFF4DD","#3F7F72"][index%5]},style]}/>;
}
