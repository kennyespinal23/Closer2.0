import { useState, useCallback, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { FamilyActivityAppsEditor } from "@/components/FamilyActivityAppsEditor";
import { SFSymbol } from "@/components/Symbol";
import { BrandGlyph } from "@/components/BrandGlyph";
import {
  SettingsScaffold,
  SettingsSection,
  SettingsLinkRow,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { ShieldOverlay } from "@/components/ShieldOverlay";
import {
  formatScreenTimeSelectionSummary,
  getScreenTimeSelectionSummary,
  isShieldActiveCapable,
  isShieldSupported,
  SOCIAL_APPS,
  type SocialAppId,
} from "@/lib/focus";
import {
  applyScreenTimeConfiguration,
  configureCloserShieldUIForPath,
  openNativeAppPickerWithAuth,
  primeScreenTimeAuthorizationFromGesture,
  resolveShieldPrimaryPath,
  waitForScreenTimeAuthorizationResult,
} from "@/lib/deviceActivityShield";
import { syncAllScheduledAppBlocks } from "@/lib/scheduledAppBlocks";
import type { ShieldPrimaryPath } from "@/lib/shieldCopy";
import { useStudySessions } from "@/state/studySessions";
import { useFocus } from "@/state/focus";
import { useColors } from "@/state/theme";

/**
 * Focus mode preferences.
 *
 * Layout:
 *   1. Intro paragraph — sets the tone of "this is a commitment,
 *      not a parental control."
 *   2. Master toggle — enables / disables the focus affordance on
 *      the sermon intro screen.
 *   3. Apps section — checkable list of social/entertainment apps
 *      to include in the shield list. Defaults to the extended
 *      seven; user can pare back.
 *   4. Behavior section — small handful of session-level switches
 *      (currently just "Start without asking").
 *   5. Footer caption — explains the Phase 1 honor-mode reality so
 *      the user isn't misled into thinking apps are actually being
 *      blocked. Swapped automatically when isShieldSupported() flips.
 */
export default function FocusSettingsScreen() {
  const colors = useColors();
  const {
    prefs,
    setEnabled,
    toggleAppBlocked,
    setAutoStart,
  } = useFocus();
  const { sessions } = useStudySessions();

  const supported = isShieldSupported();
  const shieldReady = isShieldActiveCapable();
  const screenTimeSummary = supported ? getScreenTimeSelectionSummary() : null;

  const [nativeAppsEditorOpen, setNativeAppsEditorOpen] = useState(false);
  const [selectionRevision, setSelectionRevision] = useState(0);
  void selectionRevision;
  // or null when no preview is open. Driven by the "Preview"
  // button on each app row + the dual-path demos below.
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<ShieldPrimaryPath>("manual");
  const [livePath, setLivePath] = useState<ShieldPrimaryPath>("manual");

  useEffect(() => {
    void resolveShieldPrimaryPath().then(setLivePath);
  }, []);

  const openPreview = useCallback((appId: string, path: ShieldPrimaryPath) => {
    setPreviewPath(path);
    setPreviewAppId(appId);
    // Keep native shield UserDefaults aligned with the path we're demoting.
    void configureCloserShieldUIForPath(path);
  }, []);

  const openNativePicker = useCallback(() => {
    openNativeAppPickerWithAuth({
      onAuthorized: () => setNativeAppsEditorOpen(true),
    });
    void waitForScreenTimeAuthorizationResult().then(() => {
      setSelectionRevision((n) => n + 1);
    });
  }, []);

  return (
    <SettingsScaffold title="Focus mode">
      {/* Quiet preamble — establishes WHY this feature exists. The
          tone matches the rest of the app: invitations, not nags. */}
      <View className="px-6 pt-2 pb-2">
        <Text
          className="text-ink-muted text-[14px] leading-[21px]"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          When you begin a sermon, Closer can quiet the apps that
          usually pull your attention away — so the next few minutes
          stay with the scripture.
        </Text>
      </View>

      <SettingsSection
        title="Session"
        footer={
          shieldReady
            ? "When focus mode is on, the apps you chose in Screen Time are blocked from the moment you tap Begin until you finish."
            : supported
              ? "Allow Screen Time and choose apps to block below. Until then, focus sessions run as an honor-mode commitment."
              : "Right now this is an honor-mode commitment — the apps aren't physically blocked. Install a Closer build with Screen Time extensions to enable real blocking."
        }
      >
        <SettingsToggleRow
          icon={<ShieldIcon stroke={colors.ink} />}
          label="Focus mode"
          sublabel={
            prefs.enabled
              ? "Offered when you begin a sermon"
              : "Off — sermons begin as normal"
          }
          value={prefs.enabled}
          onValueChange={setEnabled}
          showDivider
        />
        <SettingsToggleRow
          icon={<BoltIcon stroke={colors.ink} />}
          label="Start without asking"
          sublabel="Skip the inline prompt — focus begins the moment you tap Begin"
          value={prefs.autoStart}
          onValueChange={setAutoStart}
        />
      </SettingsSection>

      {supported ? (
        <SettingsSection
          title="Screen Time"
          footer={formatScreenTimeSelectionSummary(screenTimeSummary)}
        >
          <SettingsLinkRow
            icon={
              <SFSymbol
                name="hourglass"
                size={14}
                color={colors.ink}
                weight="semibold"
              />
            }
            label={
              screenTimeSummary
                ? "Update blocked apps"
                : "Allow Screen Time & choose apps"
            }
            sublabel={
              shieldReady
                ? "Real OS blocking is ready."
                : "Required before apps can be physically blocked."
            }
            onPress={() => {
              primeScreenTimeAuthorizationFromGesture();
              openNativePicker();
            }}
          />
        </SettingsSection>
      ) : (
        <SettingsSection
          title="Apps to quiet"
          footer="Use the switch to include or exclude. Tap Preview shield to see the quiet overlay."
        >
          {SOCIAL_APPS.map((app, i) => {
            const checked = prefs.blockedAppIds.includes(app.id);
            return (
              <View key={app.id}>
                <SettingsToggleRow
                  icon={<BrandGlyph appId={app.id} size="sm" />}
                  label={app.name}
                  sublabel={`“${app.quietMessage}”`}
                  value={checked}
                  onValueChange={(next) => {
                    if (next !== checked) toggleAppBlocked(app.id);
                  }}
                  showDivider={false}
                />
                <SettingsLinkRow
                  label="Preview shield"
                  sublabel={`See the ${app.name} quiet screen`}
                  onPress={() => openPreview(app.id, livePath)}
                  showDivider={i < SOCIAL_APPS.length - 1}
                />
              </View>
            );
          })}
        </SettingsSection>
      )}

      {/* Dual-path shield demos — always available so we can verify
          notification-granted vs manual fallback without flipping
          OS permission mid-session. */}
      <SettingsSection
        title="Shield return"
        footer={
          livePath === "notify"
            ? "Notifications are on — the live shield fires a banner that opens today's reading when tapped. Preview both paths below."
            : "Notifications are off — the live shield tells the user to open Closer themselves. Preview both paths below."
        }
      >
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="bell.badge.fill"
              size={14}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Preview: notification path"
          onPress={() => openPreview("instagram", "notify")}
          showDivider
        />
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="arrow.up.forward.app"
              size={14}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Preview: open Closer yourself"
          onPress={() => openPreview("instagram", "manual")}
        />
      </SettingsSection>

      {/* Dev tools — gated behind __DEV__ so it strips from prod.
          The cycler runs through SOCIAL_APPS in order so a reviewer
          can step through every quiet message in a few seconds
          without scrolling back to each row. */}
      {__DEV__ && (
        <SettingsSection
          title="Dev"
          footer="Cycles through each app's quiet message overlay so you can review the copy without starting a real focus session."
        >
          <Pressable
            onPress={() => {
              const currentIdx = previewAppId
                ? SOCIAL_APPS.findIndex((a) => a.id === previewAppId)
                : -1;
              const nextIdx = (currentIdx + 1) % SOCIAL_APPS.length;
              openPreview(SOCIAL_APPS[nextIdx]!.id, previewPath);
            }}
            className="px-4 py-3.5 flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ShieldIcon stroke={colors.ink} />
            <Text
              className="text-ink text-[14px] ml-2.5 flex-1"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Preview next shield
            </Text>
            <Text
              className="text-ink-muted text-[12px] tracking-[1px] uppercase"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              {previewAppId
                ? `${
                    SOCIAL_APPS.findIndex((a) => a.id === previewAppId) + 1
                  } / ${SOCIAL_APPS.length}`
                : `0 / ${SOCIAL_APPS.length}`}
            </Text>
          </Pressable>
        </SettingsSection>
      )}

      {/* A small grounding line that doubles as the screen's mission
          statement. Same rhythm as the notifications screen footer. */}
      <View className="px-6 mt-6">
        <Text
          className="text-ink-muted text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          A few minutes of stillness, before the noise.
        </Text>
      </View>

      {/* ShieldOverlay — mounted at the screen root so the modal can
          cover the navigation chrome. Visibility is driven entirely
          by `previewAppId`; null hides the overlay. */}
      <ShieldOverlay
        appId={previewAppId ?? "instagram"}
        visible={previewAppId !== null}
        primaryPath={previewPath}
        onClose={() => setPreviewAppId(null)}
      />

      <FamilyActivityAppsEditor
        visible={supported && nativeAppsEditorOpen}
        onClose={() => setNativeAppsEditorOpen(false)}
        onSaved={() => {
          applyScreenTimeConfiguration();
          setEnabled(true);
          setSelectionRevision((n) => n + 1);
          void syncAllScheduledAppBlocks(sessions).catch(() => {});
        }}
      />
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function ShieldIcon({ stroke }: { stroke: string }) {
  return <SFSymbol name="shield" size={14} color={stroke} weight="medium" />;
}

function BoltIcon({ stroke }: { stroke: string }) {
  return <SFSymbol name="bolt" size={14} color={stroke} weight="medium" />;
}

// Re-export the type so any future caller importing from this file
// (e.g. a focus settings index) has access without an extra hop.
export type { SocialAppId };
