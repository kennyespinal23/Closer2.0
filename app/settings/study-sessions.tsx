import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Switch, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { StudySessionEditor } from "@/components/StudySessionEditor";
import {
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import {
  fireTestStudySessionNow,
  formatReminderTime,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from "@/lib/notifications";
import {
  formatDaysOfWeek,
  useStudySessions,
  type StudySession,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Bible-study sessions — list + create/edit/delete UI.
 *
 * Layout:
 *   1. Quiet preamble explaining what these sessions DO (schedule a
 *      notification + offer to start focus mode)
 *   2. Permission state — if undetermined / denied we surface a CTA
 *      to fix it before any session can fire
 *   3. The list of sessions — empty state OR a card per session with
 *      time, days, and an enabled switch
 *   4. "Add a session" tappable row at the bottom
 *
 * Adding / editing uses a shared bottom-sheet editor (see
 * components/StudySessionEditor.tsx). The list owns no editor state
 * of its own — it just holds the id of the session currently being
 * edited (or "new" for a fresh draft) and passes that to the editor.
 */
export default function StudySessionsScreen() {
  const colors = useColors();
  const { sessions, addSession, updateSession, removeSession, toggleSession } =
    useStudySessions();
  const [permission, setPermission] =
    useState<NotificationPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);
  // Editor target: null = closed, "new" = new draft, "<id>" = editing.
  // Single piece of state keeps the open/close flow trivially correct.
  const [editorTarget, setEditorTarget] = useState<null | "new" | string>(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationPermission().then((p) => {
      if (!cancelled) setPermission(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Permission CTA ──────────────────────────────────────────────

  const handleRequestPermission = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const status = await requestNotificationPermission();
      setPermission(status);
      // If the user permanently denied earlier (canAskAgain === false),
      // the request resolves immediately as "denied" — gently nudge
      // them to Settings, since the OS won't show our prompt again.
      if (status === "denied") {
        Alert.alert(
          "Notifications are off",
          "Open Settings to allow Closer to send your study reminders.",
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

  // ─── Delete confirm ──────────────────────────────────────────────

  const handleDelete = useCallback(
    (session: StudySession) => {
      // System routines (seeded by onboarding) can't be deleted from
      // here — only paused via the row toggle. Removing them would
      // leave the user with a Practice tab they have to manually
      // re-seed if they ever change their mind. The soft-off path is
      // friendlier and reversible. Surface the why so the user
      // doesn't just see a "nothing happened" non-response.
      if (session.source === "system") {
        Alert.alert(
          "Set up by Closer",
          `"${session.name || "This session"}" was set up during your welcome. Turn it off with the switch to pause it — your notifications will stop and nothing will fire on the days you've chosen.`,
          [{ text: "Got it", style: "default" }],
        );
        return;
      }
      Alert.alert(
        "Delete this session?",
        `"${session.name || "Unnamed study"}" will be removed and its reminders cancelled.`,
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

  // The editor target's session (if we're editing an existing one).
  const editingSession =
    editorTarget && editorTarget !== "new"
      ? sessions.find((s) => s.id === editorTarget)
      : undefined;

  return (
    <SettingsScaffold title="Study Sessions">
      {/* Preamble — explains the feature without selling it. */}
      <View className="px-6 pt-2 pb-2">
        <Text
          className="text-ink-muted text-[14px] leading-[21px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          Schedule recurring times to step into the Word. When the
          time comes, Closer sends a quiet notification and offers
          to start Focus mode so you can read without distractions.
        </Text>
      </View>

      {/* Permission CTA — only shown when we'd actually fail to
          fire a notification. Hidden once permission is granted so
          the screen stays uncluttered for the common case. */}
      {permission !== "granted" && (
        <View className="px-5 mt-6">
          <View
            className="rounded-2xl px-4 py-4 flex-row items-center"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <BellIcon stroke={colors.ink} />
            </View>
            <View className="flex-1 pr-2">
              <Text
                className="text-ink text-[14px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Allow notifications
              </Text>
              <Text
                className="text-ink-muted text-[12px] mt-0.5 leading-[17px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                Required for study session reminders.
              </Text>
            </View>
            <Pressable
              onPress={handleRequestPermission}
              disabled={busy}
              className="rounded-full px-3 py-2"
              style={({ pressed }) => ({
                backgroundColor: colors.ink,
                opacity: pressed || busy ? 0.7 : 1,
              })}
            >
              <Text
                className="text-[12px]"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.primaryFg,
                }}
              >
                {permission === "denied" ? "Settings" : "Allow"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Sessions list — empty state or row stack */}
      <SettingsSection
        title="Your sessions"
        footer={
          sessions.length === 0
            ? "Create a session to set a recurring time for Scripture."
            : "Tap a session to edit. Toggle off to pause without losing it."
        }
      >
        {sessions.length === 0 ? (
          <EmptyState onAdd={() => setEditorTarget("new")} />
        ) : (
          sessions.map((session, i) => (
            <SessionRow
              key={session.id}
              session={session}
              showDivider={i < sessions.length - 1}
              onTap={() => setEditorTarget(session.id)}
              onToggle={() => toggleSession(session.id)}
              onDelete={() => handleDelete(session)}
            />
          ))
        )}
      </SettingsSection>

      {/* Add session row — separate section so the touch target
          reads as its own action, not "another session row." */}
      <View className="px-5 mt-7">
        <Pressable
          onPress={() => setEditorTarget("new")}
          accessibilityRole="button"
          accessibilityLabel="Add a new study session"
          className="rounded-2xl border border-border bg-surface overflow-hidden"
        >
          <View className="flex-row items-center px-4 py-3.5">
            <View
              className="w-8 h-8 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <PlusIcon stroke={colors.ink} />
            </View>
            <Text
              className="flex-1 text-ink text-[14.5px]"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              Add a session
            </Text>
            <ChevronIcon stroke={colors.inkSubtle} />
          </View>
        </Pressable>
      </View>

      {/* Dev tools — quick "test fire" for the most recently edited
          session so we can verify the deep link without waiting for
          the schedule trigger. Hidden in release builds. */}
      {__DEV__ && sessions.length > 0 && (
        <View className="px-5 mt-6">
          <Pressable
            onPress={async () => {
              const target = sessions[0];
              if (!target) return;
              await fireTestStudySessionNow({
                id: target.id,
                name: target.name,
                time: target.time,
                daysOfWeek: target.daysOfWeek,
                enabled: target.enabled,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Fire test notification"
            className="rounded-2xl border border-border overflow-hidden"
          >
            <View className="px-4 py-3.5">
              <Text
                className="text-ink-muted text-[12px] tracking-[1.5px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Dev · Fire test notification
              </Text>
              <Text
                className="text-ink-subtle text-[11.5px] mt-1"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                Sends “{sessions[0].name || "first session"}” in 2 seconds.
                Background the app to see the banner.
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Editor modal — null target means closed.
          We pass a `key` derived from the target so React fully
          remounts the editor when switching between sessions, which
          resets its internal draft state cleanly. */}
      <StudySessionEditor
        key={editorTarget ?? "closed"}
        visible={editorTarget !== null}
        existing={editingSession}
        onClose={() => setEditorTarget(null)}
        onSubmit={async (draft) => {
          if (editorTarget === "new") {
            await addSession(draft);
          } else if (editorTarget) {
            await updateSession(editorTarget, draft);
          }
          setEditorTarget(null);
        }}
      />
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row — one tappable session card
// ─────────────────────────────────────────────────────────────────

function SessionRow({
  session,
  showDivider,
  onTap,
  onToggle,
  onDelete,
}: {
  session: StudySession;
  showDivider: boolean;
  onTap: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const isSystem = session.source === "system";
  return (
    <View>
      <Pressable
        onPress={onTap}
        onLongPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${session.name || "study session"}`}
        accessibilityHint={
          isSystem
            ? "Long-press to learn why this one can't be deleted"
            : "Long-press to delete"
        }
      >
        <View className="flex-row items-center px-4 py-3.5">
          {/* Icon chip — soft accent square, same chip language as
              other settings rows. Book glyph signals "scripture."
              System routines get a slightly warmer wash so they
              read as "set up by Closer" without needing a badge
              in this denser settings layout. */}
          <View
            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            style={{
              backgroundColor: isSystem
                ? withAlpha(colors.accent, 0.14)
                : colors.accentSoft,
            }}
          >
            <BookGlyph stroke={isSystem ? colors.accent : colors.ink} />
          </View>
          <View className="flex-1 pr-2">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text
                className="text-ink text-[15px]"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {session.name || "Unnamed study"}
              </Text>
              {isSystem && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 1.5,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.accent, 0.16),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 9.5,
                      color: colors.accent,
                      letterSpacing: 0.6,
                    }}
                  >
                    CLOSER
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-ink-muted text-[12.5px] mt-0.5"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              {formatReminderTime(session.time)}
              {"  ·  "}
              {formatDaysOfWeek(session.daysOfWeek)}
            </Text>
          </View>
          {/* Native switch sits at the right — flipping it off
              pauses the session without losing its config. Trapped
              against the parent press via onPress: false (Switch
              swallows its own taps), so the row's onTap fires only
              when the user taps elsewhere. */}
          <Switch
            value={session.enabled}
            onValueChange={onToggle}
            trackColor={{
              false: withAlpha(colors.ink, 0.1),
              true: "#3D8B6A",
            }}
            thumbColor="#F4F4F5"
            ios_backgroundColor={withAlpha(colors.ink, 0.08)}
          />
        </View>
      </Pressable>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// EmptyState — zero-session card with a single inline CTA
// ─────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const colors = useColors();
  return (
    <View className="px-5 py-7 items-center">
      <View
        className="w-12 h-12 rounded-full items-center justify-center mb-3.5"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <BookGlyph stroke={colors.inkMuted} size={20} />
      </View>
      <Text
        className="text-ink text-[15px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        No study sessions yet
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] text-center mt-1 leading-[18px] px-3"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Pick a time you can keep and a few days that fit your
        rhythm. We&apos;ll meet you there.
      </Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add your first session"
        className="mt-4 rounded-full px-4 py-2"
        style={({ pressed }) => ({
          backgroundColor: colors.ink,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          className="text-[12.5px]"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.primaryFg,
          }}
        >
          Create your first session
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function BookGlyph({
  stroke,
  size = 16,
}: {
  stroke: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M6 3v18"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BellIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 17h12l-1.5-2V10a4.5 4.5 0 00-9 0v5L6 17z"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M10 20a2 2 0 004 0"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
