# Roadmap

Each milestone should end with something you can use on a table, not a demo.

## M0: trust the numbers

- [x] Schema, chained geometry, closure, lane lengths, BOM
- [x] AFX library with verified flags
- [x] Tests against published 1/8-turn lane lengths
- [ ] Measure real stock and correct the library
- [ ] Add a printed 1 inch test square to every build sheet

## M1: design a 4-lane door track

- [x] 2D editor, snap by construction
- [x] Table presets, 36 x 80 default
- [x] BOM and closure readout
- [x] 3D orbit and lap cam
- [ ] Insert, reorder and drag pieces
- [ ] Parts inventory: tell it what you own, grey out what you do not
- [ ] Equal-lane-length assistant with crossover suggestions
- [ ] Power tap placement

## M2: build it

- [x] 1:1 tiled print sheet with registration marks
- [x] SVG export
- [ ] Cut and fold tabs, 1.5 mm greyboard notes
- [ ] DXF export for laser-cut base
- [ ] 3D printable risers, clips and banked supports from `hardware/cad`
- [ ] Assembly instructions with photos

## M3: race night

- [x] Heat schedule with lane rotation
- [x] Points and standings
- [ ] Local server + QR join for phones
- [ ] Live leaderboard over SSE
- [ ] IR beam timing (ESP32) with debounce and missed-lap correction
- [ ] Race director controls: restart heat, penalty, manual lap
- [ ] Series across multiple nights

## M4: camera

- [ ] Finish-line virtual beams per lane
- [ ] Overhead homography and car tracking
- [ ] Stream overlay for OBS or a browser
- [ ] Camera as backup timing, never the only source

## M5: library

- [ ] F1-inspired pack, compressed and renamed
- [ ] Small-space pack for 36 x 80 doors
- [ ] Figure-8 and crossover layouts once the crossing geometry is verified
- [ ] Community submissions with a schema check in CI
