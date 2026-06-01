import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  SettingsChoiceRow,
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { TEXT_SIZES, usePreferences } from "@/state/preferences";
import { useColors, useTheme, type ThemePref } from "@/state/theme";

/**
 * Appearance preferences.
 *
 * The Theme section is now live — picking Dark / Light / Match
 * System updates the active palette across every screen that
 * consumes the design tokens (Tailwind classes + the `useColors`
 * hook). The choice persists across launches.
 *
 * Text size still drives scripture rendering via
 * `usePreferences().textSize.scale` in the reader; the other rows
 * are stubs ready for their behavior.
 */
export default function AppearanceScreen() {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const { textSizeId, setTextSize } = usePreferences();
  const { pref: themePref, setPref: setThemePref } = useTheme();
  const colors = useColors();

  const themeChoices: ReadonlyArray<{
    id: ThemePref;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
  }> = [
    {
      id: "system",
      icon: <DeviceIcon stroke={colors.ink} />,
      label: "Match System",
      sublabel: "Follows your device's appearance setting",
    },
    {
      id: "dark",
      icon: <MoonIcon stroke={colors.ink} />,
      label: "Dark",
      sublabel: "Easy on the eyes, even at 5 in the morning",
    },
    {
      id: "light",
      icon: <SunIcon stroke={colors.ink} />,
      label: "Light",
      sublabel: "Bright surfaces, deep ink — for daylight reading",
    },
  ];

  return (
    <SettingsScaffold title="Appearance">
      <SettingsSection
        title="Theme"
        footer="Match System follows your device's dark / light mode automatically."
      >
        {themeChoices.map((choice, i) => (
          <SettingsChoiceRow
            key={choice.id}
            icon={choice.icon}
            label={choice.label}
            sublabel={choice.sublabel}
            selected={themePref === choice.id}
            onPress={() => setThemePref(choice.id)}
            showDivider={i < themeChoices.length - 1}
          />
        ))}
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

function SunIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 16a4 4 0 100-8 4 4 0 000 8z" {...ICON_BASE} stroke={stroke} />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function DeviceIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 5h18v12H3zM8 21h8M12 17v4" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

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
