export type MilestoneType = "MARKER" | "BLESSING";

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
