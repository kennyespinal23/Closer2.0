import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { HeaderBackButton } from "@react-navigation/elements";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import { goBackOr } from "@/lib/navigation";
import { useColors } from "@/state/theme";

/**
 * Nested stack for `/settings/*`.
 *
 * Uses the native UINavigationBar (headerShown) so back chevron,
 * titles, and interactive pop gesture match system Settings. Leaf
 * screens still compose body chrome via SettingsScaffold, which now
 * only renders the scroll body and syncs `title` into the nav bar.
 *
 * Direct deep links (e.g. Profile → /settings/appearance) mount the
 * leaf as the only screen in this stack, so React Navigation would
 * hide the default back button. We always render one that pops the
 * root stack via `goBackOr`.
 */
export default function SettingsLayout() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: colors.ink,
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: {
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 17,
              color: colors.ink,
            },
            contentStyle: { backgroundColor: colors.bg },
            animation: "slide_from_right",
            headerLeft: () => (
              <HeaderBackButton
                tintColor={colors.ink}
                onPress={() => goBackOr(router, "/profile")}
              />
            ),
          }}
        >
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="appearance" options={{ title: "Appearance" }} />
          <Stack.Screen name="reading-goal" options={{ title: "Reading Goal" }} />
          <Stack.Screen name="translation" options={{ title: "Bible Translation" }} />
          <Stack.Screen name="focus" options={{ title: "Focus mode" }} />
          <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
          <Stack.Screen name="help" options={{ title: "Help & Support" }} />
          <Stack.Screen name="account" options={{ title: "Account" }} />
          <Stack.Screen name="name" options={{ title: "Your Name" }} />
          <Stack.Screen name="community" options={{ title: "Community" }} />
          <Stack.Screen name="widget" options={{ title: "Home Screen Widget" }} />
          <Stack.Screen name="user-guide" options={{ title: "User Guide" }} />
          <Stack.Screen name="developer" options={{ title: "Developer Tools" }} />
          <Stack.Screen
            name="expo-ui-smoke"
            options={{ title: "@expo/ui Smoke" }}
          />
          <Stack.Screen name="study-sessions" options={{ title: "App Blocks" }} />
        </Stack>
      </View>
      <FocusMiniPlayer aboveTabBar={false} />
    </View>
  );
}
