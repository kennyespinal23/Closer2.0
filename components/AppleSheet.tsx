import { forwardRef, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from "react";
import { type ColorValue, View, type ViewStyle } from "react-native";
import {
  TrueSheet,
  type SheetDetent,
  type TrueSheetProps,
} from "@lodev09/react-native-true-sheet";
import { useColors } from "@/state/theme";

/**
 * AppleSheet
 *
 * Thin wrapper around `react-native-true-sheet` that pre-sets the
 * defaults Closer reaches for and folds in our theme system, so
 * sheets always slot into the app's visual language without the
 * caller wiring colors manually.
 *
 * Why TrueSheet over @gorhom/bottom-sheet:
 *   - TrueSheet uses the REAL iOS `UISheetPresentationController`
 *     (the same one Apple Mail / Maps / Reminders / Music use for
 *     half-sheets), so the drag tension, rubber-banding,
 *     auto-magnetism to detents, and dismissal animations are
 *     pixel-identical to the system. Gorhom's sheet is great but
 *     it's JS-driven and visibly approximates the system rather
 *     than running on top of it.
 *   - On iOS 26+ TrueSheet adds Liquid Glass `backgroundBlur` and
 *     scroll-edge effects out of the box, so future iOS-26-only
 *     polish work has a hook to land in.
 *
 * Imperative API (recommended for one-shot sheets):
 *
 *   <AppleSheet name="theme-picker" detents={['auto']}>
 *     <ThemePicker />
 *   </AppleSheet>
 *
 *   // Anywhere in the tree:
 *   AppleSheet.present('theme-picker')
 *   AppleSheet.dismiss('theme-picker')
 *
 * Ref-based API (for inline sheets w/o named registry):
 *
 *   const ref = useRef<TrueSheet>(null);
 *   <AppleSheet ref={ref}>...</AppleSheet>
 *   ref.current?.present()
 *
 * Detents:
 *   The native iOS sheet supports up to 3 detents:
 *     'auto'   - height matches content (iOS 16+)
 *     0.5      - 50% of screen height
 *     1        - full-screen
 *   Default below is `['auto']` which mirrors Apple's "settings
 *   panel" idiom — open exactly as tall as the content, no
 *   guesswork. Caller can override for half-sheets, drawers, etc.
 */
export type AppleSheetProps = Omit<
  TrueSheetProps,
  "backgroundColor" | "cornerRadius" | "detents" | "grabber"
> & {
  /**
   * Content rendered inside the sheet. We do not provide internal
   * padding — sheets should be paired with their own
   * <SheetContent> for consistent inset rhythm, OR the consumer
   * provides their own padding when the layout is bespoke.
   */
  children?: ReactNode;
  /**
   * Detents the sheet supports. See class comment for the meaning
   * of each value. Defaults to `['auto']` (content-sized).
   */
  detents?: SheetDetent[];
  /**
   * Hide the iOS grabber pill at the top of the sheet. Default
   * is to show it because the grabber is the canonical iOS hint
   * that "this is draggable / dismissable" — pulling it removes
   * a key affordance. Set to `false` only for sheets that
   * shouldn't be user-dismissable (rare).
   */
  grabber?: boolean;
  /**
   * Overrides for the sheet's background color. Defaults to the
   * current theme's surface color (white in light, panel in
   * dark). Set to `null` to fall through to the system default
   * (which on iOS 26 picks up Liquid Glass).
   */
  backgroundColor?: ColorValue | null;
};

/**
 * Augmented component type — `AppleSheet` is a `forwardRef` *and*
 * carries the imperative static API (`present` / `dismiss` /
 * `resize`) bound from `TrueSheet`. The runtime assignment a few
 * lines below is what populates the statics; this type signature
 * is what makes them visible to TypeScript at call sites.
 */
type AppleSheetComponent = ForwardRefExoticComponent<
  AppleSheetProps & RefAttributes<TrueSheet>
> & {
  present: typeof TrueSheet.present;
  dismiss: typeof TrueSheet.dismiss;
  resize: typeof TrueSheet.resize;
};

const AppleSheetInner = forwardRef<TrueSheet, AppleSheetProps>(
  function AppleSheetInner(
    {
      children,
      detents = ["auto"],
      grabber = true,
      backgroundColor,
      ...rest
    },
    ref,
  ) {
    const colors = useColors();
    // Theme-aware default: light mode → pure white, dark mode → the
    // surface color (slightly above bg) so the sheet visibly lifts
    // off the dim backdrop. Caller can pass `null` to skip and
    // inherit the system's Liquid Glass on iOS 26.
    const resolvedBg =
      backgroundColor === null
        ? undefined
        : (backgroundColor ?? colors.surface);

    return (
      <TrueSheet
        ref={ref}
        detents={detents}
        grabber={grabber}
        cornerRadius={28}
        backgroundColor={resolvedBg}
        dimmed
        draggable
        {...rest}
      >
        {children}
      </TrueSheet>
    );
  },
);

export const AppleSheet = AppleSheetInner as AppleSheetComponent;

/**
 * SheetContent
 *
 * Standard content container for the inside of an AppleSheet.
 * Provides the inset rhythm we want (24pt horizontal, 8pt top
 * gap below the grabber, 32pt bottom safe gutter above the
 * sheet's edge) so each sheet doesn't have to redefine padding.
 *
 * Use it like:
 *
 *   <AppleSheet name="x">
 *     <SheetContent>
 *       <Text>...</Text>
 *     </SheetContent>
 *   </AppleSheet>
 */
export function SheetContent({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 32,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Expose the imperative static API alongside the wrapper so
 * callers can `AppleSheet.present('name')` without importing
 * `TrueSheet` separately. Bound to TrueSheet so `this` inside
 * the static methods resolves correctly when invoked through
 * the wrapper.
 */
AppleSheet.present = TrueSheet.present.bind(TrueSheet);
AppleSheet.dismiss = TrueSheet.dismiss.bind(TrueSheet);
AppleSheet.resize = TrueSheet.resize.bind(TrueSheet);

// Re-export the underlying type so refs can be typed without
// dragging in @lodev09/react-native-true-sheet at every callsite.
export type AppleSheetRef = TrueSheet;
