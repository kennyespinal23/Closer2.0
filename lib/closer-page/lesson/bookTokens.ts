/* Bible Books: the category's palette, in one place. THEMES, the button colours, the Explore tile and every
   book screen read from here. */
export const BOOK = {
  /** the category colour: lesson background and Explore tile */
  primary: "#629AC5",
  /** pages, cards and button text */
  pale: "#EAF5FF",
  /** ink, and the book's cover */
  ink: "#233F58",
  /** one fill per section of a book, in order; [fill, text on it] */
  sections: [["#233F58", "#EAF5FF"], ["#EAF5FF", "#233F58"], ["#3F6A8F", "#EAF5FF"], ["#FFFFFF", "#233F58"], ["#1B3247", "#EAF5FF"], ["#CFE5F7", "#233F58"]] as [string, string][],
  /** the ribbon and highlights */
  ribbon: "#FFC72C",
};
