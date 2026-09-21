import { Button, Host, HStack, Image, Text } from "@expo/ui/swift-ui";
import { accessibilityLabel, background, clipShape, frame, glassEffect } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useColors, useResolvedScheme } from "@/state/theme";

export function NativeReaderControls({ translation, disabled, onContents, onVersion, onTextSize, onAppearance }: {
  translation: string; disabled: boolean; onContents: () => void; onVersion: () => void; onTextSize: () => void; onAppearance: () => void;
}) {
  const scheme = useResolvedScheme();
  const colors = useColors();
  const glass = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const surface = glass
    ? [glassEffect({ glass: { variant: "regular" }, shape: "capsule" })]
    : [background(scheme === "dark" ? "#2C2C2E" : "#FFFFFF"), clipShape("roundedRectangle", 24)];
  // Match the reader's reserved 48pt toolbar height. Plain native buttons
  // provide press feedback without four independently resizing glass capsules.
  return <Host colorScheme={scheme} style={{ width: 268, height: 48 }}>
    <HStack spacing={12}>
      <HStack spacing={0} modifiers={surface}>
        <Button variant="plain" onPress={onContents} modifiers={[accessibilityLabel("Open chapter contents")]}>
          <Image systemName="list.bullet" size={20} color={colors.ink} modifiers={[frame({ width: 64, height: 48 })]} />
        </Button>
        <Button variant="plain" disabled={disabled} onPress={onVersion} modifiers={[accessibilityLabel(`Bible version ${translation}`)]}>
          <Text size={16} weight="semibold" color={colors.ink} lineLimit={1} modifiers={[frame({ width: 80, height: 48 })]}>{translation}</Text>
        </Button>
        <Button variant="plain" onPress={onTextSize} modifiers={[accessibilityLabel("Text size")]}>
          <Text size={20} weight="medium" color={colors.ink} lineLimit={1} modifiers={[frame({ width: 64, height: 48 })]}>Aa</Text>
        </Button>
      </HStack>
      <Button variant="plain" onPress={onAppearance} modifiers={[...surface, accessibilityLabel(scheme === "dark" ? "Switch to light mode" : "Switch to dark mode")]}>
        <Image systemName={scheme === "dark" ? "sun.max" : "moon.fill"} size={20} color={colors.ink} modifiers={[frame({ width: 48, height: 48 })]} />
      </Button>
    </HStack>
  </Host>;
}
