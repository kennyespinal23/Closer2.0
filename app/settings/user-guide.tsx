import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SettingsScaffold } from "@/components/SettingsScaffold";
import { useColors } from "@/state/theme";

/**
 * User Guide — a quiet walkthrough of every screen.
 *
 * Linked from Help & Support's "User Guide" row. The whole point
 * is for someone three weeks into using Closer to scroll through
 * and discover features they didn't realize were there (long-press
 * a verse to highlight, the Library hero, mood check-ins, the
 * journey timeline, etc.).
 *
 * Each section is one "this is how X works" moment, written like
 * a person explaining it — not a help-center article. We keep the
 * visual language of small icon-circles + heading + soft body
 * paragraph so the page feels like the rest of the settings
 * surface, not a docs site bolted on.
 *
 * If we ever ship a true interactive tour, this page becomes the
 * "long-form reference" you can re-read after dismissing it.
 */
export default function UserGuideScreen() {
  return (
    <SettingsScaffold title="User Guide">
      {/* ─── Hero ───────────────────────────────────────────────
          Sets the tone: this isn't a manual, it's an invitation
          to slow down and notice everything Closer offers. */}
      <View className="px-6 mt-2">
        <View className="rounded-2xl border border-border bg-surface px-5 py-6">
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            A quiet walkthrough
          </Text>
          <Text
            className="text-ink text-[20px] leading-[26px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Closer in five minutes.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px] mt-2.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            One screen at a time, here&apos;s every place worth knowing —
            and what each is quietly built for.
          </Text>
        </View>
      </View>

      <GuideSection
        icon={<SunIcon />}
        title="The Home Screen"
        body="Every morning Closer opens to a single sermon. Above it sits your streak, your reading minutes, and your last check-in. Nothing else. The rhythm is one sermon, one moment, then you put the phone down."
      />

      <GuideSection
        icon={<MicIcon />}
        title="Today's Voice"
        body="Tap the sermon card to step inside. It unfolds in three quiet pages — the scripture, the teaching, and the prayer. Swipe or tap Continue to move through. At the end, Closer marks the day complete."
      />

      <GuideSection
        icon={<HeartCircleIcon />}
        title="Mood Check-Ins"
        body="The (+) tab in the navigation lets you tell Closer how you're feeling. We hand you back a verse that meets you there. Every check-in is saved to your Journey so you can look back on what you were carrying that week."
      />

      <GuideSection
        icon={<BookGlyph />}
        title="The Library & Reader"
        body="The Library tab holds the whole Bible. Tap any book, then any chapter, to read. Tap a verse to bring up the action sheet — highlight it, add a note, share it, or copy the reference. Long-press to start a multi-verse selection."
      />

      <GuideSection
        icon={<PaintIcon />}
        title="Highlights & Notes"
        body="Anything you highlight in the reader gets saved. Tap the same verse again to clear the highlight or add a private note. Everything lives in your profile drawer under Highlights and Notes — searchable, exportable, and only on your device."
      />

      <GuideSection
        icon={<TimelineIcon />}
        title="The Journey Timeline"
        body="The Journey tab is your personal record — completed sermons, mood check-ins, highlighted verses, and streak milestones, all in one timeline. Newest at the top. Stack cards group days with multiple events."
      />

      <GuideSection
        icon={<TargetGlyph />}
        title="Reading Goal"
        body="Pick a daily minutes goal in Settings → Reading Goal. The blue ring on the Home screen fills as you read. Time spent on any sermon, chapter, or insight counts — close the app and the timer pauses automatically."
      />

      <GuideSection
        icon={<SparkleIcon />}
        title="Insights"
        body="The Insights tab is a magazine of long-form articles on faith — Featured up top, then organized by theme. Tap any cover to open it. Articles read like Apple News, with hero art and a quiet typographic flow."
      />

      <GuideSection
        icon={<BellGlyph />}
        title="Before The Noise"
        body="At the time you picked during onboarding, Closer fires one notification — your sermon is ready. Tap it and you drop straight into Today's Voice. Never more than one a day, never guilt-tripped if you miss one. Change the time anytime in Settings → Notifications."
      />

      <GuideSection
        icon={<UserGlyph />}
        title="Profile & Settings"
        body="The avatar in the top-left of the Home screen opens your profile drawer — name, stats, notes, highlights, and every preference. Edit your name, change Bible translation, pick a theme, or reset everything if you ever need a fresh start."
      />

      <View className="px-6 mt-8 mb-2">
        <View className="rounded-2xl border border-border bg-surface px-5 py-5">
          <Text
            className="text-ink text-[15px] leading-[21px]"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            Anything still unclear?
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[19px] mt-1.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Head over to Help &amp; Support — a real person reads every
            message that comes through.
          </Text>
        </View>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// GuideSection — one walkthrough card
//
// Icon circle on the left, heading + body to the right. The icon
// circle uses `bg-accent-soft` so it gets the orange-tinted wash
// that the rest of the app uses for badge-style backgrounds.
// ─────────────────────────────────────────────────────────────────

function GuideSection({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View className="px-6 mt-7">
      <View className="flex-row">
        <View className="w-11 h-11 rounded-2xl bg-accent-soft border border-border items-center justify-center mr-4">
          {icon}
        </View>
        <View className="flex-1 pt-0.5">
          <Text
            className="text-ink text-[16.5px] leading-[22px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {title}
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px] mt-2"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons — small line glyphs reused across the walkthrough.
// Each pulls its stroke color from useColors() so the page reads
// well in both light and dark themes.
// ─────────────────────────────────────────────────────────────────

const ICON_BASE = {
  strokeWidth: 1.7,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function useIconStroke() {
  return useColors().ink;
}

function SunIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 17a5 5 0 100-10 5 5 0 000 10z" {...ICON_BASE} stroke={stroke} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function MicIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function HeartCircleIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 18s-5-3.2-5-7a3 3 0 015-2 3 3 0 015 2c0 3.8-5 7-5 7zM12 21a9 9 0 100-18 9 9 0 000 18z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function BookGlyph() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function PaintIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M4 19l4 1 9-9-5-5-9 9z" {...ICON_BASE} stroke={stroke} />
      <Path d="M13 6l5 5M4 22h16" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function TimelineIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M6 4v16M6 8h4M6 14h4M6 20h6" {...ICON_BASE} stroke={stroke} />
      <Path d="M18 4a2 2 0 100 4 2 2 0 000-4zM18 14a2 2 0 100 4 2 2 0 000-4z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function TargetGlyph() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 13a1 1 0 100-2 1 1 0 000 2z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function SparkleIcon() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l3.5 3.5M15 15l3.5 3.5M5.5 18.5l3.5-3.5M15 9l3.5-3.5" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function BellGlyph() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16zM10 20a2 2 0 004 0" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function UserGlyph() {
  const stroke = useIconStroke();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 12a4 4 0 100-8 4 4 0 000 8z" {...ICON_BASE} stroke={stroke} />
      <Path d="M4 21c0-4 4-7 8-7s8 3 8 7" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}
