import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { PIXEL_HTML } from "@/lib/interactive/pixelHtml";

/**
 * Pixel stories (a test, internal builds only): a day's devotional told over a
 * living pixel scene. The verse first (World English Bible), then the day's own
 * words, then Closer steps aside. Opened from "Step in" on Today with ?day=N.
 *
 * The player is one self-contained page (lib/interactive/pixelHtml.ts), generated
 * from the Closer Lounge prototype by `npm run build:app-pixel` there. The app
 * tells it which day before it loads; it sends { type: "close" } when the reader
 * is done, so the app only opens it and takes it down. `today` keeps later days
 * closed in the player's Daily list, as they are in "Your weeks".
 */
export default function PixelScreen() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day?: string }>();
  const n = Number.parseInt(day ?? "", 10);
  const host = useMemo(() => `window.PIX_HOST = ${JSON.stringify({ app: true, day: Number.isFinite(n) ? n : null, today: Number.isFinite(n) ? n : null })}; true;`, [n]);
  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg?.type === "close") router.back();
      } catch {
        // not one of ours
      }
    },
    [router],
  );
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WebView
        source={{ html: PIXEL_HTML, baseUrl: "https://closer.app/pixel/" }}
        injectedJavaScriptBeforeContentLoaded={host}
        originWhitelist={["*"]}
        onMessage={onMessage}
        style={styles.web}
        containerStyle={styles.web}
        // full bleed: the page handles the safe areas itself (viewport-fit=cover)
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        // the scene's sound and soft music start without waiting for a tap
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        accessibilityLabel={`Day ${Number.isFinite(n) ? n : ""} as a pixel story`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  web: { flex: 1, backgroundColor: "#000000" },
});
