import { Text, View } from "react-native";
import { SFSymbol } from "@/components/Symbol";
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
            className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            A quiet walkthrough
          </Text>
          <Text
            className="text-ink text-[20px] leading-[26px] tracking-[-0.2px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            Closer in five minutes.
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[20px] mt-2.5"
            style={{ fontFamily: "System", fontWeight: "400" }}
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
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            Anything still unclear?
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[19px] mt-1.5"
            style={{ fontFamily: "System", fontWeight: "400" }}
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
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            {title}
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[20px] mt-2"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons — SF Symbols for the walkthrough cards.
// ─────────────────────────────────────────────────────────────────

function useIconColor() {
  return useColors().ink;
}

function SunIcon() {
  const c = useIconColor();
  return <SFSymbol name="sun.max" size={18} color={c} weight="medium" />;
}

function MicIcon() {
  const c = useIconColor();
  return <SFSymbol name="mic" size={18} color={c} weight="medium" />;
}

function HeartCircleIcon() {
  const c = useIconColor();
  return <SFSymbol name="heart.circle" size={18} color={c} weight="medium" />;
}

function BookGlyph() {
  const c = useIconColor();
  return <SFSymbol name="book" size={18} color={c} weight="medium" />;
}

function PaintIcon() {
  const c = useIconColor();
  return <SFSymbol name="paintbrush" size={18} color={c} weight="medium" />;
}

function TimelineIcon() {
  const c = useIconColor();
  return <SFSymbol name="list.bullet" size={18} color={c} weight="medium" />;
}

function TargetGlyph() {
  const c = useIconColor();
  return <SFSymbol name="target" size={18} color={c} weight="medium" />;
}

function SparkleIcon() {
  const c = useIconColor();
  return <SFSymbol name="sparkles" size={18} color={c} weight="medium" />;
}

function BellGlyph() {
  const c = useIconColor();
  return <SFSymbol name="bell" size={18} color={c} weight="medium" />;
}

function UserGlyph() {
  const c = useIconColor();
  return <SFSymbol name="person" size={18} color={c} weight="medium" />;
}
