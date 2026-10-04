import { StyleSheet } from "react-native";

/** Shared search geometry from the Library reference. Colors come from each theme. */
export const searchStyles = StyleSheet.create({
  field: { minHeight: 48, borderRadius: 24, borderCurve: "continuous", borderWidth: 1,
    paddingLeft: 16, paddingRight: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  text: { flex: 1, minHeight: 44, paddingVertical: 10, paddingHorizontal: 0,
    fontSize: 16, lineHeight: 24, fontWeight: "700", textAlignVertical: "center" },
});
