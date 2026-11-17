import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { type ReactNode } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { SFSymbol } from "@/components/Symbol";
import { K, nunito } from "@/components/closer/kit";
import { closerPage, useCloserPage } from "@/state/closerPage";
import { isInternalBuild } from "@/lib/isInternalBuild";
import { useDevAppReset } from "@/lib/useDevAppReset";
import { chooseLocale, LOCALES, useLocale, useStrings } from "@/lib/i18n";

/** Settings, behind the gear on You (CLOSER-PICKS.md, "You tab": settings is a gear, never a section). */
export default function CloserSettingsScreen() {
  const router = useRouter(), insets = useSafeAreaInsets();
  const { settings } = useCloserPage();
  const { resetApp, restartApp } = useDevAppReset();
  const s = useStrings().native.settings;
  const lang = useLocale();
  const clear = () => Alert.alert(s.clearTitle, s.clearBody, [
    { text: s.cancel, style: "cancel" },
    { text: s.delete, style: "destructive", onPress: () => closerPage.clear() },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.back} onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: K.creamDeep, alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="chevron.left" size={17} weight="bold" color={K.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={nunito(900, 32, { color: K.ink, letterSpacing: -0.8, lineHeight: 40, marginTop: 14 })}>{s.title}</Text>
        <Group title={s.reading}>
          <Row label={s.translation} value={s.translationName} />
          <Row label={s.reminder} sub={settings.reminder ? s.reminderTime : s.off}>
            <Toggle on={settings.reminder} label={s.reminder} onChange={v => closerPage.settings({ reminder: v })} />
          </Row>
        </Group>
        <Group title={s.comfort}>
          <Row label={s.largeText} sub={s.largeTextSub}>
            <Toggle on={settings.largeText} label={s.largeText} onChange={v => closerPage.settings({ largeText: v })} />
          </Row>
          <Row label={s.reduceMotion} sub={s.reduceMotionSub}>
            <Toggle on={settings.reduceMotion} label={s.reduceMotion} onChange={v => closerPage.settings({ reduceMotion: v })} />
          </Row>
          <Row label={s.sounds} sub={s.soundsSub}>
            <Toggle on={settings.sound} label={s.sounds} onChange={v => closerPage.settings({ sound: v })} />
          </Row>
        </Group>
        <Group title={s.more}>
          <Row label={s.all} onPress={() => router.push("/settings" as never)} chevron />
        </Group>
        {isInternalBuild() && (
          <Group title="Developer · testing only">
            <Row label="Developer tools" sub="Night prayer, readings, quotes, badges" onPress={() => router.push("/settings/developer" as never)} chevron />
            <Row label="QA shortcuts" sub="Previews and tutorials (the old Profile page)" onPress={() => router.push("/profile" as never)} chevron />
            <Row label="Streak demo" sub="Open the streak page with a 12-day streak" onPress={() => router.push("/streak?demo=12" as never)} chevron />
            <Row label="Restart app" sub="Reload from the start" onPress={() => void restartApp()} chevron />
            <Row label="Reset app" sub="Wipe everything on this device and start fresh" onPress={() => Alert.alert("Reset the app?", "Everything stored on this device is wiped and the app starts fresh. This can’t be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Reset", style: "destructive", onPress: () => void resetApp() }])} danger />
          </Group>
        )}
        {isInternalBuild() && (
          // testing only until the Spanish lists are written; Test text shows every translatable word accented and longer
          <Group title="Language · testing only">
            {LOCALES.map(l => <Row key={l.id} label={l.name} sub={l.test ? "Plain English left on screen isn’t in a list yet" : undefined} value={lang === l.id ? "✓" : undefined} onPress={() => chooseLocale(l.id)} />)}
          </Group>
        )}
        <Group title={s.privacy}>
          <Row label={s.clearRow} sub={s.clearSub} onPress={clear} danger />
        </Group>
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <Text style={nunito(800, 13, { color: K.inkFaint, letterSpacing: 1.8, marginLeft: 4 })}>{title.toUpperCase()}</Text>
      <View style={{ marginTop: 10, borderRadius: 22, backgroundColor: K.creamDeep, overflow: "hidden" }}>{children}</View>
    </View>
  );
}

function Row({ label, sub, value, children, onPress, chevron, danger }: { label: string; sub?: string; value?: string; children?: ReactNode; onPress?: () => void; chevron?: boolean; danger?: boolean }) {
  const body = (
    <View style={{ minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: K.creamLine }}>
      <View style={{ flex: 1 }}>
        <Text style={nunito(800, 17, { color: danger ? K.redPress : K.ink })}>{label}</Text>
        {!!sub && <Text style={nunito(700, 13.5, { color: K.inkFaint })}>{sub}</Text>}
      </View>
      {!!value && <Text style={nunito(700, 15, { color: K.inkSoft })}>{value}</Text>}
      {chevron && <Text style={nunito(800, 20, { color: K.inkFaint })}>›</Text>}
      {children}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} >{body}</Pressable> : body;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const knob = useAnimatedStyle(() => ({ left: withSpring(on ? 27 : 3, { stiffness: 600, damping: 32 }) }), [on]);
  return (
    <Pressable onPress={() => onChange(!on)} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      style={{ width: 58, height: 34, borderRadius: 17, backgroundColor: on ? K.forest : "#D8C8AF" }}>
      <Animated.View style={[{ position: "absolute", top: 3, width: 28, height: 28, borderRadius: 14, backgroundColor: K.cream }, knob]} />
    </Pressable>
  );
}
