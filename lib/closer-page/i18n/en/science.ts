/* Faith & Science experiences built on the Discovery Lab: their instruments' own labels. Facts and Page's lines for
   each lesson are in content/science-*.ts. The claim tags (Observation, Scientific model...) are in lab.tags. */
export const science = {
  continue: "Continue",

  // How Old Is the Earth? (lesson/blocks/EarthAge.tsx)
  earth: {
    // ages the way people say them. {n}: a number like 4.54 or 66
    billionYears: "{n} billion years",
    millionYears: "{n} million years",
    years: "{n} years",
    // the same, short, on the zoom-level chips
    billionShort: "{n} billion",
    millionShort: "{n} million",
    yearsShort: "{n}",
    // {span}: one of the ages above
    ago: "{span} ago",

    // a cliff of rock layers: tap the oldest, then dig upward
    rock: {
      tapFirst: "Tap the layer that formed first",
      // {hint}: an instruction from the lesson; {n}, {total}: numbers
      digCount: "{hint} · {n} of {total}",
      cliffLabel: "A cliff of rock layers, seen from the side",
      // a dug layer for screen readers. {name}: the layer; {fossil}: what was found in it
      layerFound: "{name}: {fossil}",
      layer: "{name} layer",
      // the arrow up the side of the cliff
      older: "older",
      younger: "younger",
    },

    // a grid of 100 atoms decaying, matched against a rock sample
    decay: {
      // Page, at exactly one half-life. {n}: a number of billions
      oneHalf: "Exactly half left. One half-life: {n} billion years.",
      twoHalves: "Half of the half. A quarter left.",
      past: "Past the sample now. Step back?",
      backLabel: "Step back a quarter half-life",
      back: "Back",
      pass: "Let time pass",
      match: "Match?",
      // screen readers. {left}: number of atoms left; {parent}: an element, like Uranium-238
      atomsLabel: "{left} of 100 {parent} atoms left",
      timePassed: "Time passed",
      noneYet: "None yet",
      // short "years" to fit a narrow readout. {n}: a number
      billionYrs: "{n} billion yrs",
      halfLives: { one: "{n} half-life", other: "{n} half-lives" },
      yourAtoms: "Your atoms",
    },

    // four specimens dated by different clocks, placed on a ruler
    clocks: {
      // {n}, {total}: numbers
      dateEach: "Date each specimen · {n} of {total}",
      billionYrs: "{n} billion yrs",
      ruler: "billion years ago",
    },

    // zooming from all of Earth's history down to recorded history
    deepTime: {
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      atEnd: "You’re at the end",
      scaleLabel: "Time scale",
      // {span}: an age like "4.54 billion years"
      stripLabel: "Earth’s history, showing the last {span}",
      today: "today",
      // an event for screen readers. {title}: the event; {ago}: an age
      eventLabel: "{title}, {ago} ago",
      // next to a count of events too close together to draw
      squeezed: "squeezed in here",
      // over a tapped event. {ago}: an age; {time}: a clock time like 11:58 pm
      detail: "{ago} ago · on a 24-hour day: {time}",
      hint: "Tap any moment on the strip. Pinch, or use the buttons, to zoom.",
      oneDay: "If all of Earth’s history were one day",
      // a time on that 24-hour day. {h}, {m}, {s}: hours, minutes, seconds
      clock: "{h}:{m}:{s} {ampm}",
      clockShort: "{h}:{m} {ampm}",
      am: "am",
      pm: "pm",
      // {n}: a small number, like 0.03
      secondsBefore: "{n} seconds before midnight",
      // the geological eons and eras along the strip
      eras: {
        hadean: "Hadean",
        archean: "Archean",
        proterozoic: "Proterozoic",
        paleozoic: "Paleozoic",
        mesozoic: "Mesozoic",
        cenozoic: "Cenozoic",
      },
    },

    // the seven days of Genesis 1, rearranged under each Christian reading
    readings: {
      // {n}, {total}: numbers
      tryEach: "Try each reading · {n} of {total}",
      daysLabel: "The seven days of Genesis 1",
      // {name}: a reading; {badge}: its one-line summary
      lensLabel: "{name}: {badge}",
      gap: "a gap?",
      day: "Day {n}",
      // small tags on each day under three of the readings
      hours: "24 hours",
      longAge: "a long age",
      workday: "God’s workday",
      // on day 7 under the temple reading
      rests: "God rests in his temple",
    },
  },

  // Did Humans Really Evolve? (lesson/blocks/Evolution.tsx)
  evolution: {
    // a family tree of the great apes: try the chimp as our ancestor, then grow the real branch points
    tree: {
      dragChimp: "Drag the chimp to the empty spot",
      // {n}, {total}: numbers
      grow: "Grow the tree · {n} of {total}",
      treeLabel: "A family tree: orangutans, gorillas, chimpanzees and humans at the top, their branches meeting further down in time",
      // the time axis, in millions of years ago
      today: "Today",
      axis: "million years ago",
      // the empty spot on the tree; the line break is kept
      ancestor: "Our\nancestor?",
      // {name}: an ape's name
      tryChimp: "{name}: try it as our ancestor",
      // a grown branch point for screen readers. {label}: who met there; {date}: when
      nodeLabel: "{label}, {date}",
      nodeHidden: "A branch point: tap to grow the tree",
      // one capital letter on each ape's round token: Orangutan, Gorilla, Chimp, Human
      glyphs: { orangutan: "O", gorilla: "G", chimp: "C", human: "H" },
    },
    // digging down through fossil layers
    dig: {
      // {n}, {total}: numbers
      deeper: "Dig deeper · {n} of {total}",
      // a dug layer for screen readers. {name}: the fossil; {when}: its age
      layerLabel: "{name}, {when}",
      digThis: "Dig this layer",
      buried: "Buried deeper",
      tap: "Tap to dig",
      // the top of the dig, and a note beside it; shown in capitals
      today: "Today",
      older: "Deeper is older ↓",
    },
    // human chromosome 2 beside chimp 2A and 2B, then two strands of DNA compared
    genes: {
      // {n}, {total}: letters scanned so far, and all of them
      scanning: "Scanning… {n} of {total}",
      scan: "Scan the two strands",
      slide: "Slide the chimp pieces together",
      chromoLabel: "Human chromosome 2 beside chimpanzee chromosomes 2A and 2B, with matching bands",
      human2: "Human 2",
      chimp2: "Chimp 2A + 2B",
      piece2a: "Chimp chromosome 2A",
      piece2b: "Chimp chromosome 2B",
      // {piece}: one of the two names above
      slideLabel: "{piece}: slide together",
      zoom: "Zoom into the circle",
      // {dotted} is replaced by the word below, drawn in the dotted circle's colour
      repeats: "The repeats that cap the ends of chromosomes, meeting head to head in the middle. Just below: a leftover second centromere {dotted}.",
      dotted: "(dotted)",
      human: "Human",
      chimp: "Chimp",
      // {matched}, {total}: numbers
      matchCount: "{matched} of {total} match",
      sameStretch: "Same stretch of DNA",
      illustrative: "An illustrative stretch, not a real one.",
    },
    // four Christian views at one table
    views: {
      // {n}, {total}: numbers
      hearEach: "Hear each voice · {n} of {total}",
      science: "On the science",
      genesis: "On Genesis",
      adam: "On Adam and Eve",
    },
  },

  // Is the Universe Fine-Tuned for Life? (lesson/blocks/FineTuning.tsx)
  tuning: {
    // a mixing desk with four faders, one per law of nature
    desk: {
      // each fader: its full name (screen readers), a short label under it, and its five notches from bottom to top
      dials: {
        gravity: { name: "Gravity", short: "Gravity", notches: ["Much weaker", "Weaker", "Ours", "Stronger", "Much stronger"] },
        strong: { name: "Strong nuclear force", short: "Strong force", notches: ["Much weaker", "Weaker", "Ours", "Stronger", "Much stronger"] },
        // the short label has a soft hyphen (­) so it can break in a narrow column
        em: { name: "Electromagnetism", short: "Electro\u00ADmagnetism", notches: ["Much weaker", "Weaker", "Ours", "Stronger", "Much stronger"] },
        lambda: { name: "Cosmological constant", short: "Cosmic push", notches: ["Pulls inward", "Slight pull", "Ours: tiny push", "Bigger push", "Huge push"] },
      },
      // what this universe is like, in four small cards; the headings are shown in capitals
      kinds: { stars: "stars", elements: "elements", structure: "structure", chemistry: "chemistry" },
      // what each setting does to that card. Short: each fits on two lines of a narrow card
      outcomes: {
        starsNoFusion: "Stars can’t start fusing hydrogen the usual way",
        starsBarely: "Gas clouds barely ignite into stars",
        starsBurnOut: "Stars burn out quickly",
        starsHotter: "Stars burn hotter and shorter",
        starsDimmer: "Stars are dimmer and slower",
        starsHarder: "Fusion inside stars gets much harder",
        starsFine: "Stars shine steadily for billions of years",
        hydrogenUsed: "Most hydrogen used up early: little water",
        hydrogenOnly: "Hydrogen only: no carbon, no oxygen",
        nucleiApart: "Carbon and heavier nuclei fly apart",
        lessHydrogen: "Less hydrogen left over",
        fewerHeavy: "Fewer heavy elements",
        fewerStable: "Fewer stable heavy elements",
        elementsFine: "Hydrogen, carbon, oxygen and more",
        spaceApart: "Space flies apart before galaxies form",
        recollapse: "Everything recollapses early",
        sparser: "Fewer, sparser galaxies",
        shortLived: "A much shorter-lived universe",
        galaxiesFine: "Galaxies form and last",
        fragile: "Atoms hold electrons weakly: fragile chemistry",
        different: "Chemistry works very differently",
        shifts: "Chemistry shifts",
        chemistryFine: "Stable atoms and molecules",
      },
      // a small tag after a result physicists argue about
      debated: "debated",
      // Page says the result that broke; this follows a debated one
      debatedSay: "{text} (debated)",
      // the picture, for screen readers. {stars} {elements} {structure} {chemistry}: the four results above
      previewLabel: "Preview: {stars}. {elements}. {structure}. {chemistry}.",
      // {n}, {total}: numbers
      turnEvery: "Turn every dial · {n} of {total}",
      setBack: "Set every dial back to ours",
      // {verdict}: one of the three words below
      life: "Life as we know it: {verdict}",
      possible: "possible",
      harder: "harder to say",
      unlikely: "looks unlikely",
    },
    // tuning carbon's energy level like a radio dial
    carbon: {
      near: "Something’s happening here…",
      found: "There! Carbon, made in a burst.",
      scan: "Scan for where carbon forms",
      // the three nuclei in the reaction
      beryllium: "Beryllium-8",
      helium: "Helium-4",
      carbon: "Carbon-12",
      made: "Carbon made",
      // the energy unit: mega-electronvolts
      unit: "MeV",
      plotLabel: "How much carbon forms at each energy you've scanned",
      sliderLabel: "Energy of carbon's level, in mega-electronvolts",
      // the two ends of the dial. {n}: a number like 7.0
      end: "{n} MeV",
      simplified: "Simplified: the real peak is narrower, and the whole picture is a sketch of how stars make carbon.",
    },
    // holding a button to add zeros to a huge number
    zeros: {
      // the hold button for screen readers. {hold}: its label; {n}: the power so far
      holdLabel: "{hold}. Ten to the power {n}",
      adding: "Adding zeros…",
      oneFollowed: { one: "a 1 followed by {n} zero", other: "a 1 followed by {n} zeros" },
    },
    // four lenses on the same puzzle
    lenses: {
      shareButton: "One problem they all share",
      // {n}, {total}: numbers
      lookEach: "Look through each lens · {n} of {total}",
      // a lens for screen readers, once looked through. {name}: the lens
      seen: "{name}, seen",
      everyLens: "Every lens faces this",
      favour: "In its favour",
      objection: "The main objection",
      none: "The same tuned dials, seen four ways.",
    },
  },
};
