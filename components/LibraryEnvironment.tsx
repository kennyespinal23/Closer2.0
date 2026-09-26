import { createContext, useContext, useState, type ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { ThemeSurface, useColors, useResolvedScheme } from "@/state/theme";
const LibraryLight = createContext({ dark: false, toggle: () => {} });
export const useLibraryLight = () => useContext(LibraryLight);
export function LibraryEnvironment({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  const scheme = useResolvedScheme(), colors = useColors();
  const [override, setOverride] = useState<boolean | null>(null);
  const dark = override ?? scheme === "dark";
  const ink = dark ? "#F9F0EB" : "#2A1F18", muted = dark ? "#CDBBAA" : "#6F5E50";
  return <LibraryLight.Provider value={{ dark, toggle: () => setOverride(!dark) }}><ThemeSurface scheme={dark ? "dark" : "light"} colors={{ ...colors, bg: dark ? "#221819" : "#F1E1D2", surface: dark ? "#352725" : "#FFFBF4", surfaceSecondary: dark ? "#48352D" : "#EBD9BF", ink, textSecondary: muted, inkMuted: muted, inkSubtle: muted, border: dark ? "#5A4336" : "#D8C3AC" }}>{focused && <StatusBar style={dark ? "light" : "dark"} />}{children}</ThemeSurface></LibraryLight.Provider>;
}
