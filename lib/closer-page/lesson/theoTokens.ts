import type { Person } from "./types";

/* Christian Theology: the category's palette, in one place. A deep evening indigo (the sky over the Jordan), with one
   colour for each person as Scripture shows them at the baptism: gold for the voice from heaven, coral for the Son in
   the water, dove-blue for the Spirit coming down. The three colours are only ever used together. */
export const THEO = {
  /** the Explore band and lesson ground */
  primary: "#2C2A6E",
  /** deeper ground, for the scene's sky and shadows */
  deep: "#1B1A4A",
  /** a raised surface on the ground */
  soft: "#3B3889",
  /** type and buttons */
  light: "#F4F1FF",
  ink: "#17153A",
  /** the three persons */
  father: "#FFC72C",
  son: "#FF8B78",
  spirit: "#A9DCFF",
};

export const PERSON_COLOR: Record<Person, string> = { father: THEO.father, son: THEO.son, spirit: THEO.spirit };
