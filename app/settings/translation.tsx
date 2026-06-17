import {
  SettingsChoiceRow,
  SettingsInfoBanner,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { hasLocalBundle } from "@/lib/localBibles";
import { TRANSLATIONS, usePreferences } from "@/state/preferences";

/**
 * Bible version picker.
 *
 * Lists every translation Closer supports. Each row shows the
 * two-letter tag (mirrors the pill in the reader header), the full
 * name, and a one-line voice description. Tapping a row updates the
 * preferences provider; the reader picks up the change on its next
 * render and refetches the current chapter in the new version.
 *
 * Layout mirrors the iOS-native "settings detail" pattern: a tinted
 * info banner at the top (carrying the licensing context that
 * explains WHY the list is limited to public-domain translations),
 * a caps-tracked section header, and an inset-grouped list of
 * SettingsChoiceRow with a checkmark on the active translation.
 *
 * All choices here are public-domain translations served by
 * bible-api.com — no paid translations, no API keys.
 */
export default function TranslationScreen() {
  const { translationId, setTranslation } = usePreferences();

  return (
    <SettingsScaffold title="Bible Translation">
      {/* Translation Licensing — info banner using the new shared
          SettingsInfoBanner primitive. Replaces an earlier loose
          paragraph of muted text. The "info" tone tints the card
          with a soft iOS-blue wash + matching pill, which is the
          pattern Apple uses (and the reference Bible app the user
          cited uses) for cards that carry compliance / licensing
          context the user should READ before interacting with the
          surface below. */}
      <SettingsInfoBanner
        tone="info"
        title="Translation Licensing"
        body="We're working to secure licensing & permission from each publisher to include their Bible translation in the app. This process ensures we respect copyright and legal requirements."
        learnMoreLabel="Learn More"
        learnMoreUrl="https://closer.app/translations"
      />

      <SettingsSection title="Included Translations">
        {TRANSLATIONS.map((t, i) => {
          // Local-only translations (NWT et al.) get a clearer
          // sublabel telling the user the data needs to be supplied.
          // We further differentiate "slot exists but no content
          // bundled yet" from "slot has content" so the picker
          // doesn't look identical to the public-domain options.
          //
          // The sublabel for public-domain rows shows the short tag
          // (KJV, ASV, BSB, etc.) — same identifier the reader uses
          // in its translation pill, and the same "primary label /
          // tag sublabel" pattern shown in the reference iOS-native
          // Bible app the user cited (matches reference screenshot 2
          // exactly).
          const sublabel =
            t.localOnly && !hasLocalBundle(t.id)
              ? "Not installed — add JSON to assets/bibles/" + t.id
              : t.tag;
          return (
            <SettingsChoiceRow
              key={t.id}
              label={t.fullName}
              sublabel={sublabel}
              selected={translationId === t.id}
              onPress={() => setTranslation(t.id)}
              showDivider={i < TRANSLATIONS.length - 1}
            />
          );
        })}
      </SettingsSection>
    </SettingsScaffold>
  );
}
