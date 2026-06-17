import { Linking, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { useColors } from "@/state/theme";

/**
 * Community — placeholder until the real channels exist.
 *
 * Linked from Help & Support's "Community" row. We don't have a
 * Discord / Circle / forum yet, so this page is honest about
 * that — it tells the user what's coming and gives them the one
 * thing we CAN offer right now: a way to write to the team.
 *
 * When real community channels launch:
 *   • Replace the email row with the Discord/Circle invite URL
 *   • Move the "Coming soon" section copy into a footer caption
 *   • Add a row for "Browse community" that opens the channel
 *
 * The page intentionally doesn't oversell anything that doesn't
 * exist. No fake counts, no "Join 10,000 others" claims — just a
 * quiet promise that something's being built.
 */
export default function CommunityScreen() {
  return (
    <SettingsScaffold title="Community">
      {/* ─── Promise ─────────────────────────────────────────────
          Frames the page honestly. Closer is small; community is
          earned slowly. We won't pretend it exists before it does. */}
      <View className="px-6 mt-2">
        <View className="rounded-2xl border border-border bg-surface px-5 py-6">
          <Text
            className="text-ink-subtle text-[11px] tracking-[2.5px] uppercase mb-3"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            Coming Soon
          </Text>
          <Text
            className="text-ink text-[20px] leading-[26px] tracking-[-0.2px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            A quiet place{"\n"}for the rest of us.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px] mt-2.5"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            We&apos;re building a small community for people on the same
            rhythm — somewhere to share what scripture is teaching you,
            without the noise of social feeds. We&apos;ll open it when
            it&apos;s ready.
          </Text>
        </View>
      </View>

      <SettingsSection
        title="In the meantime"
        footer="A real person reads every email that comes in."
      >
        <SettingsLinkRow
          icon={<MailIcon />}
          label="Tell us what you'd want"
          sublabel="What would make a community feel useful to you?"
          onPress={() =>
            Linking.openURL(
              "mailto:hello@closer.app?subject=Community wishlist",
            )
          }
          showDivider
        />
        <SettingsLinkRow
          icon={<ShareIcon />}
          label="Share Closer with a friend"
          sublabel="Reading alongside someone is its own kind of community"
          onPress={() => Linking.openURL("https://closer.app")}
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          &ldquo;Where two or three gather in my name, there am I with them.&rdquo;{"\n"}
          Matthew 18:20
        </Text>
      </View>
    </SettingsScaffold>
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

function MailIcon() {
  const { ink } = useColors();
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 6h18v12H3z" {...ICON_BASE} stroke={ink} />
      <Path d="M3 7l9 7 9-7" {...ICON_BASE} stroke={ink} />
    </Svg>
  );
}

function ShareIcon() {
  const { ink } = useColors();
  return (
    <SFSymbol
      name="square.and.arrow.up"
      size={14}
      color={ink}
      weight="medium"
    />
  );
}
