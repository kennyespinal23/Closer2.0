import type { ImageSourcePropType } from "react-native";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { SCENE_COLORS } from "@/constants/sceneColors";
import { paintedCover } from "@/constants/paintedCovers";
import type { ColorPalette } from "@/constants/theme";
import { mix } from "@/components/HomeDeck";

/**
 * Each chapter wears the colour of its painting: the Bible Moment in it if there is one,
 * otherwise the book's painted cover. The reader's page is a very deep tint of that colour,
 * never grey, and the text is that colour mixed into white.
 */
export function chapterLook(bookId: string, chapter: number): { color: string; art: ImageSourcePropType | null; momentId: string | null } {
  const moment = BIBLE_MOMENTS.find(m => m.bookId === bookId && m.chapter === chapter);
  const art = moment ? getBibleMomentArt(moment.id) ?? null : null;
  if (moment && art) return { color: SCENE_COLORS[moment.id] ?? paintedCover(bookId)?.color ?? "#A47D28", art, momentId: moment.id };
  const cover = paintedCover(bookId);
  return { color: cover?.color ?? "#A47D28", art: cover?.source ?? null, momentId: null };
}

/** The painting that opens a chapter: only a book's first chapter has one (its painted cover). */
export function chapterOpenerArt(bookId: string, chapter: number): ImageSourcePropType | null {
  return chapter === 1 ? paintedCover(bookId)?.source ?? null : null;
}

/** The dark reader palette for a chapter colour. Only the roles the reader uses. */
export function chapterPalette(c: string): Partial<ColorPalette> {
  const bg = mix(c, "#0A0A0D", .87);
  return {
    bg,
    surface: mix(c, "#0A0A0D", .76),
    surfaceSecondary: mix(c, "#0A0A0D", .76),
    surfaceTertiary: mix(c, "#0A0A0D", .68),
    devotionalSurface: mix(c, "#0A0A0D", .8),
    ink: mix("#FFFFFF", c, .12),
    inkMuted: mix("#FFFFFF", c, .24),
    inkSecondary: mix("#FFFFFF", c, .44),
    textSecondary: mix("#FFFFFF", c, .44),
    inkSubtle: mix("#FFFFFF", c, .56),
    border: mix(bg, "#FFFFFF", .12),
    borderStrong: mix(bg, "#FFFFFF", .22),
  };
}
