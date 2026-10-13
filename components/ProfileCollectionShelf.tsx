import { StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Text } from "@/components/CloserText";
import { useColors } from "@/state/theme";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { GILT, MOMENTS_IN_ORDER } from "@/lib/momentOrder";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { SFSymbol } from "./Symbol";

/** Profile's door into the Bible Moments album: a small copy of the album's cover. */
export function ProfileCollectionShelf() {
  const colors = useColors(), router = useRouter();
  const { ids, collectedAt } = useBibleMomentCollection();
  const latest = [...ids].sort((a, b) => (collectedAt[b] ?? 0) - (collectedAt[a] ?? 0)).slice(0, 3)
    .map(id => MOMENTS_IN_ORDER.find(m => m.id === id)).filter(m => !!m);
  const open = () => { haptics.soft(); router.push("/rhythm?section=moments" as Href); };
  return <View style={{ margin: 20, marginTop: 32, gap: 14 }}>
    <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 22, fontWeight: "700" }}>Bible Moments</Text>
    <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Open your Bible Moments album. ${ids.length} of ${MOMENTS_IN_ORDER.length} collected`} onPress={open} style={s.card}>
      <ReaderMaterialGradient colors={["#5A3526", "#3A2219", "#24140E"]} locations={[0, .5, 1]} style={StyleSheet.absoluteFill}/>
      <View accessible={false} style={{ width: 96, height: 76 }}>
        {[1, 2, 0].map(slot => {
          const m = latest[slot];
          const pos = slot === 0 ? { left: 26, top: 0, rotate: "-3deg", z: 2 } : slot === 1 ? { left: 0, top: 8, rotate: "-12deg", z: 1 } : { left: 52, top: 8, rotate: "10deg", z: 1 };
          return <View key={slot} style={{ position: "absolute", left: pos.left, top: pos.top, width: 44, height: 60, zIndex: pos.z, transform: [{ rotate: pos.rotate }], borderRadius: 8, overflow: "hidden", padding: 2, backgroundColor: GILT[1], boxShadow: "0 8px 12px -6px #000000AA" }}>
            <ReaderMaterialGradient colors={GILT} locations={[0, .35, .55, 1]} horizontal style={StyleSheet.absoluteFill}/>
            <View style={{ flex: 1, borderRadius: 6, overflow: "hidden", backgroundColor: "#3A2219" }}>{m ? <ReaderMomentArt moment={m}/> : null}</View>
          </View>;
        })}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...uiText.screenTitle, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: "#E9B949" }}>{ids.length}</Text>
        <Text style={{ ...uiText.supporting, fontWeight: "800", color: "#FFF1E4" }}>of {MOMENTS_IN_ORDER.length} collected</Text>
        <Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, color: "#D8BDA5" }}>{ids.length ? "Open your album" : "Your first one is waiting in Genesis"}</Text>
      </View>
      <SFSymbol name="chevron.right" size={15} color="#FFF1E4"/>
    </Pressable>
  </View>;
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderCurve: "continuous", overflow: "hidden", padding: 18, flexDirection: "row", alignItems: "center", gap: 16 },
});
