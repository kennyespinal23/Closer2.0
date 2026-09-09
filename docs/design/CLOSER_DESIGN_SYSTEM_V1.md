# Closer Production Design System v1

Status: governing production specification, with explicitly provisional visual decisions below.  
Formalized: 2026-09-09.  
Scope: documentation only. Implementation requires explicit instruction.

This document supersedes the earlier conversational v1 proposal wherever they differ. It incorporates the user's final corrections. It does not authorize screen redesign, repository refactoring, dependency installation, asset changes, or product changes.

## 1. Authority and scope

1. **Existing application:** authoritative for functionality, navigation semantics, state, persistence, business logic, Bible data, progress, streak rules, badge eligibility, bookmarks, highlights, notes/reflections, authentication, subscriptions, Screen Time/blocking, notifications, deep links, and existing user-data contracts. Never infer functionality from an image.
2. **This production design system:** authoritative for color roles, typography roles, spacing, materials, paper, depth, controls, icon treatment, illustration behavior, hierarchy, motion, accessibility behavior, and visual density.
3. **Approved Closer production references:** authoritative for composition, visual relationships, art direction, relative hierarchy, atmosphere, and emotional character. They are not literal pixel specifications. Correct contradictory sample content against existing behavior.
4. **Third-party inspiration:** may inform dimensionality, spatial composition, interaction ideas, use of space, and explicitly designated rendering quality. Must not introduce external branding, palettes, navigation, content, information architecture, or features.

Special case: the CleanShot and Instagram references have elevated authority **only for blue atmospheric rendering quality**, not any other aspect of Closer.

All 17 supplied references are still images. Timing and gesture specifications here are production decisions, not observations of recorded motion. Generic skill defaults must not override these approved Closer rules.

### Decision status

- Canonical: Closer Orange `#FF4326`; authority boundaries; existing navigation and behavior.
- Established production rules: material separation, whitespace, typography roles, geometry, density, motion contracts, accessibility behavior, and incremental migration.
- Provisional: exact sky tokens/stops, paper/ink token calibration, final font families, detailed shadow rendering, and the accessible CTA label treatment for affected contexts.
- Deferred: complete companion dark art direction and comprehensive secondary-state coverage. Preserve existing functionality while resolving these incrementally.

## 2. Identity and whitespace

Closer combines **open blue atmosphere plus warm physical paper**, navy ink, human handwriting, tactile illustration, and a consistent orange action language.

**Empty space is an intentional design element.**

Do not add cards, illustrations, statistics, labels, decorative objects, doodles, or secondary actions merely to fill unused space. Every visible element must improve hierarchy, comprehension, emotional tone, navigation, or interaction. Favor one strong focal point over competing elements. Generous blue negative space is part of the brand.

## 3. Color roles

| Role | Specification | Status |
|---|---|---|
| Closer Orange | `#FF4326` | Canonical; never silently substitute |
| Sky upper | Confident saturated blue | Exact value provisional |
| Sky middle | Clean luminous sky blue | Exact value provisional |
| Sky lower | Light/pale blue | Exact value provisional |
| Paper/canvas | Warm cream; starting candidate `#FFF5E3` | Calibrate visually |
| Standard paper | Warm ivory; starting candidate `#FFFAF0` | Calibrate visually |
| Inset paper | Slightly warmer/darker; candidate `#F8ECD9` | Calibrate visually |
| Primary ink | Deep navy; candidate `#10243D` | Verify contrast and rendering |
| Secondary ink | Candidate `#56616A` | Verify per material |
| Muted ink | Candidate `#72766F` | Meaningful text still requires contrast |
| Inverse ink | White where background contrast permits | Context-dependent |
| Fine border | Candidate `#DED8CC` | Decorative; not sufficient alone for every control |

Pastel blue, mint, peach, and pale yellow support category tiles and artwork. They are not competing action palettes. Define selected, pressed, disabled, error, and focus roles consistently; do not use color alone to communicate state. Pressed feedback may use scale or another restrained treatment without introducing a second CTA fill color.

### Canonical orange and accessibility

Primary buttons read as **one solid `#FF4326`**. No gradient CTA, darker patch beneath text, dual-orange treatment, or silent replacement of the brand color.

Calculated using opaque sRGB relative luminance:

- White on `#FF4326`: approximately **3.45:1**. This fails the 4.5:1 normal-text target, though it exceeds the 3:1 large-text target.
- Candidate navy `#10243D` on `#FF4326`: approximately **4.53:1**, narrowly meeting 4.5:1 for opaque normal text.

Recommended accessible option for normal-size labels: retain the solid canonical orange and use an approved dark ink label. This needs visual approval before the affected CTA ships. If white is retained, demonstrate that the actual rendered size/weight qualifies as large text; do not assume a semibold label qualifies. Do not enlarge every button solely to bypass contrast. Verify actual font, rendering, backgrounds, and interaction states. Navy's narrow margin warrants conservative verification.

Target at least 4.5:1 for normal text, 3:1 for qualifying large text, and 3:1 for essential non-text control/state indicators. Accessibility issues are documented and resolved explicitly rather than changing the orange covertly.

## 4. Sky atmosphere: an independent system

The sky progression is **saturated blue → clean sky blue → light/pale blue**. Cream is not a required or inherent gradient stop.

The sky must feel clean, luminous, saturated, modern, spacious, and extremely smooth. Prefer a controlled vertical linear gradient or similarly predictable rendering. Provide tonal depth without turning the field into decoration.

Avoid cloudy white patches, milky areas, random cyan hotspots, visible radial glows, muddy blue-gray areas, gradient bands, abrupt transitions, competing gradients, artificial spotlights, excessive blur, noisy textures, decorative blobs behind cards, and effects added to fill space.

- Anchor the gradient to the intended hero composition, never total scroll-content height.
- Do not force every screen to expose the entire gradient. Some remain predominantly blue; others meet a separate cream region earlier.
- Do not animate the gradient continuously or stretch it as content grows.
- Preserve large uninterrupted blue areas.
- White text belongs only on sufficiently dark blue; use appropriate ink as the field lightens.
- Validate banding, transitions, tonal balance, and safe-area continuity on actual devices.

### Gradient-quality references

- [CleanShot 2026-09-09 at 6.27.07 PM@2x.png](../../references/CleanShot%202026-09-09%20at%206.27.07%20PM%402x.png)
- [Instagram.jpeg](../../references/Instagram.jpeg)

The instruction names CleanShot with a `.jpeg` extension; the actual supplied file is `.png`. This document refers to that existing file; no rename is required.

Use these only for gradient cleanliness, blue saturation, luminosity, smoothness, atmospheric depth, and large blue negative-space treatment. Do not copy their interface, typography, navigation, cards, imagery, content, branding, features, or information architecture. Do not blindly sample their colors.

Final sky tokens must be calibrated against approved Closer references, these two rendering-quality references, and actual device rendering. Existing sky values are not automatically final.

## 5. Cream and paper: an independent system

Cream belongs to paper cards, reading surfaces, appropriate lower content canvases, navigation surfaces, notes, editorial surfaces, and utility regions.

A paper object may overlap sky. A cream content region may begin after a sky hero. A reading or utility screen may be predominantly paper. A softened compositional boundary is permitted where useful, but do not automatically fade every sky into cream or build one enormous blue-to-cream gradient.

| Material | Treatment | Usage |
|---|---|---|
| Standard paper | Warm ivory, barely visible grain, clean rounded edges | Cards and ordinary content surfaces |
| Inset paper | Slightly warmer/darker, little or no elevation | Nested regions |
| Keepsake paper | Irregular/torn edge, visible but restrained texture | Scripture notes, meaningful annotations, celebrations |

No torn edges everywhere, dirty texture, obvious repeating grain, or heavy creases behind text. Reading clarity takes priority over texture. Maximum visible paper stack: **three layers**.

## 6. Typography

Three roles are approved; exact families remain unresolved. Do not choose final fonts arbitrarily or install new dependencies. Evaluate Shantell Sans and existing unused font dependencies as candidates only.

| Role | Responsibility |
|---|---|
| Handwritten | Greetings, encouragement, selected section headings, short annotations, human/emotional moments |
| Editorial serif | Bible book titles, Scripture, reflective reading, important celebration statements, editorial moments |
| Interface sans | Controls, descriptions, navigation, metadata, operational information |

Use one dominant title treatment per screen. Handwriting never carries long instructions or dense content. Serif establishes reflective/editorial importance; sans handles practical interaction. Keep long paragraphs left-aligned; center only short statements where composition warrants it. Use tabular sans numerals for operational counts, dates, calendars, timers, and statistics. Expressive celebration numerals remain live text.

### Starting type ramp

Sizes/line heights are logical units and must be tuned after family selection, not treated as immutable font metrics.

| Role | Size / line height |
|---|---|
| Handwritten page title | 34 / 42 |
| Handwritten section title | 25 / 32 |
| Short handwritten annotation | 18 / 26 |
| Editorial display | 36 / 42 |
| Editorial reading | 19 / 29 |
| Interface title | 22 / 28 |
| Interface body | 17 / 24 |
| Metadata | 14 / 20 |
| Short uppercase eyebrow | 12 / 16 |
| Bottom-navigation label | 11 / 14 |

Accommodate existing reading-size preferences, accessibility text scaling, long content, and available viewport. Never flatten important text into artwork. Font approval is P0 for production typography that depends on it.

## 7. Spacing and geometry

All dimensions are logical mobile layout units, not screenshot pixels.

| Item | Standard |
|---|---|
| Base scale | 4, 8, 12, 16, 24, 32, 40, 48 |
| Screen gutters | 24 |
| Narrow-screen gutter fallback | 20, consistent within the screen |
| Standard card padding | 20 |
| Large editorial surface padding | 24 |
| Related-item spacing | 8–12 |
| Section spacing | 24–32 |
| Hero-to-content separation | 32–48 where composition requires |
| Collection gaps | 12 |
| Minimum touch target | 44 × 44 |
| Primary CTA height | 56 minimum, grows with text scaling |

Measure safe areas, navigation, keyboard, focus mini-player, and dynamic-content clearance. Do not encode them in arbitrary fixed screen heights. Use responsive layouts and scroll fallback. Illustration yields space before text. Do not fill extra space just to reach a prescribed hero size.

### Corner-radius system

| Element | Radius |
|---|---|
| Small inset/chip | 12 |
| Icon tile/small card | 20 |
| Standard paper card | 28 |
| Large feature surface | 32 |
| Buttons/segmented tracks | Pill |
| Utility controls/avatar | Circle |

Use continuous corners where supported. Keepsake edges are a material silhouette, not a new arbitrary radius.

## 8. Shadows and depth

Use one coherent soft shadow family. Shadow describes elevation rather than ornament.

| Level | Responsibility | Starting calibration |
|---|---|---|
| Flat | Reading canvas, inset regions | No shadow |
| Resting paper | Ordinary paper surface | Downward offset 3, blur 12, about 6% opacity |
| Lifted object | Featured paper/object | Downward offset 8, blur 24, about 10% opacity |
| Foreground/celebration | Strongest permitted depth, still soft | Downward offset 12, blur 32, about 12% opacity |

Numerical shadow values are starting calibration, subject to device rendering. Avoid dark outlines pretending to be shadows, multiple heavy shadows, excessive stacks, and duplicate shadows around an illustration that already contains grounding shadow.

## 9. Handwritten accents, density, and asymmetry

Approved accent family: underline, heart, directional arrow, short rays, brief handwritten note. Use consistent authored strokes. Annotations relate to nearby content, never random decoration.

- One primary underline per screen.
- At most two additional decorative accents on an ordinary atmospheric screen; these are ceilings, not quotas.
- Celebration scenes may use up to four accents when they read as one composed scene.
- Underlines sit clear of descenders and follow associated text; arrows point to meaningful relationships.
- Do not randomize placement on each render.
- Hand-drawn decoration never resembles or replaces an interactive control.
- Collection tiles do not each acquire doodles, rotation, and independent effects.

| Object | Maximum intentional rotation |
|---|---|
| Ordinary UI, controls, navigation, statistics, body text | 0° |
| Featured paper | ±2° |
| Keepsake note | ±3° |
| Illustration-only decorative layers | ±5° |

Readable content generally stays level. Where useful, rotate the decorative backing rather than its text. Favor placement and overlap over crooked content. No accidental clipping of controls or text.

## 10. Illustration system

Materials: paper, clay, painted wood, soft ceramics, fabric, and natural materials. Dimensional and tactile, without becoming plastic, childish, or photorealistic. Maintain soft coherent lighting, restrained highlights, grounded shadows, clear silhouettes, and consistent optical weight. Dimensional avatars may remain an identity-specific treatment.

| Context | Scale guidance |
|---|---|
| Navigation/category artwork | 28–40 within approximately 56–64 tile |
| Bible collection artwork | 56–72, optically consistent |
| Atmospheric hero | Approximately 25–35% of initial usable viewport |
| Celebration hero | Approximately 35–45%, responsive fallback |

Use one major illustration per ordinary screen. Ratios are guidance, not a reason to fill negative space. Overlap stays within the composed region, away from controls and readable content. Artwork yields space first on constrained viewports.

Badge names, streak counts, dates, Scripture, and progress numbers remain live content, never rasterized. Catalog artwork with transparent bounds, optical scale, and intended placement. Separate layers only where composition or purposeful motion needs it. Reuse material assets consistently; do not generate or modify assets during this documentation phase.

## 11. Icons, controls, and CTA

- Use one coherent functional icon family, normally 22–24 units. Decoration is separate.
- Functional icons remain precise; selected icons may fill consistently.
- Circular utilities use restrained translucent treatment over sky and paper treatment over cream.
- Maintain accessible names, state announcements, focus behavior, and 44 × 44 hit areas.
- Preserve native picker, permission, sharing, and other platform behavior.

Primary CTA: solid canonical `#FF4326`, pill shape, minimum height 56, semibold interface sans, optional trailing arrow when progression is implied. Avoid duplicate icons. Resolve label contrast as described above. One dominant CTA per screen; secondary actions remain quiet, using ink/text or fine outline where appropriate.

No breathing, pulsing, floating, or glowing CTA loops. Loading preserves dimensions and understandable progress. Disabled and loading states are distinct, and rapid input must not produce duplicate business actions.

## 12. Navigation and headers

Primary destinations remain **Home, Bible, My Blocks, Profile**. References showing Stories, Plans, More, Streaks, Daily, Explore, Saved, or other arrangements do not create navigation requirements.

Target bottom-navigation appearance: warm paper surface, equal tab distribution, restrained inactive treatment, canonical orange active treatment, small selected indicator where appropriate, measured safe-area clearance. Resolve active icon/label contrast on the final paper color before shipping; do not silently substitute another orange. Existing routes, deep links, back behavior, tab/detail visibility, and flow semantics remain authoritative.

A future custom navigation view may be needed for fidelity, but this document does not mandate a navigation-library replacement or authorize changes now. Keep visual chrome separate from routing behavior.

Headers use consistent back/search/settings controls. Atmospheric headers use expressive handwriting; collection headers are compact; editorial detail uses serif hierarchy; utility/task headers use sans. A celebration can use a dominant serif statement with subordinate handwritten encouragement. Preserve actual navigation affordances; never remove required back/close behavior to match a mockup.

## 13. Screen families

Do not force every screen through one template.

| Family | Composition and use | Motion/decorative rule |
|---|---|---|
| Atmospheric | Home/selected discovery; clean sky, expressive hero, handwriting, generous negative space | One focal point, at most one ambient group, accent limits above |
| Collection | Bible/saved content; compact expressive heading, repeatable paper tiles, browsing hierarchy | Restrained decoration; no independently animated grid |
| Editorial detail | Bible book/insight detail; serif hierarchy, paper, intentional illustration, metadata | Calm; ornament supports content |
| Reading | Bible chapter/sustained devotional; stable paper, excellent typography | Minimal motion, low decoration; actively read text stationary |
| Personal dashboard | Profile/streak dashboard; identity, statistics, encouragement, utility | Stable data; decorative elements subordinate |
| Celebration | Streak completion/badge unlock; crafted central object, serif statement, handwritten support, continuation | More expressive, but brief and interruptible where relevant |
| Utility/task | My Blocks/settings/permissions/editors; practical hierarchy and simple surfaces | Little decoration; illustration only when useful |
| Onboarding | Existing flow using Closer materials, type, atmosphere, illustration | Preserve product sequence and behavior; no borrowed third-party features |

## 14. Closer Motion System

**The interface responds quickly; the world moves slowly.**

Controls respond immediately. Environmental motion stays subtle and calm. Motion is never required to understand the interface: every badge, shine, tilt, ambient movement, draw-on, paper settling, celebration entrance, progress animation, and illustration reveal has a complete static final state.

| Motion role | Contract |
|---|---|
| Press feedback | Starts on press-in, no intentional delay; 80–120 ms feedback transition |
| Button/card return | Approximately 140–180 ms; subtle press scale around 0.985 |
| Row press | Background feedback, no scaling |
| Utility press | Restrained opacity/fill feedback |
| Small state changes | 160–220 ms |
| Paper settling | 250–350 ms, small displacement/rotation |
| Handwritten draw | 300–450 ms; selectively, once, not on every revisit |
| Celebration entrance | Approximately 450–650 ms |
| Supporting celebration sequence | Completes within approximately 1.2 seconds |
| Ambient movement | Approximately 6–10-second cycles; subtle 1–3-unit movement or less than 1° rotation, except the explicit badge contract |

Use soft controlled springs without excessive bounce. Finger-driven movement follows the finger, remains interruptible, and settles from its live position. Use restrained timing for other transitions. Preserve existing navigation semantics and understandable static loading/progress states.

Ambient motion runs only while visible and the app/screen is active. Normally at most one ambient group per ordinary screen. Actively read text stays stationary. Haptics accompany meaningful interaction/completion, never decorative loops. Do not replay completion ceremonies simply on screen re-entry.

For future implementation, use existing Reanimated/Gesture Handler capabilities for continuous gesture motion rather than passing each frame through product state. This is an architectural direction, not authorization to refactor or install dependencies. Verify on-device responsiveness rather than assuming timing values ensure performance.

## 15. Reduced motion

Respect the existing combined system/application reduced-motion preference. Never override an OS request with an application setting.

Disable ambient floating, dimensional tilt, moving shine, draw-on strokes, and unnecessary layered movement. Present content in its final state. A short opacity transition may replace expressive entrances where appropriate.

Preserve pressed/selected feedback, understandable loading, completion feedback, and navigation comprehension. Do not replace one continuous animation with another. Static badges retain earned/locked meaning; static progress retains its true value.

## 16. Universal badge motion contract

All badges share this reusable contract. Artwork and metadata vary, not bespoke animation sequences.

| State | Behavior |
|---|---|
| Locked | Static, matte, desaturated; explicit locked/status treatment; no ambient movement or shine |
| Earned in collection | Static by default; no competing grid loops |
| Prominent earned badge | Float 2–3 layout units; coordinated dimensional tilt around ±3°, absolute maximum ±5°; occasional soft diagonal shine |
| Touch interaction | Optional tilt up to ±5°; restrained return; does not steal scrolling, interfere with tapping, or alter existing behavior |
| Newly unlocked | Stronger entrance, one prominent shine, then earned state |

Only one prominent badge animates at a time. All motion obeys visibility and reduced-motion rules.

### Earned display timing

- Float: 6–8-second cycle.
- Tilt: 8–12-second coordinated cycle; avoid independent wobbling.
- Shine: approximately 700–900 ms.
- Shine frequency: no more often than approximately every 18–24 seconds.
- Shine clips to the badge silhouette and never obscures its label or becomes a tap prompt.

### New unlock sequence

Begin near scale 0.90, 12 units below rest, with reduced opacity. Settle over approximately 500–650 ms. Maximum overshoot approximately 1.02. Then perform one prominent diagonal shine.

The generic supporting celebration sequence targets completion within 1.2 seconds. The badge shine is an explicit timing exception when played sequentially: entrance plus shine can take approximately 1.2–1.55 seconds. Other supporting elements still finish within the general target. Never hold the CTA or product transition for this decorative tail.

Use one success haptic tied to the actual earned event, not repeated renders or visits. Coordinate the owner with existing completion feedback to avoid duplicate haptics. CTA availability is independent of decorative animation. Badge eligibility and event persistence remain existing business logic.

Never use continuous 360° rotation, particle loops, flashing, constant sparkle, repeated bursts, or game-like reward loops.

## 17. Reference map and corrections

All files are in `references/` at the repository root. These mappings select the strongest composition without adopting conflicting sample features.

| Family | Primary reference | Notes |
|---|---|---|
| Home | `homepage.png` | Atmosphere, paper focal point, action hierarchy |
| Bible collection | `biblecollection` | Repeated tiles and collection structure |
| Editorial/book detail | `bible description` | Serif, paper, illustration, metadata |
| Profile | `profil` | Identity and utility hierarchy |
| Streak dashboard | `streaks` | Data and encouragement |
| Streak completion | `streaks1` | Crafted completion scene |
| Badge unlock | `badge screen` | Dimensional celebration |
| Reading | No direct complete reference | Derive calm paper/type from book detail; preserve reader behavior |
| My Blocks/settings/editors | No direct complete reference | Derive restrained surfaces/rows from profile |
| Onboarding | No direct Closer reference | Apply materials to existing flow |

`image` visually repeats the streak dashboard and is not a separate requirement. Remaining inspiration files: `Longevity Deck Swipe Cards Down Stack Interaction.jpeg`, `Profile Screen.jpeg`, `Profile UI Concept for Social Media App _ Creative User Profile Design.jpeg`, `Social Media Mobile App UI Design.jpeg`, `Walkthrough UI from UGLYCASH iOS App.jpeg`, `_ (13).jpeg`, `_ (14).jpeg`, plus the two named gradient-quality references. They inform composition/depth/space and possible interaction ideas only; their stills do not prove motion.

Specific corrections:

- Replace contradictory mockup tab arrangements with the four existing destinations.
- Reconcile streak dashboard current streak 12 versus longest streak 8 and inconsistent calendar highlights.
- Reconcile the seven-day completion headline with only six completed markers.
- Do not adopt the badge mockup's “completed 7 devotionals” as an eligibility rule where the app uses longest-streak thresholds.
- Treat Topics, Stories, Plans, and similar mockup labels as examples, not authorized scope.
- Normalize handwriting hierarchy, icon weights, CTA size, radii, paper texture, shadow, and illustration optical scale.
- Reduce crowding and competing doodles; preserve negative space.
- Keep changing labels, counts, dates, and Scripture live.
- Resolve text/control contrast, especially white-on-orange and orange-on-paper.

## 18. Presentation architecture

Retain these layers:

**Design foundations → presentation primitives → shared compositions → feature views → feature controllers → existing application state/behavior.**

This describes the presentation-to-behavior boundary, not permission for low-level primitives to import controllers. Reusable foundations/primitives remain independent of product state. Controllers adapt existing state/commands into data and callbacks for views.

- Foundations: color roles, typography, spacing, material, depth, motion.
- Primitives: role text, sky field, paper surfaces, icons/buttons, annotation, illustration stage.
- Compositions: headers, metadata strips, collection rows, quote notes, statistics, action regions.
- Feature views: composed screens rendering provided data and transient local interaction state.
- Controllers: existing behavior integration and commands, separate from visual material/layout.
- State/behavior: preserved stores, persistence, rules, services, and native integrations.

A devotional card receives devotional content, completion, progress, and callbacks. It does not calculate streak eligibility, persist completion, manage subscriptions, or determine Screen Time behavior. Keep routing semantics separate from their visual chrome. Do not replace state/persistence technology merely for this redesign.

## 19. Priorities and approval gates

### P0 — before affected production UI

Resolve navigation contradictions, contradictory sample data, badge eligibility conflicts, feature/reference ambiguity, inaccessible color combinations, and final font approval where typography depends on it. These block the affected screen or component, not unrelated documentation/foundation work.

### P1 — during first production screens/shared components

Calibrate final atmosphere, handwriting hierarchy, card geometry, shadows, paper, CTA sizing, functional icon language, and decoration density against references and devices.

### P2 — incremental; not a global initial-implementation blocker

Complete dark appearance, every settings/utility/editor/error state, complete onboarding refinement, and all secondary edge states. Comprehensive coverage may follow the core system. This does not authorize removing existing states or shipping an affected action with unintelligible errors, inaccessible controls, broken dark-mode behavior, or broken text scaling.

### Accessibility and validation for affected surfaces

Verify text/non-text contrast, text scaling and existing reader preferences, long content, touch targets, screen-reader labels/order/state, decorative-element exclusion from accessibility focus, safe-area/keyboard/navigation/focus-player clearance, and reduced motion. Loading/empty/error/locked/disabled states must communicate without relying on motion or color alone.

Future visual validation compares actual running surfaces against the approved references, including device gradient quality and full interactions. Never declare motion verified from still screenshots. Do not perform implementation or simulator changes as part of this documentation task.

## 20. Mandatory incremental implementation sequence

No full-app visual rewrite. Preserve functionality throughout migration.

1. Shared production design foundations.
2. Shared motion foundations.
3. Shared presentation primitives.
4. Home.
5. Daily devotional experience.
6. Completion/streak experience.
7. Badge unlock and badge presentation.
8. Bible collection.
9. Bible book detail.
10. Bible reader.
11. Profile.
12. Remaining feature and utility screens.
13. Onboarding refinement.
14. Dark appearance and secondary states.

Adjust only for demonstrated architectural dependencies. Do not use migration as a reason to change product rules, persistence, data contracts, or navigation. Begin only after explicit implementation instruction.

## 21. Existing-application reconciliation and unresolved approvals

Source observations from the current working tree, not instructions to change it now:

| Existing implementation | Relationship to this specification |
|---|---|
| `constants/theme.ts` already exports `CLOSER_ACCENT = #FF4326` | Matches canonical brand |
| Same file exports tab tint `#FF3B30` | Visual mismatch with canonical orange active treatment |
| `components/HomeSkyGradient.tsx` uses blue-only linear day stops | Matches sky/paper separation conceptually; exact values remain unapproved |
| Root mounts a global sky behind transparent navigation surfaces | Future family-specific material ownership must be reconciled; not every screen should inherit atmospheric composition |
| System fonts, `ui-serif`, and loaded Shantell Sans | Existing families are candidates, not final approved selections |
| Native tab wrapper and native sheets/controls | Preserve behavior; assess visual flexibility during affected component work |
| Predominantly React Native Animated; some JavaScript gesture callbacks | Motion implementation needs later reconciliation with shared contracts, not immediate rewrite |
| Existing reduced-motion hook | Preserve combined preference; later extend coverage to all specified effects |
| Looping `StreakFireAnimation` lacks a reduced-motion check | Coverage gap for later affected-screen work |
| Milestones use longest-streak threshold comparisons in `lib/milestones.ts` | Preserve eligibility; correct mockup copy instead |
| Hardcoded styles, retained old presentations, and mixed asset treatments | Incremental visual reconciliation, never wholesale deletion |

Unresolved visual approvals: actual font families and final type metrics; sky colors/stops and hero extent by family; paper/ink/shadow calibration; accessible CTA label choice and active-navigation contrast; final functional icon family; companion dark art direction; missing secondary screen/state references. No new fonts, assets, or dependencies are authorized by this document.

The supplied instructions contain one timing tension: general celebration completion within about 1.2 seconds versus sequential badge entrance plus shine lasting up to about 1.55 seconds. Section 16 documents the more specific badge sequence as a limited exception, with no delay to usable controls.

This documentation is the only authorized deliverable in the current task. All application implementation remains unchanged.
