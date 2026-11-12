import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { STORIES_HTML } from "@/lib/interactive/storiesHtml";

/**
 * Interactive stories: guided conversations with Jesus in lit 3D rooms.
 *
 * The stories, their engine and three.js are one self-contained page
 * (lib/interactive/storiesHtml.ts), generated from the Closer Lounge
 * prototype by `npm run build:app-stories` there. It runs offline in
 * this full-screen web view; the page draws its own close button and
 * sends { type: "close" } when the reader leaves, so the app only has
 * to open it and take it down.
 */
export default function StoriesScreen() {
  const router = useRouter();
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
        source={{ html: STORIES_HTML, baseUrl: "https://closer.app/stories/" }}
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
        // sound starts from the reader's own tap on Begin
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        accessibilityLabel="Interactive stories"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  web: { flex: 1, backgroundColor: "#000000" },
});
