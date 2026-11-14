import { createContext, useContext, useState, type ReactNode } from "react";
import { ThemeSurface, useColors, useResolvedScheme } from "@/state/theme";
const LibraryLight = createContext({ dark: false, toggle: () => {} });
export const useLibraryLight = () => useContext(LibraryLight);
export function LibraryEnvironment({ children }: { children: ReactNode }) {
  const scheme = useResolvedScheme(), colors = useColors();
  const [override, setOverride] = useState<boolean | null>(null);
  const dark = override ?? scheme === "dark";
  // Colours come from the app theme (deep wine / white); only the light/dark override is local.
  return <LibraryLight.Provider value={{ dark, toggle: () => setOverride(!dark) }}><ThemeSurface scheme={dark ? "dark" : "light"} colors={colors}>{children}</ThemeSurface></LibraryLight.Provider>;
}
