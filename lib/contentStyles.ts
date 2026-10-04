import { SCREEN_H_PAD } from "./layout";
import { type ViewStyle } from "react-native";
import { spacing } from "@/constants/spacing";
import { systemText, typography } from "@/lib/typography";

/** Shared content roles. Colors stay semantic and are supplied by the theme. */
export const contentText = {
  section: systemText.title2,
  title: systemText.headline,
  description: systemText.subheadline,
  metadata: systemText.footnote,
  action: typography.button,
};

/** Content surfaces only; native sheets, artwork and controls keep their own geometry. */
export const contentLayout = {
  gutter: SCREEN_H_PAD,
  sectionGap: spacing[24],
  itemGap: spacing[12],
  textGap: spacing[4],
  card: { padding: spacing[16], borderRadius: 24, borderCurve: "continuous" } satisfies ViewStyle,
  spaciousCard: { padding: spacing[24], borderRadius: 24, borderCurve: "continuous" } satisfies ViewStyle,
};
