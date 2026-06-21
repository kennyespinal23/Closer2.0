import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { getSermonBackdrop } from "@/services/unsplashService";
import { useMoments } from "@/state/moments";
import { useColors, useResolvedScheme } from "@/state/theme";

/** Strong enough to feel atmospheric; prose stays the focus. */
const BLUR_INTENSITY = 68;

/**
 * Soft Unsplash wash for in-sermon reading screens.
 *
 * Reuses the same cached `getSermonBackdrop` image as home +
 * scripture so the day's photo threads through the flow — but
 * blurs + dims it so panel copy stays legible. Intentionally
 * NOT mounted on home or scripture; those keep the sharp photo.
 */
export function SermonBlurredBackdrop() {
  const { todaysMoment } = useMoments();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const isDark = scheme === "dark";
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query =
      todaysMoment.illustrationPrompt?.trim() ||
      "peaceful spiritual nature landscape";
    getSermonBackdrop(query, todaysMoment.day).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [todaysMoment.day, todaysMoment.illustrationPrompt]);

  const overlayColor = isDark
    ? "rgba(0, 0, 0, 0.62)"
    : "rgba(250, 247, 242, 0.8)";

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]}
    >
      {imageUrl ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={[
              StyleSheet.absoluteFillObject,
              { transform: [{ scale: 1.08 }] },
            ]}
            contentFit="cover"
            transition={400}
            accessibilityIgnoresInvertColors
          />
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={BLUR_INTENSITY}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDark
                    ? "rgba(0, 0, 0, 0.4)"
                    : "rgba(255, 255, 255, 0.3)",
                },
              ]}
            />
          )}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: overlayColor },
            ]}
          />
        </>
      ) : null}
    </View>
  );
}
