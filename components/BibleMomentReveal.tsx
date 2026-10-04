import { uiText } from '@/lib/typography';
import { MomentArtworkViewer } from './MomentArtworkViewer';
import { buttonStyles } from '@/lib/buttonStyles';
import { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BIBLE_MOMENTS, type BibleMoment } from '@/constants/bibleMoments';
import { findBookById } from '@/constants/books';
import { getBookCover, getCoverBloom } from '@/constants/bookCovers';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { READER_MOMENT_ART } from '@/constants/readerMomentArt';
const revealArtIds: Record<string, keyof typeof READER_MOMENT_ART> = { creation:'creation', fall:'fall', 'rainbow-covenant':'flood', 'abraham-called':'stars', 'joseph-sold':'joseph' };
import { ReaderMomentArt } from './ReaderMomentArt';
import { MomentRevealDetail, type MomentDetailOrigin } from './MomentRevealDetail';
import { SFSymbol } from './Symbol';
import * as haptics from '@/lib/haptics';

export type BibleRevealKind = 'moment' | 'silver' | 'old-gold' | 'new-gold' | 'crown';
export type BibleRevealRequest = { kind: BibleRevealKind; moment?: BibleMoment; bookId?: string; collected?: boolean };
const INK = '#fff5e8';
const SILVER = ['#454d4f','#d6d9d5','#858e8c','#f4f1df','#687373','#d5d8d3'];
const GOLD = ['#755021','#ce9744','#f9de8e','#bc802e','#fff0b4','#d6a74d','#8f6024','#e4bd66'];
const CROWN = ['#526474','#e6ebec','#c8c2de','#fff3cd','#f9fcf8','#afd7d8','#b4b5d3','#f8eccb'];
const ease = Easing.bezierFn(.2,.8,.2,1);
const turnEase = Easing.bezierFn(.15,.65,.25,1);
const mergeEase = Easing.bezierFn(.55,0,.2,1);
function easedRange(t:number,start:number,end:number,easing:(v:number)=>number) {
  'worklet';
  return start+(end-start)*easing(Math.max(0,Math.min(1,(t-start)/(end-start))));
}
const AEllipse = Animated.createAnimatedComponent(Ellipse);
function mix(a: string, b: string, amount: number) {
  const aa = a.replace('#',''), bb = b.replace('#','');
  if (aa.length !== 6 || bb.length !== 6) return a;
  return '#' + [0,2,4].map(i => Math.round(parseInt(aa.slice(i,i+2),16)*(1-amount)+parseInt(bb.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');
}
function palette(bookId: string) {
  if (bookId === 'genesis') return { back:['#d16c42','#a6472d','#713021'], world:['#733c2a','#48261f','#261916','#1b1412'], edge:'#e7ab76', glint:'#ffd8a0', mist:'#d88a60' };
  const color = getCoverBloom(bookId)?.inner ?? '#567b65';
  return { back:[mix(color,'#eed6b9',.12),color,mix(color,'#171411',.48)], world:[mix(color,'#171411',.44),mix(color,'#171411',.68),'#201b18','#161412'], edge:mix(color,'#fff0d0',.6), glint:mix(color,'#fff0d0',.78), mist:color };
}
function Material({ colors, children, vertical=false }: { colors:string[]; children?:React.ReactNode; vertical?:boolean }) {
  const id = useId().replace(/:/g,'');
  return <View style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><LinearGradient id={id} x1="0%" y1="0%" x2={vertical?"0%":"100%"} y2={vertical?"100%":"75%"}>{colors.map((c,i)=><Stop key={i} offset={i/(colors.length-1)} stopColor={c.slice(0,7)} stopOpacity={c.length===9?parseInt(c.slice(7),16)/255:1}/>)}</LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`}/></Svg>{children}</View>;
}
function Emblem({ crown=false, color='#ead6ab', size=64 }: { crown?:boolean; color?:string; size?:number }) {
  if(crown) return <Text style={{fontFamily:"Georgia",fontSize:size,lineHeight:size+10,color}}>♛</Text>;
  return <Svg width={size} height={size} viewBox="0 0 80 80"><Path d={'M40 4C47 25 55 33 76 40C55 47 47 55 40 76C33 55 25 47 4 40C25 33 33 25 40 4Z'} fill={color}/></Svg>;
}
function Back({ bookId }: { bookId:string }) {
  return <><Material colors={palette(bookId).back}/><View style={[s.inset,{borderColor:'#d1bb8966'}]}/><View style={[s.inset,{inset:24,borderTopLeftRadius:80,borderTopRightRadius:80,borderColor:'#d1bb8933'}]}/><View style={s.center}><Emblem/><Text style={{fontFamily:'Georgia',fontSize:16,color:'#ead6ab',position:'absolute',bottom:39}}>{findBookById(bookId)?.name}</Text></View></>;
}
function RewardFace({ kind, name, sizeScale=1 }: { kind:BibleRevealKind; name:string; sizeScale?:number }) {
  const crown=kind==='crown', silver=kind==='silver';
  return <><Material colors={crown?CROWN:silver?SILVER:GOLD}/><View style={[s.inset,{inset:12*sizeScale,borderColor:crown?'#b09556':'#fff1bb99',borderWidth:crown?2:1}]}/><View style={{position:'absolute',top:74*sizeScale,left:0,right:0,alignItems:'center'}}><Emblem crown={crown} color={crown?'#9a7834':silver?'#ecf0e4':'#fff0ba'} size={83*sizeScale}/></View><View style={{position:'absolute',bottom:32*sizeScale,left:20*sizeScale,right:20*sizeScale,alignItems:'center',gap:10*sizeScale}}><Text style={{fontFamily:'Georgia',fontSize:30*sizeScale,textAlign:'center',color:crown?'#35444b':silver?'#233d33':'#4b3219'}}>{name}</Text><Text style={{fontSize:12*sizeScale,color:crown?'#35444b':silver?'#233d33':'#4b3219'}}>The {crown?'crown':silver?'silver':'gold'} collection</Text></View></>;
}
function Atmosphere({ world, glint, time, reduced }: {world:string[];glint:string;time:SharedValue<number>;reduced:boolean}) {
  const id=useId().replace(/:/g,'');
  const drift=useSharedValue(0);
  useEffect(()=>{ if(!reduced) drift.value=withRepeat(withTiming(1,{duration:9000,easing:Easing.inOut(Easing.sin)}),-1,true); return()=>cancelAnimation(drift); },[reduced]);
  const sky=useAnimatedStyle(()=>({opacity:interpolate(time.value,[0,850],[0,1],'clamp')}));
  const clouds=useAnimatedStyle(()=>({opacity:.45,transform:[{translateX:drift.value*30-15},{translateY:-drift.value*20},{scale:1+drift.value*.12}]}));
  const stars=useAnimatedStyle(()=>({opacity:.35+drift.value*.4,transform:[{translateY:-drift.value*25}]}));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,sky]}><Svg width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><RadialGradient id={id} cx="50%" cy="43%" rx="80%" ry="65%">{world.map((c,i)=><Stop key={i} offset={i/(world.length-1)} stopColor={c.slice(0,7)} stopOpacity={c.length===9?parseInt(c.slice(7),16)/255:1}/>)}</RadialGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`}/></Svg><Animated.View style={[StyleSheet.absoluteFill,clouds]}><Svg width="100%" height="100%"><Defs><RadialGradient id={id+'mist'}><Stop offset="0" stopColor={glint} stopOpacity={.25}/><Stop offset="1" stopColor={glint} stopOpacity={0}/></RadialGradient></Defs><Ellipse cx="50%" cy="43%" rx="65%" ry="34%" fill={`url(#${id}mist)`}/><Ellipse cx="75%" cy="64%" rx="48%" ry="28%" fill={`url(#${id}mist)`}/></Svg></Animated.View><Animated.View style={[StyleSheet.absoluteFill,stars]}><Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">{Array.from({length:128},(_,i)=><Circle key={i} cx={(i*137+19)%393} cy={(i*193+31)%852} r={.5+(i%4)*.24} fill={glint} opacity={.25+(i%5)*.13}/>)}</Svg></Animated.View></Animated.View>;
}
function Effects({ time, burstAt, glint, reduced }: {time:SharedValue<number>;burstAt:number;glint:string;reduced:boolean}) {
  const ring=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(time.value,[burstAt,burstAt+220,burstAt+1400],[0,.85,0],'clamp'),transform:[{scale:interpolate(time.value,[burstAt,burstAt+1400],[.2,2.3],'clamp')}]}));
  const burst=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(time.value,[burstAt,burstAt+180,burstAt+1800],[0,1,0],'clamp'),transform:[{scale:interpolate(time.value,[burstAt,burstAt+1800],[.05,1.3],'clamp')},{rotate:`${interpolate(time.value,[burstAt,burstAt+1800],[0,18],'clamp')}deg`}]}));
  const bloom=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(time.value,[burstAt,burstAt+250,burstAt+1500],[0,.7,0],'clamp')}));
  const glowId=useId().replace(/:/g,'');
  const trail=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(time.value,[700,1100,burstAt+400],[0,1,0],'clamp'),transform:[{rotate:`${time.value*.045}deg`}]}));
  const props=useAnimatedProps(()=>({strokeDashoffset:-time.value*.85}));
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Animated.View style={[{position:"absolute",inset:-90},bloom]}><Svg width="100%" height="100%"><Defs><RadialGradient id={glowId}><Stop offset="0" stopColor={glint} stopOpacity={.8}/><Stop offset="1" stopColor={glint} stopOpacity={0}/></RadialGradient></Defs><Rect width="100%" height="100%" fill={`url(#${glowId})`}/></Svg></Animated.View><Animated.View style={[{position:'absolute',width:300,height:300,left:46.5,top:45,borderRadius:150,borderWidth:1,borderColor:glint},ring]}/><Animated.View style={[StyleSheet.absoluteFill,trail]}><Svg width="393" height="390" viewBox="0 0 393 390"><AEllipse animatedProps={props} cx="196" cy="190" rx="175" ry="70" rotation={-28} origin="196,190" stroke={glint} strokeWidth={2} strokeDasharray="90 45 15 330" fill="none"/><AEllipse animatedProps={props} cx="196" cy="190" rx="165" ry="94" rotation={38} origin="196,190" stroke={glint} strokeWidth={1} strokeDasharray="140 380" fill="none"/></Svg></Animated.View><Animated.View style={[StyleSheet.absoluteFill,burst]}><Svg width="393" height="390">{Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2;return <Circle key={i} cx={196+Math.cos(a)*(130+i%4*15)} cy={195+Math.sin(a)*(160+i%3*20)} r={i%3===0?2:1.2} fill={glint}/>;})}</Svg></Animated.View></View>;
}
function SourceCard({ index, kind, time, bookId }: {index:number;kind:BibleRevealKind;time:SharedValue<number>;bookId:string}) {
  const regular=kind==='moment', crown=kind==='crown';
  const n=crown?(index===0?-1:1):index-2;
  const st=useAnimatedStyle(()=>{
    const spread=crown?700:720, merge=crown?1950:1600;
    const t=regular?(time.value<850?time.value:easedRange(time.value,850,1550,mergeEase)):(time.value<spread?easedRange(time.value,0,spread,ease):easedRange(time.value,spread,merge,mergeEase));
    if(regular) return {opacity:interpolate(t,[850,1100,1550],[1,1,0],'clamp'),transform:[{translateX:n*14+interpolate(t,[850,1550],[0,n*60],'clamp')},{translateY:Math.abs(n)*15+interpolate(t,[850,1550],[0,230],'clamp')},{rotate:`${n*12+interpolate(t,[850,1550],[0,n*12],'clamp')}deg`},{scale:interpolate(t,[850,1550],[1,.7],'clamp')}]};
    const spreadEnd=crown?700:720, mergeEnd=crown?1950:1600;
    return {opacity:interpolate(t,[0,mergeEnd-200,mergeEnd],[1,1,0],'clamp'),transform:[{translateX:interpolate(t,[0,spreadEnd,mergeEnd],[n*(crown?73:43),n*(crown?83:53),0],'clamp')},{translateY:interpolate(t,[0,spreadEnd,mergeEnd],[Math.abs(n)*8,-24,-12],'clamp')},{rotate:`${interpolate(t,[0,spreadEnd,mergeEnd],[n*12,n*9,0],'clamp')}deg`},{scale:interpolate(t,[0,spreadEnd,mergeEnd],[1,1.03,.7],'clamp')}]};
  });
  const w=crown?145:regular?136:100,h=crown?207:regular?195:144;
  const moments=BIBLE_MOMENTS.filter(m=>m.bookId===bookId);
  const illustrated=moments.filter(m=>revealArtIds[m.id]);
  const books=kind==='new-gold'?['matthew','mark','luke','john','revelation']:['genesis','psalms','isaiah','daniel','malachi'];
  return <Animated.View style={[{position:'absolute',left:(393-w)/2,top:(390-h)/2,width:w,height:h,borderRadius:regular?15:12,overflow:'hidden',borderWidth:1,borderColor:'#ecc48c',boxShadow:'2px 4px 0 #816248, 0 12px 20px #00000033'},st]}>{regular?<Back bookId={bookId}/>:crown?<><Material colors={GOLD}/><View style={s.center}><Emblem size={38}/><Text style={{fontFamily:'Georgia',fontSize:22,color:'#513814',textAlign:'center',marginTop:16}}>{index===0?'Old':'New'}{ '\n'}Testament</Text><Text style={{color:'#513814',fontSize:9,marginTop:16}}>{index===0?'39':'27'} books · Complete</Text></View></>:kind==='silver'?<ReaderMomentArt moment={illustrated[index%illustrated.length]??moments[index%moments.length]??BIBLE_MOMENTS[0]}/>:<Image source={getBookCover(books[index])} style={{width:'100%',height:'100%'}} contentFit="cover"/>}</Animated.View>;
}
function Confetti({ reduced }: {reduced:boolean}) {
  const fall=useSharedValue(0);
  useEffect(()=>{if(!reduced)fall.value=withTiming(1,{duration:4300,easing:Easing.linear});return()=>cancelAnimation(fall);},[reduced]);
  const st=useAnimatedStyle(()=>({opacity:reduced?0:interpolate(fall.value,[0,.12,.8,1],[0,1,.8,0]),transform:[{translateY:fall.value*900-400},{rotate:`${fall.value*24}deg`}]}));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,st]}><Svg width="100%" height="100%" viewBox="0 0 393 852">{Array.from({length:46},(_,i)=><Rect key={i} x={(i*67)%393} y={(i*93)%700} width={i%3===0?4:7} height={i%3===0?4:12} rx={1} fill={['#e7c87d','#d98d69','#a5bfad'][i%3]} rotation={i*31} origin={`${i*67%393},${i*93%700}`}/>)}</Svg></Animated.View>;
}
/** Native choreography from moments-unlock. A single UI-thread clock coordinates all layers. */
export function BibleMomentReveal({ request, onClose, preview=false, autoPlay=false, previewDetail=false, embedded=false }: {request:BibleRevealRequest;onClose:()=>void;preview?:boolean;autoPlay?:boolean;previewDetail?:boolean;embedded?:boolean}) {
  const {kind}=request, moment=request.moment??BIBLE_MOMENTS[0], bookId=request.bookId??moment.bookId;
  const book=findBookById(bookId)?.name??'Genesis', regular=kind==='moment', crown=kind==='crown', silver=kind==='silver';
  const name=regular?moment.title:silver?book:crown?'The Whole Bible':kind==='new-gold'?'New Testament':'Old Testament';
  const count=BIBLE_MOMENTS.filter(m=>m.bookId===bookId).length;
  const {width,height}=useWindowDimensions(), insets=useSafeAreaInsets(), reduced=useReducedMotion();
  const [intro,setIntro]=useState(!regular && !request.collected), [running,setRunning]=useState(false), [done,setDone]=useState(!!request.collected);
  const [artOpen,setArtOpen]=useState(false);
  const heroRef=useRef<View>(null);
  const [detailOrigin,setDetailOrigin]=useState<MomentDetailOrigin|null>(null);
  const openDetail=()=>heroRef.current?.measureInWindow((x,y,width,height)=>{if(width>0&&height>0){haptics.soft();setDetailOrigin({x,y,width,height});}});
  const started=useRef(!!request.collected), time=useSharedValue(request.collected ? 5000 : 0), gloss=useSharedValue(-1), entry=useSharedValue(0);
  const p=palette(bookId), world=regular?p.world:silver?['#384149','#21262d','#131619']:crown?['#3c3d50','#242431','#15151d']:['#443724','#272119','#171411'];
  const glint=regular?p.glint:crown?'#ede2be':silver?'#d8e5e7':'#f3cb6e';
  const burstAt=regular?1900:crown?1950:1600, duration=regular?3000:crown?3350:2700;
  const scale=Math.min((width-48)/300,Math.max(.68,(height-insets.top-insets.bottom-230)/390));
  const cardWidth=(regular?290:242)*scale, cardHeight=cardWidth*4/3;
  const finish=()=>{setDone(true);setRunning(false);haptics.success();AccessibilityInfo.announceForAccessibility(regular?'Bible Moment collected':`${name} ${silver?'silver foil':crown?'Crown card':'gold card'} unlocked`);};
  useEffect(()=>{entry.value=withTiming(1,{duration:reduced?180:650,easing:ease});return()=>{[time,gloss,entry].forEach(cancelAnimation);};},[]);
  useEffect(()=>{if(done&&!reduced)gloss.value=withRepeat(withSequence(withTiming(1,{duration:1500,easing:Easing.inOut(Easing.cubic)}),withDelay(2800,withTiming(-1,{duration:0}))),-1);},[done,reduced]);
  const start=()=>{if(started.current)return;started.current=true;setIntro(false);setRunning(true);haptics.soft();time.value=withTiming(duration,{duration:reduced?180:duration,easing:Easing.linear},finished=>{if(finished){runOnJS(finish)();time.value=withTiming(duration+2000,{duration:reduced?0:2000,easing:Easing.linear});}});};
  useEffect(()=>{if(!autoPlay || request.collected)return;const timer=setTimeout(start,preview?1500:350);return()=>clearTimeout(timer);},[autoPlay,preview]);
  useEffect(()=>{if(!preview||!previewDetail||!done||!regular)return;const timer=setTimeout(openDetail,900);return()=>clearTimeout(timer)},[preview,previewDetail,done]);
  const heroTime=useDerivedValue(()=>{
    if(reduced)return time.value;
    if(regular){
      if(time.value<850)return easedRange(time.value,0,850,ease);
      if(time.value<1900)return time.value;
      return easedRange(time.value,1900,3000,turnEase);
    }
    return time.value<burstAt?time.value:easedRange(time.value,burstAt,duration,ease);
  });
  const card=useAnimatedStyle(()=>({opacity:regular?1:interpolate(heroTime.value,[burstAt,burstAt+250],[0,1],'clamp'),transform:done?[]:[{translateY:reduced?0:interpolate(heroTime.value,regular?[0,470,850,1900,2450,2868,3000]:[0,burstAt,burstAt+600,duration],regular?[0,-45,-20,-25,-16,3,0]:[-12,-12,-14,0],'clamp')},{scale:reduced?1:interpolate(heroTime.value,regular?[0,470,850,1900,2450,2868,3000]:[0,burstAt,burstAt+600,duration],regular?[.645,.72,.86,.89,.95,1.02,1]:[.55,.55,.9,1],'clamp')}]}));
  const rotation=(value:number)=>{ 'worklet'; return reduced?180:interpolate(value,[0,850,1900,2175,2450,2868,3000],[0,0,-8,180,360,535,540],'clamp'); };
  const backStyle=useAnimatedStyle(()=>({opacity:Math.cos(rotation(heroTime.value)*Math.PI/180)>0?1:0,transform:[{perspective:1400},{rotateY:`${rotation(heroTime.value)}deg`}]}));
  const frontStyle=useAnimatedStyle(()=>({opacity:done?1:regular?(Math.cos(rotation(heroTime.value)*Math.PI/180)<=0?1:0):1,transform:done?[]:[{perspective:1400},{rotateY:`${regular?rotation(heroTime.value)-180:reduced?0:interpolate(heroTime.value,[burstAt,burstAt+600,duration],[0,-23,0],'clamp')}deg`}]}));
  const shine=useAnimatedStyle(()=>({transform:[{translateX:gloss.value*380},{rotate:'25deg'}]}));
  const result=useAnimatedStyle(()=>({opacity:interpolate(time.value,[duration-150,duration],[0,1],'clamp'),transform:[{translateY:reduced?0:interpolate(time.value,[duration-150,duration],[10,0],'clamp')}]}));
  const introStyle=useAnimatedStyle(()=>({opacity:entry.value,transform:[{translateY:reduced?0:24*(1-entry.value)},{scale:reduced?1:.94+.06*entry.value}]}));
  const introTitle=silver?`Every Moment in ${book}. Discovered.`:crown?'You read the whole Bible.':`You finished the ${name}.`;
  const introDescription=silver?`${count} discoveries. One special keepsake.`:crown?'From Genesis to Revelation. Take a moment to let that sink in.':`${kind==='new-gold'?27:39} books. One meaningful journey.`;
  const content=<><StatusBar style="light"/><View style={[s.root,{paddingTop:insets.top,paddingBottom:Math.max(insets.bottom,16)}]} accessibilityViewIsModal><Atmosphere world={world} glint={glint} time={time} reduced={reduced}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Close reveal" onPress={onClose} style={{position:'absolute',right:12,top:insets.top+2,width:44,height:44,zIndex:10,alignItems:'center',justifyContent:'center'}}><SFSymbol name="xmark" size={17} color="#d5cbbb"/></Pressable>
    {detailOrigin?<MomentRevealDetail moment={moment} origin={detailOrigin} onBack={()=>setDetailOrigin(null)} onClose={onClose} preview={preview}/>:intro?<><Confetti reduced={reduced}/><Animated.View style={[{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:28,gap:24},introStyle]}><View style={{height:118,width:118,borderRadius:59,backgroundColor:'#e7c87d12',alignItems:'center',justifyContent:'center',boxShadow:'0 0 55px #e7c87d22'}}><Emblem color="#e7c87d" size={68}/></View><Text style={{color:'#dfc99f',fontSize:22,fontWeight:'600'}}>You did it.</Text><Text style={{fontSize:36,lineHeight:42,letterSpacing:-1.1,fontWeight:'800',color:INK,textAlign:'center'}}>{introTitle}</Text><Text style={{fontSize:16,lineHeight:25,color:'#c5b9ab',textAlign:'center'}}>{introDescription}</Text></Animated.View><View style={s.footer}><Pressable accessibilityRole="button" onPress={start} style={s.button}><Text style={s.buttonText}>Celebrate this moment</Text></Pressable></View></>:<>
    <ScrollView style={{flex:1}} contentContainerStyle={{alignItems:'center'}} showsVerticalScrollIndicator={false}><View style={{paddingTop:44,paddingBottom:12,paddingHorizontal:26,minHeight:100,alignItems:'center',gap:10}}><Text style={s.title}>{done?(regular?moment.title:silver?`Your ${book} silver foil.`:crown?'The Whole Bible.':`Your ${name} gold card.`):regular?'You found a Moment.':silver?'Every Moment. Now together.':crown?'The whole story, brought together.':'A whole testament. A lasting keepsake.'}</Text>{!regular&&<Text style={s.subtitle}>{done?(regular?'Some discoveries stay with you.':'A keepsake for your collection.'):regular?`A little discovery in ${book}.`:silver?`Your ${book} collection is complete.`:'Every book. Every step of the journey.'}</Text>}</View>
    <View style={{height:390*scale,width:'100%',alignItems:'center',justifyContent:'center'}}><View style={{width:393,height:390,transform:[{scale}]}}>{(!reduced||!running&&!done)&&Array.from({length:crown?2:5},(_,i)=>regular&&i===2?null:<SourceCard key={i} index={i} kind={kind} time={time} bookId={bookId}/>)}<Effects time={time} burstAt={burstAt} glint={glint} reduced={reduced}/></View><Animated.View ref={heroRef} collapsable={false} style={[{position:'absolute',left:(width-cardWidth)/2,top:(390*scale-cardHeight)/2,width:cardWidth,height:cardHeight},card]}><Pressable disabled={running||(done&&!regular)} onPress={done?()=>setArtOpen(true):start} accessibilityRole="button" accessibilityLabel={done?'View artwork full screen':'Reveal my Moment'} style={{flex:1}}>{regular&&<Animated.View style={[s.face,{borderColor:p.edge},backStyle]}><Back bookId={bookId}/></Animated.View>}<Animated.View style={[s.face,{borderColor:regular?p.edge:crown?'#ead394':silver?'#f2efe5':'#f8e5b0',boxShadow:silver?'2px 4px 0 #494e4e, 0 22px 35px #00000044':crown?'2px 5px 0 #a38b58, 0 25px 45px #00000044':'2px 4px 0 #816248, 0 22px 35px #00000044'},frontStyle]}>{regular?<><ReaderMomentArt moment={moment}/>{done&&<View style={{position:"absolute",right:12,top:12,width:36,height:36,borderRadius:18,backgroundColor:"#00000080",alignItems:"center",justifyContent:"center"}}><SFSymbol name="arrow.up.left.and.arrow.down.right" size={18} color="white"/></View>}<View style={{position:'absolute',bottom:0,left:0,right:0,height:175*scale}}><Material vertical colors={['#40271b00',p.back[2]+'ee']}/></View><View style={{position:'absolute',bottom:26*scale,left:22*scale,right:22*scale,gap:12*scale}}><View style={{alignSelf:'flex-start',backgroundColor:p.back[1]+'cc',borderRadius:12,paddingHorizontal:9,paddingVertical:5}}><Text style={{color:INK,fontSize:11*scale}}>{book}</Text></View></View></>:<RewardFace kind={kind} name={name} sizeScale={scale}/>}<Animated.View pointerEvents="none" style={[{position:'absolute',top:-100,bottom:-100,width:110,left:66},shine]}><Material colors={['#ffffff00','#ffffff55','#ffffff00']}/></Animated.View></Animated.View></Pressable></Animated.View></View>
    <Animated.View style={[{alignItems:'center',minHeight:72,paddingTop:12,paddingHorizontal:24,gap:10},result]}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><View style={{width:25,height:25,borderRadius:13,backgroundColor:'#2c8a4b',alignItems:'center',justifyContent:'center'}}><SFSymbol name="checkmark" size={14} color="white"/></View><Text style={{color:INK,fontSize:16,fontWeight:'600'}}>{regular?'Collected':silver?'Silver foil unlocked':crown?'Crown card unlocked':'Gold card unlocked'}</Text></View>{!regular&&<Text style={s.subtitle}>{regular?`Your ${book} collection`:silver?`All ${count} ${book} Moments are yours.`:crown?'66 books. A remarkable journey.':`All ${kind==='new-gold'?27:39} books of the ${name} read.`}</Text>}</Animated.View></ScrollView>
    <View style={[s.footer,{marginTop:'auto'}]}><Pressable disabled={running} accessibilityRole="button" accessibilityState={{disabled:running}} onPress={done?(regular?openDetail:onClose):start} style={[s.button,{opacity:running?.45:1}]}><Text style={s.buttonText}>{done?(regular?'Explore this Moment':'Keep reading'):running?'Revealing…':'Reveal my Moment'}</Text></Pressable>{preview&&<Text style={{color:'#c5b9ab',fontSize:12,textAlign:'center',marginTop:13}}>{preview?'Developer preview · Progress stays unchanged':done?'Saved in Bible Moments':'A keepsake for your journey'}</Text>}</View></>}
  {artOpen&&<MomentArtworkViewer moment={moment} onClose={()=>setArtOpen(false)}/>}
  </View></>;
  return embedded?content:<Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={()=>detailOrigin?setDetailOrigin(null):onClose()}>{content}</Modal>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#211d18'},center:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center'},inset:{position:'absolute',inset:12,borderWidth:1,borderRadius:14},face:{...StyleSheet.absoluteFillObject,borderRadius:23,overflow:'hidden',borderWidth:1,backgroundColor:'#375849',boxShadow:'2px 4px 0 #816248, 0 22px 35px #00000044'},title:{...uiText.screenTitle,textAlign:'center',color:INK},subtitle:{...uiText.supporting,color:'#c5b9ab',textAlign:'center',lineHeight:19},footer:{paddingHorizontal:24,paddingTop:18,paddingBottom:12},button:{...buttonStyles.primary,backgroundColor:'#fff2db',justifyContent:'center',alignItems:'center'},buttonText:{...buttonStyles.label,color:'#32271f'}});
