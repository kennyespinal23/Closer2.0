import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BlockedAppsEditor } from "@/components/BlockedAppsEditor";
import { BrandGlyph } from "@/components/BrandGlyph";
import { TimeBlockEditor } from "@/components/TimeBlockEditor";
import * as haptics from "@/lib/haptics";
import { findSocialApp, type SocialAppId } from "@/lib/focus";
import {
  formatReminderTime,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionStatus,
  type WeekdayIndex,
} from "@/lib/notifications";
import { useFocus } from "@/state/focus";
import {
  useStudySessions,
  type StudySession,
  type StudySessionDraft,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

/** Same iOS-system-blue used by the modal editors' Save buttons.
 *  Reads as the universal "primary tap target" color in both
 *  themes, and keeps the App Blocks vocabulary consistent (the
 *  Save buttons, the day chips, and the apps CTA all share one
 *  accent). */
const PRIMARY_BLUE = "#0A84FF";

/**
 * App Blocks — the page the home "Add a time and apps to block" row
 * lands on.
 *
 * The screen now follows the two-card pattern of the user's
 * reference Opal-style "lock settings" mockup. Each card is one
 * commitment the user is making to themselves:
 *
 *   1. Blocked Apps  — WHICH apps should be silenced. One global
 *                      list (managed via `focusPrefs.blockedAppIds`)
 *                      shared across every block time. Editing it
 *                      mirrors into every existing session's
 *                      `blockedAppIds` so toggling on a new app
 *                      doesn't require visiting every time block.
 *
 *   2. Block Times   — WHEN they should be silenced. One entry per
 *                      time (8:00 AM weekdays, 6:00 PM daily…) with
 *                      a switch for pause-without-delete. Add new
 *                      entries via the section's "+" affordance.
 *
 * The old per-session "apps to silence" picker is hidden here — it
 * still exists in the data model so legacy callers keep working —
 * but the user's mental model on this page is "one apps list,
 * many times". When the apps list is updated on this page we
 * propagate the new list to every existing session in one pass
 * so the data and the UI stay in sync.
 */
export default function AppBlocksScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessions, addSession, updateSession, removeSession, toggleSession } =
    useStudySessions();
  const { prefs: focusPrefs, setBlockedAppIds } = useFocus();
  const [permission, setPermission] =
    useState<NotificationPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);
  // Two independent editor targets — each modal owns its own
  // visibility so opening one never collides with the other. `null`
  // means closed; `"new"` means creating; a string id means editing.
  const [timeTarget, setTimeTarget] = useState<null | "new" | string>(null);
  const [appsEditorOpen, setAppsEditorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotificationPermission().then((p) => {
      if (!cancelled) setPermission(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Permission handling ──────────────────────────────────────

  const handleRequestPermission = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const status = await requestNotificationPermission();
      setPermission(status);
      // If permission was previously permanently denied (canAskAgain
      // === false), the request resolves immediately as "denied" —
      // nudge the user to the system Settings since the OS won't
      // show our prompt again.
      if (status === "denied") {
        Alert.alert(
          "Notifications are off",
          "Open Settings to allow Closer to remind you when each block starts.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // ─── Delete confirm (long-press on a time row) ────────────────

  const handleDelete = useCallback(
    (session: StudySession) => {
      // System routines (seeded by onboarding) can't be deleted —
      // only paused via the row toggle. See state/studySessions for
      // the reasoning. Surface why so the user doesn't see a
      // silent non-response.
      if (session.source === "system") {
        Alert.alert(
          "Set up by Closer",
          "This time was set up during your welcome. Use the switch to pause it instead — your notifications stop and nothing fires on the days you've chosen.",
          [{ text: "Got it", style: "default" }],
        );
        return;
      }
      Alert.alert(
        "Delete this time?",
        `${formatReminderTime(session.time)} will be removed and its reminders cancelled.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => removeSession(session.id),
          },
        ],
      );
    },
    [removeSession],
  );

  // ─── Save handlers wired into the two modal editors ───────────

  /** Persist a new time block OR update an existing one. Newly-
   *  created blocks inherit the global blocked-apps list so the
   *  user doesn't have to set apps twice. */
  const handleTimeSave = useCallback(
    async (
      result: { time: { hour: number; minute: number }; daysOfWeek: WeekdayIndex[] },
    ) => {
      if (timeTarget === "new") {
        const draft: StudySessionDraft = {
          // Use a friendly auto-name for the row label / notification
          // body. The user doesn't have a name field in the simplified
          // editor; this default is good enough for both surfaces.
          name: defaultBlockName(result.time),
          source: "user",
          time: result.time,
          daysOfWeek: result.daysOfWeek,
          enabled: true,
          useFocusMode: true,
          // Inherit the global app list so this block silences the
          // user's curated apps from day one.
          blockedAppIds: [...focusPrefs.blockedAppIds],
        };
        await addSession(draft);
      } else if (timeTarget) {
        // Editing an existing block — patch only time + days, leave
        // everything else (name, apps, focus opt-in) intact.
        await updateSession(timeTarget, {
          time: result.time,
          daysOfWeek: result.daysOfWeek,
        });
      }
      setTimeTarget(null);
    },
    [timeTarget, addSession, updateSession, focusPrefs.blockedAppIds],
  );

  /** Persist a new blocked-apps list — writes the global focus
   *  prefs AND mirrors the list into every existing session so the
   *  one-app-list-applies-to-all-times mental model holds. */
  const handleAppsSave = useCallback(
    async (next: SocialAppId[]) => {
      setBlockedAppIds(next);
      // Mirror into every existing session in parallel. Fire-and-
      // forget — if a single update fails the OS notification just
      // keeps its previous apps list; the global list is the source
      // of truth for any future re-creation.
      await Promise.all(
        sessions.map((s) =>
          updateSession(s.id, { blockedAppIds: [...next] }),
        ),
      );
      setAppsEditorOpen(false);
    },
    [setBlockedAppIds, sessions, updateSession],
  );

  // ─── Derived data ────────────────────────────────────────────

  const anyEnabled = sessions.some((s) => s.enabled);
  const blockedApps = focusPrefs.blockedAppIds
    .map((id) => findSocialApp(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  // The session currently being edited (if any).
  const editingSession =
    timeTarget && timeTarget !== "new"
      ? sessions.find((s) => s.id === timeTarget)
      : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {/* Header — back chevron + centered title, same chrome as the
          rest of the settings stack so this page sits visually in
          the same family. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: 4,
          paddingBottom: 6,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BackChevron stroke={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={{ width: 40, height: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block — large editorial header with a quiet
            subtitle below. Matches the reference's "lock settings
            · set prayer reminders & choose apps to block" hierarchy
            but in our typography. */}
        <View style={{ paddingHorizontal: 24, paddingTop: 4 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: -0.6,
            }}
            accessibilityRole="header"
          >
            App Blocks
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              color: colors.inkMuted,
              fontSize: 15,
              lineHeight: 21,
              marginTop: 6,
            }}
          >
            Pick the apps you want quieted and the times to silence them.
          </Text>
        </View>

        {/* Permission CTA — only when the user could miss notifications. */}
        {permission !== "granted" && (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <BellGlyph stroke={colors.ink} />
              </View>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.ink,
                    fontSize: 14,
                  }}
                >
                  Allow notifications
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    color: colors.inkMuted,
                    fontSize: 12,
                    lineHeight: 17,
                    marginTop: 1,
                  }}
                >
                  Required for block reminders.
                </Text>
              </View>
              <Pressable
                onPress={handleRequestPermission}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Allow notifications"
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.ink,
                  opacity: pressed || busy ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 12,
                    color: colors.primaryFg,
                  }}
                >
                  {permission === "denied" ? "Settings" : "Allow"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Card 1: Blocked Apps ─────────────────────────────
            A single rounded card with: a small section header
            row (lock icon + "Blocked Apps" + count chip on the
            right), a horizontal preview of brand glyphs for the
            currently-selected apps, and a primary CTA pill at
            the bottom that opens the apps picker.
            
            Empty state: no glyph preview, the CTA reads "Pick
            apps to block". */}
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <View
            style={{
              borderRadius: 22,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: blockedApps.length === 0 ? 6 : 14,
              }}
            >
              <LockGlyph stroke={colors.ink} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.ink,
                  fontSize: 16,
                  letterSpacing: -0.3,
                }}
                accessibilityRole="header"
              >
                Blocked Apps
              </Text>
              {blockedApps.length > 0 ? (
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: colors.accentSoft,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 12,
                      color: colors.ink,
                    }}
                  >
                    {blockedApps.length}
                  </Text>
                </View>
              ) : null}
            </View>

            {blockedApps.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: 2,
                  gap: 10,
                }}
                style={{ marginBottom: 16 }}
              >
                {blockedApps.map((app) => (
                  <BrandGlyph key={app.id} appId={app.id} size="md" />
                ))}
              </ScrollView>
            ) : (
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  color: colors.inkMuted,
                  fontSize: 13,
                  lineHeight: 18,
                  marginBottom: 14,
                }}
              >
                Pick the apps you want silenced during every block.
              </Text>
            )}

            {/* CTA pill — chrome held on the inner View so the
                NativeWind/Pressable style-function interop can't
                drop the backgroundColor. Pressable just owns the
                tap + opacity feedback; the inner View paints the
                blue pill. */}
            <Pressable
              onPress={() => {
                haptics.soft();
                setAppsEditorOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                blockedApps.length > 0
                  ? "Update Blocked Apps"
                  : "Pick apps to block"
              }
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <View
                style={{
                  borderRadius: 14,
                  // iOS-system-blue. Using a saturated accent (vs
                  // the ink swap we use for sermon CTAs) means the
                  // button reads as a tap target unambiguously in
                  // both themes — ink-on-bg pairs are technically
                  // correct but visually blend with white text in
                  // dark mode. Blue is universally read as "tap
                  // this" and matches the modal editors' Save
                  // buttons + the day chips so the App Blocks
                  // vocabulary is consistent.
                  backgroundColor: PRIMARY_BLUE,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                <LockGlyph stroke="#FFFFFF" />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: "#FFFFFF",
                    fontSize: 14.5,
                    letterSpacing: 0.2,
                    marginLeft: 8,
                  }}
                >
                  {blockedApps.length > 0
                    ? "Update Blocked Apps"
                    : "Pick apps to block"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Card 2: Block Times ──────────────────────────────
            A rounded card with: section header (clock icon +
            "Block Times" + "+" add button on the right), a one-
            line description, then either an inline empty state
            ("Add your first time") or a stack of time rows. Each
            row leads with the time at 17pt SemiBold, then the
            days summary in a quiet subtitle, then a system Switch
            on the right for pause-without-delete.
            
            Long-press a row to delete (with a confirmation
            alert). Tap the row body to open the editor for that
            time. */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <View
            style={{
              borderRadius: 22,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 16,
              paddingBottom: sessions.length > 0 ? 6 : 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <ClockGlyph stroke={colors.ink} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.ink,
                  fontSize: 16,
                  letterSpacing: -0.3,
                }}
                accessibilityRole="header"
              >
                Block Time
              </Text>
              {/* Header "+" only renders when there's NO time set
                  yet — the App Block is capped at a single daily
                  block, matching the one-sermon-a-day rule. Once
                  the user has added their time, the only action
                  is to edit/delete the existing row (tap or
                  swipe). The "+" returns the moment they delete
                  the row, so the affordance is never permanently
                  hidden — just gated by capacity. */}
              {sessions.length === 0 ? (
                <Pressable
                  onPress={() => {
                    haptics.soft();
                    setTimeTarget("new");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add a time"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: colors.accentSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <PlusGlyph stroke={colors.ink} />
                </Pressable>
              ) : null}
            </View>

            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                color: colors.inkMuted,
                fontSize: 13,
                lineHeight: 18,
                marginBottom: sessions.length === 0 ? 4 : 8,
              }}
            >
              {sessions.length === 0
                ? "Your apps will be quieted at the time you add here."
                : "Your apps will be quieted at this time."}
            </Text>

            {sessions.length === 0 ? (
              <Pressable
                onPress={() => {
                  haptics.soft();
                  setTimeTarget("new");
                }}
                accessibilityRole="button"
                accessibilityLabel="Add your first time"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  marginTop: 10,
                  borderRadius: 14,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                })}
              >
                <PlusGlyph stroke={colors.ink} />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.ink,
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  Add a time
                </Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: 4 }}>
                {sessions.map((session, i) => (
                  <TimeRow
                    key={session.id}
                    session={session}
                    isLast={i === sessions.length - 1}
                    onTap={() => setTimeTarget(session.id)}
                    onLongPress={() => handleDelete(session)}
                    onToggle={() => toggleSession(session.id)}
                  />
                ))}
              </View>
            )}
          </View>

          {sessions.length > 0 ? (
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                color: colors.inkSubtle,
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
                marginTop: 14,
                paddingHorizontal: 12,
              }}
            >
              {anyEnabled
                ? "Block time is active."
                : "Block time is off — your apps won't be blocked."}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* ─── Editors ───────────────────────────────────────────── */}

      <TimeBlockEditor
        key={timeTarget ?? "closed-time"}
        visible={timeTarget !== null}
        existing={editingSession}
        onClose={() => setTimeTarget(null)}
        onSubmit={handleTimeSave}
      />

      <BlockedAppsEditor
        visible={appsEditorOpen}
        initial={focusPrefs.blockedAppIds}
        onClose={() => setAppsEditorOpen(false)}
        onSubmit={handleAppsSave}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// TimeRow — one tappable block-time row
// ─────────────────────────────────────────────────────────────────

function TimeRow({
  session,
  isLast,
  onTap,
  onLongPress,
  onToggle,
}: {
  session: StudySession;
  isLast: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onTap}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit time at ${formatReminderTime(session.time)}`}
      accessibilityHint="Long-press to delete"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 4,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontFamily: session.enabled
                ? "PlusJakartaSans_700Bold"
                : "PlusJakartaSans_600SemiBold",
              fontSize: 22,
              lineHeight: 26,
              letterSpacing: -0.4,
              // Disabled rows render in the muted ink so the row
              // visually demotes itself — matches iOS Alarms.
              color: session.enabled ? colors.ink : colors.inkMuted,
            }}
            numberOfLines={1}
          >
            {formatReminderTime(session.time)}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              color: colors.inkMuted,
              fontSize: 13,
              lineHeight: 18,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {summarizeDays(session.daysOfWeek)}
          </Text>
        </View>
        <Switch
          value={session.enabled}
          onValueChange={onToggle}
          ios_backgroundColor={colors.border as string}
          accessibilityLabel={`Toggle block at ${formatReminderTime(session.time)}`}
        />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Glyphs
// ─────────────────────────────────────────────────────────────────

const ICON_BASE = {
  strokeWidth: 1.8,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BackChevron({ stroke }: { stroke: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={stroke} {...ICON_BASE} />
    </Svg>
  );
}

function LockGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3"
        stroke={stroke}
        {...ICON_BASE}
      />
    </Svg>
  );
}

function ClockGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={stroke}
        {...ICON_BASE}
      />
      <Path d="M12 7v5l3 2" stroke={stroke} {...ICON_BASE} />
    </Svg>
  );
}

function PlusGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function BellGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 17h12l-1.5-2V10a4.5 4.5 0 00-9 0v5L6 17z"
        stroke={stroke}
        {...ICON_BASE}
      />
      <Path d="M10 20a2 2 0 004 0" stroke={stroke} {...ICON_BASE} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Default name for a freshly-created block — used as the
 *  notification body and the row's accessibility label, never as a
 *  visible row title (the row leads with the time). The friendly
 *  default avoids surfacing "Untitled" anywhere. */
function defaultBlockName(time: { hour: number; minute: number }): string {
  const h = time.hour;
  if (h < 5) return "Late Block";
  if (h < 12) return "Morning Block";
  if (h < 17) return "Afternoon Block";
  if (h < 21) return "Evening Block";
  return "Night Block";
}

function summarizeDays(days: ReadonlyArray<number>): string {
  if (days.length === 0) return "Never";
  if (days.length === 7) return "Every day";
  const sorted = [...days].sort();
  const same = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  if (same(sorted, [1, 2, 3, 4, 5])) return "Weekdays";
  if (same(sorted, [0, 6])) return "Weekends";
  const shorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return sorted.map((d) => shorts[d]).join(", ");
}

function countEnabled(sessions: ReadonlyArray<StudySession>): number {
  return sessions.filter((s) => s.enabled).length;
}
