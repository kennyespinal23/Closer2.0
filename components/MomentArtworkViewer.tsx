import { useRef } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBibleMomentArt, BIBLE_MOMENT_ART_LABELS } from '@/constants/bibleMomentArt';
import type { BibleMoment } from '@/constants/bibleMoments';
import { SFSymbol } from './Symbol';
import { Text } from './CloserText';
import { ReaderMomentArt } from './ReaderMomentArt';

/** Full uncropped artwork, with native iOS pinch zoom and accessible zoom controls. */
export function MomentArtworkViewer({moment,onClose}:{moment:BibleMoment;onClose:()=>void}) {
  const {width,height}=useWindowDimensions(), inset=useSafeAreaInsets();
  const scroll=useRef<ScrollView>(null);
  const h=height-inset.top-inset.bottom-112;
  const source=getBibleMomentArt(moment.id);
  return <Modal visible presentationStyle="fullScreen" animationType="fade" onRequestClose={onClose}>
    <View style={{flex:1,backgroundColor:'#11100F',paddingTop:inset.top,paddingBottom:inset.bottom}} accessibilityViewIsModal>
      <View style={{height:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16}}>
        <Text style={{flex:1,color:'#FFF5E8',fontSize:17,fontWeight:'700'}}>{moment.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close artwork" onPress={onClose} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><SFSymbol name="xmark" size={22} color="#FFF5E8"/></Pressable>
      </View>
      <ScrollView ref={scroll} style={{flex:1}} minimumZoomScale={1} maximumZoomScale={4} centerContent bouncesZoom showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <View style={{width,height:h}}>{source?<Image source={source} contentFit="contain" allowDownscaling={false} style={{width:'100%',height:'100%'}} accessibilityLabel={BIBLE_MOMENT_ART_LABELS[moment.id]??moment.title}/>:<ReaderMomentArt moment={moment}/>}</View>
      </ScrollView>
      <View style={{height:56,flexDirection:'row',justifyContent:'center',gap:24}}>
        <Pressable accessibilityRole="button" onPress={()=>scroll.current?.scrollResponderZoomTo({x:width*.25,y:h*.25,width:width*.5,height:h*.5,animated:true})} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#FFF5E8',fontSize:17}}>Zoom in</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>scroll.current?.scrollResponderZoomTo({x:0,y:0,width,height:h,animated:true})} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:'#FFF5E8',fontSize:17}}>Reset</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
