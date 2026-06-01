import { Text, View } from "react-native";
import {
  SettingsChoiceRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { TRANSLATIONS, usePreferences } from "@/state/preferences";
import { useColors } from "@/state/theme";

/**
 * Bible version picker.
 *
 * Lists every translation Closer supports. Each row shows the
 * two-letter tag (mirrors the pill in the reader header), the full
 * name, and a one-line voice description. Tapping a row updates the
 * preferences provider; the reader picks up the change on its next
 * render and refetches the current chapter in the new version.
 *
 * All choices here are public-domain translations served by
 * bible-api.com — no paid translations, no API keys.
 */
export default function TranslationScreen() {
  const { translationId, setTranslation } = usePreferences();

  return (
    <SettingsScaffold title="Bible Version">
      <View className="px-6 mt-4">
        <Text
          className="text-ink-muted text-[13px] leading-[20px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          Choose the translation Closer reads from. You can change this
          any time — your highlights and notes travel with you.
        </Text>
      </View>

      <SettingsSection
        title="Available"
        footer="More translations require licensing partnerships. We're working on it."
      >
        {TRANSLATIONS.map((t, i) => (
          <SettingsChoiceRow
            key={t.id}
            icon={<TagIcon tag={t.tag} />}
            label={t.fullName}
            sublabel={t.description}
            selected={translationId === t.id}
            onPress={() => setTranslation(t.id)}
            showDivider={i < TRANSLATIONS.length - 1}
          />
        ))}
      </SettingsSection>
    </SettingsScaffold>
  );
}

/**
 * Small text "badge" used as the row icon. Mirrors the translation
 * pill in the reader's top-right so the link between the two
 * surfaces is obvious.
 */
function TagIcon({ tag }: { tag: string }) {
  const { ink } = useColors();
  return (
    <Text
      style={{
        color: ink,
        fontFamily: "PlusJakartaSans_700Bold",
        fontSize: 9,
        letterSpacing: 0.5,
      }}
    >
      {tag.slice(0, 4)}
    </Text>
  );
}
