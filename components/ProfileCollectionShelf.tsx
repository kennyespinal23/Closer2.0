import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useColors } from "@/state/theme";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { ReaderMomentCardBox } from "./ReaderMomentCardBox";
import { SFSymbol } from "./Symbol";
export function ProfileCollectionShelf() {
  const colors = useColors(), {ids} = useBibleMomentCollection(), [open,setOpen] = useState(false), source = useRef<View>(null);
  return <View style={{margin:20,marginTop:32,gap:14}}><View style={{flexDirection:"row",alignItems:"center"}}><Text style={{color:colors.ink,fontSize:22,fontWeight:"700",flex:1}}>Bible Moments</Text><Text style={{color:colors.inkMuted,fontSize:14}}>{ids.length} of {BIBLE_MOMENTS.length}</Text></View><Pressable accessibilityRole="button" onPress={()=>setOpen(true)} style={{backgroundColor:colors.surface,borderRadius:22,padding:20,flexDirection:"row",gap:18,alignItems:"center"}}><View ref={source} collapsable={false} style={{width:74,height:70,justifyContent:"flex-end"}}>{[-1,0,1].map((n,i)=><View key={n} style={{position:"absolute",left:12+n*13,bottom:10,width:38,height:52,borderRadius:6,backgroundColor:["#E6C997","#81B5B8","#D97450"][i],transform:[{rotate:`${n*14}deg`}],borderWidth:1,borderColor:"#F8E9CF",alignItems:"center",justifyContent:"center"}}><SFSymbol name="sparkles" size={19} color="#FFF6E7"/></View>)}<View style={{height:16,borderRadius:3,backgroundColor:"#AF7B45"}}/></View><View style={{flex:1,gap:6}}><Text style={{fontSize:18,fontWeight:"600",color:colors.ink}}>Open your card box</Text><Text style={{fontSize:14,lineHeight:20,color:colors.inkMuted}}>{ids.length ? `${ids.length} moments to return to` : "Little discoveries, kept here."}</Text></View><SFSymbol name="chevron.right" size={16} color={colors.inkMuted}/></Pressable><Modal visible={open} transparent animationType="none" onRequestClose={()=>setOpen(false)}>{open&&<ReaderMomentCardBox bookId="genesis" pocketRef={source} onClose={()=>setOpen(false)}/>}</Modal></View>;
}
