# Apple UI consistency review — September 22, 2026

Scope: shared buttons, navigation headers, reader toolbar, listening and settings sheets, and source spot-checks of verse actions, authentication, focus and avatar sheets. This is a targeted code audit, not an app-wide accessibility certification or complete device test.

## Direction

- Native controls and system materials for navigation and temporary controls; solid reading surfaces and existing Closer artwork for content.
- At least 44 × 44 pt interactive areas; primary app actions retain the existing 52 pt minimum.
- Descriptive accessibility labels, visible press feedback, and explicit disabled/busy states.
- Cancel abandons an edit; Save commits; Close dismisses informational content. Immediate preferences must not imply that dismissal cancels them.
- Respect Dynamic Type, Reduce Motion, and Reduce Transparency. Glass alone is not evidence of accessibility compliance.

## Findings and changes

| Area | Assessment / action |
| --- | --- |
| Primary, secondary, ghost and social buttons | Function-style Pressable feedback was inconsistent with the project's NativeWind behavior. Switched shared implementations to static styles with explicit press state. |
| Loading | Secondary/ghost buttons disabled while loading without showing progress. Added spinner and accessibility busy state; primary buttons now announce busy state too. |
| Primary label sizing | Added shrink/wrapping support to reduce long-label overflow. Largest Dynamic Type sizes still require device verification. |
| Modal close | Existing 36 pt visual had extended hit slop, so it was not necessarily an undersized hit target. Standardized the actual control to 44 pt. |
| Sheet Cancel/Save | Added explicit 44 pt minimum touch areas and reliable press feedback for the non-native shared header. Native wrapper now explicitly requests a minimum 44 pt button frame. |
| Reader | Native segmented controls, picker, four-action toolbar and system sheet material are a good fit. Appearance and text-size now share one panel. |
| Glass | ReaderSheet explicitly observes Reduce Transparency. CardGlass has its own fallback; the toolbar uses the native glass API. Verify all three together under system accessibility settings. |

## Next priorities

1. Verse action controls and note editor: inspect remaining function-style Pressables, confirm highlighting targets and dismissal/save semantics, standardize feedback.
2. Larger-text and VoiceOver device pass: remaining fixed-height native hosts and disabled font scaling are risks, not proof of failure. Check short-screen/large-text combinations, long translations and sheet titles.
3. Test app Light/Dark overrides against device appearance for native sheet material, plus Reduce Transparency and Increase Contrast. The OS controls native material, while React text uses the app theme.
4. Consolidate remaining screen-specific button styles by role after visual verification, preserving artwork and brand CTAs. Avoid blindly converting every content card to glass.

## Apple sources

- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): system controls, interaction states, touch regions.
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials): glass as the controls/navigation layer and adaptation to accessibility settings.
- [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass): standard controls and accessible icon labels.
- [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): temporary focused tasks and clear completion/dismissal actions.

Validation must distinguish type/source checks, simulator visual inspection, and physical-device accessibility/performance testing. The latter remains outstanding.
