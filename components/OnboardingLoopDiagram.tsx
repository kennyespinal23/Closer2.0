import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { SFSymbol } from "@/components/Symbol";
import { CLOSER_ACCENT } from "@/constants/theme";
import { SOCIAL_APP_ICON_SOURCES } from "@/lib/socialAppIconAssets";
import { useColors } from "@/state/theme";

const FLOW_APPS = ["instagram", "tiktok", "youtube"] as const;

/**
 * Three-step vertical flow: lock → devotional → unlock.
 * Everything visible at once so the loop reads in one glance.
 */
export function OnboardingLoopDiagram() {
  const colors = useColors();

  return (
    <View style={{ width: "100%", maxWidth: 320 }}>
      <FlowStep
        stepVisual={<LockedAppsVisual />}
        label="Your apps are locked"
      />

      <FlowConnector />

      <FlowStep
        stepVisual={<DevotionalVisual />}
        label="You read today's devotional"
      />

      <FlowConnector />

      <FlowStep
        stepVisual={<UnlockedAppsVisual />}
        label="Your apps are unlocked"
      />

      {/* Quiet loop hint — closes the diagram without adding a 4th node */}
      <View style={{ alignItems: "center", marginTop: 4 }}>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "500",
            fontSize: 12,
            color: colors.inkSubtle,
            letterSpacing: 0.2,
          }}
        >
          Every morning
        </Text>
      </View>
    </View>
  );
}

function FlowStep({
  stepVisual,
  label,
}: {
  stepVisual: ReactNode;
  label: string;
}) {
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        {stepVisual}
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 17,
          lineHeight: 22,
          letterSpacing: -0.2,
          color: colors.ink,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function FlowConnector() {
  return (
    <View
      style={{
        width: 72,
        alignItems: "center",
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          width: 2,
          height: 20,
          borderRadius: 1,
          backgroundColor: CLOSER_ACCENT,
          opacity: 0.35,
        }}
      />
      <View style={{ opacity: 0.7, marginTop: 2 }}>
        <SFSymbol name="chevron.down" size={12} color={CLOSER_ACCENT} />
      </View>
    </View>
  );
}

function LockedAppsVisual() {
  const colors = useColors();

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <MiniAppRow dimmed />
      <View
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.ink,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.surface,
        }}
      >
        <SFSymbol name="lock.fill" size={13} color={colors.surface} />
      </View>
    </View>
  );
}

function DevotionalVisual() {
  const colors = useColors();

  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${CLOSER_ACCENT}22`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SFSymbol name="book.fill" size={18} color={CLOSER_ACCENT} />
      </View>
      <View
        style={{
          width: 48,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: "65%",
            height: "100%",
            backgroundColor: CLOSER_ACCENT,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

function UnlockedAppsVisual() {
  const colors = useColors();

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <MiniAppRow dimmed={false} />
      <View
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: CLOSER_ACCENT,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.surface,
        }}
      >
        <SFSymbol name="lock.open.fill" size={10} color="#FFFFFF" />
      </View>
    </View>
  );
}

function MiniAppRow({ dimmed }: { dimmed: boolean }) {
  const size = 22;
  const radius = Math.round(size * 0.225);

  return (
    <View style={{ flexDirection: "row", gap: 5, opacity: dimmed ? 0.45 : 1 }}>
      {FLOW_APPS.map((app) => (
        <Image
          key={app}
          source={SOCIAL_APP_ICON_SOURCES[app]}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
          }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}
