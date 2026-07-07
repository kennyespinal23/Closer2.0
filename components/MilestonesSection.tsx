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
import { isMilestoneUnlocked, MILESTONES } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { TAB_ACCENT_RED } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

type MilestonesSectionProps = {
  longestStreak: number;
};

const GRID_GAP = 12;
const SECTION_PADDING = 16;
const CARD_HEIGHT = 188;

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

  const unlockedCount = useMemo(
    () => MILESTONES.filter((m) => isMilestoneUnlocked(m, longestStreak)).length,
    [longestStreak],
  );

  const unlockedLabel =
    unlockedCount === 1 ? "1 Unlocked" : `${unlockedCount} Unlocked`;

  const openMilestone = (milestone: Milestone) => {
    haptics.soft();
    router.push(`/milestone/${milestone.day}`);
  };

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 20,
        backgroundColor: colors.surfaceSecondary,
        padding: SECTION_PADDING,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
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
            fontWeight: "700",
            color: TAB_ACCENT_RED,
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {unlockedLabel}
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

      <View style={{ marginTop: 16, gap: GRID_GAP }}>
        {rows.map((row) => (
          <View
            key={`row-${row[0]!.milestone.day}`}
            style={{ flexDirection: "row", gap: GRID_GAP, width: "100%" }}
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
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            padding: 2,
            backgroundColor: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <Image
            source={getMilestoneBadge(badgeIndex)}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 30,
            }}
            blurRadius={unlocked ? 0 : Platform.OS === "ios" ? 16 : 8}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <Text
          style={[
            typography.smallLabel,
            {
              color: unlocked ? TAB_ACCENT_RED : colors.inkSubtle,
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: 10,
            },
          ]}
        >
          DAY {milestone.day}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: colors.ink,
            fontSize: 15,
            lineHeight: 20,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          {milestone.title}
        </Text>
      </View>

      {!unlocked ? (
        <BlurView
          intensity={Platform.OS === "ios" ? 48 : 90}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.28)",
            }}
          >
            <SFSymbol
              name="lock.fill"
              size={28}
              color="#E8B84A"
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
  const borderColor = unlocked ? TAB_ACCENT_RED : "rgba(255, 255, 255, 0.22)";

  const cardStyle = {
    width: "100%" as const,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#000000",
    borderWidth: unlocked ? 2 : 1,
    borderColor,
    overflow: "hidden" as const,
    ...(unlocked && Platform.OS === "ios"
      ? {
          shadowColor: TAB_ACCENT_RED,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
        }
      : null),
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
        <View style={{ ...cardStyle, opacity: 0.85 }} accessibilityElementsHidden>
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
