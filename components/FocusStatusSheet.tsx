/**
 * FocusStatusSheet — slide-up modal that explains "what's the app-
 * block system doing right now?"
 *
 * Modeled on Gentler Streak's "Go Gentler" recommendation sheet
 * (the screen that opens when you tap the small eye button next to
 * the Hi-Alex greeting on their home hero):
 *
 *   • Status pill floats at top-left in overlay-glass styling
 *     ("Status: Active ●") so the chip language is consistent
 *     between the home card and this sheet — same chip,
 *     same meaning.
 *   • Close (X) sits top-right in the same chrome row.
 *   • Centered hero glyph + big bold title + supporting paragraph.
 *   • Card listing the apps currently scoped by the system.
 *   • One primary CTA at the bottom.
 *
 * Three states the sheet handles, all from the same shell:
 *
 *   1. live  — a focus session is FIRING right now.
 *      pill: "Active" (green pulse), title: "Apps are blocked",
 *      CTA: "End focus session" (destructive ghost).
 *   2. armed — at least one block enabled but not firing.
 *      pill: "Armed" (amber), title: "Blocks are ready",
 *      CTA: "Manage blocks".
 *   3. off   — no enabled blocks at all.
 *      pill: hidden (no live system to label), title: "No active
 *      blocks", CTA: "Set up app blocks".
 *
 * Presentation: AppleSheet — our wrapper around
 * `react-native-true-sheet`, which uses the actual iOS
 * `UISheetPresentationController` under the hood. We get
 * Apple-spec drag tension, magnetic detents, the system grabber
 * pill, swipe-to-dismiss interruptibility, and iOS-26 Liquid
 * Glass on sheet edges — none of which the plain react-native
 * `Modal` (pageSheet) approximates. The controlled `visible` /
 * `onClose` bridge in AppleSheet keeps this component's external
 * shape unchanged for the call site in today.tsx.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as haptics from "@/lib/haptics";
import { findSocialApp, type SocialAppId } from "@/lib/focus";
import { AppleSheet } from "@/components/AppleSheet";
import { StatusPill } from "@/components/StatusPill";
import { SFSymbol } from "@/components/Symbol";
import { systemText } from "@/lib/typography";
import { useColors } from "@/state/theme";

export type FocusStatusSheetState = "live" | "armed" | "off";

export interface FocusStatusSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Drives the pill copy + title + CTA — see component
   *  docblock for the three states. */
  state: FocusStatusSheetState;
  /** Apps the system is (or would be) blocking. Rendered as a
   *  list with each app's colored initial chip. */
  blockedAppIds: ReadonlyArray<SocialAppId>;
  /** Fired when the user taps the primary CTA on the LIVE
   *  state. Sheet caller is responsible for actually ending
   *  the session in state/focus.tsx. */
  onEndFocus?: () => void;
  /** Fired when the user taps the primary CTA on either the
   *  ARMED or OFF states. Caller typically navigates to
   *  /settings/study-sessions. */
  onManageBlocks?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Copy maps
// ─────────────────────────────────────────────────────────────────
//
// All user-facing strings live here so a future copy pass can edit
// the sheet's voice in one place. The body paragraph is
// deliberately short — Apple's own setting-explainer sheets
// (Screen Time, Focus, App Privacy) use one or two sentences
// max, never a wall of text.

const COPY: Record<
  FocusStatusSheetState,
  { title: string; body: string; cta: string }
> = {
  live: {
    title: "Apps are blocked",
    body: "A focus session is running right now. The apps below are quiet until you end the session.",
    cta: "End focus session",
  },
  armed: {
    title: "Blocks are ready",
    body: "You have app blocks scheduled. When their time comes, the apps below will be quiet automatically.",
    cta: "Manage blocks",
  },
  off: {
    title: "No active blocks",
    body: "You haven't set up any app blocks yet. Pick a time and apps to quiet, and Closer will handle the rest.",
    cta: "Set up app blocks",
  },
};

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function FocusStatusSheet({
  visible,
  onClose,
  state,
  blockedAppIds,
  onEndFocus,
  onManageBlocks,
}: FocusStatusSheetProps) {
  const colors = useColors();
  const copy = COPY[state];

  // Pill mirrors the chip from the home header so users see the
  // SAME chip in both places — the home pill and the sheet pill
  // are visually identical, just contextually placed.
  const pillVisible = state !== "off";
  const pillValue = state === "live" ? "Active" : "Armed";
  const pillTone = state === "live" ? "live" : "armed";

  // Resolve blocked apps once per render — `findSocialApp` is a
  // pure id→object lookup so this is cheap; we filter to non-null
  // so unknown ids saved by older catalogs don't render an empty
  // row.
  const blockedApps = blockedAppIds
    .map((id) => findSocialApp(id))
    .filter((app): app is NonNullable<typeof app> => app !== null);

  // Primary CTA routing:
  //   • live state → onEndFocus (destructive vibe, ghost button)
  //   • armed/off  → onManageBlocks (primary fill)
  // Tap fires the relevant callback after a short haptic so the
  // sheet's exit lines up with a real "I did something" tap feel.
  const handleCtaPress = () => {
    if (state === "live") {
      haptics.warn();
      onEndFocus?.();
    } else {
      haptics.soft();
      onManageBlocks?.();
    }
    onClose();
  };

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      // 'auto' lets the sheet match its content height (iOS 16+).
      // 'large' (1) is the second detent so users can drag up for
      // the full-bleed reading position when the apps list grows
      // past the auto height.
      detents={["auto", 1]}
      backgroundColor={colors.bg}
      // The grabber + chrome row would double up on close
      // affordances. We keep the grabber (canonical iOS) and drop
      // the redundant top-right X.
    >
      <View style={{ paddingTop: 8 }}>
        {/* ── Chrome row — pill on the left only; the grabber
            handles dismissal on the right edge per iOS spec. ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {pillVisible ? (
            <StatusPill
              label="Status"
              value={pillValue}
              tone={pillTone}
              pulse={state === "live"}
            />
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 32,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero glyph — tinted by state so the icon reads as
              the same shield-with-status the home pill carries.
              Using SF Symbol via the Symbol wrapper so it stays
              Apple-native + automatically vector-crisp at every
              device scale. */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              backgroundColor:
                state === "live"
                  ? "rgba(34, 197, 94, 0.12)"
                  : state === "armed"
                    ? "rgba(245, 158, 11, 0.12)"
                    : colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            }}
          >
            <SFSymbol
              name={
                state === "live"
                  ? "shield.lefthalf.filled"
                  : state === "armed"
                    ? "shield"
                    : "app.badge"
              }
              size={44}
              color={
                state === "live"
                  ? "#22C55E"
                  : state === "armed"
                    ? "#F59E0B"
                    : colors.inkMuted
              }
              weight="semibold"
            />
          </View>

          {/* ── Title — Apple sheet-headline shape: 28pt Bold,
              tight tracking, centered. */}
          <Text
            style={[
              systemText.title1,
              {
                color: colors.ink,
                textAlign: "center",
                marginBottom: 12,
              },
            ]}
            accessibilityRole="header"
          >
            {copy.title}
          </Text>

          {/* ── Body paragraph ── */}
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 16,
              lineHeight: 22,
              textAlign: "center",
              paddingHorizontal: 8,
              marginBottom: 28,
            }}
          >
            {copy.body}
          </Text>

          {/* ── Apps list — only rendered when there's at least
              one app to show. Each row mirrors the system's
              "quieted apps" language: colored initial chip on
              the left, app name in the middle, status dot on
              the right that echoes the sheet's overall state.
              Wrapped in a single rounded card so the list
              reads as one surface rather than a stack of
              independent rows (Apple Settings pattern). */}
          {blockedApps.length > 0 ? (
            <View
              style={{
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                overflow: "hidden",
                marginBottom: 28,
              }}
            >
              {blockedApps.map((app, idx) => (
                <View
                  key={app.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderTopWidth:
                      idx === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  }}
                >
                  {/* App initial chip — same colored pill the
                      AppGlyphStack already uses on home, kept
                      consistent so the user maps the row to
                      the icon they've seen elsewhere. */}
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: app.color,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontFamily: "System",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {app.initial}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "System",
                      fontWeight: "600",
                      color: colors.ink,
                      fontSize: 15,
                      letterSpacing: -0.1,
                    }}
                    numberOfLines={1}
                  >
                    {app.name}
                  </Text>
                  {/* Right-side dot — green when live (this app
                      is being quieted RIGHT NOW), amber when
                      armed (this app WILL be quieted on
                      schedule), muted otherwise. */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor:
                        state === "live"
                          ? "#22C55E"
                          : state === "armed"
                            ? "#F59E0B"
                            : "#9CA3AF",
                    }}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Primary CTA — live state gets a destructive ghost
              treatment, armed/off get the standard filled
              primary. Both close the sheet on press so the
              user lands back on the home card with the
              appropriate state already updated. */}
          <Pressable
            onPress={handleCtaPress}
            accessibilityRole="button"
            accessibilityLabel={copy.cta}
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                state === "live" ? colors.surface : colors.primary,
              borderWidth:
                state === "live" ? StyleSheet.hairlineWidth : 0,
              borderColor: colors.border,
              opacity: pressed ? 0.78 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color:
                  state === "live"
                    ? "#EF4444" // destructive red on the End-focus CTA
                    : colors.primaryFg,
                fontSize: 16,
                letterSpacing: -0.2,
              }}
            >
              {copy.cta}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </AppleSheet>
  );
}
