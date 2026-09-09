import { Linking, Pressable, Text, View } from "react-native";
import { systemText, typography } from "@/lib/typography";
import { flaticonAttributionLines } from "@/lib/flaticonIcons";
import {
  SettingsInfoBanner,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { useColors } from "@/state/theme";

/**
 * Free Flaticon license requires attribution. This screen lists every
 * ready icon’s author. Add credits in `lib/flaticonIcons.ts` when you
 * drop assets into `assets/icons/flaticon/`.
 */
export default function CreditsScreen() {
  const colors = useColors();
  const lines = flaticonAttributionLines();

  return (
    <SettingsScaffold title="Icon credits">
      <SettingsInfoBanner
        title="Hand-drawn icons"
        body="Closer’s doodle icons come from Flaticon’s free library. Free use requires crediting each artist — thank you to everyone listed below."
      />

      <SettingsSection title="Flaticon">
        {lines.length === 0 ? (
          <View className="px-4 py-3.5">
            <Text
              style={[
                typography.body,
                { color: colors.inkMuted, fontSize: 15, lineHeight: 22 },
              ]}
            >
              No Flaticon icons are bundled yet. When you add free icons,
              their authors will appear here automatically.
            </Text>
          </View>
        ) : (
          lines.map((credit) => (
            <Pressable
              key={`${credit.author}-${credit.flaticonUrl}`}
              onPress={() => {
                void Linking.openURL(credit.flaticonUrl);
              }}
              accessibilityRole="link"
              accessibilityLabel={`${credit.title} by ${credit.author} on Flaticon`}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                minHeight: 44,
              }}
            >
              <Text
                style={[
                  systemText.subheadline,
                  { color: colors.ink, fontWeight: "600" },
                ]}
              >
                {credit.title}
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.inkMuted,
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 4,
                  },
                ]}
              >
                Icons by {credit.author} from Flaticon
              </Text>
            </Pressable>
          ))
        )}
      </SettingsSection>
    </SettingsScaffold>
  );
}
