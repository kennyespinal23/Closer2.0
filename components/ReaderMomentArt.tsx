import { memo } from "react";
import { Image } from "expo-image";
import { SvgXml } from "react-native-svg";
import { READER_MOMENT_ART } from "@/constants/readerMomentArt";
import { getBibleMomentArt, BIBLE_MOMENT_ART_LABELS } from "@/constants/bibleMomentArt";
import type { BibleMoment } from "@/constants/bibleMoments";

const artByEvent: Record<string, keyof typeof READER_MOMENT_ART> = {
  creation: "creation", fall: "fall", "rainbow-covenant": "flood",
  "abraham-called": "stars", "joseph-sold": "joseph",
};

/** Manifest-mapped local artwork; vector fallbacks stay sharp at any card size. */
export const ReaderMomentArt = memo(function ReaderMomentArt({ moment }: { moment: BibleMoment }) {
  const artwork = getBibleMomentArt(moment.id);
  if (artwork) {
    return <Image source={artwork} accessible accessibilityLabel={BIBLE_MOMENT_ART_LABELS[moment.id] ?? moment.title}
      contentFit="cover" contentPosition="center" allowDownscaling={false}
      cachePolicy="memory-disk" transition={0}
      style={{ width: "100%", height: "100%" }} />;
  }
  return <SvgXml xml={READER_MOMENT_ART[artByEvent[moment.id] ?? "book"]}
    width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />;
});
