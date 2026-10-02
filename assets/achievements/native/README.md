# Native achievement artwork

24 transparent 930 × 930 PNGs exported from the approved `illustrated-v5` SVGs. Rasterization preserves the enamel gradients and relief filters consistently on iOS and Android and avoids drawing those filters during scrolling.

`lib/achievementArtwork.ts` holds static asset references, light/dark backgrounds and the matching silhouette used for the native animated sheen. `components/EnamelAchievement.tsx` renders these assets in shelves, reveals, and onboarding. Locked badges remain dimmed with a lock indicator.

Regenerate with `node scripts/export-achievement-art.cjs` in an environment with Sharp available (the bundled workspace runtime provides it). SVG artwork remains editable in `illustrated-v5`. Static preview sheen is omitted from exports; the reveal animates a separately clipped sheen on the UI thread.

Legacy daily milestone checkpoints use existing streak-tier artwork; this does not add 90 unique designs or change unlock conditions. The animated streak fire is unchanged.
