import { Linking, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  SettingsInfoBanner,
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { systemText } from "@/lib/typography";
import { useColors } from "@/state/theme";

/**
 * Home Screen Widget — placeholder until the iOS extension ships.
 *
 * Linked from Appearance → Display → Home Screen Widget. The
 * widget extension is a separate Xcode target (WidgetKit) and
 * isn't part of the current Expo build, so this page exists to
 * give the row a real destination, set expectations, and preview
 * what the widget will look like once it's available.
 *
 * The preview tile is a static SVG that approximates the
 * Lock-Screen-sized "Today's Verse" widget. It's purely
 * decorative — no real data flows into it. When the extension
 * lands we can pull the same `todaysMoment.scripture` text into
 * the preview so what someone sees here matches what they get
 * on their lock screen.
 */
export default function WidgetScreen() {
  return (
    <SettingsScaffold title="Home Screen Widget">
      {/* Frames the widget honestly: it isn't shipped yet, here's
          what it will look like, and here's how to be notified.
          Uses the shared SettingsInfoBanner with the "Coming Soon"
          eyebrow so the framing matches Translation / Privacy /
          Account / Help. */}
      <SettingsInfoBanner
        eyebrow="Coming Soon"
        title="Today's verse, on your home screen."
        body="A small widget that puts today's scripture and a tap-to-open shortcut right next to your apps. Lock-screen and home-screen sizes, refreshed each morning."
      />

      {/* ─── Preview ─────────────────────────────────────────────
          Static SVG mock of the planned widget. Lives in its own
          centered tray so it reads as a "preview" — not the real
          interactive thing. */}
      <View className="px-6 mt-7 items-center">
        <Text
          className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Preview
        </Text>
        <WidgetMock />
        <Text
          className="text-ink-muted text-[12px] mt-3"
          style={{ fontFamily: "System", fontWeight: "500" }}
        >
          Approximate — final design may differ.
        </Text>
      </View>

      <SettingsSection
        title="Stay In The Loop"
        footer="The widget ships in a future update. Until then, the daily notification covers the same morning rhythm."
      >
        <SettingsLinkRow
          icon={<MailIcon />}
          label="Tell me when it's ready"
          sublabel="We'll email you the day it ships"
          onPress={() =>
            Linking.openURL(
              "mailto:hello@closer.app?subject=Notify me about the home-screen widget",
            )
          }
        />
      </SettingsSection>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// WidgetMock — a static visual approximation of the planned widget
//
// SVG so the preview renders sharp at any density and respects the
// active theme via useColors(). The text below is hardcoded sample
// copy; once the extension is real we can feed `todaysMoment` in.
// ─────────────────────────────────────────────────────────────────

function WidgetMock() {
  const colors = useColors();
  return (
    <View
      style={{
        width: 200,
        height: 200,
        borderRadius: 28,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <View>
        <Text
          style={[systemText.captionEmphasized, { color: colors.inkMuted, fontWeight: "700" }]}
        >
          Today
        </Text>
        <Text
          style={{
            color: colors.ink,
            fontSize: 14,
            lineHeight: 19,
            marginTop: 6,
            fontFamily: "System",
            fontWeight: "500",
          }}
        >
          &ldquo;Draw near to God, and he will draw near to you.&rdquo;
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text
          style={[systemText.caption2, { color: colors.inkMuted, fontWeight: "600" }]}
        >
          James 4:8
        </Text>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12h14M13 6l6 6-6 6"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      {/* A faint app-icon mark in the corner so the tile reads as
          a Closer widget specifically. */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 14,
        }}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Rect x={2} y={2} width={20} height={20} rx={5} fill={colors.primary} />
          <Path
            d="M8 12c0-2.2 1.8-4 4-4M16 12c0 2.2-1.8 4-4 4"
            stroke={colors.primaryFg}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function MailIcon() {
  const { ink } = useColors();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M3 6h18v12H3zM3 7l9 7 9-7"
        stroke={ink}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
