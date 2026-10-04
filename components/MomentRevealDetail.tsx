import { uiText } from '@/lib/typography';
import { MomentArtworkViewer } from './MomentArtworkViewer';
import { buttonStyles } from '@/lib/buttonStyles';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useAnimatedScrollHandler, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { MOMENT_CATEGORIES, type BibleMoment } from '@/constants/bibleMoments';
import { ReaderMaterialGradient } from './ReaderMaterialGradient';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { ReaderMomentArt } from './ReaderMomentArt';
import { SFSymbol } from './Symbol';

export type MomentDetailOrigin = { x:number; y:number; width:number; height:number; pillColor:string; shadeColor:string; edgeColor:string; scale:number };
/** Detail remains inside the reveal modal, preserving its book-colored atmosphere. */
export function MomentRevealDetail({moment,origin,onBack,onClose,preview,previewRoundtrip=false,progress,gloss}:{moment:BibleMoment;origin:MomentDetailOrigin;onBack:()=>void;onClose:()=>void;preview:boolean;previewRoundtrip?:boolean;progress:SharedValue<number>;gloss:SharedValue<number>}) {
  const [artOpen,setArtOpen]=useState(false);
  const reduced=useReducedMotion();
  const rootRef=useRef<View>(null), thumbRef=useRef<View>(null);
  const [destination,setDestination]=useState<{x:number;y:number;rootX:number;rootY:number}|null>(null);
  const measureDestination=()=>rootRef.current?.measureInWindow((rootX,rootY)=>thumbRef.current?.measureInWindow((x,y,w,h)=>{if(w>0&&h>0)setDestination({x:x-rootX,y:y-rootY,rootX,rootY});}));
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(88, (width - 48) * .25), cardHeight = cardWidth * 4/3;
  const returning=useRef(false);
  const currentScroll=useSharedValue(0);
  const [arrived,setArrived]=useState(reduced);
  const [viewport, setViewport] = useState(0), [contentHeight, setContentHeight] = useState(0), [scrollY, setScrollY] = useState(0);
  const onScroll=useAnimatedScrollHandler(event=>{currentScroll.value=event.contentOffset.y;runOnJS(setScrollY)(event.contentOffset.y);});
  const hasMore = contentHeight > viewport + scrollY + 12;
  useEffect(()=>{if(!destination||returning.current)return;progress.value=withTiming(1,{duration:reduced?180:740,easing:Easing.bezier(.22,.8,.22,1)},finished=>{if(finished)runOnJS(setArrived)(true)});return()=>cancelAnimation(progress)},[destination,reduced]);
  const returnToCard=()=>{
    if(returning.current)return;
    returning.current=true;
    setArrived(false);

    progress.value=withTiming(0,{duration:reduced?160:600,easing:Easing.bezier(.22,.8,.22,1)},finished=>{if(finished)runOnJS(onBack)();});
  };
  useEffect(()=>{
    const listener=BackHandler.addEventListener('hardwareBackPress',()=>{returnToCard();return true;});
    return()=>listener.remove();
  },[scrollY,onBack,reduced]);
  useEffect(()=>{if(!previewRoundtrip||!arrived)return;const timer=setTimeout(returnToCard,1200);return()=>clearTimeout(timer);},[previewRoundtrip,arrived]);
  const movingCard=useAnimatedStyle(()=>({opacity:reduced?progress.value:progress.value===0?0:1,borderRadius:23+(9*origin.width/cardWidth-23)*(reduced?1:progress.value),transform:reduced?[{translateY:-currentScroll.value},{scaleX:cardWidth/origin.width},{scaleY:cardHeight/origin.height}]:[
    {translateX:(origin.x-(destination?.rootX??0)-(destination?.x??24))*(1-progress.value)},
    {translateY:(origin.y-(destination?.rootY??0)-(destination?.y??66))*(1-progress.value)-currentScroll.value*progress.value},
    {scaleX:1+(cardWidth/origin.width-1)*progress.value},
    {scaleY:1+(cardHeight/origin.height-1)*progress.value},
  ]}));
  const thumbnailStyle={opacity:0};
  const shineStyle=useAnimatedStyle(()=>({opacity:Math.max(0,1-progress.value*4),transform:[{translateX:gloss.value*380},{rotate:'25deg'}]}));
  const copy=useAnimatedStyle(()=>({opacity:Math.max(0,(progress.value-.3)/.7),transform:[{translateY:reduced?0:15*(1-progress.value)}]}));
  const backdrop=useAnimatedStyle(()=>({opacity:progress.value*.45}));
  const label=useAnimatedStyle(()=>({opacity:Math.max(0,1-progress.value*4)}));
  return <View ref={rootRef} collapsable={false} style={{flex:1}}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:'#211c18'},backdrop]}/>
    <Animated.View style={[styles.nav,copy]}><Pressable accessibilityRole="button" accessibilityLabel="Back to revealed card" onPress={returnToCard} style={styles.icon}><SFSymbol name="chevron.left" size={19} color="#e7d4c0"/></Pressable><View style={styles.icon}/></Animated.View>
    <Animated.ScrollView style={{flex:1}} onLayout={e=>setViewport(e.nativeEvent.layout.height)} onContentSizeChange={(_,h)=>setContentHeight(h)} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={arrived} contentContainerStyle={{paddingHorizontal:24,paddingTop:18,paddingBottom:16}} showsVerticalScrollIndicator indicatorStyle="white">
      <View style={{flexDirection:'row',gap:16,minHeight:cardHeight+12,alignItems:'center'}}>
        <View ref={thumbRef} collapsable={false} onLayout={measureDestination} style={{width:cardWidth,height:cardHeight}}><Animated.View style={[styles.thumb,{width:cardWidth,height:cardHeight},thumbnailStyle]}><Pressable disabled={!arrived} accessibilityRole="button" accessibilityLabel="View artwork full screen" onPress={()=>setArtOpen(true)} style={{flex:1}}><ReaderMomentArt moment={moment}/></Pressable></Animated.View></View>
        <Animated.View style={[{flex:1,gap:10},copy]}><Text style={styles.category}>{MOMENT_CATEGORIES[moment.category].name.toUpperCase()}</Text><Text accessibilityRole="header" style={styles.title}>{moment.title}</Text><Text style={styles.reference}>{moment.reference}</Text></Animated.View>
      </View>
      <Animated.View style={copy}>
        <Text selectable style={styles.quote}>“{moment.happened}”</Text>

        <View style={{paddingHorizontal:2,marginTop:8}}><Text accessibilityRole="header" style={styles.sectionTitle}>Why it matters</Text><Text selectable style={styles.body}>{moment.importance}</Text></View>
        {preview && <Text style={{color:'#bda58f',fontSize:12,marginTop:24}}>Developer preview · Progress unchanged</Text>}
      </Animated.View>
    </Animated.ScrollView>
    {destination&&<Animated.View pointerEvents="none" style={[styles.thumb,{width:origin.width,height:origin.height,borderColor:origin.edgeColor,backgroundColor:'#375849',boxShadow:'2px 4px 0 #816248, 0 22px 35px #00000044',position:'absolute',left:destination.x,top:destination.y,transformOrigin:'top left',zIndex:4},movingCard]}>
      <ReaderMomentArt moment={moment}/>
      <Animated.View style={[StyleSheet.absoluteFill,label]}>
        <ReaderMaterialGradient colors={['#40271b00',origin.shadeColor+'ee']} style={{position:'absolute',bottom:0,left:0,right:0,height:175*origin.scale}}/>
        <View style={{position:'absolute',bottom:26*origin.scale,left:22*origin.scale,right:22*origin.scale}}><View style={{alignSelf:'center',maxWidth:'100%',backgroundColor:origin.pillColor+'cc',borderRadius:12,paddingHorizontal:9,paddingVertical:5}}><Text style={{color:'#fff5e8',fontSize:11*origin.scale,textAlign:'center'}}>{moment.reference}</Text></View></View>
        <View style={{position:'absolute',right:12,top:12,width:36,height:36,borderRadius:18,backgroundColor:'#00000080',alignItems:'center',justifyContent:'center'}}><SFSymbol name="arrow.up.left.and.arrow.down.right" size={18} color="white"/></View>
      </Animated.View>
      <Animated.View style={[{position:'absolute',top:-100,bottom:-100,width:110,left:66},shineStyle]}><ReaderMaterialGradient horizontal colors={['#ffffff00','#ffffff55','#ffffff00']} style={StyleSheet.absoluteFill}/></Animated.View>
    </Animated.View>}

    <Animated.View style={[{paddingHorizontal:24,paddingTop:12,paddingBottom:12},copy]}>{hasMore&&<Text style={{color:'#cbb49f',fontSize:13,textAlign:'center',marginBottom:8}}>Scroll to read more ↓</Text>}<Pressable accessibilityRole="button" onPress={onClose} style={[buttonStyles.primary,{backgroundColor:'#fff1da'}]}><Text style={[buttonStyles.label,{color:'#36281f'}]}>Keep reading</Text></Pressable></Animated.View>
    {artOpen&&<MomentArtworkViewer moment={moment} onClose={()=>setArtOpen(false)}/>}
  </View>;
}
const styles=StyleSheet.create({nav:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},navTitle:{fontSize:14,fontWeight:'600',color:'#ccbaa8'},thumb:{width:76,height:105,borderRadius:9,borderCurve:'continuous',overflow:'hidden',borderWidth:1,borderColor:'#e4b578',boxShadow:'1px 2px 0 #a58152, 0 6px 14px #00000033'},category:{fontSize:11,letterSpacing:1.4,color:'#dfa778',fontWeight:'600'},title:{...uiText.screenTitle,color:'#fff3e3'},reference:{fontSize:15,color:'#cbb49f'},quote:{fontFamily:'NunitoMedium',fontWeight:'500',fontSize:22,lineHeight:31,color:'#f9ead6',borderLeftWidth:2,borderLeftColor:'#c78353',paddingLeft:16,marginTop:24,marginBottom:24},note:{padding:20,borderWidth:1,borderColor:'#d1a37420',borderRadius:19,borderCurve:'continuous',backgroundColor:'#ead0af09',marginBottom:19},sectionTitle:{...uiText.sectionTitle,color:'#fff3e3',marginBottom:10},body:{fontSize:17,lineHeight:25,color:'#d5c1ac'},check:{width:21,height:21,borderRadius:11,backgroundColor:'#2e8b51',alignItems:'center',justifyContent:'center'},button:{minHeight:50,borderRadius:27,backgroundColor:'#fff1da',alignItems:'center',justifyContent:'center',padding:14}});
