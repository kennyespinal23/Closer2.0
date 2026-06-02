import type { SocialAppId } from "@/lib/focus";
import type { WeekdayIndex } from "@/lib/notifications";
import type { StudySessionDraft } from "@/state/studySessions";

/**
 * Curated, pre-shaped study-session presets that the user can
 * add to their schedule with one tap.
 *
 * Why templates?
 *   The empty editor is overwhelming for a new user (time picker,
 *   day grid, focus toggle, app multi-select, name field…). A
 *   template starts them at a sensible "Christianized starting
 *   point" and lets them tweak from there instead of building
 *   from zero. Same UX move as Opal's "Laser Focus" / "Rise &
 *   Shine" preset cards, but reframed for a faith app:
 *
 *     Opal              Closer
 *     ────              ──────
 *     Laser Focus       Morning Devotion
 *     Rise & Shine      Quiet Hour
 *     Wind Down         Evening Reflection
 *     Deep Sleep        Sabbath Rest
 *
 * Categories drive the section layout on the Blocks screen — each
 * category becomes a horizontal scroller. "Practice" is the
 * intentional, committed routines (focus on, longer blocks).
 * "Anchors" is the gentle daily reminders (no focus, just
 * notifications) — the everyday rhythms that punctuate a busy day.
 *
 * Adding a new template:
 *   1. Pick an id (kebab-case, stable, never reused).
 *   2. Pick a category.
 *   3. Provide name, description, gradient + accent for the card,
 *      and the full StudySessionDraft the template should pre-fill
 *      into the editor.
 *   4. Append to TEMPLATES below.
 *
 * Templates are PURE — they don't reference any runtime state.
 * That means a template can be turned into a draft synchronously
 * via `templateToDraft(template)` and handed straight to the
 * editor or to `upsertSystemSession`.
 */

export type RoutineTemplateCategory = "practice" | "anchors";

export type RoutineTemplate = {
  /** Stable identifier. Used as the route param + lookup key. */
  id: string;
  /** Title shown on the card and pre-filled into the editor's
   *  name field. */
  name: string;
  /** One-line description on the card body. ~10 words max so it
   *  fits two lines comfortably at the card's narrow width. */
  description: string;
  category: RoutineTemplateCategory;
  /** Gradient anchors for the card background. Always two stops;
   *  light → darker. We hand-pick complementary palettes per
   *  template instead of using the brand accent everywhere so
   *  each card has its own identity in the horizontal scroller. */
  gradientFrom: string;
  gradientTo: string;
  /** Accent color for the "Add" pill on the card and the dot in
   *  the upper-left of the card chrome. Picked to read clearly
   *  against the gradient. */
  accent: string;
  /** Pre-shaped draft the editor or seeding API gets when the
   *  template is picked. Mutable from the editor — the template
   *  is just a starting point, not a contract. */
  draft: Omit<StudySessionDraft, "source"> & {
    /** Whether seeding via onboarding should mark this as
     *  "system" (Closer-curated) or "user" (manual). Defaults to
     *  "user" in templateToDraft so picking a template from the
     *  Blocks screen never accidentally creates a system row. */
    asSystem?: boolean;
  };
};

// ─────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────

const ALL_FEEDS: SocialAppId[] = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "reddit",
  "facebook",
  "snapchat",
];

const FEEDS_AND_CHATS: SocialAppId[] = [
  ...ALL_FEEDS,
  "messages",
  "whatsapp",
  "discord",
  "telegram",
];

const ALL_SCATTERS: SocialAppId[] = [
  ...FEEDS_AND_CHATS,
  "signal",
  "gmail",
  "chrome",
];

const WEEKDAYS: WeekdayIndex[] = [1, 2, 3, 4, 5];
const WEEKEND: WeekdayIndex[] = [0, 6];
const DAILY: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export const TEMPLATES: ReadonlyArray<RoutineTemplate> = [
  // ── Practice ──────────────────────────────────────────────────
  {
    id: "morning-devotion",
    name: "Morning Devotion",
    description: "Open the day in the Word before the noise.",
    category: "practice",
    gradientFrom: "#FFE4B0", // warm dawn
    gradientTo: "#FFB061",
    accent: "#C5612B",
    draft: {
      name: "Morning Devotion",
      time: { hour: 7, minute: 0 },
      daysOfWeek: WEEKDAYS,
      enabled: true,
      useFocusMode: true,
      blockedAppIds: ALL_FEEDS,
    },
  },
  {
    id: "quiet-hour",
    name: "Quiet Hour",
    description: "An immersive block for prayer and scripture.",
    category: "practice",
    gradientFrom: "#D4E5F4", // soft predawn blue
    gradientTo: "#7BA8D9",
    accent: "#3B6FA4",
    draft: {
      name: "Quiet Hour",
      time: { hour: 6, minute: 0 },
      daysOfWeek: WEEKDAYS,
      enabled: true,
      useFocusMode: true,
      blockedAppIds: FEEDS_AND_CHATS,
    },
  },
  {
    id: "sabbath-rest",
    name: "Sabbath Rest",
    description: "A full hour to be still and worship.",
    category: "practice",
    gradientFrom: "#E8DFFA", // soft violet sanctuary
    gradientTo: "#8E6FD0",
    accent: "#5A40A4",
    draft: {
      name: "Sabbath Rest",
      time: { hour: 10, minute: 0 },
      daysOfWeek: [0] as WeekdayIndex[],
      enabled: true,
      useFocusMode: true,
      blockedAppIds: ALL_SCATTERS,
    },
  },
  {
    id: "deep-study",
    name: "Deep Study",
    description: "A longer Saturday block for chapter-deep reading.",
    category: "practice",
    gradientFrom: "#F8E6D6", // parchment
    gradientTo: "#B98963",
    accent: "#7E5436",
    draft: {
      name: "Deep Study",
      time: { hour: 9, minute: 0 },
      daysOfWeek: [6] as WeekdayIndex[],
      enabled: true,
      useFocusMode: true,
      blockedAppIds: ALL_SCATTERS,
    },
  },
  // ── Anchors ───────────────────────────────────────────────────
  {
    id: "midday-pause",
    name: "Midday Pause",
    description: "A short reset around lunch — breath and verse.",
    category: "anchors",
    gradientFrom: "#FFF4D6", // noon gold
    gradientTo: "#F2C04A",
    accent: "#8E6612",
    draft: {
      name: "Midday Pause",
      time: { hour: 12, minute: 30 },
      daysOfWeek: WEEKDAYS,
      enabled: true,
      useFocusMode: false,
      blockedAppIds: ALL_FEEDS,
    },
  },
  {
    id: "evening-reflection",
    name: "Evening Reflection",
    description: "End the day with a verse and a quiet review.",
    category: "anchors",
    gradientFrom: "#D9DCEB", // dusk
    gradientTo: "#6B73A6",
    accent: "#3D4476",
    draft: {
      name: "Evening Reflection",
      time: { hour: 21, minute: 0 },
      daysOfWeek: DAILY,
      enabled: true,
      useFocusMode: false,
      blockedAppIds: [],
    },
  },
  {
    id: "drive-home-verse",
    name: "Drive Home Verse",
    description: "A scripture for the commute — even just a line.",
    category: "anchors",
    gradientFrom: "#FFD9C9", // sunset
    gradientTo: "#EF8166",
    accent: "#B14831",
    draft: {
      name: "Drive Home Verse",
      time: { hour: 17, minute: 30 },
      daysOfWeek: WEEKDAYS,
      enabled: true,
      useFocusMode: false,
      blockedAppIds: [],
    },
  },
  {
    id: "weekend-stillness",
    name: "Weekend Stillness",
    description: "Saturday + Sunday morning — slow and quiet.",
    category: "anchors",
    gradientFrom: "#E2EFDA", // pale fern
    gradientTo: "#79A468",
    accent: "#3F6730",
    draft: {
      name: "Weekend Stillness",
      time: { hour: 8, minute: 30 },
      daysOfWeek: WEEKEND,
      enabled: true,
      useFocusMode: false,
      blockedAppIds: [],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Find a template by id. Returns undefined when the id doesn't
 * match any known template — call sites should gate on this rather
 * than asserting non-null, since template ids can be stale (a
 * persisted preference referring to a template that's since been
 * removed from the catalog).
 */
export function findTemplate(id: string): RoutineTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Convert a RoutineTemplate to a StudySessionDraft suitable for
 * the editor or for `upsertSystemSession`. Defaults `source` to
 * "user" so picking a template from the Blocks screen creates a
 * user-owned routine; callers that explicitly want a system row
 * (e.g. onboarding seeding) can override via the `source` arg.
 *
 * Optional `timeOverride` lets the seeding flow pre-set a time
 * the user picked in onboarding without copying the whole template
 * back out and patching it manually.
 */
export function templateToDraft(
  template: RoutineTemplate,
  opts?: {
    source?: "user" | "system";
    timeOverride?: { hour: number; minute: number };
    nameOverride?: string;
  },
): StudySessionDraft {
  const source =
    opts?.source ?? (template.draft.asSystem ? "system" : "user");
  return {
    name: opts?.nameOverride ?? template.draft.name,
    source,
    time: opts?.timeOverride ?? template.draft.time,
    daysOfWeek: [...template.draft.daysOfWeek],
    enabled: template.draft.enabled,
    useFocusMode: template.draft.useFocusMode,
    blockedAppIds: [...template.draft.blockedAppIds],
  };
}

/**
 * Group templates by category, preserving the catalog order within
 * each group. Used by the Blocks screen to render one horizontal
 * scroller per category. Returns an ordered array so the section
 * order on screen matches the order categories appear in this
 * file (Practice first, then Anchors).
 */
export function groupTemplatesByCategory(): ReadonlyArray<{
  category: RoutineTemplateCategory;
  label: string;
  subtitle: string;
  templates: ReadonlyArray<RoutineTemplate>;
}> {
  const groups: Record<
    RoutineTemplateCategory,
    {
      label: string;
      subtitle: string;
      templates: RoutineTemplate[];
    }
  > = {
    practice: {
      label: "Deepen your practice",
      subtitle: "Routines that ask you to slow down and stay.",
      templates: [],
    },
    anchors: {
      label: "Anchors through the day",
      subtitle: "Gentle reminders to return to the Word.",
      templates: [],
    },
  };
  for (const template of TEMPLATES) {
    groups[template.category].templates.push(template);
  }
  // Categories rendered in a fixed order; Practice (deeper
  // commitment) leads since it's the more aspirational option.
  return [
    {
      category: "practice",
      label: groups.practice.label,
      subtitle: groups.practice.subtitle,
      templates: groups.practice.templates,
    },
    {
      category: "anchors",
      label: groups.anchors.label,
      subtitle: groups.anchors.subtitle,
      templates: groups.anchors.templates,
    },
  ];
}
