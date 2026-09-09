# Flaticon hand-drawn icons (free + attribution)

Closer uses SF Symbols today. Drop **free** Flaticon hand-drawn icons
here to gradually replace them. Free use requires **attribution** —
the in-app Credits screen (`Settings → Help → Icon credits`) lists
every registered icon author automatically.

## How to add an icon

1. Search Flaticon for a consistent **hand-drawn / doodle** style:
   https://www.flaticon.com/search?word=hand%20drawn
2. Prefer **monochrome black** outline SVGs or PNGs (512px) so we can
   tint them with the app ink color.
3. Download under the **Free** license (not Premium).
4. Rename the file to match the registry key in
   `lib/flaticonIcons.ts` (e.g. `house.png`, `book.png`).
5. Put the file in **this folder**.
6. In `lib/flaticonIcons.ts`:
   - set `ready: true`
   - fill `credit.author`, `credit.title`, and `credit.flaticonUrl`
     from the download page (Flaticon’s attribution modal).
7. Reload the app — `AppIcon` / mapped SF Symbol names pick it up.

## Priority icons (tabs + chrome)

| File key   | Maps from SF Symbols              | Suggested search        |
| ---------- | --------------------------------- | ----------------------- |
| `house`    | `house`, `house.fill`             | home hand drawn         |
| `book`     | `book`, `book.fill`, `book.closed`| book hand drawn         |
| `shield`   | `shield`, `shield.fill`           | shield hand drawn       |
| `person`   | `person`, `person.circle`         | user hand drawn         |
| `gear`     | `gearshape`                       | settings hand drawn     |
| `bell`     | `bell`                            | bell hand drawn         |
| `flame`    | `flame`, `flame.fill`             | fire hand drawn         |
| `heart`    | `heart`, `heart.fill`             | heart hand drawn        |
| `envelope` | `envelope`                        | envelope hand drawn     |
| `back`     | `chevron.left`                    | left arrow hand drawn   |
| `forward`  | `chevron.right`                   | right arrow hand drawn  |
| `close`    | `xmark`                           | close hand drawn        |
| `plus`     | `plus`                            | plus hand drawn         |
| `check`    | `checkmark`                       | check hand drawn        |

Stay in one author’s pack when you can — mixed doodle styles look
noisy next to each other.

## Attribution (required for free)

Flaticon’s free license expects credit. We show it in-app as:

> Icons by {Author} from Flaticon

Do **not** remove the Credits screen while any free Flaticon asset
is shipping. If you later buy Premium for a set, you can clear that
icon’s credit entry after confirming the Premium terms.
