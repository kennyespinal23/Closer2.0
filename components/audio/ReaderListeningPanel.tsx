import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { AppleSheet } from "@/components/AppleSheet";
import { SFSymbol } from "@/components/Symbol";
import { getBookCover } from "@/constants/bookCovers";
import { useColors } from "@/state/theme";

/** In-reader audio entry point. Playback stays unavailable until recordings exist. */
export function ReaderListeningPanel({ visible, onClose, bookId, bookName, chapter }: {
  visible: boolean; onClose: () => void; bookId: string; bookName: string; chapter: number;
}) {
  const colors = useColors();
  return <AppleSheet visible={visible} onClose={onClose} detents={["auto"]} grabber backgroundColor={colors.surface}>
    <View style={{ padding: 24, gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Image source={getBookCover(bookId)} contentFit="cover" style={{ width: 48, height: 64, borderRadius: 10 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 19, fontWeight: "600" }}>{bookName}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>Chapter {chapter} · Bible Audio</Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close listening panel" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={16} color={colors.ink} /></Pressable>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Pressable disabled accessibilityRole="button" accessibilityLabel="Play narration. Coming soon" accessibilityState={{ disabled: true }} style={{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary }}><SFSymbol name="play.fill" size={22} color={colors.inkMuted} /></Pressable>
        <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}>Narration coming soon</Text><Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>Listen from this chapter when recordings are available.</Text></View>
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", padding: 12 }}><Text style={{ color: colors.bg, fontSize: 16, fontWeight: "600" }}>Keep reading</Text></Pressable>
    </View>
  </AppleSheet>;
}
