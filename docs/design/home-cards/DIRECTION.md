# Home cards: one subject at a time

**Brief (self-authored from the session, 2026-10-15).** Home's cards take turns being open as the page scrolls. Each card needs its own way of opening and closing, drawn from what it is, while the page still feels like one thing. iPhone first, Expo / Reanimated. The look stays as it is (Nunito, category grounds, plum night sky, `CLOSER_DESIGN_SYSTEM_V1.md`). This is a motion design inside an existing direction, not a new direction, so the skill's three-direction exploration and history row don't apply.

## The rule they share

- **The frame is shared.** Card height, side inset and corner radius follow the scroll 1:1 through `focusAmount(y, stop, last)` (`lib/homeFocus.ts`). Fold distance is 140pt per stop, and the page snaps to each stop.
- **The contents are each card's own.** What travels, which direction it goes, and what the slim row keeps all come from the card's idea.
- **One moment per card.** When the page settles on a card, one short beat plays once. It's not scrubbed by the scroll.
- **Text never crosses moving art.** Open-state text arrives late (after 60% open) and slim-state text leaves early (gone by 15%). In between, only the anchor (title, envelope, moon, page) is visible.
- **Haptics:** none. The design system keeps haptics for meaningful events, and settling on a card isn't one.

| | Night prayer | Today | Tomorrow | Day after |
|---|---|---|---|---|
| Idea | Dusk closing | The page you're on | A sealed letter | A page still being written |
| Slim row keeps | Title, plus the moon as the button | Title, kicker, four step dots | Title, envelope (lock in the kicker) | Weekday, title, pencil |
| Direction | Vertical: the sky closes like an eyelid | Sideways: the art leaves to the right | Depth: the letter comes toward you | From below: the page rises |
| Moment on settle | The moon rises 18pt into place, three stars twinkle once | The four step chips land one after another | One band of light crosses the wax seal, and the tilt settles to 0° | The pencil writes half a word and stops |
| Heights (slim → open) | 104 → 300 | 104 → 224 | 92 → 240 | 76 → 200 |

## Storyboards

### Night prayer: the sky closes like an eyelid (frames 6–8)
- **Closing (e 1→0):** the card shortens from the bottom. The tag and the "Say how today felt…" line plus Begin button fade by e=.5. The title stays anchored at bottom-left and scales to .74. The moon shrinks to 44pt and drops to vertical centre on the right. An arrow fades onto it under e=.4, so **the moon becomes the Begin button**. "Before you sleep · 2 min" appears under the title.
- **Opening:** the reverse. The moment: the moon rises from 18pt below its spot (paper-settle timing, 300ms), and the three twinkles each pulse once (600ms). No loop.
- **"Rest now" variant (frames 9–10):** the lamp dims. A shade slides over the moon until it's a crescent, the "You prayed for…" line closes up, and the tick and title stay.

### Today: art leaves sideways, the title stays (frames 1, 2)
- **Closing:** the category gesture (here the "?") slides right and down, scaling to .3, so its curve still shows at the card's top-right edge. The day number and category line fade out by e=.62. The title moves up and scales to .77 while keeping its two lines, so its shape never reflows. The kicker "09 · Hard question" appears with four 7pt dots showing progress (filled = done), so progress is never lost.
- **Opening:** the art comes back in from the right, and the meta and step chips fade in after 62%. Moment: the four chips drop 14pt into place one after another (each 20% behind the last, 600ms total).
- When all four steps are done, the dots become one filled check, and the kicker reads "Today, kept".

### Tomorrow: the letter comes forward (frames 3, 4)
- **Slim:** text on the left with a lock in the kicker, and a 56pt envelope on the right tilted 7°. The card is darkened 20%, like the letter is in a drawer.
- **Opening:** the envelope grows in place from its top-right corner to 150pt and tilts from 7° to −3°. Its shadow deepens from 4pt to 18pt and the darkening lifts. Nothing crosses the text, so this is pure depth. The open text ("10 / Tomorrow / A letter waiting for you / Opens tomorrow") fades in after 60%.
- **Moment:** a light band crosses the wax seal (400ms) and the tilt settles to 0°. It never opens on Home, it only comes closer. Tapping still opens the TomorrowLetter sheet.

### Day after: the page comes out of the notebook (frames 4, 5)
- **Slim:** "11 · Saturday · Still being written" with a pencil glyph on the right. The page is hidden below the card's bottom edge.
- **Opening:** the page rises 48pt from below and turns to 6°. **The scroll writes it:** each quarter of the way open draws one more pencil line, with the pencil riding the tip. Scroll back and the writing un-writes.
- **Moment:** the pencil writes about 10% more, half a word, then stops (450ms, the handwritten-draw timing). It plays once per session, per the design system's "not on every revisit" rule.

## Reduce Motion and large text
All cards are fully open with no fold and no snapping, which is the current behaviour. The moments don't play: the envelope is static at 0°, the page shows its final lines, the moon sits in place.

## Scan answers (r3)
- `Text clipped: "?"` is deliberate. The category gesture bleeds off the card edge in production too (`data-art`).
- `"Rooted in love…" contrast` on frame 4 is deliberate. That's the heading scrolled under the top edge effect.
- `Default-reach font (Nunito)`: the app's established face (`lib/typography.ts`), not a new choice.
- `Three saturated hues`: each has an owner. Gold = today's category, red = the seal and avatar, orange = the selected tab.

## Build notes
- Each card reads its own `e = focusAmount(scrollY, stop, last, 140)` in a worklet. Every value above is a linear map of `e`, so it stays on the UI thread.
- Moments: set a `settled` shared value in `onMomentumScrollEnd` (and in `onScrollEndDrag` when there's no momentum), then `withTiming` the card's `m` from 0 to 1. Reset `m` to 0 when the card leaves.
- Tomorrow's slim layout changes: the envelope moves from left to right and the lock moves into the kicker.
- Day after: `PencilPage` already takes a `progress` shared value. Pass `e * .82 + m * .1`.
- Night: `NightPrayerCard` already folds. Add the moon-as-button arrow and the 18pt rise. `NightPrayerDoneCard` gets the crescent shade.

## Files
- `mockup.html`: all frames, driven by the same `focusAmount` as the app.
- `shots/r3/`: frames at 3x, `sheet.png`, `review/` pairs.
- `reels/living-day.mp4`, `reels/living-night.mp4`: the scroll loops, with six-frame strips.

---

# Today, per category: ten ways to fold

The frame (height, title, kicker, steps) is shared, as above. What changes per category is what its **gesture** does as the card folds (`e` 1 → 0) and its **beat** when the page settles on it open (`m` 0 → 1, played once). Every slim card keeps a small, readable mark on the right: the category at a glance.

| Day | Category | Name | Folding (e 1 → 0) | Slim mark | Beat on settle |
|---|---|---|---|---|---|
| 1 | Daily Church | The sun sets | The sun sinks straight down to sit on the bottom edge; the ground warms to dusk (orange overlay up to 55%) | Half a sun on the horizon | The sun rises its last 18pt and its rings widen |
| 2 | Jesus Only | Into the full stop | "Him" folds sideways into its gold full stop | The gold full stop | The stop lands with a small bounce |
| 3 | A struggling letter | The weight | The quote mark sinks and leans further (−6° → −26°) as if weighed down | A small leaning quote mark, low right | It lifts 10pt, then settles: the weight lifted |
| 4 | A grateful letter | The closing quote | The big ” flies down and closes the title, so the slim card reads as a quotation | ” at the end of the title | It springs back with a 6% bounce |
| 5 | Character study | Name to initial | The name gathers into its first letter, which travels to a ring on the right | Monogram (the initial in a ring) | The rest of the name types back out letter by letter |
| 6 | Deep verse | The lens | The verse fades and the lens shrinks to the right, still holding the key word | Lens holding the key word | The lens reads in from the start of the verse to its resting place |
| 7 | Misconception | The strike wins | "LIE" fades and shrinks; only the red strike is left | A short red stroke | The strike draws across "LIE" |
| 8 | Testimony | Still moving | The ring rolls to the edge like a wheel (turning by the distance it travels) and keeps its slow spin | A small turning ring | Its centre beats once |
| 9 | Hard question | The head tilt | The "?" shrinks to the right and tilts its head 14° | A tilted "?" | It wobbles once, thinking |
| 10 | Prayer night | Moonset | The moon arcs down the sky, turning −24° → 50°, and the ground deepens | A small crescent | Three stars come out one by one |

## Why each one
- Every gesture keeps its own meaning while it folds. The sun *sets*, the quote *closes*, the name becomes *initials*, the lie gets *struck out*, the question stays *asked*. Nothing just shrinks.
- No two share a direction: down (sun), sideways into a point (Him), down with weight (struggling), onto the text (grateful), into a monogram (character), a zoom (lens), subtraction (strike), rolling (ring), a tilt (?), an arc (moon).
- The beats are short (≤700ms), play once, and only when the page comes to rest on an open card, within the design system's 160–700ms and "not on every revisit" rules.

## Changes to existing art
- **Deep verse:** the lens holds the verse's **key word** instead of the ninth word, which on day 6 was "the". Proposed rule: the longest word in the first clause, so "enmity" for Genesis 3:15. A hand-picked `keyWord` field in the devotional data would be better.
- **Deep verse:** the lens rests beside the title (centre 300, 64), not over the words.
- **Misconception:** "LIE" moves up 42pt and the strike spans only the word (x 244–384), so it never crosses the title or reference. Before, it ran through the title, as if the title were the lie.
- **Titles:** long titles shrink to fit two lines (`numberOfLines={2} adjustsFontSizeToFit`, minimum 20pt), so the steps never collide.

## Not changed, flagged
The production category themes have contrast problems the scan catches on every board, even without these folds. For example, the struggling letter's peach label on green is 2.4:1, and on several days the category art sits under the label or title. That's a separate fix to `CATEGORY_THEME` and the gesture positions, and I've kept it out of scope here.

## Scan answers (cat-r4)
- Text on art and contrast FAILs: production art and labels, flagged above.
- Violet gradient: Prayer night's production ground.
- Testimony seam warning: the production ring spins continuously (24s per turn), so a 4.8s design loop can't close on it. Deliberate.

## Build notes
- `CategoryGesture` gets `e` and `m` shared values. Each case returns its own `useAnimatedStyle`, transform-only plus the ground overlay (Daily Church dusk, Prayer night deepening).
- Grateful letter needs where the title ends: use `onTextLayout` on the title (the last line's `x + width`, `y`), then scale by `.77` for the slim position.
- Character study: split the name into the initial plus the rest (per-letter `Animated.View`s for the type-out).
- Deep verse: the key word can be derived (longest word in the first clause) until the data carries one.

## Files
- `categories.html`: ten boards, each with a live card (open → slim → open, then the beat) and frozen halfway and slim frames.
- `shots/cat-r4/sheet.png`, `reels/01-daily-church.mp4` … `reels/10-prayer-nights.mp4`.

---

# The reading, per category

Today the reading looks the same every day: header, painting, story, yellow verse card, "Carry this with you", "I've read it". Each category below changes the **structure** to match what that kind of devotional is for, not just the colours. The close button, the four-step progress bar and the bottom button stay in the same places on every screen. Only their colours follow the category. All text in the mockups is the real devotional for that day, except the samples marked *new data*.

| Day | Category | Idea | What changes | Moment / interaction |
|---|---|---|---|---|
| 1 | Daily Church | **The morning service** | The sun rises behind a yellow header. The reading is set like an order of service: 1 The reading (verse, large), 2 The message (story), 3 Take home (insight) | The sun rises as the screen opens |
| 2 | Jesus Only | **His words in red** | A red-letter page. Narration sits back in muted ink and the spoken words (anything in quotes) are red. Faint "Him." behind the title | None. The colour does the work |
| 3 | A struggling letter | **Dear friend** | The reading is a letter on lined paper over the green ground, opening with a handwritten "Dear friend,". The verse is a peach note clipped to the page | The paper settles in, tilted −1° |
| 4 | A grateful letter | **The thank-you card** | The verse is the front of a card. The inside holds the story. It ends with one handwritten line, "Thank you for…", that you fill in (stays on the phone) | Button reads "Save and finish" |
| 5 | Character study | **The profile** | The person's name is the header (ADAM, initial in dark). Fact chips (*new data*). The story is told as numbered scenes on a thread | Scenes tick off as you read |
| 6 | Deep verse | **One verse, slowly** | The verse fills the first screen in 34pt. Scrolling lights it word by word. The key word is ringed and opens a word study (*new data*) | Reading lights the verse |
| 7 | Misconception | **Struck through** | "What people say" comes first (*new data*), and a red strike draws through it as you scroll. Then "What Genesis says" (the verse), then the story and the truth | The strike draws as you read |
| 8 | Testimony | **Then, the turn, now** | The ring header stays. The three story paragraphs become a timeline (Then / The turn / Now) whose line fills as you read | The line is the reading progress |
| 9 | Hard question | **Sit with it** | The question leads at 40pt (*new data*). The story, then "One answer" under a blurred cover: hold to see it. Afterwards: "It is not the only answer." | Press and hold to reveal |
| 10 | Prayer night | **By moonlight** | The app's plum night sky (same as Night Prayer). The verse in moonlight, then "Pray it back" (*new data*). The button says "Amen" | Stars come out on open |

## Where the painting goes
Every category keeps the day's painting, placed to suit its structure:
- **Daily Church:** after the message.
- **Jesus Only:** full width between the red letters and the story.
- **Struggling letter:** a photo clipped inside the letter.
- **Grateful letter:** on the inside of the card.
- **Character study:** a portrait beside scene one.
- **Deep verse:** none (the verse is the picture).
- **Misconception:** after the truth.
- **Testimony:** at "The turn".
- **Hard question:** behind the revealed answer.
- **Prayer night:** with a night veil.

## New data it needs
The current devotional data has only title, reference, verse, story and insight. Five categories need one more field each, written per day:
- **Character study:** `character: { name, facts: string[3] }`, for example "The first man · Genesis 2–5 · Hiding in the garden".
- **Deep verse:** `keyWord: { word, original, meaning }`. Without it, fall back to the longest word with no study card.
- **Misconception:** `myth`, one sentence people actually say. Without it, skip the struck card.
- **Hard question:** `question`. Without it, use the title.
- **Prayer night:** `prayer`, one sentence. Without it, use the insight.

The sample lines in the mockups ("Why would God protect a murderer?", "After they sinned, God walked away from them.", the enmity word study, the facts, the prayer) are placeholders to show the layout and need writing properly.

## Other decisions
- **A handwritten face** (Caveat in the mockups) for "Dear friend," and "Thank you for…". The design system already has a Handwritten role, but no font for it is bundled yet.
- **Jesus Only "red letters"** colours God's spoken words (in quotes), not only Jesus's, since Genesis has no words of Jesus. Say if you'd rather keep this strictly to the Gospels.
- **Hard question's hold-to-reveal** has an accessible path: VoiceOver reads the answer, and a single tap also reveals it.

## Scan answers (read-r4)
The remaining failures are all deliberate background art behind text: "Him.", the peach “ tucked under the letter, ADAM bleeding off the edge, and the "?". The other one is the blurred cover over the hidden answer, which is meant to be unreadable until you hold it.

## Files
`readings.html`, `days.js` (the real text for days 1–10), `shots/read-r4/sheet.png`.

---

# Opening Today's card, per category

Now: tapping Today slides up a generic sheet. Proposed: the card itself becomes the screen. Its rectangle grows to full screen, its words fade, its art travels to the top of the walk, and the steps sheet rises. On the way, each category does one thing of its own. About 1s in all; a tap during it skips to the end. Closing plays it back in reverse into the card.

| # | Category | Opening | What happens |
|---|---|---|---|
| 1 | Daily Church | **Sunrise** | The card grows and the sun rises its last 80pt; the ground warms from dusk to morning and the sun's rings widen once |
| 2 | Jesus Only | **Through the full stop** | The gold full stop grows over the screen, then opens from its centre like a ring; the red page is inside it |
| 3 | A struggling letter | **The letter unfolds** | The steps sheet comes down like a folded letter opening, hinged at its top edge (rotateX −92° → 0 with a little overshoot); the quote mark lifts |
| 4 | A grateful letter | **The card opens** | The card's front swings open on a left hinge like a greeting card (rotateY 0 → −180°), then the pink inside fills the screen and the ” springs |
| 5 | Character study | **The name, written out** | The name gathers into its initial as the card lifts; at the top, the rest of the name is written out letter by letter |
| 6 | Deep verse | **Through the lens** | The page opens as a circle growing out of the lens, its rim fading as it passes the edges |
| 7 | Misconception | **The strike** | A red band sweeps the screen at −12°; the walk is uncovered in its wake, and the thin strike draws across "LIE" |
| 8 | Testimony | **It rolls in** | The ring rolls off the card and across the screen, and the walk unrolls behind it |
| 9 | Hard question | **The dot drops** | The dot falls out of the question mark, bounces, and stretches into the "Open today's letter" button |

## Rules
- **The card is the transition.** In SwiftUI terms it's a zoom transition (`matchedTransitionSource`). In the app it's a full-screen overlay that starts at the card's frame, replacing the `pageSheet` slide, so the card visibly becomes the walk.
- **Transforms and clip only.** The grow is a clip (rounded rect, circle for Deep verse, edge for Testimony and Misconception), and the art, sheet and button move by transforms. Nothing re-lays out, so it can't stutter the way the Home fold did.
- **About 1s total.** The beat is the first 0.6s, and the sheet lands by 0.9s. It's interruptible: a tap jumps to the end. It plays every time you open the card, since it's navigation, not a ceremony, but it's kept short.
- **Haptics:** one light impact when the sheet lands. On Hard question, when the dot becomes the button.
- **Reduce Motion:** a 200ms cross-fade from the card to the walk, with no beat.
- **Close:** swipe down or ✕ plays it back into the card, beat reversed.

## Files
`openings.html`, `reels/o01-daily-church.mp4` … `reels/o09-questions.mp4`, `shots/open-frames/sheet-0..2.png` (six frames inside each opening).

---

# Scripture and word: one experience per category

This replaces the per-category reading screens as the "Scripture and word" step. Prayer, Quick check and One small step stay as they are. Each experience takes 3 to 5 minutes, ends on the day's verse and insight, and has a plain-read fallback (the current reading screen) for VoiceOver and Reduce Motion. Mockups use the real day 1–9 content. Prayer Nights is drawn as asked, but it's currently removed from the rotation.

| # | Category | Experience | Core interaction | End moment | New content per day |
|---|---|---|---|---|---|
| 1 | Daily Church | **Illustrated mini-talk** | The day's painting with 3 numbered spots. Tap one and a sheet rises with that point of the talk (title, two sentences, verse). Found spots turn gold | "Finish the talk" after all three | 3 hotspots: `{ x, y, title, body }` on the painting |
| 2 | Jesus Only | **A quiet walk** | Full-screen painting. Swipe and the camera drifts deeper into it, and each stop shows one of His words. A path line shows 3 stops | "Sit here a moment" at the last stop | Words split into 2–4 stops (can be derived from the verse) |
| 3 | Struggling | **A letter in messages** | Pre-written lines arrive a few at a time; tap one of 2–3 replies. The verse arrives as its own bubble. An "If you're not okay today" link stays visible | The letter signs off | A short script with replies (`[{ from, text } \| { choices }]`) |
| 4 | Grateful | **Photo journal** | Polaroids scattered on the page. Tap one and it flips to a handwritten thank-you on the back, then the next | "Small, and still from Him." | 4–6 thanks, each with an image |
| 5 | Character Studies | **Graphic novel** | Comic pages of 2–3 panels with captions. Tap the last panel to page on. Key moments are full-page panels | The last page lands on the verse | 3–4 pages of panels (image + caption) |
| 6 | Deep Verse | **Study desk** | The verse on paper on a wooden desk. Highlight a phrase, open the sticky margin note, and pull a red thread to a linked passage card | Linked card opens with a note on the connection | 1–2 notes and 2–3 linked passages |
| 7 | Misconceptions | **Look again** | One painting, greyed with the assumption on it. Drag the divider and it colours in, and the verse replaces the assumption | "I see it now" | `myth` (one sentence) |
| 8 | Testimonies | **Film reel** | A viewfinder frame, a quote and the story; a filmstrip below scrubs through chapters (Before / The turn / Now) | The "Now" chapter | Story split into 3 chapters (current 3 paragraphs work), plus frames |
| 9 | Honest Questions | **Branching conversation** | The question big, with 3 follow-ups on a branch line. Pick one, get an answer card, then 2 new follow-ups. A path of 3 steps | The 3rd answer closes with the insight | A small tree: question → 3 → 2 → answer |
| 10 | Prayer Nights | **Bedside ritual** | A bedroom at night: write worries on notes, drop them in the box, then "Pray over them" | The lamp dims: "It's in His hands now." / Amen | None (worries are the user's, kept on the phone) |

## Build order (content is the constraint)
1. **Runs on today's data:** Testimony reel, Jesus Only walk, Misconception slider (falls back to no myth), Prayer night (no daily content).
2. **Needs a small written field:** Deep Verse desk, Honest Questions tree, Daily Church hotspots.
3. **Needs a writing plus art pipeline:** Struggling script, Grateful thanks, Character graphic novel.

## Care
- **Struggling:** clearly a written letter, not a person or AI; replies are tap-only. "If you're not okay today" opens real help (988 in the US, local lines elsewhere).
- **Prayer night:** worry notes never leave the phone and are cleared after Amen.

## Scan answers (exp-r3)
- **Scripture text:** "crush your" in Genesis 3:15 trips the copy check, but it's the verse itself.
- **Decorative lines:** the red thread and branch lines (SVG) over text are deliberate.
- **Stacked notes:** the stacked worry notes overlap on purpose.
- **Testimony and Prayer night contrast:** these flags are measured against the device frame, not the dark scene. On the dark ground they pass.
- **Struggling “ mark:** the quote mark in the avatar is decoration.

## Files
`experiences.html`, `shots/exp-r3/sheet.png`, `shots/exp-r3/review/` (two frames per category).

## Polish pass (exp-r5)
- **Daily Church:** numbered dots became labelled pins on the painting (The light, Two in the boats, The water). Below sits a talk outline that fills as you find them (locked until found). The point sheet gets a "Point 2 of 3" chip and a verse pull-quote.
- **Jesus Only:** a dotted footpath runs into the painting with three lanterns that light as you walk. Stronger top shade so the words read. "Lantern 1 of 3" replaces "Stop".
- **Struggling:** now a real thread: a sender row (From Closer), a timestamp, your replies in green with "Read", and the verse as a message card with the painting. Replies sit in a bottom tray with "Not okay today?" always visible.
- **Grateful:** journal paper with a margin line, washi tape on each snapshot, handwritten day captions, five-dot progress. The turned card is ruled, with the source photo clipped on.
- **Character:** halftone on the panels, yellow caption boxes, a real speech bubble with a tail, a burst behind "WHERE ARE YOU?", a page counter tag, and "The first man · Genesis 2–5" under the name.
- **Deep Verse:** a wood desk with grain, a stacked paper sheet with a red margin, a highlighter stroke, a pinned sticky note, and a red thread with pins to ruled index cards. Physical tool icons (highlighter, note, thread).
- **Misconception:** ASSUMPTION / SCRIPTURE tags, each line kept to its own side of the divider, plus one plain line under each ("What a lot of us were taught", "He covers them Himself").
- **Testimony:** a speaker row (Maria, 41, Leeds), a monospace timecode, viewfinder corners and vignette, sprocketed film with a playhead, chapter progress in three segments.
- **Honest Question:** a branch line that curves into each choice, a faint "?" behind, a gradient answer card with its reference, and a connected path indicator.
- **Prayer night:** an arched window with the moon, a tapered lampshade with a light cone, a wooden box with a label plate, worry notes in the box, "Drag it to the box" on the new note. Dimmed, the box and lamp go dark.

**Remaining scan flags (deliberate):** the faint "?" watermark, the Genesis 3:15 wording, caption boxes on solid colour measured against the painting, the thread and branch SVGs over text, and the lantern glow.

---

# Motion: the first-pass experiences (experiences-motion.html)

Each one is an 8-second loop of the experience doing its job, with a finger showing the tap or drag. Soft springs with one small overshoot for things that arrive, ease-in-out for things that travel, fades for text, and nothing moving that didn't change. Reduce Motion swaps every move for a cross-fade and keeps the end state.

| # | Category | The motion | Beats (s) |
|---|---|---|---|
| 1 | Daily Church | Tap a spot: it pops, turns gold, and the point sheet springs up. Its body, then the verse, fade in after it lands. Swipe down closes it and the next spot is found. Untapped spots breathe with a soft ring | tap 1.0 · sheet 1.15–1.9 · close 5.4 · next 6.6 |
| 2 | Jesus Only | Swipe: the camera walks into the painting (scale 1.12 → 1.55). His words fade out mid-step and back in on arrival, and the path line fills | walks 1.2–2.6, 3.8–5.2 · drift back 7.0 |
| 3 | Struggling | Typing dots, then each line pops up. Replies slide up as a stack; the tapped one springs into the thread. The verse arrives as its own bubble | lines 0.7 / 1.8 · tap 3.3 · verse 5.3 |
| 4 | Grateful | Tap a polaroid: it lifts, flies to the centre and grows while flipping in 3D to the handwritten back. The rest dim, then it flips back to its place | tap 1.0 · fly 1.1–1.9 · back 6.1–7.0 |
| 5 | Character Studies | Panels arrive one by one. Tap the last panel and the page turns on a left hinge to the full-page moment; the caption bubble pops | tap 2.2 · turn 2.3–3.1 · bubble 3.2 |
| 6 | Deep Verse | The highlighter sweeps the phrase, the sticky note drops on with a swing, the red thread draws to Romans 16:20, which lifts off the desk and opens | 0.6 · 1.6 · 2.8–3.6 · 4.0 |
| 7 | Misconception | Drag the divider: colour floods in behind it, the assumption fades as it's crossed, and the verse rises in. "I see it now" slides up | drag 1.0–2.6 · back 5.8–6.8 |
| 8 | Testimony | The reel plays: timecode runs, REC blinks, slow push-in. Scrub the filmstrip and the chapter cuts with a white flash | scrub 2.2–3.4 · cut 2.95 |
| 9 | Honest Questions | Tap a choice: the question shrinks back, the pick slides up the branch while the others fall away, the answer card grows out of it, then the follow-ups rise | tap 2.0 · answer 2.9 · follow-ups 3.6 |
| 10 | Prayer Nights | Drag the note into the box. Tap pray: the lamp flickers and dims, the room cools, and "It's in His hands now" fades in | drag 0.8–1.8 · dim 2.8–3.6 · words 3.7 |

**Haptics in the app:** a light tap on each find, flip, reply, page turn and thread link; a soft success on the end moment. None on ambient motion.

**Reel check:** all 10 loops close cleanly. The flagged stills (2.6–3.5s) are deliberate reading pauses. Testimony's seam warning is the chapter-cut flash.

**Files:** `experiences-motion.html`; `reels/m01…m10-*.mp4`; `reels/experiences-all.mp4` (all ten side by side); `shots/mframes/sheet-0.png`, `sheet-1.png`.

---

# The letter, per category (letters.html)

The envelope that opens every day becomes the category's own object. You tap it, it opens in about 1.2 seconds, and it hands off directly to the first frame of that day's experience (no extra fade). Everything else (the walk's close button and progress bar) appears as the experience lands.

| # | Category | The object | Tap, and… |
|---|---|---|---|
| 1 | Daily Church | A folded order of service with the sun on its cover | Its two panels swing open like a bulletin: 1 The reading, 2 The message, 3 Take home. The painting rises in |
| 2 | Jesus Only | A red envelope sealed with a gold full stop | The seal splits in two, the flap lifts, and a card in red ink rises out. The painting fades up behind His first words |
| 3 | A struggling letter | A note folded in thirds, slipped under a door ("for a hard day") | It slides into the light and unfolds to "Dear friend,". The first line becomes the first message |
| 4 | A grateful letter | A pink card envelope with a polaroid peeking out ("for you, with thanks") | The polaroid slides out, flips and lands showing a thank-you. The journal of snapshots settles in around it |
| 5 | Character study | A comic book, "ISSUE 05 · ADAM" | The cover swings open on its spine and the first page grows to fill the screen |
| 6 | Deep verse | One index card in a wooden catalogue drawer | The drawer slides out, the card lifts and turns to face you, and becomes the paper on the desk |
| 7 | Misconception | A plain envelope stamped LOOK AGAIN | A red strike tears across it, the halves fall away, and the grey picture with the assumption is left |
| 8 | Testimony | A film canister labelled "Maria · 3 chapters" | The lid lifts off, the reel spins and the film runs across the screen into the first frame |
| 9 | Honest question | A small square of paper, folded, with a "?" | It flattens and grows, the creases fade, and the question is written inside, big |

**Rules:**
- The open is 1.05–2.25s from the tap. The experience lands from 2.0s, so it starts before the object finishes, which keeps it from feeling like a wait.
- Each object carries the day's real content (title, reference, first line) so the hand-off reads as one piece.
- **Haptics:** one light tap on press, one soft success on the land.
- **Reduce Motion:** a 200ms cross-fade from object to experience.

**Speed fixes already in the app:**
- **The current envelope:** total time from tap to reading went from about 4.7s to about 1.6s. The open sequence dropped from 3.1s to 1.0s, the letter exit from 0.8s to 0.3s, and the reading reveal from 0.8s to 0.34s.
- **The card-to-walk opening:** from 1.0s to 0.65s, and the close from 0.6s to 0.42s.

**Files:** `letters.html`; `reels/l01…l09-*.mp4`; `reels/letters-all.mp4`; frame sheets `shots/mframes/letters-0.png`, `letters-1.png`.
