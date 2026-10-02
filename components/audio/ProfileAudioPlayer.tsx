import Animated, { FadeInDown } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Host, Slider } from '@expo/ui/swift-ui';
import { ReaderSheet } from '../ReaderSheet';
import { SheetHeading } from '../SheetHeading';
import { SFSymbol, type SFSymbolName } from '../Symbol';
import { getBookCover } from '@/constants/bookCovers';
import { useColors } from '@/state/theme';

export function ProfileAudioPlayer({visible,onClose,bookId='genesis',bookName='Genesis',chapter=1,preview=false}:{visible:boolean;onClose:()=>void;bookId?:string;bookName?:string;chapter?:number;preview?:boolean}) {
 const c=useColors();const [playing,setPlaying]=useState(false),[position,setPosition]=useState(0),[rate,setRate]=useState(1);
 useEffect(()=>{if(!visible)setPlaying(false)},[visible]);
 useEffect(()=>{if(!preview||!playing||!visible)return;const id=setInterval(()=>setPosition(p=>Math.min(240,p+rate)),1000);return()=>clearInterval(id)},[preview,playing,visible,rate]);
 useEffect(()=>{if(position>=240)setPlaying(false)},[position]);
 const control=(symbol:SFSymbolName,label:string,action:()=>void,large=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={!preview} accessibilityState={{disabled:!preview}} onPress={action} style={{width:64,height:64,alignItems:'center',justifyContent:'center',opacity:preview?1:.3}}><SFSymbol name={symbol} size={large?38:26} color={c.ink}/></Pressable>;
 return <ReaderSheet visible={visible} onClose={onClose} detents={[.85,1]} scrollable><ScrollView contentContainerStyle={{padding:24,paddingBottom:36,gap:20}}><SheetHeading title={preview?'Player preview':'Bible Audio'} onDone={onClose}/>
 <Image source={getBookCover(bookId)} contentFit="contain" style={{width:194,height:238,alignSelf:'center',borderRadius:10}}/>
 <View style={{gap:5}}><Text style={{fontSize:23,fontWeight:'600',color:c.ink}}>{bookName} {chapter}</Text><Text style={{fontSize:15,color:c.inkMuted}}>{preview?'Motion preview · No audio':'Narration coming soon'}</Text></View>
 {preview&&Platform.OS==='ios'?<Host style={{height:32}}><Slider min={0} max={240} value={position} color={c.ink} onValueChange={setPosition}/></Host>:<View style={{height:4,borderRadius:2,backgroundColor:c.border}}/>}
 <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:c.inkMuted,fontSize:12,fontVariant:['tabular-nums']}}>{preview?`${Math.floor(position/60)}:${String(Math.floor(position%60)).padStart(2,'0')}`:'—:—'}</Text><Text style={{color:c.inkMuted,fontSize:12}}>{preview?'4:00':'—:—'}</Text></View>
 <View style={{flexDirection:'row',justifyContent:'space-evenly'}}>{control('gobackward.15','Back fifteen seconds',()=>setPosition(p=>Math.max(0,p-15)))}{control(playing?'pause.fill':'play.fill',playing?'Pause preview':'Play preview',()=>{if(position===240)setPosition(0);setPlaying(!playing)},true)}{control('goforward.15','Forward fifteen seconds',()=>setPosition(p=>Math.min(240,p+15)))}</View>
 <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel={`Playback speed ${rate} times`} disabled={!preview} onPress={()=>setRate(rate===1?1.5:1)} style={{minHeight:44,minWidth:44,justifyContent:'center'}}><Text style={{color:c.inkMuted,fontSize:15}}>{rate}×</Text></Pressable><Text style={{color:c.inkMuted,fontSize:13}}>{preview?'Developer preview':'Recordings not available yet'}</Text></View>
 </ScrollView></ReaderSheet>;
}

export function ProfileAudioPreview({bottom,onClose}:{bottom:number;onClose:()=>void}) {
 const c=useColors(),[expanded,setExpanded]=useState(false),reduced=useReducedMotion();
 return <><Animated.View entering={reduced?undefined:FadeInDown.duration(280)} style={{position:'absolute',bottom,left:16,right:16,borderRadius:18,borderWidth:1,borderColor:c.border,backgroundColor:c.surface,flexDirection:'row',alignItems:'center',padding:8,gap:10}}><Image source={getBookCover('genesis')} style={{width:36,height:44,borderRadius:5}}/><Pressable accessibilityRole="button" accessibilityLabel="Open audio player preview" onPress={()=>setExpanded(true)} style={{flex:1,minHeight:44,justifyContent:'center',gap:4}}><Text style={{fontSize:15,fontWeight:'600',color:c.ink}}>Genesis 1</Text><Text style={{fontSize:12,color:c.inkMuted}}>Player preview · No audio</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Close audio preview" onPress={onClose} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><SFSymbol name="xmark" size={18} color={c.ink}/></Pressable></Animated.View><ProfileAudioPlayer visible={expanded} onClose={()=>setExpanded(false)} preview/></>;
}
