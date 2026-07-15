import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SFSymbol } from "@/components/Symbol";
import { spacing } from "@/constants/spacing";
import { findMomentByDay } from "@/lib/moments";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

/**
 * Re-read a saved catalog day (verse / story / insight).
 * Replaces the old 5-panel Hook→Prayer saved-sermon reader.
 */
export default function SavedDevotionalScreen() {
  const colors = useColors();
  const router = useRouter();
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const day = Number(dayParam);
  const moment = Number.isFinite(day) ? findMomentByDay(day) : null;

  const paragraphs = useMemo(() => {
    if (!moment) return [];
    return moment.story
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [moment]);

  if (!moment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: spacing[24] }}>
          <Text style={[typography.body, { color: colors.ink }]}>
            This day isn’t in the catalog anymore.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: spacing[16], minHeight: 44, justifyContent: "center" }}
          >
            <Text style={[typography.button, { color: colors.ink }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
      <View
        style={{
          paddingHorizontal: spacing[16],
          paddingTop: spacing[8],
          paddingBottom: spacing[12],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SFSymbol name="chevron.left" size={20} color={colors.ink} weight="semibold" />
        </Pressable>
        <Text
          style={[typography.smallLabel, { color: colors.inkMuted, textTransform: "uppercase" }]}
        >
          Day {moment.day}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[24],
          paddingBottom: spacing[48],
        }}
      >
        <Text style={[typography.pageTitle, { color: colors.ink, fontSize: 28, lineHeight: 34 }]}>
          {moment.title}
        </Text>
        <Text
          style={[
            typography.smallLabel,
            {
              color: colors.inkMuted,
              textTransform: "uppercase",
              marginTop: spacing[12],
              letterSpacing: 1.1,
            },
          ]}
        >
          {moment.reference}
        </Text>

        <Text
          style={[
            typography.body,
            { color: colors.ink, marginTop: spacing[24], fontStyle: "italic" },
          ]}
        >
          {moment.verse}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing[24],
          }}
        />

        {paragraphs.map((p, i) => (
          <Text
            key={i}
            style={[
              typography.body,
              { color: colors.ink, marginBottom: spacing[16] },
            ]}
          >
            {p}
          </Text>
        ))}

        <Text
          style={[
            typography.smallLabel,
            {
              color: colors.inkMuted,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              marginTop: spacing[8],
            },
          ]}
        >
          Insight
        </Text>
        <Text style={[typography.body, { color: colors.ink, marginTop: spacing[8] }]}>
          {moment.insight}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
