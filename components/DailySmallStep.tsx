import { useRef, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './CloserText';
import { FeedbackPressable as Pressable } from './FeedbackPressable';
import { CloseButton } from './CloseButton';
import { DailyStoryProgress } from './DailyStoryProgress';
import { SFSymbol } from './Symbol';
import { uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { useDailyPractice, type DailyStep } from '@/lib/dailyPractice';
import { requestNotificationPermission } from '@/lib/notifications';
import type { FloatingScriptureCard } from '@/constants/homePrototype';
import * as haptics from '@/lib/haptics';
export function DailySmallStep({ card, completed, onComplete, onClose }: { card: FloatingScriptureCard; completed: Partial<Record<DailyStep, boolean>>; onComplete: () => Promise<void>; onClose: () => void }) {
  const inset = useSafeAreaInsets(), { saved, saveActionPlan } = useDailyPractice(card.id);
  const options = [
    { id: 'reach-out', title: 'Reach out', text: 'Text someone you’ve drifted from. “Thinking of you” is enough.', icon: 'bubble.left' as const },
    { id: 'pray', title: 'Pray', text: 'Name one hard thing to God, and one hope next to it.', icon: 'hands.sparkles' as const },
    { id: 'remember', title: 'Remember', text: `Write ${card.scriptureReference} where you’ll see it tonight.`, icon: 'pencil' as const },
  ];
  const [selected, setSelected] = useState(saved.actionChoice ?? ''), [reminder, setReminder] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const saving = useRef(false);
  const finish = async () => {
    if (!selected || saving.current) return;
    saving.current = true;
    setBusy(true); setError(''); let notificationId: string | undefined;
    try {
      if (reminder) {
        if (await requestNotificationPermission() !== 'granted') { setError('Notifications are off. Enable them in Settings, or turn off the reminder to continue.'); return; }
        notificationId = await Notifications.scheduleNotificationAsync({ content: { title: 'One small step', body: options.find(o => o.id === selected)!.text, data: { route: '/today' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3600 } });
      }
      await saveActionPlan(selected, notificationId);
      await onComplete();
      if (saved.actionReminderId) await Notifications.cancelScheduledNotificationAsync(saved.actionReminderId).catch(() => {});
      haptics.success();
    } catch {
      if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
      setError('Couldn’t save your step. Please try again.');
    } finally { saving.current = false; setBusy(false); }
  };
  return <View style={{ flex: 1, backgroundColor: '#FBF9F6', paddingTop: inset.top }}>
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', gap: 16 }}><CloseButton onPress={onClose} disabled={busy} color="#17120F" style={{ backgroundColor: "#ECE6DE" }}/><View style={{ flex: 1 }}><DailyStoryProgress completed={completed} active="action" color="#FF4326" track="#DDD6CD"/></View></View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}><Text style={{ ...uiText.supporting, color: '#786554' }}>One small step</Text><Text accessibilityRole="header" style={{ ...uiText.screenTitle, color: '#17120F' }}>Take the word with you.</Text><Text style={{ ...uiText.supporting, color: '#786554' }}>Pick one to do before tonight.</Text>
      {options.map(option => <Pressable key={option.id} feedback="action" accessibilityRole="radio" accessibilityState={{ checked: selected === option.id }} disabled={busy} onPress={() => { setSelected(option.id); haptics.soft(); }} style={{ backgroundColor: selected === option.id ? '#FFD455' : '#FFF', padding: 18, paddingRight: 56, borderWidth: 1, borderColor: '#17120F18', borderRadius: 24, borderCurve: 'continuous', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><SFSymbol name={option.icon} size={16} color="#786554"/><Text style={{ ...uiText.supporting, color: '#786554', flex: 1 }}>{option.title}</Text></View><Text style={{ ...uiText.body, fontWeight: '800', color: '#17120F' }}>{option.text}</Text><View style={{ position: "absolute", right: 18, top: "50%", marginTop: -14 }}><SFSymbol name={selected === option.id ? "checkmark.circle.fill" : "circle"} color={selected === option.id ? "#6A2B10" : "#CFC8C0"} size={28}/></View>
      </Pressable>)}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={{ ...uiText.supporting, color: '#786554', flex: 1 }}>Remind me in one hour</Text><Switch accessibilityLabel="Remind me in one hour" value={reminder} disabled={busy} onValueChange={setReminder}/></View>
      {!!error && <Text accessibilityLiveRegion="polite" style={{ ...uiText.supporting, color: '#9E2410' }}>{error}</Text>}
    </ScrollView>
    <View style={{ padding: 20, paddingBottom: inset.bottom + 16 }}><Pressable accessibilityRole="button" disabled={!selected || busy} onPress={() => void finish()} style={[buttonStyles.primary, { backgroundColor: !selected ? '#E9E4DE' : '#17120F', opacity: busy ? .5 : 1 }]}><Text style={[buttonStyles.label, { color: !selected ? '#786554' : '#FFF7EB' }]}>{busy ? 'Saving…' : selected ? 'I did it' : 'Choose one'}</Text></Pressable></View>
  </View>;
}
