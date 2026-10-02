import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress } from '@/state/progress';
import { earnedBibleReadingRewards } from '@/lib/bibleReadingRewards';
import { BibleMomentReveal, type BibleRevealKind } from './BibleMomentReveal';
const key='closer.bible-reading-reveals.v1';
/** Persist acknowledgement, not eligibility. Reading progress remains the source of truth. */
export function BibleReadingRewards() {
  const {chaptersRead,hydrated}=useProgress();
  const [seen,setSeen]=useState<BibleRevealKind[]|null>(null);
  const dismissed=useRef(new Set<BibleRevealKind>());
  useEffect(()=>{let active=true;void AsyncStorage.getItem(key).then(raw=>{const value=raw?JSON.parse(raw):[];if(active)setSeen(Array.isArray(value)?value:[]);}).catch(()=>{if(active)setSeen([]);});return()=>{active=false;};},[]);
  if(!hydrated||!seen)return null;
  const next=earnedBibleReadingRewards(chaptersRead).find(kind=>!seen.includes(kind)&&!dismissed.current.has(kind));
  if(!next)return null;
  const close=()=>{dismissed.current.add(next);const updated=[...seen,next];setSeen(updated);void AsyncStorage.setItem(key,JSON.stringify(updated)).catch(()=>{ /* Eligible rewards remain available in the collection and can retry on next launch. */ });};
  return <BibleMomentReveal key={next} request={{kind:next}} onClose={close}/>;
}
