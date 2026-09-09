import type { ImageSourcePropType } from "react-native";

/**
 * Flaticon free+attribution icon registry.
 *
 * Drop PNG/SVG files into `assets/icons/flaticon/`, set `ready: true`,
 * and fill the credit fields from Flaticon’s attribution modal.
 * Until `ready`, call sites keep using SF Symbols.
 *
 * Free license requires visible attribution — see
 * `app/settings/credits.tsx` and the folder README.
 */

export type FlaticonCredit = {
  /** Artist / studio name as shown on Flaticon. */
  author: string;
  /** Short title Flaticon suggests, e.g. "home icons". */
  title: string;
  /** Icon or author page URL from the download attribution. */
  flaticonUrl: string;
};

export type FlaticonIconKey =
  | "house"
  | "book"
  | "shield"
  | "person"
  | "gear"
  | "bell"
  | "flame"
  | "heart"
  | "envelope"
  | "back"
  | "forward"
  | "close"
  | "plus"
  | "check";

export type FlaticonIconEntry = {
  key: FlaticonIconKey;
  /** SF Symbol names this asset replaces when ready. */
  symbols: readonly string[];
  credit: FlaticonCredit;
  /**
   * Flip to true only after the file exists in
   * `assets/icons/flaticon/{key}.png` (or .svg once wired).
   */
  ready: boolean;
  /**
   * Optional explicit require. When omitted and `ready`, we look up
   * the default PNG path map below.
   */
  source?: ImageSourcePropType;
};

/**
 * Placeholder credits — replace author / URL when you download each
 * free icon. Empty author strings are filtered out of the Credits UI
 * until filled.
 */
export const FLATICON_ICONS: readonly FlaticonIconEntry[] = [
  {
    key: "house",
    symbols: ["house", "house.fill"],
    credit: {
      author: "",
      title: "home icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/home",
    },
    ready: false,
  },
  {
    key: "book",
    symbols: ["book", "book.fill", "book.closed", "book.closed.fill"],
    credit: {
      author: "",
      title: "book icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/book",
    },
    ready: false,
  },
  {
    key: "shield",
    symbols: ["shield", "shield.fill"],
    credit: {
      author: "",
      title: "shield icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/shield",
    },
    ready: false,
  },
  {
    key: "person",
    symbols: ["person", "person.fill", "person.circle", "person.circle.fill"],
    credit: {
      author: "",
      title: "user icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/user",
    },
    ready: false,
  },
  {
    key: "gear",
    symbols: ["gearshape", "gearshape.fill"],
    credit: {
      author: "",
      title: "settings icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/settings",
    },
    ready: false,
  },
  {
    key: "bell",
    symbols: ["bell", "bell.fill"],
    credit: {
      author: "",
      title: "bell icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/bell",
    },
    ready: false,
  },
  {
    key: "flame",
    symbols: ["flame", "flame.fill"],
    credit: {
      author: "",
      title: "fire icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/fire",
    },
    ready: false,
  },
  {
    key: "heart",
    symbols: ["heart", "heart.fill"],
    credit: {
      author: "",
      title: "heart icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/heart",
    },
    ready: false,
  },
  {
    key: "envelope",
    symbols: ["envelope", "envelope.fill"],
    credit: {
      author: "",
      title: "envelope icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/envelope",
    },
    ready: false,
  },
  {
    key: "back",
    symbols: ["chevron.left"],
    credit: {
      author: "",
      title: "arrow icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/arrow",
    },
    ready: false,
  },
  {
    key: "forward",
    symbols: ["chevron.right", "chevron.down"],
    credit: {
      author: "",
      title: "arrow icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/arrow",
    },
    ready: false,
  },
  {
    key: "close",
    symbols: ["xmark"],
    credit: {
      author: "",
      title: "close icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/close",
    },
    ready: false,
  },
  {
    key: "plus",
    symbols: ["plus"],
    credit: {
      author: "",
      title: "plus icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/plus",
    },
    ready: false,
  },
  {
    key: "check",
    symbols: ["checkmark", "checkmark.circle", "checkmark.circle.fill"],
    credit: {
      author: "",
      title: "check icons",
      flaticonUrl: "https://www.flaticon.com/free-icons/check",
    },
    ready: false,
  },
];

const BY_SYMBOL = new Map<string, FlaticonIconEntry>();
for (const entry of FLATICON_ICONS) {
  for (const symbol of entry.symbols) {
    BY_SYMBOL.set(symbol, entry);
  }
}

export function flaticonEntryForSymbol(
  symbolName: string,
): FlaticonIconEntry | undefined {
  return BY_SYMBOL.get(symbolName);
}

/**
 * Static requires must be written literally for Metro.
 * Add a line here when you drop each PNG and set `ready: true`.
 */
const SOURCES: Partial<Record<FlaticonIconKey, ImageSourcePropType>> = {
  // house: require("@/assets/icons/flaticon/house.png"),
  // book: require("@/assets/icons/flaticon/book.png"),
  // shield: require("@/assets/icons/flaticon/shield.png"),
  // person: require("@/assets/icons/flaticon/person.png"),
  // gear: require("@/assets/icons/flaticon/gear.png"),
  // bell: require("@/assets/icons/flaticon/bell.png"),
  // flame: require("@/assets/icons/flaticon/flame.png"),
  // heart: require("@/assets/icons/flaticon/heart.png"),
  // envelope: require("@/assets/icons/flaticon/envelope.png"),
  // back: require("@/assets/icons/flaticon/back.png"),
  // forward: require("@/assets/icons/flaticon/forward.png"),
  // close: require("@/assets/icons/flaticon/close.png"),
  // plus: require("@/assets/icons/flaticon/plus.png"),
  // check: require("@/assets/icons/flaticon/check.png"),
};

export function flaticonSource(
  entry: FlaticonIconEntry,
): ImageSourcePropType | undefined {
  if (!entry.ready) return undefined;
  return entry.source ?? SOURCES[entry.key];
}

/** Unique author credits ready to show on the Credits screen. */
export function flaticonAttributionLines(): FlaticonCredit[] {
  const seen = new Set<string>();
  const lines: FlaticonCredit[] = [];
  for (const entry of FLATICON_ICONS) {
    if (!entry.ready) continue;
    const author = entry.credit.author.trim();
    if (!author) continue;
    const id = `${author}::${entry.credit.flaticonUrl}`;
    if (seen.has(id)) continue;
    seen.add(id);
    lines.push(entry.credit);
  }
  return lines;
}
