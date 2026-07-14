import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { Button, Host, Text as ExpoUIText, VStack } from "@expo/ui/swift-ui";
import { SettingsScaffold, SettingsSection } from "@/components/SettingsScaffold";
import { spacing } from "@/constants/spacing";
import { useColors } from "@/state/theme";

/**
 * Isolated @expo/ui smoke test — not a production screen.
 *
 * Confirms the SwiftUI Host + Button bridge works after a native
 * rebuild. Linked only from Settings → Developer Tools in __DEV__.
 *
 * Host needs an explicit width/height proposal — `matchContents`
 * alone collapses to near-zero when the parent doesn't propose a
 * size, which truncates labels and shrinks the button.
 */
export default function ExpoUiSmokeScreen() {
  const colors = useColors();
  const [pressCount, setPressCount] = useState(0);
  const onPress = useCallback(() => setPressCount((n) => n + 1), []);

  return (
    <SettingsScaffold title="@expo/ui Smoke">
      <SettingsSection
        title="Native bridge"
        footer="If the button below renders as a real SwiftUI control and increments the counter, @expo/ui is linked correctly in this native binary."
      >
        <View
          style={{
            paddingHorizontal: spacing[16],
            paddingVertical: spacing[24],
            gap: spacing[16],
            width: "100%",
          }}
        >
          <Host
            style={{
              width: "100%",
              height: 140,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VStack spacing={spacing[16]} alignment="center">
              <ExpoUIText>SwiftUI Host is alive</ExpoUIText>
              <Button variant="borderedProminent" onPress={onPress}>
                Press native button
              </Button>
            </VStack>
          </Host>

          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 15,
              color: colors.inkMuted,
              textAlign: "center",
            }}
          >
            Presses: {pressCount}
          </Text>
        </View>
      </SettingsSection>
    </SettingsScaffold>
  );
}
