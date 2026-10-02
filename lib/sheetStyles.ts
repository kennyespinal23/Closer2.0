import { type TextStyle } from "react-native";
import { SF_PRO, systemText } from "@/lib/typography";

/** Semantic sheet roles. Sizes remain scalable with the device text setting. */
export const sheetText = {
  title: { fontFamily: SF_PRO, fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -.4 } satisfies TextStyle,
  navigationTitle: systemText.headline,
  section: { ...systemText.footnote, fontWeight: "600" } satisfies TextStyle,
  row: systemText.body,
  supporting: systemText.subheadline,
  metadata: systemText.footnote,
  action: { ...systemText.body, fontWeight: "600", lineHeight: 22 } satisfies TextStyle,
};
export const sheetSpace = { horizontal: 24, top: 32, section: 24, item: 12, text: 4, bottom: 32 } as const;
