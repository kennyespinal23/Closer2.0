/* Community (screens/Community.tsx): Closer Shorts films, the prayer wall, asking for prayer, and reading groups
   (the groups row shows under You). The sample prayers, groups and film stories are preview content, not listed here. */
export const community = {
  films: {
    // the billboard at the top; "Closer" and "Shorts" are styled separately
    brandCloser: "Closer",
    brandShorts: "Shorts",
    carouselLabel: "Closer Shorts",
    you: "You",
    newFilm: "New film",
    nowStreaming: "now streaming",
    // {n} is the film's number
    short: "Short {n}",
    // a film poster's accessible name
    posterLabel: "{title}, short {n}",
    newBadge: "NEW",
    more: "More films",
    count: { one: "{n} short", other: "{n} shorts" },
    watch: "Watch",
    about: "About {title}",
    filmsLabel: "Films",
    // toast when Watch is tapped; {where} is YouTube, Instagram or TikTok
    opensOn: "In the app, “{title}” opens on {where}.",
    close: "Close",
    share: "Share",
    // copied to the clipboard
    shareText: "{title} · Closer Shorts",
    year: "2026",
    shortFilm: "Short film",
    save: "Save",
    saved: "Saved",
    copied: "Copied",
    standIn: "This poster is a stand-in for the preview.",
    whereLabel: "Where to watch",
    watchOn: "Watch on {where}",
    opensIn: "Opens in the {where} app",
    leave: "You’ll leave Closer to watch. Come back anytime.",
  },
  wall: {
    ask: "Ask someone to pray for you",
    title: "Prayer wall",
    everyone: "Everyone",
    mine: "Mine",
    empty: "Your prayers will be here.",
    preview: "Preview · the prayers and people are samples. What you add stays on this device.",
  },
  card: {
    // the name shown for an anonymous post
    friend: "A friend",
    you: "You",
    // the initial in the round badge for your own posts
    youInitial: "Y",
    tags: { Praise: "Praise", Answered: "Answered" },
    update: "Update: {text}",
    // {age} is like "2h"; the count of people praying follows
    praying: { one: "{n} praying", other: "{n} praying" },
    youAnd: "you and {n} praying",
    prayed: "✓ Prayed",
    pray: "♥ Pray",
    prayedLabel: "You prayed",
    prayFor: "Pray for {name}",
    // how old your own new post is
    now: "now",
  },
  ask: {
    label: "Ask for prayer",
    title: "What can we pray for?",
    close: "Close",
    request: "A request",
    praise: "Something good",
    placeholder: "Say as much or as little as you like.",
    anon: "Post as “A friend”",
    note: "This preview keeps it on this device. Nothing is sent.",
    post: "Post",
  },
  groups: {
    title: "Your groups",
    reading: "{n} reading",
    // a group card's accessible name
    cardLabel: "{name}. {book} {ch}. {n} reading",
    close: "Close",
    question: "This week’s question",
    read: "Read {book} {ch}",
    sample: "Sample group · nothing is sent",
  },
};
