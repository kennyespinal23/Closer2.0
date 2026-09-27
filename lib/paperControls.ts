/** Shared foreground/background pairs for primary actions on Closer's paper canvas. */
export function paperActionColors(dark: boolean) {
  return dark
    ? { backgroundColor: "#FFFAF1", color: "#30251E", borderColor: "#FFFAF1" }
    : { backgroundColor: "#30251E", color: "#FFFAF1", borderColor: "#30251E" };
}
