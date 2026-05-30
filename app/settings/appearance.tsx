import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  SettingsChoiceRow,
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { colors } from "@/constants/theme";
import { TEXT_SIZES, usePreferences } from "@/state/preferences";

/**
 * Appearance preferences.
 *
 * Closer is designed for night — the dark theme is the only theme
 * for the moment. We still render the theme picker so the affordance
 * exists; "Light" and "System" are listed but disabled (no onPress)
 * with a footnote explaining why.
 *
 * Text size is the one preference that actually affects scripture
 * rendering today — see `usePreferences().textSize.scale` in the
 * reader.
 */
export default function AppearanceScreen() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const { textSizeId, setTextSize } = usePreferences();

  return (
    <SettingsScaffold title="Appearance">
      <SettingsSection
        title="Theme"
        footer="Closer is designed for night. A light theme is on the way."
      >
        <SettingsChoiceRow
          icon={<MoonIcon />}
          label="Dark"
          sublabel="Easy on the eyes, even at 5 in the morning"
          selected
          showDivider
        />
        <SettingsChoiceRow
          icon={<SunIcon />}
          label="Light"
          sublabel="Coming soon"
          selected={false}
          showDivider
        />
        <SettingsChoiceRow
          icon={<DeviceIcon />}
          label="Match System"
          sublabel="Coming soon"
          selected={false}
        />
      </SettingsSection>

      <SettingsSection
        title="Reading"
        footer="Applies to scripture in the chapter reader. Sermons and the rest of the app stay at their tuned sizes."
      >
        {TEXT_SIZES.map((size, i) => (
          <SettingsChoiceRow
            key={size.id}
            icon={<TextScaleIcon scale={size.scale} />}
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
          icon={<MotionIcon />}
          label="Reduce Motion"
          sublabel="Snap into screens instead of fading"
          value={reduceMotion}
          onValueChange={setReduceMotion}
        />
      </SettingsSection>

      <SettingsSection title="Display">
        <SettingsLinkRow
          icon={<HomeIcon />}
          label="Home Screen Widget"
          sublabel="Add today's sermon to your iPhone home screen"
          onPress={() => {}}
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
// ─────────────────────────────────────────────────────────────────

const ICON_PROPS = {
  strokeWidth: 1.7,
  stroke: colors.ink,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MoonIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M20 14.5A8 8 0 119.5 4 7 7 0 0020 14.5z" {...ICON_PROPS} />
    </Svg>
  );
}

function SunIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 16a4 4 0 100-8 4 4 0 000 8z" {...ICON_PROPS} />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" {...ICON_PROPS} />
    </Svg>
  );
}

function DeviceIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 5h18v12H3zM8 21h8M12 17v4" {...ICON_PROPS} />
    </Svg>
  );
}

/**
 * A single "Aa" glyph sized proportionally to the scale it represents.
 * Smaller for "Small", larger for "Extra Large" — the icon's size
 * itself communicates the choice.
 */
function TextScaleIcon({ scale }: { scale: number }) {
  // Glyph size walks from ~9pt to ~15pt across the four sizes.
  const fontSize = Math.round(9 + (scale - 0.88) * 14);
  return (
    <View style={{ width: 14, alignItems: "center" }}>
      <Text
        style={{
          color: colors.ink,
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

function MotionIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 12h10M14 8l4 4-4 4" {...ICON_PROPS} />
    </Svg>
  );
}

function HomeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" {...ICON_PROPS} />
    </Svg>
  );
}
