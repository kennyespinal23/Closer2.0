import { SvgXml } from "react-native-svg";
import { READER_MOMENT_ART } from "@/constants/readerMomentArt";
import type { BibleMoment } from "@/constants/bibleMoments";

/** Temporary artwork from the user's prototype, mapped only to matching events. */
export function ReaderMomentArt({ moment }: { moment: BibleMoment }) {
  const artByEvent: Record<string, keyof typeof READER_MOMENT_ART> = { creation: "creation", fall: "fall", "rainbow-covenant": "flood", "abraham-called": "stars", "joseph-sold": "joseph" };
  const key = artByEvent[moment.id] ?? "book";
  return <SvgXml xml={READER_MOMENT_ART[key]} width="100%" height="100%" />;
}
