import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Page } from "@/components/page/Page";
import { K, Title, nunito } from "@/components/closer/kit";
import { closerPage, useCloserPage } from "@/state/closerPage";

/**
 * You: a few preferences and nothing else, as in the prototype. The rest of Closer (the Bible, Community, the full
 * settings) stays one tap away under “More in Closer”.
 */
export default function YouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useCloserPage();
  const [n, setN] = useState(0);
  const clear = () => Alert.alert("Delete what’s stored on this device?", "Your finished lessons, saved verses and kept reflections will be removed from this phone. This can’t be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => closerPage.clear() },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Title>You</Title>
        <Group title="Reading">
          <Row label="Bible translation" value="World English Bible" />
          <Row label="Daily reminder" sub={settings.reminder ? "8:00 AM" : "Off"}>
            <Toggle on={settings.reminder} label="Daily reminder" onChange={v => closerPage.settings({ reminder: v })} />
          </Row>
        </Group>
        <Group title="Comfort">
          <Row label="Larger Scripture text" sub="Verses and Page’s words get bigger">
            <Toggle on={settings.largeText} label="Larger Scripture text" onChange={v => closerPage.settings({ largeText: v })} />
          </Row>
          <Row label="Reduce motion" sub="Page still moves, just less">
            <Toggle on={settings.reduceMotion} label="Reduce motion" onChange={v => closerPage.settings({ reduceMotion: v })} />
          </Row>
        </Group>
        <Group title="More in Closer">
          <Row label="Read the Bible" onPress={() => router.push("/library" as never)} chevron />
          <Row label="Community" onPress={() => router.push("/community" as never)} chevron />
          <Row label="All settings" onPress={() => router.push("/settings" as never)} chevron />
        </Group>
        <Group title="Privacy">
          <Row label="Delete what’s stored on this device" sub="Finished lessons, saved verses, reflections" onPress={clear} danger />
        </Group>
        <View style={{ alignItems: "center", paddingTop: 48 }}>
          <Page size={78} mood={n % 2 ? "happy" : "neutral"} act={n ? "spin" : "idle"} actKey={n} onTap={() => setN(n + 1)} />
          <Text style={nunito(700, 15, { color: K.inkSoft, fontStyle: "italic", textAlign: "center", marginTop: 12, maxWidth: 240 })}>The Lord is always closer than you think.</Text>
        </View>
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
