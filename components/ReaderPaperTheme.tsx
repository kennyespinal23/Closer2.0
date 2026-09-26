import { createContext, useContext, useState, type ReactNode } from "react";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/theme";
import { ThemeSurface, useResolvedScheme } from "@/state/theme";
import { STORAGE_KEYS, usePersistence } from "@/lib/storage";

export type ReaderTone = "light" | "sepia" | "dark";
const Context = createContext<{ tone: ReaderTone; setTone: (value: ReaderTone) => void }>({ tone: "light", setTone: () => {} });
export const useReaderTone = () => useContext(Context);
export function ReaderPaperTheme({ children }: { children: ReactNode }) {
  const appScheme = useResolvedScheme();
  const [tone, setTone] = useState<ReaderTone>(appScheme);
  usePersistence(STORAGE_KEYS.readerPaperTone, tone, value => { if (["light", "sepia", "dark"].includes(value)) setTone(value); });
  const colors = tone === "dark" ? { ...DARK_COLORS, bg: "#171513", surface: "#24201C", surfaceSecondary: "#2D2822", ink: "#F4EBDD", inkMuted: "#C4B7A5", inkSubtle: "#9F9282" } : tone === "sepia" ? { ...LIGHT_COLORS, bg: "#F2E4CC", surface: "#FAEFDD", surfaceSecondary: "#E9D8BA", ink: "#34281E", inkMuted: "#75614B", inkSubtle: "#8A7359", border: "#CFBA98" } : { ...LIGHT_COLORS, bg: "#FFFBF4", ink: "#30271F", inkMuted: "#746758" };
  return <Context.Provider value={{ tone, setTone }}><ThemeSurface colors={colors} scheme={tone === "dark" ? "dark" : "light"}>{children}</ThemeSurface></Context.Provider>;
}
