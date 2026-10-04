import { BIBLE_MOMENTS } from '@/constants/bibleMoments';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BibleMomentReveal, type BibleRevealKind } from '@/components/BibleMomentReveal';
import { isInternalBuild } from '@/lib/isInternalBuild';
import { useDevTools } from '@/state/devTools';
const kinds: BibleRevealKind[]=['moment','silver','old-gold','new-gold','crown'];
export default function DevMomentReveal() {
  const {kind,book,play,detail,moment,collected}=useLocalSearchParams<{kind?:string;book?:string;play?:string;detail?:string;moment?:string;collected?:string}>();
  const router=useRouter(), {enabled}=useDevTools();
  if(!isInternalBuild()&&!enabled)return <View/>;
  return <BibleMomentReveal key={`${kind}-${book}-${play}-${collected}`} preview autoPlay={play==='1'} previewDetail={detail==='1'} request={{collected:collected==='1',kind:kinds.includes(kind as BibleRevealKind)?kind as BibleRevealKind:'moment',bookId:book??'genesis',moment:BIBLE_MOMENTS.find(item=>item.id===moment)}} onClose={()=>router.canGoBack()?router.back():router.replace('/(tabs)/profile')}/>;
}
