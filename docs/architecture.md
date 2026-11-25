# Architecture

## Decisions

| Decision | Reason |
|---|---|
| Web app first, PWA | Runs on macOS, Windows, Linux, iPad and phones. No store, no signing, printing works. |
| SVG for the editor | Crisp at any zoom, easy to export, easy to print at 1:1. |
| three.js for 3D | Same data, no second model, GLB export later. |
| TypeScript everywhere except vision | One schema and one geometry engine shared by every app. |
| Clean-room MIT | No GPL obligations from the existing editor, freedom to reuse commercially. |
| Monorepo | Atomic schema changes across studio, race, fab and vision. |
| No backend in v1 | A home race should work on a laptop on a table with no wifi. |

## Coordinate system

- Units are inches in the model. Millimetres are a display and export concern.
- `x` is right, `y` is up. Angles are radians, counter-clockwise from +x.
- Heading 0 means travelling along +x.
- A left turn is `direction = +1`, a right turn is `-1`.
- Lane offsets are positive to the left of travel. Lane 0 is the leftmost lane.
- SVG and print output flip `y` because screens and paper are top-down.

## Piece chaining

`buildTrack()` starts at pose `(0, 0, 0)` and walks the placement list.

- A straight advances by its length.
- A curve turns around a centreline radius of `nominal radius - 1.5 in`.
- The next piece's entry pose is the previous piece's exit pose.

This makes the track connected by construction. It does not make it closed.
Closure is `distance(end, start) <= 0.125 in` with a heading error under 0.5
degrees. The editor shows the gap as a red line rather than hiding it.

## Lane length

For a curve with centreline radius `r`, direction `d` and sweep `a`, a lane at
offset `o` has radius `r - d * o` and length `(r - d * o) * a`.

Straights add the same length to every lane. The difference between the longest
and shortest lane is `laneDelta`. A 4-lane layout with 9 inch curves has a large
delta; that is real, and the fix is a crossover or a handicap, not a fudged
number.

## Banking

Stock AFX banked curves are 9 and 12 inch radius with supports. The piece carries
a `bank` angle in degrees. The 2D view ignores it. The 3D view tilts the surface
around the centreline, raising the outer edge. Lane lengths are unchanged,
because the slot path length is the same.

## Printing

The print pipeline normalises the layout to positive coordinates, tiles it into
sheet-sized viewBoxes, and draws polygons in inches. One SVG unit is one inch.
Registration marks are drawn on every sheet. The first sheet contains the BOM,
assembly order and checks.

Browser printing is the weakest link: "fit to page" silently scales the output.
The sheet says 100% and includes no ruler substitute yet. A printed 1 inch test
square is the next addition.

## Timing events

The race app should not care whether a lap came from an IR beam, a camera or a
person pressing a button. One event shape:

```json
{
  "type": "lap",
  "lane": 2,
  "carId": "car-7",
  "at": "2026-11-25T09:14:03.182Z",
  "source": "ir",
  "confidence": 0.98
}
```

Sources: `ir`, `camera`, `manual`. The race app owns race state, penalties,
points and the leaderboard. The vision service is a sensor, not an authority.
That keeps a camera failure from stopping a race.

## CI

One workflow, path-filtered. A `changes` job runs `dorny/paths-filter` and the
core, studio, race and vision jobs check its outputs.

| Changed paths | Jobs that run |
|---|---|
| `packages/core`, `content` | core |
| `apps/studio`, `packages/core` | studio |
| `apps/race` | race |
| `services/vision` | vision |
| root `package.json`, lockfile, `tsconfig.base.json` | core, studio, race |
| `.github/workflows/ci.yml` | all |

A final `ci` job aggregates the results. Require that one check in branch
protection instead of chasing four job names. Skipped jobs do not fail the
aggregate.

Deploy is a separate workflow, filtered to Studio and core paths. The Python job
installs `.[dev]` when `services/vision/pyproject.toml` appears, runs ruff and
pytest if configured, and falls back to `compileall` until then.

## Next architectural steps

- Move the print and SVG renderer from `apps/studio` into `packages/fab` so the
  CLI and the editor share one implementation.
- Split the 3D view into a lazy chunk. The three.js bundle is about 1 MB.
- Add a `packages/timing` contract package shared by race and vision.
- Add a small local server for race night: SQLite, SSE, QR join.
