import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as haptics from "@/lib/haptics";
import { AppleSheet, type AppleSheetRef } from "@/components/AppleSheet";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { useColors } from "@/state/theme";

/**
 * PracticeTodayCard — "practice for today" sheet on the Landing
 * panel (panel 4) right before The Prayer.
 *
 * Presented via AppleSheet (UISheetPresentationController), with
 * two native detents:
 *   • peek     — ~140pt of chrome (eyebrow + “Swipe up” hint)
 *   • expanded — ~78% screen for the full practice copy + CTA
 *
 * Advance to prayer: Continue pill, or swipe-to-dismiss once the
 * sheet has been expanded. Peek is not dismissible (matches the
 * old PanResponder card — you expand before you can leave).
 *
 * Touch targets (confirmed):
 *   • Peek expand header — minHeight: minTouchTarget (44)
 *   • Continue pill — PrimaryPillButton minHeight 52
 *   • Native grabber — system sheet control
 */
export function PracticeTodayCard({
  text,
  firstName,
  accent,
  onAdvance,
}: {
  text: string;
  firstName: string;
  accent: string;
  onAdvance: () => void;
}) {
  const colors = useColors();
  const { height: screenHeight } = useWindowDimensions();
  const sheetRef = useRef<AppleSheetRef>(null);

  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const didAdvanceRef = useRef(false);

  // Peek ≈ original 140pt card lip; expanded ≈ 78% of screen.
  const peekDetent = Math.min(
    0.28,
    Math.max(0.16, 140 / Math.max(screenHeight, 1)),
  );
  const expandedDetent = 0.78;

  const interpolated = useMemo(
    () => text.replace(/\[name\]/g, firstName),
    [text, firstName],
  );

  const paragraphs = useMemo(
    () =>
      interpolated
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [interpolated],
  );

  const finishAdvance = useCallback(() => {
    if (didAdvanceRef.current) return;
    didAdvanceRef.current = true;
    onAdvance();
  }, [onAdvance]);

  const requestAdvance = useCallback(() => {
    if (didAdvanceRef.current) return;
    haptics.tap();
    // Closing the sheet fires onClose → finishAdvance.
    setOpen(false);
  }, []);

  const expand = useCallback(() => {
    if (expandedRef.current) return;
    haptics.tap();
    expandedRef.current = true;
    setExpanded(true);
    sheetRef.current?.resize(1).catch(() => {});
  }, []);

  return (
    <AppleSheet
      ref={sheetRef}
      name="practice-today"
      visible={open}
      onClose={finishAdvance}
      detents={[peekDetent, expandedDetent]}
      // Dim only once expanded — Landing stays interactive in peek.
      dimmedDetentIndex={1}
      // Peek must expand before the user can swipe away (same
      // forward-only arc as the old custom card).
      dismissible={expanded}
      scrollable
      backgroundColor={colors.surfaceSecondary}
      onDetentChange={(event) => {
        const index = event.nativeEvent.index;
        if (index >= 1) {
          expandedRef.current = true;
          setExpanded(true);
          return;
        }
        // Dragging down from expanded toward peek: treat as
        // continue (original card never re-collapsed to peek).
        if (expandedRef.current) {
          requestAdvance();
        }
      }}
    >
      {/* Top sibling — TrueSheet pins ScrollView below this when
          scrollable. Tap expands from peek (44pt min hit area). */}
      <View
        style={{
          paddingHorizontal: spacing[24],
          paddingTop: spacing[8],
        }}
      >
        <Pressable
          onPress={expand}
          disabled={expanded}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? "Today's practice"
              : "Swipe up or tap to receive today's practice"
          }
          style={{
            alignItems: "center",
            minHeight: minTouchTarget,
            justifyContent: "center",
            paddingVertical: spacing[8],
          }}
        >
          <Text
            style={{
              color: accent,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 12,
              lineHeight: 14,
              letterSpacing: 0.8,
            }}
          >
            PRACTICE TODAY
          </Text>
          {!expanded ? (
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 15,
                lineHeight: 22,
                marginTop: spacing[8],
                textAlign: "center",
              }}
            >
              Swipe up to receive
            </Text>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[24],
          paddingTop: spacing[12],
          paddingBottom: spacing[32],
        }}
      >
        {paragraphs.map((p, i) => (
          <Text
            key={i}
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 18,
              lineHeight: 28,
              letterSpacing: -0.1,
              marginBottom: spacing[16],
            }}
          >
            {p}
          </Text>
        ))}

        <View style={{ marginTop: spacing[16] }}>
          <PrimaryPillButton
            label="Continue to prayer"
            onPress={requestAdvance}
          />
        </View>

        {expanded ? (
          <Text
            style={{
              color: colors.inkMuted,
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 12,
              lineHeight: 16,
              letterSpacing: 0.4,
              textAlign: "center",
              marginTop: spacing[12],
            }}
          >
            or swipe down to continue
          </Text>
        ) : null}
      </ScrollView>
    </AppleSheet>
  );
}
