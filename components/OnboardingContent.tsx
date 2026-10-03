import { useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

/** Only allow vertical gestures when content really exceeds the available space. */
export function OnboardingContent({ children, contentContainerStyle }: { children: ReactNode; contentContainerStyle?: StyleProp<ViewStyle> }) {
  const [height, setHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const overflow = height > 0 && contentHeight > height + 2;
  return <ScrollView style={{ flex: 1 }} onLayout={e => setHeight(e.nativeEvent.layout.height)}
    onContentSizeChange={(_, value) => setContentHeight(value)} scrollEnabled={overflow}
    bounces={false} alwaysBounceVertical={false} showsVerticalScrollIndicator={overflow}
    keyboardShouldPersistTaps="handled" contentContainerStyle={contentContainerStyle}>
    {children}
  </ScrollView>;
}

/** Keep the question in place while long answer lists scroll. Large text gets a full-page fallback. */
export function OnboardingChoicesLayout({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { fontScale, height } = useWindowDimensions();
  if (fontScale > 1.3 || height < 650) return <OnboardingContent contentContainerStyle={{ padding: 28, gap: 24 }}>{header}{children}</OnboardingContent>;
  return <View style={{ flex: 1 }}>
    <View style={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 24 }}>{header}</View>
    <OnboardingContent contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}>{children}</OnboardingContent>
  </View>;
}
