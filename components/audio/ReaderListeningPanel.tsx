import { Text, View } from "react-native";
import { Image } from "expo-image";
import { ReaderSheet } from "@/components/ReaderSheet";
import { ReaderNativeButton } from "@/components/ReaderNativeButton";
import { getBookCover } from "@/constants/bookCovers";
import { useColors } from "@/state/theme";

/** In-reader audio entry point. Playback stays unavailable until recordings exist. */
export function ReaderListeningPanel({ visible, onClose, bookId, bookName, chapter }: {
  visible: boolean; onClose: () => void; bookId: string; bookName: string; chapter: number;
}) {
  const colors = useColors();
  return <ReaderSheet visible={visible} onClose={onClose} detents={["auto"]} grabber>
    <View style={{ padding: 24, gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Image source={getBookCover(bookId)} contentFit="cover" style={{ width: 48, height: 64, borderRadius: 10 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 19, fontWeight: "600" }}>{bookName}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>Chapter {chapter} · Bible Audio</Text>
        </View>
        <ReaderNativeButton label="Close listening panel" symbol="xmark" onPress={onClose} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <ReaderNativeButton label="Play narration. Coming soon" symbol="play.fill" disabled onPress={() => {}} />
        <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}>Narration coming soon</Text><Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>Listen from this chapter when recordings are available.</Text></View>
      </View>

    </View>
  </ReaderSheet>;
}
