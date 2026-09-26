import { memo } from "react";
import { Image } from "expo-image";
import { MOMENT_ART_SOURCES } from "@/constants/momentArtSources";
import type { BibleMoment } from "@/constants/bibleMoments";

const artByEvent: Record<string, keyof typeof MOMENT_ART_SOURCES> = {
  creation: "creation", fall: "fall", "rainbow-covenant": "flood",
  "abraham-called": "stars", "joseph-sold": "joseph",
};

/** Same prototype artwork, decoded and cached natively instead of mounting SVG trees. */
export const ReaderMomentArt = memo(function ReaderMomentArt({ moment }: { moment: BibleMoment }) {
  return <Image source={MOMENT_ART_SOURCES[artByEvent[moment.id] ?? "book"]}
    contentFit="cover" cachePolicy="memory" transition={0}
    style={{ width: "100%", height: "100%" }} />;
});
