import { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { BrandGlyph } from "@/components/BrandGlyph";
import { findSocialApp, type SocialApp } from "@/lib/focus";
import { useColors } from "@/state/theme";

/**
 * ShieldOverlay — the full-screen "this app is quiet right now" preview.
 *
 * Today this is used in two places:
 *   1. The dev preview affordance on /settings/focus, so a content
 *      reviewer can read each app's quiet message in context without
 *      starting a real focus session.
 *   2. The dev "Preview shield" pill on the home screen, same idea
 *      but reachable in one tap during a walkthrough.
 *
 * In Phase 2 this same component will back the in-app overlay shown
 * when an Android AccessibilityService bounces the user out of a
 * blocked app, AND will be the design-system anchor for the matching
 * iOS ShieldConfiguration extension copy. So the layout intentionally
 * looks like an OS-level "Restricted" screen rather than an in-app
 * card — that's the visual language we want users to associate with
 * the feature.
 *
 * Layout (top → bottom):
 *   1. Brand-color halo behind the app's initial chip
 *   2. App initial chip (large)
 *   3. "Instagram is quiet" headline
 *   4. Quiet-message body (per-app copy from lib/focus.ts)
 *   5. Two CTAs — "Back to Closer" (primary), "End focus" (ghost)
 *
 * The "Back to Closer" CTA is the dominant action because the
 * intended flow is: user tried to open Instagram → got the shield →
 * gracefully returns to the sermon. "End focus" is intentionally
 * the secondary affordance so it doesn't feel like the easy out.
 */

export type ShieldOverlayProps = {
  /** Which app to display — looked up by id in the SOCIAL_APPS catalog.
   *  Accepts the raw string id for ergonomics; if the id isn't
   *  recognized the overlay still renders with a fallback. */
  appId: string;
  /** Whether the modal is visible. */
  visible: boolean;
  /** Fired when the user taps "Back to Closer" or the backdrop. */
  onClose: () => void;
  /** Optional — fired when the user taps "End focus". When omitted
   *  the End-focus CTA is hidden (e.g. in a static preview context
   *  where there's no real session to end). */
  onEndFocus?: () => void;
};

export function ShieldOverlay({
  appId,
  visible,
  onClose,
  onEndFocus,
}: ShieldOverlayProps) {
  const colors = useColors();
  const app = useMemo<SocialApp | null>(() => findSocialApp(appId), [appId]);

  // Defensive fallback — if the catalog dropped the id between
  // saves, render a generic "This app is quiet" overlay rather
  // than blanking the screen.
  const name = app?.name ?? "This app";
  const brandColor = app?.color ?? colors.primary;
  const message =
    app?.quietMessage ??
    "You're in a sermon right now. Come back when you're done.";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      // statusBarTranslucent so the dimmed backdrop reaches all the
      // way to the top edge on Android (otherwise a status-bar-sized
      // strip stays bright behind the overlay).
      statusBarTranslucent
    >
      {/* Backdrop. Pressable so tapping outside the card dismisses
          like the iOS modal convention. The inner content card stops
          touch propagation so taps inside don't dismiss. */}
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
        }}
      >
        {/* Wrap the body in a non-pressable view so taps inside the
            card don't bubble up to the backdrop dismiss. */}
        <Pressable onPress={() => {}} style={{ flex: 1 }}>
          <SafeAreaView
            edges={["top", "bottom"]}
            style={{ flex: 1, backgroundColor: colors.bg }}
          >
            <View className="flex-1 px-6 items-center justify-center">
              {/* ─── Ambient halo + brand chip ────────────────── */}
              <View className="items-center justify-center mb-6">
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    width: 320,
                    height: 320,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BrandHalo color={brandColor} />
                </View>

                {/* Real brand glyph on the app's brand-color chip.
                    Falls back to a neutral chip if the catalog lost
                    the id between saves — same defensive behavior as
                    the rest of this screen. */}
                {app ? (
                  <BrandGlyph appId={app.id} size="xl" />
                ) : (
                  <View
                    className="w-24 h-24 rounded-3xl items-center justify-center"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </View>

              {/* ─── Eyebrow ────────────────────────────────── */}
              <View className="flex-row items-center mb-3">
                <View
                  className="w-5 h-[1.5px] rounded-full mr-2.5"
                  style={{ backgroundColor: colors.inkSubtle }}
                />
                <Text
                  className="text-[10px] tracking-[3px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.inkSubtle,
                  }}
                >
                  Focus mode
                </Text>
                <View
                  className="w-5 h-[1.5px] rounded-full ml-2.5"
                  style={{ backgroundColor: colors.inkSubtle }}
                />
              </View>

              {/* ─── Headline ───────────────────────────────── */}
              <Text
                className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] text-center"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {name} is quiet
              </Text>

              {/* ─── Quiet message ──────────────────────────── */}
              <Text
                className="text-ink-muted text-[15px] leading-[23px] text-center mt-4 px-3"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                {message}
              </Text>
            </View>

            {/* ─── CTAs ──────────────────────────────────────── */}
            <View className="px-6 pb-4">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Return to Closer"
                className="bg-primary rounded-2xl py-4 items-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Text
                  className="text-primary-fg text-[15px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  Back to Closer
                </Text>
              </Pressable>

              {onEndFocus && (
                <Pressable
                  onPress={onEndFocus}
                  accessibilityRole="button"
                  accessibilityLabel="End focus session"
                  className="rounded-2xl py-3.5 mt-2.5 items-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text
                    className="text-ink-subtle text-[13.5px]"
                    style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                  >
                    End focus
                  </Text>
                </Pressable>
              )}

              <Text
                className="text-ink-subtle text-[11.5px] text-center mt-3"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                A few minutes of stillness, before the noise.
              </Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// BrandHalo — soft radial gradient behind the app's color chip
//
// Tinted to the app's brand color so each app's shield feels like
// "their" screen (Instagram pink, YouTube red, etc.). The outer
// stop fades to the active background so the halo blends seamlessly
// in both dark and light themes.
// ─────────────────────────────────────────────────────────────────

function BrandHalo({ color }: { color: string }) {
  const colors = useColors();
  return (
    <Svg width={320} height={320} viewBox="0 0 320 320">
      <Defs>
        <RadialGradient id="brandHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.06} />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={320} height={320} fill="url(#brandHalo)" />
    </Svg>
  );
}

/**
 * Decorative shield glyph — exported for any consumer (e.g. a
 * preview row in settings) that wants the same icon outside the
 * overlay context. Not used inside the overlay itself; the brand
 * chip carries the visual weight there.
 */
export function ShieldOverlayGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
