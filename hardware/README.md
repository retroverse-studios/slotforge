# Hardware

The practical build is a hybrid: buy the boring pieces, print the interesting
ones.

## Buy

- Straights, standard 45 and 90 degree curves, power terminal, controllers.
- A used Super International set is the cheapest route to a 4-lane parts bin.
- Check every joint. Worn tabs are the main source of dead lanes.

## Print

- Risers and bridge supports for overpasses.
- Banked curve supports if you use stock banked sections.
- Clips and joiners for card or foam track.
- Pit lane entry, lane markers, guard rail ends.
- A measuring jig for slot spacing is worth printing first.

## Card and foam

- Print at 100 percent, stick the template to 1.5 mm greyboard, cut the outside
  and the slot, then fold the rails.
- The slot is the critical dimension. Cut a test piece before a full sheet.
- Tape or wire rails need a smooth transition at every joint.

## Power

- A 4-lane track needs more than one power feed. Add a tap every 15 to 20 ft of
  lane, and one near the far end of the longest straight.
- Do not feed logic electronics from track power. Use a separate 5 V supply and
  opto-isolate any sensor that touches the track.

## Files

- `print/` card templates and fold notes
- `cad/` 3D printable parts, build123d or OpenSCAD
- `electronics/` timing hardware and wiring
