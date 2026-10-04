import { CloseButton } from "@/components/CloseButton";
import { useEffect, useRef } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBibleMomentArt, BIBLE_MOMENT_ART_LABELS } from '@/constants/bibleMomentArt';
import type { BibleMoment } from '@/constants/bibleMoments';
import { SFSymbol } from './Symbol';
import { ReaderMomentArt } from './ReaderMomentArt';

/** Uncropped artwork with iOS's native pinch-to-zoom and pan gestures. */
export function MomentArtworkViewer({moment,onClose}:{moment:BibleMoment;onClose:()=>void}) {
  const {width,height}=useWindowDimensions(), inset=useSafeAreaInsets();
  const availableHeight=Math.max(1,height-inset.top-inset.bottom-56-32);
  const artWidth=Math.min(width-32,availableHeight*3/4);
  const artHeight=artWidth*4/3;
  const source=getBibleMomentArt(moment.id);
  const reduced=useReducedMotion();
  const closing=useRef(false);
  const appearance=useSharedValue(0);
  useEffect(()=>{ appearance.value=withTiming(1,{duration:reduced?120:260,easing:Easing.out(Easing.cubic)}); },[appearance,reduced]);
  const artworkStyle=useAnimatedStyle(()=>({opacity:appearance.value,transform:[{scale:reduced?1:.94+.06*appearance.value}]}));
  const backdropStyle=useAnimatedStyle(()=>({opacity:appearance.value}));
  const close=()=>{
    if(closing.current)return;
    closing.current=true;
    appearance.value=withTiming(0,{duration:reduced?100:180,easing:Easing.out(Easing.cubic)},finished=>{if(finished)runOnJS(onClose)();});
  };
  return <Modal visible transparent presentationStyle="overFullScreen" animationType="none" onRequestClose={close}>
    <View style={{flex:1,paddingTop:inset.top,paddingBottom:inset.bottom}} accessibilityViewIsModal>
      <Animated.View pointerEvents="none" style={[{position:'absolute',inset:0,backgroundColor:'#11100F'},backdropStyle]}/>
      <View style={{height:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'flex-end'}}>
        <CloseButton accessibilityRole="button" accessibilityLabel="Close artwork" onPress={close} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}} color="#FFF5E8" />
      </View>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:16}}>
        <Animated.View style={[{width:artWidth,height:artHeight,borderRadius:24,borderCurve:'continuous',overflow:'hidden'},artworkStyle]}>
          {/* Match the native zoom viewport to the art. Center the viewport outside
              the scroll view so iOS never adds a changing centering inset during a pinch. */}
          <ScrollView key={`${width}-${height}`} style={{width:artWidth,height:artHeight}} minimumZoomScale={1} maximumZoomScale={4} bouncesZoom pinchGestureEnabled showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}>
            <View collapsable={false} style={{width:artWidth,height:artHeight,borderRadius:24,borderCurve:'continuous',overflow:'hidden'}}>{source?<Image source={source} contentFit="contain" allowDownscaling={false} style={{width:'100%',height:'100%'}} accessibilityLabel={BIBLE_MOMENT_ART_LABELS[moment.id]??moment.title}/>:<ReaderMomentArt moment={moment}/>}</View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  </Modal>;
}
