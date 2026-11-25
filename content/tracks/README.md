# Track library

Every layout is a `.afxtrack.json` file using the `slotforge/track@1` schema from
`packages/core`. The same file drives the 2D editor, the 3D preview, the print
sheet and the race app.

## Naming

`<footprint>-<lanes>-<style>.afxtrack.json`

Examples:

- `door-4lane-oval.afxtrack.json`
- `door-4lane-paperclip.afxtrack.json`
- `4x8-2lane-figure8.afxtrack.json`

## Rules

- Every layout must close. `npm run test -w @slotforge/core` checks the geometry
  engine, and the studio shows the residual gap.
- Only use piece ids that exist in `packages/core/src/pieces/afx.ts`.
- Record the table size. A layout without a footprint is not useful to anyone
  else.
- Prefer layouts that fit a 36 x 80 inch door. That is the constrained case and
  the most useful contribution.
- F1-inspired layouts are welcome. Do not use official circuit names, logos or
  branding. Say "inspired by" and note the compression.

## Adding a layout

1. Design it in Studio.
2. Download JSON.
3. Check the closure badge and the BOM.
4. Add the file here with a one-line note in the commit message.
5. If it needs an unusual piece, update the piece library and mark whether the
   dimensions are verified.
