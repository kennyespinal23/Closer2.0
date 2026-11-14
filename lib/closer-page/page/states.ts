/* Page's animation language. Lesson content names a mood and an action; this file decides what they look like.
   Nothing in here knows about Lazarus or any other story. */

export type Mood =
  | "neutral" | "happy" | "excited" | "curious" | "surprised"
  | "thinking" | "moved" | "tender" | "celebrating" | "cheeky";

export type Action =
  | "idle" | "enter" | "hop" | "tilt" | "stare" | "spin"
  | "react" | "nod" | "shake" | "lean" | "celebrate" | "settle";

type N = number | null; // null: start from wherever Page is now
type Keyframes = {
  x?: N[]; y?: N[]; rotate?: N[]; scaleX?: N[]; scaleY?: N[];
  transition: Record<string, unknown>;
};

const spring = { type: "spring", stiffness: 420, damping: 18 };

/* Each action is one shot on Page's action layer. Idle hovering runs underneath on its own layer,
   so actions compose with it instead of replacing it. Squash and stretch keeps volume: when scaleY
   goes up, scaleX comes down. */
export const ACTIONS: Record<Action, Keyframes> = {
  idle: { x: [0], y: [0], rotate: [0], scaleX: [1], scaleY: [1], transition: { duration: 0.4 } },
  // Flies in from the left, tilted forward, overshoots, then lands with a squash
  enter: {
    x: [-420, 26, -8, 0], y: [-120, 10, -4, 0], rotate: [-34, 10, -4, 0],
    scaleX: [0.9, 1.12, 0.96, 1], scaleY: [1.1, 0.86, 1.04, 1],
    transition: { duration: 0.95, times: [0, 0.55, 0.78, 1], ease: [0.2, 0.8, 0.3, 1] },
  },
  hop: {
    y: [0, 8, -34, 0, -10, 0], scaleX: [1, 1.14, 0.9, 1.12, 0.97, 1], scaleY: [1, 0.84, 1.12, 0.88, 1.03, 1],
    rotate: [0, 0, -4, 2, 0, 0],
    transition: { duration: 0.75, times: [0, 0.14, 0.42, 0.66, 0.84, 1], ease: "easeOut" },
  },
  tilt: { rotate: [null, 14], x: [null, 4], y: [null, 0], scaleX: [null, 1], scaleY: [null, 1], transition: { ...spring, stiffness: 260, damping: 11 } },
  // Leans in close and holds it, a little too long
  stare: {
    x: [null, 0], y: [null, 6], rotate: [null, -5], scaleX: [null, 1.1], scaleY: [null, 1.1],
    transition: { type: "spring", stiffness: 200, damping: 14 },
  },
  spin: {
    rotate: [0, -12, 360], y: [0, 6, -30, 0], scaleX: [1, 1.1, 0.92, 1], scaleY: [1, 0.88, 1.08, 1],
    transition: { duration: 0.85, ease: [0.3, 0.7, 0.3, 1] },
  },
  react: {
    scaleX: [1, 1.18, 0.92, 1.04, 1], scaleY: [1, 0.82, 1.1, 0.97, 1], y: [0, 4, -8, 0, 0],
    transition: { duration: 0.5, ease: "easeOut" },
  },
  nod: { rotate: [0, 0, 0], y: [0, 8, 0, 5, 0], scaleY: [1, 0.94, 1, 0.97, 1], transition: { duration: 0.6 } },
  shake: { x: [0, -9, 8, -6, 4, 0], rotate: [0, -6, 5, -3, 1, 0], transition: { duration: 0.5 } },
  lean: { rotate: [null, -9], x: [null, -6], y: [null, 2], scaleX: [null, 1], scaleY: [null, 1], transition: { type: "spring", stiffness: 180, damping: 16 } },
  celebrate: {
    y: [0, 10, -46, 0, -16, 0], rotate: [0, 0, 180, 360, 360, 360],
    scaleX: [1, 1.18, 0.86, 1.16, 0.96, 1], scaleY: [1, 0.8, 1.16, 0.84, 1.04, 1],
    transition: { duration: 1.1, times: [0, 0.12, 0.42, 0.62, 0.8, 1], ease: "easeOut" },
  },
  // Back to rest from a held pose (tilt, stare, lean)
  settle: { x: [null, 0], y: [null, 0], rotate: [null, 0], scaleX: [null, 1], scaleY: [null, 1], transition: { ...spring, stiffness: 300, damping: 16 } },
};

/* Which actions leave Page holding a pose (and so need "settle" before the next one) */
export const HELD: Action[] = ["tilt", "stare", "lean"];

/* Moods that carry little yellow motion marks, as on the character sheet */
export const SPARKS: Partial<Record<Mood, "pop" | "question" | "bang">> = {
  excited: "pop", celebrating: "pop", curious: "question", surprised: "bang",
};

/* Hovering: slower and smaller when the moment is quiet */
export const IDLE = {
  normal: { y: [0, -7, 0], rotate: [-1.6, 1.6, -1.6], duration: 3.2 },
  quiet: { y: [0, -3, 0], rotate: [-0.6, 0.6, -0.6], duration: 4.6 },
};
export const QUIET_MOODS: Mood[] = ["tender", "moved", "thinking"];

/* Where Page can stand on the lesson stage, as a share of the stage. "bubble" is where his words sit. */
export type Anchor = "hero" | "center" | "top" | "left" | "right" | "corner" | "low" | "off";
export const ANCHORS: Record<Anchor, { x: number; y: number; scale: number; bubble: "below" | "right" | "left" | "none" }> = {
  hero:   { x: 0.5,  y: 0.30, scale: 1.35, bubble: "below" },
  center: { x: 0.5,  y: 0.26, scale: 1.0,  bubble: "below" },
  top:    { x: 0.5,  y: 0.11, scale: 0.66, bubble: "below" },
  left:   { x: 0.15, y: 0.09, scale: 0.6,  bubble: "right" },
  right:  { x: 0.85, y: 0.09, scale: 0.6,  bubble: "left" },
  corner: { x: 0.86, y: 0.07, scale: 0.46, bubble: "none" },
  low:    { x: 0.5,  y: 0.62, scale: 1.1,  bubble: "below" },
  off:    { x: 1.4,  y: 0.1,  scale: 0.5,  bubble: "none" },
};
