import { useResolvedScheme } from "@/state/theme";
export function useMomentPaper() {
  const dark = useResolvedScheme() === "dark";
  return { dark, ink: dark ? "#F4EBDD" : "#2A1F18", muted: dark ? "#C4B6A4" : "#6F5E50", paper: dark ? "#24201C" : "#FFFBF4", canvas: dark ? "#221819" : "#FBF3EC", empty: dark ? "#332B24" : "#F3E4CC", border: dark ? "#665442" : "#C6A77C", divider: dark ? "#403429" : "#EBD9BF" };
}
