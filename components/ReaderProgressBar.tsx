import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** Group long chapters so divisions stay legible rather than becoming hairlines. */
export function ReaderProgressBar({progress,total,color,track}:{progress:number;total:number;color:string;track:string}) {
  const reduced=useReducedMotion();
  const count=Math.max(1,Math.min(20,total));
  return <View style={{height:8,flexDirection:'row',gap:3}}>{Array.from({length:count},(_,i)=><Segment key={i} reduced={reduced} fill={Math.max(0,Math.min(1,progress*count-i))} color={color} track={track}/>)}</View>;
}
function Segment({fill,color,track,reduced}:{fill:number;color:string;track:string;reduced:boolean}) {
  const value=useSharedValue(fill);
  useEffect(()=>{value.value=withTiming(fill,{duration:reduced?0:250});},[fill,reduced,value]);
  const style=useAnimatedStyle(()=>({width:`${value.value*100}%` as `${number}%`}));
  return <View style={{flex:1,height:8,borderRadius:4,overflow:'hidden',backgroundColor:track}}><Animated.View style={[{height:8,borderRadius:4,backgroundColor:color},style]}/></View>;
}
