import { Platform, Pressable } from "react-native";
import { Text as RNText } from "@/components/CloserText";
import { Host, Button, Image, Text } from "@expo/ui/swift-ui";
import { accessibilityLabel, frame } from "@expo/ui/swift-ui/modifiers";
import { useColors, useResolvedScheme } from "@/state/theme";

export function ReaderNativeButton({ label, symbol, onPress, disabled = false }: { label: string; symbol?: "xmark" | "play.fill" | "gearshape"; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const width = symbol ? 48 : 88;
  if (Platform.OS !== "ios") return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{ minWidth: width, minHeight: 48, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }}><RNText style={{ color: colors.ink }}>{label}</RNText></Pressable>;
  return <Host colorScheme={scheme} style={{ width, height: 48 }}><Button variant="bordered" disabled={disabled} onPress={onPress} modifiers={[accessibilityLabel(label), frame({ minWidth: 44, minHeight: 44 })]}>
    {symbol ? <Image systemName={symbol} size={20} color={colors.ink} modifiers={[frame({ width: 28, height: 28 })]} /> : <Text size={16} color={colors.ink}>{label}</Text>}
  </Button></Host>;
}
