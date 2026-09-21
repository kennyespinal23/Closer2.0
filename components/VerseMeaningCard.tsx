import { useEffect, useRef } from "react";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppleSheet } from "@/components/AppleSheet";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Preview surface; no verse text is sent to a service. */
export function VerseMeaningCard({ visible, onClose, reference, passage }: {
  visible: boolean;
  onClose: () => void;
  reference: string;
  passage: string;
}) {
  const colors = useColors();
  const dark = useResolvedScheme() === "dark";
  const reducedMotion = useReducedMotion();
  const sheet = useRef<TrueSheet>(null);
  const presented = useRef(false);
  useEffect(() => {
    if (visible) {
      presented.current = true;
      void sheet.current?.present(0, !reducedMotion);
    } else if (presented.current) {
      presented.current = false;
      void sheet.current?.dismiss(!reducedMotion);
    }
  }, [visible, reducedMotion]);
  return (
    <AppleSheet
      ref={sheet}
      onClose={onClose}
      detents={[0.65, 1]}
      backgroundColor={dark ? "#242424E8" : "#F5F1E9ED"}
      backgroundBlur={dark ? "dark" : "light"}
      scrollable
    >
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }}>
        <SFSymbol name="sparkles" size={20} color={colors.ink} />
        <Text accessibilityRole="header" style={{ flex: 1, marginLeft: 10, color: colors.ink, fontSize: 18, fontWeight: "600" }}>Verse meaning</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close verse meaning" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="xmark" size={16} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 44 }}>
        <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "700", marginTop: 16, marginBottom: 14 }}>{reference}</Text>
        <Text selectable style={{ color: colors.inkMuted, fontSize: 19, lineHeight: 29 }}>{passage}</Text>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 28 }} />
        <Text style={{ color: colors.inkMuted, fontSize: 12, letterSpacing: 1.5, fontWeight: "600", marginBottom: 12 }}>CLOSER AI · PREVIEW</Text>
        <Text style={{ color: colors.ink, fontSize: 23, fontWeight: "600", marginBottom: 10 }}>Go deeper into the Word</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 17, lineHeight: 26 }}>Explore what this passage means, its context, and how it connects to everyday life.</Text>
        <View style={{ backgroundColor: colors.border, borderRadius: 18, padding: 18, marginTop: 24 }}>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "600", marginBottom: 6 }}>Explanations are coming soon</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 22 }}>This is a preview. AI explanations aren’t available yet.</Text>
        </View>
      </ScrollView>
    </AppleSheet>
  );
}
