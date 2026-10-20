import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { ReaderSheet } from './ReaderSheet';
import { SheetHeading } from './SheetHeading';
import { SFSymbol } from './Symbol';
import { AVATARS } from '@/constants/avatars';
import { useColors } from '@/state/theme';
import { useOnboarding } from '@/state/onboarding';

/** Avatar choices remain a draft until Done; dismissing preserves the current photo. */
export function ProfilePhotoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useColors();
  const { answers, setAnswer } = useOnboarding();
  const { width } = useWindowDimensions();
  const [id, setId] = useState<string | undefined>();
  const [gridWidth, setGridWidth] = useState(Math.max(0, width - 48));
  useEffect(() => {
    if (visible) setId(answers.avatarPhotoUri ? undefined : answers.avatarId);
  }, [visible, answers.avatarId, answers.avatarPhotoUri]);
  const gap = 14;
  const size = Math.max(44, Math.floor((gridWidth - gap * 2) / 3));
  function save() {
    // An existing imported photo stays intact unless an avatar was selected.
    if (id) {
      setAnswer('avatarPhotoUri', undefined);
      setAnswer('avatarId', id);
    }
    onClose();
  }
  return <ReaderSheet visible={visible} onClose={onClose} detents={[.9, 1]} scrollable>
    <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 22 }}>
      <SheetHeading title="Profile photo" onDone={save}/>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 36 }}>
      <View onLayout={event => setGridWidth(event.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: 24 }}>
        {AVATARS.map((avatar, index) => {
          const selected = avatar.id === id;
          return <Pressable key={avatar.id} accessibilityRole="button" accessibilityLabel={`Choose avatar ${index + 1}`} accessibilityState={{ selected }} onPress={() => setId(avatar.id)} style={{ width: size, height: size, padding: 3, borderRadius: size / 2, borderWidth: 2, borderColor: selected ? c.ink : 'transparent' }}>
            <Image source={avatar.source} contentFit="cover" style={{ width: '100%', height: '100%', borderRadius: size / 2 }}/>
            {selected && <View pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: 0, width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: c.surface, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
              <SFSymbol name="checkmark" size={12} weight="bold" color={c.bg}/>
            </View>}
          </Pressable>;
        })}
      </View>
    </ScrollView>
  </ReaderSheet>;
}
