import { uiText } from '@/lib/typography';
import { MomentArtworkViewer } from './MomentArtworkViewer';
import { buttonStyles } from '@/lib/buttonStyles';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOMENT_CATEGORIES, type BibleMoment } from '@/constants/bibleMoments';
import { findBookById } from '@/constants/books';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ReaderMomentArt } from './ReaderMomentArt';
import { SFSymbol } from './Symbol';

export type MomentDetailOrigin = { x:number; y:number; width:number; height:number };
/** Detail remains inside the reveal modal, preserving its book-colored atmosphere. */
export function MomentRevealDetail({moment,origin,onBack,onClose,preview}:{moment:BibleMoment;origin:MomentDetailOrigin;onBack:()=>void;onClose:()=>void;preview:boolean}) {
  const [artOpen,setArtOpen]=useState(false);
  const insets=useSafeAreaInsets(), reduced=useReducedMotion();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(88, (width - 48) * .25), cardHeight = cardWidth * 1.38;
  const progress=useSharedValue(0), [arrived,setArrived]=useState(reduced);
  const [viewport, setViewport] = useState(0), [contentHeight, setContentHeight] = useState(0), [scrollY, setScrollY] = useState(0);
  const hasMore = contentHeight > viewport + scrollY + 12;
  const book=findBookById(moment.bookId)?.name??moment.bookId;
  useEffect(()=>{progress.value=withTiming(1,{duration:reduced?180:740,easing:Easing.bezier(.22,.8,.22,1)},finished=>{if(finished)runOnJS(setArrived)(true)});return()=>cancelAnimation(progress)},[]);
  const movingCard=useAnimatedStyle(()=>({opacity:reduced?0:1,transform:[
    {translateX:(origin.x-24)*(1-progress.value)},
    {translateY:(origin.y-insets.top-66)*(1-progress.value)},
    {scaleX:origin.width/cardWidth+(1-origin.width/cardWidth)*progress.value},
    {scaleY:origin.height/cardHeight+(1-origin.height/cardHeight)*progress.value},
  ]}));
  const copy=useAnimatedStyle(()=>({opacity:Math.max(0,(progress.value-.3)/.7),transform:[{translateY:reduced?0:15*(1-progress.value)}]}));
  const backdrop=useAnimatedStyle(()=>({opacity:progress.value*.45}));
  const label=useAnimatedStyle(()=>({opacity:Math.max(0,1-progress.value*4)}));
  return <View style={{flex:1}}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:'#211c18'},backdrop]}/>
    <View style={styles.nav}><Pressable accessibilityRole="button" accessibilityLabel="Back to revealed card" onPress={onBack} style={styles.icon}><SFSymbol name="chevron.left" size={19} color="#e7d4c0"/></Pressable><View style={styles.icon}/></View>
    <ScrollView style={{flex:1}} onLayout={e=>setViewport(e.nativeEvent.layout.height)} onContentSizeChange={(_,h)=>setContentHeight(h)} onScroll={e=>setScrollY(e.nativeEvent.contentOffset.y)} scrollEventThrottle={32} scrollEnabled={arrived} contentContainerStyle={{paddingHorizontal:24,paddingTop:18,paddingBottom:16}} showsVerticalScrollIndicator indicatorStyle="white">
      <View style={{flexDirection:'row',gap:16,minHeight:cardHeight+12,alignItems:'center'}}>
        <Pressable accessibilityRole="button" accessibilityLabel="View artwork full screen" onPress={()=>setArtOpen(true)} style={[styles.thumb,{width:cardWidth,height:cardHeight,opacity:arrived?1:0}]}><ReaderMomentArt moment={moment}/></Pressable>
        <Animated.View style={[{flex:1,gap:10},copy]}><Text style={styles.category}>{MOMENT_CATEGORIES[moment.category].name.toUpperCase()}</Text><Text accessibilityRole="header" style={styles.title}>{moment.title}</Text><Text style={styles.reference}>{moment.reference}</Text></Animated.View>
      </View>
      <Animated.View style={copy}>
        <Text selectable style={styles.quote}>“{moment.happened}”</Text>

        <View style={{paddingHorizontal:2,marginTop:8}}><Text accessibilityRole="header" style={styles.sectionTitle}>Why it matters</Text><Text selectable style={styles.body}>{moment.importance}</Text></View>
        {preview && <Text style={{color:'#bda58f',fontSize:12,marginTop:24}}>Developer preview · Progress unchanged</Text>}
      </Animated.View>
    </ScrollView>
    {!arrived&&!reduced&&<Animated.View pointerEvents="none" style={[styles.thumb,{width:cardWidth,height:cardHeight,position:'absolute',left:24,top:66,transformOrigin:'top left',zIndex:4},movingCard]}><ReaderMomentArt moment={moment}/><Animated.View style={[{position:'absolute',bottom:8,left:7},label]}><Text style={{color:'#fff3e3',fontSize:4,backgroundColor:'#8d482e',padding:2,borderRadius:3}}>{book}</Text></Animated.View></Animated.View>}
    <View style={{paddingHorizontal:24,paddingTop:12,paddingBottom:12}}>{hasMore&&<Text style={{color:'#cbb49f',fontSize:13,textAlign:'center',marginBottom:8}}>Scroll to read more ↓</Text>}<Pressable accessibilityRole="button" onPress={onClose} style={[buttonStyles.primary,{backgroundColor:'#fff1da'}]}><Text style={[buttonStyles.label,{color:'#36281f'}]}>Keep reading</Text></Pressable></View>
    {artOpen&&<MomentArtworkViewer moment={moment} onClose={()=>setArtOpen(false)}/>}
  </View>;
}
const styles=StyleSheet.create({nav:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},navTitle:{fontSize:14,fontWeight:'600',color:'#ccbaa8'},thumb:{width:76,height:105,borderRadius:9,borderCurve:'continuous',overflow:'hidden',borderWidth:1,borderColor:'#e4b578',boxShadow:'1px 2px 0 #a58152, 0 6px 14px #00000033'},category:{fontSize:11,letterSpacing:1.4,color:'#dfa778',fontWeight:'600'},title:{...uiText.screenTitle,color:'#fff3e3'},reference:{fontSize:15,color:'#cbb49f'},quote:{fontFamily:'NunitoMedium',fontWeight:'500',fontSize:22,lineHeight:31,color:'#f9ead6',borderLeftWidth:2,borderLeftColor:'#c78353',paddingLeft:16,marginTop:24,marginBottom:24},note:{padding:20,borderWidth:1,borderColor:'#d1a37420',borderRadius:19,borderCurve:'continuous',backgroundColor:'#ead0af09',marginBottom:19},sectionTitle:{...uiText.sectionTitle,color:'#fff3e3',marginBottom:10},body:{fontSize:17,lineHeight:25,color:'#d5c1ac'},check:{width:21,height:21,borderRadius:11,backgroundColor:'#2e8b51',alignItems:'center',justifyContent:'center'},button:{minHeight:50,borderRadius:27,backgroundColor:'#fff1da',alignItems:'center',justifyContent:'center',padding:14}});
