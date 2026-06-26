export type RotatingMomentCategory = "morning" | "evening" | "neutral";

export type RotatingMomentEntry = {
  id: string;
  text: string;
  hasName: boolean;
};

export type RotatingMoment = RotatingMomentEntry & {
  text: string;
};

export const rotatingMoments: Record<
  RotatingMomentCategory,
  ReadonlyArray<RotatingMomentEntry>
>;

export function getTimeCategory(): RotatingMomentCategory;

export function interpolateName(text: string, name: string): string;

export function getRandomMoment(name: string): RotatingMoment;
