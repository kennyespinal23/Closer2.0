# UI spacing audit — September 30, 2026

## Scope
Source review of tab layouts, shared sheet headers, settings scaffolding, onboarding chrome, daily activities, reader sheets, avatar selection, study-group creation, notes/highlights, achievements and Express reading. This is a representative spacing pass, not certification of all 85 route/layout files or every UI state.

## Fixed
- Profile, Library and Community now share measured native-tab bottom clearance, including the active focus player. Profile previously used a fixed 83pt allowance; Library and Community did not include the player.
- Shared sheet headers and reader settings now leave 32pt above their header row, consistent with the approved chapter picker.
- Avatar grid measures the actual sheet content width, uses a pinned header and a bounded scrollable sheet.
- Avatar initials action and onboarding back button use resolved styles so their dimensions are not dependent on press-style callback handling. Onboarding back target is 44pt.
- Study-group form uses consistent 24pt horizontal alignment for its header, content and primary action. Two-column cards divide the available width after the gap rather than combining 48% widths with a fixed gap.

## Reviewed without a spacing change
- Daily activity content and fixed bottom action use separate scroll content and safe-area bottom padding.
- Notes/highlights use bottom SafeAreaView and scroll padding.
- Express reading separates the scrolling text from its safe-area action footer.
- SettingsScaffold reserves its transparent native header once; section gutters align.
- Achievement screen has bottom safe-area containment.
- Home already reserves focus-player space; its intentional hero/card spacing was preserved.

## Verification
- TypeScript check and git diff whitespace check passed.
- Tab-clearance assertions passed for measured full height, content-only height, fallback, no bottom safe area and active focus player.
- Simulator screenshots inspected on iPhone 17 Pro Max: Profile, Library, Community, Appearance settings, study-group initial form, avatar sheet and Home.
- Temporary preview route used for modal inspection was removed.

## Remaining validation
- Small-phone and iPad widths, landscape, and accessibility text sizes.
- Keyboard-open forms and sheets, long names/localized labels, and last-item scrolling with an active focus session.
- All onboarding branches and modal transitions have not been exhaustively exercised.
- Other Pressable style callbacks exist. Do not mechanically rewrite them: inspect affected controls before changing layout.
