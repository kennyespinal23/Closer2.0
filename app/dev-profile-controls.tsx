import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { isInternalBuild } from '@/lib/isInternalBuild';
import { useDevTools } from '@/state/devTools';
import { ProfilePhotoSheet } from '@/components/ProfilePhotoSheet';
import { ProfileActivitySheet } from '@/components/ProfileActivitySheet';
import { ProfileAudioPlayer } from '@/components/audio/ProfileAudioPlayer';
import { useColors } from '@/state/theme';
export default function DevProfileControls(){
 const {kind}=useLocalSearchParams<{kind?:string}>(),router=useRouter(),{enabled}=useDevTools(),c=useColors();
 const [ready,setReady]=useState(false);
 useEffect(()=>{setReady(false);const timer=setTimeout(()=>setReady(true),650);return()=>clearTimeout(timer)},[kind]);
 const close=()=>router.replace('/(tabs)/profile');
 if(!isInternalBuild()&&!enabled)return <View/>;
 return <View style={{flex:1,backgroundColor:c.bg}}>{kind==='photo'?<ProfilePhotoSheet visible={ready} onClose={close}/>:kind==='activity'?<ProfileActivitySheet visible={ready} onClose={close}/>:<ProfileAudioPlayer visible={ready} onClose={close} preview/>}</View>;
}
