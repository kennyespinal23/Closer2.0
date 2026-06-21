import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppBlocksSection } from "@/components/AppBlocksSection";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { SFSymbol } from "@/components/Symbol";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { useFocus } from "@/state/focus";
import { useStudySessions } from "@/state/studySessions";
import { useColors } from "@/state/theme";

export default function BlocksTabScreen() {
  const colors = useColors();
  const router = useRouter();
  const focusPillSpacing = useFocusMiniPlayerSpacing();
  const { sessions, toggleSession } = useStudySessions();
  const { prefs: focusPrefs } = useFocus();

  const handleToggle = useCallback(
    (id: string) => {
      haptics.tap();
      void toggleSession(id);
    },
    [toggleSession],
  );

  const handleOpenEditor = useCallback(() => {
    haptics.soft();
    router.push("/settings/study-sessions");
  }, [router]);

  const blockedCount = focusPrefs.blockedAppIds.length;
  const enabledCount = sessions.filter((s) => s.enabled).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 + focusPillSpacing,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          <Text style={[typography.pageTitle, { color: colors.ink, fontSize: 34 }]}>
            My Blocks
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 15,
              lineHeight: 22,
              color: colors.inkMuted,
              marginTop: 8,
            }}
          >
            Quiet distracting apps during the times you set aside for God.
          </Text>
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            <StatChip
              icon="shield.fill"
              label="Blocks active"
              value={String(enabledCount)}
              accent={CLOSER_ACCENT}
            />
            <StatChip
              icon="square.grid.2x2.fill"
              label="Apps silenced"
              value={String(blockedCount)}
              accent="#5AC8FA"
            />
          </View>
        </View>

        <AppBlocksSection
          sessions={sessions}
          onToggle={handleToggle}
          onAdd={handleOpenEditor}
          onEdit={handleOpenEditor}
          showTitle={false}
        />

        <Pressable
          onPress={handleOpenEditor}
          accessibilityRole="button"
          accessibilityLabel="Manage blocked apps and schedule"
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginTop: 20,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 17,
                  color: colors.ink,
                }}
              >
                Manage schedule & apps
              </Text>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "400",
                  fontSize: 13,
                  color: colors.inkMuted,
                  marginTop: 4,
                }}
              >
                Edit block times, days, and which apps to silence
              </Text>
            </View>
            <SFSymbol
              name="chevron.right"
              size={14}
              color={colors.inkSubtle}
              weight="semibold"
            />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: "shield.fill" | "square.grid.2x2.fill";
  label: string;
  value: string;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${accent}22`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <SFSymbol name={icon} size={18} color={accent} weight="semibold" />
      </View>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 28,
          color: colors.ink,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 13,
          color: colors.inkMuted,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
