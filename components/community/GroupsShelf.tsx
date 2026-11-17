import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { K, nunito } from "@/components/closer/kit";
import { GroupCover } from "./CommunityScreen";
import { GroupPage } from "./GroupPage";
import { CreateStudyGroup } from "./CreateStudyGroup";
import { useCommunity } from "@/state/community";
import * as haptics from "@/lib/haptics";
import { plural, useStrings } from "@/lib/i18n";

/**
 * Your groups, under You (CLOSER-PICKS.md, "After the films: only the prayer wall; groups live under You"): each
 * group on its book's painted cover, and a tile to start one. Opening a group shows its question and replies; Read goes
 * to the chapter.
 */
export function GroupsShelf() {
  const router = useRouter();
  const { state, hydrated, update } = useCommunity();
  const [groupId, setGroupId] = useState<string | null>(null), [creating, setCreating] = useState(false);
  const pendingRead = useRef<{ bookId: string; chapter: number } | null>(null);
  const group = state.groups.find(g => g.id === groupId);
  const joined = state.groups.filter(g => g.joined);
  const t = useStrings().native.groups;
  const close = () => {
    setGroupId(null);
    const target = pendingRead.current; pendingRead.current = null;
    if (target) setTimeout(() => router.push(`/book/${target.bookId}/${target.chapter}` as never), Platform.OS === "ios" ? 450 : 0);
  };

  return (
    <View style={{ marginTop: 40 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text accessibilityRole="header" style={nunito(900, 22, { color: K.ink, letterSpacing: -0.4 })}>{t.title}</Text>
        <Text style={nunito(800, 13.5, { color: K.inkFaint })}>{plural(joined.length, t.reading)}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 12, paddingBottom: 6 }}>
        {joined.map(g => <GroupCover key={g.id} group={g} small onOpen={() => setGroupId(g.id)} />)}
        <Pressable accessibilityRole="button" accessibilityLabel={t.start} disabled={!hydrated} onPress={() => { haptics.soft(); setCreating(true); }}
          style={{ width: 120, height: 240, borderRadius: 24, backgroundColor: K.creamDeep, alignItems: "center", justifyContent: "center", gap: 10 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: K.cream, alignItems: "center", justifyContent: "center" }}><Text style={nunito(900, 24, { color: K.ink })}>+</Text></View>
          <Text style={nunito(900, 14, { color: K.ink, textAlign: "center", lineHeight: 18 })}>{t.startTile}</Text>
        </Pressable>
      </ScrollView>
      {group && <GroupPage key={group.id} group={group} onClose={close} onChange={g => update(s => ({ ...s, groups: s.groups.map(old => old.id === g.id ? g : old) }))}
        onRead={() => { pendingRead.current = { bookId: group.bookId, chapter: group.chapter }; close(); }} />}
      {creating && <CreateStudyGroup onClose={() => setCreating(false)} onSave={g => { update(s => ({ ...s, groups: [g, ...s.groups] })); setCreating(false); setGroupId(g.id); }} />}
    </View>
  );
}
