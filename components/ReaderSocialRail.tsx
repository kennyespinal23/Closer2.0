import { ReaderChromeBusyContext } from "@/lib/useReaderChrome";
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { Text, TextInput } from "@/components/CloserText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolvedScheme, useColors } from '@/state/theme';
import { HIGHLIGHT_COLORS, useAnnotations, verseKey } from '@/state/annotations';
import { lastReaderHighlight, rememberReaderHighlight } from '@/lib/readerHighlightColor';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { COMMUNITY_PREVIEW, type CommunityPreviewState, type StudyGroup } from '@/constants/communityPreview';
import { usePreferences } from '@/state/preferences';
import { shareVerse } from '@/lib/share';
import { STORAGE_KEYS } from '@/lib/storage';
import * as haptics from '@/lib/haptics';
import { ReaderSheet } from './ReaderSheet';
import { SFSymbol } from './Symbol';
type Verse = { number: number; text: string };
type Comment = { id: string; text: string; groupId: string; verse: number; mentions: string[]; author?: string; parentId?: string; mentionsMe?: boolean; read?: boolean };
export function ReaderSocialRail({ bookId, bookName, chapter, verses }: { bookId: string; bookName: string; chapter: number; verses: Verse[] }) {
  const a = useAnnotations(), c = useColors(), reduced = useReducedMotion();
  const {translation} = usePreferences();
  const [colorsOpen,setColorsOpen] = useState(false);
  const sharing=useRef(false);
  const [shareOpen, setShareOpen] = useState(false);
  const setChromeBusy = useContext(ReaderChromeBusyContext);
  const share = async () => {
    const verse=verses[0];if(!verse||sharing.current)return;sharing.current=true;setShareOpen(true);haptics.soft();
    try{const result=await shareVerse({text:verse.text,reference:`${bookName} ${chapter}:${verse.number}`,translation:translation.name});if(result.status==='error')Alert.alert('Couldn’t share verse',result.message);}finally{sharing.current=false;setShareOpen(false);}
  };
  const [open, setOpen] = useState(false), [burst, setBurst] = useState(0);
  useEffect(() => { if (!open && !colorsOpen && !shareOpen) return; setChromeBusy(true); return () => setChromeBusy(false); }, [open,colorsOpen,shareOpen,setChromeBusy]);
  const allHighlighted = verses.length > 0 && verses.every(v => !!a.getHighlight(verseKey(bookId, chapter, v.number)));
  const count = verses.reduce((n,v) => n + a.getNotes(verseKey(bookId, chapter, v.number)).length, 0);
  const [stats, setStats] = useState({total:0, unread:0});
  const refresh = () => Promise.all([AsyncStorage.getItem(`closer.reader.groupComments.preview:${bookId}:${chapter}`),AsyncStorage.getItem(STORAGE_KEYS.communityPreview)]).then(([raw,community]) => {
    const rows: Comment[] = raw ? JSON.parse(raw) : [];
    const state: CommunityPreviewState = community ? JSON.parse(community) : COMMUNITY_PREVIEW;
    const accessible=new Set(state.groups.filter(g=>g.joined||g.mine).map(g=>g.id));
    const own = rows.filter(r=>accessible.has(r.groupId)&&verses.some(v=>v.number===r.verse));
    setStats({total:own.length,unread:own.filter(r=>r.author && r.author!=='You' && !r.read).length});
  }).catch(()=>{});
  useEffect(()=>{void refresh();},[bookId,chapter,verses[0]?.number]);
  const held = useRef(false);
  const toggle = () => {
    if (held.current || !a.hydrated) return;
    const color = allHighlighted ? null : lastReaderHighlight();
    verses.forEach(v => a.setHighlight(verseKey(bookId, chapter, v.number), color, { verseText: v.text }));
    if (color) { haptics.success(); setBurst(n => n + 1); } else haptics.soft();
  };
  return <>
    <View style={{ position: 'absolute', right: 12, top: '58%', alignItems: 'center', gap: 18 }}>
      <Pressable disabled={!a.hydrated} accessibilityRole="button" accessibilityLabel={allHighlighted ? 'Remove verse highlight' : 'Highlight verse'} accessibilityHint="Hold to choose a highlight color" accessibilityState={{ selected: allHighlighted }} onPressIn={() => { held.current = false; }} onLongPress={() => { held.current = true; haptics.soft(); setColorsOpen(true); }} onPress={toggle} style={{ minWidth: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 5 }}><SFSymbol name={allHighlighted ? 'heart.fill' : 'heart'} size={29} color={allHighlighted ? '#F05A76' : c.ink}/></Pressable>
      {!!burst && !reduced && <View key={burst} pointerEvents="none" style={{ position: 'absolute', right: 20, top: 20 }}>{[0,1,2,3,4].map(i => <Heart key={i} index={i}/>)}</View>}
      <Pressable accessibilityRole="button" accessibilityLabel={`Notes and group preview, ${stats.total} comments, ${stats.unread} unread, ${count} private notes`} onPress={() => { haptics.soft(); setOpen(true); }} style={{ minWidth: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 5 }}><SFSymbol name="bubble.right" size={28} color={c.ink}/>{stats.unread>0&&<View style={{position:'absolute',top:0,right:5,width:8,height:8,borderRadius:4,backgroundColor:'#74AE8A'}}/>}<Text style={{ color: c.inkMuted, fontSize: 11 }}>{stats.total || ''}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Share this verse" onPress={()=>void share()} style={{minWidth:52,minHeight:52,alignItems:'center',justifyContent:'center'}}><SFSymbol name="square.and.arrow.up" size={27} color={c.ink}/></Pressable>
    </View>
    <Modal transparent visible={colorsOpen} animationType="fade" onRequestClose={()=>setColorsOpen(false)}>
      <View style={{flex:1}}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss highlight colors" onPress={()=>setColorsOpen(false)} style={{position:'absolute',inset:0}}/>
        <View accessibilityViewIsModal style={{position:'absolute',top:'55%',right:20,flexDirection:'row',padding:8,gap:3,borderRadius:28,borderCurve:'continuous',backgroundColor:c.surface,borderWidth:1,borderColor:c.border,boxShadow:'0 6px 24px rgba(0,0,0,0.18)'}}>
          {HIGHLIGHT_COLORS.map(color=><Pressable key={color.id} accessibilityRole="button" accessibilityLabel={`${color.name} highlight`} accessibilityState={{selected:verses.some(v=>a.getHighlight(verseKey(bookId,chapter,v.number))===color.id)}} onPress={()=>{rememberReaderHighlight(color.id);verses.forEach(v=>a.setHighlight(verseKey(bookId,chapter,v.number),color.id,{verseText:v.text}));haptics.tick();setColorsOpen(false);}} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><View style={{width:30,height:30,borderRadius:15,backgroundColor:color.swatch,alignItems:'center',justifyContent:'center'}}>{verses.some(v=>a.getHighlight(verseKey(bookId,chapter,v.number))===color.id)&&<SFSymbol name="checkmark" size={15} color="#171717"/>}</View></Pressable>)}
        </View>
      </View>
    </Modal>
    {open && <VerseComments bookId={bookId} bookName={bookName} chapter={chapter} verses={verses} onClose={() => {setOpen(false);void refresh();}}/>}
  </>;
}
function Heart({ index }: { index: number }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 700 + index * 65 }); }, [index, p]);
  const motion = useAnimatedStyle(() => ({ opacity: 1-p.value, transform: [{ translateY: -100*p.value }, { translateX: (index-3)*16*p.value }, { scale: .6 + .7*p.value }, { rotate: `${(index-2)*12*p.value}deg` }] }));
  return <Animated.View style={[{ position: 'absolute' },motion]}><SFSymbol name="heart.fill" color="#F05A76" size={18}/></Animated.View>;
}
export function VerseComments({ bookId, bookName, chapter, verses, onClose }: { bookId: string; bookName: string; chapter: number; verses: Verse[]; onClose: () => void }) {
  const palette = useColors(), scheme = useResolvedScheme(), a = useAnnotations(), reduced = useReducedMotion(), insets = useSafeAreaInsets();
  const c = {...palette,bg:scheme==='dark'?'#171717':'#FFFFFF',surface:scheme==='dark'?'#243027':'#EEF4E9',ink:scheme==='dark'?'#FAFAFA':'#171717',inkMuted:scheme==='dark'?'#AAAAAA':'#696969',border:scheme==='dark'?'#FFFFFF20':'#00000022'};
  const [scope, setScope] = useState<'private'|'group'>('group'), [verse, setVerse] = useState(verses[0]?.number ?? 1);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [groups, setGroups] = useState<StudyGroup[]>([]), [groupId, setGroupId] = useState('');
  const [comments, setComments] = useState<Comment[]>([]), [ready, setReady] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [expanded,setExpanded] = useState<string[]>([]), [replyTo,setReplyTo] = useState<string|undefined>(), [visible,setVisible] = useState(true);
  const scroller = useRef<ScrollView>(null);
  const rowPositions=useRef<Record<string,number>>({});
  const saving = useRef(false), input = useRef<TextInput>(null);
  const storage = `closer.reader.groupComments.preview:${bookId}:${chapter}`;
  const draftKey = `${scope}:${verse}:${scope === 'group' ? groupId : ''}`, text = drafts[draftKey] ?? '';
  const setText = (value: string) => setDrafts(s => ({...s, [draftKey]:value}));
  useEffect(() => { let live=true; Promise.all([AsyncStorage.getItem(STORAGE_KEYS.communityPreview),AsyncStorage.getItem(storage)]).then(([raw,notes]) => {
    if (!live) return;
    const state: CommunityPreviewState = raw ? JSON.parse(raw) : COMMUNITY_PREVIEW;
    const joined = (Array.isArray(state.groups) ? state.groups : []).filter(g=>g.joined || g.mine);
    setGroups(joined); setGroupId(joined[0]?.id ?? '');
    const loaded = notes ? JSON.parse(notes) : [];
    setComments(Array.isArray(loaded) ? loaded.filter(x=> typeof x.text==='string' && typeof x.groupId==='string' && typeof x.verse==='number') : []);setReady(true);
  }).catch(()=>{if(live)setError('Couldn’t load group previews. Private notes are still available.');});return()=>{live=false}; },[storage]);
  const group = groups.find(g=>g.id===groupId);
  // Existing local groups contain initials plus named sample reply authors; do not invent real members.
  const members = [...new Set(group?.replies.map(r=>r.author) ?? [])];
  const query = text.match(/@([^@\n]*)$/)?.[1];
  const suggestions = scope === 'group' && query !== undefined ? members.filter(n=>n.toLowerCase().startsWith(query.toLowerCase())) : [];
  const notes = a.getNotes(verseKey(bookId,chapter,verse));
  const rows = scope === 'private' ? notes : comments.filter(n=>n.groupId===groupId && n.verse===verse);
  const close = () => { if(busy)return; if(Object.values(drafts).some(v=>v.trim())) Alert.alert('Discard your draft?', 'Your saved notes stay safe.', [{text:'Keep writing',style:'cancel'},{text:'Discard',style:'destructive',onPress:()=>setVisible(false)}]);else setVisible(false); };
  const save = async () => {
    const value=text.trim(); if(!value || saving.current)return;
    saving.current=true;setBusy(true);setError('');
    try {
      if(scope==='private') a.addNote(verseKey(bookId,chapter,verse),value,{verseText:verses.find(v=>v.number===verse)?.text});
      else { if(!ready || !groupId) return; const next=[...comments,{id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,text:value,groupId,verse,author:'You',parentId:replyTo,read:true,mentions:members.filter(n=>value.includes(`@${n}`))}]; await AsyncStorage.setItem(storage,JSON.stringify(next));setComments(next); }
      setText('');setReplyTo(undefined);haptics.success();
    } catch {setError('Couldn’t save. Your draft is still here.');}finally{saving.current=false;setBusy(false);}
  };
  const groupRows = comments.filter(n=>n.groupId===groupId && n.verse===verse);
  const unread = groupRows.filter(n=>n.author && n.author!=='You'&&!n.read);
  const markRead = async (ids: string[]) => {
    if(saving.current)return;saving.current=true;setBusy(true);
    const next=comments.map(n=>ids.includes(n.id)?{...n,read:true}:n);
    try {await AsyncStorage.setItem(storage,JSON.stringify(next));setComments(next);} catch {setError('Couldn’t update read status.');}finally{saving.current=false;setBusy(false);}
  };
  const preview = async () => {
    if(!groupId||saving.current)return;
    saving.current=true;setBusy(true);
    const id=`preview-${Date.now()}`;
    const next=[...comments,{id,text:'What does this verse bring to mind for you?',groupId,verse,mentions:[],author:members[0]||'Sample member',read:false},{id:id+'-reply',parentId:id,text:'@You I would love to hear your thoughts on this verse.',groupId,verse,mentions:['You'],mentionsMe:true,author:members[1]||'Sample member',read:false}];
    try {await AsyncStorage.setItem(storage,JSON.stringify(next));setComments(next);}catch{setError('Couldn’t add sample conversation.');}finally{saving.current=false;setBusy(false);}
  };
  const renderRow = (row: {id:string;text:string}, nested=false) => {
    const comment=row as Comment, tagged=scope==='group'&&comment.mentionsMe&&comment.author!=='You';
    const replies=groupRows.filter(n=>n.parentId===row.id), isExpanded=expanded.includes(row.id);
    return <View key={row.id} onLayout={e=>{if(!nested)rowPositions.current[row.id]=e.nativeEvent.layout.y;}} style={{marginLeft:nested?24:0,marginBottom:nested?10:14}}>
      <View style={{flexDirection:'row',gap:10,padding:tagged?10:0,borderRadius:14,borderCurve:'continuous',backgroundColor:tagged?c.surface:'transparent',borderLeftWidth:tagged?3:0,borderLeftColor:'#7EAB8D'}}>
        <View style={{width:30,height:30,borderRadius:15,backgroundColor:'#496653',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#F4F5EE',fontSize:12,fontWeight:'600'}}>{(comment.author||'You').slice(0,1)}</Text></View>
        <View style={{flex:1}}>
          {tagged&&<View style={{marginBottom:6,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6}}><Text style={{backgroundColor:'#C0DEC9',color:'#234832',fontSize:11,fontWeight:'700',paddingHorizontal:8,paddingVertical:4,borderRadius:6}}>＠ Mentioned you</Text><Text style={{color:c.inkMuted,fontSize:10}}>{group?.name}</Text></View>}
          <Text style={{color:c.ink,fontSize:12,fontWeight:'600',marginBottom:4}}>{comment.author||'You'}{scope==='group'&&!comment.read&&comment.author!=='You'?' · New':''}</Text>
          <Text style={{color:c.ink,fontSize:15,lineHeight:21}}>{row.text.split(/(@You\b)/g).map((part,i)=><Text key={i} style={part==='@You'&&tagged?{color:'#4D9972',fontWeight:'700'}:undefined}>{part}</Text>)}</Text>
          {scope==='group'&&<Pressable accessibilityRole="button" onPress={()=>{setReplyTo(comment.parentId||row.id);input.current?.focus();}} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:c.inkMuted,fontSize:12}}>Reply</Text></Pressable>}
        </View>
      </View>
      {!nested&&replies.length>0&&<><Pressable accessibilityRole="button" accessibilityState={{expanded:isExpanded}} onPress={()=>setExpanded(v=>isExpanded?v.filter(x=>x!==row.id):[...v,row.id])} style={{marginLeft:40,minHeight:44,justifyContent:'center'}}><Text style={{color:c.inkMuted,fontSize:12}}>{isExpanded?'Hide replies':`View ${replies.length} ${replies.length===1?'reply':'replies'}`}{!isExpanded&&replies.some(r=>r.mentionsMe&&!r.read)?' · You were mentioned':!isExpanded&&replies.some(r=>!r.read)?` · ${replies.filter(r=>!r.read).length} new`:''}</Text></Pressable>{isExpanded&&replies.map(r=>renderRow(r,true))}</>}
    </View>;
  };
  const header = <View style={{backgroundColor:c.bg}}>
      <View style={{height:44,alignItems:'center',justifyContent:'center',borderBottomWidth:1,borderColor:c.border}}><Text style={{color:c.ink,fontSize:16,fontWeight:'600'}}>{scope==='group'?`Comments · ${groupRows.length}`:`Notes · ${notes.length}`}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close comments" onPress={close} style={{position:'absolute',right:8,width:44,height:44,alignItems:'center',justifyContent:'center'}}><SFSymbol name="xmark" color={c.inkMuted} size={17}/></Pressable></View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,minHeight:48}}><Text style={{color:c.inkMuted,fontSize:12}}>{bookName} {chapter}:{verse}</Text><Pressable accessibilityRole="button" accessibilityLabel="Choose private notes or group discussion" onPress={()=>Alert.alert('Show',undefined,[{text:'Private · Only you',onPress:()=>{setScope('private');setReplyTo(undefined);} },...groups.map(g=>({text:g.name+' · Preview',onPress:()=>{setScope('group');setGroupId(g.id);setReplyTo(undefined);}})),...(groupId?[{text:'Try a sample mention',onPress:()=>void preview()}]:[]),{text:'Cancel',style:'cancel'}])}><Text style={{color:c.ink,fontSize:12,paddingVertical:14}}>{scope==='private'?'Private · Only you':group?.name||'Group preview'} ⌄</Text></Pressable></View>
      {scope==='group'&&unread.length>0&&<Pressable accessibilityRole="button" onPress={()=>{setExpanded(groupRows.filter(r=>!r.parentId).map(r=>r.id));const first=unread[0];scroller.current?.scrollTo({y:rowPositions.current[first.parentId||first.id]||0,animated:!reduced});}} style={{alignSelf:'flex-start',marginLeft:18,paddingVertical:8}}><Text style={{color:'#4D9972',fontSize:12,fontWeight:'600'}}>{unread.length} new · Show conversation</Text></Pressable>}
  </View>;
  const footer = <View style={{backgroundColor:c.bg,paddingBottom:Math.max(12,insets.bottom)}}>
      {suggestions.length>0&&<ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:18,gap:12}}>{suggestions.map(n=><Pressable key={n} onPress={()=>{setText(text.replace(/@([^@\n]*)$/,`@${n} `));input.current?.focus();}} style={{padding:12}}><Text style={{color:c.ink}}>@{n}</Text></Pressable>)}</ScrollView>}
      {!!replyTo&&<Pressable onPress={()=>setReplyTo(undefined)} style={{paddingHorizontal:18,paddingVertical:10}}><Text style={{color:c.inkMuted,fontSize:12}}>Replying to {groupRows.find(r=>r.id===replyTo)?.author||'You'} · Cancel ×</Text></Pressable>}
      {!!error&&<Text accessibilityLiveRegion="polite" style={{color:c.inkMuted,paddingHorizontal:18}}>{error}</Text>}
      <View style={{borderTopWidth:1,borderColor:c.border,paddingTop:10,paddingHorizontal:16}}>
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>{['❤️','🙌','🔥','👏','🥹','🙏'].map(emoji=><Pressable key={emoji} accessibilityLabel={`Add ${emoji}`} onPress={()=>{setText(text+emoji);input.current?.focus();}} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:23}}>{emoji}</Text></Pressable>)}</View>
        <Text style={{color:c.inkMuted,fontSize:10,textAlign:'center',marginBottom:10}}>{scope==='private'?'Only you can see these notes.':'Local preview · Nothing is sent or shared.'}</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{width:32,height:32,borderRadius:16,backgroundColor:'#496653',alignItems:'center',justifyContent:'center'}}><Text style={{color:'white'}}>Y</Text></View><TextInput ref={input} multiline editable={!busy} value={text} onChangeText={setText} accessibilityLabel={scope==='private'?'Add a private note':'Add a local group comment'} placeholder={scope==='private'?'Add a note…':'Comment or @mention…'} placeholderTextColor={c.inkMuted} style={{flex:1,minHeight:44,maxHeight:100,borderWidth:1,borderColor:c.border,borderRadius:23,paddingHorizontal:14,paddingTop:11,paddingBottom:11,color:c.ink,fontSize:15}}/><Pressable accessibilityRole="button" accessibilityLabel="Save comment" disabled={busy||!text.trim()||!a.hydrated||(scope==='group'&&(!ready||!groupId))} onPress={()=>void save()} style={{width:44,height:44,borderRadius:22,backgroundColor:c.ink,opacity:!text.trim()||busy?.35:1,alignItems:'center',justifyContent:'center'}}><SFSymbol name="arrow.up" size={20} color={c.bg}/></Pressable></View>
      </View>
  </View>;
  return <ReaderSheet visible={visible} onClose={onClose} detents={[0.76,1]} scrollable header={header} footer={footer} dismissible={!busy&&!Object.values(drafts).some(v=>v.trim())} backgroundColor={c.bg}>
      <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingTop:8}}>
        {!rows.length&&<View style={{paddingVertical:36,alignItems:'center'}}><Text style={{color:c.ink,fontWeight:'600',fontSize:18}}>{scope==='private'?'No notes yet':'No comments yet'}</Text><Text style={{color:c.inkMuted,fontSize:13,marginTop:8}}>{scope==='private'?'Keep a thought about this verse.':'Start a conversation about this verse.'}</Text></View>}
        {(scope==='private'?notes:groupRows.filter(r=>!r.parentId)).map(row=>renderRow(row))}
        {scope==='group'&&unread.length>0&&<Pressable accessibilityRole="button" onPress={()=>void markRead(groupRows.map(r=>r.id))} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:c.inkMuted,fontSize:12}}>Mark conversation as read</Text></Pressable>}
        {scope==='group'&&ready&&!groups.length&&<Text style={{color:c.inkMuted}}>Join a preview group in Community to try a discussion.</Text>}
      </ScrollView>
  </ReaderSheet>;
}
