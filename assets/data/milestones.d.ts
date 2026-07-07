export type MilestoneType = "MARKER" | "BLESSING";

/** Display category for the streaks grid — color-coded per design spec. */
export type MilestoneCategory =
  | "JOURNEY"
  | "REFLECTION"
  | "PRAYER"
  | "BLESSING"
  | "MARKER";

export type Milestone = {
  day: number;
  type: MilestoneType;
  title: string;
  verse: string;
  reference: string;
  message: string;
};

export declare const milestones: ReadonlyArray<Milestone>;
export default milestones;
