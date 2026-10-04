import { type TextStyle } from "react-native";
import { SF_PRO, systemText, uiText } from "@/lib/typography";

/** Semantic sheet roles. Sizes remain scalable with the device text setting. */
export const sheetText = {
  title: uiText.sectionTitle,
  navigationTitle: systemText.headline,
  section: { ...systemText.footnote, fontWeight: "600" } satisfies TextStyle,
  row: systemText.body,
  supporting: systemText.subheadline,
  metadata: systemText.footnote,
  action: { ...systemText.body, fontWeight: "600", lineHeight: 22 } satisfies TextStyle,
};
export const sheetSpace = { horizontal: 24, top: 32, section: 24, item: 12, text: 4, bottom: 32 } as const;
