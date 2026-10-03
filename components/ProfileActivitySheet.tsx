import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/CloserText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ReaderSheet } from './ReaderSheet';
import { SheetHeading } from './SheetHeading';
import { SFSymbol } from './Symbol';
import { useColors } from '@/state/theme';
import { findBookById } from '@/constants/books';

type Activity={id:string;text:string;author:string;verse:number;read?:boolean;bookId:string;chapter:number;storage:string};
export function ProfileActivitySheet({visible,onClose}:{visible:boolean;onClose:()=>void}) {
 const c=useColors(),router=useRouter();const [items,setItems]=useState<Activity[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{if(!visible)return;let live=true;setLoading(true);setError(false);
 (async()=>{const keys=(await AsyncStorage.getAllKeys()).filter(k=>k.startsWith('closer.reader.groupComments.preview:'));const rows=await AsyncStorage.multiGet(keys);const result:Activity[]=[];
 for(const [storage,raw] of rows){const [bookId,ch]=storage.slice('closer.reader.groupComments.preview:'.length).split(':');try{const comments=JSON.parse(raw||'[]');if(Array.isArray(comments))for(const comment of comments){if(comment.mentionsMe&&comment.author!=='You'&&typeof comment.text==='string'&&Number.isInteger(comment.verse))result.push({...comment,bookId,chapter:Number(ch),storage});}}catch{}}
 if(live)setItems(result.reverse());})().catch(()=>{if(live)setError(true)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false};},[visible]);
 return <ReaderSheet visible={visible} onClose={onClose} detents={[.55,1]} scrollable><ScrollView contentContainerStyle={{padding:24,paddingBottom:40}}><SheetHeading title="Activity" onDone={onClose}/>
 <Text style={{color:c.inkMuted,fontSize:13,marginTop:24,marginBottom:12}}>Local group previews</Text>
 {loading?<Text style={{color:c.inkMuted}}>Loading activity…</Text>:error?<Text accessibilityRole="alert" style={{color:c.inkMuted}}>Couldn’t load activity. Close this sheet and try again.</Text>:items.length===0?<View style={{alignItems:'center',paddingVertical:38,gap:14}}><SFSymbol name="bell" size={30} color={c.inkMuted}/><Text style={{fontSize:19,fontWeight:'600',color:c.ink}}>You’re all caught up</Text><Text style={{fontSize:15,lineHeight:22,textAlign:'center',color:c.inkMuted}}>Saved mentions from your local study-group previews will appear here.</Text></View>:items.map(row=><Pressable key={row.storage+row.id} accessibilityRole="button" accessibilityLabel={`Open ${findBookById(row.bookId)?.name} ${row.chapter}:${row.verse}`} onPress={async()=>{try{const current=JSON.parse(await AsyncStorage.getItem(row.storage)||'[]');if(Array.isArray(current))await AsyncStorage.setItem(row.storage,JSON.stringify(current.map(x=>x.id===row.id?{...x,read:true}:x)));}catch{} onClose();router.push({pathname:'/book/[id]/[chapter]',params:{id:row.bookId,chapter:String(row.chapter),verse:String(row.verse)}})}} style={{flexDirection:'row',gap:12,paddingVertical:18,borderBottomWidth:1,borderColor:c.border}}><View style={{width:42,height:42,borderRadius:21,backgroundColor:'#426b53',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontSize:16}}>{(row.author||'Member')[0]}</Text></View><View style={{flex:1,gap:5}}><Text style={{fontSize:12,fontWeight:'600',color:c.inkMuted}}>Mentioned you · Preview</Text><Text style={{fontSize:15,fontWeight:'600',color:c.ink}}>{row.author||'Group member'}</Text><Text style={{fontSize:15,lineHeight:22,color:c.ink}}>{row.text}</Text><Text style={{fontSize:12,color:c.inkMuted}}>{findBookById(row.bookId)?.name} {row.chapter}:{row.verse}</Text></View>{!row.read&&<View style={{width:7,height:7,borderRadius:4,backgroundColor:'#328453',marginTop:7}}/>}</Pressable>)}
 <Text style={{fontSize:12,lineHeight:18,color:c.inkMuted,marginTop:20}}>Group conversations are currently local previews, not live notifications.</Text></ScrollView></ReaderSheet>;
}
