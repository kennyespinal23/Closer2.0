# Local Bible bundles

Bible text that ships *inside* the app — bundled as JSON, loaded at
runtime by `lib/localBibles.ts`. Used for:

1. **Offline-ready translations** — even ones the public API supports
   (e.g. WEB). Local files load instantly and work without a network.
2. **Translations the public API can't serve** — copyrighted versions
   like NWT, ESV, NIV. You supply the text from your own licensed
   copy; the app never ships copyrighted material itself.

## Folder layout

```
assets/bibles/
  <translation-id>/
    <book-slug>.json
```

* `<translation-id>` must match a `TranslationId` from
  `state/preferences.tsx` (e.g. `web`, `kjv`, `nwt`).
* `<book-slug>` must match a `Book.id` from `constants/books.ts`
  (e.g. `john`, `genesis`, `1-corinthians`).

## File format

```json
{
  "bookId": "john",
  "translation": "web",
  "translationName": "World English Bible",
  "chapters": [
    {
      "chapter": 1,
      "verses": [
        { "number": 1, "text": "In the beginning was the Word…" },
        { "number": 2, "text": "The same was in the beginning with God." }
      ]
    }
  ]
}
```

* `chapters` must cover every chapter of the book (1-indexed). Missing
  chapters surface as "chapter not bundled" errors in the reader.
* Verse `number` is 1-indexed within its chapter.
* Verse `text` keeps any `\n` line breaks (used by Psalms-style poetry).

## Adding a public-domain translation

`scripts/fetchBibleBook.mjs` pulls from bible-api.com and writes the
file for you:

```bash
node scripts/fetchBibleBook.mjs john web
node scripts/fetchBibleBook.mjs psalms kjv
```

Then add an entry to `REGISTRY` in `lib/localBibles.ts`:

```ts
web: {
  john: () => require("../assets/bibles/web/john.json") as LocalBookFile,
  psalms: () => require("../assets/bibles/web/psalms.json") as LocalBookFile,
},
```

(Metro requires literal `require()` paths — dynamic strings won't work.)

## Adding a copyrighted translation (NWT, ESV, NIV, …)

1. Source the text from your licensed copy. Closer does **not** ship
   copyrighted translations.
2. Convert to the JSON shape above. The exact tooling depends on the
   format you have — plain-text exports, EPUB extraction, etc.
3. Drop the file at `assets/bibles/<translation-id>/<book-slug>.json`.
4. Add the `require()` entry to `REGISTRY` in `lib/localBibles.ts`.
5. Rebuild the app. Metro bundles the JSON at build time.

The reader presents a guided "needs install" empty state for any
chapter of a local-only translation that isn't bundled yet, so the
app stays usable while you're building out coverage one book at a
time.

## Currently bundled

| Translation | Books | License |
| --- | --- | --- |
| `web` (World English Bible) | John | Public domain |
| `nwt` (New World Translation) | _none_ | User-supplied (copyrighted) |
