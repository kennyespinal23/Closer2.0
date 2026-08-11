import { Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import type { Milestone } from "@/lib/milestones";
import { getMilestoneAccent } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { NEW_YORK, systemText, typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

const LANDMARK_GOLD = "#E8B84A";

type MilestoneDetailViewProps = {
  milestone: Milestone;
  badgeIndex: number;
  onClose: () => void;
  /** When false, hides the back chevron (e.g. post-sermon unlock). */
  showBack?: boolean;
};

export function MilestoneDetailView({
  milestone,
  badgeIndex,
  onClose,
  showBack = true,
}: MilestoneDetailViewProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { color: accentColor, label: categoryLabel, isLandmark } =
    getMilestoneAccent(milestone);
  const ringColor = isLandmark ? LANDMARK_GOLD : accentColor;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        {showBack ? (
          <BubbleBackButton onPress={onClose} />
        ) : (
          <View style={{ height: 44 }} />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: ringColor,
              shadowOpacity: 0.4,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                padding: isLandmark ? 4 : 3,
                borderWidth: isLandmark ? 3 : 2,
                borderColor: ringColor,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Image
                source={getMilestoneBadge(badgeIndex)}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 56,
                }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>

          <Text
            style={[
              typography.smallLabel,
              {
                color: accentColor,
                textTransform: "uppercase",
                marginTop: 24,
                textAlign: "center",
              },
            ]}
          >
            Day {milestone.day} • {categoryLabel}
          </Text>

          <Text
            style={[
              systemText.title2,
              {
                color: colors.ink,
                textAlign: "center",
                marginTop: 12,
              },
            ]}
            accessibilityRole="header"
          >
            {milestone.title}
          </Text>
        </View>

        <View style={{ marginTop: 28, marginBottom: 24, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: NEW_YORK,
              fontStyle: "italic",
              fontWeight: "400",
              fontSize: 22,
              lineHeight: 32,
              textAlign: "center",
              color: colors.ink,
              width: "100%",
              maxWidth: 340,
            }}
          >
            &ldquo;{milestone.verse}&rdquo;
          </Text>
          <Text
            style={[
              typography.smallLabel,
              {
                color: accentColor,
                textTransform: "uppercase",
                marginTop: 16,
                textAlign: "center",
              },
            ]}
          >
            {milestone.reference}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginBottom: 24,
          }}
        />

        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            fontSize: 17,
            lineHeight: 28,
            color: colors.inkMuted,
          }}
        >
          {milestone.message}
        </Text>
      </ScrollView>
    </View>
  );
}
