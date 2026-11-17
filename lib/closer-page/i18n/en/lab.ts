/* Faith & Science: the Discovery Lab's instruments (lesson/blocks/Lab.tsx). Facts and Page's lines for each lesson
   are in content/science-*.ts; these are the instruments' own labels. */
export const lab = {
  // the label on every finding: what kind of claim it is
  tags: {
    observation: "Observation",
    model: "Scientific model",
    interpretation: "Interpretation",
    open: "Open question",
  },
  continue: "Continue",

  // a patch of space on a timeline slider, from the early universe to today
  expand: {
    ageToday: "Today · about 13.8 billion years",
    // {n}: a number like 4.2
    ageBillion: "Roughly {n} billion years in",
    // {n}: a number like 380
    ageMillion: "Roughly {n} million years in",
    dragBack: "Drag the timeline back to the start",
    bringBack: "Now bring it back to today",
    // screen-reader description of the picture. {age}: one of the age lines above; {pct}: a whole number
    canvasLabel: "A patch of space. {age}. Distances are {pct} percent of today’s.",
    glow: "Before galaxies: a hot, dense glow of matter and light",
    slider: "Timeline: drag left to go back in time, right to come forward",
    early: "Early",
    today: "Today",
    // three small gauges under the slider: a label, a value, and a unit line under it
    distances: "Distances",
    ofToday: "of today’s",
    density: "Density",
    heat: "Light’s heat",
    todays: "today’s",
    // {n}: a number
    percent: "{n}%",
    times: "{n}×",
  },

  // a spectrograph: tap three galaxies to read their light
  redshift: {
    // footer button while looking. {seen}, {total}: numbers
    look: "Look at each galaxy · {seen} of {total}",
    labRow: "Hydrogen in a lab, at rest",
    // {name}: a galaxy's name
    galaxyLight: "{name}’s light",
    pick: "Pick a galaxy",
    bluer: "Bluer",
    redder: "Redder →",
    plotLabel: "Plot: farther galaxies, larger redshift",
    // the plot's axes; keep them short
    axisDistance: "distance →",
    axisRedshift: "redshift",
    plotDone: "The farther the galaxy, the more its light is stretched.",
    plotWait: "Each galaxy you look at goes on the plot.",
  },

  // wipe a dark sky to reveal the map of the oldest light
  cmb: {
    reveal: "Reveal it all",
    mapLabel: "A simplified map of the whole sky in microwaves: soft patches, very slightly warmer and cooler",
    fogLabel: "Drag across the sky to clear it",
  },

  // sort questions into three trays
  twoKinds: {
    ask: "Where does each question belong?",
    // when they chose a different tray. {bin}: the tray's name
    usually: "Many would put it in “{bin}”.",
    // the tray label over the explanation, when they chose differently. {bin}: the tray's name
    binUsually: "{bin} · usually",
    seeAll: "See them all",
    nextQuestion: "Next question",
    // {n}, {total}: numbers
    place: "Place each question · {n} of {total}",
    questionOf: "Question {n} of {total}",
  },
};
