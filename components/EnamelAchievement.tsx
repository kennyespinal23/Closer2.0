import { useId } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { achievementArtwork, type AchievementArtId } from '@/lib/achievementArtwork';
import { SFSymbol, type SFSymbolName } from './Symbol';

// Only legacy milestone/onboarding surfaces fall back to their existing symbol.
const iconArtwork: Partial<Record<SFSymbolName, AchievementArtId>> = {
  envelope: 'letters-1', 'sun.max': 'streak-7', moon: 'streak-30', star: 'streak-100',
  book: 'chapter', heart: 'honest', sparkles: 'moment', leaf: 'garden', flame: 'streak-1',
  crown: 'all', pencil: 'highlight', 'note.text': 'note', headphones: 'listener', bolt: 'express',
};
export function resolveAchievementArt(id?: string, icon: SFSymbolName = 'envelope'): AchievementArtId {
  return id && Object.prototype.hasOwnProperty.call(achievementArtwork, id)
    ? id as AchievementArtId : iconArtwork[icon] ?? 'letters-1';
}
export function EnamelAchievement({ size = 205, achievementId, icon = 'envelope', earned = true }: {
  size?: number; achievementId?: string; icon?: SFSymbolName; earned?: boolean;
}) {
  const badge = achievementArtwork[resolveAchievementArt(achievementId, icon)];
  return <View accessible={false} style={{ width: size, height: size }}>
    <Image source={badge.source} contentFit="contain" transition={0} cachePolicy="memory-disk"
      style={{ width: size, height: size, opacity: earned ? 1 : .38 }} />
    {!earned && <View style={{ position: 'absolute', right: size * .1, bottom: size * .08,
      width: Math.max(18, size * .15), height: Math.max(18, size * .15), borderRadius: size,
      backgroundColor: '#29313F', alignItems: 'center', justifyContent: 'center' }}>
      <SFSymbol name="lock.fill" size={Math.max(10, size * .075)} color="#F5EDE0" />
    </View>}
  </View>;
}
const ShineRect = Animated.createAnimatedComponent(Rect);
/** UI-thread sheen clipped to the actual badge, never a circular film over the art. */
export function AchievementSheen({ size, achievementId, icon, progress }: {
  size: number; achievementId?: string; icon?: SFSymbolName; progress: SharedValue<number>;
}) {
  const id = useId().replace(/:/g, '');
  const badge = achievementArtwork[resolveAchievementArt(achievementId, icon)];
  const props = useAnimatedProps(() => ({ x: progress.value * 450 + 150 }));
  return <Svg pointerEvents="none" width={size} height={size} viewBox="0 0 310 310" style={{ position: 'absolute' }}>
    <Defs><ClipPath id={`${id}clip`}><Path d={badge.outline} /></ClipPath>
      <LinearGradient id={`${id}shine`} x1="0%" x2="100%"><Stop offset="0" stopColor="white" stopOpacity="0" />
        <Stop offset=".5" stopColor="white" stopOpacity=".24" /><Stop offset="1" stopColor="white" stopOpacity="0" /></LinearGradient>
    </Defs><G clipPath={`url(#${id}clip)`}><G rotation={-22} origin="155,155">
      <ShineRect animatedProps={props} y={-100} width={90} height={510} fill={`url(#${id}shine)`} />
    </G></G>
  </Svg>;
}
