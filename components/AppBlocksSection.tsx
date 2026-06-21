import { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as haptics from "@/lib/haptics";
import { type StudySession } from "@/state/studySessions";
import { useColors } from "@/state/theme";

function formatTimeOfDay(t: { hour: number; minute: number }): string {
  const h12 = t.hour === 0 ? 12 : t.hour > 12 ? t.hour - 12 : t.hour;
  const period = t.hour >= 12 ? "PM" : "AM";
  const minute = t.minute.toString().padStart(2, "0");
  return `${h12}:${minute} ${period}`;
}

function formatDaysOfWeek(days: ReadonlyArray<number>): string {
  if (days.length === 0) return "Off";
  if (days.length === 7) return "Daily";
  const sorted = [...days].sort();
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const sameAs = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  if (sameAs(sorted, weekdays)) return "Mon–Fri";
  if (sameAs(sorted, weekend)) return "Sat & Sun";
  const abbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return sorted.map((d) => abbr[d]).join(", ");
}

function formatAppCount(n: number): string {
  if (n === 0) return "no apps";
  if (n === 1) return "1 app";
  return `${n} apps`;
}

const AppBlocksEmptyState = memo(function AppBlocksEmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "600",
          color: colors.ink,
          fontSize: 17,
          lineHeight: 24,
          letterSpacing: -0.2,
        }}
      >
        Schedule your first block
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          color: colors.inkSecondary,
          fontSize: 15,
          lineHeight: 22,
          letterSpacing: -0.1,
          marginTop: 8,
        }}
      >
        Quiet the apps that pull on you most during the time you set aside
        for God.
      </Text>
      <Pressable
        onPress={() => {
          haptics.soft();
          onAdd();
        }}
        accessibilityRole="button"
        accessibilityLabel="Set up a block"
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.surfaceTertiary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 15,
              letterSpacing: 0.2,
            }}
          >
            Set Up a Block
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

const AppBlockRow = memo(function AppBlockRow({
  session,
  onToggle,
  onEdit,
  showDivider,
}: {
  session: StudySession;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  showDivider?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        haptics.soft();
        onEdit(session.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Edit block at ${formatTimeOfDay(session.time)}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        borderTopColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "600",
            color: colors.ink,
            fontSize: 17,
            lineHeight: 22,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {formatTimeOfDay(session.time)}
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            color: colors.inkMuted,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {formatDaysOfWeek(session.daysOfWeek)} ·{" "}
          {formatAppCount(session.blockedAppIds.length)}
        </Text>
      </View>
      <Switch
        value={session.enabled}
        onValueChange={() => {
          haptics.tick();
          onToggle(session.id);
        }}
        ios_backgroundColor={colors.border as string}
        accessibilityLabel={`Toggle block at ${formatTimeOfDay(session.time)}`}
      />
    </Pressable>
  );
});

export type AppBlocksSectionProps = {
  sessions: ReadonlyArray<StudySession>;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  /** When false, hides the section title (e.g. tab screen supplies its own). */
  showTitle?: boolean;
};

export const AppBlocksSection = memo(function AppBlocksSection({
  sessions,
  onToggle,
  onAdd,
  onEdit,
  showTitle = true,
}: AppBlocksSectionProps) {
  const colors = useColors();
  const isEmpty = sessions.length === 0;

  return (
    <View style={{ marginHorizontal: 16 }}>
      {showTitle ? (
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: colors.ink,
            fontSize: 22,
            lineHeight: 28,
            letterSpacing: -0.4,
          }}
          accessibilityRole="header"
        >
          My App Blocks
        </Text>
      ) : null}

      <View
        style={{
          marginTop: showTitle ? 16 : 0,
          paddingHorizontal: 24,
          paddingTop: isEmpty ? 24 : 8,
          paddingBottom: isEmpty ? 24 : 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceSecondary,
        }}
      >
        {isEmpty ? (
          <AppBlocksEmptyState onAdd={onAdd} />
        ) : (
          <View>
            {sessions.map((session, idx) => (
              <AppBlockRow
                key={session.id}
                session={session}
                onToggle={onToggle}
                onEdit={onEdit}
                showDivider={idx > 0}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});
