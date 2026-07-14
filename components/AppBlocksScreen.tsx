import { useCallback, useState, type ReactNode } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlockedAppsEditor } from "@/components/BlockedAppsEditor";
import { BrandGlyph } from "@/components/BrandGlyph";
import { FamilyActivityAppsEditor } from "@/components/FamilyActivityAppsEditor";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { SFSymbol } from "@/components/Symbol";
import { TimeBlockEditor } from "@/components/TimeBlockEditor";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { TAB_ACCENT_RED } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  countSilencedTargets,
  findSocialApp,
  formatScreenTimeSelectionSummary,
  getScreenTimeSelectionSummary,
  isShieldSupported,
  type SocialAppId,
} from "@/lib/focus";
import {
  applyScreenTimeConfiguration,
  countScreenTimeSelectionItems,
  openNativeAppPickerWithAuth,
  primeScreenTimeAuthorizationFromGesture,
} from "@/lib/deviceActivityShield";
import {
  formatReminderTime,
  type WeekdayIndex,
} from "@/lib/notifications";
import { syncAllScheduledAppBlocks } from "@/lib/scheduledAppBlocks";
import { typography } from "@/lib/typography";
import { useFocus } from "@/state/focus";
import {
  formatDaysOfWeek,
  useStudySessions,
  type StudySession,
  type StudySessionDraft,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

import { SCREEN_H_PAD } from "@/lib/layout";

export type AppBlocksScreenProps = {
  /** When true, show a back chevron (stack / settings entry). */
  showBack?: boolean;
  /** Extra bottom inset for tab bar + focus mini-player. */
  bottomInset?: number;
};

/**
 * App Blocks — one screen, two cards (reference: Opal / prayer-lock
 * pattern). Blocked Apps + Block Times. No stat chips, no nested
 * navigation, consistent 20pt horizontal inset per HIG grouped layout.
 */
export function AppBlocksScreen({
  showBack = false,
  bottomInset = 0,
}: AppBlocksScreenProps) {
  const colors = useColors();
  const router = useRouter();
  const focusPillSpacing = useFocusMiniPlayerSpacing();
  const { sessions, addSession, updateSession, removeSession, toggleSession } =
    useStudySessions();
  const { prefs: focusPrefs, setBlockedAppIds, setEnabled } = useFocus();

  const nativeShield = isShieldSupported();
  const [timeTarget, setTimeTarget] = useState<null | "new" | string>(null);
  const [appsEditorOpen, setAppsEditorOpen] = useState(false);
  const [nativeAppsEditorOpen, setNativeAppsEditorOpen] = useState(false);
  const [selectionRevision, setSelectionRevision] = useState(0);
  void selectionRevision;

  const blockedCount = nativeShield
    ? countScreenTimeSelectionItems()
    : countSilencedTargets(focusPrefs.blockedAppIds);
  const screenTimeSummary = nativeShield ? getScreenTimeSelectionSummary() : null;
  const appsSummary = nativeShield
    ? formatScreenTimeSelectionSummary(screenTimeSummary)
    : blockedCount > 0
      ? `${blockedCount} ${blockedCount === 1 ? "app" : "apps"} selected`
      : "Pick the apps you want quieted during blocks.";

  const blockedApps = focusPrefs.blockedAppIds
    .map((id) => findSocialApp(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const enabledSessions = sessions.filter((s) => s.enabled);
  const scheduleSummary = buildScheduleSummary(enabledSessions);

  const editingSession =
    timeTarget && timeTarget !== "new"
      ? sessions.find((s) => s.id === timeTarget)
      : undefined;

  const openAppsPicker = useCallback(() => {
    if (nativeShield) {
      openNativeAppPickerWithAuth({
        onAuthorized: () => setNativeAppsEditorOpen(true),
      });
    } else {
      haptics.soft();
      setAppsEditorOpen(true);
    }
  }, [nativeShield]);

  const handleTimeSave = useCallback(
    async (result: {
      time: { hour: number; minute: number };
      daysOfWeek: WeekdayIndex[];
    }) => {
      if (timeTarget === "new") {
        const draft: StudySessionDraft = {
          name: defaultBlockName(result.time),
          source: "user",
          time: result.time,
          daysOfWeek: result.daysOfWeek,
          enabled: true,
          useFocusMode: true,
          blockedAppIds: [...focusPrefs.blockedAppIds],
        };
        await addSession(draft);
      } else if (timeTarget) {
        await updateSession(timeTarget, {
          time: result.time,
          daysOfWeek: result.daysOfWeek,
        });
      }
      setTimeTarget(null);
    },
    [timeTarget, addSession, updateSession, focusPrefs.blockedAppIds],
  );

  const handleAppsSave = useCallback(
    async (next: SocialAppId[]) => {
      setBlockedAppIds(next);
      await Promise.all(
        sessions.map((s) => updateSession(s.id, { blockedAppIds: [...next] })),
      );
      setAppsEditorOpen(false);
    },
    [setBlockedAppIds, sessions, updateSession],
  );

  const handleDelete = useCallback(
    (session: StudySession) => {
      if (session.source === "system") {
        Alert.alert(
          "Set up by Closer",
          "Pause this block with the switch instead of deleting it.",
          [{ text: "Got it" }],
        );
        return;
      }
      const timeLabel = formatReminderTime(session.time);
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Delete Block", "Cancel"],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
            title: "Delete this time?",
            message: `${timeLabel} will be removed.`,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              haptics.soft();
              removeSession(session.id);
            }
          },
        );
        return;
      }
      Alert.alert("Delete this time?", `${timeLabel} will be removed.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeSession(session.id),
        },
      ]);
    },
    [removeSession],
  );

  const paddingBottom =
    bottomInset + focusPillSpacing + (showBack ? 32 : TAB_BAR_TOTAL_HEIGHT + 24);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg, overflow: "hidden" }}
      edges={["top"]}
    >
      {showBack ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingTop: 4,
            paddingBottom: 4,
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
            <SFSymbol name="chevron.left" size={18} color={colors.ink} weight="semibold" />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Title — 34pt per HIG / Espinal standards */}
        <View style={{ paddingHorizontal: SCREEN_H_PAD, paddingTop: showBack ? 0 : 8 }}>
          <Text
            style={[
              typography.pageTitle,
              { color: colors.ink, fontSize: 34, lineHeight: 41 },
            ]}
            accessibilityRole="header"
          >
            App Blocks
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 15,
              lineHeight: 20,
              color: colors.inkMuted,
              marginTop: 6,
            }}
          >
            Set block times and choose apps to quiet.
          </Text>
        </View>

        {/* Card 1 — Blocked Apps */}
        <BlockCard style={{ marginTop: 24 }}>
          <CardHeader
            icon="lock.fill"
            title="Blocked Apps"
            badge={blockedCount > 0 ? String(blockedCount) : undefined}
          />

          {!nativeShield && blockedApps.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {blockedApps.slice(0, 8).map((app) => (
                <BrandGlyph key={app.id} appId={app.id} size="md" />
              ))}
            </View>
          ) : (
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkMuted,
              marginBottom: 16,
            }}
          >
            {nativeShield && blockedCount > 0
              ? "Apps block when you tap Read Now or during your block times."
              : appsSummary}
          </Text>
          )}

          <PrimaryCardButton
            label={
              blockedCount > 0 ? "Update blocked apps" : "Choose apps to block"
            }
            onPressIn={() => {
              if (nativeShield) primeScreenTimeAuthorizationFromGesture();
            }}
            onPress={openAppsPicker}
          />
        </BlockCard>

        {/* Card 2 — Block Times */}
        <BlockCard style={{ marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <CardHeader icon="clock.fill" title="Block Times" inline />
            </View>
            {sessions.length > 0 ? (
              <Pressable
                onPress={() => {
                  haptics.soft();
                  setTimeTarget("new");
                }}
                accessibilityRole="button"
                accessibilityLabel="Add block time"
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surfaceTertiary,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <SFSymbol name="plus" size={18} color={colors.ink} weight="semibold" />
              </Pressable>
            ) : null}
          </View>

          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkMuted,
              marginBottom: sessions.length > 0 ? 12 : 16,
            }}
          >
            Your apps will be quieted at these times.
          </Text>

          {sessions.length === 0 ? (
            <PrimaryCardButton
              label="Add block time"
              onPress={() => {
                haptics.soft();
                setTimeTarget("new");
              }}
            />
          ) : (
            <View>
              {sessions.map((session, idx) => (
                <TimeBlockRow
                  key={session.id}
                  session={session}
                  showDivider={idx > 0}
                  onPress={() => {
                    haptics.soft();
                    setTimeTarget(session.id);
                  }}
                  onLongPress={() => handleDelete(session)}
                  onToggle={() => {
                    haptics.tick();
                    void toggleSession(session.id);
                  }}
                />
              ))}
            </View>
          )}
        </BlockCard>

        {scheduleSummary ? (
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkSubtle,
              textAlign: "center",
              marginTop: 16,
              paddingHorizontal: SCREEN_H_PAD + 8,
            }}
          >
            {scheduleSummary}
          </Text>
        ) : null}
      </ScrollView>

      <TimeBlockEditor
        key={timeTarget ?? "closed-time"}
        visible={timeTarget !== null}
        existing={editingSession}
        onClose={() => setTimeTarget(null)}
        onSubmit={handleTimeSave}
      />

      <BlockedAppsEditor
        visible={!nativeShield && appsEditorOpen}
        initial={focusPrefs.blockedAppIds}
        onClose={() => setAppsEditorOpen(false)}
        onSubmit={handleAppsSave}
      />

      <FamilyActivityAppsEditor
        visible={nativeShield && nativeAppsEditorOpen}
        onClose={() => setNativeAppsEditorOpen(false)}
        onSaved={() => {
          applyScreenTimeConfiguration();
          setEnabled(true);
          setSelectionRevision((n) => n + 1);
          void syncAllScheduledAppBlocks(sessions).catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}

function BlockCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          marginHorizontal: SCREEN_H_PAD,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CardHeader({
  icon,
  title,
  badge,
  inline,
}: {
  icon: "lock.fill" | "clock.fill";
  title: string;
  badge?: string;
  inline?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: inline ? 0 : 12,
      }}
    >
      <SFSymbol name={icon} size={16} color={colors.ink} weight="semibold" />
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 17,
          lineHeight: 22,
          color: colors.ink,
          marginLeft: 8,
          flex: 1,
        }}
      >
        {title}
      </Text>
      {badge ? (
        <View
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 14,
            paddingHorizontal: 8,
            backgroundColor: colors.surfaceTertiary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 13,
              color: colors.ink,
            }}
          >
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PrimaryCardButton({
  label,
  onPress,
  onPressIn,
}: {
  label: string;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  return (
    <PrimaryPillButton label={label} onPress={onPress} onPressIn={onPressIn} />
  );
}

function TimeBlockRow({
  session,
  showDivider,
  onPress,
  onLongPress,
  onToggle,
}: {
  session: StudySession;
  showDivider?: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit block at ${formatReminderTime(session.time)}`}
      accessibilityHint="Long press to delete"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          borderTopWidth: showDivider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 20,
              lineHeight: 25,
              color: session.enabled ? colors.ink : colors.inkMuted,
            }}
            numberOfLines={1}
          >
            {formatReminderTime(session.time)}
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkMuted,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {formatDaysOfWeek(session.daysOfWeek)}
          </Text>
        </View>
        <Switch
          value={session.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border as string, true: TAB_ACCENT_RED }}
          ios_backgroundColor={colors.border as string}
          accessibilityLabel={`Toggle block at ${formatReminderTime(session.time)}`}
        />
      </View>
    </Pressable>
  );
}

function defaultBlockName(time: { hour: number; minute: number }): string {
  return `Block at ${formatReminderTime(time)}`;
}

function buildScheduleSummary(sessions: ReadonlyArray<StudySession>): string | null {
  if (sessions.length === 0) return null;
  const times = sessions
    .map((s) => formatReminderTime(s.time))
    .slice(0, 3)
    .join(", ");
  const extra = sessions.length > 3 ? ` and ${sessions.length - 3} more` : "";
  return `Blocks are active ${sessions.length} ${
    sessions.length === 1 ? "time" : "times"
  } each day${times ? ` at ${times}${extra}` : ""}.`;
}
