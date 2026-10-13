import { DARK_CANVAS } from "@/constants/theme";
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { Text } from "@/components/CloserText";
import { Image, type ImageSource } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useResolvedScheme } from '@/state/theme';
import { useProgress } from '@/state/progress';
import { useAnnotations } from '@/state/annotations';
import { useBibleMomentCollection } from '@/state/bibleMoments';
import { useAchievements } from '@/lib/useAchievements';
import { buildCurrentWeek } from '@/lib/rhythm';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { uiText } from '@/lib/typography';
import { BIBLE_MOMENTS } from '@/constants/bibleMoments';
import { MOMENTS_IN_ORDER } from '@/lib/momentOrder';
import { ProfileActivitySheet } from "./ProfileActivitySheet";
import { StreakFireAnimation } from './StreakFireAnimation';
import { EnamelAchievement } from './EnamelAchievement';
import { ReaderMomentArt } from './ReaderMomentArt';
import { ReaderMaterialGradient } from './ReaderMaterialGradient';
import { ReaderSheet } from './ReaderSheet';
import { SheetHeading } from './SheetHeading';
import { SFSymbol, type SFSymbolName } from './Symbol';
import * as haptics from '@/lib/haptics';

export const PROFILE_PALETTE = {
  light:{bg:'#FBF3EC',ink:'#17120F',muted:'#6E645C',surface:'#FFFFFF',line:'#17120F14',green:'#2A8050'},
  dark:{bg:DARK_CANVAS.background,ink:'#F7F0E6',muted:'#BBAA99',surface:'#241E19',line:'#FFFFFF14',green:'#8BD5A2'},
};
const CREAM = '#FFF1E4', CREAM_2 = '#D8BDA5', MARIGOLD = '#FFB83A';

/**
 * Profile: a dark ember cover with your streak as the hero, the next
 * keepsake on its way, then the things you've kept as objects you can open.
 */
export function ProfileJourney({name,joinedAt,avatar,onAvatar,onSettings}:{name:string;joinedAt?:number;avatar?:ImageSource;onAvatar:()=>void;onSettings:()=>void}) {
  const router=useRouter(),dark=useResolvedScheme()==='dark',p=PROFILE_PALETTE[dark?'dark':'light'],reduced=useReducedMotion(),insets=useSafeAreaInsets();
  const {fontScale,width}=useWindowDimensions(),{streak,engagedDates}=useProgress(),{counts}=useAnnotations(),{ids,hydrated}=useBibleMomentCollection(),{achievements}=useAchievements();
  const [activity,setActivity]=useState(false),[nextOpen,setNextOpen]=useState(false);
  const week=buildCurrentWeek(engagedDates);
  const earned=achievements.filter(a=>a.value>=a.target).length;
  const next=achievements.find(a=>a.category==='Streaks'&&a.value<a.target);
  const progress=next?Math.min(streak.current/next.target,1):1;
  const remaining=next?Math.max(0,next.target-streak.current):0;
  const firstKeepsake=earned===0;
  const arrival=(i:number)=>reduced?undefined:FadeInDown.delay(i*55).duration(500).springify().damping(22).stiffness(190);
  const go=(route:Href)=>{haptics.soft();router.push(route);};

  const since=typeof joinedAt==='number'
    ? (new Date(joinedAt).toDateString()===new Date().toDateString()?'With Closer since today':`With Closer since ${new Date(joinedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long'})}`)
    : 'Walking with Closer';
  const hero=streak.current<=1
    ? {n:String(streak.current),line:streak.current===1?'first\nmorning':'days in\na row',sub:streak.current===1?'Come back tomorrow for day two':'Today’s walk starts it'}
    : {n:String(streak.current),line:'days in\na row',sub:streak.longest>streak.current?`Your longest is ${streak.longest}`:'Your longest yet'};

  const collected=BIBLE_MOMENTS.filter(m=>ids.includes(m.id)).slice(-3);
  const fan=collected.length?collected:[BIBLE_MOMENTS[0]];
  const tileW=fontScale>1.2||width<360?width-40:(width-40-12)/2;
  const tile={width:tileW,height:176,borderRadius:24,borderCurve:'continuous' as const,padding:14,overflow:'hidden' as const,justifyContent:'flex-end' as const};
  const lift={boxShadow:dark?'0 14px 28px -20px #000000AA':'0 1px 2px #502D0A14, 0 14px 28px -20px #502D0A80'};

  return <View>
    {/* the cover */}
    <View style={[s.cover,{paddingTop:insets.top+10}]}>
      <ReaderMaterialGradient colors={dark?['#5A3526','#2E1B13','#1E120C']:['#6A3E2A','#3A2219','#24140E']} locations={[0,.52,1]} style={StyleSheet.absoluteFill}/>
      <View style={s.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={onAvatar} style={s.av}>
          {avatar?<Image source={avatar} contentFit="cover" style={StyleSheet.absoluteFill}/>:<ReaderMaterialGradient colors={['#FF7A4F','#E2391F']} style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'}]}><Text style={{fontSize:21,fontWeight:'900',color:'#FFF'}}>{name.charAt(0).toUpperCase()}</Text></ReaderMaterialGradient>}
        </Pressable>
        <View style={{flex:1}}>
          <Text numberOfLines={1} style={{fontSize:19,lineHeight:23,fontWeight:'900',color:CREAM}}>{name}</Text>
          <Text numberOfLines={1} style={{fontSize:13,lineHeight:17,fontWeight:'700',color:CREAM_2,marginTop:1}}>{since}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={s.gear}><SFSymbol name="gearshape" size={20} color={CREAM}/></Pressable>
      </View>
      <View accessible accessibilityLabel={`${streak.current} ${streak.current===1?'day':'days'} in a row. ${hero.sub}`} style={s.hero}>
        {/* Nunito's ascenders need more room than the display font size. */}
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={{fontSize:104,lineHeight:132,fontWeight:'900',letterSpacing:-5,color:MARIGOLD,fontVariant:['tabular-nums'],flexShrink:1,maxWidth:'45%'}}>{hero.n}</Text>
        <View style={{flex:1,paddingBottom:4}}>
          <Text style={{fontSize:24,lineHeight:26,fontWeight:'900',letterSpacing:-.5,color:CREAM}}>{hero.line}</Text>
          <Text style={{fontSize:14,lineHeight:18,fontWeight:'700',color:CREAM_2,marginTop:6}}>{hero.sub}</Text>
        </View>
        {streak.current>0 && <View pointerEvents="none" style={{marginRight:-8,marginBottom:-6}}><StreakFireAnimation size={96}/></View>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Your reading history" onPress={()=>go('/rhythm')} style={s.week}>
        {week.cells.map(cell=>{
          const done=cell.state==='engaged',d=new Date(cell.dateISO+'T12:00:00');
          return <View key={cell.dateISO} accessible accessibilityLabel={`${d.toLocaleDateString(undefined,{weekday:'long'})}${cell.isToday?', today':''}, ${done?'done':'not yet'}`} style={{alignItems:'center',gap:7}}>
            <Text style={{fontSize:12,lineHeight:14,fontWeight:'800',color:CREAM_2}}>{d.toLocaleDateString(undefined,{weekday:'narrow'})}</Text>
            {done
              ? <ReaderMaterialGradient colors={['#FFD37A','#F2A22E']} style={[s.dot,{boxShadow:'0 4px 10px -4px #FFAA2899'}]}><SFSymbol name="checkmark" size={14} color="#3A1A08" weight="bold"/></ReaderMaterialGradient>
              : <View style={[s.dot,cell.isToday?{borderWidth:2,borderColor:MARIGOLD}:{backgroundColor:'#FFF1E41A'}]}><Text style={{fontSize:12,fontWeight:cell.isToday?'900':'800',color:cell.isToday?MARIGOLD:'#BFA58E'}}>{d.getDate()}</Text></View>}
          </View>;
        })}
      </Pressable>
    </View>

    <View style={{paddingHorizontal:20}}>
      {/* the next keepsake */}
      <Animated.View entering={arrival(1)}>
        <Pressable accessibilityRole="button" accessibilityLabel={next?`${next.title}. ${remaining} more ${remaining===1?'day':'days'}`:'Your keepsakes'} onPress={()=>next?(haptics.soft(),setNextOpen(true)):go('/achievements')} style={[s.next,{backgroundColor:p.surface},lift]}>
          <View style={{width:60,height:60,alignItems:'center',justifyContent:'center'}}>
            <Svg width={60} height={60} style={StyleSheet.absoluteFill}>
              <Circle cx={30} cy={30} r={27} stroke={dark?'#E9B9492E':'#B0741526'} strokeWidth={5} fill="none"/>
              <Circle cx={30} cy={30} r={27} stroke="#F2A22E" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(.04,progress)*169.6} 170`} transform="rotate(-90 30 30)"/>
            </Svg>
            <EnamelAchievement size={42} achievementId={next?.id??'streak-100'}/>
          </View>
          <View style={{flex:1}}>
            <Text style={{fontSize:12,lineHeight:14,fontWeight:'800',letterSpacing:1.3,textTransform:'uppercase',color:dark?'#E9B949':'#8A5A0E'}}>{!next?'Your keepsakes':remaining===1?'Tomorrow':firstKeepsake?'Your first keepsake':'Your next keepsake'}</Text>
            <Text numberOfLines={1} style={{fontSize:17,lineHeight:21,fontWeight:'900',color:p.ink,marginTop:4}}>{next?.id==='streak-7'?'Seven faithful days':next?.title??'Look how far you’ve come'}</Text>
            <Text style={{fontSize:14,lineHeight:18,fontWeight:'600',color:p.muted,marginTop:2}}>{!next?`${earned} earned so far`:remaining===1?'One more morning and it’s yours':`${remaining} more mornings`}</Text>
          </View>
          <SFSymbol name="chevron.right" size={13} color={dark?'#8F857C':'#B5ABA2'}/>
        </Pressable>
      </Animated.View>

      {/* things you've kept */}
      <Text accessibilityRole="header" style={{fontSize:22,lineHeight:26,fontWeight:'900',letterSpacing:-.5,color:p.ink,marginTop:26,marginBottom:12,marginLeft:2}}>{earned+ids.length+counts.highlights+counts.notes>1?'Things you’ve kept':'Things you’ll keep'}</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
        <Animated.View entering={arrival(2)}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Bible Moments. ${ids.length} of ${MOMENTS_IN_ORDER.length} collected`} onPress={()=>go('/rhythm?section=moments' as Href)} style={[tile,lift]}>
            <ReaderMaterialGradient colors={['#5A3526','#2A1810']} style={StyleSheet.absoluteFill}/>
            <View pointerEvents="none" style={s.art}>{fan.map((m,i)=>{
              const pos=fan.length===1?[{l:tileW/2-28,r:'0deg',t:12}]:fan.length===2?[{l:tileW/2-50,r:'-9deg',t:16},{l:tileW/2-8,r:'8deg',t:14}]:[{l:tileW/2-62,r:'-11deg',t:16},{l:tileW/2-28,r:'2deg',t:10},{l:tileW/2+6,r:'13deg',t:16}];
              const at=pos[i];
              return <View key={m.id} style={[s.gilt,{left:at.l,top:at.t,transform:[{rotate:at.r}],zIndex:i===1?2:1}]}><ReaderMomentArt moment={m}/></View>;
            })}</View>
            <Text style={[s.tt,{color:CREAM}]}>Bible Moments</Text>
            <Text style={[s.ts,{color:CREAM_2}]}>{!hydrated?'Opening your album':ids.length<=1?(ids.length?'Your first one is in':'Collect them as you read'):`${ids.length} of ${MOMENTS_IN_ORDER.length} collected`}</Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={arrival(3)}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Keepsakes. ${earned} of ${achievements.length} earned`} onPress={()=>go('/achievements')} style={[tile,lift,earned?null:ghost(dark)]}>
            {earned>0?<>
              <ReaderMaterialGradient colors={['#FFD06A','#FFB83A','#F29E25']} locations={[0,.6,1]} style={StyleSheet.absoluteFill}/>
              <View pointerEvents="none" style={[s.art,{alignItems:'center',paddingTop:8}]}><EnamelAchievement size={90} achievementId={achievements.find(a=>a.value>=a.target)?.id??'letters-1'}/></View>
            </>:<GhostIcon icon="plus" dark={dark}/>}
            <Text style={[s.tt,{color:earned?'#3A1A08':p.ink}]}>Keepsakes</Text>
            <Text style={[s.ts,{color:earned?'#6A3A12':p.muted}]}>{earned?`${earned} of ${achievements.length} earned`:'Earned by showing up'}</Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={arrival(4)}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Highlights. ${counts.highlights} verses`} onPress={()=>go('/highlights')} style={[tile,lift,counts.highlights?{backgroundColor:p.surface}:ghost(dark)]}>
            {counts.highlights>0?<View pointerEvents="none" style={[s.art,{paddingHorizontal:14,paddingTop:18,gap:9}]}>
              {[{w:.92},{w:.8,c:'#FFC93C'},{w:.96},{w:.6,c:'#F59A6B'},{w:.7}].map((l,i)=><View key={i} style={{width:`${l.w*100}%`,height:9}}>
                {l.c&&<View style={{position:'absolute',left:-4,right:-4,top:-5,bottom:-5,borderRadius:6,backgroundColor:l.c,opacity:.75,transform:[{rotate:'-1deg'}]}}/>}
                <View style={{flex:1,borderRadius:5,backgroundColor:dark?'#FFFFFF1A':'#17120F14'}}/>
              </View>)}
            </View>:<GhostIcon icon="plus" dark={dark}/>}
            <Text style={[s.tt,{color:p.ink}]}>Highlights</Text>
            <Text style={[s.ts,{color:p.muted}]}>{counts.highlights?`${counts.highlights} ${counts.highlights===1?'verse':'verses'}`:'Tap a verse to mark it'}</Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={arrival(5)}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Reflections. ${counts.notes} notes`} onPress={()=>go('/notes')} style={[tile,lift,counts.notes?{backgroundColor:dark?'#2A221D':'#EADCCB'}:ghost(dark)]}>
            {counts.notes>0?<View pointerEvents="none" style={s.art}>
              <View style={[s.paper,{backgroundColor:dark?'#3A2F27':'#FFFBF4'}]}>{[1,1,.7,.85].map((w,i)=><View key={i} style={{height:2,width:`${w*100}%`,backgroundColor:dark?'#5A4A3E':'#D9C6B0'}}/>)}</View>
              <View style={{position:'absolute',left:92,top:30}}><SFSymbol name="pencil" size={44} color={dark?'#E9B949':'#8E4A22'}/></View>
            </View>:<GhostIcon icon="pencil" dark={dark}/>}
            <Text style={[s.tt,{color:dark?'#F1E1D2':counts.notes?'#3A2219':p.ink}]}>Reflections</Text>
            <Text style={[s.ts,{color:dark?'#BBAA99':counts.notes?'#6E5240':p.muted}]}>{counts.notes?`${counts.notes} ${counts.notes===1?'note':'notes'}`:'Write after you read'}</Text>
          </Pressable>
        </Animated.View>
      </View>

      <View style={[s.rows,{backgroundColor:p.surface},lift]}>
        {([['bell','#C98A1E','Activity',()=>{haptics.soft();setActivity(true);}],['person.2','#3A2219','Community and study groups',()=>go('/(tabs)/community')]] as [SFSymbolName,string,string,()=>void][]).map(([icon,color,label,onPress],i)=>
          <Pressable key={label} accessibilityRole="button" onPress={onPress} style={s.row}>
            {i>0&&<View style={[s.divider,{backgroundColor:p.line}]}/>}
            <View style={[s.ri,{backgroundColor:dark&&color==='#3A2219'?'#5A3526':color}]}><SFSymbol name={icon} size={17} color="#FFF"/></View>
            <Text style={{...uiText.body,fontWeight:'700',color:p.ink,flex:1}}>{label}</Text>
            <SFSymbol name="chevron.right" size={13} color={dark?'#8F857C':'#B5ABA2'}/>
          </Pressable>)}
      </View>
    </View>

    <ProfileActivitySheet visible={activity} onClose={()=>setActivity(false)}/>
    <ReaderSheet visible={nextOpen} onClose={()=>setNextOpen(false)} detents={[.65,1]} backgroundColor={p.bg}><ScrollView contentContainerStyle={{paddingHorizontal:24,paddingTop:32,paddingBottom:36,gap:22}}><SheetHeading title="Your next keepsake" onDone={()=>setNextOpen(false)}/><View style={{alignItems:'center'}}><EnamelAchievement size={195} achievementId={next?.id}/></View><Text style={{...uiText.sectionTitle,textAlign:'center',color:p.ink}}>{next?.title}</Text><Text style={{...uiText.body,color:p.muted,textAlign:'center'}}>{remaining} more {remaining===1?'morning':'mornings'} of showing up, and this keepsake is yours.</Text><View style={{height:6,borderRadius:3,backgroundColor:p.line,overflow:'hidden'}}><View style={{width:`${progress*100}%`,height:6,backgroundColor:MARIGOLD}}/></View><Text style={{...uiText.supporting,textAlign:'center',color:p.muted}}>{streak.current} of {next?.target} days</Text></ScrollView></ReaderSheet>
  </View>;
}

const ghost=(dark:boolean)=>({borderWidth:2,borderStyle:'dashed' as const,borderColor:dark?'#FFFFFF24':'#6E645C47',boxShadow:'none'});
function GhostIcon({icon,dark}:{icon:SFSymbolName;dark:boolean}) {
  return <View pointerEvents="none" style={[s.art,{alignItems:'center',paddingTop:26}]}><View style={{width:52,height:52,borderRadius:26,backgroundColor:dark?'#FFFFFF12':'#6E645C1A',alignItems:'center',justifyContent:'center'}}><SFSymbol name={icon} size={20} color={dark?'#BBAA99':'#6E645C'}/></View></View>;
}

const s = StyleSheet.create({
  cover: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, borderCurve: 'continuous', overflow: 'hidden', boxShadow: '0 20px 36px -24px #3C1E0AB3' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  av: { width: 48, height: 48, borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 2, borderColor: '#FFF1E42E' },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF1E41F', alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 18 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingVertical: 12, paddingLeft: 12, paddingRight: 16, borderRadius: 22, borderCurve: 'continuous' },
  art: { position: 'absolute', left: 0, right: 0, top: 0, height: 112 },
  gilt: { position: 'absolute', width: 56, height: 78, borderRadius: 9, overflow: 'hidden', borderWidth: 2, borderColor: '#E9B949', boxShadow: '0 10px 18px -8px #000000B3' },
  paper: { position: 'absolute', left: 22, top: 14, width: 78, height: 92, borderRadius: 6, paddingVertical: 16, paddingHorizontal: 10, gap: 8, transform: [{ rotate: '-5deg' }], boxShadow: '0 8px 16px -8px #502D0A80' },
  tt: { fontSize: 17, lineHeight: 21, fontWeight: '900' },
  ts: { fontSize: 13, lineHeight: 17, fontWeight: '700', marginTop: 2 },
  rows: { marginTop: 14, borderRadius: 22, borderCurve: 'continuous' },
  row: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { position: 'absolute', top: 0, left: 64, right: 0, height: StyleSheet.hairlineWidth },
  ri: { width: 34, height: 34, borderRadius: 10, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
});
