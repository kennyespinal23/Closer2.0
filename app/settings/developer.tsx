import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { SFSymbol } from "@/components/Symbol";
import { MILESTONES } from "@/lib/milestones";
import * as haptics from "@/lib/haptics";
import { useDevTools } from "@/state/devTools";
import { useColors } from "@/state/theme";

/**
 * Developer Tools settings.
 *
 * A single toggle that surfaces the internal QA panel at the bottom
 * of the Today screen on builds where it's hidden by default.
 *
 * Why this screen exists:
 *   Closer ships its dev shortcuts (Next Sermon, Reset / Restart
 *   App) gated by `__DEV__` or Settings → Developer Tools, which
 *   is stripped from production-channel builds by default. That's
 *   the right default for end users — but it leaves the team unable
 *   to QA a production install (TestFlight, internal distribution)
 *   without us cutting a custom build.
 *
 *   This screen closes the gap. Toggling "Show developer panel" on
 *   makes the Profile → Developer section appear on any build,
 *   persists across launches, and is per-install (one teammate
 *   enabling it doesn't affect anyone else).
 *
 *   In `__DEV__` builds the toggle defaults to ON; in production
 *   builds it defaults to OFF.
 *
 * Discoverability:
 *   Linked from the Profile drawer's "About" section as "Developer
 *   Tools" so teammates can find it without us telling them a magic
 *   gesture. Once we ship to real users we can move the link
 *   behind a hidden gesture (e.g. tap the Version row 5 times)
 *   without touching the toggle itself.
 */
export default function DeveloperToolsScreen() {
  const { enabled, setEnabled, unlockAllMilestones, setUnlockAllMilestones } =
    useDevTools();
  const colors = useColors();
  const router = useRouter();

  return (
    <SettingsScaffold title="Developer Tools">
      <SettingsSection
        title="Internal QA"
        footer={
          enabled
            ? "The developer section is visible on the Profile tab — Next Sermon, Reset App, and Restart App."
            : "Turn on to show the developer section on Profile — Next Sermon, Reset App, and Restart App."
        }
      >
        <SettingsToggleRow
          icon={<DeveloperIcon stroke={colors.ink} />}
          label="Show developer panel"
          sublabel="Surface QA shortcuts on the Profile tab"
          value={enabled}
          onValueChange={setEnabled}
          showDivider
        />
        <SettingsToggleRow
          icon={
            <SFSymbol
              name="rosette"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Unlock all milestone badges"
          sublabel={`Browse all ${MILESTONES.length} badges on the Streaks tab`}
          value={unlockAllMilestones}
          onValueChange={(next) => {
            haptics.soft();
            setUnlockAllMilestones(next);
          }}
        />
      </SettingsSection>

      {__DEV__ ? (
        <SettingsSection
          title="Native UI"
          footer="Isolated @expo/ui Host + Button check. Requires a native rebuild after installing the package."
        >
          <SettingsLinkRow
            icon={
              <SFSymbol
                name="cube"
                size={18}
                color={colors.ink}
                weight="semibold"
              />
            }
            label="@expo/ui smoke test"
            sublabel="SwiftUI Host + Button"
            onPress={() => router.push("/settings/expo-ui-smoke")}
          />
        </SettingsSection>
      ) : null}

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          This panel exists for the team to QA new content and
          flows. Real users won't see it unless they explicitly turn
          it on here.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

function DeveloperIcon({ stroke }: { stroke: string }) {
  // Stylised "</>" glyph — universal "developer / code" shorthand.
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 9L4 12L8 15"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 9L20 12L16 15"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 5L10 19"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
