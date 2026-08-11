import { useEffect, useState } from "react";
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
import {
  advanceHomeQuotePreview,
  allHomeQuotes,
  clearHomeQuotePreview,
  getHomeQuotePreviewIndex,
  isHomeQuotePreviewActive,
  subscribeHomeQuotePreview,
} from "@/lib/homeQuotes";
import * as haptics from "@/lib/haptics";
import { useDevTools } from "@/state/devTools";
import { useMoments } from "@/state/moments";
import { useColors } from "@/state/theme";

/**
 * Developer Tools settings.
 *
 * A single toggle that surfaces the internal QA panel at the bottom
 * of the Today screen on builds where it's hidden by default.
 *
 * Why this screen exists:
 *   Closer ships its QA shortcuts (Next Reading, Reset / Restart
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
  const {
    todaysMoment,
    catalogPosition,
    advanceToNextMoment,
    advanceToPreviousMoment,
    shuffleMoment,
  } = useMoments();
  const colors = useColors();
  const router = useRouter();
  const quoteCount = allHomeQuotes().length;
  const [quotePreview, setQuotePreview] = useState(() => ({
    active: isHomeQuotePreviewActive(),
    index: getHomeQuotePreviewIndex(),
  }));

  useEffect(() => {
    return subscribeHomeQuotePreview(() => {
      setQuotePreview({
        active: isHomeQuotePreviewActive(),
        index: getHomeQuotePreviewIndex(),
      });
    });
  }, []);

  const syncQuotePreview = () => {
    setQuotePreview({
      active: isHomeQuotePreviewActive(),
      index: getHomeQuotePreviewIndex(),
    });
  };

  const quoteSublabel = quotePreview.active
    ? `Preview ${(quotePreview.index ?? 0) + 1} of ${quoteCount}`
    : `${quoteCount} quotes · daily rotation`;

  return (
    <SettingsScaffold title="Developer Tools">
      <SettingsSection
        title="Internal QA"
        footer={
          enabled
            ? "The developer section is visible on the Profile tab — Next Reading, Reset App, and Restart App."
            : "Turn on to show the developer section on Profile — Next Reading, Reset App, and Restart App."
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

      <SettingsSection
        title="Daily devotionals"
        footer="Jump through the 365-day catalog any time. Shuffle picks a random day (not the current one). Home updates immediately."
      >
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="backward.fill"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Previous reading"
          sublabel={todaysMoment.title}
          value={`${catalogPosition.position} / ${catalogPosition.total}`}
          onPress={() => {
            haptics.soft();
            advanceToPreviousMoment();
            router.navigate("/today");
          }}
          showDivider
        />
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="forward.fill"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Next reading"
          sublabel={todaysMoment.title}
          value={`${catalogPosition.position} / ${catalogPosition.total}`}
          onPress={() => {
            haptics.soft();
            advanceToNextMoment();
            router.navigate("/today");
          }}
          showDivider
        />
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="shuffle"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Shuffle reading"
          sublabel="Jump to a random catalog day"
          value={`${catalogPosition.position} / ${catalogPosition.total}`}
          onPress={() => {
            haptics.tick();
            shuffleMoment();
            router.navigate("/today");
          }}
        />
      </SettingsSection>

      <SettingsSection
        title="Home quotes"
        footer="Steps through the quote catalog on Home. Preview clears on app restart, or tap Reset."
      >
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="text.quote"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Next home quote"
          sublabel={quoteSublabel}
          onPress={() => {
            haptics.tick();
            advanceHomeQuotePreview();
            syncQuotePreview();
          }}
          showDivider
        />
        <SettingsLinkRow
          icon={
            <SFSymbol
              name="arrow.counterclockwise"
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          }
          label="Reset to daily quote"
          sublabel={
            quotePreview.active
              ? "Clear preview · use morning/evening/night"
              : "Already on daily rotation"
          }
          onPress={() => {
            haptics.soft();
            clearHomeQuotePreview();
            syncQuotePreview();
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
          className="text-ink-muted text-[12px] leading-[18px] text-center"
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
