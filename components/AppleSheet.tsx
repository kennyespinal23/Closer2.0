import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
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
  /**
   * Controlled-mode visibility flag. When provided, `AppleSheet`
   * presents and dismisses itself in lock-step with this prop
   * — flip to `true` to slide up, `false` to dismiss. This is
   * what lets the dozen `<XxxModal visible={open} ... />`
   * patterns in the app keep their existing call shape after
   * the swap; the underlying TrueSheet stays purely imperative
   * but the bridge useEffect below translates declarative state
   * into present/dismiss calls.
   *
   * Leave undefined to use the imperative API
   * (`<AppleSheet name="x">` + `AppleSheet.present('x')`) which
   * is preferable for one-shot dialogs that don't need their
   * open-state mirrored in React state.
   */
  visible?: boolean;
  /**
   * Fired any time the sheet finishes dismissing — whether by
   * swipe-to-dismiss, grabber drag, the OS hardware back, or a
   * `visible` flip from the parent. Wire this to your parent
   * setter (e.g. `setOpen(false)`) so React state stays in sync
   * after user-driven dismisses. Without this, swiping the
   * sheet away would close the UI but leave `visible=true` in
   * the parent, blocking subsequent opens.
   */
  onClose?: () => void;
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
      visible,
      onClose,
      onDidDismiss,
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

    // ─── Controlled-mode bridge ─────────────────────────────────
    //
    // TrueSheet is intrinsically imperative — there's no `visible`
    // prop on the underlying native view; instead the JS class
    // exposes `present()` / `dismiss()` instance methods. To let
    // the existing controlled-component callers in Closer keep
    // their `<XxxModal visible={open} onClose={...} />` shape, we
    // hold an INTERNAL ref and:
    //
    //   1. forward that ref out via useImperativeHandle so callers
    //      that DO want the imperative handle still get the full
    //      TrueSheet API (present / dismiss / resize). This means
    //      the existing `AppleSheet.present('name')` static path
    //      keeps working alongside controlled mode.
    //
    //   2. useEffect on `visible` calls present()/dismiss() on the
    //      internal ref. Skipping the very first render in the
    //      `false` case prevents a spurious dismiss-when-not-open
    //      no-op on mount (TrueSheet logs about it).
    //
    //   3. bridge `onDidDismiss` back to the parent's `onClose`
    //      so swipe-to-dismiss, grabber-drag, and OS back-press
    //      all sync React state back to `visible=false`. We chain
    //      the caller's own `onDidDismiss` if they passed one so
    //      this stays additive, not replacing.
    const internalRef = useRef<TrueSheet | null>(null);
    useImperativeHandle(ref, () => internalRef.current as TrueSheet);

    const isControlled = visible !== undefined;
    const hasPresentedRef = useRef(false);
    useEffect(() => {
      if (!isControlled) return;

      let cancelled = false;
      let attempts = 0;

      if (visible) {
        // Present after the native view attaches. Remounting (or
        // opening on the same tick the sheet first mounts) can leave
        // internalRef null for a frame — retry briefly instead of
        // silently no-op'ing and leaving the user with a dead tap.
        const tryPresent = () => {
          if (cancelled) return;
          const node = internalRef.current;
          if (!node) {
            if (attempts++ < 12) {
              requestAnimationFrame(tryPresent);
            }
            return;
          }
          node.present().catch(() => {});
          hasPresentedRef.current = true;
        };
        tryPresent();
      } else if (hasPresentedRef.current) {
        internalRef.current?.dismiss().catch(() => {});
        hasPresentedRef.current = false;
      }

      return () => {
        cancelled = true;
      };
    }, [isControlled, visible]);

    useEffect(() => {
      return () => {
        internalRef.current?.dismiss().catch(() => {});
        hasPresentedRef.current = false;
      };
    }, []);

    return (
      <TrueSheet
        ref={internalRef}
        detents={detents}
        grabber={grabber}
        cornerRadius={28}
        backgroundColor={resolvedBg}
        dimmed
        draggable
        onDidDismiss={(event) => {
          // Track presented-state so a subsequent `visible=false`
          // flip after a swipe-to-dismiss doesn't try to
          // double-dismiss.
          hasPresentedRef.current = false;
          onClose?.();
          onDidDismiss?.(event);
        }}
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
          paddingTop: 20,
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
