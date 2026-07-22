import { Alert, Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SFSymbol } from "@/components/Symbol";
import {
  SettingsInfoBanner,
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsStaticRow,
} from "@/components/SettingsScaffold";
import { shareRaw } from "@/lib/share";
import { useAnnotations } from "@/state/annotations";
import { useCheckIns } from "@/state/checkIns";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors } from "@/state/theme";

const PRIVACY_URL = "https://closer.app/privacy";
const TERMS_URL = "https://closer.app/terms";

/**
 * Privacy & Data screen.
 *
 * The two destructive rows are wired to real provider resets:
 *   • Reset Onboarding  → clears onboarding answers, replaces to /start
 *   • Delete Account    → clears both onboarding + progress, back to /start
 *
 * Both go through Alert.alert so an accidental tap can't nuke
 * someone's state. Once we wire AsyncStorage persistence and an
 * actual account backend, these handlers stay the same — the
 * providers' reset() functions will just do more.
 */
export default function PrivacyScreen() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const progress = useProgress();
  const preferences = usePreferences();
  const annotations = useAnnotations();
  const checkIns = useCheckIns();
  const readingGoal = useReadingGoal();

  const confirmResetOnboarding = () => {
    Alert.alert(
      "Reset onboarding?",
      "We'll walk you through the welcome flow again. Your progress and completions will stay where they are.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            onboarding.reset();
            router.replace("/");
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This clears every sermon you've completed, every preference, and walks you back to the very beginning. There's no undo.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // True full wipe — clears every persistence-backed
            // provider AND its on-disk AsyncStorage entry.
            onboarding.reset();
            progress.reset();
            preferences.reset();
            annotations.reset();
            checkIns.reset();
            router.replace("/");
          },
        },
      ],
    );
  };

  /**
   * Bundle every persisted user-facing field into a JSON snapshot
   * and hand it to the OS share sheet. The user can drop it into
   * Mail, Notes, Files — anywhere they'd archive personal data.
   *
   * Why JSON and not CSV/PDF? Three reasons:
   *   1. It's lossless — nested structures (notes per verse,
   *      check-in journal entries) survive round-trips.
   *   2. It's the same shape AsyncStorage holds, so if we ever
   *      add an "Import" feature the file plugs straight back in.
   *   3. It's self-describing enough that a non-developer can
   *      open it in Notes and see what's there.
   *
   * Internal-only fields (rotation indices, hydration flags) are
   * intentionally excluded — the user shouldn't see plumbing.
   */
  const handleExportData = async () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      app: { name: "Closer", version: "0.1.0" },
      onboarding: {
        name: onboarding.answers.name,
        // The new onboarding flow captures a richer profile than
        // the old "intent" single-pick. We export everything that
        // could feel personal — the apps the user named, the
        // scroll/wake buckets, the "why" reason, the attribution
        // source — so an export-as-Notes still tells the full
        // story.
        morningApps: onboarding.answers.morningApps ?? null,
        scrollBucket: onboarding.answers.scrollBucket ?? null,
        wakeBucket: onboarding.answers.wakeBucket ?? null,
        whyAnswer: onboarding.answers.whyAnswer ?? null,
        hearAboutUs: onboarding.answers.hearAboutUs ?? null,
        notificationsEnabled: onboarding.answers.notificationsEnabled ?? null,
        dailyReminderTime: onboarding.answers.dailyReminderTime ?? null,
      },
      preferences: {
        translationId: preferences.translationId,
        textSizeId: preferences.textSizeId,
      },
      progress: {
        totalCompletions: progress.totalCompletions,
        completionsByType: progress.completionsByType,
        lastCompletionDateISO: progress.lastCompletionDateISO,
        engagedDates: progress.engagedDates,
        sermonCompletions: progress.sermonCompletions,
        chaptersRead: progress.chaptersRead,
        lastVisited: progress.lastVisited,
      },
      readingGoal: {
        goalMinutes: readingGoal.goalMinutes,
        byDate: readingGoal.byDate,
      },
      annotations: {
        highlights: annotations.highlights,
        notes: annotations.notes,
        verseSnippets: annotations.verseSnippets,
        timestamps: annotations.timestamps,
      },
      checkIns: { log: checkIns.log },
    };

    try {
      // Funneled through lib/share's `shareRaw` (vs the verse /
      // insight helpers) so the JSON payload is shared as-is with
      // no "via Closer" attribution glued on. Subject line still
      // becomes the iOS Mail subject via the `title` prop.
      const result = await shareRaw({
        title: "Closer — your data",
        message: JSON.stringify(snapshot, null, 2),
      });
      if (result.status === "error") {
        throw new Error(result.message);
      }
    } catch (err) {
      // Share sheet was dismissed or failed — both are user-visible
      // already (the sheet just closes), so we surface a tiny
      // fallback only when something genuinely went wrong.
      const message = err instanceof Error ? err.message : "Unknown error";
      Alert.alert(
        "Couldn't export",
        `Something interrupted the share. (${message})`,
      );
    }
  };

  return (
    <SettingsScaffold title="Privacy">
      {/* The first thing someone reads on the Privacy page should
          tell them what we *don't* do. The fine print can wait.
          Uses the shared SettingsInfoBanner primitive (same
          surface treatment as Translation, Help, etc.) so the
          settings hierarchy reads consistently. The "Learn More"
          link drops the user into the full privacy policy for
          users who want the long form. */}
      <SettingsInfoBanner
        eyebrow="Closer's Promise"
        title="We don't sell your data, serve ads, or track what you read."
        body="Your relationship with scripture is yours. We're just a doorway you walk through each morning."
        learnMoreLabel="Read Privacy Policy"
        learnMoreUrl={PRIVACY_URL}
      />

      {/* ─── What We Collect ────────────────────────────────────
          These rows are informational only — no chevron, no press.
          Earlier they used SettingsLinkRow which renders a chevron
          and implies tapability; SettingsStaticRow renders the same
          icon + label + sublabel shape WITHOUT the chevron so the
          card honestly reads as "here's what we collect" rather
          than promising a destination behind each row. */}
      <SettingsSection
        title="What We Collect"
        footer="Stored locally on this device. Nothing leaves your phone without your sign-in."
      >
        <SettingsStaticRow
          icon={<JournalIcon />}
          label="Sermons Completed"
          sublabel="To show your rhythm and unlock the Library"
          showDivider
        />
        <SettingsStaticRow
          icon={<NameIcon />}
          label="Your Name"
          sublabel="So we can greet you each morning"
          showDivider
        />
        <SettingsStaticRow
          icon={<DeviceIcon />}
          label="Device Identifier"
          sublabel="Used only for crash diagnostics"
        />
      </SettingsSection>

      <SettingsSection title="The Fine Print">
        <SettingsLinkRow
          icon={<DocIcon />}
          label="Privacy Policy"
          onPress={() => Linking.openURL(PRIVACY_URL)}
          showDivider
        />
        <SettingsLinkRow
          icon={<DocIcon />}
          label="Terms of Service"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
      </SettingsSection>

      <SettingsSection
        title="Your Data, Your Call"
        footer="These actions cannot be undone."
      >
        <SettingsLinkRow
          icon={<RefreshIcon />}
          label="Reset Onboarding"
          sublabel="Walk through the welcome flow again"
          onPress={confirmResetOnboarding}
          showDivider
        />
        <SettingsLinkRow
          icon={<DownloadIcon />}
          label="Export My Data"
          sublabel="Share a JSON snapshot of everything Closer knows"
          onPress={handleExportData}
          showDivider
        />
        <SettingsLinkRow
          icon={<TrashIcon destructive />}
          label="Delete Account"
          sublabel="Erase everything on this device"
          onPress={confirmDeleteAccount}
          destructive
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-muted text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          Built with care. Questions? Reach us through Help &amp; Support.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function JournalIcon() {
  const { ink } = useColors();
  return <SFSymbol name="book.closed" size={14} color={ink} weight="medium" />;
}

function NameIcon() {
  const { ink } = useColors();
  return <SFSymbol name="person.circle" size={14} color={ink} weight="medium" />;
}

function DeviceIcon() {
  const { ink } = useColors();
  return <SFSymbol name="iphone" size={14} color={ink} weight="medium" />;
}

function DocIcon() {
  const { ink } = useColors();
  return <SFSymbol name="doc" size={14} color={ink} weight="medium" />;
}

function RefreshIcon() {
  const { ink } = useColors();
  return <SFSymbol name="arrow.clockwise" size={14} color={ink} weight="medium" />;
}

function DownloadIcon() {
  const { ink } = useColors();
  return <SFSymbol name="arrow.down.to.line" size={14} color={ink} weight="medium" />;
}

function TrashIcon({ destructive: isDestructive }: { destructive?: boolean }) {
  const { ink, destructive } = useColors();
  const color = isDestructive ? destructive : ink;
  return <SFSymbol name="trash" size={14} color={color} weight="medium" />;
}
