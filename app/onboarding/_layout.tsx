import { View } from "react-native";
import { Stack } from "expo-router";
import { OnboardingAtmosphere } from "@/components/OnboardingAtmosphere";
import { useColors } from "@/state/theme";

/**
 * Onboarding stack layout.
 *
 * Renders a shared iOS-blue ambient atmosphere across every
 * onboarding screen so the flow feels like a single lit space
 * rather than a sequence of plain black canvases.
 *
 * Layering (critical — this fixes a transition bug):
 *
 *   The Stack's contentStyle is OPAQUE (set to colors.bg) so
 *   that during slide_from_right transitions the incoming
 *   screen fully covers the outgoing one. The previous setup
 *   used a transparent contentStyle so the atmosphere below
 *   could paint through — but most onboarding screens don't
 *   paint their own background, so during the slide you could
 *   see straight through the new screen to the previous one,
 *   producing a 200-300ms "two pages overlapping" ghost frame
 *   that read as broken.
 *
 *   To keep the ambient glow despite the opaque screens, the
 *   OnboardingAtmosphere now renders ABOVE the Stack as a
 *   pointerEvents:none overlay. Its alphas are low enough
 *   (max 0.16 at center, falling to 0) that it functions as a
 *   soft tinting layer rather than obscuring content. It still
 *   gives the whole flow the same "lit canvas" identity.
 *
 * Per-screen ambient overrides (proof's amber wash, etc.) layer
 * their own absolutely-positioned gradient inside their screen
 * — those paint UNDER this overlay, which is fine since the
 * overlay is so faint the per-screen wash still reads.
 *
 * Narrative-beat screens (stat / calculating / punch / paywall)
 * that paint their own full-bleed backgrounds keep doing so —
 * their backgrounds sit under the ambient overlay too, so the
 * "cold" identity reads through with only a hint of warmth.
 */
export default function OnboardingLayout() {
  const { bg } = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // Opaque so the slide-in fully covers the outgoing
          // screen. Without this the unpainted screens (apps,
          // scrolltime, etc.) became see-through during the
          // animation and the previous page bled through.
          contentStyle: { backgroundColor: bg },
          animation: "slide_from_right",
        }}
      />
      {/* Atmosphere on top, non-interactive. Faint enough to
          read as ambient lighting, not as a sheet covering the
          screen. */}
      <OnboardingAtmosphere />
    </View>
  );
}
