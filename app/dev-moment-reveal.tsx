import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BibleMomentReveal, type BibleRevealKind } from '@/components/BibleMomentReveal';
import { isInternalBuild } from '@/lib/isInternalBuild';
import { useDevTools } from '@/state/devTools';
const kinds: BibleRevealKind[]=['moment','silver','old-gold','new-gold','crown'];
export default function DevMomentReveal() {
  const {kind,book,play,detail}=useLocalSearchParams<{kind?:string;book?:string;play?:string;detail?:string}>();
  const router=useRouter(), {enabled}=useDevTools();
  if(!isInternalBuild()&&!enabled)return <View/>;
  return <BibleMomentReveal key={`${kind}-${book}-${play}`} preview autoPlay={play==='1'} previewDetail={detail==='1'} request={{kind:kinds.includes(kind as BibleRevealKind)?kind as BibleRevealKind:'moment',bookId:book??'genesis'}} onClose={()=>router.canGoBack()?router.back():router.replace('/(tabs)/profile')}/>;
}
