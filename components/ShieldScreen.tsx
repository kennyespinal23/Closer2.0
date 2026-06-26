import { useMemo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { BrandGlyph } from "@/components/BrandGlyph";
import { Button } from "@/components/Button";
import { SFSymbol } from "@/components/Symbol";
import { findSocialApp } from "@/lib/focus";
import {
  SHIELD_EYEBROW,
  shieldBodyForApp,
  shieldFooterTagline,
  shieldHeadline,
} from "@/lib/shieldCopy";
import { typography } from "@/lib/typography";

/**
 * ShieldScreen — the full-screen "app is blocked" treatment.
 *
 * This is the design anchor for what users see when Screen Time
 * intercepts a launch. ShieldOverlay and onboarding preview both
 * compose this component so the in-app preview matches the native
 * iOS shield as closely as Apple allows from JS.
 *
 * Native shield (ShieldConfiguration extension) uses the same copy
 * from lib/shieldCopy.ts via configureCloserShieldUI().
 */

export type ShieldScreenProps = {
  /** Catalog id (instagram, tiktok, …) when known. */
  appId?: string;
  /** Override when the blocked target isn't in our catalog. */
  appDisplayName?: string;
  /** Primary CTA label — "OK" mirrors the native shield button. */
  primaryLabel?: string;
  onPrimaryPress: () => void;
  /** Optional secondary action (e.g. End focus). */
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** `device` = black canvas like iOS Screen Time; `inApp` = theme bg. */
  variant?: "device" | "inApp";
  style?: ViewStyle;
};

const DEVICE_BG = "#000000";
const DEVICE_INK = "#FFFFFF";
const DEVICE_MUTED = "rgba(255, 255, 255, 0.62)";
const DEVICE_SUBTLE = "rgba(255, 255, 255, 0.42)";
const LOCK_DISC = "rgba(255, 255, 255, 0.12)";

export function ShieldScreen({
  appId,
  appDisplayName,
  primaryLabel = "OK",
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  variant = "device",
  style,
}: ShieldScreenProps) {
  const app = useMemo(
    () => (appId ? findSocialApp(appId) : null),
    [appId],
  );
  const name = appDisplayName ?? app?.name ?? "This app";
  const brandColor = app?.color ?? "#4285F4";
  const body = appId ? shieldBodyForApp(appId) : shieldBodyForApp("instagram");

  const isDevice = variant === "device";
  const bg = isDevice ? DEVICE_BG : undefined;
  const ink = isDevice ? DEVICE_INK : undefined;
  const muted = isDevice ? DEVICE_MUTED : undefined;
  const subtle = isDevice ? DEVICE_SUBTLE : undefined;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[{ flex: 1, backgroundColor: bg }, style]}
    >
      <View className="flex-1 px-6 items-center justify-center">
        {/* Lock + app glyph stack */}
        <View className="items-center justify-center mb-8">
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BrandHalo color={brandColor} fadeTo={bg ?? "#000"} />
          </View>

          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: LOCK_DISC,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <SFSymbol
              name="lock.shield.fill"
              size={24}
              color={DEVICE_INK}
              weight="semibold"
            />
          </View>

          {app ? (
            <BrandGlyph appId={app.id} size="xl" />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 22,
                backgroundColor: brandColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SFSymbol
                name="app.fill"
                size={40}
                color="#FFFFFF"
                weight="regular"
              />
            </View>
          )}
        </View>

        {/* Eyebrow */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-5 h-[1.5px] rounded-full mr-2.5"
            style={{ backgroundColor: subtle ?? "rgba(128,128,128,0.4)" }}
          />
          <Text
            style={[
              typography.smallLabel,
              {
                color: subtle,
                textTransform: "uppercase",
                letterSpacing: 2.5,
              },
            ]}
          >
            {SHIELD_EYEBROW}
          </Text>
          <View
            className="w-5 h-[1.5px] rounded-full ml-2.5"
            style={{ backgroundColor: subtle ?? "rgba(128,128,128,0.4)" }}
          />
        </View>

        <Text
          style={[
            typography.devotionalTitle,
            {
              color: ink,
              textAlign: "center",
              fontSize: 28,
              lineHeight: 34,
            },
          ]}
        >
          {shieldHeadline(name)}
        </Text>

        <Text
          style={[
            typography.body,
            {
              color: muted,
              textAlign: "center",
              marginTop: 16,
              maxWidth: 320,
            },
          ]}
        >
          {body}
        </Text>
      </View>

      <View className="px-6 pb-4">
        {isDevice ? (
          <Pressable
            onPress={onPrimaryPress}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.14)",
              paddingVertical: 16,
              alignItems: "center",
            })}
          >
            <Text style={[typography.button, { color: DEVICE_INK }]}>
              {primaryLabel}
            </Text>
          </Pressable>
        ) : (
          <Button label={primaryLabel} onPress={onPrimaryPress} />
        )}

        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
            className="rounded-2xl py-3.5 mt-2.5 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              style={[
                typography.body,
                {
                  fontWeight: "600",
                  fontSize: 14,
                  color: subtle,
                },
              ]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}

        <Text
          style={[
            typography.smallLabel,
            {
              color: subtle,
              textAlign: "center",
              marginTop: 14,
              fontWeight: "500",
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 12,
            },
          ]}
        >
          {shieldFooterTagline()}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function BrandHalo({
  color,
  fadeTo,
}: {
  color: string;
  fadeTo: string;
}) {
  return (
    <Svg width={280} height={280} viewBox="0 0 280 280">
      <Defs>
        <RadialGradient id="shieldHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={fadeTo} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={280} height={280} fill="url(#shieldHalo)" />
    </Svg>
  );
}
