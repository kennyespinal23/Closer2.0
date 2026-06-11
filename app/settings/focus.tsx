import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BrandGlyph } from "@/components/BrandGlyph";
import {
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { ShieldOverlay } from "@/components/ShieldOverlay";
import {
  isShieldSupported,
  SOCIAL_APPS,
  type SocialApp,
  type SocialAppId,
} from "@/lib/focus";
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

  const supported = isShieldSupported();

  // The id of the app whose shield is currently being previewed,
  // or null when no preview is open. Driven by the "Preview"
  // button on each app row + the dev "Preview every shield"
  // cycler at the bottom.
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);

  return (
    <SettingsScaffold title="Focus mode">
      {/* Quiet preamble — establishes WHY this feature exists. The
          tone matches the rest of the app: invitations, not nags. */}
      <View className="px-6 pt-2 pb-2">
        <Text
          className="text-ink-muted text-[14px] leading-[21px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          When you begin a sermon, Closer can quiet the apps that
          usually pull your attention away — so the next few minutes
          stay with the scripture.
        </Text>
      </View>

      <SettingsSection
        title="Session"
        footer={
          supported
            ? "When focus mode is on, selected apps are blocked from the moment you tap Begin until you finish the sermon."
            : "Right now this is an honor-mode commitment — the apps aren't physically blocked. A future update will add real OS-level blocking once Apple's Screen Time permissions are approved."
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

      <SettingsSection
        title="Apps to quiet"
        footer="Tap the toggle to include or exclude. Tap the message preview to see the quiet text the user will encounter during a session."
      >
        {SOCIAL_APPS.map((app, i) => {
          const checked = prefs.blockedAppIds.includes(app.id);
          return (
            <AppRow
              key={app.id}
              app={app}
              checked={checked}
              onToggle={() => toggleAppBlocked(app.id)}
              onPreview={() => setPreviewAppId(app.id)}
              showDivider={i < SOCIAL_APPS.length - 1}
            />
          );
        })}
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
              setPreviewAppId(SOCIAL_APPS[nextIdx]!.id);
            }}
            className="px-4 py-3.5 flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ShieldIcon stroke={colors.ink} />
            <Text
              className="text-ink text-[14px] ml-2.5 flex-1"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Preview next shield
            </Text>
            <Text
              className="text-ink-subtle text-[11.5px] tracking-[1px] uppercase"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
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
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
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
        onClose={() => setPreviewAppId(null)}
      />
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// AppRow — a single selectable app cell
//
// Built ad-hoc instead of leaning on SettingsChoiceRow because each
// row needs a brand-colored chip (with the initial glyph) in place
// of the standard accent-soft icon tile, and SettingsChoiceRow's
// icon slot is wrapped in accent-soft styling we'd have to fight
// against. Five lines of bespoke layout was cheaper.
// ─────────────────────────────────────────────────────────────────

function AppRow({
  app,
  checked,
  onToggle,
  onPreview,
  showDivider,
}: {
  app: SocialApp;
  checked: boolean;
  onToggle: () => void;
  onPreview: () => void;
  showDivider: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      {/* Top line — toggle row. Tap anywhere on this top strip
          flips inclusion; the preview affordance lives in its own
          row beneath so the two intents (include/exclude vs.
          read the copy) don't collide on the same hit target. */}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ selected: checked }}
        accessibilityLabel={`${checked ? "Remove" : "Add"} ${app.name}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className="flex-row items-center px-4 pt-3.5 pb-2">
          {/* Real brand glyph chip. Same component used in the
              ShieldOverlay hero and the home FocusToggle stack — keeps
              every "this is the app" visual coherent. */}
          <View className="mr-3">
            <BrandGlyph appId={app.id} size="sm" />
          </View>
          <Text
            className="text-ink text-[14.5px] flex-1"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {app.name}
          </Text>
          {checked ? <CheckIcon stroke={colors.select} /> : null}
        </View>
      </Pressable>

      {/* Quiet-message preview row. The message itself reads as
          quoted text (subtle / italic-ish via Medium weight); the
          trailing "Preview" link fires the ShieldOverlay so the
          user can see the full-screen treatment. Inset matches
          the chip width above so the message hangs under the
          app name visually. */}
      <Pressable
        onPress={onPreview}
        accessibilityRole="button"
        accessibilityLabel={`Preview ${app.name} shield overlay`}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
      >
        <View className="flex-row items-start px-4 pb-3.5 pl-[60px] pr-4">
          <Text
            className="text-ink-muted text-[12.5px] leading-[18px] flex-1 pr-3"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={2}
          >
            &ldquo;{app.quietMessage}&rdquo;
          </Text>
          <Text
            className="text-[11.5px] tracking-[1.5px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.select,
            }}
          >
            Preview
          </Text>
        </View>
      </Pressable>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

const ICON_BASE = {
  strokeWidth: 1.7,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ShieldIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function BoltIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M13 3L5 14h6l-2 7 8-11h-6z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function CheckIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Re-export the type so any future caller importing from this file
// (e.g. a focus settings index) has access without an extra hop.
export type { SocialAppId };
