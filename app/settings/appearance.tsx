import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as haptics from "@/lib/haptics";
import { useOsReducedMotion } from "@/lib/useReducedMotion";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { SFSymbol } from "@/components/Symbol";
import { TEXT_SIZES, usePreferences } from "@/state/preferences";
import {
  useColors,
  useResolvedScheme,
  useTheme,
  type ThemePref,
} from "@/state/theme";

/**
 * Appearance preferences.
 *
 * Theme picker:
 *   • Match System — follow the iOS Light/Dark setting (flips
 *     live when the user toggles iOS Control Center).
 *   • Dark — force dark regardless of device.
 *   • Light — force light regardless of device.
 *
 * The chosen pref is persisted via the theme provider, so it
 * survives launches and across the whole app's UI.
 *
 * Text size is also live — drives scripture rendering via
 * `usePreferences().textSize.scale` in the reader.
 *
 * Layout note: theme and text size are now native
 * `UISegmentedControl`s (via
 * `@react-native-segmented-control/segmented-control`) instead
 * of stacks of `SettingsChoiceRow`s. The audit flagged both
 * pickers as the canonical "short labels, one-of-N choice"
 * shape that segmented controls were designed for — switching
 * reclaims ~150pt of vertical real estate on this screen and
 * lands the tap-to-pick interaction in iOS's native vocabulary
 * (haptic on segment change, slide animation between segments,
 * Voice Control wiring, etc.).
 */
export default function AppearanceScreen() {
  const router = useRouter();
  // OS-level Reduce Motion read directly (NOT composed with our
  // override) — we want to surface the OS state independently so
  // we can lock the toggle on and explain why it's locked when
  // the user already has the system-wide preference enabled.
  // Every other consumer of motion-gating should keep using
  // `useReducedMotion()` from the same module.
  const osReduceMotion = useOsReducedMotion();
  const { textSizeId, setTextSize, reduceMotionOverride, setReduceMotionOverride } =
    usePreferences();
  const { pref, setPref } = useTheme();
  const colors = useColors();
  // `useResolvedScheme` returns the actually-applied scheme
  // (light/dark) after collapsing the "system" preference
  // through the OS-level color scheme. Used here only to pin
  // the segmented control's `appearance` so it matches the
  // active palette even when our app overrides the OS pref
  // (e.g. user picks "Dark" on a Light-mode device).
  const scheme = useResolvedScheme();

  // ─── Theme picker ─────────────────────────────────────────
  // The order matters: System first (default-ish), then the two
  // manual overrides. Index ↔ id mapping is derived from this
  // array so the segmented control stays index-driven (native
  // API) while our state machine stays id-driven.
  const themeOptions: ReadonlyArray<{
    id: ThemePref;
    label: string;
    sublabel: string;
  }> = [
    {
      id: "system",
      label: "System",
      sublabel: "Follow your iOS Light / Dark setting",
    },
    {
      id: "dark",
      label: "Dark",
      sublabel: "Easy on the eyes, day or night",
    },
    {
      id: "light",
      label: "Light",
      sublabel: "Bright canvas for daytime reading",
    },
  ];
  const themeIndex = Math.max(
    0,
    themeOptions.findIndex((opt) => opt.id === pref),
  );
  const themeSublabel = themeOptions[themeIndex]?.sublabel ?? "";

  // ─── Text size picker ─────────────────────────────────────
  // TEXT_SIZES is the source of truth (id, name, scale). We
  // collapse to `name` strings for the segmented control and
  // keep the scale-aware Aa preview as a separate row above
  // so users can see the actual rendered size live as they
  // change the segment.
  const textSizeIndex = Math.max(
    0,
    TEXT_SIZES.findIndex((s) => s.id === textSizeId),
  );
  const currentTextSize = TEXT_SIZES[textSizeIndex] ?? TEXT_SIZES[1];

  return (
    <SettingsScaffold title="Appearance">
      <SettingsSection
        title="Theme"
        footer="A handful of sermon illustrations were authored against a dark backdrop and may read as floating cards on the light canvas — we're refining those in follow-ups."
      >
        <View style={styles.controlBlock}>
          <SegmentedControl
            // Native UISegmentedControl. `appearance` pins the
            // control to our resolved scheme so the control's
            // own colors (active fill, inactive fill, separators)
            // match the rest of the surface even if the user
            // forced a non-system theme.
            appearance={scheme}
            values={themeOptions.map((o) => o.label)}
            selectedIndex={themeIndex}
            onChange={(event) => {
              const nextIndex = event.nativeEvent.selectedSegmentIndex;
              const next = themeOptions[nextIndex]?.id;
              if (next && next !== pref) {
                // Light tick haptic on segment commit — same
                // grammar as SettingsToggleRow so theme changes
                // feel categorically equivalent to other native
                // settings interactions.
                haptics.tick();
                setPref(next);
              }
            }}
            style={styles.segmented}
            fontStyle={{
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 14,
              color: colors.inkMuted,
            }}
            activeFontStyle={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 14,
              color: colors.ink,
            }}
          />
          {/* Sublabel under the control — describes the current
              selection. Mirrors the per-row sublabel users got
              with the old SettingsChoiceRow layout so the
              guidance copy doesn't disappear with the swap. */}
          <Text style={[styles.helperText, { color: colors.inkSubtle }]}>
            {themeSublabel}
          </Text>
        </View>
      </SettingsSection>

      <SettingsSection
        title="Reading"
        footer="Applies to scripture in the chapter reader. Sermons and the rest of the app stay at their tuned sizes."
      >
        <View style={styles.controlBlock}>
          {/* Live Aa preview at the chosen scale. Sits above the
              segmented control so users see the actual visual
              effect of their selection BEFORE the segments tell
              them what they picked. */}
          <View style={styles.previewWrap}>
            <Text
              style={{
                color: colors.ink,
                fontFamily: "EBGaramond_500Medium",
                fontSize: Math.round(20 * currentTextSize.scale),
                lineHeight: Math.round(28 * currentTextSize.scale),
              }}
            >
              The Lord is my shepherd; I shall not want.
            </Text>
          </View>
          <SegmentedControl
            appearance={scheme}
            values={TEXT_SIZES.map((s) => s.name)}
            selectedIndex={textSizeIndex}
            onChange={(event) => {
              const nextIndex = event.nativeEvent.selectedSegmentIndex;
              const next = TEXT_SIZES[nextIndex];
              if (next && next.id !== textSizeId) {
                haptics.tick();
                setTextSize(next.id);
              }
            }}
            style={styles.segmented}
            fontStyle={{
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 13,
              color: colors.inkMuted,
            }}
            activeFontStyle={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 13,
              color: colors.ink,
            }}
          />
          <Text style={[styles.helperText, { color: colors.inkSubtle }]}>
            {currentTextSize.id === "default"
              ? "Recommended"
              : `Scaled to ${Math.round(currentTextSize.scale * 100)}%`}
          </Text>
        </View>
      </SettingsSection>

      <SettingsSection
        title="Motion"
        footer={
          osReduceMotion
            ? "iOS Reduce Motion is on, so Closer is already snapping instead of fading. Turn it off in Settings → Accessibility → Motion if you want full animations everywhere."
            : "Disables fades and slide-ins across Closer only — useful if motion makes you uneasy but you'd rather not change the system-wide setting."
        }
      >
        <SettingsToggleRow
          icon={
            <SFSymbol
              name="figure.walk.motion"
              size={16}
              color={colors.ink}
              weight="medium"
            />
          }
          label="Reduce Motion"
          // Sublabel narrates the EFFECTIVE state, not just the
          // override flag — that's the only honest read for a
          // user who has iOS Reduce Motion already on (where
          // their override is moot). When the OS pref is off,
          // we describe the on/off behavior so the toggle's
          // affordance reads cleanly.
          sublabel={
            osReduceMotion
              ? "On — following iOS Settings"
              : reduceMotionOverride
              ? "On — Closer is snapping into screens"
              : "Snap into screens instead of fading"
          }
          // Effective value: OS pref OR our override. When OS
          // pref is on we visually pin the switch up so users
          // don't perceive a false "off" state for a feature
          // they've already enabled. `disabled` blocks the
          // tap because flipping the override down would be
          // both moot AND confusing (the motion would still
          // be reduced). Sub-label + footer copy together
          // explain the inert state.
          value={osReduceMotion || reduceMotionOverride}
          onValueChange={setReduceMotionOverride}
          disabled={osReduceMotion}
        />
      </SettingsSection>

      <SettingsSection title="Display">
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="house.fill"
              size={16}
              color={colors.ink}
              weight="medium"
            />
          }
          label="Home Screen Widget"
          sublabel="Add today's sermon to your iPhone home screen"
          onPress={() => router.push("/settings/widget")}
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          These preferences apply only to Closer.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  controlBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  segmented: {
    height: 36,
  },
  helperText: {
    fontFamily: "System",
    fontWeight: "500",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 10,
    marginLeft: 2,
  },
  previewWrap: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 18,
    alignItems: "flex-start",
  },
});
