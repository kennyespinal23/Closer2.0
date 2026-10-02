# Closer achievement artwork

Review-only collection: 24 editable SVG badges, one per existing achievement. These are not wired into the native app yet. Existing unlock rules and streak fire are unchanged.

- `preview.html`: self-contained interactive collection preview; open in a browser.
- `*.svg`: editable vector assets, named by existing achievement ID.
- `manifest.json`: asset paths, family, tier, background colors and proposed reveal styles.
- `source/approved-materials.json`: original approved artwork and material gradients.
- `source/gallery-template.html`: editable preview layout and motion.
- `streak-checkpoint-map.json`: maps the separate 90 streak checkpoints to four visual tiers. This is a family mapping, not 90 custom illustrations.

Rebuild from the project root with `node scripts/generate-achievement-study.cjs`.
The generator contains editable icon paths and family silhouettes. Preview copy is illustrative, not final achievement requirements. Listener is reserved until recordings are available. Reveal-style metadata is a proposal for native integration; the gallery demonstrates a shared spring entrance and recurring sheen. Reduced Motion disables these animations.
