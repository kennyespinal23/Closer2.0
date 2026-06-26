import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Time-of-day for the daily "Before The Noise" notification, stored
 * as 24-hour `hour` (0..23) and `minute` (0..59). We persist the
 * structured pair instead of an ISO string so the scheduler can pass
 * it straight to `Notifications.scheduleNotificationAsync`'s
 * `{hour, minute, repeats: true}` trigger without any parsing.
 */
export type DailyReminderTime = {
  hour: number;
  minute: number;
};

/**
 * Pre-bed scroll-time bucket the user picks on the "how long do you
 * scroll before getting out of bed" screen. Stored as a discrete
 * enum (rather than free-form minutes) so downstream copy
 * (the gut-punch screen) can pivot on it categorically — "Over an
 * hour" hits differently than "Under 15 minutes" even if the
 * midpoint math came out close.
 *
 * The `unknown` bucket is the "I don't even want to know" answer.
 * We treat it as a soft "30+ min" assumption for any numeric
 * calculation but keep the original choice around so the gut-punch
 * screen can soften its tone (the user already self-identified as
 * not wanting to face the number).
 */
export type ScrollBucket =
  | "under15"
  | "fifteen30"
  | "thirty60"
  | "overHour"
  | "unknown";

/**
 * Wake-time bucket. Used to seed a sensible default on the time
 * picker later in onboarding (Screen 14) and to flavor a few of
 * the gut-punch copy lines.
 */
export type WakeBucket =
  | "before6"
  | "six7"
  | "seven8"
  | "eight9"
  | "after9";

/**
 * "How did you hear about us" answer. Free-form attribution captured
 * for our own product analytics; never displayed back to the user.
 * Kept as a discrete enum so we don't drown in typo variants.
 */
export type AttributionSource =
  | "instagram"
  | "tiktok"
  | "friend"
  | "church"
  | "google"
  | "other";

/**
 * Denomination / faith background. Captured early in onboarding
 * so the rest of the flow (and later, content recommendations,
 * Bible translation defaults, prayer style suggestions) can
 * meet the user where they are.
 *
 *   • `catholic` → Catholic tradition; defaults to NRSV/RSV-style
 *     translation, Marian-tradition-friendly content
 *   • `protestant` → mainline / evangelical Protestant; defaults
 *     to ESV/NIV
 *   • `orthodox` → Eastern Orthodox; defaults to OSB / NKJV
 *   • `nondenominational` → modern non-denominational Christian
 *   • `christianOther` → identifies as Christian but no specific
 *     denomination (or one not listed)
 *   • `exploring` → not yet identifying with a denomination —
 *     curious, deconstructing, returning, or new to faith
 *
 * Stored as a discrete enum to keep downstream pattern-matching
 * tight; the labels shown to the user live in the screen file.
 */
export type Denomination =
  | "catholic"
  | "protestant"
  | "orthodox"
  | "nondenominational"
  | "christianOther"
  | "exploring";

/**
 * Where the user is on their walk. Different from denomination
 * — denomination is identity, faith stage is RELATIONSHIP at
 * the time they downloaded the app. The pair lets us think
 * about, e.g., a "Catholic returning after years away" vs a
 * "new-to-faith non-denominational" differently in the content
 * we surface.
 */
export type FaithStage =
  | "lifelong"
  | "returning"
  | "newToFaith"
  | "exploring";

export type OnboardingAnswers = {
  name: string;
  /**
   * IDs of the apps the user admits opening first thing in the
   * morning. Captured on Screen 2 (multi-select grid). Drives the
   * personalized gut-punch on Screen 6 ("You're opening Instagram &
   * TikTok 730 times before God this year") and could later seed
   * the Focus mode default-blocked list.
   */
  morningApps?: string[];
  /**
   * How long the user typically scrolls before getting out of bed
   * (Screen 3). Used by the gut-punch screen to amplify or soften
   * the personalized stat.
   */
  scrollBucket?: ScrollBucket;
  /**
   * What time the user typically wakes (Screen 4). Used to pre-pick
   * the matching option on the morning-time picker (Screen 14).
   */
  wakeBucket?: WakeBucket;
  /**
   * The user's "why" — their answer on Screen 7 to "Why do you want
   * to get closer to God?". The home screen / journal could later
   * surface this back at moments of friction. Free-form for now to
   * keep options easy to A/B.
   */
  whyAnswer?: string;
  /**
   * The user's faith background. Captured on /onboarding/denomination
   * right after name. See `Denomination` for the discrete options
   * and how each one is intended to influence downstream content
   * recommendations.
   */
  denomination?: Denomination;
  /**
   * Where the user is on their walk. Captured on /onboarding/faithstage
   * right after denomination. See `FaithStage` for options.
   */
  faithStage?: FaithStage;
  /**
   * Areas the user wants to grow in (Peace, Patience, Faith, etc.).
   * Multi-select, captured on /onboarding/growth. Becomes the seed
   * for the home screen's "for you" sermon picks and the verse-of-
   * the-day topic rotation. IDs (not display labels) so downstream
   * pattern-matching stays tight even if we rename a label.
   */
  growthAreas?: string[];
  /**
   * Whether the user completed Screen Time setup on /onboarding/quietapps
   * (authorized + picked apps from Apple's FamilyActivityPicker).
   */
  screenTimeConfigured?: boolean;
  /**
   * Where the user heard about Closer (Screen 12). Pure product
   * analytics — never shown back to the user.
   */
  hearAboutUs?: AttributionSource;
  /**
   * Whether the user accepted the daily morning notification on
   * Screen 13 (or later in settings).
   *
   *   true   → notification is scheduled
   *   false  → user deliberately turned it off
   *   undefined → not yet decided (pre-prompt state)
   *
   * The tri-state matters so settings can render "Off" vs "Not set
   * yet" differently without inferring it from time presence.
   */
  notificationsEnabled?: boolean;
  /**
   * When the daily notification fires. Picked on Screen 14 (the
   * 2x2 time picker) and persisted so the settings screen can
   * pre-populate the user's choice — and so the focus / study
   * silent-seeding logic can hang scheduling off the same value.
   *
   * Semantically: this is when the SERMON delivery arrives — the
   * "your morning starts at X" screen frames it that way and the
   * welcome screen seeds a "Daily Sermon" system routine off it.
   */
  dailyReminderTime?: DailyReminderTime;
  /**
   * When the user wants their Bible-study commitment to fire.
   * Picked on the new "studytime" screen (right after the sermon
   * time picker). Separate field from dailyReminderTime because
   * the two routines are intentionally distinct in the user's
   * day — sermon delivery is a short notification, Bible study
   * is a longer focus block.
   *
   * Used by welcome.tsx's silent-seeding logic to create a
   * system "Bible Study" study session at the chosen hour/minute.
   * Editable later from /settings/study-sessions or the Blocks
   * tab itself (tap the routine → editor opens pre-filled with
   * the seeded values).
   */
  bibleStudyTime?: DailyReminderTime;
  /**
   * True once the user has reached the end of the onboarding flow
   * (the welcome screen) and tapped "I'm ready" to enter the app.
   *
   * Drives the launch routing in `app/index.tsx`:
   *   • `undefined` / `false` → show the Get Started landing
   *   • `true`               → bypass the landing, route straight
   *                            to `/today` so returning users
   *                            never see the onboarding chrome
   *                            after a cold launch.
   *
   * Lives on the persisted answers object (rather than a separate
   * key) so a full `reset()` clears it alongside the rest of the
   * onboarding state — preventing the "completed flag stuck true
   * after dev reset" footgun.
   */
  completed?: boolean;
};

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  setAnswer: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => void;
  reset: () => void;
  /** True once the persisted answers have loaded (or no save existed). */
  hydrated: boolean;
};

const EMPTY: OnboardingAnswers = {
  name: "",
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY);

  // Merge loaded data with defaults so a saved file missing newer
  // fields (e.g. a future `notificationsEnabled`) still hydrates
  // cleanly — the unknown defaults fill in.
  const applyLoaded = useCallback((loaded: OnboardingAnswers) => {
    setAnswers({ ...EMPTY, ...loaded });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.onboarding,
    answers,
    applyLoaded,
  );

  const reset = useCallback(() => {
    setAnswers(EMPTY);
    // Also clear the persisted record so a "fresh install" feel from
    // the dev shortcut actually IS fresh, not just an in-memory wipe.
    removeKey(STORAGE_KEYS.onboarding);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      answers,
      setAnswer: (key, value) =>
        setAnswers((prev) => ({ ...prev, [key]: value })),
      reset,
      hydrated,
    }),
    [answers, reset, hydrated],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  }
  return ctx;
}
