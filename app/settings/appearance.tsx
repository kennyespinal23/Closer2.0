import { useState, type ReactNode } from "react";
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
 */
export default function AppearanceScreen() {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const { textSizeId, setTextSize } = usePreferences();
  const { pref, setPref } = useTheme();
  const colors = useColors();

  // Theme picker options — order is intentional (System first as
  // the default-ish path, then Dark/Light as the two manual
  // overrides). Each row's icon doubles as the visual cue for
  // the choice (device / moon / sun).
  const themeOptions: Array<{
    id: ThemePref;
    label: string;
    sublabel: string;
    icon: ReactNode;
  }> = [
    {
      id: "system",
      label: "Match System",
      sublabel: "Follow your iOS Light / Dark setting",
      icon: <DeviceIcon stroke={colors.ink} />,
    },
    {
      id: "dark",
      label: "Dark",
      sublabel: "Easy on the eyes, day or night",
      icon: <MoonIcon stroke={colors.ink} />,
    },
    {
      id: "light",
      label: "Light",
      sublabel: "Bright canvas for daytime reading",
      icon: <SunIcon stroke={colors.ink} />,
    },
  ];

  return (
    <SettingsScaffold title="Appearance">
      <SettingsSection
        title="Theme"
        footer="A handful of sermon illustrations were authored against a dark backdrop and may read as floating cards on the light canvas — we're refining those in follow-ups."
      >
        {themeOptions.map((opt, i) => (
          <SettingsChoiceRow
            key={opt.id}
            icon={opt.icon}
            label={opt.label}
            sublabel={opt.sublabel}
            selected={pref === opt.id}
            onPress={() => setPref(opt.id)}
            showDivider={i < themeOptions.length - 1}
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
      {/* Center disc */}
      <Path
        d="M12 8a4 4 0 100 8 4 4 0 000-8z"
        {...ICON_BASE}
        stroke={stroke}
      />
      {/* Eight rays */}
      <Path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function DeviceIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      {/* Phone outline */}
      <Path
        d="M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z"
        {...ICON_BASE}
        stroke={stroke}
      />
      {/* Home indicator */}
      <Path d="M11 18h2" {...ICON_BASE} stroke={stroke} />
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
