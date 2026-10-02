import { BOOKS } from '@/constants/books';
/** Uses chapter identities, so duplicate/imported records cannot unlock a reward early. */
export function earnedBibleReadingRewards(chapters: ReadonlyArray<{bookId:string;chapter:number}>) {
  const read=new Set(chapters.map(c=>`${c.bookId}:${c.chapter}`));
  const complete=(testament:'old'|'new')=>BOOKS.filter(b=>b.testament===testament).every(b=>Array.from({length:b.chapters},(_,i)=>read.has(`${b.id}:${i+1}`)).every(Boolean));
  const old=complete('old'), fresh=complete('new');
  return [...(old?['old-gold' as const]:[]),...(fresh?['new-gold' as const]:[]),...(old&&fresh?['crown' as const]:[])];
}
