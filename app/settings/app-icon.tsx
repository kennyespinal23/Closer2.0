import { useEffect, useState } from "react";
import { Alert, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { SettingsScaffold } from "@/components/SettingsScaffold";
import { SFSymbol } from "@/components/Symbol";
import { APP_ICONS } from "@/constants/appIcons";
import { useColors } from "@/state/theme";
import { uiText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";

type IconsModule = { supportsAlternateIcons: boolean; setAlternateAppIcon: (name: string | null) => Promise<string | null>; getAppIconName: () => string | null };

/** The native module only exists in builds made after the icons were added; older builds show a note instead of crashing. */
function loadIcons(): IconsModule | null {
  try { return require("expo-alternate-app-icons") as IconsModule; } catch { return null; }
}

const ORIGINAL = { id: null as string | null, label: "Original", thumb: require("@/assets/icon.png") };

/** Pick the Closer icon on your home screen. */
export default function AppIconScreen() {
  const c = useColors(), { width } = useWindowDimensions();
  const [mod] = useState(loadIcons);
  const supported = !!mod?.supportsAlternateIcons;
  const [current, setCurrent] = useState<string | null>(null), [busy, setBusy] = useState(false);
  useEffect(() => { try { setCurrent(mod?.getAppIconName() ?? null); } catch { /* older build */ } }, [mod]);
  const size = (width - 40 - 3 * 16) / 4;
  const choose = async (id: string | null) => {
    if (!mod || !supported || busy || id === current) return;
    haptics.soft(); setBusy(true);
    try { await mod.setAlternateAppIcon(id); setCurrent(id); }
    catch { Alert.alert("Couldn’t change the icon", "Please try again in a moment."); }
    finally { setBusy(false); }
  };
  return <SettingsScaffold title="App icon">
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={{ ...uiText.supporting, color: c.inkMuted, marginTop: 8, marginBottom: 18 }}>
        {supported ? "Choose how Closer looks on your home screen. iOS will confirm the change." : "Changing the icon needs the latest version of Closer. Update the app to choose one."}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {[ORIGINAL, ...APP_ICONS].map(icon => { const on = icon.id === current; return <Pressable key={icon.label} feedback="action" accessibilityRole="button" accessibilityLabel={`${icon.label} icon`} accessibilityState={{ selected: on, disabled: !supported }}
          onPress={() => void choose(icon.id)} style={{ width: size, alignItems: "center", opacity: supported ? 1 : .5 }}>
          <View style={{ width: size, height: size, borderRadius: size * .225, borderCurve: "continuous", overflow: "hidden", boxShadow: on ? `0 0 0 3px ${c.bg}, 0 0 0 5.5px ${c.ink}` : "0 6px 12px -6px #0006" }}>
            <Image source={icon.thumb} contentFit="cover" style={{ width: "100%", height: "100%" }}/>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
            {on && <SFSymbol name="checkmark.circle.fill" size={12} color={c.ink}/>}
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: on ? "800" : "600", color: on ? c.ink : c.inkMuted }}>{icon.label}</Text>
          </View>
        </Pressable>; })}
      </View>
    </View>
  </SettingsScaffold>;
}
