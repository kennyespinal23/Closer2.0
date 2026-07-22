import { useLayoutEffect, type ReactNode } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import * as haptics from "@/lib/haptics";
import { systemText } from "@/lib/typography";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Shared body chrome for settings leaves.
 *
 * Navigation chrome is the native UINavigationBar from
 * `app/settings/_layout.tsx`. This scaffold only:
 *   • syncs `title` into that bar (so callers stay declarative)
 *   • provides the scroll body for Section / Row children
 */
export function SettingsScaffold({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * SettingsInfoBanner — the tinted info-card primitive used at the
 * top of settings pages that need to communicate context BEFORE
 * the user starts choosing/toggling.
 *
 * Visual pattern (verified against Apple Settings — App Privacy
 * Report, Bluetooth pairing, Wallet Activity card, and the third-
 * party Bible reader the user referenced):
 *
 *   ┌──────────────────────────────────────┐
 *   │  Title (bold, ink color)             │
 *   │  Body copy (muted, 13-15pt)          │
 *   │                                       │
 *   │  [ ↗ Learn More ]   ← inline pill    │
 *   └──────────────────────────────────────┘
 *
 * Three knobs control the visual:
 *   - `tone`: `"neutral"` (default — uses the page's surface
 *     color, blends in) or `"info"` (subtle iOS-blue tint, used
 *     when the card carries new/important context like a
 *     licensing notice). Apple uses blue tint sparingly; we
 *     mirror that.
 *   - `learnMoreUrl`: when set, renders an inline pill that
 *     opens the URL in the system browser. Pill uses the same
 *     iOS-blue accent as the info tone for visual continuity.
 *   - `eyebrow`: optional caps-tracked label above the title
 *     (e.g. "Coming Soon"), the same shape SettingsSection
 *     uses for its section headers — keeps the type system
 *     consistent across the settings surface.
 *
 * Drops in any settings page above the first Section. Lives in
 * the same file as SettingsSection / SettingsScaffold so every
 * page has one import path for the entire kit.
 */
export function SettingsInfoBanner({
  eyebrow,
  title,
  body,
  learnMoreLabel = "Learn More",
  learnMoreUrl,
  onLearnMore,
  tone = "neutral",
}: {
  /** Optional caps-tracked label above the title (e.g. "Coming Soon"). */
  eyebrow?: string;
  /** Bold headline — the card's voice. */
  title: string;
  /** Muted explanatory paragraph beneath the title. */
  body: string;
  /** Label rendered on the trailing inline pill. */
  learnMoreLabel?: string;
  /** When set, the inline pill opens this URL in the system browser. */
  learnMoreUrl?: string;
  /** Alternative to `learnMoreUrl` for in-app navigation. */
  onLearnMore?: () => void;
  /**
   * `"info"` paints the card in a soft iOS-blue tint with a
   * blue-tinted inline pill — used when the card carries
   * context that's NEW to the user or has compliance weight
   * (licensing, permissions, beta notices). `"neutral"` keeps
   * the card on the page's surface color so it reads as quiet
   * framing copy.
   */
  tone?: "neutral" | "info";
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  // iOS systemBlue tuned per scheme — Apple's stock value is
  // `#007AFF` light / `#0A84FF` dark. We keep the blue at low
  // alpha for the surface tint so the card reads as a soft
  // information chip instead of an attention banner.
  const blue = scheme === "light" ? "#007AFF" : "#0A84FF";
  const isInfo = tone === "info";
  const surface = isInfo
    ? scheme === "light"
      ? "rgba(0, 122, 255, 0.08)"
      : "rgba(10, 132, 255, 0.14)"
    : colors.surface;
  const border = isInfo
    ? scheme === "light"
      ? "rgba(0, 122, 255, 0.22)"
      : "rgba(10, 132, 255, 0.28)"
    : colors.border;
  const hasAction = Boolean(learnMoreUrl || onLearnMore);
  const handlePress = () => {
    haptics.soft();
    if (onLearnMore) {
      onLearnMore();
      return;
    }
    if (learnMoreUrl) {
      Linking.openURL(learnMoreUrl).catch(() => {
        // Silently swallow — opening a URL only fails when the
        // system has no handler for the scheme; nothing useful we
        // can do from a settings info card, and an alert here
        // would be noisier than the failure itself.
      });
    }
  };
  return (
    <View className="px-6 mt-2">
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: surface,
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        {eyebrow ? (
          <Text
            style={[
              systemText.captionEmphasized,
              {
                color: isInfo ? blue : colors.inkSubtle,
                marginBottom: 12,
              },
            ]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={[
            systemText.headline,
            { fontWeight: "700", color: colors.ink },
          ]}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            color: colors.inkMuted,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          {body}
        </Text>
        {hasAction ? (
          <Pressable
            onPress={handlePress}
            accessibilityRole="link"
            accessibilityLabel={learnMoreLabel}
            hitSlop={8}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor:
                scheme === "light"
                  ? "rgba(0, 122, 255, 0.10)"
                  : "rgba(10, 132, 255, 0.18)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <SFSymbol
              name="arrow.up.right"
              size={11}
              weight="semibold"
              color={blue}
            />
            <Text
              style={[
                systemText.footnote,
                { fontWeight: "700", color: blue, marginLeft: 6 },
              ]}
            >
              {learnMoreLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section — an eyebrow title + a rounded card containing rows,
//          optionally followed by a quiet footer caption
// ─────────────────────────────────────────────────────────────────

export function SettingsSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <View className="px-5 mt-7">
      {title && (
        <Text
          className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-2.5 ml-1"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          {title}
        </Text>
      )}
      <View className="rounded-2xl border border-border bg-surface overflow-hidden">
        {children}
      </View>
      {footer && (
        <Text
          className="text-ink-muted text-[12px] leading-[18px] mt-2.5 px-1"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row primitives — three shapes for the most common settings cells
// ─────────────────────────────────────────────────────────────────

type BaseRowProps = {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  showDivider?: boolean;
};

/**
 * Link row — tappable, displays a value on the right + chevron.
 * Use for navigation destinations and link-out actions.
 */
export function SettingsLinkRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  destructive,
  showDivider,
}: BaseRowProps & {
  value?: string;
  onPress?: () => void;
  /** Tinted red. Used for irreversible actions (Delete, Reset). */
  destructive?: boolean;
}) {
  const colors = useColors();
  const labelColor = destructive ? colors.destructive : colors.ink;
  return (
    <View>
      <Pressable onPress={onPress} style={{ minHeight: 44 }}>
        <View className="flex-row items-center px-4 py-3.5">
          {icon && (
            <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
              {icon}
            </View>
          )}
          <View className="flex-1 pr-2">
            <Text
              className="text-[15px]"
              style={{
                fontFamily: "System",
                fontWeight: "600",
                color: labelColor,
              }}
            >
              {label}
            </Text>
            {sublabel && (
              <Text
                className="text-ink-muted text-[12px] mt-0.5"
                style={{ fontFamily: "System", fontWeight: "400" }}
              >
                {sublabel}
              </Text>
            )}
          </View>
          {value && (
            <Text
              className="text-ink-muted text-[13px] mr-1.5"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {value}
            </Text>
          )}
          <ChevronIcon />
        </View>
      </Pressable>
      {/* Divider inset adapts to whether the row has an icon. With
          an icon the divider starts past the 8pt icon column (16pt
          row padding + 32pt icon + 12pt gutter = 60pt) to align
          with the label's leading edge — the canonical iOS Settings
          divider position. Without an icon, the divider hugs the
          label's actual leading edge (the row's 16pt content
          padding), matching Apple's reference list cells on
          chrome-less pickers like the Bible Translation surface. */}
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginLeft: icon ? 60 : 16,
          }}
        />
      )}
    </View>
  );
}

/**
 * Toggle row — label/sublabel on the left, Switch on the right.
 * State is owned by the parent (controlled component).
 */
export function SettingsToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  showDivider,
  disabled,
}: BaseRowProps & {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /**
   * Lock the row at its current value — the Switch can't be
   * flipped and no haptic fires on tap. Used when an upstream
   * signal (e.g. an OS-level accessibility preference) is
   * forcing the value true and a user toggle would be moot.
   * The row dims to 0.55 opacity to communicate the inert
   * state without hiding context (sublabel copy can explain
   * WHY it's locked).
   */
  disabled?: boolean;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  // The "off" track / iOS background need different alpha against
  // a light vs dark canvas — a 10%-white wash disappears on white.
  // We pick a calm 8% ink-over-bg in both modes so the switch reads
  // as a soft pill regardless of theme.
  const trackOff = withAlpha(colors.ink, 0.1);
  const trackBg = withAlpha(colors.ink, 0.08);
  // iOS system green — UIColor.systemGreen (#30D158 dark, #34C759 light).
  // This is the canonical "on" track color for iOS toggles.
  const trackOn = scheme === "dark" ? "#30D158" : "#34C759";
  return (
    <View style={disabled ? { opacity: 0.55 } : undefined}>
      <View className="flex-row items-center px-4 py-3.5">
        {icon && (
          <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
            {icon}
          </View>
        )}
        <View className="flex-1 pr-3">
          <Text
            className="text-ink text-[15px]"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              className="text-ink-muted text-[12px] mt-0.5 leading-[17px]"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              {sublabel}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          disabled={disabled}
          // Selection-feedback haptic on every toggle, same primitive
          // (UISelectionFeedbackGenerator) Apple uses for Settings.app
          // switches — the toggle is half visual and half haptic, and
          // RN's <Switch> does NOT call it for us. One source-of-truth
          // wiring here means every settings page picks it up for
          // free, with no per-screen `haptics.tick()` sprinkling.
          onValueChange={(next) => {
            if (disabled) return;
            haptics.tick();
            onValueChange(next);
          }}
          trackColor={{ false: trackOff, true: trackOn }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={trackBg}
        />
      </View>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginLeft: icon ? 60 : 16,
          }}
        />
      )}
    </View>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props. Falls back
 * to the input untouched when the hex doesn't parse cleanly.
 */
function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Static row — read-only display of a label, optional sublabel, and
 * optional trailing value. No chevron, no press feedback. Used for
 * Version, "What We Collect" rows, and anything else informational
 * that shouldn't suggest navigation.
 */
export function SettingsStaticRow({
  icon,
  label,
  sublabel,
  value,
  showDivider,
}: BaseRowProps & { value?: string }) {
  const colors = useColors();
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        {icon && (
          <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
            {icon}
          </View>
        )}
        <View className="flex-1 pr-2">
          <Text
            className="text-ink text-[15px]"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              className="text-ink-muted text-[12px] mt-0.5"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              {sublabel}
            </Text>
          )}
        </View>
        {value && (
          <Text
            className="text-ink-muted text-[13px]"
            style={{ fontFamily: "System", fontWeight: "500" }}
          >
            {value}
          </Text>
        )}
      </View>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginLeft: icon ? 60 : 16,
          }}
        />
      )}
    </View>
  );
}

/**
 * Selectable row — for "pick one from a list" patterns (e.g. theme
 * choices). Selected one gets a checkmark; others are inert.
 */
export function SettingsChoiceRow({
  icon,
  label,
  sublabel,
  selected,
  onPress,
  showDivider,
}: BaseRowProps & {
  selected: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const handlePress = () => {
    // Tick — the canonical iOS feedback for selection-style
    // controls (picker wheels, radio groups, segmented). Fire
    // before the callback so the haptic timing matches the
    // tap, not the parent's state-commit. We don't gate on
    // `selected` so retapping the currently-selected row still
    // gives a tactile "I heard you" — Apple's Settings does
    // the same.
    haptics.tick();
    onPress?.();
  };
  return (
    <View>
      <Pressable onPress={handlePress}>
        <View className="flex-row items-center px-4 py-3.5">
          {icon && (
            <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
              {icon}
            </View>
          )}
          <View className="flex-1 pr-2">
            <Text
              className="text-ink text-[15px]"
              style={{ fontFamily: "System", fontWeight: "600" }}
            >
              {label}
            </Text>
            {sublabel && (
              <Text
                className="text-ink-muted text-[12px] mt-0.5"
                style={{ fontFamily: "System", fontWeight: "400" }}
              >
                {sublabel}
              </Text>
            )}
          </View>
          {selected && <SelectedCheckIcon />}
        </View>
      </Pressable>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginLeft: icon ? 60 : 16,
          }}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons (kept here so settings screens don't repeat themselves)
// ─────────────────────────────────────────────────────────────────

function ChevronIcon() {
  const colors = useColors();
  return (
    <SFSymbol
      name="chevron.right"
      size={12}
      color={colors.inkSubtle}
      weight="semibold"
    />
  );
}

function CheckIcon() {
  const colors = useColors();
  return (
    <SFSymbol
      name="checkmark"
      size={16}
      color={colors.ink}
      weight="semibold"
    />
  );
}

/**
 * Checkmark used by `SettingsChoiceRow` for the active selection.
 *
 * Paints in iOS systemBlue — Apple's universal selection accent
 * used in every Settings picker (Bible Translation rows in the
 * reference shot, Wallpaper picker, Mail signature picker, etc.).
 * Blue here also pairs with the blue-tinted `SettingsInfoBanner`
 * pill so the selection cue and the info-card affordance share a
 * single accent across the surface.
 *
 * Renders inside a 22pt filled circle, the same way Apple paints
 * its "currently chosen" badge in picker lists with translation
 * tags — the chip reads as a clear "this is the active item" badge
 * rather than a bare glyph.
 */
function SelectedCheckIcon() {
  const scheme = useResolvedScheme();
  const blue = scheme === "light" ? "#007AFF" : "#0A84FF";
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: blue,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SFSymbol
        name="checkmark"
        size={12}
        color="#FFFFFF"
        weight="bold"
      />
    </View>
  );
}
