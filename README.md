# SlotForge

Design, validate, print and race HO slot car tracks. Built around the AFX / Tomy
track system, with a cross-platform web UI that also installs as a PWA.

This is a monorepo with one shared geometry engine, so a track file means the
same thing in the editor, the build sheet and the race app.

A RetroVerse Studios project: https://retroverse.studio

- Landing: https://michael-borck.github.io/slotforge/
- Designer: https://michael-borck.github.io/slotforge/studio/
- Race: https://michael-borck.github.io/slotforge/race/

## Status

| Area | State | What works |
|---|---|---|
| `apps/site` | working | Landing page, OG image, live links, RetroVerse branding |
| `packages/core` | working | Schema, AFX piece library, chained geometry, closure, lane lengths, BOM, table fit, tests |
| `apps/studio` | working | 2D snap-by-construction editor, 3D preview with orbit and lap cam, 1:1 tiled print sheets, SVG/JSON export, PWA |
| `apps/race` | working MVP | Heat schedule with lane rotation, points, standings, local save. Manual results; no timing hardware yet |
| `apps/fab` | scaffold | Scope and export plan. 1:1 printing currently lives in Studio |
| `services/vision` | scaffold | Camera timing and overhead tracking design, event contract |
| `content/tracks` | seed | Schema notes and a starter door oval |

## Quick start

```bash
npm install
npm run dev          # Studio at http://localhost:5173
npm run dev:race     # Race at http://localhost:5174
npm run dev:site     # Landing at http://localhost:5175
npm test             # geometry, closure, BOM and race schedule tests
npm run build        # production builds for every app
```

Node 20 or newer. No database, no account, no cloud.

## Why a monorepo

The hard part is not drawing curves. It is keeping one definition of the track
consistent across five jobs:

- the editor needs geometry and closure;
- the printer needs the same polygons at 1:1;
- the 3D view needs the same path with banking;
- the race app needs lane lengths and lane identity;
- a camera service needs the finish line and lane order.

Five repos would mean five copies of the schema and a version bump for every
change. One repo keeps it honest.

## Layout

```
slotforge/
  apps/
    site/            landing page, static Vite
    studio/          React + Vite + SVG + three.js
    race/            React + Vite, schedule and points engine
    fab/             print/CNC export service (scaffold)
  services/
    vision/          Python + OpenCV timing service (scaffold)
  packages/
    core/            schema, geometry, AFX pieces, buildTrack()
  content/tracks/    .afxtrack.json layouts
  hardware/
    print/           card templates and fold notes
    cad/             3D printable risers, clips, banked supports
    electronics/     IR beam and timing hardware notes
  docs/              architecture, measurement worksheet, roadmap
```

## Deployment

GitHub Pages serves one artifact with three entry points:

| Path | What |
|---|---|
| `/` | landing page |
| `/studio/` | the designer PWA |
| `/race/` | the race app |

The deploy workflow builds all three and assembles them. The old `/slotforge/`
designer URL now serves the landing; the designer moved to `/studio/`.

Do not buy a new domain. The studio pattern is a product subdomain, so the target
is `https://slotforge.retroverse.studio`. DNS, the Pages custom domain, repo
transfer and the RetroVerse Tools card are documented in
[docs/retroverse.md](docs/retroverse.md).

## The track file

```json
{
  "schema": "slotforge/track@1",
  "name": "Door oval",
  "units": "in",
  "laneCount": 4,
  "laneOffsets": [2.25, 0.75, -0.75, -2.25],
  "table": { "width": 36, "height": 80 },
  "pieces": [
    { "id": "s1", "pieceId": "s6" },
    { "id": "c1", "pieceId": "c9-45L" }
  ]
}
```

Pieces are placed in order. Each piece starts where the previous one ended.
That guarantees a connected track by construction. Closure is a measurement of
the last exit pose against the start, not a promise.

Lane 0 is the leftmost lane when facing the direction of travel. Positive lane
offsets are to the left.

## AFX geometry used here

- One two-lane section is 3 inches wide.
- Lane centres are 1.5 inches apart inside a section. A 4-lane track is two
  sections side by side, about 6 inches wide.
- Curve radius is the **outside** radius. The centreline radius is 1.5 inches
  smaller.
- Curves come in 6, 9, 12, 15 and 18 inch nominal radius, in 45 and sometimes
  90 degree sweeps.
- Banked 9 and 12 inch curves exist as stock parts, with supports.
- Everything in the library is marked `verified` or not. Measure your own stock
  before cutting or ordering. See [docs/measure-your-track.md](docs/measure-your-track.md).

The lane spacing constant is 1.5 inches because the published 1/8-turn lane
lengths imply lane centres at ±0.75 inches. Some older Aurora and Model Motoring
sections measure 1 3/8 inches. The measurement worksheet resolves this for your
stock.

## Prior art

None of these combine design, 3D, fabrication, race control and camera in one
open system. They are worth reading before extending SlotForge.

- [rileymayr/slot-car-track-builder](https://github.com/rileymayr/slot-car-track-builder) GPL-3, React, Aurora/AFX editor
- [ramongilmoreno/slotdesign](https://github.com/ramongilmoreno/slotdesign) TypeScript, no licence
- [Slot Car Planner](https://slot-car-planner.vercel.app/) closed, browser, AFX and Tyco
- [Race Track Lab and Track Planner](https://slotracer.online/) closed, browser
- [HO Slot Car Racing layouts](https://www.hoslotcarracing.com/Layouts.html) tested 36x80 and 4x8 layouts
- [RazManager](https://github.com/RazManager/RazManager) MIT race management
- [ajboni/slot-car-race-manager](https://github.com/ajboni/slot-car-race-manager) MIT
- [micbay/RaceTimerAndController](https://github.com/micbay/RaceTimerAndController) Arduino lap counter

SlotForge is a clean-room MIT implementation. It does not copy code from the
GPL project.

## Roadmap

1. Measure and verify the piece library against real stock.
2. Drag-to-insert and reorder pieces, plus a parts inventory mode.
3. Equal-lane-length assistant using crossover placement.
4. Closed-loop test rig and IR beam timing into the race app.
5. Camera service: finish-line events and an overhead stream overlay.
6. 3D printable risers, banked supports and clips generated from the layout.

## Licence and trademark

MIT. See [LICENSE](LICENSE).

AFX and TOMY are trademarks of their owners. This project is independent and
not affiliated with or endorsed by TOMY. "AFX-compatible" describes track
geometry only.
