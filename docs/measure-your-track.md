# Measure your track

The piece library is only as good as its dimensions. Before you trust a print
template, measure the pieces you actually own. Ten minutes here saves a wasted
sheet of card and a track that does not close.

## What you need

- A steel ruler in inches, or a caliper.
- One straight from each length you own.
- One curve from each radius you own.
- A flat table.
- A phone camera for the joint close-up.

## Worksheet

Fill this in and keep it next to the library file. Record the part number if it
is moulded on the underside.

| Property | Nominal | Measured | Notes |
|---|---|---|---|
| Section width | 3.000 in | | Outside edge to outside edge |
| Lane spacing, 2-lane | 1.500 in | | Slot centre to slot centre |
| Lane spacing, across a 4-lane joint | 1.5625 in | | Inner lanes of two sections |
| Slot centre to rail | 0.28125 in | | 9/32 in |
| Straight 3 in end to end | 3.000 in | | |
| Straight 6 in end to end | 6.000 in | | |
| Straight 9 in end to end | 9.000 in | | |
| Straight 15 in end to end | 15.000 in | | |
| Curve 6 in outside radius | 6.000 in | | |
| Curve 9 in outside radius | 9.000 in | | |
| Curve 12 in outside radius | 12.000 in | | |
| Curve 15 in outside radius | 15.000 in | | |
| Curve 18 in outside radius | 18.000 in | | |
| Curve sweep | 45 or 90 deg | | Check against a square |
| Joint engagement depth | | | How far the tabs go in |
| Height of rail above plastic | | | |

## How to measure a curve radius

1. Put the curve on a sheet of paper and trace the **outside** edge.
2. Extend the two straight ends with a ruler until they meet at the centre.
3. Measure from that centre to the outside edge. That is the nominal radius in
   the AFX catalogue.
4. The centreline radius is 1.5 inches less.

Do not measure slot to slot for radius. Measure the outside edge, as the
catalogue does.

## How to measure lane spacing

Put the straight on the table. Measure from the centre of one guide slot to the
centre of the other. Do it at three points along the piece and average. If you
get 1 3/8 inches, you have older Aurora or Model Motoring stock, not current
Tomy AFX. Note it in the library.

For a 4-lane joint, butt two sections together and measure the two inner slots.
The published figure is about 1 9/16 inches, slightly more than the 1.5 inches
inside one section.

## Closure check

Build the layout on the floor before printing anything. Push every joint fully
home. If the ends do not meet, the model is wrong or the parts are worn. Note
the gap and the direction it misses in; that is the most useful bug report.

## What to do with the numbers

- Update `packages/core/src/pieces/afx.ts`.
- Set `verified: true` only for the parts you measured.
- Add a `note` with the part number and any deviation.
- Run `npm test -w @slotforge/core`.
- Add the layout to `content/tracks` if it is worth keeping.
