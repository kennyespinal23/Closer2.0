import type { LabTag } from "./types";

/* Faith & Science: the Discovery Lab's palette, in one place. The Explore band is a warm observatory amber; inside,
   the lab is the night sky, and every finding wears the colour of what kind of claim it is. */
export const LAB = {
  /** the Explore band, and its ink */
  band: "#F0A73A",
  bandInk: "#2B1A08",
  /** the lab: deep space, a raised panel, type */
  space: "#0D1230",
  panel: "#1A2150",
  light: "#F2F4FF",
  ink: "#0D1230",
  /** the hot, dense early universe */
  hot: "#FF9A3C",
  /** light stretched to the red */
  red: "#FF6B5B",
};

/* What kind of claim a finding is: something seen, a model built on it, what people take it to mean, or still open */
export const TAG_STYLE: Record<LabTag, { label: string; color: string }> = {
  observation: { label: "Observation", color: "#6FE3FF" },
  model: { label: "Scientific model", color: "#FFB547" },
  interpretation: { label: "Interpretation", color: "#C9A8FF" },
  open: { label: "Open question", color: "#AEB6D9" },
};
