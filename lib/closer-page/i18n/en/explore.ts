/* Explore: the category bands, search, the shelves inside a category, and the labels on related-experience links. */
export const explore = {
  title: "Explore",
  back: "Back to Explore",
  search: "Search",
  searchHint: "A passage, a person, a topic…",
  clear: "Clear search",
  // {q} is what they typed
  nothing: "Nothing yet for “{q}”.",
  // on a band: how many experiences are ready to play (Spanish needs listo/listos)
  ready: { one: "{n} ready", other: "{n} ready" },
  comingSoon: "Coming soon",
  // small badge on an experience that isn't written yet
  soon: "Soon",
  // Bible Mysteries shelf: {id} like 004
  caseNo: "Case {id}",
  // Psalms shelf: {sub} the feeling, {n} the psalm's number
  psalmLine: "{sub} · Psalm {n}",

  // after an experience, the kinds of next step it can point to: label, and what Page says
  connection: {
    continue_story: { label: "Continue the story", page: "There’s more to this story." },
    go_deeper: { label: "Go deeper", page: "Want to see where this leads?" },
    bigger_picture: { label: "Bigger picture", page: "That reminds me of something." },
    everyday_application: { label: "Everyday application", page: "This one shows up in real life." },
  },
  // why two experiences are linked, shown small on the link
  basis: {
    text: "Same passage",
    narrative: "Later in the story",
    theme: "A shared theme",
    application: "One way to live it",
  },
};
