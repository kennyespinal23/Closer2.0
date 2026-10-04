import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as haptics from '@/lib/haptics';
import { Text } from './CloserText';
import { ReaderMaterialGradient } from './ReaderMaterialGradient';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { buttonStyles } from '@/lib/buttonStyles';
import { OPENING_BEATS, OPENING_PIVOT_TIME, openingBeatAt } from '@/lib/onboardingOpening';

const assets = {
  opening: require('../assets/onboarding/globe/opening.mp4'),
  idle: require('../assets/onboarding/globe/idle.mp4'),
  loading: require('../assets/onboarding/globe/loading.jpg'),
  still: require('../assets/onboarding/globe/still.jpg'),
  pivot: require('../assets/onboarding/globe/pivot.jpg'),
};

export function OnboardingGlobeOpening(props: { onContinue: () => void; onRevealNext: () => void }) {
  const reduced = useReducedMotion();
  const [screenReader, setScreenReader] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (mounted) setScreenReader(value); });
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => { mounted = false; sub.remove(); };
  }, []);
  return <OpeningScene key={reduced || screenReader ? 'still' : 'video'} {...props} still={reduced || screenReader}/>;
}

function OpeningScene({ onContinue, onRevealNext, still }: { onContinue: () => void; onRevealNext: () => void; still: boolean }) {
  const inset = useSafeAreaInsets(), { height, width } = useWindowDimensions();
  const [time, setTime] = useState(0), [manualBeat, setManualBeat] = useState(0);
  const [ready, setReady] = useState(false), [idleReady, setIdleReady] = useState(false);
  const [pivot, setPivot] = useState(false), [failed, setFailed] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const warmth = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const [continueReady, setContinueReady] = useState(false);
  const pulsePlayed = useRef(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => () => { sceneOpacity.stopAnimation(); warmth.stopAnimation(); }, [sceneOpacity, warmth]);
  const pivotRef = useRef(false), completed = useRef(false);
  const master = useVideoPlayer(still ? null : assets.opening, player => {
    player.muted = true; player.loop = false; player.timeUpdateEventInterval = 1 / 30;
    player.staysActiveInBackground = false;
  });
  const idle = useVideoPlayer(still ? null : assets.idle, player => {
    player.muted = true; player.loop = true; player.timeUpdateEventInterval = 1 / 30;
    player.staysActiveInBackground = false;
  });
  const manual = still || failed;
  const beat = manual ? { index: manualBeat, opacity: 1 } : openingBeatAt(time);
  const atEnd = manual ? manualBeat === 3 : pivot && time >= 16.9;
  useEffect(() => {
    if (!manual && !atEnd) return;
    if (manual) {
      continueOpacity.setValue(1);
      setContinueReady(true);
      return;
    }
    const entrance = Animated.timing(continueOpacity, {
      toValue: 1, delay: 180, duration: 900,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    entrance.start(({finished}) => { if (finished) setContinueReady(true); });
    return () => entrance.stop();
  }, [atEnd, manual, continueOpacity]);
  useEffect(() => {
    if (atEnd && active && !manual && !pulsePlayed.current) {
      pulsePlayed.current = true;
      haptics.soft();
    }
  }, [atEnd, active, manual]);
  function finish() {
    if (completed.current) return;
    completed.current = true;
    setLeaving(true);
    haptics.soft();
    const revealQuestion = () => {
      onRevealNext();
      Animated.timing(sceneOpacity, {
        toValue: 0, duration: still ? 180 : 650,
        easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
      }).start(({ finished }) => { if (finished) onContinue(); });
    };
    if (still) { revealQuestion(); return; }
    // Let the video's warm lower edge rise over the scene before revealing the question.
    Animated.timing(warmth, {
      toValue: 1, duration: 1100,
      easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => { if (finished) revealQuestion(); });
  }
  function showPivot(skip = false) {
    if (pivotRef.current) return;
    pivotRef.current = true; master.pause(); setPivot(true);
    idle.currentTime = skip ? 1.3 : 0;
    setTime(skip ? 16.9 : OPENING_PIVOT_TIME);
  }
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const progress = master.addListener('timeUpdate', event => {
      if (pivotRef.current) return;
      if (event.currentTime >= OPENING_PIVOT_TIME) showPivot();
      else setTime(event.currentTime);
    });
    const end = master.addListener('playToEnd', () => showPivot(true));
    const error = master.addListener('statusChange', event => { if (event.status === 'error') setFailed(true); });
    const idleError = idle.addListener('statusChange', event => { if (event.status === 'error') setFailed(true); });
    const idleProgress = idle.addListener('timeUpdate', event => {
      if (pivotRef.current) setTime(previous => Math.max(previous, OPENING_PIVOT_TIME + event.currentTime));
    });
    return () => { progress.remove(); end.remove(); error.remove(); idleError.remove(); idleProgress.remove(); };
  }, [master, idle]);
  useEffect(() => {
    if (!active || manual) { master.pause(); idle.pause(); return; }
    if (pivot) {
      master.pause();
      idle.play();
    } else if (ready) master.play();
    // useVideoPlayer releases players on unmount; do not call a released native object.
  }, [active, manual, pivot, ready, master, idle]);
  // Once idle has a decoded frame, release the master decoder without exposing a blank frame.
  useEffect(() => { if (pivot && idleReady) void master.replaceAsync(null).catch(() => {}); }, [pivot, idleReady, master]);
  const lower = beat.index === 3;
  const textTop = lower ? height * .51 : Math.max(inset.top + 68, height * .145);
  return <Animated.View pointerEvents={leaving ? "none" : "auto"} style={[styles.root, { opacity: sceneOpacity }]}>
    {!leaving && <StatusBar style="light"/>}
    <Image source={manual ? (lower ? assets.pivot : assets.still) : assets.loading} style={StyleSheet.absoluteFill} contentFit="cover"/>
    {!manual && <>
      {!(pivot && idleReady) && <VideoView player={master} onFirstFrameRender={() => setReady(true)} contentFit="cover" nativeControls={false} surfaceType="textureView" style={[StyleSheet.absoluteFill, { opacity: ready ? 1 : 0 }]} accessible={false}/>}
      <VideoView player={idle} onFirstFrameRender={() => setIdleReady(true)} contentFit="cover" nativeControls={false} surfaceType="textureView" style={[StyleSheet.absoluteFill, { opacity: pivot && idleReady ? 1 : 0 }]} accessible={false}/>
    </>}
    {beat.index >= 0 && <View pointerEvents="none" style={{ position: 'absolute', top: textTop, left: 28, right: 28, opacity: beat.opacity }}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: width < 380 ? 30 : 34, lineHeight: width < 380 ? 36 : 40 }]}>{OPENING_BEATS[beat.index].text}</Text>
    </View>}
    {(manual || atEnd) && <Animated.View style={[styles.footer, {
      paddingBottom: Math.max(inset.bottom, 16) + 12,
      opacity: continueOpacity,
      transform: [{translateY: continueOpacity.interpolate({inputRange:[0,1],outputRange:[6,0]})}],
    }]}>
      <Pressable accessibilityRole="button" disabled={leaving || !continueReady} accessibilityState={{disabled: leaving || !continueReady}} onPress={() => manual && !atEnd ? setManualBeat(value => value + 1) : finish()} style={[buttonStyles.primary, { backgroundColor: '#F9F0EB' }]}><Text style={[buttonStyles.label, { color: '#30251E' }]}>Continue</Text></Pressable>
    </Animated.View>}
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
      opacity: warmth,
      transform: [{ translateY: warmth.interpolate({ inputRange: [0, 1], outputRange: [height * .7, -height * .25] }) }],
    }]}>
      <ReaderMaterialGradient colors={['#4A2B2500', '#4A2B2599', '#372820']} locations={[0, .55, 1]} style={{flex:1}}/>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
      opacity: warmth.interpolate({inputRange:[0,.35,1],outputRange:[0,0,1]}),
    }]}>
      <ReaderMaterialGradient colors={['#372820', '#1D1916', '#171513']} style={{flex:1}}/>
    </Animated.View>
  </Animated.View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0E1E' },
  title: { color: '#F9F0EB', fontWeight: '900', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 28, paddingTop: 12 },
});
