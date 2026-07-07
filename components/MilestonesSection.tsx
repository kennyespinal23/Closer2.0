import { useMemo } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { SFSymbol } from "@/components/Symbol";
import type { Milestone } from "@/lib/milestones";
import {
  getMilestoneAccent,
  isMilestoneUnlocked,
  MILESTONES,
} from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import * as haptics from "@/lib/haptics";
import { useColors } from "@/state/theme";

type MilestonesSectionProps = {
  longestStreak: number;
};

const GRID_GAP_X = 20;
const GRID_GAP_Y = 16;
const CARD_PADDING = 16;
const ICON_SIZE = 64;
const LANDMARK_GOLD = "#E8B84A";

export function MilestonesSection({
  longestStreak,
}: MilestonesSectionProps) {
  const colors = useColors();
  const router = useRouter();

  const rows = useMemo(() => {
    const out: Array<Array<{ milestone: Milestone; badgeIndex: number }>> = [];
    for (let i = 0; i < MILESTONES.length; i += 2) {
      const row: Array<{ milestone: Milestone; badgeIndex: number }> = [
        { milestone: MILESTONES[i]!, badgeIndex: i + 1 },
      ];
      if (MILESTONES[i + 1]) {
        row.push({ milestone: MILESTONES[i + 1]!, badgeIndex: i + 2 });
      }
      out.push(row);
    }
    return out;
  }, []);

  const collectedCount = useMemo(
    () => MILESTONES.filter((m) => isMilestoneUnlocked(m, longestStreak)).length,
    [longestStreak],
  );

  const collectedLabel =
    collectedCount === 1 ? "1 collected" : `${collectedCount} collected`;

  const openMilestone = (milestone: Milestone) => {
    haptics.soft();
    router.push(`/milestone/${milestone.day}`);
  };

  return (
    <View style={{ marginTop: 24 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "600",
            color: colors.ink,
            fontSize: 20,
            lineHeight: 26,
            letterSpacing: -0.2,
          }}
          accessibilityRole="header"
        >
          Milestones
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "500",
            color: colors.inkMuted,
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {collectedLabel}
        </Text>
      </View>

      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          color: colors.inkMuted,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 8,
        }}
      >
        Gathered along the way — meaning to keep, never points to chase.
      </Text>

      <View style={{ marginTop: 24, gap: GRID_GAP_Y }}>
        {rows.map((row) => (
          <View
            key={`row-${row[0]!.milestone.day}`}
            style={{ flexDirection: "row", gap: GRID_GAP_X, width: "100%" }}
          >
            {row.map(({ milestone, badgeIndex }) => (
              <MilestoneCard
                key={`milestone-${milestone.day}`}
                milestone={milestone}
                badgeIndex={badgeIndex}
                unlocked={isMilestoneUnlocked(milestone, longestStreak)}
                onPress={() => openMilestone(milestone)}
              />
            ))}
            {row.length === 1 ? <View style={{ flex: 1, flexBasis: 0 }} /> : null}
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <SFSymbol
          name="sparkles"
          size={14}
          color={colors.inkSubtle}
          weight="regular"
        />
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            color: colors.inkSubtle,
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          More milestones ahead.
        </Text>
      </View>
    </View>
  );
}

function MilestoneCardChrome({
  milestone,
  badgeIndex,
  unlocked,
  colors,
}: {
  milestone: Milestone;
  badgeIndex: number;
  unlocked: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const { color: accentColor, label: categoryLabel } =
    getMilestoneAccent(milestone);

  return (
    <>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE / 2,
            padding: 2,
            borderWidth: 1,
            borderColor: unlocked
              ? "rgba(255,255,255,0.28)"
              : "rgba(255,255,255,0.16)",
            backgroundColor: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <Image
            source={getMilestoneBadge(badgeIndex)}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: ICON_SIZE / 2,
            }}
            blurRadius={unlocked ? 0 : Platform.OS === "ios" ? 14 : 8}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontFamily: "System",
          fontWeight: "700",
          color: colors.ink,
          fontSize: 15,
          lineHeight: 20,
          textAlign: "center",
          marginTop: 16,
        }}
      >
        {milestone.title}
      </Text>

      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          fontSize: 11,
          lineHeight: 16,
          letterSpacing: 0.2,
          marginTop: 8,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        <Text style={{ color: colors.inkMuted }}>Day {milestone.day} • </Text>
        <Text style={{ color: accentColor }}>{categoryLabel}</Text>
      </Text>

      {!unlocked ? (
        <BlurView
          intensity={Platform.OS === "ios" ? 44 : 88}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.24)",
            }}
          >
            <SFSymbol
              name="lock.fill"
              size={24}
              color={LANDMARK_GOLD}
              weight="regular"
            />
          </View>
        </BlurView>
      ) : null}
    </>
  );
}

function MilestoneCard({
  milestone,
  badgeIndex,
  unlocked,
  onPress,
}: {
  milestone: Milestone;
  badgeIndex: number;
  unlocked: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  const cardStyle = {
    width: "100%" as const,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: unlocked
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(255, 255, 255, 0.12)",
    overflow: "hidden" as const,
    padding: CARD_PADDING,
    minHeight: 176,
    alignItems: "center" as const,
  };

  return (
    <View
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
      }}
    >
      {unlocked ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${milestone.title}, day ${milestone.day}`}
          style={cardStyle}
        >
          <MilestoneCardChrome
            milestone={milestone}
            badgeIndex={badgeIndex}
            unlocked={unlocked}
            colors={colors}
          />
        </TouchableOpacity>
      ) : (
        <View style={cardStyle} accessibilityElementsHidden>
          <MilestoneCardChrome
            milestone={milestone}
            badgeIndex={badgeIndex}
            unlocked={unlocked}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}
