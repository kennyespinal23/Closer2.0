import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  const insets=useSafeAreaInsets(), reduced=useReducedMotion();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(108, (width - 48) * .29), cardHeight = cardWidth * 1.38;
  const progress=useSharedValue(0), [arrived,setArrived]=useState(reduced);
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
    <ScrollView scrollEnabled={arrived} contentContainerStyle={{paddingHorizontal:24,paddingTop:18,paddingBottom:28}} showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:'row',gap:20,minHeight:cardHeight+12,alignItems:'center'}}>
        <View style={[styles.thumb,{width:cardWidth,height:cardHeight,opacity:arrived?1:0}]}><ReaderMomentArt moment={moment}/></View>
        <Animated.View style={[{flex:1,gap:10},copy]}><Text style={styles.category}>{MOMENT_CATEGORIES[moment.category].name.toUpperCase()}</Text><Text accessibilityRole="header" style={styles.title}>{moment.title}</Text><Text style={styles.reference}>{moment.reference}</Text></Animated.View>
      </View>
      <Animated.View style={copy}>
        <Text selectable style={styles.quote}>“{moment.happened}”</Text>

        <View style={{paddingHorizontal:2,marginTop:8}}><Text accessibilityRole="header" style={styles.sectionTitle}>Why it matters</Text><Text selectable style={styles.body}>{moment.importance}</Text></View>
        {preview && <Text style={{color:'#bda58f',fontSize:12,marginTop:24}}>Developer preview · Progress unchanged</Text>}
      </Animated.View>
    </ScrollView>
    {!arrived&&!reduced&&<Animated.View pointerEvents="none" style={[styles.thumb,{width:cardWidth,height:cardHeight,position:'absolute',left:24,top:66,transformOrigin:'top left',zIndex:4},movingCard]}><ReaderMomentArt moment={moment}/><Animated.View style={[{position:'absolute',bottom:8,left:7},label]}><Text style={{color:'#fff3e3',fontSize:4,backgroundColor:'#8d482e',padding:2,borderRadius:3}}>{book}</Text></Animated.View></Animated.View>}
    <View style={{paddingHorizontal:24,paddingTop:16,paddingBottom:12}}><Pressable accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={{fontSize:16,fontWeight:'600',color:'#36281f'}}>Keep reading</Text></Pressable></View>
  </View>;
}
const styles=StyleSheet.create({nav:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},navTitle:{fontSize:14,fontWeight:'600',color:'#ccbaa8'},thumb:{width:76,height:105,borderRadius:9,borderCurve:'continuous',overflow:'hidden',borderWidth:1,borderColor:'#e4b578',boxShadow:'1px 2px 0 #a58152, 0 6px 14px #00000033'},category:{fontSize:11,letterSpacing:1.4,color:'#dfa778',fontWeight:'600'},title:{fontSize:30,lineHeight:35,letterSpacing:-.7,fontWeight:'700',color:'#fff3e3'},reference:{fontSize:15,color:'#cbb49f'},quote:{fontFamily:'Georgia',fontSize:28,lineHeight:40,color:'#f9ead6',borderLeftWidth:2,borderLeftColor:'#c78353',paddingLeft:16,marginTop:30,marginBottom:32},note:{padding:20,borderWidth:1,borderColor:'#d1a37420',borderRadius:19,borderCurve:'continuous',backgroundColor:'#ead0af09',marginBottom:19},sectionTitle:{fontSize:20,fontWeight:'600',color:'#fff3e3',marginBottom:10},body:{fontSize:18,lineHeight:29,color:'#d5c1ac'},check:{width:21,height:21,borderRadius:11,backgroundColor:'#2e8b51',alignItems:'center',justifyContent:'center'},button:{minHeight:50,borderRadius:27,backgroundColor:'#fff1da',alignItems:'center',justifyContent:'center',padding:14}});
