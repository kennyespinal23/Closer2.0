/* Bible Mysteries: the case-file pieces (lesson/blocks/CaseFile.tsx, Evidence.tsx, CaseClose.tsx).
   Labels in small caps are shown uppercase by the design, so write them in normal case here. */
export const mysteries = {
  /* how much weight a clue carries, shown beside a five-mark meter */
  strength: {
    stated: "Stated in the text",
    supported: "Supported by evidence",
    inference: "Inference",
    tradition: "Later tradition",
    unverified: "Unverified claim",
    // screen-reader label for the meter; {label} is one of the above
    aria: "Evidence: {label}",
  },
  /* where a theory comes from */
  sourceKind: {
    scripture: "Biblical text",
    tradition: "Later tradition",
    archaeology: "Archaeological evidence",
    scholarship: "Scholarly inference",
    modern: "Modern speculation",
  },
  /* the four bins a claim can be filed in */
  claimType: {
    scripture: "Stated in Scripture",
    historical: "Supported by history",
    hypothesis: "Interpretation or hypothesis",
    unknown: "Not established",
  },
  /* a case's status, stamped on the file */
  status: {
    Unresolved: "Unresolved",
    "Partly resolved": "Partly resolved",
    Resolved: "Resolved",
  },
  continue: "Continue",
  exhibit: {
    // {label}: the exhibit's name, e.g. "Exodus 25"
    title: "Exhibit · {label}",
    close: "Close",
  },
  open: {
    button: "Open the case file",
    // {id}: the case number, e.g. "001"
    case: "Case {id}",
    closed: "Closed file",
    brand: "Closer · Bible Mysteries",
    caseFile: "Case file",
    number: "No. {id}",
    status: "Status: {status}",
    lift: "↑ Lift to open",
  },
  inspect: {
    findTwo: "Find two details",
    // {label} and {caption} come from the lesson
    aria: "{label}: {caption} Use the arrow keys to move the lens, or the detail buttons below.",
    reconstruction: "Reconstruction · not a photograph",
    details: "Details to inspect",
    inspected: "inspected",
  },
  timeline: {
    check: "Check the dates",
    placeAll: "Place every card",
    yourOrder: "Your order · earliest first",
    dated: "What the dates show",
    tray: "Evidence · tap to place next",
    takeBack: "Take back",
    placeNext: "Place next",
    inference: "Inference",
    stated: "Stated in Scripture",
    // {action}: "Take back" or "Place next"; {title}: the card
    tapAria: "{action}: {title}",
    readAria: "Read the evidence: {label}",
    read: "Read",
  },
  board: {
    connectTwo: "Connect two clues",
    // {n}: how many links found
    threads: "Threads followed · {n}",
    viewAria: "How to view the evidence",
    // the two views; shown capitalised
    board: "board",
    list: "list",
    clueAria: "{title}, {ref}",
    clueAriaPicked: "{title}, {ref}, picked: now choose a clue to connect",
    readAria: "Read: {label}",
    // the little "info" button on each clue
    info: "i",
    followed: "followed",
    keepLooking: "Keep looking",
    connects: "Connects {a} and {b}",
  },
  sorter: {
    hint: "Check the source, then file it.",
    fits: "That’s where the evidence points.",
    misfit: "Here’s what the evidence shows.",
    seeFile: "See the file",
    nextClaim: "Next claim",
    choose: "Choose where it goes",
    // {n} of {total}
    claimOf: "Claim {n} of {total}",
    checkSource: "Check the source · {label}",
    groupAria: "Where does this claim stand?",
    yourPick: "Your pick",
    filed: "Filed",
    // {list}: one or more bin names joined with `or`
    pointsTo: "The evidence points to: {list}",
    or: " or ",
    sortedAria: "The sorted file",
  },
  theories: {
    hint: "Open a few. Notice where each comes from.",
    openThree: "Open three theories",
    opened: "opened",
    from: "Where it comes from",
    says: "What it says",
    against: "What can’t be confirmed",
  },
  rebuild: {
    allIn: "Everything we can establish is in place.",
    place: "Place the evidence",
    title: "The case, rebuilt",
    open: "Open",
    // a theory shown beside a gap; {text} from the lesson
    beside: "Theory, not evidence: {text}",
    tray: "Established evidence · tap to place",
    theory: "Theory: {text}",
  },
  report: {
    filed: "Case filed. Still open, and honestly so.",
    scripture: "What Scripture tells us",
    uncertain: "What remains uncertain",
    proposed: "What people have proposed",
    close: "Close the file",
    title: "Case {id} · Report",
    // {refs}: passages joined with " · "
    readIt: "Read it yourself: {refs}",
    hideSources: "Hide sources",
    sources: "Sources",
    number: "No. {id}",
    closing: "You know what Scripture says, what the evidence supports, and where the record goes quiet.",
  },
};
