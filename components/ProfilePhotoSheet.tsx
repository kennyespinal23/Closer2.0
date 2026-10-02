import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import { ReaderSheet } from './ReaderSheet';
import { SheetHeading } from './SheetHeading';
import { SFSymbol } from './Symbol';
import { AVATARS, findAvatar } from '@/constants/avatars';
import { useColors } from '@/state/theme';
import { useOnboarding } from '@/state/onboarding';

/** Changes remain a draft until Save; imported photos are stored on this device. */
export function ProfilePhotoSheet({visible,onClose}:{visible:boolean;onClose:()=>void}) {
  const c=useColors(),{answers,setAnswer}=useOnboarding();
  const [uri,setUri]=useState<string|undefined>(),[id,setId]=useState<string|undefined>(),[gallery,setGallery]=useState(false),[busy,setBusy]=useState(false);
  useEffect(()=>{if(visible){setUri(answers.avatarPhotoUri);setId(answers.avatarId);setGallery(false);}},[visible]);
  const source=uri?{uri}:findAvatar(id)?.source;
  async function pick(){
    try {
      // Lazy loading keeps older development binaries usable until rebuilt.
      const picker=await import('expo-image-picker');
      const result=await picker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.85});
      if(!result.canceled){setUri(result.assets[0].uri);setId(undefined);}
    }catch{Alert.alert('Photo picker unavailable','Install the latest app build to choose a photo. You can still use initials or a Closer avatar.');}
  }
  async function save(){
    if(busy)return;setBusy(true);
    try{
      let saved=uri;
      if(uri&&uri!==answers.avatarPhotoUri){const file=new File(Paths.document,`profile-${Date.now()}.jpg`);new File(uri).copy(file);saved=file.uri;}
      setAnswer('avatarPhotoUri',saved);setAnswer('avatarId',id);onClose();
    }catch{Alert.alert('Couldn’t save photo','Please try again. Your current profile picture is unchanged.');}finally{setBusy(false);}
  }
  return <ReaderSheet visible={visible} onClose={onClose} detents={[.7,1]} scrollable>
    <ScrollView contentContainerStyle={{padding:24,paddingBottom:36,gap:24}}>
      <SheetHeading title="Profile photo" onDone={onClose}/>
      <View style={{alignItems:'center'}}>{source?<Image source={source} style={{width:104,height:104,borderRadius:52}} contentFit="cover"/>:<View style={{width:104,height:104,borderRadius:52,backgroundColor:c.surface,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:40,color:c.ink}}>{(answers.name||'Friend').charAt(0).toUpperCase()}</Text></View>}</View>
      <View style={{borderRadius:16,backgroundColor:c.surface,overflow:'hidden'}}>
        {([{title:'Choose a photo',icon:'photo',action:pick},{title:'Use initials',icon:'person',action:()=>{setUri(undefined);setId(undefined);setGallery(false);}},{title:'Closer avatars',icon:'face.smiling',action:()=>setGallery(!gallery)}] as const).map((row,i)=><Pressable key={row.title} accessibilityRole="button" onPress={row.action} style={{minHeight:54,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:13,borderTopWidth:i?1:0,borderColor:c.border}}><SFSymbol name={row.icon} size={22} color={c.ink}/><Text style={{fontSize:16,color:c.ink,flex:1}}>{row.title}</Text><SFSymbol name="chevron.right" size={12} color={c.inkMuted}/></Pressable>)}
      </View>
      {gallery&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:16}}>{AVATARS.map(a=><Pressable key={a.id} accessibilityRole="button" accessibilityLabel={`Choose ${a.id}`} accessibilityState={{selected:a.id===id&&!uri}} onPress={()=>{setId(a.id);setUri(undefined);}} style={{padding:3,borderRadius:36,borderWidth:2,borderColor:a.id===id&&!uri?c.ink:'transparent'}}><Image source={a.source} style={{width:60,height:60,borderRadius:30}}/></Pressable>)}</View>}
      <Text style={{fontSize:13,lineHeight:19,color:c.inkMuted}}>You can also choose a Memoji image saved to your photos. Your profile photo stays on this device.</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={save} style={{backgroundColor:c.ink,borderRadius:16,minHeight:50,alignItems:'center',justifyContent:'center',opacity:busy?.5:1}}><Text style={{color:c.bg,fontSize:17,fontWeight:'600'}}>{busy?'Saving…':'Save'}</Text></Pressable>
    </ScrollView>
  </ReaderSheet>;
}
