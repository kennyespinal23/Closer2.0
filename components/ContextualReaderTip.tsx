import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FeedbackPressable } from "./FeedbackPressable";
import { SFSymbol } from "./Symbol";
/** A dismissible tip at the point of use; never interrupts the reader. */
export function ContextualReaderTip({ id, text, color }: { id: string; text: string; color: string }) {
  const [visible, setVisible] = useState(false);
  const key = `closer.reader-tip.${id}.v1`;
  useEffect(() => { let live = true; AsyncStorage.getItem(key).then(value => { if (live) setVisible(value !== "seen"); }).catch(() => {}); return () => { live = false; }; }, [key]);
  if (!visible) return null;
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 }}><Text style={{ color, fontSize: 13, lineHeight: 18, flex: 1 }}>{text}</Text><FeedbackPressable accessibilityRole="button" accessibilityLabel="Dismiss tip" onPress={() => { setVisible(false); void AsyncStorage.setItem(key, "seen").catch(() => {}); }} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={12} color={color}/></FeedbackPressable></View>;
}
