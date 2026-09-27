/** Illustrative content from the user's HTML prototype, never presented as a live feed. */
export type PrayerNote = { id: string; text: string; author: string; tag: "Request" | "Praise" | "Answered"; count: number; age: string; color: string; mine?: boolean; update?: string; encouragements?: string[] };
export type StudyGroup = { id: string; name: string; bookId: string; chapter: number; schedule: string; members: string[]; question: string; replies: { author: string; text: string }[]; joined?: boolean; mine?: boolean; prayer?: { text: string; author: string }; prayerPrayed?: boolean };
export type CommunityPreviewState = { notes: PrayerNote[]; prayed: string[]; groups: StudyGroup[]; tutorialSeen: boolean; groupTutorialSeen?: boolean };
export const NOTE_COLORS = ["#FFF6B8", "#FFE3DB", "#DDF0FD", "#FBEFD6", "#FDE7C8"];
export const COMMUNITY_PREVIEW: CommunityPreviewState = {
  tutorialSeen: false, prayed: [],
  notes: [
    { id: "sample-1", text: "I haven’t prayed in a long time. This is me trying.", author: "Anonymous", count: 48, age: "20m", tag: "Request", color: NOTE_COLORS[0] },
    { id: "sample-2", text: "Starting a new job Monday and I’m scared I’m not good enough. Pray I remember who I am.", author: "Jordan", count: 14, age: "2h", tag: "Request", color: NOTE_COLORS[1] },
    { id: "sample-3", text: "Pray for my sister’s surgery on Thursday.", author: "Maria", count: 22, age: "1d", tag: "Answered", update: "She’s home and healing. Thank you all.", color: NOTE_COLORS[2] },
    { id: "sample-4", text: "My dad and I haven’t talked in three years. I’m calling him this week.", author: "Anonymous", count: 31, age: "5h", tag: "Request", color: NOTE_COLORS[3] },
    { id: "sample-5", text: "Back in church for the first time in two years. Sat in the back row, but I went.", author: "Sam", count: 40, age: "1d", tag: "Praise", color: NOTE_COLORS[0] },
    { id: "sample-6", text: "Finals week. Pray for focus and some peace.", author: "Dev", count: 9, age: "3h", tag: "Request", color: NOTE_COLORS[4] },
  ],
  groups: [
    { id: "early", prayer: { text: "Pray for my mom’s job interview Friday.", author: "Keisha" }, name: "Early Risers", bookId: "genesis", chapter: 3, schedule: "Reads daily, 7 AM", members: ["A", "K", "J", "M", "R", "T"], joined: true, question: "God asks Adam, ‘Where are you?’ Where would you honestly say you are this week?", replies: [{ author: "Keisha", text: "Somewhere between hiding and coming out. Mostly hiding, if I’m honest." }, { author: "Marcus", text: "Busy. Using busy to avoid it." }, { author: "Rosa", text: "Closer than last month. That counts." }] },
    { id: "back", prayer: { text: "Pray I actually show up Tuesday.", author: "Lena" }, name: "Coming Back", bookId: "luke", chapter: 15, schedule: "Tuesdays at 8 PM", members: ["D", "L", "S", "P", "N"], question: "Which son in the prodigal story do you relate to more right now?", replies: [{ author: "Lena", text: "The older one. Faithful and quietly resentful." }, { author: "Sam", text: "The younger one, walking the long road home." }] },
    { id: "moms", prayer: { text: "Two hours of sleep. Pray for patience.", author: "Hannah" }, name: "Tired Moms, Real Faith", bookId: "psalms", chapter: 23, schedule: "One psalm a day", members: ["E", "H", "V", "C", "I", "O", "B"], question: "Psalm 23 says he makes us lie down. What would rest look like for you this week?", replies: [{ author: "Hannah", text: "Letting the laundry sit and not feeling bad about it." }] },
    { id: "bros", prayer: { text: "Pray for my marriage this month.", author: "Felix" }, name: "Brothers in Romans", bookId: "romans", chapter: 8, schedule: "Thursdays at 7 PM", members: ["G", "F", "W", "Y"], question: "Romans 8:1, no condemnation. Do you actually believe that about yourself?", replies: [{ author: "Felix", text: "Some days. Working on the other days." }] },
  ],
};
export const COMMUNITY_TUTORIAL = [
  { title: "You don’t have to pray alone", text: "A place to pray for each other and read together. This preview uses sample notes and groups. Everything you add stays on this device." },
  { title: "A wall of little prayers", text: "Open a note to read the whole story. Tap ‘I’ll pray’ to light a candle and keep the note under Yours." },
  { title: "Leave a little encouragement", text: "Hold to pray on an open note, or choose a few kind words. In this preview, no messages are sent." },
  { title: "There’s room for your note", text: "Ask for prayer or share something you’re thankful for. Use your first name, or stay anonymous. You can add an update later." },
  { title: "Read together", text: "Explore study groups, read the same chapter, and answer a question together. Try joining a sample group or creating your own local group." },
];

export const GROUP_TUTORIAL = [
  { title: "Read together", text: "Choose a book with your partner, family, or friends. Make space for a question and a prayer along the way." },
  { title: "Your group at a glance", text: "Each card shows the book, the current chapter, and the people reading together. Open a card to see the discussion." },
  { title: "One chapter, shared", text: "Jump into the reading, reflect on the question, and pray for one another. Sample groups let you try it first." },
  { title: "Start your own", text: "Choose who you’re reading with, pick a book, and set a pace. Groups are a local preview for now; no invitations are sent." },
];
