import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { TEXT_SIZES, usePreferences } from "@/state/preferences";
import { useColors } from "@/state/theme";

/**
 * Appearance preferences.
 *
 * THEME PICKER IS CURRENTLY DISABLED. Closer is locked to dark
 * mode at the provider level (see state/theme.tsx). The choice
 * row is replaced with a single read-only "Dark" status row + a
 * "Light mode coming soon" footer so users understand why there's
 * no choice rather than wondering if it's broken.
 *
 * When light mode ships (sermon illustrations re-authored with
 * transparent backdrops, ambient gradient stops re-tuned for a
 * light canvas), restore the previous Match System / Dark / Light
 * picker block from git history and remove the lock in
 * state/theme.tsx.
 *
 * Text size is still live — drives scripture rendering via
 * `usePreferences().textSize.scale` in the reader.
 */
export default function AppearanceScreen() {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const { textSizeId, setTextSize } = usePreferences();
  const colors = useColors();

  return (
    <SettingsScaffold title="Appearance">
      <SettingsSection
        title="Theme"
        footer="Closer is currently dark-only. Light mode is coming once the sermon artwork and ambient lighting are tuned for a bright canvas."
      >
        {/* Read-only status row — looks like the rest of the
            settings rows so it slots into the existing visual
            language, but it's a passive Text/View pair (no
            Pressable, no chevron, no onPress). The eye still reads
            "Theme: Dark" the same way as if it were the selected
            row in the old picker. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <MoonIcon stroke={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.ink,
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                lineHeight: 20,
              }}
            >
              Dark
            </Text>
            <Text
              style={{
                color: colors.inkSubtle,
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 12.5,
                lineHeight: 17,
                marginTop: 1,
              }}
            >
              Easy on the eyes, day or night
            </Text>
          </View>
        </View>
      </SettingsSection>

      <SettingsSection
        title="Reading"
        footer="Applies to scripture in the chapter reader. Sermons and the rest of the app stay at their tuned sizes."
      >
        {TEXT_SIZES.map((size, i) => (
          <SettingsChoiceRow
            key={size.id}
            icon={<TextScaleIcon scale={size.scale} ink={colors.ink} />}
            label={size.name}
            sublabel={size.id === "default" ? "Recommended" : undefined}
            selected={textSizeId === size.id}
            onPress={() => setTextSize(size.id)}
            showDivider={i < TEXT_SIZES.length - 1}
          />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Motion"
        footer="Disables fades and slide-ins across the app — useful if motion makes you uneasy."
      >
        <SettingsToggleRow
          icon={<MotionIcon stroke={colors.ink} />}
          label="Reduce Motion"
          sublabel="Snap into screens instead of fading"
          value={reduceMotion}
          onValueChange={setReduceMotion}
        />
      </SettingsSection>

      <SettingsSection title="Display">
        <SettingsLinkRow
          icon={<HomeIcon stroke={colors.ink} />}
          label="Home Screen Widget"
          sublabel="Add today's sermon to your iPhone home screen"
          onPress={() => router.push("/settings/widget")}
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          These preferences apply only to Closer.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
//
// Each glyph takes its stroke color as a prop so the same component
// works in both themes. The Appearance screen always passes the
// active `colors.ink` for the row leading icons.
// ─────────────────────────────────────────────────────────────────

const ICON_BASE = {
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MoonIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M20 14.5A8 8 0 119.5 4 7 7 0 0020 14.5z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

// SunIcon and DeviceIcon were removed along with the disabled
// Match System / Light picker rows. They'll come back when light
// mode ships — restore from git history (see header comment).

/**
 * A single "Aa" glyph sized proportionally to the scale it represents.
 * Smaller for "Small", larger for "Extra Large" — the icon's size
 * itself communicates the choice.
 */
function TextScaleIcon({ scale, ink }: { scale: number; ink: string }) {
  // Glyph size walks from ~9pt to ~15pt across the four sizes.
  const fontSize = Math.round(9 + (scale - 0.88) * 14);
  return (
    <View style={{ width: 14, alignItems: "center" }}>
      <Text
        style={{
          color: ink,
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize,
          lineHeight: fontSize + 2,
        }}
      >
        Aa
      </Text>
    </View>
  );
}

function MotionIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 12h10M14 8l4 4-4 4" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function HomeIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}
