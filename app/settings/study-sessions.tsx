import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BlockedAppsEditor } from "@/components/BlockedAppsEditor";
import { BrandGlyph } from "@/components/BrandGlyph";
import { FamilyActivityAppsEditor } from "@/components/FamilyActivityAppsEditor";
import { ScreenTimePermissionRow } from "@/components/ScreenTimePermissionRow";
import { TimeBlockEditor } from "@/components/TimeBlockEditor";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  findSocialApp,
  formatScreenTimeSelectionSummary,
  getScreenTimeSelectionSummary,
  isShieldSupported,
  type SocialAppId,
} from "@/lib/focus";
import { syncAllScheduledAppBlocks } from "@/lib/scheduledAppBlocks";
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
  const [nativeAppsEditorOpen, setNativeAppsEditorOpen] = useState(false);
  const [selectionRevision, setSelectionRevision] = useState(0);

  const nativeShield = isShieldSupported();

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
  const screenTimeSummary = nativeShield
    ? getScreenTimeSelectionSummary()
    : null;
  const screenTimeSummaryLabel = formatScreenTimeSelectionSummary(
    screenTimeSummary,
  );
  // selectionRevision bumps after native picker saves so summary re-reads.
  void selectionRevision;

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
          paddingHorizontal: 16,
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
              fontFamily: "System",
              fontWeight: "700",
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
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 15,
              lineHeight: 21,
              marginTop: 4,
            }}
          >
            Pick the apps you want quieted and the times to silence them.
          </Text>
        </View>

        {/* Notification permission row — ALWAYS rendered, with
            state-specific iconography, copy, and CTA so the user
            can read current permission state in one glance per
            HIG's "Visibility of system state". The previous
            version hid the row entirely when permission was
            granted, which left the user with no confirmation
            that block reminders were wired up at all.
            
            Three states are surfaced:
              • GRANTED      — green check + "Notifications
                               Enabled" + supporting confirmation
                               line; no CTA (nothing to do).
              • UNDETERMINED — bell + "Allow Notifications" +
                               "Required for block reminders" +
                               "Allow" CTA (triggers OS prompt).
              • DENIED       — bell-with-slash + "Notifications
                               Blocked" + "Open Settings to allow
                               reminders" + "Settings" CTA
                               (deep-links to system Settings).
            
            Each state uses a distinct icon-well tint so the row's
            disposition reads at a glance even before the headline
            is parsed — green for resolved, amber for blocked,
            neutral for pending. */}
        {(() => {
          const isGranted = permission === "granted";
          const isDenied = permission === "denied";
          let iconBg: string;
          let iconStroke: string;
          let title: string;
          let subtitle: string;
          let ctaLabel: string | null;
          let GlyphComp: React.ComponentType<{ stroke: string }>;
          let accessibilityState: string;

          if (isGranted) {
            // Soft green well + green stroke. The check inside
            // is the unambiguous "system on" affordance Apple
            // uses across iOS (Settings → Apple ID → connected
            // accounts, Health → permissions, etc).
            iconBg = "rgba(34, 197, 94, 0.16)";
            iconStroke = "#22C55E";
            title = "Notifications Enabled";
            subtitle = "Block reminders will come through.";
            ctaLabel = null;
            GlyphComp = CheckGlyph;
            accessibilityState = "Notifications are enabled";
          } else if (isDenied) {
            // Soft amber well + amber stroke. Amber rather than
            // red because the situation is "needs attention",
            // not "error" — the user can still resolve it from
            // Settings; nothing is broken.
            iconBg = "rgba(245, 158, 11, 0.16)";
            iconStroke = "#F59E0B";
            title = "Notifications Blocked";
            subtitle = "Open Settings to allow reminders.";
            ctaLabel = "Settings";
            GlyphComp = BellSlashGlyph;
            accessibilityState = "Notifications are blocked";
          } else {
            // Neutral pending state — soft white tint instead of
            // `colors.accentSoft` because that token collapses
            // to the same hex as the card surface in dark mode
            // ("#1C1C1E"), which made the icon well visually
            // disappear. A 12% white wash gives the well a
            // discernible shape in dark while staying low-
            // saturation enough to read as quiet pending UI
            // (not an alarm).
            iconBg = "rgba(255, 255, 255, 0.12)";
            iconStroke = colors.ink as string;
            title = "Allow Notifications";
            subtitle = "Required for block reminders.";
            ctaLabel = "Allow";
            GlyphComp = BellGlyph;
            accessibilityState = "Notification permission not yet granted";
          }

          return (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View
                accessibilityRole="summary"
                accessibilityLabel={`${title}. ${accessibilityState}.`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
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
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <GlyphComp stroke={iconStroke} />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "700",
                      color: colors.ink,
                      fontSize: 14,
                    }}
                  >
                    {title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "400",
                      color: colors.inkMuted,
                      fontSize: 12,
                      lineHeight: 17,
                      marginTop: 4,
                    }}
                  >
                    {subtitle}
                  </Text>
                </View>
                {ctaLabel ? (
                  // Trailing CTA pill. Visual surface lives on
                  // an INNER static View — NativeWind/Pressable
                  // interop on this codebase silently drops
                  // non-className backgroundColor/borderRadius
                  // from a function-style `style` return, which
                  // earlier rendered the "Allow" button as
                  // black text floating on the dark card with
                  // no visible pill. Static inner View
                  // sidesteps the interop dance entirely.
                  <Pressable
                    onPress={handleRequestPermission}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={ctaLabel}
                    style={({ pressed }) => ({
                      opacity: pressed || busy ? 0.7 : 1,
                    })}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: colors.ink,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "System",
                          fontWeight: "700",
                          fontSize: 12,
                          color: colors.primaryFg,
                        }}
                      >
                        {ctaLabel}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })()}

        <ScreenTimePermissionRow
          onOpenAppPicker={() => {
            haptics.soft();
            setNativeAppsEditorOpen(true);
          }}
        />

        {/* ─── Card 1: Blocked Apps ─────────────────────────────
            A single rounded card with: a small section header
            row (lock icon + "Blocked Apps" + count chip on the
            right), a horizontal preview of brand glyphs for the
            currently-selected apps, and a primary CTA pill at
            the bottom that opens the apps picker.
            
            Empty state: no glyph preview, the CTA reads "Pick
            apps to block". */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View
            style={{
              borderRadius: 22,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 16,
            }}
          >
            {/* Header — lock icon + "Blocked Apps" title with a
                meaningful count subtitle below. The previous
                version surfaced the count as an isolated "12"
                chip in the corner; per HIG (Clarity) numbers
                should have context, so we move the count into
                a readable subtitle ("{n} selected") right
                beneath the section title. Empty state replaces
                the count with the descriptive prompt copy. */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
              <View style={{ marginTop: 2 }}>
                <LockGlyph stroke={colors.ink} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    color: colors.ink,
                    fontSize: 16,
                    letterSpacing: -0.3,
                  }}
                  accessibilityRole="header"
                >
                  Blocked Apps
                </Text>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "400",
                    color: colors.inkMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 2,
                  }}
                >
                  {nativeShield
                    ? screenTimeSummaryLabel
                    : blockedApps.length > 0
                      ? `${blockedApps.length} ${blockedApps.length === 1 ? "app" : "apps"} selected`
                      : "Pick the apps you want silenced during every block."}
                </Text>
              </View>
            </View>

            {nativeShield ? null : blockedApps.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: 4,
                  gap: 8,
                }}
                style={{ marginBottom: 16 }}
              >
                {blockedApps.map((app) => (
                  <BrandGlyph key={app.id} appId={app.id} size="md" />
                ))}
              </ScrollView>
            ) : null}

            {/* CTA pill — chrome held on the inner View so the
                NativeWind/Pressable style-function interop can't
                drop the backgroundColor. Pressable just owns the
                tap + opacity feedback; the inner View paints the
                blue pill. */}
            <Pressable
              onPress={() => {
                haptics.soft();
                if (nativeShield) {
                  setNativeAppsEditorOpen(true);
                } else {
                  setAppsEditorOpen(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={
                nativeShield
                  ? screenTimeSummary
                    ? "Update blocked apps"
                    : "Choose apps to block"
                  : blockedApps.length > 0
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
                  backgroundColor: CLOSER_ACCENT,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                <LockGlyph stroke="#FFFFFF" />
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    color: "#FFFFFF",
                    fontSize: 14.5,
                    letterSpacing: 0.2,
                    marginLeft: 8,
                  }}
                >
                  {nativeShield
                    ? screenTimeSummary
                      ? "Update blocked apps"
                      : "Choose apps to block"
                    : blockedApps.length > 0
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
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
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
            {/* Header — clock icon + "Block Time" title with a
                meaningful subtitle below ("No times scheduled"
                vs "Active at {time}"). When times exist, a "+"
                affordance in the corner opens the add editor. */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
              <View style={{ marginTop: 2 }}>
                <ClockGlyph stroke={colors.ink} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    color: colors.ink,
                    fontSize: 16,
                    letterSpacing: -0.3,
                  }}
                  accessibilityRole="header"
                >
                  Block Time
                </Text>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "400",
                    color: colors.inkMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 2,
                  }}
                >
                  {sessions.length === 0
                    ? "No times scheduled."
                    : "Your apps will be quieted at this time."}
                </Text>
              </View>
              {sessions.length > 0 ? (
                <Pressable
                  onPress={() => {
                    haptics.soft();
                    setTimeTarget("new");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add Block Time"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed
                      ? "rgba(252, 131, 68, 0.16)"
                      : "rgba(252, 131, 68, 0.12)",
                  })}
                >
                  <PlusGlyph stroke={CLOSER_ACCENT} />
                </Pressable>
              ) : null}
            </View>

            {sessions.length === 0 ? (
              // Single primary CTA in empty state. Paints with
              // the same iOS-system-blue as the Blocked Apps
              // "Pick apps to block" pill so the two empty-state
              // actions speak the same visual language and the
              // user understands both are the screen's primary
              // setup steps. The previous hairline-border button
              // read as a tertiary control next to the louder
              // Apps CTA above and so didn't pull as one of the
              // page's two main commitments.
              <Pressable
                onPress={() => {
                  haptics.soft();
                  setTimeTarget("new");
                }}
                accessibilityRole="button"
                accessibilityLabel="Add Block Time"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  style={{
                    borderRadius: 14,
                    backgroundColor: CLOSER_ACCENT,
                    paddingVertical: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  <PlusGlyph stroke="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "700",
                      color: "#FFFFFF",
                      fontSize: 14.5,
                      letterSpacing: 0.2,
                      marginLeft: 6,
                    }}
                  >
                    Add Block Time
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={{ marginTop: 4 }}>
                {sessions.map((session, i) => (
                  <SwipeableTimeRow
                    key={session.id}
                    session={session}
                    isLast={i === sessions.length - 1}
                    onTap={() => setTimeTarget(session.id)}
                    onDelete={() => handleDelete(session)}
                    onToggle={() => toggleSession(session.id)}
                  />
                ))}
                <Pressable
                  onPress={() => {
                    haptics.soft();
                    setTimeTarget("new");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add Block Time"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    marginTop: 8,
                  })}
                >
                  <View
                    style={{
                      borderRadius: 14,
                      backgroundColor: CLOSER_ACCENT,
                      paddingVertical: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    <PlusGlyph stroke="#FFFFFF" />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontWeight: "700",
                        color: "#FFFFFF",
                        fontSize: 14.5,
                        letterSpacing: 0.2,
                        marginLeft: 6,
                      }}
                    >
                      Add Block Time
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}
          </View>

          {sessions.length > 0 ? (
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "400",
                color: colors.inkSubtle,
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
                marginTop: 16,
                paddingHorizontal: 16,
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
        visible={!nativeShield && appsEditorOpen}
        initial={focusPrefs.blockedAppIds}
        onClose={() => setAppsEditorOpen(false)}
        onSubmit={handleAppsSave}
      />

      <FamilyActivityAppsEditor
        visible={nativeShield && nativeAppsEditorOpen}
        onClose={() => setNativeAppsEditorOpen(false)}
        onSaved={() => {
          setSelectionRevision((n) => n + 1);
          void syncAllScheduledAppBlocks(sessions).catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// SwipeableTimeRow — swipe-left to reveal delete
// ─────────────────────────────────────────────────────────────────

function SwipeableTimeRow({
  session,
  isLast,
  onTap,
  onDelete,
  onToggle,
}: {
  session: StudySession;
  isLast: boolean;
  onTap: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={{ width: 80, transform: [{ translateX }] }}>
        <Pressable
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete block time"
          style={{
            flex: 1,
            backgroundColor: "#FF3B30",
            alignItems: "center",
            justifyContent: "center",
            borderTopRightRadius: isLast ? 12 : 0,
            borderBottomRightRadius: isLast ? 12 : 0,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              color: "#FFFFFF",
              fontSize: 15,
            }}
          >
            Delete
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TimeRow
        session={session}
        isLast={isLast}
        onTap={onTap}
        onToggle={onToggle}
      />
    </Swipeable>
  );
}

// ─────────────────────────────────────────────────────────────────
// TimeRow — one tappable block-time row
// ─────────────────────────────────────────────────────────────────

function TimeRow({
  session,
  isLast,
  onTap,
  onToggle,
}: {
  session: StudySession;
  isLast: boolean;
  onTap: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={`Edit time at ${formatReminderTime(session.time)}`}
      accessibilityHint="Swipe left to delete"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 4,
          backgroundColor: colors.surface,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: session.enabled ? "700" : "600",
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
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 13,
              lineHeight: 18,
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {summarizeDays(session.daysOfWeek)}
          </Text>
        </View>
        <Switch
          value={session.enabled}
          onValueChange={() => {
            haptics.tick();
            onToggle();
          }}
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

/** Bell with a slash through it — denied-permission glyph for
 *  the notification permission row's "Notifications Blocked"
 *  state. Same bell silhouette as `BellGlyph` so the two states
 *  read as variants of one another rather than two unrelated
 *  icons. The slash is a separate path drawn corner-to-corner
 *  so it stays crisp at small sizes. */
function BellSlashGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 17h12l-1.5-2V10a4.5 4.5 0 00-9 0v5L6 17z"
        stroke={stroke}
        {...ICON_BASE}
      />
      <Path d="M10 20a2 2 0 004 0" stroke={stroke} {...ICON_BASE} />
      <Path d="M4 4l16 16" stroke={stroke} {...ICON_BASE} />
    </Svg>
  );
}

/** Check mark — granted-permission affirmation glyph. Pure
 *  bare-check stroke (no surrounding circle) because the icon
 *  is already nested inside a green-tinted 36×36 rounded
 *  "well" which provides the chrome. Lines up visually with
 *  the other 16pt stroked glyphs in this file. */
function CheckGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5L20 7" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
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
